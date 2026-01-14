import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('customerToken'));
  const [loading, setLoading] = useState(true);

  // Load customer on mount if token exists
  useEffect(() => {
    const loadCustomer = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/customer/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCustomer(response.data);
        } catch (error) {
          console.error('Failed to load customer:', error);
          // Token invalid, clear it
          localStorage.removeItem('customerToken');
          setToken(null);
          setCustomer(null);
        }
      }
      setLoading(false);
    };
    loadCustomer();
  }, [token]);

  const register = async (data) => {
    const response = await axios.post(`${API}/customer/register`, data);
    const { token: newToken, customer: customerData } = response.data;
    localStorage.setItem('customerToken', newToken);
    setToken(newToken);
    setCustomer(customerData);
    return customerData;
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/customer/login`, { email, password });
    const { token: newToken, customer: customerData } = response.data;
    localStorage.setItem('customerToken', newToken);
    setToken(newToken);
    setCustomer(customerData);
    return customerData;
  };

  const logout = () => {
    localStorage.removeItem('customerToken');
    setToken(null);
    setCustomer(null);
  };

  const updateProfile = async (data) => {
    const response = await axios.put(`${API}/customer/me`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCustomer(response.data);
    return response.data;
  };

  const checkEmailExists = async (email) => {
    const response = await axios.get(`${API}/customer/check-email?email=${encodeURIComponent(email)}`);
    return response.data.exists;
  };

  const getOrders = async () => {
    const response = await axios.get(`${API}/customer/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  };

  const saveCart = async (cartItems) => {
    if (!token) return;
    try {
      await axios.put(`${API}/customer/cart`, cartItems, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  };

  const loadSavedCart = async () => {
    if (!token) return null;
    try {
      const response = await axios.get(`${API}/customer/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.cart_items;
    } catch (error) {
      console.error('Failed to load cart:', error);
      return null;
    }
  };

  return (
    <CustomerContext.Provider value={{
      customer,
      token,
      loading,
      isLoggedIn: !!customer,
      register,
      login,
      logout,
      updateProfile,
      checkEmailExists,
      getOrders,
      saveCart,
      loadSavedCart
    }}>
      {children}
    </CustomerContext.Provider>
  );
};
