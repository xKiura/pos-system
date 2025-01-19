import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [employeeInfo, setEmployeeInfo] = useState(() => {
    const savedInfo = localStorage.getItem('employeeInfo');
    return savedInfo ? JSON.parse(savedInfo) : null;
  });

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
    if (employeeInfo) {
      localStorage.setItem('employeeInfo', JSON.stringify(employeeInfo));
    }
  }, [isAuthenticated, employeeInfo]);

  const login = (employeeName, employeeNumber) => {
    setIsAuthenticated(true);
    setEmployeeInfo({ employeeName, employeeNumber });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setEmployeeInfo(null);
    localStorage.removeItem('employeeInfo');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      employeeInfo,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
