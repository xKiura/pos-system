import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaHistory, FaSave, FaPercent, FaPrint, FaUserShield } from 'react-icons/fa';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import styled from 'styled-components';

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
  const [employeeName] = useState(localStorage.getItem('employeeName') || 'Admin');
  const [employeeNumber] = useState(localStorage.getItem('employeeNumber') || '0001');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('posSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Load change history from localStorage
    const savedHistory = localStorage.getItem('settingsHistory');
    if (savedHistory) {
      setChangeHistory(JSON.parse(savedHistory));
    }
  }, []);

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

  const confirmChange = () => {
    try {
      const newSettings = { ...settings, ...tempSettings };
      
      // Save new settings
      localStorage.setItem('posSettings', JSON.stringify(newSettings));
      setSettings(newSettings);

      // Create history entry
      const historyEntry = {
        timestamp: new Date().toISOString(),
        employeeName,
        employeeNumber,
        changes: Object.entries(tempSettings).map(([key, value]) => ({
          setting: key,
          oldValue: settings[key],
          newValue: value
        }))
      };

      // Update history
      const newHistory = [historyEntry, ...changeHistory].slice(0, 50); // Keep last 50 changes
      localStorage.setItem('settingsHistory', JSON.stringify(newHistory));
      setChangeHistory(newHistory);

      // Reset temp settings
      setTempSettings({});
      setShowConfirmModal(false);
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error) {
      toast.error('فشل في حفظ التغييرات');
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

      <HistoryContainer>
        <h3><FaHistory /> سجل التغييرات</h3>
        {changeHistory.map((entry, index) => (
          <HistoryItem key={index}>
            <div>
              <strong>التاريخ:</strong> {new Date(entry.timestamp).toLocaleString()}
            </div>
            <div>
              <strong>الموظف:</strong> {entry.employeeName} (#{entry.employeeNumber})
            </div>
            <div>
              {entry.changes.map((change, i) => (
                <div key={i}>
                  تم تغيير {getSettingName(change.setting)}:
                  <br />
                  <span style={{ marginRight: '20px' }}>
                    من: {formatChangeValue(change.setting, change.oldValue)}
                  </span>
                  <span style={{ marginRight: '20px' }}>
                    إلى: {formatChangeValue(change.setting, change.newValue)}
                  </span>
                </div>
              ))}
            </div>
          </HistoryItem>
        ))}
      </HistoryContainer>

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
