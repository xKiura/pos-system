import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ComponentToPrint } from '../components/ComponentToPrint';
import { useReactToPrint } from 'react-to-print';
import { FaTimes, FaTh, FaDrumstickBite, FaUtensils, FaGlassWhiskey, FaPlus, FaMinus } from 'react-icons/fa';
import { GiRiceCooker } from 'react-icons/gi';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { Modal, Button, Card, Spinner } from 'react-bootstrap';

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
  const [showModal, setShowModal] = useState(false);

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
        orderNumber: orderNumber.toString().padStart(6, '0'),
        totalIncome: totalAmount,
        categoryIncome: bill.reduce((acc, item) => acc + (item.category === filter ? item.totalAmount : 0), 0),
        productIncome: bill.reduce((acc, item) => acc + item.totalAmount, 0),
        tax: billTotalTax,
        totalIncomeWithTax: totalAmount + billTotalTax
      };
      saveConfirmedOrder(confirmedOrder);
      incrementOrderNumber();
      setBill([]);
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
            <Link className='btn btn-primary btn-lg' to="/manage-products">إدارة المنتجات</Link>
          </div>
          <div className="col-auto">
            <Link className='btn btn-primary btn-lg' to="/bills">عرض الفواتير</Link>
          </div>
          <div className="col-auto">
            <Link className='btn btn-primary btn-lg' to="/sales-reports">تقارير المبيعات</Link>
          </div>
          <div className="col-auto">
            <Link className='btn btn-primary btn-lg' to="/inventory-reports">تقارير المخزون</Link>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col justify-content-center d-flex my-3">
            {['الكل', 'رز', 'مشويات', 'مشروبات', 'وجبات'].map((category, index) => (
              <button
                key={index}
                className={`btn filter-btn me-2 p-2 d-flex align-items-center justify-content-between px-4 ${filter === (category === 'الكل' ? 'all' : category) ? 'btn-primary' : 'btn-outline-primary'}`}
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
                <Spinner animation="border" variant="warning" />
              </div>
            ) : (
              <div className='row g-3'>
                {filteredProducts.map((product, key) => (
                  <div key={key} className="col-6 col-sm-4 col-md-3 col-lg-3">
                    <Card className="h-100 shadow-sm">
                      <Card.Img variant="top" src={product.image} alt={product.name} style={{ height: '150px', objectFit: 'cover' }} />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title>{product.name}</Card.Title>
                        <Card.Text>{product.price} ر.س</Card.Text>
                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <Button variant="outline-danger" size="sm" className="flex-fill" onClick={() => updateProductQuantity(product, -1)}>
                            <FaMinus />
                          </Button>
                          <span className="quantity-box flex-fill m-1">{bill.find(i => i.id === product.id)?.quantity || 0}</span>
                          <Button variant="primary" size="sm" className="flex-fill" onClick={() => updateProductQuantity(product, 1)}>
                            <FaPlus />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
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
                      <td colSpan="6" className="text-center text-danger border border-primary border-2 fs-5">لا يوجد منتجات في الفاتورة</td>
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

      <style jsx>{`
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
      `}</style>
    </>
  );
}

export default POSPage;