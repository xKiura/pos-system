import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import SignUpPopup from "../components/SignUpPopUp/SignUpPopup";
import LoginPopup from "../components/LoginPopup/LoginPopup";
import './MainLayout.css';

const MainLayout = () => {
  const [isSignUpPopupVisible, setSignUpPopupVisible] = useState(false);
  const [isLoginPopupVisible, setLoginPopupVisible] = useState(false);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setSignUpPopupVisible(false);
        setLoginPopupVisible(false);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const toggleSignUpPopup = () => {
    setSignUpPopupVisible(!isSignUpPopupVisible);
    if (isLoginPopupVisible) {
      setLoginPopupVisible(false);
    }
  };

  const toggleLoginPopup = () => {
    setLoginPopupVisible(!isLoginPopupVisible);
    if (isSignUpPopupVisible) {
      setSignUpPopupVisible(false);
    }
  };

  return (
    <div>
      <header>
        <nav className="navbar navbar-light bg-light justify-content-between">
          <div className="container my-2 mx-5">
            <Link to="/" className="navbar-brand">
              <img src={assets.main_logo} alt="مندي ومشوي" className="main-logo" />
            </Link>
          </div>
          <div className="justify-content-end my-2 mx-5" id="navbarNavAltMarkup">
            <div className="navbar-nav">
              <Link className="nav-item nav-link active" to="/">
                <button type="button" className="btn btn-outline-secondary" onClick={toggleSignUpPopup}>تسجيل جديد</button>
              </Link>
            </div>
          </div>
        </nav>
      </header>
      {isSignUpPopupVisible && <SignUpPopup onClose={toggleSignUpPopup} />}
      {isLoginPopupVisible && <LoginPopup onClose={toggleLoginPopup} />}
    </div>
  );
}

export default MainLayout;
