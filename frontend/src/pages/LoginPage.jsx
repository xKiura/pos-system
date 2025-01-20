import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import NumPad from '../components/NumPad';
import api from '../services/api';
import { useEmployee } from '../context/EmployeeContext';

function LoginPage() {
    const { login } = useAuth();
    const { setEmployee } = useEmployee();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        employeeNumber: '',
        employeeName: '', // Add employee name
        pin: ['', '', '', '']
    });
    const [errors, setErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);

    const handlePinInput = (number) => {
        const currentPin = [...formData.pin];
        const currentIndex = currentPin.findIndex(digit => digit === '');
        
        if (currentIndex !== -1) {
            currentPin[currentIndex] = number.toString();
            setFormData(prev => ({ ...prev, pin: currentPin }));
        }
    };

    const handlePinDelete = () => {
        const currentPin = [...formData.pin];
        const lastFilledIndex = currentPin.map(digit => digit !== '').lastIndexOf(true);
        
        if (lastFilledIndex !== -1) {
            currentPin[lastFilledIndex] = '';
            setFormData(prev => ({ ...prev, pin: currentPin }));
        }
    };

    const handlePinClear = () => {
        setFormData(prev => ({
            ...prev,
            pin: ['', '', '', '']
        }));
    };

    const handleEmployeeNumberChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            setFormData(prev => ({ ...prev, employeeNumber: value }));
        }
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        // Only allow letters and spaces (Arabic and English)
        if (value === '' || /^[\u0600-\u06FFa-zA-Z\s]+$/.test(value)) {
            setFormData(prev => ({ ...prev, employeeName: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowErrors(true);
        const newErrors = {};

        // Strict validation for all fields
        const normalizedName = formData.employeeName.trim();
        
        // Name validation
        if (!normalizedName) {
            newErrors.employeeName = 'اسم الموظف مطلوب';
        } else if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(normalizedName)) {
            newErrors.employeeName = 'اسم الموظف يجب أن يحتوي على حروف فقط';
        }

        // Employee number validation
        if (!formData.employeeNumber.trim()) {
            newErrors.employeeNumber = 'رقم الموظف مطلوب';
        }

        // PIN validation
        if (formData.pin.includes('')) {
            newErrors.pin = 'الرقم السري مطلوب';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const loginData = {
                employeeNumber: formData.employeeNumber.trim(),
                employeeName: normalizedName,
                pin: formData.pin.join('')
            };

            console.log('Attempting login with:', {
                ...loginData,
                pin: '****' // Hide PIN in logs
            });

            const response = await api.post('/login', loginData);
            
            if (response.data.success) {
                // Clear any existing employee data
                localStorage.removeItem('employeeName');
                localStorage.removeItem('employeeNumber');

                // Store the new employee data
                localStorage.setItem('employeeName', response.data.employeeName);
                localStorage.setItem('employeeNumber', response.data.employeeNumber);

                // Log the stored data for verification
                console.log('Stored employee info:', {
                    name: localStorage.getItem('employeeName'),
                    number: localStorage.getItem('employeeNumber')
                });

                login({
                    name: response.data.employeeName,
                    employeeNumber: response.data.employeeNumber
                });
                navigate('/pos');
            } else {
                setErrors({ auth: 'بيانات تسجيل الدخول غير صحيحة' });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول';
            setErrors({ auth: errorMessage });
            console.error('Login error:', error.response?.data || error);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>تسجيل الدخول</h2>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="اسم الموظف"
                        value={formData.employeeName}
                        onChange={handleNameChange}
                        className={showErrors && errors.employeeName ? 'error' : ''}
                    />
                    {showErrors && errors.employeeName && 
                        <span className="error-message">{errors.employeeName}</span>}
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="رقم الموظف"
                        value={formData.employeeNumber}
                        onChange={handleEmployeeNumberChange}
                        className={showErrors && errors.employeeNumber ? 'error' : ''}
                    />
                    {showErrors && errors.employeeNumber && 
                        <span className="error-message">{errors.employeeNumber}</span>}
                </div>
                <div className="pin-display">
                    {formData.pin.map((digit, index) => (
                        <div key={index} className="pin-digit">{digit ? '•' : ''}</div>
                    ))}
                </div>
                {showErrors && errors.pin && <span className="error-message">{errors.pin}</span>}
                
                <div className="numpad-wrapper">
                    <NumPad
                        onNumberClick={handlePinInput}
                        onDelete={handlePinDelete}
                        onClear={handlePinClear}
                        pin={formData.pin}
                    />
                    <button type="submit" className="submit-button">دخول</button>
                </div>
            </form>
            
            {errors.auth && (
                <div className="error-message auth-error">
                    {errors.auth}
                </div>
            )}
        </div>
    );
};

export default LoginPage;

