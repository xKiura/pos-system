import React, { useState } from "react";
import SignUpPopup from "../components/SignUpPopUp/SignUpPopup";
// Import the image if it's in the src folder
import mainLogo from '../assets/main_logo.png';  // Adjust the path as needed
import "./MainLayout.css";

const MainLayout = () => {
  const [isSignUpPopupVisible, setSignUpPopupVisible] = useState(false);

  const toggleSignUpPopup = () => {
    setSignUpPopupVisible(!isSignUpPopupVisible);
  };

  return (
    <div className="container">
      <header>
        <nav className="navbar navbar-light bg-light navbar-border">
          <a className="navbar-brand" href="/" data-discover="true">
            <img
              // If using import:
              src={mainLogo}
              // Or if the image is in public folder:
              // src="/main_logo.png"
              alt="مندي ومشوي"
              className="main-logo"
            />
          </a>
          <div className="navbar-nav mx-2">
            <a
              className="nav-item nav-link active"
              href="#"
              data-discover="true"
              onClick={toggleSignUpPopup}
            >
              <button type="button" className="btn btn-danger">
                تسجيل خروج
              </button>
            </a>
          </div>
        </nav>
      </header>
      {isSignUpPopupVisible && <SignUpPopup onClose={toggleSignUpPopup} />}
    </div>
  );
};

export default MainLayout;
