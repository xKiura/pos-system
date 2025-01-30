import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaHistory, FaSave, FaPercent, FaStore, FaImage } from 'react-icons/fa';
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
    restaurantName: 'اسم المطعم',
    restaurantLogo: 'شعار المطعم',
    taxRate: 'نسبة الضريبة',
  };
  return names[key] || key;
};

function ManagementPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    taxRate: 15,
    restaurantName: 'مطعمي',
    restaurantLogo: '',
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

      // Map the English keys to Arabic names when creating history
      const keyToArabic = {
        restaurantName: 'اسم المطعم',
        restaurantLogo: 'شعار المطعم',
        taxRate: 'نسبة الضريبة',
        printCopies: 'عدد النسخ',
        requireManagerApproval: 'موافقة المدير'
      };

      const historyEntry = {
        timestamp: new Date().toISOString(),
        employeeName: currentEmployeeName,
        employeeNumber: currentEmployeeNumber,
        type: 'SETTINGS',
        origin: 'صفحة الإعدادات',
        changes: Object.entries(tempSettings).map(([key, value]) => ({
          setting: keyToArabic[key] || key, // Use Arabic name instead of English key
          oldValue: formatChangeValue(key, settings[key]),
          newValue: formatChangeValue(key, value)
        }))
      };

      // Save new settings
      localStorage.setItem('posSettings', JSON.stringify(newSettings));
      setSettings(newSettings);

      // Send history entry to backend
      const response = await axios.post('http://localhost:5000/settings-history', historyEntry);
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
      const [settings, products, bills] = await Promise.all([
        axios.get('http://localhost:5000/settings-history'),
        axios.get('http://localhost:5000/products-history'),
        axios.get('http://localhost:5000/bills-history')
      ]);

      const getEntryType = (entry) => {
        if (entry.type) return entry.type;
        if (entry.action) return entry.action.toUpperCase();
        return 'UNKNOWN';
      };

      const settingsChanges = Array.isArray(settings.data) 
        ? settings.data.map(change => ({ ...change, type: getEntryType(change) }))
        : [];
      
      const productsChanges = Array.isArray(products.data)
        ? products.data.map(change => ({ ...change, type: getEntryType(change) }))
        : [];
      
      const billsChanges = Array.isArray(bills.data)
        ? bills.data.map(change => ({ ...change, type: getEntryType(change) }))
        : [];

      const allChanges = [...settingsChanges, ...productsChanges, ...billsChanges]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setChangeHistory(allChanges);
    } catch (error) {
      console.error('Error fetching system history:', error);
      toast.error('فشل في تحميل سجل التغييرات');
    }
  };

  // Update the formatChangeDetails function
  const formatChangeDetails = (change) => {
    if (!change) return 'تغيير غير معروف';

    switch (change.type) {
      case 'SETTINGS':
        if (!change.changes || !Array.isArray(change.changes)) return 'تغيير في الإعدادات';
        return change.changes.map((c, i) => {
          const settingName = getSettingName(c.setting);
          let formattedOld = c.oldValue;
          let formattedNew = c.newValue;

          // Special handling for restaurant name and logo
          if (c.setting === 'restaurantName' || c.setting === 'restaurantLogo') {
            formattedOld = `"${c.oldValue || 'لا يوجد'}"`;
            formattedNew = `"${c.newValue}"`;
          }

          return (
            <div key={i}>
              تم تغيير {settingName} من {formattedOld} إلى {formattedNew}
            </div>
          );
        });
      
      case 'INVENTORY_UPDATE':
        if (!change.changes || !Array.isArray(change.changes)) return 'تحديث المخزون';
        return (
          <div>
            {change.changes.map((c, i) => {
              if (!c || !c.detailedChanges) return null;
              
              const changes = c.detailedChanges.map((detail, index) => (
                <li key={index}>
                  {detail.field}: من {detail.oldValue} إلى {detail.newValue}
                  {detail.field === 'سعر التكلفة' ? ' ر.س' : ''}
                </li>
              ));

              return (
                <div key={i}>
                  تم تحديث المنتج "{c.productName}":
                  <ul style={{ margin: '0.5rem 0', paddingRight: '1.5rem' }}>
                    {changes}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      
      case 'PRODUCT_ADD':
        if (!change.product) return 'تمت إضافة منتج';
        return `تمت إضافة منتج "${change.product.name}"`;
      
      case 'PRODUCT_EDIT':
        if (!change.product) return 'تم تعديل منتج';
        return `تم تعديل منتج "${change.product.name}"`;
      
      case 'PRODUCT_DELETE':
        if (!change.product) return 'تم حذف منتج';
        return `تم حذف منتج "${change.product.name}"`;
      
      case 'BILL_REFUND':
        return `تم استرجاع الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
      case 'BILL_REPRINT':
        return `تمت إعادة طباعة الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
      case 'BILL_DELETE':
        return `تم حذف الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
      case 'REPORT_EXPORT':
        if (!change.changes || !Array.isArray(change.changes)) return 'تم تصدير تقرير';
        return (
          <div>
            <div>مصدر التغيير: {change.origin || 'غير معروف'}</div>
            {change.changes.map((c, i) => (
              <div key={i}>{c.details || 'تفاصيل غير متوفرة'}</div>
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
          return 'product';
        case 'BILL_REFUND':
        case 'BILL_REPRINT':
        case 'BILL_DELETE':
          return 'bill';
        default:
          return 'settings'; // Default class
      }
    };

    const changeType = change.type || 'UNKNOWN';
    const changeTypeText = translations.changeTypes[changeType] || translations.changeTypes.UNKNOWN;

    return (
      <HistoryItem key={change.timestamp}>
        <div className="employee-info">
          <span>الموظف: {change.employeeName} #{change.employeeNumber}</span>
          {change.origin && <span className="origin-page">({change.origin})</span>}
        </div>
        <div>
          <span className={`change-type-badge ${getChangeTypeBadgeClass(changeType)}`}>
            {changeTypeText}
          </span>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          {formatChangeDetails(change)}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {format(new Date(change.timestamp), 'dd MMMM yyyy, HH:mm:ss', { locale: ar })}
        </div>
      </HistoryItem>
    );
  };

  // Add this function to handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSettingChange('restaurantLogo', reader.result);
      };
      reader.readAsDataURL(file);
    }
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
          <h3><FaStore /> اسم المطعم</h3>
          <Form.Group>
            <Form.Control
              type="text"
              value={tempSettings.restaurantName ?? settings.restaurantName}
              onChange={(e) => handleSettingChange('restaurantName', e.target.value)}
              placeholder="أدخل اسم المطعم"
            />
          </Form.Group>
        </SettingCard>

        <SettingCard>
          <h3><FaImage /> شعار المطعم</h3>
          <div style={{ textAlign: 'center' }}>
            {(tempSettings.restaurantLogo || settings.restaurantLogo) && (
              <img 
                src={tempSettings.restaurantLogo || settings.restaurantLogo} 
                alt="شعار المطعم"
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '200px', 
                  marginBottom: '1rem' 
                }}
              />
            )}
            <Form.Group>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Form.Group>
          </div>
        </SettingCard>

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
      </Modal>    </ManagementContainer>  );}export default ManagementPage;