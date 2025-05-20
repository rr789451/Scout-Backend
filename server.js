require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const paymentRoutes = require('./routes/payment');
const webhookRoutes = require('./routes/webhook');

const app = express();

app.use(cors({
    origin: '*'
}));

app.use((req, res, next) => {
    if(req.originalUrl === '/api/stripe-webhook') {
        next();
    } else {
        bodyParser.json()(req, res, next);
    }
});

app.use('/api', paymentRoutes);
app.use('/api', webhookRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: 'An error occured while processing your request.'
    });
});

const PORT = process.env.PORT; 

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});