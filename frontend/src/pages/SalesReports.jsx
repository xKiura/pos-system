import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary: ", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children; 
  }
}

const SalesReports = ({ filteredOrders = [], orderDetails = {} }) => {
  console.log("filteredOrders: ", filteredOrders);
  console.log("orderDetails: ", orderDetails);

  const calculateProfits = () => {
    if (!Array.isArray(filteredOrders)) {
      return {};
    }

    // Calculate profits from filtered orders
    return filteredOrders.reduce((acc, order) => {
      const date = new Date(order.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += order.totalIncomeWithTax;
      return acc;
    }, {});
  };

  const profits = calculateProfits();
  console.log("profits: ", profits);

  const barData = {
    labels: Object.keys(profits),
    datasets: [
      {
        label: 'Total Income with Tax',
        data: Object.values(profits),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: Object.keys(profits),
    datasets: [
      {
        label: 'Total Income with Tax',
        data: Object.values(profits),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  const pieData = {
    labels: Object.keys(profits),
    datasets: [
      {
        label: 'Total Income with Tax',
        data: Object.values(profits),
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Reports',
      },
    },
  };

  return (
    <ErrorBoundary>
      <div className="container mt-5">
        <Link to="/pos" className="btn btn-warning mb-3">
          <FaArrowLeft /> العودة إلى صفحة المبيعات
        </Link>
        <h1 className="mb-4">تقارير المبيعات</h1>
        <form className="mb-4">
          <div className="form-row">
            <div className="col">
              {/* Add form elements here */}
            </div>
          </div>
        </form>
        <div className="mb-4">
          <h2>Bar Chart</h2>
          <Bar data={barData} options={options} />
        </div>
        <div className="mb-4">
          <h2>Line Chart</h2>
          <Line data={lineData} options={options} />
        </div>
        <div className="mb-4">
          <h2>Pie Chart</h2>
          <Pie data={pieData} options={options} />
        </div>
        <div className="mb-4">
          <h2>Order Details</h2>
          <pre>{JSON.stringify(orderDetails, null, 2)}</pre>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SalesReports;