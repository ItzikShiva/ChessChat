import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const paymentService = {
  // Get user balance
  getBalance: async () => {
    const response = await axios.get(`${API_URL}/user/balance`);
    return response.data;
  },

  // Initiate a payment
  initiatePayment: async (paymentData) => {
    const response = await axios.post(`${API_URL}/payment/initiate`, paymentData);
    return response.data;
  },

  // Verify a payment
  verifyPayment: async (paymentId) => {
    const response = await axios.post(`${API_URL}/payment/verify`, { paymentId });
    return response.data;
  },

  // Get exchange rates
  getExchangeRates: async () => {
    const response = await axios.get(`${API_URL}/payment/rates`);
    return response.data;
  },

  // Convert currency to chess coins
  convertToChessCoins: async (amount, currency) => {
    const response = await axios.post(`${API_URL}/payment/convert`, { amount, currency });
    return response.data;
  },

  // Get transaction history
  getTransactionHistory: async () => {
    const response = await axios.get(`${API_URL}/payment/history`);
    return response.data;
  }
};

export default paymentService; 