import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ComponentToPrint } from '../components/ComponentToPrint';
import { useReactToPrint } from 'react-to-print';
import { 
  FaTimes, 
  FaTh, 
  FaUtensils, 
  FaGlassWhiskey, 
  FaPlus, 
  FaMinus, 
  FaCheck,
  FaClipboardList,
  FaBoxes,
  FaChartBar,
  FaFileInvoiceDollar,
  FaFire,
  FaCog
} from 'react-icons/fa';
import { GiRiceCooker } from 'react-icons/gi';  // Changed from GiRiceBowl
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Card, Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { useSettings } from '../context/SettingsContext';

function POSPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bill, setBill] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toLocaleString());
  const [filter, setFilter] = useState('all');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [newItemIds, setNewItemIds] = useState([]);

  const roundToNearestHalf = (num) => {
    const decimal = num - Math.floor(num);
    if (decimal === 0.5) return num;
    return decimal > 0.5 ? Math.ceil(num) : Math.floor(num);
  };

  const billTotalTax = roundToNearestHalf(totalAmount * (settings.taxRate / 100));

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await axios.get('http://localhost:5000/products');
      setProducts(result.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.category === filter;
  });

  function addProductToBill(product) {
    let findProductInBill = bill.find(i => i.id === product.id);

    if (findProductInBill) {
      let newBill = bill.map(billItem => {
        if (billItem.id === product.id) {
          return {
            ...billItem,
            quantity: billItem.quantity + 1,
            totalAmount: (billItem.quantity + 1) * parseFloat(billItem.price)
          };
        }
        return billItem;
      });
      setBill(newBill);
    } else {
      let addingProduct = {
        ...product,
        quantity: 1,
        totalAmount: parseFloat(product.price)
      };
      setBill([...bill, addingProduct]);
      setNewItemIds(prev => [...prev, product.id]);
      setTimeout(() => {
        setNewItemIds(prev => prev.filter(id => id !== product.id));
      }, 500); // Changed from 300 to 500 to match new animation duration
    }
  }

  function updateProductQuantity(product, increment) {
    let findProductInBill = bill.find(i => i.id === product.id);

    if (findProductInBill) {
      let newBill = bill.map(billItem => {
        if (billItem.id === product.id) {
          const newQuantity = billItem.quantity + increment;
          if (newQuantity <= 0) {
            return null;
          }
          return {
            ...billItem,
            quantity: newQuantity,
            totalAmount: newQuantity * parseFloat(billItem.price)
          };
        }
        return billItem;
      }).filter(Boolean);
      setBill(newBill);
    } else if (increment > 0) {
      let addingProduct = {
        ...product,
        quantity: 1,
        totalAmount: parseFloat(product.price)
      };
      setBill([...bill, addingProduct]);
      setNewItemIds(prev => [...prev, product.id]);
      setTimeout(() => {
        setNewItemIds(prev => prev.filter(id => id !== product.id));
      }, 500); // Changed from 300 to 500 to match new animation duration
    }
  }

  const removeItem = (product) => {
    let newBill = bill.filter(billItem => billItem.id !== product.id);
    setBill(newBill);
  };

  const clearBill = () => {
    setShowModal(true);
  };

  const handleConfirmClearBill = () => {
    setBill([]);
    setShowModal(false);
  };

  const componentRef = useRef();

  const saveConfirmedOrder = async (order) => {
    try {
      await axios.post('http://localhost:5001/confirmed-orders', order);
    } catch (error) {
      console.error('Error saving confirmed order:', error);
    }
  };

  const handlePrint = useReactToPrint({
    documentTitle: settings.restaurantName,
    contentRef: componentRef,
    copyCount: settings.printCopies,
    onAfterPrint: async () => {
      const confirmedOrder = {
        date: new Date().toLocaleDateString(),
        confirmedAt: new Date().toISOString(),
        category: filter,
        items: bill,
        employeeName,
        employeeNumber,
        orderNumber: orderNumber.toString().padStart(6, '0'),
        totalIncome: totalAmount,
        categoryIncome: bill.reduce((acc, item) => acc + (item.category === filter ? item.totalAmount : 0), 0),
        productIncome: bill.reduce((acc, item) => acc + item.totalAmount, 0),
        tax: billTotalTax,
        totalIncomeWithTax: totalAmount + billTotalTax
      };
      await saveConfirmedOrder(confirmedOrder);
      incrementOrderNumber();
      setBill([]);
    }
  });

  const handleConfirmOrder = async (orderData) => {
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderData,
          status: 'confirmed',
          date: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm order');
      }

      // Clear the current bill
      setBill([]);
      
      // Show success message
      toast.success('Order confirmed successfully');

    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('Failed to confirm order');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let total = 0;
    bill.forEach(billItem => {
      total += billItem.totalAmount;
    });
    setTotalAmount(total);
  }, [bill]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedEmployeeName = localStorage.getItem('employeeName');
    const savedEmployeeNumber = localStorage.getItem('employeeNumber');
    if (savedEmployeeName && savedEmployeeNumber) {
      setEmployeeName(savedEmployeeName);
      setEmployeeNumber(savedEmployeeNumber);
    } else {
      const params = new URLSearchParams(window.location.search);
      setEmployeeName(params.get('name') || '');
      setEmployeeNumber(params.get('number') || '');
    }
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

  const incrementOrderNumber = () => {
    const newOrderNumber = orderNumber + 1;
    setOrderNumber(newOrderNumber);
    localStorage.setItem('orderNumber', newOrderNumber.toString());
  };

  const categoryIcons = {
    الكل: <FaTh />,
    رز: <GiRiceCooker />,  // Changed from GiRiceBowl
    مشويات: <FaFire />,
    مشروبات: <FaGlassWhiskey />,
    وجبات: <FaUtensils />
  };

  return (
    <>
      <div className="container-fluid">
        <div className="navigation-wrapper">
          <div className="nav-buttons">
            <Link to="/manage-products" className="nav-button">
              <FaBoxes className="nav-icon" />
              <span>إدارة المنتجات</span>
            </Link>
            <Link to="/management" className="nav-button">
              <FaCog className="nav-icon" />
              <span>إدارة النظام</span>
            </Link>
            <Link to="/bills" className="nav-button">
              <FaFileInvoiceDollar className="nav-icon" />
              <span>عرض الفواتير</span>
            </Link>
            <Link to="/sales-reports" className="nav-button">
              <FaChartBar className="nav-icon" />
              <span>تقارير المبيعات</span>
            </Link>
            <Link to="/inventory-reports" className="nav-button">
              <FaClipboardList className="nav-icon" />
              <span>تقارير المخزون</span>
            </Link>
          </div>

          <div className="category-filter">
            {['الكل', 'رز', 'مشويات', 'مشروبات', 'وجبات'].map((category) => (
              <button
                key={category}
                className={`category-btn ${filter === (category === 'الكل' ? 'all' : category) ? 'active' : ''}`}
                onClick={() => setFilter(category === 'الكل' ? 'all' : category)}
              >
                <span className="icon-wrapper">
                  {categoryIcons[category]}
                </span>
                <span className="category-name">{category}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8">
  <div className="products-container">
    {isLoading ? (
      <div className="loading-state">
        <Spinner animation="border" variant="primary" />
        <p>جاري تحميل المنتجات...</p>
      </div>
    ) : error ? (
      <div className="error-state">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      </div>
    ) : (
      <div className="products-grid">
        {filteredProducts.map((product, key) => (
          <div key={key} className="product-card">
            <div className="product-image-wrapper">
              <img 
                src={product.image || 'https://placehold.co/150x150'}
                alt={product.name}
                className="product-image"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/150x150';
                }}
              />
              {bill.find(i => i.id === product.id)?.quantity > 0 && (
                <div className="quantity-badge">
                  {bill.find(i => i.id === product.id)?.quantity}
                </div>
              )}
            </div>
            <div className="product-content p-2">
              <h5 className="product-title">{product.name}</h5>
              <div className="product-price">{product.price} ر.س</div>
              <div className="product-actions mt-3">
                <button 
                  className="action-btn decrease"
                  onClick={() => updateProductQuantity(product, -1)}
                  disabled={!bill.find(i => i.id === product.id)}
                >
                  <FaMinus />
                </button>
                <span className="quantity-display">
                  {bill.find(i => i.id === product.id)?.quantity || 0}
                </span>
                <button 
                  className="action-btn increase"
                  onClick={() => updateProductQuantity(product, 1)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  <style>
    {`
      .products-container {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        padding: 25px; // Increased from 20px
        height: calc(100vh - 180px);
        overflow: hidden; // Changed from overflow-y: auto
      }

      .loading-state, .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); // Increased from 150px
        gap: 30px; // Increased from 25px
        padding: 20px; // Increased from 15px
        height: 100%; // Added height
      }

      .product-card {
        height: 100%; // Added to ensure consistent height
        display: flex; // Added
        flex-direction: column; // Added
        background: #ffffff;
        border-radius: 15px; // Increased from 12px
        overflow: hidden;
        transition: all 0.3s ease;
        border: 1px solid #e5e9f2;
        position: relative;
        margin: 5px; // Added margin all around
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); // Added subtle shadow for depth
      }

      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      .product-image-wrapper {
        position: relative;
        padding-top: 65%; // Adjusted from 60%
        background: #f8f9fa;
        overflow: hidden;
      }

      .product-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .product-card:hover .product-image {
        transform: scale(1.05);
      }

      .quantity-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #3699ff;
        color: white;
        border-radius: 50%;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.9rem;
        box-shadow: 0 2px 4px rgba(54, 153, 255, 0.3);
      }

      .product-content {
        flex: 1; // Added to ensure proper spacing
        display: flex; // Added
        flex-direction: column; // Added
        padding: 20px; // Increased from 15px
      }

      .product-title {
        margin: 0;
        font-size: 1rem; // Increased from 0.9rem
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 12px; // Increased from 8px
        height: 36px; // Increased from 32px
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .product-price {
        color: #3699ff;
        font-weight: bold;
        font-size: 1.2rem; // Increased from 1.1rem
        margin-bottom: 15px; // Increased from 12px
      }

      .product-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f8f9fa;
        border-radius: 20px;
        padding: 5px;
        margin-top: auto;
      }

      .action-btn {
        background: #e9ecef;
        border: none;
        color: #2c3e50;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.8rem;
      }

      .action-btn:hover {
        background: #dee2e6;
        transform: translateY(-1px);
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .action-btn.decrease {
        background: #e9ecef;
        color: #2c3e50;
      }

      .action-btn.increase {
        background: #e9ecef;
        color: #2c3e50;
      }

      .quantity-display {
        color: #2c3e50;
        margin: 0 10px;
        min-width: 20px;
        text-align: center;
        font-weight: 500;
        font-size: 0.9rem;
      }

      .product-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f8f9fa;
        border-radius: 20px; // Changed from 10px to match bill style
        padding: 8px 12px; // Adjusted padding
        margin-top: auto; // Added to push to bottom
      }

      .action-btn {
        background: #e9ecef; // Updated background
        border: none;
        color: #2c3e50;
        width: 25px; // Changed from 32px
        height: 25px; // Changed from 32px
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .action-btn:hover {
        background: #dee2e6;
        transform: translateY(-1px);
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .quantity-display {
        color: #2c3e50;
        margin: 0 10px;
        min-width: 20px;
        text-align: center;
        font-weight: 500;
        font-size: 0.95rem;
      }

      @media (max-width: 768px) {
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); // Reduced for mobile
          gap: 20px; // Adjusted for mobile
          padding: 12px;
        }

        .product-title {
          font-size: 0.9rem; // Further reduced for mobile
          height: 32px; // Reduced height for mobile
        }

        .product-price {
          font-size: 0.9rem; // Reduced for mobile
        }

        .product-content {
          padding: 15px;
        }
      }

      @media (max-width: 1200px) {
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 25px; // Adjusted for medium screens
          padding: 15px;
        }
      }
    `}
  </style>
</div>
          <div className="col-lg-4">
  <div style={{ display: 'none' }}>
    <ComponentToPrint 
      bill={bill} 
      ref={componentRef} 
      employeeName={employeeName} 
      employeeNumber={employeeNumber}
      orderNumber={orderNumber}
      isRefunded={false}  // Since this is for new bills
    />
  </div>
  <div className="bill-container">
    <div className="bill-header">
      <h4 className="text-center mb-3">الفاتورة</h4>
      <div className="bill-info">
        <div className="info-row">
          <span className="info-label">التاريخ:</span>
          <span className="info-value">{currentDateTime}</span>
        </div>
        <div className="info-row">
          <span className="info-label">رقم الفاتورة:</span>
          <span className="info-value">#{orderNumber.toString().padStart(6, '0')}</span>
        </div>
        <div className="info-row">
          <span className="info-label">الموظف:</span>
          <span className="info-value">{employeeName} (#{employeeNumber})</span>
        </div>
      </div>
    </div>

    <div className="bill-content">
      {bill.length === 0 ? (
        <div className="empty-bill">
          <i className="fas fa-receipt fa-3x mb-2"></i>
          <p>لا يوجد منتجات في الفاتورة</p>
        </div>
      ) : (
        <div className="bill-items">
          {bill.map((billItem, key) => (
            <div 
              key={key} 
              className={`bill-item ${newItemIds.includes(billItem.id) ? 'new-item-animation' : ''}`}
            >
              <div className="item-header">
                <div className="item-info">
                  <img 
                    src={billItem.image || 'https://placehold.co/150x150'} 
                    alt={billItem.name}
                    className="item-image"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/150x150';
                    }}
                  />
                  <div>
                    <span className="item-name">{billItem.name}</span>
                    <span className="unit-price">{billItem.price} ر.س</span>
                  </div>
                </div>
                <button className='remove-item' onClick={() => removeItem(billItem)}>
                  <FaTimes size={12} />
                </button>
              </div>
              <div className="item-details">
                <div className="quantity-controls">
                  <button onClick={() => updateProductQuantity(billItem, -1)}>-</button>
                  <span>{billItem.quantity}</span>
                  <button onClick={() => updateProductQuantity(billItem, 1)}>+</button>
                </div>
                <span className="total-price">{billItem.totalAmount.toFixed(2)} ر.س</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="bill-footer">
      <div className="totals">
        <div className="total-row">
          <span>المجموع الفرعي:</span>
          <span>{Math.ceil(totalAmount)} ر.س</span>
        </div>
        <div className="total-row">
          <span>الضريبة (15%):</span>
          <span>{billTotalTax.toFixed(2)} ر.س</span>
        </div>
        <div className="total-row grand-total">
          <span>الإجمالي:</span>
          <span>{(totalAmount + billTotalTax).toFixed(1)} ر.س</span>
        </div>
      </div>
      
      {bill.length > 0 && (
        <div className="action-buttons">
          <button className="btn-clear" onClick={clearBill}>
            <FaTimes className="me-2" />
            حذف الكل
          </button>
          <button className="btn-confirm" onClick={handlePrint}>
            <FaCheck className="me-2" />
            إتمام الطلب
          </button>
        </div>
      )}
    </div>
  </div>

  <style>
    {`
      .bill-container {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        height: calc(100vh - 100px);
        margin: 10px 0;
      }

      .bill-header {
        background: #ffffff;
        padding: 15px;
        border-radius: 10px 10px 0 0;
        border-bottom: 1px solid #e9ecef;
      }

      .bill-header h4 {
        color: #2c3e50;
        margin: 0;
        font-weight: bold;
      }

      .bill-info {
        margin-top: 10px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        color: #6c757d;
        margin: 5px 0;
        font-size: 0.9rem;
      }

      .bill-content {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
      }

      .empty-bill {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #6c7293;
      }

      .bill-item {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        transition: all 0.3s ease;
      }

      .bill-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .item-image {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        object-fit: cover;
        border: 2px solid #323248;
      }

      .item-name {
        color: #2c3e50;
        font-weight: 500;
        display: block;
        margin-bottom: 2px;
      }

      .unit-price {
        color: #6c757d;
        font-size: 0.85rem;
        display: block;
      }

      .item-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        background: #f8f9fa;
        border-radius: 20px;
        padding: 5px;
      }

      .quantity-controls button {
        background: #e9ecef;
        border: none;
        color: #2c3e50;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.3s ease;
      }

      .quantity-controls button:hover {
        background: #dee2e6;
      }

      .quantity-controls span {
        color: #2c3e50;
        margin: 0 10px;
        min-width: 20px;
        text-align: center;
      }

      .total-price {
        color: #007bff;
        font-weight: bold;
      }

      .bill-footer {
        background: #ffffff;
        padding: 15px;
        border-radius: 0 0 10px 10px;
        border-top: 1px solid #e9ecef;
      }

      .totals {
        margin-bottom: 15px;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        color: #6c757d;
        margin: 5px 0;
      }

      .grand-total {
        color: #2c3e50;
        font-size: 1.2rem;
        font-weight: bold;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e9ecef;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .btn-clear, .btn-confirm {
        border: none;
        padding: 12px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .btn-clear {
        background: #dc3545;
      }

      .btn-confirm {
        background: #28a745;
      }

      .btn-clear:hover, .btn-confirm:hover {
        transform: translateY(-2px);
        filter: brightness(110%);
      }

      .remove-item {
        background: rgba(220, 53, 69, 0.1);
        border: none;
        color: #dc3545;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .remove-item:hover {
        background: #dc3545;
        color: white;
      }

      /* Updated scrollbar styling */
      .bill-content::-webkit-scrollbar {
        width: 6px;
      }

      .bill-content::-webkit-scrollbar-track {
        background: #f8f9fa;
      }

      .bill-content::-webkit-scrollbar-thumb {
        background: #dee2e6;
        border-radius: 3px;
      }

      .bill-content::-webkit-scrollbar-thumb:hover {
        background: #adb5bd;
      }

      .new-item-animation {
        animation: slideInRightWithFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        background-color: rgba(11, 183, 131, 0.1);
      }

      .new-item-animation:hover {
        background-color: rgba(11, 183, 131, 0.15);
      }
    `}
  </style>
</div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تأكيد الحذف</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          هل أنت متأكد أنك تريد حذف كل المنتجات من الفاتورة؟
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>إلغاء</Button>
          <Button variant="danger" onClick={handleConfirmClearBill}>حذف الكل</Button>
        </Modal.Footer>
      </Modal>

      <style>
        {`
          .border-end {
            border-right: 1px solid #6c757d !important;
          }
          .border-bottom {
            border-bottom: 1px solid #6c757d !important;
          }
          @media (max-width: 1024px) {
            .btn {
              font-size: 1rem;
              padding: 8px 16px;
            }
            .btn span {
              font-size: 1.4rem;
            }
            .quantity-box {
              width: 45px;
              height: 35px;
              line-height: 35px;
              font-size: 0.9rem;
            }
            .filter-btn {
              min-width: 100px;
            }
          }
          @media (max-width: 768px) {
            .table-responsive {
              overflow-x: auto;
            }
            .btn {
              font-size: 0.9rem;
              padding: 8px 16px;
            }
            .btn span {
              font-size: 1.2rem;
            }
            .quantity-box {
              width: 40px;
              height: 30px;
              line-height: 30px;
              font-size: 0.9rem;
            }
            .filter-btn {
              min-width: 100px;
            }
            .col-lg-8, .col-lg-4 {
              flex: 0 0 100%;
              max-width: 100%;
            }
          }
          @media (max-width: 576px) {
            .btn {
              font-size: 0.8rem;
              padding: 6px 12px;
            }
            .btn span {
              font-size: 1rem;
            }
            .quantity-box {
              width: 35px;
              height: 25px;
              line-height: 25px;
              font-size: 0.8rem;
            }
            .filter-btn {
              min-width: 80px;
            }
            .col-lg-8, .col-lg-4 {
              flex: 0 0 100%;
              max-width: 100%;
            }
          }
          .btn {
            flex: 1;
            min-width: 120px;
            font-size: 1.1rem;
            padding: 10px 20px;
            position: relative;
            transition: box-shadow 0.3s ease;
          }
          .btn:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .btn-sm {
            min-width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .btn-warning {
            background-color: rgb(255, 123, 0);
          }
          .btn-outline-warning {
            border-color: rgb(255, 123, 0);
            color: rgb(255, 123, 0);
          }
          .btn-outline-warning:hover {
            background-color: rgb(255, 123, 0);
            color: white;
          }
          .btn span {
            color: black;
            font-weight: bold;
            text-shadow: 1px 1px 2px white;
            font-size: 1.6rem;
          }
          .btn:hover .category-text {
            animation: colorChange 2s infinite;
          }
          .btn.selected .category-text {
            color: white;
            animation: none;
          }
          @keyframes colorChange {
            0% { color: black; }
            50% { color: white; }
            100% { color: black; }
          }
          .quantity-box {
            display: inline-block;
            width: 50px;
            height: 40px;
            line-height: 40px;
            text-align: center;
            background-color: #f8f9fa;
            border: 1px solid #6c757d;
            border-radius: 5px;
            font-size: 1rem;
            font-weight: bold;
          }
          .filter-btn {
            border-radius: 50px;
            overflow: hidden;
            position: relative;
          }
          .filter-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .filter-btn:hover::before {
            opacity: 1;
          }
          .btn-danger, .btn-success {
            transition: none;
          }
          .btn-danger:hover, .btn-success:hover {
            transform: none;
            box-shadow: none;
          }
          @keyframes slideInRightWithFade {
            0% {
              transform: translateX(50px);
              opacity: 0;
            }
            30% {
              opacity: 0.3;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .new-item-animation {
            animation: slideInRightWithFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            background-color: rgba(40, 167, 69, 0.1);
            transition: background-color 0.5s ease;
          }

          .new-item-animation:hover {
            background-color: rgba(40, 167, 69, 0.2);
          }

          .new-item-animation td {
            position: relative;
            transition: all 0.3s ease;
          }

          .new-item-animation td::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              90deg, 
              transparent 0%,
              rgba(255, 255, 255, 0.2) 50%,
              transparent 100%
            );
            animation: shimmer 0.75s ease-in-out forwards;
            opacity: 0.7;
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            50% {
              opacity: 0.7;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          .navigation-wrapper {
            background: #ffffff;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            margin-bottom: 1.5rem;
          }

          .nav-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .nav-button {
            display: flex;
            align-items: center;
            padding: 1rem 1.5rem;
            background: #f8f9fa;
            border-radius: 10px;
            color: #2c3e50;
            text-decoration: none;
            transition: all 0.3s ease;
            border: 1px solid #e9ecef;
          }

          .nav-button:hover {
            background: #3699ff;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(54, 153, 255, 0.2);
          }

          .nav-icon {
            font-size: 1.25rem;
            margin-right: 0.75rem;
          }

          .category-filter {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            padding: 0.5rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .category-filter::-webkit-scrollbar {
            display: none;
          }

          .category-btn {
            display: flex;
            align-items: center;
            padding: 0.75rem 1.25rem;
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            color: #6c757d;
            font-weight: 500;
            transition: all 0.3s ease;
            white-space: nowrap;
            cursor: pointer;
            min-width: 120px;
            justify-content: center;
          }

          .category-btn:hover {
            background: #f8f9fa;
            border-color: #3699ff;
            color: #3699ff;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(54, 153, 255, 0.1);
          }

          .category-btn.active {
            background: #3699ff;
            border-color: #3699ff;
            color: white;
            box-shadow: 0 4px 12px rgba(54, 153, 255, 0.2);
          }

          .icon-wrapper {
            display: flex;
            align-items: center;
            margin-right: 0.75rem;
            font-size: 1.1rem;
          }

          .category-name {
            font-size: 0.95rem;
          }

          @media (max-width: 768px) {
            .nav-buttons {
              grid-template-columns: repeat(2, 1fr);
            }

            .category-btn {
              padding: 0.6rem 1rem;
              min-width: 100px;
            }

            .category-name {
              font-size: 0.85rem;
            }
          }

          @media (max-width: 576px) {
            .nav-buttons {
              grid-template-columns: 1fr;
            }

            .category-filter {
              gap: 0.75rem;
            }

            .category-btn {
              padding: 0.5rem 0.875rem;
              min-width: 90px;
            }
          }
        `}
      </style>
    </>
  );
}

export default POSPage;