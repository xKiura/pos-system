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
import ProfitsPage from './pages/ProfitsPage';

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
          <Route path="/profits" element={<ProfitsPage />} />
        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
