import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from './EmployeeContext';

function Login() {
    const { setEmployee } = useEmployee();
    const navigate = useNavigate();

    const handleLogin = async (credentials) => {
        try {
            const response = await axios.post('http://localhost:5000/login', credentials);
            if (response.data.success) {
                setEmployee(response.data.employeeName, response.data.employeeNumber);
                navigate('/pos');
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const [credentials, setCredentials] = useState({ username: '', password: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prevCredentials) => ({
            ...prevCredentials,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleLogin(credentials);
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={credentials.username}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;
