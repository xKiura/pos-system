import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './ManageProductsPage.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';

const ManageProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [product, setProduct] = useState({ name: '', price: '', image: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [productToRemove, setProductToRemove] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const result = await axios.get('http://localhost:5000/products');
            setProducts(result.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    const handleAddProduct = async () => {
        try {
            const result = await axios.post('http://localhost:5000/products', product);
            setProducts([...products, result.data]);
            setProduct({ name: '', price: '', image: '' });
            setShowAddModal(false);
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const handleRemoveProduct = async () => {
        try {
            await axios.delete(`http://localhost:5000/products/${productToRemove}`);
            setProducts(products.filter(product => product.id !== productToRemove));
            setShowRemoveModal(false);
        } catch (error) {
            console.error('Error removing product:', error);
        }
    };

    const isFormValid = product.name && product.price && product.image;

    return (
        <div className="manage-products-page">
            <Link to="/pos" className="btn btn-warning mb-3">
                <FaArrowLeft /> العودة إلى صفحة المبيعات
            </Link>
            <h1>إدارة المنتجات</h1>
            <div className="product-form">
                <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    placeholder="اسم المنتج"
                />
                <input
                    type="text"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    placeholder="سعر المنتج"
                />
                <input
                    type="text"
                    name="image"
                    value={product.image}
                    onChange={handleChange}
                    placeholder="رابط صورة المنتج"
                />
                <button className='btn btn-warning text-black mt-3' onClick={() => setShowAddModal(true)} disabled={!isFormValid}>إضافة المنتج</button>
            </div>
            <div className="product-list">
                {products.map((prod) => (
                    <div key={prod.id} className="product-item">
                        <img src={prod.image} alt={prod.name} />
                        <div>{prod.name}</div>
                        <div>{prod.price} ر.س</div>
                        <button onClick={() => { setProductToRemove(prod.id); setShowRemoveModal(true); }}>إزالة المنتج</button>
                    </div>
                ))}
            </div>

            {/* Add Product Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>تأكيد إضافة المنتج</Modal.Title>
                </Modal.Header>
                <Modal.Body>هل أنت متأكد أنك تريد إضافة هذا المنتج؟</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        إلغاء
                    </Button>
                    <Button variant="primary" onClick={handleAddProduct}>
                        إضافة
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Remove Product Modal */}
            <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>تأكيد إزالة المنتج</Modal.Title>
                </Modal.Header>
                <Modal.Body>هل أنت متأكد أنك تريد إزالة هذا المنتج؟</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
                        إلغاء
                    </Button>
                    <Button variant="danger" onClick={handleRemoveProduct}>
                        إزالة
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ManageProductsPage;
