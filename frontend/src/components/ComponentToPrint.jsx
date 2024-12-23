import React from 'react';

export const ComponentToPrint = React.forwardRef((props, ref) => {
    const { bill, totalAmount } = props;
    return (
        <div ref={ref} className='p-5'>
            <table className='table'>
                <thead>
                    <tr>
                        <td className="border-end">#</td>
                        <td className="border-end">المنتج</td>
                        <td className="border-end">السعر</td>
                        <td className="border-end">الكمية</td>
                        <td className="border-end">المجموع</td>
                    </tr>
                </thead>
                <tbody>
                    {bill.length === 0 ? (
                    []
                    ) : (
                        bill.map((billItem, key) => (
                            <tr key={key} className="border-bottom">
                                <td className="border-end">{key + 1}</td>
                                <td className="border-end">{billItem.name}</td>
                                <td className="border-end">{billItem.price}</td>
                                <td className="border-end">{billItem.quantity}</td>
                                <td className="border-end">{billItem.totalAmount}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <h2 className="px-2">كامل المجموع : {totalAmount} ر.س</h2>
        </div>
    );
});