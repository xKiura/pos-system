import React, { useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import SignUpPopup from "../components/SignUpPopUp/SignUpPopup";
import './MainLayout.css';

const MainLayout = () => {
  const [isSignUpPopupVisible, setSignUpPopupVisible] = useState(false);

  const toggleSignUpPopup = () => {
    setSignUpPopupVisible(!isSignUpPopupVisible);
  };

  return (
    <div>
      <header>
        <nav className="navbar navbar-light bg-light justify-content-end">
          <div className="container my-2 mx-5">
            <Link to="/" className="navbar-brand">
              <img src={assets.main_logo} alt="مندي ومشوي" className="main-logo" />
            </Link>
          </div>
          <div className="justify-content-end my-2 mx-5" id="navbarNavAltMarkup">
            <div className="navbar-nav">
              <Link className="nav-item nav-link active"><button type="button" className="btn btn-outline-secondary" onClick={toggleSignUpPopup}>تسجيل جديد</button></Link>
            </div>
          </div>
        </nav>
      </header>
      {isSignUpPopupVisible && <SignUpPopup onClose={toggleSignUpPopup} />}
    </div>
  );
}

export default MainLayout;
