const stripe = require('../services/stripe');
const db = require('../services/database');

exports.handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
              
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    res.json({ received: true, error: true });
  }
};

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const { propertyId, userId } = paymentIntent.metadata;
    
    if (!propertyId || !userId) {
      console.log('Missing metadata in payment intent');
      return;
    }
    
    await db.updatePaymentStatus(paymentIntent.id, 'succeeded');
    
    if (!paymentIntent.metadata.subscription) {
      await db.updatePropertyStatus(propertyId, 'rented', userId);
    }
        
  } catch (error) {
    console.error('Error handling payment success webhook:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    await db.updatePaymentStatus(paymentIntent.id, 'failed');    
  } catch (error) {
    console.error('Error handling payment failure webhook:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    const customerId = subscription.customer;
    
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.userId;
    
    if (!userId) {
      console.log('Missing userId in customer metadata');
      return;
    }
    
    await db.createOrUpdateSubscription({
      stripeSubscriptionId: subscription.id,
      userId: userId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
    
  } catch (error) {
    console.error('Error handling subscription created webhook:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    await db.createOrUpdateSubscription({
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
    
  } catch (error) {
    console.error('Error handling subscription updated webhook:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    await db.updateSubscriptionStatus(subscription.id, 'cancelled');
  } catch (error) {
    console.error('Error handling subscription cancelled webhook:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    if (invoice.subscription) {
      await db.recordSubscriptionPayment(invoice.subscription, invoice.id, invoice.amount_paid);
    }    
  } catch (error) {
    console.error('Error handling invoice payment succeeded webhook:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    await db.recordFailedPayment(invoice.id);    
  } catch (error) {
    console.error('Error handling invoice payment failed webhook:', error);
    throw error;
  }
}