import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const StyledContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  direction: rtl;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ProductActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
`;

const AddProductButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3699ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(54, 153, 255, 0.2);

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(54, 153, 255, 0.25);
  }

  svg {
    font-size: 1.1rem;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ProductCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const ProductImage = styled.div`
  position: relative;
  padding-top: 75%;
  background: #f8fafc;
  overflow: hidden;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const ProductInfo = styled.div`
  padding: 1rem;
`;

const ProductName = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`;

const ProductPrice = styled.div`
  margin-top: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8b73f;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;

  &.edit {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }

  &.delete {
    background: #ef4444;
    color: white;
    &:hover { background: #dc2626; }
  }
`;

const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  input {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  select {
    padding: 0.75rem;
    padding-left: 2rem; // Add left padding for the arrow
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
    background-color: white;
    width: 100%;
    appearance: revert; // This ensures the native arrow appears properly

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

const StyledModal = styled(Modal)`
  .modal-content {
    direction: rtl;
    border-radius: 12px;
    border: none;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }

  .modal-header {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.25rem;
  }

  .modal-footer {
    border-top: 1px solid #e2e8f0;
    padding: 1.25rem;
  }
`;

// Arabic translations
const translations = {
  backToSales: 'العودة إلى المبيعات',
  productManagement: 'إدارة المنتجات',
  addProduct: 'إضافة منتج',
  editProduct: 'تعديل المنتج',
  removeProduct: 'إزالة المنتج',
  confirmRemoval: 'تأكيد الإزالة',
  productName: 'اسم المنتج',
  productPrice: 'سعر المنتج',
  productImage: 'رابط صورة المنتج',
  productCategory: 'فئة المنتج',
  cancel: 'إلغاء',
  save: 'حفظ',
  edit: 'تعديل',
  delete: 'إزالة',
  confirmDeleteMessage: 'هل أنت متأكد أنك تريد إزالة هذا المنتج؟',
  currency: 'ر.س',
  categories: {
    rice: 'رز',
    grilled: 'مشويات',
    drinks: 'مشروبات',
    meals: 'وجبات'
  }
};

const GlobalStyles = styled.div`
  .back-button {
    display: inline-flex;
    align-items: center;
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
`;

function ManageProductsPage() {
    const [products, setProducts] = useState([]);
    const [product, setProduct] = useState({ name: '', price: '', image: '', category: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
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
            setProduct({ name: '', price: '', image: '', category: '' });
            setShowAddModal(false);
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const handleEditProduct = async () => {
        try {
            const result = await axios.put(`http://localhost:5000/products/${productToEdit.id}`, product);
            setProducts(products.map(prod => (prod.id === productToEdit.id ? result.data : prod)));
            setProduct({ name: '', price: '', image: '', category: '' });
            setShowEditModal(false);
        } catch (error) {
            console.error('Error editing product:', error);
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

    const isFormValid = product.name && product.price && product.image && product.category;

    // Add this new function to clear the product form
    const clearProductForm = () => {
        setProduct({ name: '', price: '', image: '', category: '' });
    };

    // Modify the modal open handler
    const handleAddModalOpen = () => {
        clearProductForm(); // Clear the form before opening
        setShowAddModal(true);
    };

    // Update categories array to match POSPage
    const categories = [
        { id: 'رز', name: translations.categories.rice },
        { id: 'مشويات', name: translations.categories.grilled },
        { id: 'مشروبات', name: translations.categories.drinks },
        { id: 'وجبات', name: translations.categories.meals }
    ];

    return (
        <GlobalStyles>
            <StyledContainer>
                <TopBar>
                    <PageTitle>{translations.productManagement}</PageTitle>
                    <ActionBar>
                        <Link to="/pos" className="back-button">
                            {translations.backToSales} <FaArrowLeft />
                        </Link>
                    </ActionBar>
                </TopBar>

                <ProductActions>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaImage style={{ color: '#3699ff', fontSize: '1.2rem' }} />
                        <span style={{ color: '#64748b', fontWeight: 500 }}>
                            {products.length} منتجات
                        </span>
                    </div>
                    <AddProductButton onClick={handleAddModalOpen}>
                        <FaPlus /> {translations.addProduct}
                    </AddProductButton>
                </ProductActions>

                <ProductGrid>
                    <AnimatePresence>
                        {products.map((prod) => (
                            <ProductCard
                                key={prod.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ProductImage>
                                    <img src={prod.image} alt={prod.name} />
                                </ProductImage>
                                <ProductInfo>
                                    <ProductName>{prod.name}</ProductName>
                                    <ProductPrice>{prod.price} {translations.currency}</ProductPrice>
                                    <ActionButtons>
                                        <ActionButton
                                            className="edit"
                                            onClick={() => {
                                                setProductToEdit(prod);
                                                setProduct(prod);
                                                setShowEditModal(true);
                                            }}
                                            style={{ background: '#3699ff' }} // Updated to match POSPage
                                        >
                                            <FaEdit /> {translations.edit}
                                        </ActionButton>
                                        <ActionButton
                                            className="delete"
                                            onClick={() => {
                                                setProductToRemove(prod.id);
                                                setShowRemoveModal(true);
                                            }}
                                        >
                                            <FaTrash /> {translations.delete}
                                        </ActionButton>
                                    </ActionButtons>
                                </ProductInfo>
                            </ProductCard>
                        ))}
                    </AnimatePresence>
                </ProductGrid>

                {/* Add Modal */}
                <StyledModal show={showAddModal} onHide={() => setShowAddModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{translations.addProduct}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <StyledForm>
                            <input
                                type="text"
                                name="name"
                                value={product.name}
                                onChange={handleChange}
                                placeholder={translations.productName}
                            />
                            <input
                                type="text"
                                name="price"
                                value={product.price}
                                onChange={handleChange}
                                placeholder={translations.productPrice}
                            />
                            <input
                                type="text"
                                name="image"
                                value={product.image}
                                onChange={handleChange}
                                placeholder={translations.productImage}
                            />
                            <select
                                name="category"
                                value={product.category}
                                onChange={handleChange}
                            >
                                <option value="" disabled>
                                    {translations.productCategory}
                                </option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </StyledForm>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            {translations.cancel}
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleAddProduct}
                            disabled={!isFormValid}
                            style={{ 
                                background: '#3699ff', 
                                borderColor: '#3699ff',
                                opacity: isFormValid ? 1 : 0.5
                            }}
                        >
                            {translations.save}
                        </Button>
                    </Modal.Footer>
                </StyledModal>

                {/* Edit Modal */}
                <StyledModal show={showEditModal} onHide={() => setShowEditModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{translations.editProduct}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <StyledForm>
                            <input
                                type="text"
                                name="name"
                                value={product.name}
                                onChange={handleChange}
                                placeholder={translations.productName}
                            />
                            <input
                                type="text"
                                name="price"
                                value={product.price}
                                onChange={handleChange}
                                placeholder={translations.productPrice}
                            />
                            <input
                                type="text"
                                name="image"
                                value={product.image}
                                onChange={handleChange}
                                placeholder={translations.productImage}
                            />
                            <select
                                name="category"
                                value={product.category}
                                onChange={handleChange}
                            >
                                <option value="" disabled>
                                    {translations.productCategory}
                                </option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </StyledForm>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            {translations.cancel}
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleEditProduct}
                            disabled={!isFormValid}
                            style={{ 
                                background: '#3699ff', 
                                borderColor: '#3699ff',
                                opacity: isFormValid ? 1 : 0.5
                            }}
                        >
                            {translations.save}
                        </Button>
                    </Modal.Footer>
                </StyledModal>

                {/* Delete Modal */}
                <StyledModal show={showRemoveModal} onHide={() => setShowRemoveModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{translations.confirmRemoval}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{translations.confirmDeleteMessage}</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
                            {translations.cancel}
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={handleRemoveProduct}
                        >
                            {translations.delete}
                        </Button>
                    </Modal.Footer>
                </StyledModal>
            </StyledContainer>
        </GlobalStyles>
    );
}

export default ManageProductsPage;
