import React, { createContext, useContext, useState } from 'react';
import { endpoints } from '../config/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Add your default settings here
    theme: 'light',
    language: 'en',
    // Add more settings as needed
  });

  const fetchSettings = async () => {
    try {
      const response = await fetch(endpoints.settings);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch(endpoints.settings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSettings(data);
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, fetchSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
