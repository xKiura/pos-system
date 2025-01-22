import React from 'react';
import { useSettings } from '../context/SettingsContext';

const roundToNearestHalf = (num) => {
  if (!num || isNaN(num)) return 0;
  const decimal = num - Math.floor(num);
  if (decimal === 0.5) return Math.floor(num) + 0.5;  // Keep .5 as is
  return decimal > 0.5 ? Math.ceil(num) : Math.floor(num);  // Round to nearest whole number
};

const calculateTotals = (bill, taxRate = 15) => {
  const subtotal = bill.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
  const rawTax = (subtotal * (taxRate / 100)) || 0;
  const tax = roundToNearestHalf(rawTax);
  const total = subtotal + tax;
  
  return {
    subtotal: subtotal || 0,
    tax: tax || 0,
    total: total || 0
  };
};

export const ComponentToPrint = React.forwardRef((props, ref) => {
  const { bill, employeeName, employeeNumber, orderNumber, isRefunded } = props;
  const { settings } = useSettings();

  const { subtotal, tax, total } = calculateTotals(bill, settings?.taxRate || 15);

  const restaurantName = settings?.restaurantName || 'مطعمي';
  const restaurantLogo = settings?.restaurantLogo;

  return (
    <div ref={ref} className="print-container" style={{
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl',
      padding: '20px',
      maxWidth: '300px',
      margin: '0 auto'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        {restaurantLogo && (
          <img 
            src={restaurantLogo} 
            alt={restaurantName}
            style={{
              maxWidth: '150px',
              maxHeight: '150px',
              marginBottom: '10px'
            }}
          />
        )}
        <h2 style={{ 
          margin: '0 0 10px 0',
          fontSize: '1.5em',
          fontWeight: 'bold'
        }}>{restaurantName}</h2>
        <p style={{ margin: '5px 0' }}>
          رقم الفاتورة: #{orderNumber.toString().padStart(6, '0')}
        </p>
        <p style={{ margin: '5px 0' }}>
          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </p>
        <p style={{ margin: '5px 0' }}>
          الموظف: {employeeName} (#{employeeNumber})
        </p>
        {isRefunded && (
          <p style={{ 
            color: '#ef4444', 
            fontWeight: 'bold',
            margin: '5px 0'
          }}>
            تم الاسترجاع
          </p>
        )}
      </div>

      <div style={{
        borderTop: '1px dashed #000',
        borderBottom: '1px dashed #000',
        margin: '10px 0',
        padding: '10px 0'
      }}>
        <table style={{
          width: '100%',
          textAlign: 'right',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ fontWeight: 'bold' }}>
              <td>الصنف</td>
              <td>الكمية</td>
              <td>السعر</td>
              <td>المجموع</td>
            </tr>
          </thead>
          <tbody>
            {bill.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{parseFloat(item.price).toFixed(2)}</td>
                <td>{item.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        textAlign: 'left',
        marginTop: '10px'
      }}>
        <p style={{ margin: '5px 0' }}>
          المجموع: {subtotal.toFixed(2)}
        </p>
        <p style={{ margin: '5px 0' }}>
          الضريبة ({settings?.taxRate || 15}%): {tax.toFixed(2)}
        </p>
        <p style={{
          fontWeight: 'bold',
          margin: '5px 0'
        }}>
          الإجمالي مع الضريبة: {total.toFixed(2)}
        </p>
      </div>

      <p style={{
        textAlign: 'center',
        marginTop: '20px'
      }}>
        شكراً لزيارتكم
      </p>
    </div>
  );
});