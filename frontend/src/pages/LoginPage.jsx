import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import NumPad from '../components/NumPad';
import axios from 'axios';
// Fix the import path to point to the correct location
import { useEmployee } from '../context/EmployeeContext';  // <-- Updated this line

function LoginPage() {
    const { login } = useAuth();
    const { setEmployee } = useEmployee();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        employeeNumber: '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowErrors(true);
        const newErrors = {};

        // Validation
        if (!formData.name) {
            newErrors.name = 'الاسم مطلوب';
        }

        if (!formData.employeeNumber) {
            newErrors.employeeNumber = 'رقم الموظف مطلوب';
        }

        if (formData.pin.join('').length !== 4) {
            newErrors.pin = 'الرقم السري يجب أن يكون 4 أرقام';
        }

        if (Object.keys(newErrors).length === 0) {
            const success = await handleLogin({ employeeNumber: formData.employeeNumber, pin: formData.pin.join('') });
            if (success) {
                navigate('/pos');
            } else {
                setErrors({ auth: 'بيانات تسجيل الدخول غير صحيحة' });
            }
        } else {
            setErrors(newErrors);
        }
    };

    const handleLogin = async (credentials) => {
        try {
            const response = await axios.post('http://localhost:5000/login', credentials);
            if (response.data.success) {
                // Update both contexts
                login(response.data.employeeName, response.data.employeeNumber);
                setEmployee(response.data.employeeName, response.data.employeeNumber);
                navigate('/pos');
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>تسجيل الدخول</h2>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="الاسم"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={showErrors && errors.name ? 'error' : ''}
                    />
                    {showErrors && errors.name && <span className="error-message">{errors.name}</span>}
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
