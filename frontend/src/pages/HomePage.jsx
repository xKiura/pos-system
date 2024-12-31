import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import backgroundImage from '../images/mendi-mashwi.jpeg';

function HomePage() {
  return (
    <MainLayout>
      <div className="image-container" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
      </div>
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center bg-light p-5 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <h1>مطعم مندي ومشوي</h1>
          <p>مرحباً بك في مطعم مندي ومشوي. يرجى تسجيل الدخول للمتابعة.</p>
          <Link to="/pos" className="btn btn-primary">
            الدخول إلى نقطة البيع
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

export default HomePage;
