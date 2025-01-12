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

const App = () => {

  return (
    <>
    <Router>
      <div className='app'>
        <MainLayout />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/manage-products" element={<ManageProductsPage />} />
        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
