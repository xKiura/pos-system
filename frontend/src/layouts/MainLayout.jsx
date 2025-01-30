import React, { useState, useEffect, useRef } from 'react';  // Add useRef and useEffect
import { useAuth } from "../components/AuthContext";
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import SignUpPopup from "../components/SignUpPopup";
import mainLogo from '../assets/main_logo.png';
import { FaUser, FaSignOutAlt, FaUserPlus, FaUserCog } from 'react-icons/fa';
import "./MainLayout.css";
import "../styles/buttons.css";

const MainLayout = ({ children }) => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [isSignUpPopupVisible, setSignUpPopupVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  // Add ref for dropdown menu
  const menuRef = useRef(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSignUpPopup = () => setSignUpPopupVisible(!isSignUpPopupVisible);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    handleLogout();
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
                <div className="d-flex align-items-center">
                  <UserMenu ref={menuRef}>
                    <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
                      <FaUser />
                      <span>{currentUser.name}</span>
                      <span className="ms-2">#{currentUser.employeeNumber}</span>
                    </UserButton>
                    
                    {showUserMenu && (
                      <UserDropdown>
                        <button onClick={handleProfileClick}>
                          <FaUserCog />
                          الملف الشخصي
                        </button>
                        <button onClick={handleLogoutClick}>
                          <FaSignOutAlt />
                          تسجيل خروج
                        </button>
                      </UserDropdown>
                    )}
                  </UserMenu>
                </div>
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

// Update UserMenu to accept ref
const UserMenu = styled.div.attrs(props => ({
  ref: props.ref
}))`
  position: relative;
  display: inline-block;
`;

const UserButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const UserDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;

  a, button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    color: #4a5568;
    text-decoration: none;
    width: 100%;
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.2s;
    text-align: start;

    &:hover {
      background: #f7fafc;
    }
  }
`;

export default MainLayout;
