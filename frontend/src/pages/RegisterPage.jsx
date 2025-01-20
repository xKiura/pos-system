import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NumPad from '../components/NumPad';
import api from '../services/api';

function RegisterPage() {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowErrors(true);
        const newErrors = {};

        if (!formData.name) newErrors.name = 'الاسم مطلوب';
        if (!formData.employeeNumber) newErrors.employeeNumber = 'رقم الموظف مطلوب';
        if (formData.pin.join('').length !== 4) newErrors.pin = 'الرقم السري يجب أن يكون 4 أرقام';

        if (Object.keys(newErrors).length === 0) {
            try {
                const response = await api.post('/register', {
                    name: formData.name,
                    employeeNumber: formData.employeeNumber,
                    pin: formData.pin.join('')
                });

                if (response.data.success) {
                    navigate('/login');
                }
            } catch (error) {
                setErrors({ auth: error.response?.data?.message || 'حدث خطأ في التسجيل' });
            }
        } else {
            setErrors(newErrors);
        }
    };

    // ...rest of the component with form rendering...
}

export default RegisterPage;
