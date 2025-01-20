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
  
  .employee-info {
    display: flex;
    gap: 1rem;
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .origin-page {
    color: #64748b;
    font-style: italic;
  }
  
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
    &.inventory { background: #fef3c7; color: #92400e; } /* New color for inventory changes */
    &.report { background: #f3e8ff; color: #6b21a8; } /* New color for report exports */
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
    BILL_DELETE: 'حذف فاتورة',
    INVENTORY_UPDATE: 'تحديث المخزون',
    REPORT_EXPORT: 'تصدير تقرير'
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
      
      const currentEmployeeName = localStorage.getItem('employeeName');
      const currentEmployeeNumber = localStorage.getItem('employeeNumber');

      if (!currentEmployeeName || !currentEmployeeNumber) {
        console.error('Missing employee information');
        toast.error('معلومات الموظف غير متوفرة');
        return;
      }

      const historyEntry = {
        timestamp: new Date().toISOString(),
        employeeName: currentEmployeeName,
        employeeNumber: currentEmployeeNumber,
        type: 'SETTINGS',
        origin: 'صفحة الإعدادات',
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
            تم تغيير {getSettingName(c.setting)} من "{c.oldValue}" إلى "{c.newValue}"
          </div>
        ));
      
      case 'INVENTORY_UPDATE':
        return (
          <div>
            {change.changes.map((c, i) => (
              <div key={i}>
                تم تحديث المنتج "{c.productName}":
                <ul style={{ margin: '0.5rem 0', paddingRight: '1.5rem' }}>
                  <li>المخزون: من {c.oldStock} إلى {c.newStock}</li>
                  {c.oldCostPrice !== c.newCostPrice && (
                    <li>سعر التكلفة: من {c.oldCostPrice} إلى {c.newCostPrice} ر.س</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        );
      
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
      
      case 'REPORT_EXPORT':
        return (
          <div>
            <div>مصدر التغيير: {change.origin}</div>
            {change.changes.map((c, i) => (
              <div key={i}>{c.details}</div>
            ))}
          </div>
        );
      
      default:
        return 'تغيير غير معروف';
    }
  };

  const renderHistoryItem = (change) => {
    const getChangeTypeBadgeClass = (type) => {
      switch (type) {
        case 'SETTINGS':
          return 'settings';
        case 'INVENTORY_UPDATE':
          return 'inventory';
        case 'REPORT_EXPORT':
          return 'report';
        case 'PRODUCT_ADD':
        case 'PRODUCT_EDIT':
        case 'PRODUCT_DELETE':
          return 'product';
        case 'BILL_REFUND':
        case 'BILL_REPRINT':
        case 'BILL_DELETE':
          return 'bill';
        default:
          return '';
      }
    };

    return (
      <HistoryItem key={change.timestamp}>
        <div className="employee-info">
          <span>الموظف: {change.employeeName} #{change.employeeNumber}</span>
          {change.origin && <span className="origin-page">({change.origin})</span>}
        </div>
        <div>
          <span className={`change-type-badge ${getChangeTypeBadgeClass(change.type)}`}>
            {translations.changeTypes[change.type]}
          </span>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          {formatChangeDetails(change)}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {format(new Date(change.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ar })}
        </div>
      </HistoryItem>
    );
  };

  return (
    <ManagementContainer>
      <TopBar>
        <PageTitle>إدارة النظام</PageTitle>
        <ActionBar>
          <Link to="/pos" className="back-button">
            <FaArrowLeft /> العودة لصفحة المبيعات
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
