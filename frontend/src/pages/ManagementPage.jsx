import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHistory, FaSave, FaCog, FaPercent, FaPrint, FaUserShield } from 'react-icons/fa';
import axios from 'axios';
import styled from 'styled-components';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

const ManagementContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  direction: rtl;
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

function ManagementPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    taxRate: 15,
    printCopies: 1,
    requireManagerApproval: false,
  });
  const [changeHistory, setChangeHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [employeeName] = useState(localStorage.getItem('employeeName'));
  const [employeeNumber] = useState(localStorage.getItem('employeeNumber'));
  const [hasChanges, setHasChanges] = useState(false);
  const [tempSettings, setTempSettings] = useState({});

  useEffect(() => {
    fetchSettings();
    fetchChangeHistory();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const fetchChangeHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/settings/history');
      setChangeHistory(response.data);
    } catch (error) {
      toast.error('Failed to load change history');
    }
  };

  const handleSettingChange = (key, value) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSaveClick = () => {
    setPendingChanges({ ...settings, ...tempSettings });
    setShowConfirmModal(true);
  };

  const confirmChange = async () => {
    try {
      const changeData = {
        ...settings,
        ...tempSettings,
        changedBy: employeeName,
        employeeNumber,
        timestamp: new Date().toISOString()
      };

      await axios.post('http://localhost:5000/settings', changeData);
      setSettings(prev => ({ ...prev, ...tempSettings }));
      
      // Add to change history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        employeeName,
        employeeNumber,
        changes: Object.entries(tempSettings)
          .map(([key, value]) => ({
            setting: key,
            oldValue: settings[key],
            newValue: value
          }))
      };
      
      await axios.post('http://localhost:5000/settings/history', historyEntry);
      setChangeHistory([historyEntry, ...changeHistory]);
      
      setTempSettings({});
      setHasChanges(false);
      toast.success('تم حفظ التغييرات بنجاح');
      setShowConfirmModal(false);
    } catch (error) {
      toast.error('فشل في حفظ التغييرات');
    }
  };

  return (
    <ManagementContainer>
      <TopBar>
        <h2>إدارة النظام</h2>
        <Button variant="outline-primary" onClick={() => navigate('/pos')}>
          <FaArrowLeft /> العودة للمبيعات
        </Button>
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

      {hasChanges && (
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
              <strong>التاريخ:</strong> {new Date(entry.timestamp).toLocaleString('ar-SA')}
            </div>
            <div>
              <strong>الموظف:</strong> {entry.employeeName} (#{entry.employeeNumber})
            </div>
            <div>
              {entry.changes.map((change, i) => (
                <div key={i}>
                  تم تغيير {change.setting} من {change.oldValue} إلى {change.newValue}
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
