import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
import { useAuth } from '../components/AuthContext';
import { endpoints } from '../config/api';

// Add this utility function at the top
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Add these utility functions near the top of the component
const animateAndRemoveItem = (itemId, callback, delay = 0) => {
  const element = document.querySelector(`[data-bill-item-id="${itemId}"]`);
  if (element) {
    setTimeout(() => {
      element.classList.add('remove-item-animation');
      setTimeout(callback, 300); // Match animation duration
    }, delay);
  } else {
    callback();
  }
};

const animateAndRemoveAllItems = (items, finalCallback) => {
  // Add animation class to all items with staggered delays
  items.forEach((item, index) => {
    animateAndRemoveItem(item.id, () => {
      if (index === items.length - 1) {
        // Only clear the bill after the last animation
        finalCallback();
      }
    }, index * 50); // Stagger the animations
  });
};

// Add these styles to your existing styles section
const stockStyles = {
  productCard: {
    position: 'relative',
    border: '2px solid transparent' // Default transparent border
  },
  outOfStock: {
    borderColor: '#dc3545' // Red border for out of stock
  },
  lowStock: {
    borderColor: '#ffc107' // Orange border for low stock
  },
  inStock: {
    borderColor: 'transparent' // No visible border for in stock
  },
  stockBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    zIndex: 2,
    backdropFilter: 'blur(4px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};

// Stock validation function
const validateStock = async (product, quantity) => {
  try {
    const response = await axios.get(`http://localhost:5000/products/${product.id}`);
    const currentStock = response.data.stock;
    return currentStock >= quantity;
  } catch (error) {
    console.error('Error validating stock:', error);
    return false;
  }
};

// Add this utility function near the other animation utilities
const animateAndClearBill = (items, finalCallback) => {
  if (items.length === 0) {
    finalCallback();
    return;
  }

  // Add animation class to all items with staggered delays
  items.forEach((item, index) => {
    const element = document.querySelector(`[data-bill-item-id="${item.id}"]`);
    if (element) {
      setTimeout(() => {
        element.classList.add('remove-item-animation');
        // If this is the last item, wait for its animation to complete before the callback
        if (index === items.length - 1) {
          setTimeout(finalCallback, 300); // Match animation duration
        }
      }, index * 50); // Stagger the animations
    }
  });
};

function POSPage() {
  const { currentUser } = useAuth();
  const { settings, setSettings } = useSettings();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bill, setBill] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toLocaleString());
  const [filter, setFilter] = useState('all');
  const [orderNumber, setOrderNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [newItemIds, setNewItemIds] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const roundToNearestHalf = (num) => {
    if (!num || isNaN(num)) return 0;
    const decimal = num - Math.floor(num);
    if (decimal === 0.5) return Math.floor(num) + 0.5;  // Keep .5 as is
    return decimal > 0.5 ? Math.ceil(num) : Math.floor(num);  // Round to nearest whole number
  };

  const calculateTotals = useCallback(() => {
    const subtotal = bill.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    const taxRate = settings?.taxRate || 15; // Default to 15% if settings are not loaded
    const rawTax = (subtotal * (taxRate / 100)) || 0;
    const tax = roundToNearestHalf(rawTax);
    const total = subtotal + tax;
    
    return {
      subtotal: subtotal || 0,
      tax: tax || 0,
      total: total || 0,
      taxRate
    };
  }, [bill, settings?.taxRate]);

  // Memoize totals
  const { subtotal, tax, total, taxRate } = useMemo(() => calculateTotals(), [calculateTotals]);

  // Replace the existing bill footer section with this
  const renderBillFooter = () => (
    <div className="bill-footer">
      <div className="totals">
        <div className="total-row">
          <span>المجموع الفرعي:</span>
          <span>{subtotal.toFixed(2)} ر.س</span>
        </div>
        <div className="total-row">
          <span>الضريبة ({taxRate}%):</span>
          <span>{tax.toFixed(2)} ر.س</span>
        </div>
        <div className="total-row grand-total">
          <span>الإجمالي:</span>
          <span>{total.toFixed(2)} ر.س</span>
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
  );

  // Optimize fetchProducts to avoid frequent calls
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('فشل في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filter === 'all') return true;
      return product.category === filter;
    });
  }, [products, filter]);

  // Add debounced filter function
  const debouncedSetFilter = useCallback(
    debounce((newFilter) => {
      setIsFiltering(true);
      setFilter(newFilter);
    }, 150),
    []
  );

  // Optimize product filtering with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleProducts(filteredProducts);
      setIsFiltering(false);
    }, 100); // Reduced from 500ms to 100ms

    return () => clearTimeout(timer);
  }, [filteredProducts]);

  // Define handleProductUpdate before other functions
  const canAddToBill = useCallback((product, quantity = 1) => {
    if (!product.stock || product.stock === 0) {
      toast.error(`المنتج ${product.name} غير متوفر في المخزون`);
      return false;
    }
    
    const currentInBill = bill.find(item => item.id === product.id)?.quantity || 0;
    const newTotal = currentInBill + quantity;
    
    if (newTotal > product.stock) {
      toast.error(`الكمية المطلوبة تتجاوز المخزون المتوفر (${product.stock})`);
      return false;
    }
    
    return true;
  }, [bill]);

  const handleProductUpdate = useCallback((product, increment) => {
    if (increment > 0 && !canAddToBill(product, increment)) {
      return; // Don't proceed if we can't add the item
    }

    setBill(prevBill => {
      const existingItem = prevBill.find(item => item.id === product.id);
      
      if (!existingItem && increment <= 0) return prevBill;

      if (existingItem) {
        const newQuantity = existingItem.quantity + increment;
        if (newQuantity <= 0) {
          // Animate before removing
          animateAndRemoveItem(product.id, () => {
            setBill(prev => prev.filter(item => item.id !== product.id));
          });
          return prevBill; // Keep the item until animation completes
        }
        return prevBill.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, totalAmount: newQuantity * parseFloat(item.price) }
            : item
        );
      }

      return [...prevBill, {
        ...product,
        quantity: 1,
        totalAmount: parseFloat(product.price)
      }];
    });
  }, [canAddToBill]);

  // Optimize addProductToBill with debounce
  const addProductToBill = useCallback(async (product) => {
    const isStockAvailable = await validateStock(product, 1);
    
    if (!isStockAvailable) {
      toast.error(`لا يوجد مخزون كافٍ من ${product.name}`);
      await fetchProducts(); // Refresh products
      return;
    }
  
    handleProductUpdate(product, 1);
    
    setNewItemIds(prev => {
      if (prev.includes(product.id)) return prev;
      return [...prev, product.id];
    });
  
    const removeNewItemId = () => {
      setNewItemIds(prev => prev.filter(id => id !== product.id));
    };
  
    requestAnimationFrame(() => {
      setTimeout(removeNewItemId, 800);
    });
  }, [handleProductUpdate, fetchProducts]);

  // Optimize quantity updates
  const updateProductQuantity = useCallback((product, increment) => {
    if (increment > 0 && !canAddToBill(product, increment)) {
      toast.error(`لا يوجد مخزون كافٍ من ${product.name}`);
      return;
    }
  
    handleProductUpdate(product, increment);
  }, [handleProductUpdate]);

  // Update filter button click handler
  const handleFilterClick = useCallback((newFilter) => {
    debouncedSetFilter(newFilter);
  }, [debouncedSetFilter]);

  // Update the animateAndRemoveItem function
  const animateAndRemoveItem = (itemId, callback) => {
    const element = document.querySelector(`[data-bill-item-id="${itemId}"]`);
    if (element) {
      // Add the animation class
      element.classList.add('remove-item-animation');
      // Wait for animation to complete before removing
      setTimeout(() => {
        callback();
        // Remove the animation class after state update
        element.classList.remove('remove-item-animation');
      }, 300); // Match this with CSS animation duration
    } else {
      callback();
    }
  };

  // Update the removeItem function
  const removeItem = (product) => {
    animateAndRemoveItem(product.id, () => {
      setBill(prevBill => prevBill.filter(item => item.id !== product.id));
    });
  };

  const clearBill = () => {
    setShowModal(true);
  };

  // Update the handleConfirmClearBill function
  const handleConfirmClearBill = () => {
    const itemsToRemove = [...bill];
    if (itemsToRemove.length > 0) {
      animateAndRemoveAllItems(itemsToRemove, () => {
        setBill([]);
        setShowModal(false);
      });
    } else {
      setShowModal(false);
    }
  };

  const componentRef = useRef();

  const saveConfirmedOrder = async (order) => {
    try {
      await axios.post('http://localhost:5000/confirmed-orders', {
        ...order,
        employeeName: currentUser?.name,
        employeeNumber: currentUser?.employeeNumber,
      });
    } catch (error) {
      console.error('Error saving confirmed order:', error);
    }
  };

  // Update the handlePrint function
  const handlePrint = useReactToPrint({
    documentTitle: settings?.restaurantName || 'Receipt',
    contentRef: componentRef,
    copyCount: settings?.printCopies || 1,
    onBeforePrint: async () => {
      try {
        const { subtotal, tax, total } = calculateTotals();
        
        const orderData = {
          date: new Date().toISOString(),
          items: bill.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            totalAmount: item.totalAmount
          })),
          employeeName: currentUser?.name,
          employeeNumber: currentUser?.employeeNumber,
          orderNumber: orderNumber.toString().padStart(6, '0'),
          subtotal,
          tax,
          total
        };

        // Send order to backend
        const response = await axios.post('http://localhost:5000/confirmed-orders', orderData);

        if (response.data.success === false) {
          toast.error('فشل في تأكيد الطلب: ' + (response.data.error || 'خطأ غير معروف'));
          return false;
        }

        // Update products with new stock levels
        setProducts(response.data.updatedProducts);
        
        // Animate and clear the bill
        const currentBillItems = [...bill];
        animateAndClearBill(currentBillItems, () => {
          setBill([]);
          // Increment order number after clearing
          incrementOrderNumber();
        });
        
        toast.success('تم تأكيد الطلب وتحديث المخزون بنجاح');
        return true;

      } catch (error) {
        console.error('Error confirming order:', error);
        toast.error('حدث خطأ أثناء تأكيد الطلب');
        return false;
      }
    }
  });

  const updateProductStock = useCallback((updatedProducts) => {
    setProducts(currentProducts => {
      const newProducts = [...currentProducts];
      updatedProducts.forEach(updatedProduct => {
        const index = newProducts.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          newProducts[index] = updatedProduct;
        }
      });
      return newProducts;
    });
  }, []);

  const confirmOrder = async (orderData) => {
    try {
      const response = await fetch(endpoints.confirmedOrders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      
      // Now updateProductStock is in scope
      updateProductStock(data.updatedProducts);
      return data;
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  };

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
  }, [fetchProducts]);

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

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Add this section to load settings
    const savedSettings = localStorage.getItem('posSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
    
    // ...rest of your existing useEffect code...
  }, []);

  // Add this helper function for stock status
  const getStockStatus = useCallback((product) => {
    const stock = product.stock || 0;
    const minStock = product.minStock || 0;

    if (stock === 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'in-stock';
  }, []);

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="system-controls">
          <div className="system-buttons">
            <Link to="/manage-products" className="system-button">
              <div className="button-content">
                <FaBoxes className="button-icon" />
                <span>إدارة المنتجات</span>
              </div>
            </Link>
            <Link to="/bills" className="system-button">
              <div className="button-content">
                <FaFileInvoiceDollar className="button-icon" />
                <span>عرض الفواتير</span>
              </div>
            </Link>
            <Link to="/sales-reports" className="system-button">
              <div className="button-content">
                <FaChartBar className="button-icon" />
                <span>تقارير المبيعات</span>
              </div>
            </Link>
            <Link to="/inventory-reports" className="system-button">
              <div className="button-content">
                <FaClipboardList className="button-icon" />
                <span>تقارير المخزون</span>
              </div>
            </Link>
            <Link to="/management" className="system-button">
              <div className="button-content">
                <FaCog className="button-icon" />
                <span>إدارة النظام</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-container">
            {['الكل', 'رز', 'مشويات', 'مشروبات', 'وجبات'].map((category) => (
              <button
                key={category}
                className={`filter-button ${filter === (category === 'الكل' ? 'all' : category) ? 'active' : ''}`}
                onClick={() => handleFilterClick(category === 'الكل' ? 'all' : category)}
              >
                <span className="icon-container">
                  {categoryIcons[category]}
                </span>
                <span className="category-label">{category}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="main-content">
          <div className="row g-2"> {/* Changed from g-3 to g-2 for more compact layout */}
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
                    {visibleProducts.map((product, key) => {
                      const stockStatus = getStockStatus(product);
                      const isOutOfStock = stockStatus === 'out-of-stock';
                      const currentInBill = bill.find(i => i.id === product.id)?.quantity || 0;
                      const availableStock = product.stock - currentInBill;

                      return (
                        <div
                          key={key}
                          className={`product-card ${stockStatus}`}
                          style={{
                            ...stockStyles.productCard,
                            ...(stockStatus === 'out-of-stock' ? stockStyles.outOfStock : 
                                stockStatus === 'low-stock' ? stockStyles.lowStock : 
                                stockStyles.inStock)
                          }}
                        >
                          <div className="product-image-wrapper">
                            <img 
                              src={product.image || 'https://placehold.co/150x150'}
                              alt={product.name}
                              className={`product-image ${isOutOfStock ? 'out-of-stock' : ''}`}
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/150x150';
                              }}
                            />
                            {currentInBill > 0 && (
                              <div className="quantity-badge">
                                {currentInBill}
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
                                disabled={!currentInBill}
                              >
                                <FaMinus />
                              </button>
                              <span className="quantity-display">
                                {currentInBill}
                              </span>
                              <button 
                                className="action-btn increase"
                                onClick={() => updateProductQuantity(product, 1)}
                                disabled={isOutOfStock || currentInBill >= product.stock}
                              >
                                <FaPlus />
                              </button>
                            </div>
                            <div 
                              className="stock-badge" 
                              data-status={stockStatus}
                              style={{
                                ...stockStyles.stockBadge,
                                position: 'static',
                                marginTop: '0.5rem',
                                textAlign: 'center',
                                width: '100%'
                              }}
                            >
                              المخزون: {availableStock}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <style>
                {`
                  .products-container {
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    padding: 1rem;
                    height: calc(100vh - 200px);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
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
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); // Slightly smaller cards
                    gap: 0.50rem; // Reduced gap
                    padding: 0.75rem; // Reduced padding
                    overflow-y: auto;
                    height: calc(100vh - 250px); // Adjusted height
                    align-content: start;
                    scrollbar-width: thin;
                    scrollbar-color: #dee2e6 #f8f9fa;
                  }

                  .products-grid::-webkit-scrollbar {
                    width: 6px;
                  }

                  .products-grid::-webkit-scrollbar-track {
                    background: #f8f9fa;
                    border-radius: 3px;
                  }

                  .products-grid::-webkit-scrollbar-thumb {
                    background: #dee2e6;
                    border-radius: 3px;
                  }

                  .products-grid::-webkit-scrollbar-thumb:hover {
                    background: #adb5bd;
                  }

                  .product-card {
                    height: 260px; // Fixed height
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    background: #ffffff;
                    border-radius: 12px;
                    border: 1px solid #edf2f7;
                    transition: all 0.3s ease;
                    margin: 0.50rem;
                    padding: 0.50rem;
                    overflow: hidden; // Prevent content overflow
                  }

                  .product-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                  }

                  .product-image-wrapper {
                    position: relative;
                    padding-top: 70%; // Slightly reduced height ratio
                    background: #f8f9fa;
                    overflow: hidden;
                    flex-shrink: 0; // Prevent image from shrinking
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
                    min-height: 0; // Allow content to shrink if needed
                  }

                  .product-title {
                    margin: 0;
                    font-size: 0.9rem; // Increased from 0.9rem
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 12px; // Increased from 8px
                    height: 2.4em; // Set fixed height for 2 lines
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }

                  .product-price {
                    color: #3699ff;
                    font-weight: bold;
                    font-size: 1.2rem; // Increased from 1.1rem
                    margin-bottom: 15px; // Increased from 12px
                    flex-shrink: 0; // Prevent price from shrinking
                  }

                  .product-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f8f9fa;
                    border-radius: 20px;
                    padding: 5px;
                    margin-top: auto;
                    flex-shrink: 0; // Prevent actions from shrinking
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
                      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    }
                    
                    .product-card {
                      height: 240px; // Slightly smaller on mobile
                    }
                    
                    .btn-clear, .btn-confirm {
                      padding: 0.5rem 0.75rem;
                      font-size: 0.8rem;
                      height: 36px;
                    }
                    
                    .product-title {
                      font-size: 0.85rem;
                    }
                  }

                  @media (max-width: 576px) {
                    .products-grid {
                      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                      gap: 0.5rem;
                    }
                    
                    .product-card {
                      height: 220px; // Even smaller on very small screens
                    }
                    
                    .product-title {
                      font-size: 0.8rem;
                    }
                    
                    .product-price {
                      font-size: 0.85rem;
                    }
                    
                    .btn-clear, .btn-confirm {
                      padding: 0.4rem 0.6rem;
                      font-size: 0.75rem;
                      height: 32px;
                    }
                  }

                  @media (max-width: 1200px) {
                    .products-grid {
                      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    }
                  }

                  @media (max-width: 1400px) {
                    .products-grid {
                      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    }
                  }

                  .product-card {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform, opacity;
                  }

                  .product-card.filtering {
                    opacity: 0;
                    transform: scale(0.95) translateY(10px);
                  }

                  .product-card {
                    animation: cardAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                  }

                  @keyframes cardAppear {
                    0% {
                      opacity: 0;
                      transform: scale(0.95) translateY(20px);
                    }
                    100% {
                      opacity: 1;
                      transform: scale(1) translateY(0);
                    }
                  }

                  /* Add stagger delay for each card with longer duration */
                  ${Array.from({ length: 50 }, (_, i) => `
                    .product-card:nth-child(${i + 1}) {
                      animation-delay: ${i * 0.08}s;
                    }
                  `).join('\n')}
                `}
              </style>
            </div>
            <div className="col-lg-4">
              <div style={{ display: 'none' }}>
                <ComponentToPrint 
                  bill={bill} 
                  ref={componentRef} 
                  employeeName={currentUser?.name}
                  employeeNumber={currentUser?.employeeNumber}
                  orderNumber={orderNumber}
                  isRefunded={false}  // Since this is for new bills
                  settings={settings}  // Add this line
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
                      <span className="info-value">
                        {currentUser?.name} (#{currentUser?.employeeNumber})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bill-content">
                  {bill.length === 0 ? (
                    <div className="empty-bill">
                      <div className="empty-bill-content">
                        <i className="fas fa-receipt fa-3x mb-3"></i>
                        <p>لا يوجد منتجات في الفاتورة</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bill-items">
                      {bill.map((billItem) => (
                        <div 
                          key={billItem.id} // Change from using array index to using item.id
                          className={`bill-item ${newItemIds.includes(billItem.id) ? 'new-item' : ''}`}
                          data-bill-item-id={billItem.id}
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

                {renderBillFooter()}
              </div>

              <style>
                {`
                  .bill-container {
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    height: calc(100vh - 200px);
                    display: flex;
                    flex-direction: column;
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
                    overflow-x: hidden; /* Add this line */
                    padding: 0.5rem; // Reduced padding
                    scrollbar-width: thin;
                    scrollbar-color: #dee2e6 #f8f9fa;
                    position: relative; /* Add this line */
                    width: 100%;
                  }

                  .bill-items {
                    position: relative; // Add this to establish positioning context
                    width: 100%; // Ensure full width
                    overflow: hidden; /* Add this line */
                  }

                  .bill-item {
                    position: relative; // Add this for proper animation containment
                    width: calc(100% - 1px); /* Adjust width to prevent scrollbar */
                    background: #ffffff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 0.75rem; // Reduced padding
                    margin-bottom: 0.5rem;
                    transition: all 0.3s ease;
                    transform-origin: center right;
                    animation: fadeInSlide 0.3s ease-out forwards;
                    opacity: 0;
                  }

                  .bill-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                  }

                  .remove-item-animation {
                    animation: slideOutRight 0.3s ease-out forwards !important;
                    pointer-events: none;
                  }

                  @keyframes slideOutRight {
                    0% {
                      opacity: 1;
                      transform: translateX(0);
                    }
                    100% {
                      opacity: 0;
                      transform: translateX(100%);
                    }
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
                    gap: 0.5rem;
                    padding: 0.5rem;
                  }

                  .btn-clear, .btn-confirm {
                    border: none;
                    padding: 0.625rem 1rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.75rem;
                    height: 40px; // Fixed height
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
                    transform-origin: right center; // Add this to control animation origin
                  }

                  .new-item-animation:hover {
                    background-color: rgba(11, 183, 131, 0.15);
                  }

                  @keyframes slideInRightWithFade {
                    0% {
                      transform: translateX(100%);
                      opacity: 0;
                    }
                    100% {
                      transform: translateX(0);
                      opacity: 1;
                    }
                  }

                  .empty-bill {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #6c757d;
                    text-align: center;
                  }

                  .empty-bill-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-size: 1.1rem;
                  }

                  .empty-bill i {
                    color: #adb5bd;
                    margin-bottom: 1rem;
                  }

                  .empty-bill p {
                    margin: 0;
                  }

                  @keyframes fadeInSlide {
                    0% {
                      opacity: 0;
                      transform: translateX(20px);
                    }
                    100% {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }

                  .bill-item {
                    // ...existing bill-item styles...
                    transform-origin: center right;
                    will-change: transform, opacity;
                  }

                  .bill-item {
                    animation: fadeInSlide 0.3s ease-out forwards;
                    opacity: 0;
                  }

                  .bill-item:nth-child(1) { animation-delay: 0.05s; }
                  .bill-item:nth-child(2) { animation-delay: 0.1s; }
                  .bill-item:nth-child(3) { animation-delay: 0.15s; }
                  .bill-item:nth-child(4) { animation-delay: 0.2s; }
                  .bill-item:nth-child(5) { animation-delay: 0.25s; }

                  .bill-item.new-item {
                    animation: slideInLeft 0.3s ease-out forwards;
                    background-color: rgba(54, 153, 255, 0.1);
                    transition: background-color 0.5s ease;
                  }

                  .bill-item.new-item:hover {
                    background-color: rgba(54, 153, 255, 0.05);
                  }

                  @keyframes slideInLeft {
                    0% {
                      opacity: 0;
                      transform: translateX(-20px);
                    }
                    100% {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }

                  @keyframes slideOutAndFade {
                    0% {
                      opacity: 1;
                      transform: translateX(0);
                    }
                    100% {
                      opacity: 0;
                      transform: translateX(100%);
                    }
                  }

                  .remove-item-animation {
                    animation: slideOutAndFade 0.3s ease-out forwards !important;
                    pointer-events: none;
                  }

                  .bill-item {
                    // ...existing bill-item styles...
                    transform-origin: center right;
                    will-change: transform, opacity;
                  }

                  @keyframes fadeOutSlideRight {
                    0% {
                      opacity: 1;
                      transform: translateX(0);
                    }
                    60% {
                      opacity: 0.4;
                      transform: translateX(30px);
                    }
                    100% {
                      opacity: 0;
                      transform: translateX(100%);
                    }
                  }

                  .remove-item-animation {
                    animation: fadeOutSlideRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
                    pointer-events: none;
                  }

                  .bill-item {
                    // ...existing bill-item styles...
                    transform-origin: center right;
                    will-change: transform, opacity;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                  }

                  /* Optional: Add a subtle scale effect during removal */
                  .remove-item-animation {
                    transform: scale(0.95);
                  }
                `}
              </style>
            </div>
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
            box-shadow: 0 4px 12px rgba(54, 153, 255, 0.1);
          }

          .category-btn.active {
            background: #3699ff;
            border-color: #3699ff;
            color: white;
            box-shadow: 0 6px 16px rgba(54, 153, 255, 0.2);
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
          .system-controls {
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            margin-bottom: 1rem; // Reduced margin
          }

          .system-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); // Increased minimum width
            gap: 1.5rem;
            max-width: 1800px;
            margin: 0 auto;
          }

          .system-button {
            text-decoration: none;
            color: #2c3e50;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid #e9ecef;
            border-radius: 12px;
            overflow: hidden;
          }

          .button-content {
            display: flex;
            align-items: center;
            padding: 1.25rem;
            background: #f8f9fa;
            gap: 1rem;
          }

          .button-icon {
            font-size: 1.5rem;
            color: #3699ff;
            transition: all 0.3s ease;
          }

          .system-button:hover {
            transform: translateY(-2px);
            border-color: #3699ff;
            box-shadow: 0 8px 16px rgba(54, 153, 255, 0.12);
          }

          .system-button:hover .button-content {
            background: #3699ff;
            color: white;
          }

          .system-button:hover .button-icon {
            color: white;
          }

          .filter-section {
            display: flex;
            justify-content: center;
            margin: 1rem auto; // Reduced margin
            padding: 0 1rem;
            max-width: 1200px;
          }

          .filter-container {
            background: #ffffff;
            padding: 0.75rem; // Reduced padding
            border-radius: 50px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            display: flex;
            gap: 1rem;
            max-width: 800px;
            margin: 0 auto;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .filter-container::-webkit-scrollbar {
            display: none;
          }

          .filter-button {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1.5rem;
            background: transparent;
            border: 1px solid #e9ecef;
            border-radius: 25px;
            color: #6c757d;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            white-space: nowrap;
            cursor: pointer;
            min-width: 140px;
            justify-content: center;
          }

          .filter-button:hover {
            border-color: #3699ff;
            color: #3699ff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(54, 153, 255, 0.1);
          }

          .filter-button.active {
            background: #3699ff;
            border-color: #3699ff;
            color: white;
            box-shadow: 0 6px 16px rgba(54, 153, 255, 0.2);
          }

          .icon-container {
            display: flex;
            align-items: center;
            font-size: 1.25rem;
          }

          .category-label {
            font-size: 1rem;
            font-weight: 500;
          }

          @media (max-width: 768px) {
            .system-controls {
              padding: 1rem;
            }

            .system-buttons {
              grid-template-columns: repeat(2, 1fr);
            }

            .button-content {
              padding: 1rem;
            }

            .filter-button {
              padding: 0.75rem 1.25rem;
              min-width: 120px;
            }

            .category-label {
              font-size: 0.9rem;
            }
          }

          @media (max-width: 576px) {
            .system-buttons {
              grid-template-columns: 1fr;
            }

            .filter-container {
              border-radius: 16px;
              padding: 0.75rem;
            }

            .filter-button {
              padding: 0.625rem 1rem;
              min-width: 100px;
            }
          }
          .page-container {
            min-height: 100vh;
            background: #f5f8fa;
            padding: 1.25rem;
            display: flex;
            justify-content: center;
            overflow-x: hidden; /* Add this line */
          }

          .content-wrapper {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            overflow-x: hidden; /* Add this line */
          }

          .main-content {
            position: relative;
            z-index: 1;
            height: calc(100vh - 230px);
            overflow-y: auto;
          }

          .row.g-2 {
            --bs-gutter-x: 1rem;
            --bs-gutter-y: 1rem;
            display: flex;
            margin: 0;
            width: 100%;
            height: 100%;
          }

          .col-lg-8 {
            flex: 0 0 auto;
            width: 70%;
            padding-right: 0.75rem;
          }

          .col-lg-4 {
            flex: 0 0 auto;
            width: 30%;
            padding-left: 0.75rem;
          }

          .system-controls {
            background: #ffffff;
            padding: 1.25rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            margin-bottom: 1rem;
          }

          .filter-section {
            margin: 1rem auto;
            padding: 0;
            width: 100%;
          }

          .filter-container {
            background: #ffffff;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            display: flex;
            gap: 0.75rem;
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }

          .products-container {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            height: 100%;
            padding: 1rem;
            display: flex;
            flex-direction: column;
          }

          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 1rem;
            padding: 0.5rem;
            overflow-y: auto;
            height: 100%;
            align-content: start;
            scrollbar-width: thin;
            scrollbar-color: #dee2e6 #f8f9fa;
          }

          .bill-container {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          @media (max-width: 1200px) {
            .content-wrapper {
              max-width: 100%;
            }
            
            .col-lg-8 {
              width: 65%;
            }
            
            .col-lg-4 {
              width: 35%;
            }
          }

          @media (max-width: 992px) {
            .page-container {
              padding: 0.75rem;
            }

            .row.g-2 {
              flex-direction: column;
              height: auto;
            }
            
            .col-lg-8, .col-lg-4 {
              width: 100%;
              padding: 0;
            }
            
            .main-content {
              height: auto;
              overflow-y: visible;
            }

            .products-container, .bill-container {
              height: auto;
              min-height: 500px;
            }

            .products-container {
              height: 60vh;
              margin-bottom: 1rem;
            }

            .bill-container {
              height: 60vh;
            }

            .products-grid {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 0.75rem;
            }

            .product-card {
              max-height: 220px;
            }
          }

          @media (max-width: 576px) {
            .page-container {
              padding: 0.5rem;
            }

            .system-controls {
              padding: 0.75rem;
            }

            .filter-container {
              padding: 0.5rem;
            }

            .products-grid {
              grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
              gap: 0.5rem;
            }

            .product-card {
              max-height: 200px;
            }

            .product-title {
              font-size: 0.85rem;
              height: 32px;
            }

            .product-price {
              font-size: 0.9rem;
            }

            .action-btn {
              width: 22px;
              height: 22px;
            }
          }

          @media (min-width: 1400px) {
            .content-wrapper {
              max-width: 1400px;
            }
          }

          /* Update system buttons layout */
          .system-buttons {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 1rem;
          }

          .system-button {
            height: 100%;
            background: white;
            border-radius: 10px;
            transition: all 0.2s ease;
          }

          .button-content {
            height: 100%;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          /* Update filter buttons */
          .filter-button {
            flex: 0 1 auto;
            min-width: auto;
            padding: 0.625rem 1.25rem;
          }

          /* Add smooth scrolling to all elements */
          * {
            scroll-behavior: smooth;
          }

          /* Update the system-buttons layout for mobile */
          @media (max-width: 768px) {
            .system-buttons {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }

            .button-content {
              padding: 0.75rem;
              font-size: 0.9rem;
            }

            .button-icon {
              font-size: 1.25rem;
            }
          }

          /* Add custom scrollbar styling for mobile */
          @media (hover: none) {
            .products-grid::-webkit-scrollbar {
              width: 4px;
            }

            .products-grid::-webkit-scrollbar-track {
              background: transparent;
            }

            .products-grid::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.2);
              border-radius: 2px;
            }
          }
        `}
      </style>
    </div>
  );
}

export default React.memo(POSPage, (prevProps, nextProps) => {
  // Custom comparison function if needed
  return true; // Only re-render on prop changes
});