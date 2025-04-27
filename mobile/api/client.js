import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

// API base URL configuration
// Utiliser la configuration centralisée
const BASE_URLS = Array.isArray(config.API_URL) 
  ? config.API_URL 
  : [config.API_URL, ...(config.API_URL_ALTERNATIVES || [])];

// Default to first URL initially
const BASE_URL = BASE_URLS[0];

// Create axios instance with timeout and retry configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.TIMEOUT || 10000, // Utiliser le timeout de la configuration
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Handle only 5xx errors as errors
  },
});

// Retry configuration
const MAX_RETRIES = config.MAX_RETRIES || 3;
const RETRY_DELAY = 1000; // 1 second

// Modified retry logic to try different base URLs
const retryRequest = async (error) => {
  const config = error.config;
  config.retryCount = config.retryCount || 0;
  
  if (config.retryCount >= MAX_RETRIES * BASE_URLS.length) {
    return Promise.reject(error);
  }
  
  // Try different base URLs if connection fails
  if (error.code === 'ECONNABORTED' || !error.response) {
    const urlIndex = Math.floor(config.retryCount / MAX_RETRIES) % BASE_URLS.length;
    config.baseURL = BASE_URLS[urlIndex];
    console.log(`Trying different base URL: ${config.baseURL}`);
  }
  
  config.retryCount += 1;
  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (config.retryCount % MAX_RETRIES + 1)));
  return apiClient(config);
};

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // First try to get token from AsyncStorage
      let token = await AsyncStorage.getItem('userToken');
      
      // If token doesn't exist in AsyncStorage, try to get userInfo
      if (!token) {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          token = userInfo.token;
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Adding auth token to request: ${token.substring(0, 15)}...`);
      } else {
        console.log('No auth token available for request');
      }
      
      console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Network errors or timeout - attempt retry
    if (!error.response || error.code === 'ECONNABORTED') {
      console.log(`Retrying request (${error.config?.retryCount || 0 + 1}/${MAX_RETRIES})`);
      return retryRequest(error);
    }

    if (error.response?.status === 401) {
      // Handle unauthorized errors (token expired, etc.)
      console.log('Unauthorized - clearing token');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    }
    return Promise.reject(error);
  }
);

// Services API
export const servicesApi = {
  getServices: () => apiClient.get('/services'),
  getService: (id) => apiClient.get(`/services/${id}`),
};

// Appointments API
export const appointmentsApi = {
  getUserAppointments: () => apiClient.get('/appointments'),
  getAppointment: (id) => apiClient.get(`/appointments/${id}`),
  createAppointment: (data) => apiClient.post('/appointments', data),
  updateAppointment: (id, data) => apiClient.put(`/appointments/${id}`, data),
  cancelAppointment: (id, data = {}) => {
    console.log(`Making DELETE request to /appointments/${id} with data:`, data);
    return apiClient.delete(`/appointments/${id}`, { data });
  },
  deleteAppointment: (id) => {
    console.log(`Deleting appointment permanently: /appointments/${id}/delete`);
    return apiClient.delete(`/appointments/${id}/delete`);
  },
  completeAppointment: (id) => apiClient.put(`/appointments/${id}/complete`),
  getBarberAvailability: (barberId, date, salonId) => {
    const encodedDate = encodeURIComponent(date);
    const encodedSalonId = encodeURIComponent(salonId);
    return apiClient.get(`/appointments/availability/${barberId}?date=${encodedDate}&salonId=${encodedSalonId}`);
  },
};

// Barbers API
export const barbersApi = {
  // Get all barbers
  getBarbers: () => apiClient.get('/users/barbers'),
};

export default apiClient;

 