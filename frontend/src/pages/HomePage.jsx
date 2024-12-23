import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function HomePage() {
  return (
    <MainLayout>
      <div className="container mt-3">
        <div className="bg-light p-5 mt-4 rounded-3"></div>
        <h1>مطعم مندي ومشوي</h1>
        <p>مرحباً بك في مطعم مندي ومشوي. يرجى تسجيل الدخول للمتابعة.</p>
        <Link to="/pos" className="btn btn-primary">
          الدخول إلى نقطة البيع
        </Link>
      </div>
    </MainLayout>
  );
}

export default HomePage;
