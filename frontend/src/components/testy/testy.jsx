import React from 'react';
import './SignUpPopup.css';
import { FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SignUpPopup = ({ onClose }) => {
  return (
    <div className="login-popup fade-in">
      <button className="close-btn m-2" onClick={onClose}><FaTimes color="red" /></button>
      <div className="card border border-primary rounded-3 text-white bg-dark card-body p-5 text-center">
        <h3 className="mb-5">تسجيل موظف جديد</h3>
        <div data-mdb-input-init className="form-outline mb-4">
          <label className="form-label" htmlFor="typeEmailX-2">الاسم كامل</label>
          <input type="email" id="typeEmailX-2" placeholder='الاسم' className="form-control form-control-lg" />
        </div>
        <div className="col-auto">
          <label className="sr-only mb-2" htmlFor="inlineFormInputGroup">رقم الموظف</label>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <div className="input-group-text">#</div>
            </div>
            <input type="text" className="form-control" id="inlineFormInputGroup" placeholder="123456789" />
          </div>
        </div>
        <div data-mdb-input-init className="form-outline mb-4">
          <label className="form-label" htmlFor="typeEmailX-2">البريد الالكتروني</label>
          <input type="email" id="typeEmailX-2" placeholder='aaa@email.com' className="form-control form-control-lg" />
        </div>
        <Link to="/pos">
          <button data-mdb-button-init data-mdb-ripple-init className="mt-5 btn btn-primary btn-lg btn-block" type="submit">تسجيل</button>
        </Link>
      </div>
    </div>
  );
};

export default SignUpPopup;