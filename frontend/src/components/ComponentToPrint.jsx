import React from 'react';

export const ComponentToPrint = React.forwardRef((props, ref) => {
  const { bill, employeeName, employeeNumber, orderNumber, isRefunded } = props;
  const totalAmount = bill.reduce((sum, item) => sum + item.totalAmount, 0);
  const tax = Math.round(totalAmount * 0.15);
  const totalWithTax = totalAmount + tax;

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
        <h2 style={{ margin: '0' }}>مندي ومشوي</h2>
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
          المجموع: {totalAmount.toFixed(2)}
        </p>
        <p style={{ margin: '5px 0' }}>
          الضريبة (15%): {tax.toFixed(2)}
        </p>
        <p style={{
          fontWeight: 'bold',
          margin: '5px 0'
        }}>
          الإجمالي مع الضريبة: {totalWithTax.toFixed(2)}
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