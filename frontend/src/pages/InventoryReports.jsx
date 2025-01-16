import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const InventoryReports = () => {
  return (
    <div className="container mt-5">
      <h1 className="mb-4">Inventory Reports</h1>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Stock Level</th>
            <th>Low Stock Alert</th>
          </tr>
        </thead>
        <tbody>
          {/* Example data */}
          <tr>
            <td>Product A</td>
            <td>Category 1</td>
            <td>5</td>
            <td className="text-danger">Low Stock</td>
          </tr>
          {/* Add more rows as needed */}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryReports;
