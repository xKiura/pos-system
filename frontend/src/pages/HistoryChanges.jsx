import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import styled from 'styled-components';
import { FaHistory, FaCog, FaBox, FaFileInvoice, FaFilter, FaCalendar } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // Add this import

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
    REPORT_EXPORT: 'تصدير تقرير المخزون'
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

  useEffect(() => {
    fetchAllChanges();
  }, []);

  useEffect(() => {
    filterChanges();
  }, [changes, filters]);

  const fetchAllChanges = async () => {
    try {
      const [settings, products, bills] = await Promise.all([
        axios.get('http://localhost:5001/settings-history'),
        axios.get('http://localhost:5001/products-history'),
        axios.get('http://localhost:5001/bills-history')
      ]);

      const allChanges = [
        ...(settings.data || []).filter(change => {
          // Keep the original type instead of forcing everything to SETTINGS
          return change.type || 'SETTINGS';
        }),
        ...(products.data || []).map(change => ({
          ...change,
          type: change.action ? change.action.toUpperCase() : 'UNKNOWN'
        })),
        ...(bills.data || []).map(change => ({
          ...change,
          type: change.action ? change.action.toUpperCase() : 'UNKNOWN'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setChanges(allChanges);
      if (onRefresh) {
        onRefresh(allChanges);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
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
      case 'SETTINGS':
        return change.changes && Array.isArray(change.changes) 
          ? change.changes.map((c, i) => (
              <div key={i}>
                تم تغيير {getSettingName(c.setting)} من "{c.oldValue}" إلى "{c.newValue}"
              </div>
            ))
          : 'تم تغيير الإعدادات';
      
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
        return `تمت إضافة منتج "${change.product?.name || 'غير معروف'}"`;
      
      case 'PRODUCT_EDIT':
        return `تم تعديل منتج "${change.product?.name || 'غير معروف'}"`;
      
      case 'PRODUCT_DELETE':
        return `تم حذف منتج "${change.product?.name || 'غير معروف'}"`;
      
      case 'BILL_REFUND':
        return `تم استرجاع الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
      case 'BILL_REPRINT':
        return `تمت إعادة طباعة الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
      case 'BILL_DELETE':
        return `تم حذف الفاتورة رقم ${change.billNumber || 'غير معروف'}`;
      
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
      case 'BILL_REPRINT':
      case 'BILL_DELETE':
        return 'bill';
      default:
        return 'inventory'; // Default to inventory for unknown types
    }
  };

  useEffect(() => {
    fetchAllChanges();
  }, []); // This will now be triggered when the component gets a new key

  return (
    <HistoryContainer>
      <HistoryHeader>
        <h3><FaHistory /> سجل التغييرات</h3>
        
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
          {filteredChanges.map((change, index) => (
            <HistoryItem
              key={change.timestamp + index}
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
                  {translations.changeTypes[change.type] || 'UNKNOWN'}
                </ChangeTypeBadge>
                <TimeStamp>
                  {change.timestamp ? format(new Date(change.timestamp), 'PPpp', { locale: ar }) : 'وقت غير معروف'}
                </TimeStamp>
              </div>
              <UserInfo>
                <strong>الموظف:</strong>{' '}
                <span className="employee-info">
                  {change.employeeName} #{change.employeeNumber}
                </span>
              </UserInfo>
              <ChangeDetails>
                {formatChangeDetails(change)}
              </ChangeDetails>
            </HistoryItem>
          ))}
        </AnimatePresence>
        
        {filteredChanges.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '2rem' }}
          >
            لا توجد تغييرات مسجلة
          </motion.div>
        )}
      </ScrollableContent>
    </HistoryContainer>
  );
};

export default HistoryChanges;
