import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import HomePage from './pages/HomePage';
import POSPage from './pages/POSPage';
import MainLayout from './layouts/MainLayout';

const App = () => {

  return (
    <>
    <Router>
      <div className='app'>
        <MainLayout />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pos" element={<POSPage />} />
        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
