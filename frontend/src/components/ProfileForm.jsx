import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { FaKey, FaLock, FaSave, FaExclamationCircle, FaSpinner, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { Modal } from 'react-bootstrap';

// Define animations first
const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #4a5568;
  font-size: 0.875rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  &:disabled {
    background: #f7fafc;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3182ce;
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }

  .spinner {
    animation: ${spinAnimation} 1s linear infinite;
  }
`;

const SecuritySection = styled.div`
  background: #f7fafc;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fff5f5;
  border-radius: 6px;
  border: 1px solid #feb2b2;

  svg {
    flex-shrink: 0;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #047857;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #ecfdf5;
  border-radius: 6px;
  border: 1px solid #6ee7b7;

  svg {
    flex-shrink: 0;
  }
`;

const ConfirmModal = styled(Modal)`
  .modal-content {
    border-radius: 12px;
    border: none;
  }

  .modal-header {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-footer {
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
  }
`;

const ModalButton = styled.button`
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.confirm {
    background: #4299e1;
    color: white;
    &:hover {
      background: #3182ce;
    }
  }

  &.cancel {
    background: #e2e8f0;
    color: #4a5568;
    &:hover {
      background: #cbd5e0;
    }
  }
`;

const FeedbackWrapper = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const ProfileForm = ({ currentUser }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pinToUpdate, setPinToUpdate] = useState(null);

  const validateForm = () => {
    if (newPin === currentPin) {
      setError('رقم التعريف الشخصي الجديد يجب أن يكون مختلفاً عن الحالي');
      return false;
    }

    if (newPin !== confirmPin) {
      setError('رقم التعريف الشخصي الجديد غير متطابق');
      return false;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('رقم التعريف الشخصي يجب أن يكون 4 أرقام');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Store the PIN data and show confirmation modal
    setPinToUpdate({
      currentPin,
      newPin,
      confirmPin
    });
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      setShowConfirmModal(false);

      // First validate current PIN
      const validateResponse = await axios.post('http://localhost:5000/validate-pin', {
        employeeNumber: currentUser.employeeNumber,
        pin: pinToUpdate.currentPin
      });

      if (!validateResponse.data.success) {
        setError('رقم التعريف الشخصي الحالي غير صحيح');
        toast.error('رقم التعريف الشخصي الحالي غير صحيح');
        return;
      }

      // Then update PIN
      const updateResponse = await axios.post('http://localhost:5000/update-pin', {
        employeeNumber: currentUser.employeeNumber,
        employeeName: currentUser.name,
        newPin: pinToUpdate.newPin
      });

      if (updateResponse.data.success) {
        // Log the change in settings history - simplified entry with new type
        await axios.post('http://localhost:5000/settings-history', {
          timestamp: new Date().toISOString(),
          employeeName: currentUser.name,
          employeeNumber: currentUser.employeeNumber,
          type: 'إعدادات شخصية',
          origin: 'صفحة الملف الشخصي',
          changes: [{
            details: 'تم تغيير رقم التعريف الشخصي'
          }]
        });

        setSuccess(true);
        toast.success('تم تحديث رقم التعريف الشخصي بنجاح', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Clear form after successful update
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setPinToUpdate(null);

        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error updating PIN:', error);
      setError('حدث خطأ أثناء تحديث رقم التعريف الشخصي');
      toast.error('حدث خطأ أثناء تحديث رقم التعريف الشخصي', {
        position: "top-center"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add styles for error state
  const getInputStyle = (hasError) => ({
    borderColor: hasError ? '#fc8181' : '#e2e8f0',
    boxShadow: hasError ? '0 0 0 1px #fc8181' : 'none'
  });

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>اسم الموظف</Label>
          <Input
            type="text"
            value={currentUser.name}
            disabled
          />
        </FormGroup>

        <FormGroup>
          <Label>رقم الموظف</Label>
          <Input
            type="text"
            value={currentUser.employeeNumber}
            disabled
          />
        </FormGroup>

        <SecuritySection>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaLock /> تغيير رقم التعريف الشخصي
          </h3>

          <FormGroup>
            <Label>رقم التعريف الشخصي الحالي</Label>
            <Input
              type="password"
              value={currentPin}
              onChange={(e) => {
                setCurrentPin(e.target.value);
                setError(null);
              }}
              placeholder="****"
              required
              minLength="4"
              maxLength="4"
              style={getInputStyle(error && error.includes('الحالي'))}
            />
          </FormGroup>

          <FormGroup>
            <Label>رقم التعريف الشخصي الجديد</Label>
            <Input
              type="password"
              value={newPin}
              onChange={(e) => {
                setNewPin(e.target.value);
                setError(null);
              }}
              placeholder="****"
              required
              minLength="4"
              maxLength="4"
              style={getInputStyle(error && error.includes('الجديد'))}
            />
          </FormGroup>

          <FormGroup>
            <Label>تأكيد رقم التعريف الشخصي الجديد</Label>
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value);
                setError(null);
              }}
              placeholder="****"
              required
              minLength="4"
              maxLength="4"
              style={getInputStyle(error && error.includes('متطابق'))}
            />
          </FormGroup>

          {error && (
            <ErrorMessage>
              <FaExclamationCircle />
              {error}
            </ErrorMessage>
          )}

          {success && (
            <SuccessMessage>
              <FaCheck />
              تم تحديث رقم التعريف الشخصي بنجاح
            </SuccessMessage>
          )}
        </SecuritySection>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <FaSpinner className="spinner" /> جاري التحديث...
            </>
          ) : (
            <>
              <FaKey /> تحديث رقم التعريف الشخصي
            </>
          )}
        </Button>
      </Form>

      {/* Confirmation Modal */}
      <ConfirmModal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>تأكيد تحديث رقم التعريف الشخصي</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          هل أنت متأكد من تحديث رقم التعريف الشخصي؟
        </Modal.Body>
        <Modal.Footer>
          <ModalButton 
            className="cancel"
            onClick={() => setShowConfirmModal(false)}
          >
            إلغاء
          </ModalButton>
          <ModalButton 
            className="confirm"
            onClick={handleConfirmUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="spinner" /> جاري التحديث...
              </>
            ) : (
              'تأكيد التحديث'
            )}
          </ModalButton>
        </Modal.Footer>
      </ConfirmModal>

      {/* Toast notifications will appear here */}
      <FeedbackWrapper />
    </>
  );
};

export default ProfileForm;