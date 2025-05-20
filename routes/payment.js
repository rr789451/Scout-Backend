const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-subscription', paymentController.createSubscription);

router.post('/confirm-subscription', paymentController.confirmSubscription);

router.post('/finalize-subscription', paymentController.finalizeSubscription);

router.post('/subscription/:userId/:propertyId', paymentController.getSubscriptionStatus);

router.get('/cancel-subscription', paymentController.cancelSubscription);

module.exports = router;