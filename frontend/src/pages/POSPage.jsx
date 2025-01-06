import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ComponentToPrint } from '../components/ComponentToPrint';
import { useReactToPrint } from 'react-to-print';

function POSPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bill, setBill] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toLocaleString());
  const [filter, setFilter] = useState('all');

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

  const removeItem = (product) => {
    let newBill = bill.filter(billItem => billItem.id !== product.id);
    setBill(newBill);
  };

  const clearBill = () => {
    setBill([]);
  };

  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    documentTitle: 'فاتورة',
    contentRef: componentRef,
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

  return (
    <>
      <div className="container-fluid">
        <div className="row mb-3">
          <div className="col">
            {['all', 'رز', 'مشويات', 'مشروبات', 'وجبات'].map((category, index) => (
              <button
                key={index}
                className={`btn me-2 ${filter === category ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter(filter === category ? 'all' : category)}
                style={{ flex: 1, minWidth: '120px', fontSize: '1.1rem', padding: '10px 20px' }}
              >
                {category === 'all' ? 'الكل' : category}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-8">
            {isLoading ? 'Loading...' : (
              <div className='row g-3'>
                {filteredProducts.map((product, key) => (
                  <div key={key} className="col-6 col-sm-4 col-md-3 col-lg-3">
                    <div className="card h-100">
                      <div className="card-img-top" style={{ width: '100%', height: '150px' }}>
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{product.name}</h5>
                        <p className="card-text">{product.price} ر.س</p>
                        <button className="btn btn-primary mt-auto" onClick={() => addProductToBill(product)}>إضافة إلى الفاتورة</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="col-lg-4">
            <div style={{ display: 'none' }}>
              <ComponentToPrint bill={bill} totalAmount={totalAmount} ref={componentRef} />
            </div>
            <div className="table-responsive bg-dark mg-2 p-2 rounded-3">
              <table className='table table-dark table-striped table-hover table-md'>
                <thead>
                  <tr>
                    <td colSpan="6" className="text-end">{currentDateTime}</td>
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
                        <td>
                          <button className="btn btn-danger btn-sm w-100" onClick={() => removeItem(billItem)}>حذف</button>
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
                  <button className="btn btn-danger w-100 mt-3" onClick={clearBill}>حذف الكل</button>
                  <button className="btn btn-success w-100 mt-3" onClick={() => handlePrint()}>إتمام الطلب</button>
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
        }
      `}</style>
    </>
  );
}

export default POSPage;