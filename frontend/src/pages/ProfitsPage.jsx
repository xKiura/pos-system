import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

const categories = ['الكل', 'رز', 'مشويات', 'مشروبات', 'وجبات'];

function ProfitsPage() {
    const [dateFilter, setDateFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('الكل');
    const [totalProfit, setTotalProfit] = useState(0);
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
    }, [confirmedOrders, dateFilter, categoryFilter]);

    const fetchConfirmedOrders = async () => {
        try {
            const result = await axios.get('http://localhost:5001/confirmed-orders');
            const ordersWithDateTime = result.data.map(order => {
                const confirmedDate = new Date(order.confirmedAt);
                return {
                    ...order,
                    date: confirmedDate.toLocaleDateString('en-GB'), // Use 'en-GB' to ensure correct date format
                    time: confirmedDate.toLocaleTimeString('en-GB') // Use 'en-GB' to ensure correct time format
                };
            });
            setConfirmedOrders(ordersWithDateTime);
        } catch (error) {
            console.error('Error fetching confirmed orders:', error);
        }
    };

    const filterOrders = () => {
        const filtered = confirmedOrders.filter(order => {
            return (!dateFilter || order.date === dateFilter) && (categoryFilter === 'الكل' || order.items.some(item => item.category === categoryFilter));
        });
        setFilteredOrders(filtered);
        calculateProfits(filtered);
    };

    const calculateProfits = (orders) => {
        let totalProfit = 0;
        let productSales = {};

        orders.forEach(order => {
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
    };

    const toggleOrderDetails = (orderNumber) => {
        setExpandedOrder(expandedOrder === orderNumber ? null : orderNumber);
    };

    const handleDeleteAll = async () => {
        try {
            await axios.delete('http://localhost:5001/confirmed-orders');
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
            const response = await axios.delete(`http://localhost:5001/confirmed-orders/${parseInt(orderNumber, 10)}`);
            console.log('Delete response:', response);
            setConfirmedOrders(confirmedOrders.filter(order => order.orderNumber !== orderNumber));
            setFilteredOrders(filteredOrders.filter(order => order.orderNumber !== orderNumber));
            localStorage.setItem('confirmedOrders', JSON.stringify(confirmedOrders.filter(order => order.orderNumber !== orderNumber)));
            setShowDeleteModal(false);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.error('Order not found:', error);
                alert('Order not found.');
            } else {
                console.error('Error deleting order:', error);
            }
        }
    };

    return (
        <div className="container mt-5">
            <Link to="/pos" className="btn btn-warning mb-3">
                <FaArrowLeft /> العودة إلى صفحة المبيعات
            </Link>
            <h1 className="text-center mb-4">الأرباح</h1>
            <div className="row mb-3">
                <div className="col-md-6">
                    <label htmlFor="date-filter" className="form-label">ترتيب على حسب التاريخ :</label>
                    <input type="date" id="date-filter" className="form-control" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
                <div className="col-md-6">
                    <label htmlFor="category-filter" className="form-label">ترتيب على حسب الصنف :</label>
                    <select id="category-filter" className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div id="profits-result" className="bg-light p-3 rounded">
                <h2>مجموع الربح : ${totalProfit.toFixed(2)}</h2>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ</th>
                            <th>المنتجات</th>
                            <th>الكمية المباعة</th>
                            <th>مجموع السعر</th>
                            <th>تفاصيل الفاتورة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order, index) => (
                            <React.Fragment key={index}>
                                <tr>
                                    <td>{order.orderNumber}</td>
                                    <td>{order.date} {order.time}</td>
                                    <td>{order.items.map(item => item.name).join(', ')}</td>
                                    <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                    <td>${order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</td>
                                    <td>
                                        <button className="btn btn-warning" onClick={() => toggleOrderDetails(order.orderNumber)}>
                                            {expandedOrder === order.orderNumber ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                                        </button>
                                        <button className="btn btn-danger btn-sm ms-2" onClick={() => { setOrderToDelete(order.orderNumber); setShowDeleteModal(true); }}>
                                            <FaTimes />
                                        </button>
                                    </td>
                                </tr>
                                {expandedOrder === order.orderNumber && (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="p-3">
                                                <p>اسم الموظف: {order.employeeName}</p>
                                                <p>رقم الموظف: #{order.employeeNumber}</p>
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>المنتج</th>
                                                            <th>الكمية</th>
                                                            <th>السعر</th>
                                                            <th>المجموع</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {order.items.filter(item => categoryFilter === 'الكل' || item.category === categoryFilter).map((item, itemIndex) => (
                                                            <tr key={`${index}-${itemIndex}`}>
                                                                <td>{item.name}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>${item.price}</td>
                                                                <td>${item.price * item.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                <button className="btn btn-danger mt-3" onClick={() => setShowModal(true)}>مسح جميع الفواتير</button>
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
        </div>
    );
}

export default ProfitsPage;
