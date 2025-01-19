import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const PinAuth = ({ onClose }) => {
  const [pin, setPin] = useState('');
  const { login } = useAuth();

  const handlePinSubmit = (e) => {
    e.preventDefault();
    // Add your PIN validation logic here
    if (pin.length === 4) {
      login({ id: 1, name: 'User', pin: pin });
      onClose();
    }
  };

  return (
    <div className="pin-auth-overlay">
      <div className="pin-auth-container bg-dark text-white p-4 rounded">
        <h3 className="text-center mb-4">ادخل رقم التعريف الشخصي</h3>
        <form onSubmit={handlePinSubmit}>
          <input
            type="password"
            maxLength="4"
            className="form-control form-control-lg text-center mb-3"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
          />
          <button type="submit" className="btn btn-primary w-100">
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
};

export default PinAuth;
