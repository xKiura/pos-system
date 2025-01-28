import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTimes, FaPrint, FaUndo } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { FaFilter, FaCalendar } from 'react-icons/fa';
import { Box } from '@mui/material'; // Add this import
import { useSettings } from '../context/SettingsContext';
import { endpoints } from '../config/api'; // Add this import
import { readFromDb } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Update TopBar styled component
const TopBar = styled('div')(({ theme }) => ({
  fontFamily: 'inherit',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  padding: '0.5rem 1rem',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
  width: '100%',
  flexDirection: 'row-reverse' // Add this to reverse the order for RTL
}));

// Update PageTitle styled component
const PageTitle = styled('h1')(({ theme }) => ({
  fontFamily: 'inherit',
  margin: 0,
  fontSize: '1.5rem',
  color: '#1e293b',
  fontWeight: 600
}));

// Update ActionBar styled component
const ActionBar = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: '1rem',
  alignItems: 'center'
}));

// Update styled components
const StyledContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  direction: rtl;

  .mb-2 {
    direction: ltr;
    text-align: left;
    width: 100%;
  }

  .back-button {
    direction: ltr;
    padding: 8px 16px;
    border-radius: 8px;
    text-decoration: none;
    color: #000;
    background-color: #f8b73f;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
      background-color: #f6a912;
      transform: translateX(-2px);
    }
  }
`;

const BillCard = styled(motion.div)`
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  border: ${props => props.$isRefunded ? '2px solid #ef4444' : '1px solid #e5e7eb'};
  opacity: ${props => props.$isRefunded ? 0.8 : 1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const ActionButton = styled.button`
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  
  &.print {
    background: #28a745;  // Changed to match POSPage green
    color: white;
    &:hover { 
      background: #218838;
      transform: translateY(-2px);
    }
  }
  
  &.refund {
    background: ${props => props.$isRefunded ? '#6c757d' : '#dc3545'};  // Changed to match POSPage red
    color: white;
    &:hover { 
      background: ${props => props.$isRefunded ? '#5a6268' : '#c82333'};
      transform: translateY(-2px);
    }
    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
      transform: none;
    }
  }
`;

const OrderDetails = styled(motion.div)`
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: 0.75rem;
  align-items: center;
  
  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }
`;

const GlobalStyles = styled.div`
  .back-button {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #edf2f7;
    color: #4a5568;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
      transform: translateX(-2px);
    }
  }

.bills-page-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #f8b73f;
    color: #000;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
}

.back-button:hover {
    background-color: #f6a912;
    transform: translateX(-2px);
}

.page-title {
    font-size: 2rem;
    font-weight: 600;
    color: #2d3748;
}

.filters-section {
    display: grid;
    gap: 1rem;
    margin-bottom: 2rem;
    grid-template-columns: 2fr 1fr;
}

.filter-card {
    display: flex;
    gap: 1rem;
    background: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.date-filter,
.category-filter {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    outline: none;
    transition: border-color 0.2s;
}

.summary-card {
    background: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.summary-value {
    font-weight: 600;
    color: #2d3748;
}

.bill-card {
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
}

.bill-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.bill-number-badge {
    background: #f8b73f;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-weight: 600;
}

.items-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.item-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    padding: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.total-row {
    display: flex;
    justify-content: space-between;
    padding: 1rem 0;
    margin-top: 1rem;
    border-top: 2px solid #e2e8f0;
    font-size: 1.1rem;
}

.delete-btn {
    padding: 0.5rem;
    border-radius: 50%;
    border: none;
    background: #fee2e2;
    color: #dc2626;
    cursor: pointer;
    transition: all 0.2s;
}

.delete-btn:hover {
    background: #fecaca;
    transform: scale(1.1);
}
    
  .header-section {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #4a5568;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    background: #edf2f7;
    transition: all 0.2s;
  }

  .back-button:hover {
    background: #e2e8f0;
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: bold;
    color: #2d3748;
    margin: 0;
  }

  .filters-section {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .filter-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-icon {
    color: #4a5568;
  }

  .date-filter,
  .category-filter {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    outline: none;
  }

  .date-filter:focus,
  .category-filter:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
  }

  .summary-card {
    display: flex;
    gap: 2rem;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .summary-label {
    font-size: 0.875rem;
    color: #4a5568;
  }

  .summary-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #2d3748;
  }

  .bills-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .filters-section {
      flex-direction: column;
    }
    
    .filter-card,
    .summary-card {
      width: 100%;
    }
  }
`;

// Update BriefSummary component
const BriefSummary = styled.div`
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px dashed #e2e8f0;
  font-size: 0.875rem;
  color: #64748b;
  
  .items-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .item-chip {
    background: #f1f5f9;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.875rem;
    color: #475569;
  }
`;

// Update FilterCard styled component to accommodate the buttons
const FilterCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 2;

  .buttons-group {
    display: flex;
    gap: 1rem;
    justify-content: flex-start; // Change from flex-end to flex-start
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }

  .filters-row {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 200px;
  }

  @media (max-width: 768px) {
    .filters-row {
      flex-direction: column;
      gap: 1rem;
    }
    
    .filter-group {
      justify-content: center;
    }

    .buttons-group {
      justify-content: center;
    }
  }
`;

const SummaryCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-around;
  flex: 1;

  .summary-item {
    text-align: center;
  }

  .summary-label {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .summary-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
  }
`;

// Arabic translations object
const translations = {
  backToSales: 'العودة لصفحة المبيعات',
  billManagement: 'إدارة الفواتير',
  items: 'العناصر',
  total: 'المجموع',
  print: 'طباعة',
  refund: 'استرجاع',
  refunded: 'تم الاسترجاع',
  orderDetails: 'تفاصيل الطلب',
  item: 'الصنف',
  quantity: 'الكمية',
  price: 'السعر',
  totalSales: 'إجمالي المبيعات',
  withTax: 'شامل الضريبة',
  more: 'المزيد',
  billsManagement: 'إدارة الفواتير',
  searchBill: 'بحث عن فاتورة',
  searchPlaceholder: 'بحث عن الفاتورة',
  saveReport: 'حفظ تقرير الفواتير',
  viewReports: 'عرض التقارير السابقة',
  reportsModal: {
    title: 'تقارير الفواتير',
    date: 'التاريخ',
    employee: 'الموظف',
    totalBills: 'عدد الفواتير',
    totalAmount: 'المجموع',
    totalTax: 'الضريبة',
    totalWithTax: 'الإجمالي مع الضريبة',
    close: 'إغلاق',
    print: 'طباعة التقرير',
  },
};

const categories = ['الكل', 'رز', 'مشويات', 'مشروبات', 'وجبات'];

const roundToNearestHalf = (num) => {
  const decimal = num - Math.floor(num);
  if (decimal === 0.5) return num;
  return decimal > 0.5 ? Math.ceil(num) : Math.floor(num);
};

// Add new styled component after other styled components
const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 200px;
  direction: rtl;
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
`;

// Add this styled component after other styled components
const ReportButton = styled(Button)`
  &.save-report {
    background-color: #28a745;
    border-color: #28a745;
    color: white;
    &:hover {
      background-color: #218838;
      border-color: #1e7e34;
    }
  }
  
  &.view-reports {
    background-color: #f8b73f;
    border-color: #f8b73f;
    color: #000;
    &:hover {
      background-color: #f6a912;
      border-color: #f6a912;
    }
  }
`;

// Add this helper function near the top with other utility functions
const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return {
    date: date.toLocaleDateString('en-GB'),
    time: date.toLocaleTimeString('en-GB')
  };
};

function BillsPage() {
    const { settings } = useSettings();
    const [dateFilter, setDateFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('الكل');
    const [totalProfit, setTotalProfit] = useState(0);
    const [totalWithTax, setTotalWithTax] = useState(0);
    const [productSales, setProductSales] = useState({});
    const [confirmedOrders, setConfirmedOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [employeeName, setEmployeeName] = useState('');
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [orderNumber, setOrderNumber] = useState(1);
    const [refundedOrders, setRefundedOrders] = useState(new Set());
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [orderToRefund, setOrderToRefund] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const savedEmployeeName = localStorage.getItem('employeeName');
        const savedEmployeeNumber = localStorage.getItem('employeeNumber');
        if (savedEmployeeName && savedEmployeeNumber) {
            setEmployeeName(savedEmployeeName);
            setEmployeeNumber(savedEmployeeNumber);
        }
        fetchConfirmedOrders();
    }, []);

    useEffect(() => {
        const savedOrderNumber = localStorage.getItem('orderNumber');
        const lastResetDate = localStorage.getItem('lastResetDate');
        const today = new Date().toLocaleDateString();

        if (savedOrderNumber && lastResetDate === today) {
            setOrderNumber(parseInt(savedOrderNumber, 10));
        } else {
            localStorage.setItem('orderNumber', '1');
            localStorage.setItem('lastResetDate', today);
            setOrderNumber(1);
        }
    }, []);

    useEffect(() => {
        filterOrders();
    }, [confirmedOrders, dateFilter, categoryFilter, searchQuery]);

    const fetchConfirmedOrders = async () => {
        try {
            const response = await axios.get('http://localhost:5000/confirmed-orders');
            
            if (response.data && Array.isArray(response.data)) {
                const ordersWithDateTime = response.data.map(order => {
                    const date = new Date(order.date || order.confirmedAt);
                    return {
                        ...order,
                        date: date.toLocaleDateString('en-GB'),
                        time: date.toLocaleTimeString('en-GB')
                    };
                });
                console.log('Processed orders:', ordersWithDateTime.length, 'orders found'); // Modified debug log
                setConfirmedOrders(ordersWithDateTime);
                setFilteredOrders(ordersWithDateTime);
            } else {
                console.error('Invalid data format received:', response.data);
                setConfirmedOrders([]);
                setFilteredOrders([]);
            }
        } catch (error) {
            console.error('Error fetching confirmed orders:', error);
            setConfirmedOrders([]);
            setFilteredOrders([]);
        }
    };

    // Update useEffect to include error handling
    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchConfirmedOrders();
            } catch (error) {
                console.error('Error in useEffect:', error);
            }
        };
        fetchData();
    }, []);

    const filterOrders = () => {
        let filtered = [...confirmedOrders];
        
        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(order => 
                order.orderNumber.toString().includes(searchQuery)
            );
        }
        
        if (dateFilter) {
            filtered = filtered.filter(order => order.date === dateFilter);
        }
        
        if (categoryFilter !== 'الكل') {
            filtered = filtered.filter(order => 
                order.items.some(item => item.category === categoryFilter)
            );
        }
        
        setFilteredOrders(filtered);
        calculateProfits(filtered);
    };

    const calculateProfits = (orders) => {
        let totalProfit = 0;
        let productSales = {};

        orders.forEach(order => {
            // Skip refunded orders in calculations
            if (order.isRefunded) return;

            order.items.forEach(item => {
                if (categoryFilter !== 'الكل' && item.category !== categoryFilter) {
                    return;
                }
                if (!productSales[item.name]) {
                    productSales[item.name] = { quantity: 0, total: 0 };
                }
                productSales[item.name].quantity += item.quantity;
                productSales[item.name].total += item.price * item.quantity;
                totalProfit += item.price * item.quantity;
            });
        });

        setTotalProfit(totalProfit);
        setProductSales(productSales);
        const tax = roundToNearestHalf(totalProfit * 0.15);
        setTotalWithTax(totalProfit + tax);
    };

    const toggleOrderDetails = (orderNumber) => {
        setExpandedOrder(expandedOrder === orderNumber ? null : orderNumber);
    };

    const handleDeleteAll = async () => {
        try {
            await axios.delete('http://localhost:5000/confirmed-orders');
            setConfirmedOrders([]);
            setFilteredOrders([]);
            setShowModal(false);
            localStorage.setItem('orderNumber', '1');
            setOrderNumber(1);
        } catch (error) {
            console.error('Error deleting all confirmed orders:', error);
        }
    };

    const handleDeleteOrder = async (orderNumber) => {
        const orderExists = confirmedOrders.some(order => order.orderNumber === orderNumber);
        if (!orderExists) {
            alert('Order not found.');
            return;
        }

        console.log(`Attempting to delete order number: ${orderNumber}`);

        try {
            const response = await axios.delete(`http://localhost:5000/confirmed-orders/${parseInt(orderNumber, 10)}`);
            console.log('Delete response:', response);
            setConfirmedOrders(confirmedOrders.filter(order => order.orderNumber !== orderNumber));
            setFilteredOrders(filteredOrders.filter(order => order.orderNumber !== orderNumber));
            localStorage.setItem('confirmedOrders', JSON.stringify(confirmedOrders.filter(order => order.orderNumber !== orderNumber)));
            setShowDeleteModal(false);
            await logBillChange('BILL_DELETE', orderNumber);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.error('Order not found:', error);
                alert('Order not found.');
            } else {
                console.error('Error deleting order:', error);
            }
        }
    };

    // Add print functionality
    const handlePrint = async (order) => {
        const totalAmount = order.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
        const tax = Math.round(totalAmount * 0.15);
        const totalWithTax = totalAmount + tax;

        const printContent = `
            <div style="font-family: Arial, sans-serif; text-align: center; direction: rtl;">
                <h2 style="margin: 0;">${settings?.restaurantName || 'مطعمي'}</h2>
                <p style="margin: 5px 0;">رقم الفاتورة: ${order.orderNumber}</p>
                <p style="margin: 5px 0;">${order.date} ${order.time}</p>
                <p style="margin: 5px 0;">الموظف: ${order.employeeName} (#${order.employeeNumber})</p>
                ${order.isRefunded ? '<p style="color: red; font-weight: bold;">تم الاسترجاع</p>' : ''}
                
                <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 10px 0; padding: 10px 0;">
                    <table style="width: 100%; text-align: right;">
                        <tr style="font-weight: bold;">
                            <td>الصنف</td>
                            <td>الكمية</td>
                            <td>السعر</td>
                            <td>المجموع</td>
                        </tr>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${parseFloat(item.price).toFixed(2)}</td>
                                <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div style="text-align: left; margin-top: 10px;">
                    <p style="margin: 5px 0;">المجموع: ${totalAmount.toFixed(2)}</p>
                    <p style="margin: 5px 0;">الضريبة (15%): ${tax.toFixed(2)}</p>
                    <p style="font-weight: bold; margin: 5px 0;">الإجمالي مع الضريبة: ${totalWithTax.toFixed(2)}</p>
                </div>

                <p style="margin-top: 20px;">شكراً لزيارتكم</p>
            </div>
        `;

        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>فاتورة #${order.orderNumber}</title>
                    <meta charset="UTF-8">
                </head>
                <body style="margin: 20px;">
                    ${printContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            }
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        await logBillChange('BILL_REPRINT', order.orderNumber);
    };

    // Add refund functionality
    const initiateRefund = (order) => {
        setOrderToRefund(order);
        setShowRefundModal(true);
    };

    const confirmRefund = async () => {
        if (!orderToRefund) return;

        try {
            const currentEmployeeName = localStorage.getItem('employeeName');
            const currentEmployeeNumber = localStorage.getItem('employeeNumber');
        
            if (!currentEmployeeName || !currentEmployeeNumber) {
                toast.error('معلومات الموظف غير متوفرة');
                setShowRefundModal(false);
                return;
            }
        
            const paddedOrderNumber = orderToRefund.orderNumber.toString().padStart(6, '0');
            
            const response = await axios.post(
                `http://localhost:5000/refund-order/${paddedOrderNumber}`,
                {
                    employeeName: currentEmployeeName,
                    employeeNumber: currentEmployeeNumber
                }
            );
        
            if (response.data.success) {
                const updatedOrders = confirmedOrders.map(o => 
                    o.orderNumber === orderToRefund.orderNumber 
                        ? { ...o, isRefunded: true, refundedAt: new Date().toISOString() }
                        : o
                );
                setConfirmedOrders(updatedOrders);
                
                const newFiltered = updatedOrders.filter(o => 
                    (!dateFilter || o.date === dateFilter) && 
                    (categoryFilter === 'الكل' || o.items.some(item => item.category === categoryFilter))
                );
                setFilteredOrders(newFiltered);
                calculateProfits(newFiltered);
                
                setRefundedOrders(prev => new Set([...prev, orderToRefund.orderNumber]));
                
                await logBillChange('BILL_REFUND', orderToRefund.orderNumber);
                toast.success('تم استرجاع الفاتورة بنجاح');
            } else {
                throw new Error(response.data.error || 'Failed to process refund');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            const errorMessage = error.response?.data?.error || 'فشل في استرجاع الفاتورة';
            toast.error(`${errorMessage}. الرجاء المحاولة مرة أخرى.`);
        }
        setShowRefundModal(false);
    };

    const logBillChange = async (action, billNumber) => {
        try {
            const currentEmployeeName = localStorage.getItem('employeeName');
            const currentEmployeeNumber = localStorage.getItem('employeeNumber');

            if (!currentEmployeeName || !currentEmployeeNumber) {
                console.error('Employee information not found');
                return;
            }

            const logData = {
                timestamp: new Date().toISOString(),
                employeeName: currentEmployeeName,
                employeeNumber: currentEmployeeNumber,
                action,
                billNumber
            };

            console.log('Sending bill change log:', logData);
            await axios.post('http://localhost:5000/bills-history', logData);
        } catch (error) {
            console.error('Error logging bill change:', error);
        }
    };

    // Add the handleSaveReport function
    const handleSaveReport = async () => {
        try {
          // Ensure we have valid orders to process
          const allOrders = filteredOrders || [];
          const activeOrders = allOrders.filter(order => !order.isRefunded);
          const refundedOrders = allOrders.filter(order => order.isRefunded);
      
          // Safe calculation helper function
          const calculateOrderTotal = (order) => {
            try {
              return order.items.reduce((sum, item) => {
                const price = parseFloat(item.price || 0);
                const quantity = parseInt(item.quantity || 0, 10);
                return sum + (price * quantity);
              }, 0);
            } catch (error) {
              console.error('Error calculating order total:', error);
              return 0;
            }
          };
      
          // Calculate totals with error handling
          const activeTotals = activeOrders.reduce((acc, order) => {
            const subtotal = calculateOrderTotal(order);
            const tax = Math.round(subtotal * 0.15);
            return {
              totalAmount: (acc.totalAmount || 0) + subtotal,
              totalTax: (acc.totalTax || 0) + tax,
              totalWithTax: (acc.totalWithTax || 0) + subtotal + tax
            };
          }, { totalAmount: 0, totalTax: 0, totalWithTax: 0 });
      
          const refundedTotals = refundedOrders.reduce((acc, order) => {
            const subtotal = calculateOrderTotal(order);
            const tax = Math.round(subtotal * 0.15);
            return {
              totalAmount: (acc.totalAmount || 0) + subtotal,
              totalTax: (acc.totalTax || 0) + tax,
              totalWithTax: (acc.totalWithTax || 0) + subtotal + tax
            };
          }, { totalAmount: 0, totalTax: 0, totalWithTax: 0 });
      
          // Safely get date range
          const dates = allOrders
            .map(order => order.date ? new Date(order.date) : null)
            .filter(date => date !== null);
          
          const minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
          const maxDate = dates.length ? new Date(Math.max(...dates)) : new Date();
      
          const reportData = {
            id: Date.now(), // Add unique ID for the report
            employeeName: localStorage.getItem('employeeName') || 'غير محدد',
            employeeNumber: localStorage.getItem('employeeNumber') || 'غير محدد',
            timestamp: new Date().toISOString(),
            reportPeriod: {
              from: dateFilter || minDate.toLocaleDateString('en-GB'),
              to: dateFilter || maxDate.toLocaleDateString('en-GB'),
              category: categoryFilter || 'الكل'
            },
            summary: {
              totalBills: allOrders.length || 0,
              completedBills: activeOrders.length || 0,
              refundedBills: refundedOrders.length || 0,
              grossAmount: activeTotals.totalAmount || 0,
              refundedAmount: refundedTotals.totalAmount || 0,
              netAmount: (activeTotals.totalAmount || 0) - (refundedTotals.totalAmount || 0),
              grossTax: activeTotals.totalTax || 0,
              refundedTax: refundedTotals.totalTax || 0,
              netTax: (activeTotals.totalTax || 0) - (refundedTotals.totalTax || 0),
              totalWithTax: (activeTotals.totalWithTax || 0) - (refundedTotals.totalWithTax || 0)
            },
            bills: allOrders.map(order => {
              try {
                const subtotal = calculateOrderTotal(order);
                const tax = Math.round(subtotal * 0.15);
                
                return {
                  orderNumber: order.orderNumber || 'غير محدد',
                  date: order.date || 'غير محدد',
                  time: order.time || 'غير محدد',
                  employeeName: order.employeeName || 'غير محدد',
                  employeeNumber: order.employeeNumber || 'غير محدد',
                  items: (order.items || []).map(item => ({
                    name: item.name || 'غير محدد',
                    category: item.category || 'غير محدد',
                    price: parseFloat(item.price || 0),
                    quantity: parseInt(item.quantity || 0, 10),
                    total: parseFloat(item.price || 0) * parseInt(item.quantity || 0, 10)
                  })),
                  subtotal: subtotal || 0,
                  tax: tax || 0,
                  totalWithTax: (subtotal + tax) || 0,
                  status: order.isRefunded ? 'مسترجع' : 'مكتمل'
                };
              } catch (error) {
                console.error('Error processing order:', error);
                return null;
              }
            }).filter(order => order !== null) // Remove any failed order processing
          };
      
          const response = await axios.post('http://localhost:5000/reports', reportData);
          
          if (response.data.success) {
            toast.success('تم حفظ التقرير بنجاح');
            printReport(reportData);
          } else {
            throw new Error('Failed to save report');
          }
        } catch (error) {
          console.error('Error saving report:', error);
          toast.error('فشل في حفظ التقرير');
        }
      };
      
      const fetchReports = async () => {
        try {
          const response = await axios.get('http://localhost:5000/reports');
          setReports(response.data);
          setShowReportsModal(true);
        } catch (error) {
          console.error('Error fetching reports:', error);
          toast.error('فشل في تحميل التقارير');
        }
      };
      
      const printReport = (reportData) => {
        try {
          if (!reportData || !reportData.summary) {
            throw new Error('Invalid report data');
          }
      
          const { date, time } = formatDateTime(reportData.timestamp || new Date().toISOString());
          
          const printContent = `
            <div style="font-family: Arial, sans-serif; direction: rtl; padding: 20px;">
              <h2 style="text-align: center;">تقرير الفواتير</h2>
              <div style="margin-bottom: 20px;">
                <p>تاريخ التقرير: ${date || 'غير محدد'}</p>
                <p>وقت التقرير: ${time || 'غير محدد'}</p>
                <p>الموظف: ${reportData.employeeName} (#${reportData.employeeNumber})</p>
                <p>الفترة: ${reportData.reportPeriod.from} إلى ${reportData.reportPeriod.to}</p>
                <p>التصنيف: ${reportData.reportPeriod.category}</p>
              </div>
        
              <div style="margin-bottom: 30px;">
                <h3>ملخص التقرير</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">إجمالي عدد الفواتير:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${reportData.summary.totalBills || 0}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">الفواتير المكتملة:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${reportData.summary.completedBills || 0}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">الفواتير المسترجعة:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${reportData.summary.refundedBills || 0}</td>
                  </tr>
                </table>
        
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 8px; border: 1px solid #ddd;">البيان</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">المبيعات</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">المسترجع</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">الصافي</th>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">المبلغ</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(reportData.summary.grossAmount || 0).toFixed(2)} ريال</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(reportData.summary.refundedAmount || 0).toFixed(2)} ريال</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(reportData.summary.netAmount || 0).toFixed(2)} ريال</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">الضريبة</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(reportData.summary.grossTax || 0).toFixed(2)} ريال</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(reportData.summary.refundedTax || 0).toFixed(2)} ريال</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(reportData.summary.netTax || 0).toFixed(2)} ريال</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">الإجمالي مع الضريبة</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${((reportData.summary.grossAmount || 0) + (reportData.summary.grossTax || 0)).toFixed(2)} ريال</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${((reportData.summary.refundedAmount || 0) + (reportData.summary.refundedTax || 0)).toFixed(2)} ريال</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${(reportData.summary.totalWithTax || 0).toFixed(2)} ريال</td>
                  </tr>
                </table>
              </div>
        
              <div style="margin-bottom: 30px;">
                <h3>تفاصيل الفواتير</h3>
                ${reportData.bills.map(bill => {
                  const { date, time } = formatDateTime(bill.date);
                  return `
                    <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                          <strong>رقم الفاتورة:</strong> ${bill.orderNumber}<br>
                          <strong>التاريخ:</strong> ${date}<br>
                          <strong>الوقت:</strong> ${time}
                        </div>
                        <div>
                          <strong>الموظف:</strong> ${bill.employeeName} (#${bill.employeeNumber})<br>
                          <strong>الحالة:</strong> <span style="color: ${bill.status === 'Refunded' ? 'red' : 'green'}">
                            ${bill.status === 'Refunded' ? 'مسترجع' : 'مكتمل'}
                          </span>
                        </div>
                      </div>
        
                      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                        <tr style="background-color: #f3f4f6;">
                          <th style="padding: 8px; border: 1px solid #ddd;">الصنف</th>
                          <th style="padding: 8px; border: 1px solid #ddd;">التصنيف</th>
                          <th style="padding: 8px; border: 1px solid #ddd;">الكمية</th>
                          <th style="padding: 8px; border: 1px solid #ddd;">السعر</th>
                          <th style="padding: 8px; border: 1px solid #ddd;">المجموع</th>
                        </tr>
                        ${bill.items.map(item => `
                          <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${item.category}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${parseFloat(item.price || 0).toFixed(2)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                      </table>
        
                      <div style="text-align: left; margin-top: 10px;">
                        <p>المجموع: ${(bill.subtotal || 0).toFixed(2)} ريال</p>
                        <p>الضريبة: ${(bill.tax || 0).toFixed(2)} ريال</p>
                        <p style="font-weight: bold;">الإجمالي مع الضريبة: ${((bill.subtotal || 0) + (bill.tax || 0)).toFixed(2)} ريال</p>
                        ${bill.refundInfo ? `
                          <p style="color: red;">
                            تم الاسترجاع في: ${formatDateTime(bill.refundInfo.refundedAt).date} ${formatDateTime(bill.refundInfo.refundedAt).time}<br>
                            بواسطة: ${bill.refundInfo.refundedBy.name} (#${bill.refundInfo.refundedBy.number})
                          </p>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
        
              <div style="margin-top: 30px; text-align: left;">
                <h3>الإجمالي</h3>
                <p>إجمالي المبيعات: ${(reportData.summary.totalAmount || 0).toFixed(2)} ريال</p>
                <p>إجمالي الضريبة: ${(reportData.summary.totalTax || 0).toFixed(2)} ريال</p>
                <p style="font-weight: bold;">الإجمالي النهائي: ${(reportData.summary.totalWithTax || 0).toFixed(2)} ريال</p>
              </div>
            </div>
          `;
      
          const printWindow = window.open('', '', 'width=800,height=600');
          printWindow.document.write(`
            <html>
              <head>
                <title>تقرير الفواتير</title>
                <meta charset="UTF-8">
                <style>
                  @media print {
                    body { padding: 20px; }
                    @page { margin: 1cm; }
                  }
                </style>
              </head>
              <body>
                ${printContent}
                <script>
                  window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                      window.close();
                    }
                  }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        } catch (error) {
          console.error('Error printing report:', error);
          toast.error('فشل في طباعة التقرير');
        }
      };

    // Add the handleDeleteReport function
    const handleDeleteReport = async (reportId) => {
        try {
          await axios.delete(`http://localhost:5000/reports/${reportId}`);
          // Update the reports list by filtering out the deleted report
          setReports(prevReports => prevReports.filter(report => report.id !== reportId));
          toast.success('تم حذف التقرير بنجاح');
        } catch (error) {
          console.error('Error deleting report:', error);
          toast.error('فشل في حذف التقرير');
        }
      };

    // Update the BillCardComponent
    const BillCardComponent = ({ order, onToggle, isExpanded }) => {
        // Helper function to safely format numbers
        const formatPrice = (price) => {
            const number = parseFloat(price);
            return isNaN(number) ? '0.00' : number.toFixed(2);
        };

        const calculateTotalWithTax = (items) => {
            const subtotal = items.reduce((sum, item) => 
              sum + (parseFloat(item.price) * item.quantity), 0
            );
            const tax = roundToNearestHalf(subtotal * 0.15);
            return subtotal + tax;
          };

        // Get a brief summary of items
        const itemsSummary = order.items.slice(0, 3); // Show first 3 items
        const remainingCount = order.items.length - 3;
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
            <BillCard
                $isRefunded={order.isRefunded || refundedOrders.has(order.orderNumber)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="p-4" onClick={() => onToggle(order.orderNumber)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span className="bill-number-badge">#{order.orderNumber}</span>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{order.date}</div>
                                <div style={{ color: '#666' }}>{order.time}</div>
                                <div style={{ 
                                    fontSize: '0.9rem', 
                                    color: '#4b5563', 
                                    marginTop: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{ 
                                        backgroundColor: '#e5e7eb', 
                                        padding: '0.1rem 0.5rem', 
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}>
                                        {order.employeeName} #{order.employeeNumber}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <ActionButton
                                className="print"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(order);
                                }}
                            >
                                <FaPrint /> {translations.print}
                            </ActionButton>
                            <ActionButton
                                className="refund"
                                $isRefunded={order.isRefunded || refundedOrders.has(order.orderNumber)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    initiateRefund(order);
                                }}
                                disabled={order.isRefunded || refundedOrders.has(order.orderNumber)}
                            >
                                <FaUndo />
                                {order.isRefunded || refundedOrders.has(order.orderNumber) ? translations.refunded : translations.refund}
                            </ActionButton>
                        </div>
                    </div>
                </div>

                {/* Add Brief Summary */}
                <BriefSummary>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <strong>{totalItems} {translations.items}</strong> · {translations.total}: ${formatPrice(calculateTotalWithTax(order.items))}
                    </div>
                    <div className="items-preview">
                        {itemsSummary.map((item, index) => (
                            <span key={index} className="item-chip">
                                {item.name} × {item.quantity}
                            </span>
                        ))}
                        {remainingCount > 0 && (
                            <span className="item-chip">+{remainingCount} {translations.more}</span>
                        )}
                    </div>
                </BriefSummary>

                <AnimatePresence>
                    {isExpanded && (
                        <OrderDetails
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <h4 style={{ marginBottom: '1rem' }}>{translations.orderDetails}</h4>
                            <div className="items-table">
                                <ItemRow style={{ fontWeight: 'bold' }}>
                                    <div>{translations.item}</div>
                                    <div>{translations.quantity}</div>
                                    <div>{translations.price}</div>
                                    <div>{translations.total}</div>
                                </ItemRow>
                                {order.items.map((item, index) => (
                                    <ItemRow key={index}>
                                        <div>{item.name}</div>
                                        <div>{item.quantity}</div>
                                        <div>${formatPrice(item.price)}</div>
                                        <div>${formatPrice(item.price * item.quantity)}</div>
                                    </ItemRow>
                                ))}
                                <div className="total-row" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <strong>الإجمالي:</strong>
                                        <strong>
                                            ${formatPrice(order.items.reduce((sum, item) => 
                                                sum + (parseFloat(item.price) * item.quantity), 0
                                            ))}
                                        </strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: '#666' }}>
                                        <strong>شامل الضريبة:</strong>
                                        <strong>
                                            ${formatPrice(
                                                (() => {
                                                    const subtotal = order.items.reduce((sum, item) => 
                                                        sum + (parseFloat(item.price) * item.quantity), 0
                                                    );
                                                    const tax = roundToNearestHalf(subtotal * 0.15);
                                                    return subtotal + tax;
                                                })()
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </OrderDetails>
                    )}
                </AnimatePresence>
            </BillCard>
        );
    };

    return (
        <GlobalStyles>
            <StyledContainer>
                <TopBar>
                    <ActionBar>
                        <Link to="/pos" className="back-button">
                         <FaArrowLeft /> {translations.backToSales}
                        </Link>
                    </ActionBar>
                    <PageTitle>{translations.billsManagement}</PageTitle>
                </TopBar>

                <div className="filters-section">
                    <FilterCard>
                        <div className="buttons-group">
                            <ReportButton 
                                className="save-report"
                                onClick={handleSaveReport} // Updated this line
                            >
                                {translations.saveReport}
                            </ReportButton>
                            <ReportButton 
                                className="view-reports"
                                onClick={fetchReports}
                            >
                                {translations.viewReports}
                            </ReportButton>
                        </div>
                        <div className="filters-row">
                            <div className="filter-group">
                                <SearchInput
                                    type="text"
                                    placeholder={translations.searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <FaCalendar className="filter-icon" />
                                <input
                                    type="date"
                                    className="date-filter"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <FaFilter className="filter-icon" />
                                <select
                                    className="category-filter"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </FilterCard>

                    <SummaryCard>
                        <div className="summary-item">
                            <div className="summary-label">{translations.totalSales}</div>
                            <div className="summary-value">${totalProfit.toFixed(2)}</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">{translations.withTax}</div>
                            <div className="summary-value">${totalWithTax.toFixed(2)}</div>
                        </div>
                    </SummaryCard>
                </div>

                <div className="bills-container">
                    {filteredOrders.map((order) => (
                        <BillCardComponent
                            key={order.orderNumber}
                            order={order}
                            onToggle={toggleOrderDetails}
                            isExpanded={expandedOrder === order.orderNumber}
                        />
                    ))}
                </div>

                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>تأكيد المسح</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>هل أنت متأكد أنك تريد مسح جميع الفواتير؟</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>إلغاء</Button>
                        <Button variant="danger" onClick={handleDeleteAll}>مسح</Button>
                    </Modal.Footer>
                </Modal>

                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>تأكيد المسح</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>هل أنت متأكد أنك تريد مسح هذه الفاتورة؟</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>إلغاء</Button>
                        <Button variant="danger" onClick={() => handleDeleteOrder(orderToDelete)}>مسح</Button>
                    </Modal.Footer>
                </Modal>

                {/* Add the refund confirmation modal */}
                <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>تأكيد الاسترجاع</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        هل أنت متأكد أنك تريد استرجاع الفاتورة رقم {orderToRefund?.orderNumber}؟
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
                            إلغاء
                        </Button>
                        <Button variant="warning" onClick={confirmRefund}>
                            تأكيد الاسترجاع
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Add the reports modal */}
                <Modal show={showReportsModal} onHide={() => setShowReportsModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{translations.reportsModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {reports.map((report) => {
                                const { date, time } = formatDateTime(report.timestamp);
                                const summary = report.summary || {};
                                return (
                                    <div
                                        key={report.id}
                                        style={{
                                            padding: '1rem',
                                            margin: '0.5rem 0',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>{translations.reportsModal.date}:</strong> {date} {time}
                                        </div>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>{translations.reportsModal.employee}:</strong> {report.employeeName} (#{report.employeeNumber})
                                        </div>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>{translations.reportsModal.totalBills}:</strong> {summary.totalBills || 0}
                                            {' ('}مكتمل: {summary.completedBills || 0}, 
                                            مسترجع: {summary.refundedBills || 0}{')'}
                                        </div>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>{translations.reportsModal.totalAmount}:</strong> {(summary.totalAmount || 0).toFixed(2)} ريال
                                        </div>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>{translations.reportsModal.totalTax}:</strong> {(summary.totalTax || 0).toFixed(2)} ريال
                                        </div>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>{translations.reportsModal.totalWithTax}:</strong> {(summary.totalWithTax || 0).toFixed(2)} ريال
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '0.5rem', 
                                            marginTop: '1rem',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => printReport(report)}
                                            >
                                                {translations.reportsModal.print}
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDeleteReport(report.id)}
                                            >
                                                حذف التقرير
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowReportsModal(false)}>
                            {translations.reportsModal.close}
                        </Button>
                    </Modal.Footer>
                </Modal>

            </StyledContainer>
        </GlobalStyles>
    );
}

export default BillsPage;
