import axios from 'axios';
import { endpoints } from '../config/api';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 5000 // 5 second timeout
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);
        if (error.code === 'ERR_NETWORK') {
            throw new Error('خطأ في الاتصال بالخادم');
        }
        throw error;
    }
);

export const readFromDb = async () => {
    try {
        const response = await axios.get(endpoints.confirmedOrders);
        return { 'confirmed-orders': response.data };
    } catch (error) {
        console.error('Error reading from db:', error);
        return { 'confirmed-orders': [] };
    }
};

export default api;