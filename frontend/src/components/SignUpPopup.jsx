import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import NumPad from './NumPad';
import './SignUpPopup.css';

const SignUpPopup = ({ onClose }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    email: '',
    phoneNumber: '',
    pin: ['', '', '', ''],
    confirmPin: ['', '', '', '']
  });

  const [errors, setErrors] = useState({});
  const [activePin, setActivePin] = useState('pin'); // 'pin' or 'confirmPin'
  const [pinMatch, setPinMatch] = useState(true); // Add this new state
  const [showErrors, setShowErrors] = useState(false);  // This will only be set to true on submit
  const [pinError, setPinError] = useState('');

  const validatePin = () => {
    const pin = formData.pin.join('');
    const confirmPin = formData.confirmPin.join('');
    
    if (pin.length === 4 && confirmPin.length === 4) {
      const matches = pin === confirmPin;
      setPinMatch(matches);
      setPinError(matches ? '' : 'الرقم السري غير متطابق');
      return matches;
    }
    setPinError('');
    return true;
  };

  const handlePinInput = (number) => {
    const field = activePin;
    const currentPin = [...formData[field]];
    const currentIndex = currentPin.findIndex(digit => digit === '');
    
    if (currentIndex !== -1) {
      currentPin[currentIndex] = number.toString();
      setFormData(prev => ({ ...prev, [field]: currentPin }));
      
      // Check match when both PINs are complete
      if (currentIndex === 3) {
        if (field === 'pin') {
          setActivePin('confirmPin');
        } else {
          setTimeout(() => validatePin(), 100); // Slight delay for better UX
        }
      }
    }
  };

  const handlePinDelete = () => {
    const field = activePin;
    const currentPin = [...formData[field]];
    const lastFilledIndex = currentPin.map(digit => digit !== '').lastIndexOf(true);
    
    if (lastFilledIndex !== -1) {
      currentPin[lastFilledIndex] = '';
      setFormData(prev => ({ ...prev, [field]: currentPin }));
    }
  };

  const handlePinClear = () => {
    setFormData(prev => ({
      ...prev,
      [activePin]: ['', '', '', '']
    }));
  };

  const saveUserToStorage = (userData) => {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    existingUsers.push(userData);
    localStorage.setItem('users', JSON.stringify(existingUsers));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    const newErrors = {};

    // Basic field validation
    if (!formData.name) newErrors.name = 'الاسم مطلوب';
    
    // Employee number validation
    if (!formData.employeeNumber) {
      newErrors.employeeNumber = 'رقم الموظف مطلوب';
    } else if (!/^\d+$/.test(formData.employeeNumber)) {
      newErrors.employeeNumber = 'رقم الموظف يجب أن يحتوي على أرقام فقط';
    }
    
    if (!formData.email) newErrors.email = 'البريد الإلكتروني مطلوب';
    
    // Phone number validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'رقم الهاتف مطلوب';
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
    }

    // PIN validation only on submit
    const pin = formData.pin.join('');
    const confirmPin = formData.confirmPin.join('');
    
    if (pin.length !== 4 || confirmPin.length !== 4) {
      newErrors.pin = 'الرقم السري يجب أن يكون 4 أرقام';
    } else if (!validatePin()) {
      newErrors.pin = 'الرقم السري غير متطابق';
    }

    if (Object.keys(newErrors).length === 0) {
      const userData = {
        name: formData.name,
        employeeNumber: formData.employeeNumber,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        pin: formData.pin.join('')
      };

      saveUserToStorage(userData);
      const success = register(userData);

      if (success) {
        onClose();
      } else {
        setErrors({ submit: 'Failed to register user' });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="signup-overlay">
      <div className="signup-container">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>تسجيل موظف جديد</h2>
        
        <div className="signup-content">
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label>الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={showErrors && errors.name ? 'error' : ''}
              />
              {showErrors && errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>رقم الموظف</label>
              <input
                type="text"
                value={formData.employeeNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData(prev => ({ ...prev, employeeNumber: value }));
                  }
                }}
                className={showErrors && errors.employeeNumber ? 'error' : ''}
              />
              {showErrors && errors.employeeNumber && <span className="error-message">{errors.employeeNumber}</span>}
            </div>

            <div className="form-group">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={showErrors && errors.email ? 'error' : ''}
              />
              {showErrors && errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData(prev => ({ ...prev, phoneNumber: value }));
                  }
                }}
                className={showErrors && errors.phoneNumber ? 'error' : ''}
              />
              {showErrors && errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>

            <div className="pin-section">
              <div className="pin-displays">
                <div className="pin-group">
                  <label>الرقم السري</label>
                  <div className={`pin-display ${activePin === 'pin' ? 'active' : ''} ${!pinMatch ? 'mismatch' : ''}`}
                       onClick={() => setActivePin('pin')}>
                    {formData.pin.map((digit, index) => (
                      <div key={index} className="pin-digit">{digit ? '•' : ''}</div>
                    ))}
                  </div>
                </div>

                <div className="pin-group">
                  <label>تأكيد الرقم السري</label>
                  <div className={`pin-display ${activePin === 'confirmPin' ? 'active' : ''} ${!pinMatch ? 'mismatch' : ''}`}
                       onClick={() => setActivePin('confirmPin')}>
                    {formData.confirmPin.map((digit, index) => (
                      <div key={index} className="pin-digit">{digit ? '•' : ''}</div>
                    ))}
                  </div>
                  {!pinMatch && <span className="pin-mismatch-message">الرقم السري غير متطابق</span>}
                </div>
              </div>
            </div>

            {/* Move NumPad and submit button here */}
            <div className="numpad-wrapper">
              <NumPad
                onNumberClick={handlePinInput}
                onDelete={handlePinDelete}
                onClear={handlePinClear}
                pin={formData.pin}
                confirmPin={formData.confirmPin}
                pinError={pinError}
                isValid={pinMatch}
              />
              <button type="submit" className="submit-button">تسجيل</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPopup;