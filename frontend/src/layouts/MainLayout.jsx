import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import SignUpPopup from "../components/SignUpPopUp/SignUpPopup";
import mainLogo from '../assets/main_logo.png';
import { FaUser, FaSignOutAlt, FaUserPlus } from 'react-icons/fa';
import "./MainLayout.css";
import "../styles/buttons.css";

const MainLayout = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [isSignUpPopupVisible, setSignUpPopupVisible] = useState(false);

  const toggleSignUpPopup = () => setSignUpPopupVisible(!isSignUpPopupVisible);

  const handleLogout = () => {
    logout();
    // You might want to redirect to login page or home page after logout
    window.location.href = '/';
  };

  return (
    <div className="container-fluid p-0">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3">
        <div className="container">
          <a className="navbar-brand" href="/">
            <img src={mainLogo} alt="مندي ومشوي" className="main-logo" />
          </a>
          
          <div className="d-flex align-items-center">
            {isAuthenticated ? (
              <>
                <div className="text-light me-4">
                  <FaUser className="me-2" />
                  <span>{currentUser?.name}</span>
                </div>
                <button 
                  className="btn btn-custom btn-custom-danger"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  تسجيل خروج
                </button>
              </>
            ) : (
              <button 
                className="btn btn-custom btn-custom-primary"
                onClick={toggleSignUpPopup}
              >
                <FaUserPlus />
                تسجيل موظف جديد
              </button>
            )}
          </div>
        </div>
      </nav>

      {isSignUpPopupVisible && <SignUpPopup onClose={toggleSignUpPopup} />}
    </div>
  );
};

export default MainLayout;
