const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/stripe-webhook',
    express.raw({type: 'application/json'}),
    webhookController.handleStripeWebhook
);

module.exports = router;