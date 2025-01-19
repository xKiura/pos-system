import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Replace with actual authentication logic
        if (!employeeId || !pin) {
            setError('Please enter both Employee ID and PIN');
            return;
        }
        
        // Mock validation - replace with actual authentication
        if (employeeId === 'EMP001' && pin === '1234') {
            navigate('/pos');
        } else {
            setError('Invalid Employee ID or PIN');
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Employee Login</h2>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Employee ID"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={4}
                        pattern="[0-9]*"
                        inputMode="numeric"
                    />
                </div>
                <button type="submit" className="login-button">
                    Login
                </button>
            </form>
            
            {error && (
                <div className="error-popup">
                    <div className="error-content">
                        <p>{error}</p>
                        <button onClick={() => setError('')}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
