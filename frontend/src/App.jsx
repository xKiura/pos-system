import React, { useMemo } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
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

const ProtectedRoute = React.memo(({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
});

const AuthenticatedContent = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="app-wrapper">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            {[
              { path: '/pos', component: <POSPage /> },
              { path: '/manage-products', component: <ManageProductsPage /> },
              { path: '/bills', component: <BillsPage /> },
              { path: '/sales-reports', component: <SalesReports /> },
              { path: '/inventory-reports', component: <InventoryReports /> },
              { path: '/management', component: <ManagementPage /> },
            ].map(({ path, component }) => (
              <Route
                key={path}
                path={path}
                element={<ProtectedRoute>{component}</ProtectedRoute>}
              />
            ))}
          </Routes>
        </div>
      </div>
    </MainLayout>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
          <Navigate to="/pos" replace /> : 
          <MainLayout>
            <div className="app-wrapper">
              <div className="app-content">
                <LoginPage />
              </div>
            </div>
          </MainLayout>
        } 
      />
      <Route 
        path="*" 
        element={
          isAuthenticated ? 
          <AuthenticatedContent /> : 
          <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <SettingsProvider>
        <EmployeeProvider>
          <div className='app'>
            <AppRoutes />
          </div>
        </EmployeeProvider>
      </SettingsProvider>
    </AuthProvider>
  </Router>
);

export default App;
