import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const endpoints = {
  products: `${BASE_URL}/products`,
  categories: `${BASE_URL}/categories`,
  settings: `${BASE_URL}/settings`,
  settingsHistory: `${BASE_URL}/settings-history`,
  productsHistory: `${BASE_URL}/products-history`,
  billsHistory: `${BASE_URL}/bills-history`,
  confirmedOrders: `${BASE_URL}/confirmed-orders`,
  refundOrder: (orderNumber) => `${BASE_URL}/refund-order/${orderNumber}`,
  login: `${BASE_URL}/login`,
  register: `${BASE_URL}/register`
};

export const fetchConfirmedOrders = async () => {
    try {
        const response = await axios.get(endpoints.confirmedOrders);
        return response.data;
    } catch (error) {
        console.error('Error fetching confirmed orders:', error);
        throw error;
    }
};
