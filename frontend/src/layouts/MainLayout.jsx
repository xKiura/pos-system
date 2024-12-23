import React from "react";
import { Link } from "react-router-dom";

function MainLayout({ children }) {
  return (
    <div>
      <header>
        <nav className="navbar bg-primary navbar-dark">
          <div className="container d-flex justify-content-center">
            <Link to="/" className="navbar-brand fs-1 text-center">
              مندي ومشوي
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <div className="container mt-3 mr-0 ml-0">{children}</div>
      </main>
    </div>
  );
}

export default MainLayout;
