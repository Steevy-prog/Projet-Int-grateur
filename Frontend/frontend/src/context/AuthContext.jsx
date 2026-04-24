import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return;
      }

      // Verify token and get user data (replace with actual API call)
      const userData = await verifyToken(token);
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
    }
  };

  // Verify token (mock implementation - replace with real API call)
  const verifyToken = async (token) => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/auth/verify', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return response.json();

    // Mock user data
    return {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      isVerified: true,
    };
  };

  // Login function
  const login = async (email, password) => {
    try {

      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await response.json();

      // Mock successful login
      const data = {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: '1',
          name: 'John Doe',
          email: email,
          role: 'admin',
          isVerified: false,
        },
      };

      // Save token
      localStorage.setItem('authToken', data.token);
      
      // Set user state
      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    } finally {
    }
  };


  // Logout function
  const logout = () => {
    // Clear token
    localStorage.removeItem('authToken');
    
    // Clear user state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    navigate('/');
  };


  // Context value
  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;