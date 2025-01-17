import React, { useState } from "react";
import SignUpPopup from "../components/SignUpPopUp/SignUpPopup";
import "./MainLayout.css";

const MainLayout = () => {
  const [isSignUpPopupVisible, setSignUpPopupVisible] = useState(false);

  const toggleSignUpPopup = () => {
    setSignUpPopupVisible(!isSignUpPopupVisible);
  };

  return (
    <div>
      <header>
        <nav class="navbar navbar-light bg-light">
          <a class="navbar-brand" href="/" data-discover="true">
            <img
              src="/static/media/main_logo.2d6a559415d54d818d81.png"
              alt="مندي ومشوي"
              class="main-logo"
            />
          </a>
          <div class="navbar-nav mx-2">
            <a
              class="nav-item nav-link active"
              href="#"
              data-discover="true"
              onClick={toggleSignUpPopup}
            >
              <button type="button" class="btn btn-danger">
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
