import React, { useEffect, useState, useRef } from 'react';
import MainLayout from '../layouts/MainLayout';
import axios from 'axios';
import { ComponentToPrint } from '../components/ComponentToPrint';
import { useReactToPrint } from 'react-to-print';

function POSPage() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [bill, setBill] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

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
    }

    const clearBill = () => {
        setBill([]);
    }

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

    return (
        <MainLayout>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-lg-8">
                        {isLoading ? 'Loading...' : <div className='row g-3'>
                            {products.map((product, key) => (
                                <div key={key} className="col-6 col-sm-4 col-md-3 col-lg-3">
                                    <div className="card h-100">
                                        <img src={product.image} alt={product.name} className="card-img-top" />
                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title">{product.name}</h5>
                                            <p className="card-text">{product.price} ر.س</p>
                                            <button className="btn btn-primary mt-auto" onClick={() => addProductToBill(product)}>إضافة إلى الفاتورة</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>}
                    </div>
                    <div className="col-lg-4">
                        <div style={{display: 'none'}}>
                            <ComponentToPrint bill={bill} totalAmount={totalAmount} ref={componentRef} />
                        </div>
                        <div className="table-responsive bg-dark mg-2 p-2 rounded-3">
                            <table className='table table-dark table-striped table-hover'>
                                <thead>
                                    <tr>
                                        <td className="border-end">#</td>
                                        <td className="border-end">المنتج</td>
                                        <td className="border-end">السعر</td>
                                        <td className="border-end">الكمية</td>
                                        <td className="border-end">المجموع</td>
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
                                                <td className="border-end">{billItem.name}</td>
                                                <td className="border-end">{billItem.price}</td>
                                                <td className="border-end">{billItem.quantity}</td>
                                                <td className="border-end">{billItem.totalAmount}</td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(billItem)}>حذف</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <h2 className="px-2 text-white text-center fs-4">كامل المجموع : {totalAmount} ر.س</h2>
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
            `}</style>
        </MainLayout>
    );
};

export default POSPage;