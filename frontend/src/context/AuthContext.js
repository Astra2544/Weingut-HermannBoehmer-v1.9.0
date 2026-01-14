import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'admin' or 'customer'
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [logoutName, setLogoutName] = useState('');

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('authToken');
      const savedUserType = localStorage.getItem('authUserType');
      
      if (savedToken && savedUserType) {
        try {
          if (savedUserType === 'admin') {
            const response = await axios.get(`${API}/admin/me`, {
              headers: { Authorization: `Bearer ${savedToken}` }
            });
            setUser({ ...response.data, first_name: 'Admin', last_name: '' });
            setUserType('admin');
            setToken(savedToken);
          } else {
            const response = await axios.get(`${API}/customer/me`, {
              headers: { Authorization: `Bearer ${savedToken}` }
            });
            setUser(response.data);
            setUserType('customer');
            setToken(savedToken);
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          clearAuth();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserType');
    // Also clear legacy tokens
    localStorage.removeItem('customerToken');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    setToken(null);
    setUser(null);
    setUserType(null);
  };

  const login = async (email, password, language = 'de') => {
    const response = await axios.post(`${API}/auth/login`, { email, password, language });
    const { token: newToken, user_type, user: userData } = response.data;
    
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUserType', user_type);
    
    // Also set legacy tokens for backward compatibility
    if (user_type === 'admin') {
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_email', userData.email);
    } else {
      localStorage.setItem('customerToken', newToken);
    }
    
    setToken(newToken);
    setUserType(user_type);
    setUser(userData);
    
    // Trigger welcome animation - different message for admin
    setWelcomeName(user_type === 'admin' ? 'Admin' : (userData.first_name || 'User'));
    setShowWelcome(true);
    
    return { user_type, user: userData };
  };

  const register = async (data) => {
    const response = await axios.post(`${API}/customer/register`, data);
    const { token: newToken, customer: customerData } = response.data;
    
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUserType', 'customer');
    localStorage.setItem('customerToken', newToken);
    
    setToken(newToken);
    setUserType('customer');
    setUser(customerData);
    
    // Trigger welcome animation
    setWelcomeName(customerData.first_name || 'User');
    setShowWelcome(true);
    
    return customerData;
  };

  const logout = useCallback(() => {
    // Get user name before clearing
    const userName = user?.first_name || user?.email?.split('@')[0] || 'User';
    setLogoutName(userName);
    setShowLogout(true);
    
    // Clear auth after a short delay to show animation
    setTimeout(() => {
      clearAuth();
    }, 100);
  }, [user]);

  const hideLogout = useCallback(() => {
    setShowLogout(false);
  }, []);

  const updateProfile = async (data) => {
    if (userType !== 'customer') return null;
    const response = await axios.put(`${API}/customer/me`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUser(response.data);
    return response.data;
  };

  const hideWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const checkEmailExists = async (email) => {
    const response = await axios.get(`${API}/customer/check-email?email=${encodeURIComponent(email)}`);
    return response.data.exists;
  };

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      token,
      loading,
      isLoggedIn: !!user,
      isAdmin: userType === 'admin',
      isCustomer: userType === 'customer',
      login,
      register,
      logout,
      updateProfile,
      checkEmailExists,
      showWelcome,
      welcomeName,
      hideWelcome,
      showLogout,
      logoutName,
      hideLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
