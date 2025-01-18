import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import HomePage from './pages/HomePage';
import POSPage from './pages/POSPage';
import MainLayout from './layouts/MainLayout';
import ManageProductsPage from './pages/ManageProductsPage';
import BillsPage from './pages/BillsPage';
import SalesReports from './pages/SalesReports';
import InventoryReports from './pages/InventoryReports';
import './App.css';

const App = () => {

  return (
    <>
    <Router>
      <div className='app'>
      <MainLayout />
        <div className='container'>
          <div className='content'>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/manage-products" element={<ManageProductsPage />} />
              <Route path="/bills" element={<BillsPage />} />
              <Route path="/sales-reports" element={<SalesReports />} />
              <Route path="/inventory-reports" element={<InventoryReports />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
    </>
  );
}

export default App;
