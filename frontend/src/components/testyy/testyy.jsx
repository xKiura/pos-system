import React, { useState, useEffect } from 'react';
import './LoginPopup.css';
import { FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const LoginPopup = ({ onClose }) => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');

  useEffect(() => {
    const savedEmployeeName = localStorage.getItem('employeeName');
    const savedEmployeeNumber = localStorage.getItem('employeeNumber');
    if (savedEmployeeName && savedEmployeeNumber) {
      setEmployeeName(savedEmployeeName);
      setEmployeeNumber(savedEmployeeNumber);
    }
  }, []);

  const handleLogin = () => {
    if (employeeName.trim() && employeeNumber.trim()) {
      localStorage.setItem('employeeName', employeeName);
      localStorage.setItem('employeeNumber', employeeNumber);
      const url = `/pos?name=${encodeURIComponent(employeeName)}&number=${encodeURIComponent(employeeNumber)}`;
      window.location.href = url;
    } else {
      alert('يرجى إدخال اسم الموظف ورقم الموظف');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeNumber');
    setEmployeeName('');
    setEmployeeNumber('');
    window.location.href = '/';
  };

  return (
    <div className="login-popup fade-in">
      <button className="close-btn m-2" onClick={onClose}><FaTimes color="red" /></button>
      <div className="card border border-primary rounded-3 text-white bg-dark card-body p-5 text-center">
        <h3 className="mb-5">تسجيل الدخول</h3>
        <div data-mdb-input-init className="form-outline mb-4">
          <label className="form-label" htmlFor="typeEmailX-2">الاسم كامل</label>
          <input type="text" id="typeEmailX-2" placeholder='اسم الموظف' className="form-control form-control-lg" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="sr-only mb-2" htmlFor="inlineFormInputGroup">رقم الموظف</label>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <div className="input-group-text">#</div>
            </div>
            <input type="text" className="form-control" id="inlineFormInputGroup" placeholder="123456789" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} />
          </div>
        </div>
        <button data-mdb-button-init data-mdb-ripple-init className="mt-5 btn btn-warning btn-lg btn-block" type="button" onClick={handleLogin}>الدخول إلى نقطة البيع</button>
        <button data-mdb-button-init data-mdb-ripple-init className="mt-3 btn btn-danger btn-lg btn-block" type="button" onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </div>
  );
};

export default LoginPopup;