import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import paymentService from '../services/paymentService';

const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [chessCoins, setChessCoins] = useState(0);
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    try {
      const rates = await paymentService.getExchangeRates();
      setExchangeRates(rates);
    } catch (err) {
      setError('Failed to load exchange rates');
    }
  };

  const handleAmountChange = async (e) => {
    const value = e.target.value;
    setAmount(value);
    
    if (value && currency) {
      try {
        const conversion = await paymentService.convertToChessCoins(value, currency);
        setChessCoins(conversion.chessCoins);
      } catch (err) {
        setError('Failed to calculate chess coins');
      }
    }
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    
    if (amount && newCurrency) {
      try {
        const conversion = await paymentService.convertToChessCoins(amount, newCurrency);
        setChessCoins(conversion.chessCoins);
      } catch (err) {
        setError('Failed to calculate chess coins');
      }
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const paymentData = {
        amount: parseFloat(amount),
        currency,
        chessCoins
      };

      const payment = await paymentService.initiatePayment(paymentData);
      
      // In a real application, you would redirect to a payment gateway here
      // For this example, we'll simulate a successful payment
      await paymentService.verifyPayment(payment.id);
      
      setSuccess('Payment successful! Your chess coins have been added to your account.');
      setAmount('');
      setChessCoins(0);
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Buy Chess Coins
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              InputProps={{
                endAdornment: currency
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={currency}
                onChange={handleCurrencyChange}
                label="Currency"
              >
                <MenuItem value="ILS">ILS (₪)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">
                You will receive: {chessCoins} Chess Coins
              </Typography>
              {exchangeRates[currency] && (
                <Typography variant="body2" color="text.secondary">
                  1 Chess Coin = {exchangeRates[currency]} {currency}
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handlePayment}
              disabled={!amount || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Buy Chess Coins'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PaymentForm; 