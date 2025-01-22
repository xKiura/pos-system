import React, { createContext, useContext, useState, useEffect } from 'react';
import { endpoints } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('Sending login request:', {
        ...credentials,
        pin: '****'
      });

      const response = await fetch(endpoints.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employeeNumber: credentials.employeeNumber.toString(),
          employeeName: credentials.employeeName.trim(),
          pin: credentials.pin
        })
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.success) {
        localStorage.setItem('employeeName', data.employeeName);
        localStorage.setItem('employeeNumber', data.employeeNumber);
        
        setCurrentUser({
          name: data.employeeName,
          employeeNumber: data.employeeNumber
        });
        setIsAuthenticated(true);
        return { success: true };
      }

      return {
        success: false,
        message: data.message || 'بيانات تسجيل الدخول غير صحيحة'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'حدث خطأ في الاتصال بالخادم'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeNumber');
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
