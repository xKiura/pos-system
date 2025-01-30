import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTimes, FaPrint, FaUndo, FaFileDownload, FaHistory, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { FaFilter, FaCalendar } from 'react-icons/fa';
import { Box } from '@mui/material'; // Add this import
import { format } from 'date-fns'; // Add this import
import { useSettings } from '../context/SettingsContext';
import { endpoints } from '../config/api'; // Add this import
import { readFromDb } from '../services/api';
import { toast } from 'react-toastify';
import { debounce } from 'lodash'; // Add this import
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

// Update ActionButton styled component
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

  &.revert {
    background: #6366f1;
    color: white;
    padding: 0.5rem 1rem; // Smaller padding
    &:hover { 
      background: #4f46e5;
      transform: translateY(-2px);
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

// Update the single SummaryCard styled component
const SummaryCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  flex: 1;

  .summary-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    width: 100%;
  }

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

  .divider {
    width: 100%;
    height: 1px;
    background: #e2e8f0;
    margin: 1rem 0;
  }

  .refunded {
    color: #dc3545;
  }

  .net-total {
    font-size: 1.25rem;
    color: #2563eb;
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
  revertRefund: 'إلغاء الاسترجاع',
  revertRefundConfirm: 'تأكيد إلغاء الاسترجاع',
  revertRefundMessage: 'هل أنت متأكد أنك تريد إلغاء استرجاع الفاتورة رقم',
  revertRefundSuccess: 'تم إلغاء استرجاع الفاتورة بنجاح',
  revertRefundError: 'فشل في إلغاء استرجاع الفاتورة',
  cancel: "إلغاء",
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

// Update the formatDateTime function
const formatDateTime = (isoString) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return { date: 'غير محدد', time: 'غير محدد' };
    }
    return {
      date: date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      time: date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return { date: 'غير محدد', time: 'غير محدد' };
  }
};

// Add this helper function before the BillsPage component
const calculateOrderTotals = (items) => {
  const subtotal = items.reduce((sum, item) => 
    sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 0)), 0
  );
  const tax = Math.round((subtotal * 0.15) * 100) / 100; // 15% VAT, rounded to 2 decimal places
  return { 
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat((subtotal + tax).toFixed(2))
  };
};

// Update FilterSection styled component
const FilterSection = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FilterCardBox = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.5rem;

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .filter-group {
    position: relative;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #4b5563;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .icon {
      position: absolute;
      right: 1rem;
      color: #9ca3af;
    }

    input, select {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #f9fafb;
      color: #1f2937;
      font-size: 0.875rem;
      transition: all 0.2s;

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        outline: none;
      }
    }
  }
`;

const SummaryBox = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  flex: 1;

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .summary-item {
    background: #f8fafc;
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;

    .label {
      color: #64748b;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0f172a;
      
      &.positive { color: #047857; }
      &.negative { color: #dc2626; }
    }
  }

  .total-section {
    padding-top: 1.5rem;
    border-top: 2px dashed #e2e8f0;
    text-align: left;

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      .label {
        color: #64748b;
        font-size: 0.875rem;
      }

      .value {
        font-size: 1.125rem;
        font-weight: 500;
        color: #0f172a;
      }

      &.final {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;

        .label {
          font-weight: 600;
          color: #0f172a;
          font-size: 1rem;
        }

        .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }
      }
    }
  }
`;

// Add ReportActionButton styled component
const ReportActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;

  &.save {
    background: #047857;
    color: white;
    &:hover { background: #065f46; }
  }

  &.view {
    background: #f59e0b;
    color: white;
    &:hover { background: #d97706; }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

// ...rest of existing styled components...

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
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [billToRevert, setBillToRevert] = useState(null);
  const [totalTax, setTotalTax] = useState(0);
  const [totalRefundedTax, setTotalRefundedTax] = useState(0);
  const [showSaveReportModal, setShowSaveReportModal] = useState(false);

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
    let totalGross = 0;
    let totalTaxAmount = 0;
    let totalRefunded = 0;
    let totalRefundedTax = 0;
    let productSales = {};
  
    orders.forEach(order => {
      const { subtotal, tax, total } = calculateOrderTotals(order.items);
      
      if (order.isRefunded) {
          totalRefunded += subtotal;
          totalRefundedTax += tax;
      } else {
          totalGross += subtotal;
          totalTaxAmount += tax;
          
          order.items.forEach(item => {
              if (categoryFilter !== 'الكل' && item.category !== categoryFilter) {
                  return;
              }
              if (!productSales[item.name]) {
                  productSales[item.name] = { quantity: 0, total: 0 };
              }
              productSales[item.name].quantity += item.quantity;
              productSales[item.name].total += item.price * item.quantity;
          });
      }
  });
  
    setTotalProfit(totalGross);
    setTotalTax(totalTaxAmount);
    setTotalRefunded(totalRefunded);
    setTotalRefundedTax(totalRefundedTax);
    setTotalWithTax(totalGross - totalRefunded);
    setProductSales(productSales);
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
        type: action, // Ensure the correct type is logged
        origin: 'صفحة الفواتير',
        changes: [
          {
            details: `تم ${action === 'BILL_REVERT_REFUND' ? 'إلغاء استرجاع' : 'تغيير'} الفاتورة رقم ${billNumber}`
          }
        ]
      };
  
      console.log('Sending bill change log:', logData);
      await axios.post('http://localhost:5000/bills-history', logData);
    } catch (error) {
      console.error('Error logging bill change:', error);
    }
  };

  // Enhanced save report functionality
  const handleSaveReport = async () => {
    try {
      const currentDate = new Date().toISOString();
      
      // Calculate summary data
      const summary = {
        totalBills: filteredOrders.length,
        completedBills: filteredOrders.filter(o => !o.isRefunded).length,
        refundedBills: filteredOrders.filter(o => o.isRefunded).length,
        grossAmount: totalProfit,
        refundedAmount: -totalRefunded,
        netAmount: totalProfit - totalRefunded,
        grossTax: totalTax,
        refundedTax: -totalRefundedTax,
        netTax: totalTax - totalRefundedTax,
        totalWithTax: (totalProfit + totalTax) - (totalRefunded + totalRefundedTax)
      };
  
      const reportData = {
        id: Date.now(),
        timestamp: currentDate,
        employeeName: localStorage.getItem('employeeName'),
        employeeNumber: localStorage.getItem('employeeNumber'),
        reportPeriod: {
          from: dateFilter || 'all',
          to: dateFilter || 'all',
          category: categoryFilter
        },
        summary: summary,
        bills: filteredOrders.map(order => ({
          ...order,
          calculatedTotals: calculateOrderTotals(order.items)
        }))
      };
  
      const response = await axios.post('http://localhost:5000/reports', reportData);
      
      if (response.data) {
        toast.success('تم حفظ التقرير بنجاح');
        await printReport(reportData);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('فشل في حفظ التقرير');
    }
    setShowSaveReportModal(false);
  };

  // Enhanced fetch reports functionality
  const fetchReports = useCallback(async () => {
    try {
      const response = await axios.get(`${endpoints.reports}`);
      const sortedReports = response.data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setReports(sortedReports);
      setShowReportsModal(true);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('فشل في تحميل التقارير');
    }
  }, []);

  // Add this helper function for date range
  const getDateRange = (orders) => {
    if (!orders.length) {
      const today = format(new Date(), 'dd/MM/yyyy');
      return { from: today, to: today };
    }
  
    const dates = orders.map(order => {
      const [day, month, year] = order.date.split('/');
      return new Date(year, month - 1, day);
    });
  
    const minDate = format(Math.min(...dates), 'dd/MM/yyyy');
    const maxDate = format(Math.max(...dates), 'dd/MM/yyyy');
    
    return { from: minDate, to: maxDate };
  };

  const printReport = (reportData) => {
    const { date, time } = formatDateTime(reportData.timestamp);
    
    const printContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px;">تقرير الفواتير</h2>
        
        <div style="margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin-bottom: 15px;">معلومات التقرير</h3>
          <p><strong>تاريخ التقرير:</strong> ${date}</p>
          <p><strong>وقت التقرير:</strong> ${time}</p>
          <p><strong>الموظف:</strong> ${reportData.employeeName} (#${reportData.employeeNumber})</p>
          <p><strong>الفترة:</strong> ${reportData.reportPeriod.from} إلى ${reportData.reportPeriod.to}</p>
          <p><strong>التصنيف:</strong> ${reportData.reportPeriod.category}</p>
        </div>
  
        <div style="margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin-bottom: 15px;">ملخص التقرير</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p><strong>إجمالي عدد الفواتير:</strong> ${reportData.summary.totalBills}</p>
              <p><strong>الفواتير المكتملة:</strong> ${reportData.summary.completedBills}</p>
              <p><strong>الفواتير المسترجعة:</strong> ${reportData.summary.refundedBills}</p>
            </div>
            <div>
              <p><strong>إجمالي المبيعات:</strong> ${reportData.summary.grossAmount.toFixed(2)} ريال</p>
              <p><strong>إجمالي المسترجع:</strong> ${reportData.summary.refundedAmount.toFixed(2)} ريال</p>
              <p><strong>صافي المبيعات:</strong> ${reportData.summary.netAmount.toFixed(2)} ريال</p>
            </div>
          </div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #dee2e6;">
            <p><strong>إجمالي الضريبة:</strong> ${reportData.summary.grossTax.toFixed(2)} ريال</p>
            <p><strong>ضريبة المسترجع:</strong> ${reportData.summary.refundedTax.toFixed(2)} ريال</p>
            <p style="font-size: 1.2em; margin-top: 10px;"><strong>الإجمالي النهائي مع الضريبة:</strong> ${reportData.summary.totalWithTax.toFixed(2)} ريال</p>
          </div>
        </div>
  
        <h3 style="margin-bottom: 15px;">تفاصيل الفواتير</h3>
        ${reportData.bills.map(bill => {
          const { date, time } = formatDateTime(bill.confirmedAt);
          const totals = bill.calculatedTotals;
          const isRefunded = bill.isRefunded;
          
          return `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid ${isRefunded ? '#dc3545' : '#28a745'}; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div>
                  <strong>رقم الفاتورة:</strong> #${bill.orderNumber}
                  <span style="margin-right: 15px; color: ${isRefunded ? '#dc3545' : '#28a745'}">
                    ${isRefunded ? '(مسترجع)' : '(مكتمل)'}
                  </span>
                </div>
                <div>
                  <strong>التاريخ:</strong> ${date} ${time}
                </div>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <tr style="background: #f8f9fa;">
                  <th style="padding: 8px; border: 1px solid #dee2e6;">الصنف</th>
                  <th style="padding: 8px; border: 1px solid #dee2e6;">الكمية</th>
                  <th style="padding: 8px; border: 1px solid #dee2e6;">السعر</th>
                  <th style="padding: 8px; border: 1px solid #dee2e6;">المجموع</th>
                </tr>
                ${bill.items.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${item.name}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${item.quantity}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${parseFloat(item.price).toFixed(2)}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
              
              <div style="text-align: left; margin-top: 10px;">
                <p>المجموع: ${totals.subtotal.toFixed(2)} ريال</p>
                <p>الضريبة: ${totals.tax.toFixed(2)} ريال</p>
                <p style="font-weight: bold;">الإجمالي: ${(isRefunded ? -totals.total : totals.total).toFixed(2)} ريال</p>
              </div>
            </div>
          `;
        }).join('')}
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

  // Add the handleRevertRefund function
  const handleRevertRefund = async (bill) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/revert-refund/${bill.orderNumber}`,
        {
          employeeName: localStorage.getItem('employeeName'),
          employeeNumber: localStorage.getItem('employeeNumber')
        }
      );

      if (response.data.success) {
        // Update local state
        const updatedOrders = confirmedOrders.map(o => 
          o.orderNumber === bill.orderNumber
            ? { ...o, isRefunded: false, refundedAt: null, refundedBy: null }
            : o
        );
        
        setConfirmedOrders(updatedOrders);
        setFilteredOrders(updatedOrders.filter(o => 
          (!dateFilter || o.date === dateFilter) && 
          (categoryFilter === 'الكل' || o.items.some(item => item.category === categoryFilter))
        ));
        
        setRefundedOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(bill.orderNumber);
          return newSet;
        });
        
        await logBillChange('BILL_REVERT_REFUND', bill.orderNumber);
        toast.success(translations.revertRefundSuccess);
      }
    } catch (error) {
      console.error('Error reverting refund:', error);
      toast.error(translations.revertRefundError);
    }
    setBillToRevert(null);
    setShowRevertModal(false);
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
              {order.isRefunded ? (
                <ActionButton
                  className="revert"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBillToRevert(order);
                    setShowRevertModal(true);
                  }}
                >
                  <FaUndo /> {translations.revertRefund}
                </ActionButton>
              ) : (
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
              )}
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
                    <strong>الصافي:</strong>
                    <strong>
                      ${formatPrice(order.items.reduce((sum, item) => 
                        sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 0)), 0
                      ))}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <strong>اجمالي الضريبة (15%):</strong>
                    <strong>
                      ${formatPrice(
                        roundToNearestHalf(
                          order.items.reduce((sum, item) => 
                            sum + (parseFloat(item.price || 0) * (parseInt(item.quantity) || 0)), 0
                          ) * 0.15
                        )
                      )}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '0.5rem', borderTop: '2px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    <strong>الإجمالي شامل الضريبة:</strong>
                    <strong>
                      ${formatPrice(calculateTotalWithTax(order.items))}
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

  // Update the filter section functionality
  const handleFilterChange = useCallback(debounce((type, value) => {
    switch(type) {
      case 'search':
        setSearchQuery(value);
        break;
      case 'date':
        setDateFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
      default:
        break;
    }
  }, 300), []);

  // Update the filter section JSX
  const renderFilterSection = () => (
    <FilterSection>
      <FilterCardBox>
        <div className="filter-header">
          <div style={{ display: 'flex', gap: '1rem' }}>
            <ReportActionButton className="save" onClick={() => setShowSaveReportModal(true)}>
              <FaFileDownload /> {translations.saveReport}
            </ReportActionButton>
            <ReportActionButton className="view" onClick={fetchReports}>
              <FaHistory /> {translations.viewReports}
            </ReportActionButton>
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>بحث عن فاتورة</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="رقم الفاتورة..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <FaSearch className="icon" />
            </div>
          </div>

          <div className="filter-group">
            <label>التاريخ</label>
            <div className="input-wrapper">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
              <FaCalendar className="icon" />
            </div>
          </div>

          <div className="filter-group">
            <label>التصنيف</label>
            <div className="input-wrapper">
              <select
                value={categoryFilter}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <FaFilter className="icon" />
            </div>
          </div>
        </div>
      </FilterCardBox>

      <SummaryBox>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="label">إجمالي المبيعات</div>
            <div className="value positive">
              {totalProfit.toFixed(2)} ر.س
            </div>
          </div>
          <div className="summary-item">
            <div className="label">إجمالي المسترجع</div>
            <div className="value negative">
              {totalRefunded.toFixed(2)} ر.س
            </div>
          </div>
        </div>

        <div className="total-section">
          <div className="total-row">
            <div className="label">الصافي قبل الضريبة</div>
            <div className="value">
              {(totalProfit - totalRefunded).toFixed(2)} ر.س
            </div>
          </div>
          <div className="total-row">
            <div className="label">إجمالي الضريبة (15%)</div>
            <div className="value">
              {(totalTax - totalRefundedTax).toFixed(2)} ر.س
            </div>
          </div>
          <div className="total-row final">
            <div className="label">الإجمالي النهائي</div>
            <div className="value">
              {(totalProfit - totalRefunded + totalTax - totalRefundedTax).toFixed(2)} ر.س
            </div>
          </div>
        </div>
      </SummaryBox>
    </FilterSection>
  );

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

        {renderFilterSection()}

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
                
                // Calculate the actual totals from the bills data
                const totals = report.bills.reduce((acc, bill) => {
                  if (!bill.items) return acc;
                  
                  const billTotals = calculateOrderTotals(bill.items);
                  if (bill.isRefunded) {
                    acc.refundedAmount += billTotals.subtotal;
                    acc.refundedTax += billTotals.tax;
                  } else {
                    acc.grossAmount += billTotals.subtotal;
                    acc.grossTax += billTotals.tax;
                  }
                  return acc;
                }, {
                  grossAmount: 0,
                  grossTax: 0,
                  refundedAmount: 0,
                  refundedTax: 0
                });
    
                const netAmount = totals.grossAmount - totals.refundedAmount;
                const netTax = totals.grossTax - totals.refundedTax;
                const totalWithTax = netAmount + netTax;
    
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
                      <strong>{translations.reportsModal.date}:</strong> {date}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>{translations.reportsModal.time}:</strong> {time}
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
                      <strong>{translations.reportsModal.totalAmount}:</strong> {totals.grossAmount.toFixed(2)} ريال
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>{translations.reportsModal.totalTax}:</strong> {totals.grossTax.toFixed(2)} ريال
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>{translations.reportsModal.totalWithTax}:</strong> {totalWithTax.toFixed(2)} ريال
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

        {/* Add the revert refund modal */}
        <Modal show={showRevertModal} onHide={() => setShowRevertModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{translations.revertRefundConfirm}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {translations.revertRefundMessage} {billToRevert?.orderNumber}؟
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRevertModal(false)}>
              {translations.cancel}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleRevertRefund(billToRevert)}
            >
              {translations.revertRefund}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add the save report confirmation modal */}
        <Modal 
          show={showSaveReportModal} 
          onHide={() => setShowSaveReportModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>تأكيد حفظ التقرير</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ textAlign: 'right' }}>
              <p>هل تريد حفظ تقرير للفواتير الحالية؟</p>
              <p>سيتم حفظ:</p>
              <ul style={{ paddingRight: '20px' }}>
                <li>عدد الفواتير: {filteredOrders.length}</li>
                <li>إجمالي المبيعات: {totalProfit.toFixed(2)} ريال</li>
                <li>إجمالي المسترجع: {totalRefunded.toFixed(2)} ريال</li>
                <li>الصافي مع الضريبة: {(totalProfit - totalRefunded + totalTax - totalRefundedTax).toFixed(2)} ريال</li>
              </ul>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSaveReportModal(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleSaveReport}>
              حفظ وطباعة التقرير
            </Button>
          </Modal.Footer>
        </Modal>

      </StyledContainer>
    </GlobalStyles>
  );
}

export default BillsPage;