const { Client, Databases, Query, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const SUBSCRIPTIONS_COLLECTION_ID = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID;
const PROPERTIES_COLLECTION_ID = process.env.APPWRITE_PROPERTIES_COLLECTION_ID;
const PAYMENTS_COLLECTION_ID = process.env.APPWRITE_PAYMENTS_COLLECTION_ID;

exports.createSubscription = async (subscriptionData) => {
    try {
        return await databases.createDocument(
            DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            ID.unique(),
            subscriptionData
        );
    } catch (error) {
        console.error('Error creating subscription in database:', error);
        throw new Error('Database error when creating subscription');
    }
};

exports.createOrUpdateSubscription = async (subscriptionData) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal('stripeSubscriptionId', subscriptionData.stripeSubscriptionId)
        ]
      );
      
      if (response.documents.length > 0) {
        const existingDoc = response.documents[0];
        return await databases.updateDocument(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          existingDoc.$id,
          subscriptionData
        );
      } else {
        return await databases.createDocument(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          unique(),
          subscriptionData
        );
      }
    } catch (error) {
      console.error('Error creating/updating subscription in database:', error);
      throw new Error('Database error when working with subscription');
    }
};

exports.getSubscription = async (userId, propertyId) => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            [
                Query.equal('userId', userId),
                Query.equal('propertyId', propertyId)
            ]
        );

        return response.documents[0] || null;
    } catch (error) {
        console.error('Error fetching subscription from database:', error);
        throw new Error('Database error when fetching subscription');
    }
};

exports.updateSubscriptionStatus = async (stripeSubscriptionId, status) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal('stripeSubscriptionId', stripeSubscriptionId)
        ]
      );
      
      if (response.documents.length > 0) {
        const subscriptionDoc = response.documents[0];
        return await databases.updateDocument(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          subscriptionDoc.$id,
          { status }
        );
      }
    } catch (error) {
      console.error('Error updating subscription status in database:', error);
      throw new Error('Database error when updating subscription status');
    }
  };

exports.updatePropertyStatus = async (propertyId, status, rentedBy = null) => {
    try {
        const updateData = { status };

        if(rentedBy !== null) {
            updateData.rentedBy = rentedBy;
        }

        return await databases.updateDocument(
            DATABASE_ID,
            PROPERTIES_COLLECTION_ID,
            propertyId,
            updateData
        );
    } catch (error) {
        console.error('Error updating property status in database:', error);
        throw new Error('Database error when updating property status');
    }
};

exports.updatePaymentStatus = async (paymentIntentId, status) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        [
          Query.equal('paymentIntentId', paymentIntentId)
        ]
      );
      
      if (response.documents.length > 0) {
        const paymentDoc = response.documents[0];
        return await databases.updateDocument(
          DATABASE_ID,
          PAYMENTS_COLLECTION_ID,
          paymentDoc.$id,
          { status }
        );
      } else {
        return await databases.createDocument(
          DATABASE_ID,
          PAYMENTS_COLLECTION_ID,
          unique(),
          { 
            paymentIntentId,
            status,
            createdAt: new Date()
          }
        );
      }
    } catch (error) {
      console.error('Error updating payment status in database:', error);
      throw new Error('Database error when updating payment status');
    }
};

exports.recordSubscriptionPayment = async (stripeSubscriptionId, invoiceId, amount) => {
    try {
        const subscriptionResponse = await databases.listDocuments(
            DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            [
                Query.equal('stripeSubscriptionId', stripeSubscriptionId)
            ]
        );
        
        if (subscriptionResponse.documents.length === 0) {
            console.log(`Subscription ${stripeSubscriptionId} not found in database`);
            return;
        }
        
        const subscription = subscriptionResponse.documents[0];
        
        return await databases.createDocument(
            DATABASE_ID,
            PAYMENTS_COLLECTION_ID,
            unique(),
            {
                subscriptionId: subscription.$id,
                invoiceId,
                amount,
                status: 'succeeded',
                paymentDate: new Date()
            }
        );
    } catch (error) {
        console.error('Error recording subscription payment in database:', error);
        throw new Error('Database error when recording subscription payment');
    }
};

exports.recordFailedPayment = async (invoiceId) => {
    try {
        return await databases.createDocument(
            DATABASE_ID,
            PAYMENTS_COLLECTION_ID,
            unique(),
            {
                invoiceId,
                status: 'failed',
                paymentDate: new Date()
            }
        );
    } catch (error) {
        console.error('Error recording failed payment in database:', error);
        throw new Error('Database error when recording failed payment');
    }
};