import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import HomePage from './pages/HomePage';
import POSPage from './pages/POSPage';
import MainLayout from './layouts/MainLayout';
import ManageProductsPage from './pages/ManageProductsPage';
import BillsPage from './pages/BillsPage';
import SalesReports from './pages/SalesReports';
import InventoryReports from './pages/InventoryReports';
import ManagementPage from './pages/ManagementPage';
import LoginPage from './pages/LoginPage';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './components/AuthContext';
import { EmployeeProvider } from './context/EmployeeContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {

  return (
    <SettingsProvider>
      <AuthProvider>
        <EmployeeProvider>
          <Router>
            <div className='app'>
              <MainLayout />
              <div className='container'>
                <div className='content'>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/pos" element={
                      <ProtectedRoute>
                        <POSPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/manage-products" element={
                      <ProtectedRoute>
                        <ManageProductsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/bills" element={
                      <ProtectedRoute>
                        <BillsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/sales-reports" element={
                      <ProtectedRoute>
                        <SalesReports />
                      </ProtectedRoute>
                    } />
                    <Route path="/inventory-reports" element={
                      <ProtectedRoute>
                        <InventoryReports />
                      </ProtectedRoute>
                    } />
                    <Route path="/management" element={
                      <ProtectedRoute>
                        <ManagementPage />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </div>
              </div>
            </div>
          </Router>
        </EmployeeProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
