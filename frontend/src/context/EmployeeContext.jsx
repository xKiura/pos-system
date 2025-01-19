import React, { createContext, useContext, useState, useEffect } from 'react';

const EmployeeContext = createContext();

export function EmployeeProvider({ children }) {
    const [employeeData, setEmployeeData] = useState(() => {
        // Try to get employee data from localStorage on initial load
        const savedData = localStorage.getItem('employeeData');
        return savedData ? JSON.parse(savedData) : { employeeName: '', employeeNumber: '' };
    });

    // Save to localStorage whenever employee data changes
    useEffect(() => {
        localStorage.setItem('employeeData', JSON.stringify(employeeData));
    }, [employeeData]);

    const setEmployee = (name, number) => {
        setEmployeeData({ employeeName: name, employeeNumber: number });
    };

    const clearEmployee = () => {
        setEmployeeData({ employeeName: '', employeeNumber: '' });
        localStorage.removeItem('employeeData');
    };

    return (
        <EmployeeContext.Provider value={{ 
            ...employeeData, 
            setEmployee, 
            clearEmployee 
        }}>
            {children}
        </EmployeeContext.Provider>
    );
}

export function useEmployee() {
    const context = useContext(EmployeeContext);
    if (!context) {
        throw new Error('useEmployee must be used within an EmployeeProvider');
    }
    return context;
}
