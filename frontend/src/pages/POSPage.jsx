import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ComponentToPrint } from '../components/ComponentToPrint';
import { useReactToPrint } from 'react-to-print';
import { FaTimes, FaTh, FaDrumstickBite, FaUtensils, FaGlassWhiskey } from 'react-icons/fa';
import { GiRiceCooker } from 'react-icons/gi';
import { Link } from 'react-router-dom';

function POSPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bill, setBill] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toLocaleString());
  const [filter, setFilter] = useState('all');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState(1);

  const roundToNearestHalf = (num) => {
    return Math.round(num * 2) / 2;
  };

  const billTotalTax = roundToNearestHalf(totalAmount * 0.15);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const result = await axios.get('http://localhost:5000/products');
      setProducts(result.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
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
    }
  }

  const removeItem = (product) => {
    let newBill = bill.filter(billItem => billItem.id !== product.id);
    setBill(newBill);
  };

  const clearBill = () => {
    setBill([]);
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
    documentTitle: 'فاتورة',
    contentRef: componentRef,
    onAfterPrint: () => {
      const confirmedOrder = {
        date: new Date().toLocaleDateString(),
        confirmedAt: new Date().toISOString(),
        category: filter,
        items: bill,
        employeeName,
        employeeNumber,
        orderNumber: orderNumber.toString().padStart(6, '0')
      };
      saveConfirmedOrder(confirmedOrder);
      incrementOrderNumber();
      clearBill();
    }
  });

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
    الكل: <FaTh className="fa-3x me-2" />,
    رز: <GiRiceCooker className="fa-3x me-2" />,
    مشويات: <FaDrumstickBite className="fa-3x me-2" />,
    مشروبات: <FaGlassWhiskey className="fa-3x me-2" />,
    وجبات: <FaUtensils className="fa-3x me-2" />
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row mt-3 justify-content-center">
          <div className="col-auto">
            <Link className='btn btn-warning btn-lg' to="/manage-products">إدارة المنتجات</Link>
          </div>
          <div className="col-auto">
            <Link className='btn btn-warning btn-lg' to="/bills">عرض الفواتير</Link>
          </div>
          <div className="col-auto">
            <Link className='btn btn-warning btn-lg' to="/sales-reports">تقارير المبيعات</Link>
          </div>
          <div className="col-auto">
            <Link className='btn btn-warning btn-lg' to="/inventory-reports">تقارير المخزون</Link>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col justify-content-center d-flex my-3">
            {['الكل', 'رز', 'مشويات', 'مشروبات', 'وجبات'].map((category, index) => (
              <button
                key={index}
                className={`btn filter-btn me-2 p-2 d-flex align-items-center justify-content-between px-4 ${filter === (category === 'الكل' ? 'all' : category) ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFilter(category === 'الكل' ? 'all' : category)}
                style={{ flex: 1, minWidth: '120px', fontSize: '1.1rem', padding: '10px 20px' }}
              >
                {categoryIcons[category]}
                <span className={`category-text ${filter === (category === 'الكل' ? 'all' : category) ? 'selected' : ''}`}>
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-8">
            {isLoading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className='row g-3'>
                {filteredProducts.map((product, key) => (
                  <div key={key} className="col-6 col-sm-4 col-md-3 col-lg-3">
                    <div className="card h-100 shadow-sm">
                      <div className="card-img-top" style={{ width: '100%', height: '150px' }}>
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{product.name}</h5>
                        <p className="card-text">{product.price} ر.س</p>
                        <div className="d-flex justify-content-between align-items-center mt-auto" style={{ width: '100%' }}>
                          <button className="btn btn-sm rounded-2 btn-danger flex-fill" onClick={() => updateProductQuantity(product, -1)}>-</button>
                          <span className="quantity-box px-0 flex-fill m-1">{bill.find(i => i.id === product.id)?.quantity || 0}</span>
                          <button className="btn btn-sm rounded-2 btn-success flex-fill" onClick={() => updateProductQuantity(product, 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="col-lg-4">
            <div style={{ display: 'none' }}>
              <ComponentToPrint bill={bill} totalAmount={totalAmount} ref={componentRef} employeeName={employeeName} employeeNumber={employeeNumber} />
            </div>
            <div className="table-responsive bg-dark mg-2 p-2 rounded-3 shadow-sm">
              <table className='table table-dark table-striped table-hover table-md'>
                <thead>
                  <tr>
                    <td colSpan="6" className="text-end">{currentDateTime}</td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="text-end">اسم الموظف: {employeeName}</td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="text-end">رقم الموظف: #{employeeNumber}</td>
                  </tr>
                  <tr>
                    <td className="border-end">#</td>
                    <td className="border-end">المجموع</td>
                    <td className="border-end">الكمية</td>
                    <td className="border-end">السعر</td>
                    <td className="border-end">المنتج</td>
                    <td>الاجراء</td>
                  </tr>
                </thead>
                <tbody>
                  {bill.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-danger border border-danger border-2 fs-5">لا يوجد منتجات في الفاتورة</td>
                    </tr>
                  ) : (
                    bill.map((billItem, key) => (
                      <tr key={key} className="border-bottom">
                        <td className="border-end">{key + 1}</td>
                        <td className="border-end">{billItem.totalAmount}</td>
                        <td className="border-end">{billItem.quantity}</td>
                        <td className="border-end">{billItem.price}</td>
                        <td className="border-end">{billItem.name}</td>
                        <td className='text-center'>
                          <button className='btn btn-danger btn-sm py-0' style={{ fontSize: '0.9em' }} onClick={() => removeItem(billItem)}><FaTimes color="white" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <h6 className="px-4 text-white text-end">المجموع : {Math.ceil(totalAmount)} ر.س</h6>
              <h6 className="px-4 text-white text-end">ضريبة المبيعات (15%) : {billTotalTax.toFixed(2)} ر.س</h6>
              <h3 className="px-2 border-top text-white text-center">كامل المجموع : {(totalAmount + billTotalTax).toFixed(1)} ر.س</h3>
              {bill.length > 0 && (
                <>
                  <button className="btn btn-danger w-100 mt-3 btn-lg" onClick={clearBill}>حذف الكل</button>
                  <button className="btn btn-success w-100 mt-3 btn-lg" onClick={() => handlePrint()}>إتمام الطلب</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
.border-end {
  border-right: 1px solid #6c757d !important;
}
.border-bottom {
  border-bottom: 1px solid #6c757d !important;
}
@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
  }
}
.btn {
  flex: 1;
  min-width: 120px;
  font-size: 1.1rem;
  padding: 10px 20px;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.btn-sm {
  min-width: 40px;
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
  width: 20%;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background-color: white;
  border: 2px solid #6c757d;
  border-radius: 5px;
  font-size: 1.2rem;
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

        }
          `}</style>


    </>
  );
}

export default POSPage;