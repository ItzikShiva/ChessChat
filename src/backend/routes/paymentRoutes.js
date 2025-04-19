const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Get user's balance
router.get('/balance', authMiddleware, paymentController.getBalance);

// Create a payment intent
router.post('/create-payment-intent', authMiddleware, paymentController.createPaymentIntent);

// Get transaction history
router.get('/transactions', authMiddleware, paymentController.getTransactionHistory);

// Webhook endpoint for Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router; 