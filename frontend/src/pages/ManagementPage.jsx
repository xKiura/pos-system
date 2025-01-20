import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaHistory, FaSave, FaPercent, FaPrint, FaUserShield } from 'react-icons/fa';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import axios from 'axios';
import { HistoryChanges } from './HistoryChanges';

const ManagementContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  direction: rtl;

  .back-button {
    direction: ltr;
    padding: 8px 16px;
    border-radius: 8px;
    text-decoration: none;
    background: #edf2f7;
    color: #4a5568;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
      background: #e2e8f0;
      transform: translateX(-2px);
    }
  }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SettingCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: #2d3748;
  }
`;

const HistoryContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 2rem;
`;

const HistoryItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const HistorySection = styled(HistoryContainer)`
  .change-type-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    
    &.settings { background: #e0f2fe; color: #0369a1; }
    &.product { background: #dcfce7; color: #166534; }
    &.bill { background: #fee2e2; color: #991b1b; }
  }
`;

const translations = {
  changeTypes: {
    SETTINGS: 'إعدادات النظام',
    PRODUCT_ADD: 'إضافة منتج',
    PRODUCT_EDIT: 'تعديل منتج',
    PRODUCT_DELETE: 'حذف منتج',
    BILL_REFUND: 'استرجاع فاتورة',
    BILL_REPRINT: 'إعادة طباعة فاتورة',
    BILL_DELETE: 'حذف فاتورة'
  }
};

const formatChangeValue = (key, value) => {
  switch(key) {
    case 'taxRate':
      return `${value}%`;
    case 'printCopies':
      return `${value} نسخ`;
    case 'requireManagerApproval':
      return value ? 'مفعل' : 'غير مفعل';
    default:
      return value;
  }
};

const getSettingName = (key) => {
  const names = {
    taxRate: 'نسبة الضريبة',
    printCopies: 'عدد النسخ',
    requireManagerApproval: 'موافقة المدير'
  };
  return names[key] || key;
};

function ManagementPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    taxRate: 15,
    printCopies: 1,
    requireManagerApproval: false,
  });
  const [changeHistory, setChangeHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [historyKey, setHistoryKey] = useState(0); // Add this new state

  useEffect(() => {
    // Verify login status and employee info
    const employeeName = localStorage.getItem('employeeName');
    const employeeNumber = localStorage.getItem('employeeNumber');

    if (!employeeName || !employeeNumber) {
        console.error('No employee info found - redirecting to login');
        navigate('/');
        return;
    }

    console.log('Current employee info on mount:', {
        name: employeeName,
        number: employeeNumber
    });
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('posSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Load all system changes
    fetchSystemHistory();
  }, [navigate]);

  const hasUnsavedChanges = () => {
    return Object.keys(tempSettings).length > 0 &&
      Object.entries(tempSettings).some(([key, value]) => value !== settings[key]);
  };

  const handleSettingChange = (key, value) => {
    setTempSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      if (value === settings[key]) {
        delete newSettings[key];
      }
      return newSettings;
    });
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleHistoryUpdate = (newHistory) => {
    setChangeHistory(newHistory);
  };

  const confirmChange = async () => {
    try {
      const newSettings = { ...settings, ...tempSettings };
      
      // Get current employee info
      const currentEmployeeName = localStorage.getItem('employeeName');
      const currentEmployeeNumber = localStorage.getItem('employeeNumber');

      // Debug: Log employee info before sending
      console.log('Employee info before sending:', {
        name: currentEmployeeName,
        number: currentEmployeeNumber
      });

      if (!currentEmployeeName || !currentEmployeeNumber) {
        console.error('Missing employee information');
        toast.error('معلومات الموظف غير متوفرة');
        return;
      }

      // Create history entry
      const historyEntry = {
        timestamp: new Date().toISOString(),
        employeeName: currentEmployeeName,
        employeeNumber: currentEmployeeNumber,
        type: 'SETTINGS',
        changes: Object.entries(tempSettings).map(([key, value]) => ({
          setting: key,
          oldValue: formatChangeValue(key, settings[key]),
          newValue: formatChangeValue(key, value)
        }))
      };

      // Save new settings
      localStorage.setItem('posSettings', JSON.stringify(newSettings));
      setSettings(newSettings);

      // Send history entry to backend
      const response = await axios.post('http://localhost:5001/settings-history', historyEntry);
      console.log('Server response:', response.data);

      // Force history component to refresh
      setHistoryKey(prev => prev + 1);
      setTempSettings({});
      setShowConfirmModal(false);
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ التغييرات');
    }
  };

  const fetchSystemHistory = async () => {
    try {
      // Fetch all types of changes
      const [settingsHistory, productsHistory, billsHistory] = await Promise.all([
        axios.get('http://localhost:5001/settings-history'),
        axios.get('http://localhost:5001/products-history'),
        axios.get('http://localhost:5001/bills-history')
      ]);

      // Combine and sort all changes
      const allChanges = [
        ...settingsHistory.data.map(change => ({
          ...change,
          type: 'SETTINGS'
        })),
        ...productsHistory.data.map(change => ({
          ...change,
          type: change.action.toUpperCase()
        })),
        ...billsHistory.data.map(change => ({
          ...change,
          type: change.action.toUpperCase()
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setChangeHistory(allChanges);
    } catch (error) {
      console.error('Error fetching system history:', error);
      toast.error('فشل في تحميل سجل التغييرات');
    }
  };

  const formatChangeDetails = (change) => {
    switch (change.type) {
      case 'SETTINGS':
        return change.changes.map((c, i) => (
          <div key={i}>
            تم تغيير {getSettingName(c.setting)} من {formatChangeValue(c.setting, c.oldValue)} إلى {formatChangeValue(c.setting, c.newValue)}
          </div>
        ));
      
      case 'PRODUCT_ADD':
        return `تمت إضافة منتج "${change.product.name}"`;
      
      case 'PRODUCT_EDIT':
        return `تم تعديل منتج "${change.product.name}"`;
      
      case 'PRODUCT_DELETE':
        return `تم حذف منتج "${change.product.name}"`;
      
      case 'BILL_REFUND':
        return `تم استرجاع الفاتورة رقم ${change.billNumber}`;
      
      case 'BILL_REPRINT':
        return `تمت إعادة طباعة الفاتورة رقم ${change.billNumber}`;
      
      case 'BILL_DELETE':
        return `تم حذف الفاتورة رقم ${change.billNumber}`;
      
      default:
        return 'تغيير غير معروف';
    }
  };

  return (
    <ManagementContainer>
      <TopBar>
        <PageTitle>إدارة النظام</PageTitle>
        <ActionBar>
          <Link to="/pos" className="back-button">
            <FaArrowLeft /> العودة للمبيعات
          </Link>
        </ActionBar>
      </TopBar>

      <SettingsGrid>
        <SettingCard>
          <h3><FaPercent /> نسبة الضريبة</h3>
          <Form.Group>
            <Form.Control
              type="number"
              value={tempSettings.taxRate ?? settings.taxRate}
              onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
              min="0"
              max="100"
            />
          </Form.Group>
        </SettingCard>

        <SettingCard>
          <h3><FaPrint /> عدد نسخ الطباعة</h3>
          <Form.Group>
            <Form.Control
              type="number"
              value={tempSettings.printCopies ?? settings.printCopies}
              onChange={(e) => handleSettingChange('printCopies', parseInt(e.target.value))}
              min="1"
              max="5"
            />
          </Form.Group>
        </SettingCard>

        <SettingCard>
          <h3><FaUserShield /> موافقة المدير</h3>
          <Form.Check
            type="switch"
            label="تتطلب موافقة المدير للاسترجاع"
            checked={tempSettings.requireManagerApproval ?? settings.requireManagerApproval}
            onChange={(e) => handleSettingChange('requireManagerApproval', e.target.checked)}
          />
        </SettingCard>
      </SettingsGrid>

      {hasUnsavedChanges() && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button variant="primary" size="lg" onClick={handleSaveClick}>
            <FaSave /> حفظ التغييرات
          </Button>
        </div>
      )}

      <HistoryChanges 
        key={historyKey} 
        onRefresh={handleHistoryUpdate}
      />

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تأكيد التغييرات</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          هل أنت متأكد من حفظ جميع التغييرات؟
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={confirmChange}>
            <FaSave /> حفظ
          </Button>
        </Modal.Footer>
      </Modal>
    </ManagementContainer>
  );
}

export default ManagementPage;
