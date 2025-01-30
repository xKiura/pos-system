import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import styled from 'styled-components';
import { FaHistory, FaCog, FaBox, FaFileInvoice, FaFilter, FaCalendar, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // Add this import
import { Modal, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Update the HistoryContainer styling
const HistoryContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.05);
  height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// Add new styled components
const HistoryHeader = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  flex: 1;
  padding-right: 0.5rem;
  margin-right: -0.5rem;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    
    &:hover {
      background: #94a3b8;
    }
  }
`;

// Update HistoryItem styling
const HistoryItem = styled(motion.div)`
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f1f5f9;
    transform: translateX(-4px);
    box-shadow: 4px 4px 12px rgba(0,0,0,0.05);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .employee-info {
    display: flex;
    gap: 1rem;
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .origin-page {
    color: #64748b;
    font-style: italic;
    margin-right: 0.5rem;
  }
`;

// Add animation variants
const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const FilterSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;

  select, input {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    flex: 1;
  }
`;

const ChangeTypeBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 1rem;
  
  &.settings { background: #e0f2fe; color: #0369a1; }
  &.product { background: #dcfce7; color: #166534; }
  &.bill { background: #fee2e2; color: #991b1b; }
  &.inventory { background: #fef3c7; color: #92400e; }
  &.report { background: #f3e8ff; color: #6b21a8; }
  &.usersetting { background: #ddd6fe; color: #5b21b6; } // Add this new style
`;

const TimeStamp = styled.span`
  color: #64748b;
  font-size: 0.875rem;
`;

const UserInfo = styled.div`
  margin: 0.5rem 0;
  color: #4b5563;
  font-size: 0.875rem;
  
  .employee-info {
    display: inline-block;
    direction: ltr;
  }
`;

const ChangeDetails = styled.div`
  margin-top: 0.5rem;
  color: #1e293b;
`;

const DeleteButton = styled.button`
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fecaca;
    transform: translateY(-1px);
  }
`;

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 12px;
    border: none;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
  }

  .modal-header {
    border-bottom: 1px solid #f1f5f9;
    padding: 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
    text-align: center;
    
    .warning-icon {
      color: #dc2626;
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  }

  .modal-footer {
    border-top: 1px solid #f1f5f9;
    padding: 1rem 1.5rem;
    
    button {
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      
      &.btn-secondary {
        background: #f1f5f9;
        border: none;
        color: #475569;
        
        &:hover {
          background: #e2e8f0;
        }
      }
      
      &.btn-danger {
        background: #dc2626;
        border: none;
        
        &:hover {
          background: #b91c1c;
        }
      }
    }
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
    INVENTORY_UPDATE: 'تحديث المخزون', // This is the key one we need
    REPORT_EXPORT: 'تصدير تقرير',
    'إعدادات شخصية': 'إعدادات شخصية', // Add this new type
    REPORT_SAVE: 'حفظ تقرير',
    REPORT_DELETE: 'حذف تقرير',
    BILL_REVERT_REFUND: 'إلغاء استرجاع فاتورة',
    UNKNOWN: 'نوع غير معروف'
  },
  filterLabels: {
    all: 'جميع التغييرات',
    settings: 'الإعدادات',
    products: 'المنتجات',
    bills: 'الفواتير',
    inventory: 'المخزون',
    dateFrom: 'من تاريخ',
    dateTo: 'إلى تاريخ'
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

export const HistoryChanges = ({ onRefresh }) => {
  const [changes, setChanges] = useState([]);
  const [filteredChanges, setFilteredChanges] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchAllChanges();
  }, []);

  useEffect(() => {
    filterChanges();
  }, [changes, filters]);

  const fetchAllChanges = async () => {
    try {
      // Fetch all types of history records
      const [settingsHistory, productsHistory, billsHistory, inventoryHistory] = await Promise.all([
        axios.get('http://localhost:5000/settings-history').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/productsHistory').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/bills-history').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/inventory-history').catch(() => ({ data: [] }))
      ]);

      // Combine all histories and ensure each entry has a type
      const allChanges = [
        ...(Array.isArray(settingsHistory.data) ? settingsHistory.data.map(entry => ({...entry, type: entry.type || 'SETTINGS'})) : []),
        ...(Array.isArray(productsHistory.data) ? productsHistory.data : []),
        ...(Array.isArray(billsHistory.data) ? billsHistory.data.map(entry => ({...entry, type: entry.action || 'BILL_ACTION'})) : []),
        ...(Array.isArray(inventoryHistory.data) ? inventoryHistory.data : [])
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      console.log('Combined history entries:', allChanges.length);
      setChanges(allChanges);
      if (onRefresh) {
        onRefresh(allChanges);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setChanges([]);
    }
  };

  const filterChanges = () => {
    let filtered = [...changes];

    if (filters.type !== 'all') {
      filtered = filtered.filter(change => {
        if (filters.type === 'inventory') {
          return change.type === 'INVENTORY_UPDATE' || change.type === 'REPORT_EXPORT';
        }
        return change.type && change.type.toLowerCase().startsWith(filters.type);
      });
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(change => 
        new Date(change.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(change => 
        new Date(change.timestamp) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    setFilteredChanges(filtered);
  };

  const formatChangeDetails = (change) => {
    if (!change || !change.type) return 'تغيير غير معروف';

    switch (change.type) {
      case 'INVENTORY_UPDATE':
        if (!change.changes || !Array.isArray(change.changes)) return 'تحديث المخزون';
        return (
          <div>
            {change.changes.map((c, i) => {
              if (!c || !c.detailedChanges || c.detailedChanges.length === 0) return null;
              
              // Only show changes where oldValue !== newValue
              const actualChanges = c.detailedChanges.filter(
                detail => detail.oldValue !== detail.newValue
              );

              if (actualChanges.length === 0) return null;

              return (
                <div key={i}>
                  تم تحديث المنتج "{c.productName}":
                  <ul style={{ margin: '0.5rem 0', paddingRight: '1.5rem' }}>
                    {actualChanges.map((detail, index) => (
                      <li key={index}>
                        {detail.field}: من {detail.oldValue} إلى {detail.newValue}
                        {detail.field === 'سعر التكلفة' ? ' ر.س' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );

      case 'SETTINGS':
        if (!change.changes || !Array.isArray(change.changes)) return 'تغيير في الإعدادات';
        return change.changes.map((c, i) => (
          <div key={i}>
            تم تغيير {getSettingName(c.setting)} من "{c.oldValue}" إلى "{c.newValue}"
          </div>
        ));
      
      case 'PRODUCT_ADD':
        return `تمت إضافة منتج "${change.product?.name || 'غير معروف'}"`;
      
      case 'PRODUCT_EDIT':
        if (!change.changes || !change.changes[0]) return 'تم تعديل منتج';
        
        // Filter out unchanged values
        const actualChanges = change.changes[0].detailedChanges.filter(
          detail => detail.oldValue !== detail.newValue
        );

        if (actualChanges.length === 0) return 'تم تعديل منتج';

        return (
          <div>
            تم تعديل المنتج "{change.changes[0].productName}":
            <ul style={{ margin: '0.5rem 0', paddingRight: '1.5rem' }}>
              {actualChanges.map((detail, index) => (
                <li key={index}>
                  {detail.field}: من {detail.oldValue} إلى {detail.newValue}
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'PRODUCT_DELETE':
        return `تم حذف منتج "${change.product?.name || 'غير معروف'}"`;
      
      case 'BILL_REFUND':
        if (!change.changes || !Array.isArray(change.changes)) {
          return `تم استرجاع الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
        }
        return change.changes.map((c, i) => (
          <div key={i}>
            {c.details}
            {c.amount && 
              <div style={{ marginTop: '0.5rem', color: '#dc2626' }}>
                المبلغ المسترجع: {c.amount.toFixed(2)} ريال
                {c.subtotal && c.tax && 
                  <span style={{ fontSize: '0.9em', color: '#666', marginRight: '0.5rem' }}>
                    (الصافي: {c.subtotal.toFixed(2)} + الضريبة: {c.tax.toFixed(2)})
                  </span>
                }
              </div>
            }
          </div>
        ));
      
      case 'BILL_REPRINT':
        return `تمت إعادة طباعة الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
      case 'BILL_DELETE':
        return `تم حذف الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
      case 'إعدادات شخصية':
        if (!change.changes || !Array.isArray(change.changes)) return 'تغيير في الإعدادات الشخصية';
        return change.changes.map((c, i) => (
          <div key={i}>{c.details}</div>
        ));

      case 'REPORT_SAVE':
        return change.changes?.map((c, i) => (
          <div key={i}>
            <div>{c.details}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#666' }}>
              معرف التقرير: #{c.reportId || 'غير معروف'}
              {c.billCount && <span> | عدد الفواتير: {c.billCount}</span>}
              {c.period && c.period.from !== 'all' && (
                <span> | الفترة: {c.period.from} إلى {c.period.to}</span>
              )}
              {c.reportDate && <span> | تاريخ التقرير: {c.reportDate}</span>}
              <br />
              الإجمالي: {c.totalAmount?.toFixed(2) || '0.00'} ريال
            </div>
          </div>
        )) || 'تم حفظ تقرير جديد';

      case 'REPORT_DELETE':
        return change.changes?.map((c, i) => (
          <div key={i}>
            <div>تم حذف التقرير رقم {c.reportId}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#666' }}>
              معرف التقرير: #{c.reportId || 'غير معروف'}
              {c.billCount && <span> | عدد الفواتير: {c.billCount}</span>}
              {c.reportDate && <span> | تاريخ التقرير: {c.reportDate}</span>}
            </div>
          </div>
        )) || 'تم حذف تقرير';

      case 'BILL_REFUND':
        return change.changes?.map((c, i) => (
          <div key={i}>
            {c.details}
            <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#666' }}>
              المبلغ المسترجع: {c.total.toFixed(2)} ريال
              <br />
              عدد الأصناف: {c.items?.length || 0}
            </div>
          </div>
        ));

      case 'BILL_REVERT_REFUND':
        return change.changes?.map((c, i) => (
          <div key={i}>
            {c.details || `تم إلغاء استرجاع الفاتورة رقم ${change.billNumber || 'غير معروف'}`}
          </div>
        ));

      default:
        return 'تغيير غير معروف';
    }
  };

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
      case 'BILL_REVERT_REFUND':
      case 'BILL_DELETE':
        return 'bill';
      case 'إعدادات شخصية': // Add this case
        return 'usersetting';
      case 'REPORT_SAVE':
      case 'REPORT_DELETE':
        return 'report';
      default:
        return 'inventory'; // Default to inventory for unknown types
    }
  };

  const handleDeleteHistory = async () => {
    try {
      setShowDeleteModal(false); // Close modal first
      
      const response = await axios.delete('http://localhost:5000/history');
      
      if (response.data.success) {
        setChanges([]); // Clear local changes
        setFilteredChanges([]); // Clear filtered changes
        if (onRefresh) {
          onRefresh([]); // Update parent component
        }
        toast.success('تم مسح سجل التغييرات بنجاح');
      } else {
        throw new Error(response.data.message || 'Failed to clear history');
      }
    } catch (error) {
      console.error('Error deleting history:', error);
      toast.error(error.response?.data?.message || 'فشل في مسح سجل التغييرات');
    }
  };

  useEffect(() => {
    fetchAllChanges();
  }, []); // This will now be triggered when the component gets a new key

  return (
    <HistoryContainer>
      <HistoryHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><FaHistory /> سجل التغييرات</h3>
          {filteredChanges.length > 0 && (
            <DeleteButton onClick={() => setShowDeleteModal(true)}>
              <FaTrash /> مسح السجل
            </DeleteButton>
          )}
        </div>
        
        <FilterSection>
          <FilterGroup>
            <FaFilter />
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="all">{translations.filterLabels.all}</option>
              <option value="settings">{translations.filterLabels.settings}</option>
              <option value="product">{translations.filterLabels.products}</option>
              <option value="bill">{translations.filterLabels.bills}</option>
              <option value="inventory">{translations.filterLabels.inventory}</option>
            </select>
          </FilterGroup>
          
          <FilterGroup>
            <FaCalendar />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </FilterGroup>
        </FilterSection>
      </HistoryHeader>

      <ScrollableContent>
        <AnimatePresence mode="sync">
          {filteredChanges.map((change, index) => {
            if (!change) return null;
            
            return (
              <HistoryItem
                key={`${change.timestamp || index}-${index}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ 
                  duration: 0.2,
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
              >
                <div>
                  <ChangeTypeBadge className={getChangeTypeBadgeClass(change.type)}>
                    {translations.changeTypes[change.type] || translations.changeTypes.UNKNOWN}
                  </ChangeTypeBadge>
                  <TimeStamp>
                    {change.timestamp ? 
                      format(new Date(change.timestamp), 'PPpp', { locale: ar }) : 
                      'وقت غير معروف'
                    }
                  </TimeStamp>
                </div>
                <UserInfo>
                  <strong>الموظف:</strong>{' '}
                  <span className="employee-info">
                    {change.employeeName || 'غير معروف'} #{change.employeeNumber || '???'}
                  </span>
                </UserInfo>
                <ChangeDetails>
                  {formatChangeDetails(change)}
                </ChangeDetails>
              </HistoryItem>
            );
          })}
        </AnimatePresence>
        
        {(!filteredChanges || filteredChanges.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '2rem' }}
          >
            لا توجد تغييرات مسجلة
          </motion.div>
        )}
      </ScrollableContent>

      <StyledModal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>تأكيد مسح السجل</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FaTrash className="warning-icon" />
          <h4>هل أنت متأكد من مسح سجل التغييرات؟</h4>
          <p style={{ color: '#64748b' }}>لا يمكن التراجع عن هذا الإجراء</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={handleDeleteHistory}>
            مسح السجل
          </Button>
        </Modal.Footer>
      </StyledModal>
    </HistoryContainer>
  );
};

export default HistoryChanges;
