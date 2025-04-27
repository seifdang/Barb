import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Import apiClient pour utiliser la configuration centralisée
import apiClient from '../api/client';

// Fonction pour obtenir l'URL de l'API
const getApiUrl = () => {
  // Utiliser la baseURL de l'instance apiClient
  const baseUrl = apiClient.defaults.baseURL;
  
  // Si baseURL se termine par /api, l'utiliser directement
  if (baseUrl.endsWith('/api')) {
    return baseUrl;
  }
  
  // Sinon, ajouter /api si nécessaire
  return baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
};

// Obtenir l'URL de l'API
const API_URL = getApiUrl();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // Create a test user if none exists
  const createTestUser = async () => {
    try {
      console.log('Creating test user account...');
      await apiClient.post('/users/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '123-456-7890',
        role: 'customer'
      });
      console.log('Test user created or already exists');
    } catch (error) {
      // If error code is 400 and message contains "already exists", the user already exists
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('Test user already exists');
      } else {
        console.error('Error creating test user:', error.response?.data || error.message);
      }
    }
  };

  // Login
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Attempting login with ${email}`);
      const response = await apiClient.post('/users/login', {
        email,
        password
      });

      const data = response.data;
      console.log('Login response:', JSON.stringify(data));

      if (data.success) {
        // Ensure user object has the token
        const userWithToken = {
          ...data.user,
          token: data.token || data.user.token
        };
        
        console.log('Setting user info with token:', userWithToken.token);
        setUserInfo(userWithToken);
        setUserToken(userWithToken.token);

        // Save user info and token to AsyncStorage
        await AsyncStorage.setItem('userInfo', JSON.stringify(userWithToken));
        await AsyncStorage.setItem('userToken', userWithToken.token);
        
        // Verify data was saved
        const savedUserInfo = await AsyncStorage.getItem('userInfo');
        const savedToken = await AsyncStorage.getItem('userToken');
        console.log('Saved user info:', savedUserInfo ? 'Yes' : 'No');
        console.log('Saved token:', savedToken ? 'Yes' : 'No');
      }

      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setIsLoading(false);
      setError(
        error.response?.data?.message || 'An error occurred during login'
      );
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Register
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Registering user: ${userData.email}`);
      const response = await apiClient.post('/users/register', userData);

      const data = response.data;
      console.log('Register response:', data);

      if (data.success) {
        setUserInfo(data.user);
        setUserToken(data.user.token);

        // Save user info and token to AsyncStorage
        await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
        await AsyncStorage.setItem('userToken', data.user.token);
      }

      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      setIsLoading(false);
      setError(
        error.response?.data?.message || 'An error occurred during registration'
      );
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log('=== LOGOUT STARTED ===');
      setIsLoading(true);
      
      // First clear AsyncStorage completely
      const keys = ['userInfo', 'userToken'];
      console.log('Clearing AsyncStorage keys:', keys);
      
      // Clear AsyncStorage with multiple approaches for redundancy
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
        console.log(`Removed key: ${key}`);
      }
      
      // Double-check the keys are gone
      const checkUserInfo = await AsyncStorage.getItem('userInfo');
      const checkUserToken = await AsyncStorage.getItem('userToken');
      
      console.log('After removal - userInfo exists:', !!checkUserInfo);
      console.log('After removal - userToken exists:', !!checkUserToken);
      
      // Now clear the state
      console.log('Clearing React state...');
      setUserToken(null);
      setUserInfo(null);
      
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('=== LOGOUT COMPLETED ===');
      setIsLoading(false);
      
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
      
      // Even if there's an error, still clear the state as a fallback
      setUserToken(null);
      setUserInfo(null);
      
      return { success: false, message: 'Error during logout, but state was cleared' };
    }
  };

  // Update profile
  const updateProfile = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.put(
        '/users/profile',
        userData
      );

      const data = response.data;

      if (data.success) {
        setUserInfo(data.user);

        // Update user info in AsyncStorage
        await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
      }

      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error.message);
      setIsLoading(false);
      setError(
        error.response?.data?.message || 'An error occurred while updating profile'
      );
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  };

  // Check if user is logged in on app load
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userInfo = await AsyncStorage.getItem('userInfo');
      let userToken = await AsyncStorage.getItem('userToken');
      
      userInfo = JSON.parse(userInfo);
      
      if (userInfo) {
        console.log('User is logged in:', userInfo.name);
        setUserToken(userToken);
        setUserInfo(userInfo);
      } else {
        console.log('No user logged in');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.log('isLogged in error:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
    // Create test account for demo purposes
    createTestUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userInfo,
        error,
        login,
        register,
        logout,
        updateProfile,
        createTestUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 