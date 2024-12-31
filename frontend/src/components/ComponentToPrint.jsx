import React from 'react';

export const ComponentToPrint = React.forwardRef((props, ref) => {
    const { bill, totalAmount } = props;

    const roundToNearestHalf = (num) => {
        return Math.round(num * 2) / 2;
    };

    const billTotalTax = roundToNearestHalf(totalAmount * 0.15);
    const currentDateTime = new Date().toLocaleString();
    const restaurantName = "مندي ومشوي";

    return (
        <div ref={ref} className='p-5'>
            <table className='table'>
                <thead>
                    <tr>
                        <td colSpan="5" className="text-end">{currentDateTime}</td>
                    </tr>
                    <tr>
                        <td>المجموع</td>
                        <td>الكمية</td>
                        <td>السعر</td>
                        <td>المنتج</td>
                        <td>#</td>
                    </tr>
                </thead>
                <tbody>
                    {bill.length === 0 ? (
                        []
                    ) : (
                        bill.map((billItem, key) => (
                            <tr key={key}>
                                <td>{Math.ceil(billItem.totalAmount)}</td>
                                <td>{billItem.quantity}</td>
                                <td>{billItem.price}</td>
                                <td>{billItem.name}</td>
                                <td>{key + 1}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <h6 className="px-4">المجموع : {Math.ceil(totalAmount)} ر.س</h6>
            <h6 className="px-4">ضريبة المبيعات (15%) : {billTotalTax.toFixed(2)} ر.س</h6>
            <h2 className="px-4">كامل المجموع : {(totalAmount + billTotalTax).toFixed(1)} ر.س</h2>
            <div className="text-center mt-5">
                <h4>بالهنا والشفا</h4>
                <h1>{restaurantName}</h1>
            </div>
        </div>
    );
});