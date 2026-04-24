import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create App Context
const AppContext = createContext(null);

// App Provider Component
export const AppProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLive, setIsLive] = useState(true);
  
  // Context value
  const value = {
    currentPage,
    setCurrentPage,
    isLive,
    setIsLive,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use App context
export const useApp = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
};

export default AppContext;