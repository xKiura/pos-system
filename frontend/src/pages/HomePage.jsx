import React, { useState, useEffect } from "react";
import backgroundImage from "../assets/mendi-mashwi.jpeg";
import LoginPopup from "../components/LoginPopup/LoginPopup";

const HomePage = () => {
  const [showLogin, setShowLoginState] = useState(false);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setShowLoginState(false);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <>
      {showLogin ? <LoginPopup onClose={() => setShowLoginState(false)} /> : null}
      <div className={`image-container ${showLogin ? 'blur' : ''}`} style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
      </div>
      <div className={`d-flex justify-content-center align-items-center ${showLogin ? 'blur' : ''}`} style={{ height: '100vh' }}>
        <div className="text-center bg-light p-5 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <h1>مطعم مندي ومشوي</h1>
          <p>مرحباً بك في مطعم مندي ومشوي. يرجى تسجيل الدخول للمتابعة.</p>
          <button type="button" className="btn btn-warning" onClick={() => setShowLoginState(true)}>الدخول إلى نقطة البيع</button>
        </div>
      </div>

      <style jsx>{`
          .btn-warning {
          background-color: rgb(255, 123, 0);
        }
          `}</style>
    </>
  );
}

export default HomePage;
