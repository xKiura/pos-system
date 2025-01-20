import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from 'react-router-dom';
import SignUpPopup from "../components/SignUpPopup";
import mainLogo from '../assets/main_logo.png';
import { FaUser, FaSignOutAlt, FaUserPlus } from 'react-icons/fa';
import "./MainLayout.css";
import "../styles/buttons.css";

const MainLayout = ({ children }) => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [isSignUpPopupVisible, setSignUpPopupVisible] = useState(false);
  const navigate = useNavigate();

  const toggleSignUpPopup = () => setSignUpPopupVisible(!isSignUpPopupVisible);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="container-fluid p-0">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3">
          <div className="container">
            <a className="navbar-brand" href="/">
              <img src={mainLogo} alt="مندي ومشوي" className="main-logo" />
            </a>
            
            <div className="d-flex align-items-center">
              {isAuthenticated && currentUser ? (
                <>
                  <div className="text-light me-4">
                    <FaUser className="me-2" />
                    <span>{currentUser.name}</span>
                    <span className="ms-2">#{currentUser.employeeNumber}</span>
                  </div>
                  <button 
                    className="btn btn-custom btn-custom-danger"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="me-2" />
                    تسجيل خروج
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-custom btn-custom-primary"
                  onClick={toggleSignUpPopup}
                >
                  <FaUserPlus className="me-2" />
                  تسجيل موظف جديد
                </button>
              )}
            </div>
          </div>
        </nav>

        {isSignUpPopupVisible && <SignUpPopup onClose={toggleSignUpPopup} />}
      </div>
      {children}
    </div>
  );
};

export default MainLayout;
