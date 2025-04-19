const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Transaction } = require('../models');
const { Op } = require('sequelize');

// Get user's chess coin balance
const getBalance = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            chess_coins: user.chess_coins,
            currency: 'USD'
        });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create payment intent for chess coin purchase
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'USD' } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata: {
                userId: req.user.id
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user's transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const transactions = await Transaction.findAndCountAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            transactions: transactions.rows,
            total: transactions.count,
            page: parseInt(page),
            totalPages: Math.ceil(transactions.count / limit)
        });
    } catch (error) {
        console.error('Error getting transaction history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle payment webhook from Stripe
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const userId = paymentIntent.metadata.userId;
                const amount = paymentIntent.amount / 100; // Convert from cents
                const chessCoins = Math.floor(amount * 100); // 1 USD = 100 chess coins

                // Update user's chess coins
                await User.increment('chess_coins', {
                    by: chessCoins,
                    where: { id: userId }
                });

                // Create transaction record
                await Transaction.create({
                    user_id: userId,
                    type: 'purchase',
                    amount,
                    currency: paymentIntent.currency,
                    chess_coins: chessCoins,
                    status: 'completed',
                    payment_id: paymentIntent.id
                });

                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                await Transaction.create({
                    user_id: failedPayment.metadata.userId,
                    type: 'purchase',
                    amount: failedPayment.amount / 100,
                    currency: failedPayment.currency,
                    status: 'failed',
                    payment_id: failedPayment.id
                });
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getBalance,
    createPaymentIntent,
    getTransactionHistory,
    handleWebhook
}; 