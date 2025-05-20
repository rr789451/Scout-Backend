const stripe = require('../services/stripe');
const db = require('../services/database');

exports.createSubscription = async (req, res) => {
    try {
        const { amount, propertyId, userId, email, name, propertyName } = req.body;
        let customer;
        
        // Find or create customer
        const existingCustomer = await stripe.customers.list({
            email: email,
            limit: 1
        });
        
        if (existingCustomer.data.length > 0) {
            customer = existingCustomer.data[0];
        } else {
            customer = await stripe.customers.create({
                email: email,
                name: name,
                metadata: {
                    userId: userId
                }
            });
        }
        
        // Create product and price
        const product = await stripe.products.create({
            name: `Rental: ${propertyName}`,
            metadata: { propertyId }
        });
        
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: parseInt(amount) * 100,
            currency: 'usd',
            recurring: { interval: 'month' },
            metadata: { propertyId }
        });
        
        // Create a setup intent instead of a subscription
        const setupIntent = await stripe.setupIntents.create({
            customer: customer.id,
            payment_method_types: ['card'],
            metadata: {
                propertyId,
                userId,
                priceId: price.id
            }
        });
        
        // Return setup intent details
        res.json({
            success: true,
            clientSecret: setupIntent.client_secret,
            customerId: customer.id,
            priceId: price.id,
            setupIntentId: setupIntent.id
        });
        
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set up subscription. Please try again later.'
        });
    }
};

exports.finalizeSubscription = async (req, res) => {
    try {
        const { customerId, priceId, paymentMethodId, propertyId, userId } = req.body;
        
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
        
        // Set as default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        
        // Now create the subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            default_payment_method: paymentMethodId,
            metadata: {
                propertyId,
                userId
            }
        });

        const price = await stripe.prices.retrieve(priceId);
        
        // Return subscription details
        res.json({
            success: true,
            subscriptionId: subscription.id,
            customerId: customerId,
            paymentMethodId: paymentMethodId,
            priceId: priceId,
            amount: price.unit_amount / 100,
            currency: price.currency
        });
        
    } catch (error) {
        console.error('Error finalizing subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to finalize subscription.'
        });
    }
};

exports.confirmSubscription = async (req, res) => {
    try {
        const { propertyId, userId, paymentMethodId, stripeSubscriptionId, stripeCustomerId, stripePriceId, amount, currency } = req.body;

        await db.createSubscription({
            userId,
            propertyId,
            paymentMethodId,
            stripeSubscriptionId,
            stripeCustomerId,
            stripePriceId,
            amount,
            currency,
            status: 'active',
            startDate: new Date(),
            nextBillingDate: getNextBillingDate()
        });

        await db.updatePropertyStatus(propertyId, 'rented', userId);

        res.json({
            success: true,
            message: 'Subscription confirmed successfully'
        });
    } catch (error) {
        console.error('Error confirming subscription:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to confirm subscription.'
        });
    }
};

exports.getSubscriptionStatus = async (req, res) => {
    try {
        const { userId, propertyId } = req.params;

        const subscription = await db.getSubscription(userId, propertyId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        res.json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Error getting subscription status:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to get subscription status'
        });
    }
};

exports.cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId, userId, propertyId } = req.body;

        await db.updateSubscriptionStatus(subscriptionId, 'cancelled');

        await db.updatePropertyStatus(propertyId, 'available', null);

        res.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription'
        });
    }
};

function getNextBillingDate(){
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
}