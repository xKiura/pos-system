import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import NumPad from '../components/NumPad';
import { toast } from 'react-toastify';
import { endpoints } from '../config/api';
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
        
        // Validation
        const newErrors = {};
        const normalizedName = formData.employeeName.trim();
        
        if (!normalizedName) {
            newErrors.employeeName = 'اسم الموظف مطلوب';
        }
        if (!formData.employeeNumber.trim()) {
            newErrors.employeeNumber = 'رقم الموظف مطلوب';
        }
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
                pin: '****'
            });

            const result = await login(loginData);

            if (result.success) {
                navigate('/pos');
            } else {
                toast.error(result.message);
                setErrors({ auth: result.message });
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('حدث خطأ أثناء تسجيل الدخول');
            setErrors({ auth: 'حدث خطأ أثناء تسجيل الدخول' });
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

