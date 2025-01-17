import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const SalesReports = () => {
  return (
    <div className="container mt-5">
      <Link to="/pos" className="btn btn-warning mb-3">
        <FaArrowLeft /> العودة إلى صفحة المبيعات
      </Link>
      <h1 className="mb-4">تقارير المبيعات</h1>
      <form className="mb-4">
        <div className="form-row">
          <div className="col">
            <input type="date" className="form-control" placeholder="Start Date" />
          </div>
          <div className="col">
            <input type="date" className="form-control" placeholder="End Date" />
          </div>
          <div className="col">
            <select className="form-control">
              <option>All Categories</option>
              <option>Category 1</option>
              <option>Category 2</option>
              <option>Category 3</option>
            </select>
          </div>
          <div className="col">
            <button type="submit" className="btn btn-primary">Filter</button>
          </div>
        </div>
      </form>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Category</th>
            <th>Quantity Sold</th>
            <th>Total Sales</th>
          </tr>
        </thead>
        <tbody>
          {/* Example data */}
          <tr>
            <td>2023-10-01</td>
            <td>Product A</td>
            <td>Category 1</td>
            <td>10</td>
            <td>$100</td>
          </tr>
          {/* Add more rows as needed */}
        </tbody>
      </table>
    </div>
  );
};

export default SalesReports;
