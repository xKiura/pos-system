import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import { format, subDays } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ComposedChart,
  Area,
} from 'recharts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';

const GlobalStylesWrapper = styled('div')(({ theme }) => ({
  fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  direction: 'rtl',
  '.back-button': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: '#edf2f7',
    color: '#4a5568',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    marginBottom: '1rem',
    
    '&:hover': {
      background: '#e2e8f0',
      transform: 'translateX(-2px)'
    }
  }
}));

// Update these styled components
const TopBar = styled('div')(({ theme }) => ({
  fontFamily: 'inherit',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  padding: '0.5rem 1rem',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
  width: '100%',
  flexDirection: 'row-reverse' // Add this to reverse the order for RTL
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'inherit',
  margin: 0,
  fontSize: '1.5rem',
  color: '#1e293b',
  fontWeight: 600
}));

const ActionBar = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: '1rem',
  alignItems: 'center'
}));

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  ChartTooltip,
  ChartLegend
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontFamily: 'inherit',
  fontWeight: 600,
  '&.title': {
    fontSize: '1.5rem',
    marginBottom: theme.spacing(3),
    color: theme.palette.primary.main,
  },
  '&.subtitle': {
    fontSize: '1.2rem',
    marginBottom: theme.spacing(2),
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const ProductImage = styled('img')({
  width: 50,
  height: 50,
  borderRadius: '50%',
  objectFit: 'cover',
  marginRight: 8,
});

// Add translations object before the SalesReports component
const translations = {
  backToSales: 'العودة إلى المبيعات',
  salesReports: 'تقارير المبيعات'
};

const SalesReports = () => {
  // Add new state for products with images
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [filterType, setFilterType] = useState('daily');
  const [selectedTimingCategory, setSelectedTimingCategory] = useState('الكل');

  // Add categories array
  const categories = ['الكل', 'رز', 'مشويات', 'مشروبات', 'وجبات'];

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/confirmed-orders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched orders:', data);
      setOrders(data);
    } catch (err) {
      setError(`Failed to fetch orders: ${err.message}`);
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new function to fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const roundToNearestHalf = (num) => {
    const decimal = num - Math.floor(num);
    if (decimal === 0.5) return num;
    return decimal > 0.5 ? Math.ceil(num) : Math.floor(num);
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) return 0;
    // For tax calculations
    if (value.toString().includes('.15')) {
      return roundToNearestHalf(value);
    }
    return Number(value.toFixed(2));
  };

  const calculateProfits = (orders) => {
    if (!Array.isArray(orders)) {
      return {};
    }

    return orders.reduce((acc, order) => {
      const date = new Date(order.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += formatNumber(order.totalIncomeWithTax);
      return acc;
    }, {});
  };

  const calculateDetailedProfits = (orders) => {
    if (!Array.isArray(orders)) return {};
    
    return orders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (!acc[item.name]) {
          acc[item.name] = {
            revenue: 0,
            cost: 0,
            profit: 0,
            quantity: 0
          };
        }
        acc[item.name].revenue += formatNumber(item.price * item.quantity);
        acc[item.name].cost += formatNumber(item.costPrice * item.quantity);
        acc[item.name].profit += formatNumber((item.price - item.costPrice) * item.quantity);
        acc[item.name].quantity += Number(item.quantity) || 0;
      });
      return acc;
    }, {});
  };

  const handleExport = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sales_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    const headers = ['Product,Quantity,Revenue,Cost,Profit,Margin\n'];
    const rows = Object.entries(calculateDetailedProfits(orders)).map(([product, data]) => {
      return `${product},${data.quantity},${data.revenue},${data.cost},${data.profit},${((data.profit / data.revenue) * 100).toFixed(2)}%\n`;
    });
    return headers.concat(rows).join('');
  };

  const calculateProductMetrics = (orders) => {
    if (!Array.isArray(orders)) return [];
    
    const metrics = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (!acc[item.name]) {
          acc[item.name] = {
            name: item.name,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
            averagePrice: 0,
            totalCost: 0,
            profitMargin: 0
          };
        }
        acc[item.name].quantitySold += Number(item.quantity) || 0;
        acc[item.name].revenue += formatNumber(item.price * item.quantity);
        acc[item.name].totalCost += formatNumber(item.costPrice * item.quantity);
        acc[item.name].profit += formatNumber((item.price - item.costPrice) * item.quantity);
      });
      return acc;
    }, {});

    return Object.values(metrics).map(item => ({
      ...item,
      averagePrice: formatNumber(item.revenue / item.quantitySold),
      profitMargin: formatNumber((item.profit / item.revenue) * 100)
    }));
  };

  const calculateDailyTrends = (orders) => {
    if (!Array.isArray(orders)) return [];
    
    const dailyData = orders.reduce((acc, order) => {
      const date = new Date(order.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          orders: 0,
          itemsSold: 0,
          averageOrderValue: 0
        };
      }
      acc[date].revenue += formatNumber(order.totalIncomeWithTax);
      acc[date].orders += 1;
      acc[date].itemsSold += order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      return acc;
    }, {});

    return Object.values(dailyData).map(day => ({
      ...day,
      averageOrderValue: formatNumber(day.revenue / day.orders)
    }));
  };

  // Modify calculateProductTimings to include product images
  const calculateProductTimings = (orders) => {
    if (!Array.isArray(orders)) return [];
    
    const timings = orders.reduce((acc, order) => {
      const orderDate = new Date(order.date);
      const hour = orderDate.getHours();
      const dayOfWeek = orderDate.toLocaleDateString('ar-SA', { weekday: 'long' });
      
      // Create 3-hour time slots for better grouping
      const timeSlotIndex = Math.floor(hour / 3);
      const timeSlots = [
        'صباحاً (6-9)', 
        'صباحاً (9-12)',
        'ظهراً (12-3)',
        'عصراً (3-6)',
        'مساءً (6-9)',
        'ليلاً (9-12)',
        'ليلاً (12-3)',
        'فجراً (3-6)'
      ];
      const timeSlot = timeSlots[timeSlotIndex];

      order.items.forEach(item => {
        if (!acc[item.name]) {
          const productData = products.find(p => p.name === item.name) || {};
          
          acc[item.name] = {
            name: item.name,
            category: item.category,
            imageUrl: productData.image || '',
            dayStats: {},
            timeStats: {},
            weekdayTotals: {
              'الأحد': 0, 'الاثنين': 0, 'الثلاثاء': 0, 'الأربعاء': 0,
              'الخميس': 0, 'الجمعة': 0, 'السبت': 0
            },
            timeSlotTotals: {},
            peakDay: '',
            peakTime: '',
            maxDayQuantity: 0,
            maxTimeQuantity: 0
          };
        }

        const quantity = Number(item.quantity) || 0;
        
        // Update day statistics
        if (!acc[item.name].dayStats[dayOfWeek]) {
          acc[item.name].dayStats[dayOfWeek] = 0;
        }
        acc[item.name].dayStats[dayOfWeek] += quantity;
        acc[item.name].weekdayTotals[dayOfWeek] += quantity;

        // Update time slot statistics
        if (!acc[item.name].timeStats[timeSlot]) {
          acc[item.name].timeStats[timeSlot] = 0;
        }
        acc[item.name].timeStats[timeSlot] += quantity;

        // Update peak day if necessary
        if (acc[item.name].dayStats[dayOfWeek] > acc[item.name].maxDayQuantity) {
          acc[item.name].maxDayQuantity = acc[item.name].dayStats[dayOfWeek];
          acc[item.name].peakDay = dayOfWeek;
        }

        // Update peak time if necessary
        if (acc[item.name].timeStats[timeSlot] > acc[item.name].maxTimeQuantity) {
          acc[item.name].maxTimeQuantity = acc[item.name].timeStats[timeSlot];
          acc[item.name].peakTime = timeSlot;
        }
      });
      return acc;
    }, {});

    return Object.values(timings).map(product => ({
      ...product,
      timeChartData: Object.entries(product.timeStats)
        .map(([time, qty]) => ({ time, qty }))
        .sort((a, b) => {
          const timeSlots = [
            'صباحاً (6-9)', 
            'صباحاً (9-12)',
            'ظهراً (12-3)',
            'عصراً (3-6)',
            'مساءً (6-9)',
            'ليلاً (9-12)',
            'ليلاً (12-3)',
            'فجراً (3-6)'
          ];
          return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
        })
    }));
  };

  // Add new calculation function for category-based metrics
  const calculateCategoryMetrics = (orders, category) => {
    if (!Array.isArray(orders)) return [];
    
    return orders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (category === 'الكل' || item.category === category) {
          if (!acc[item.name]) {
            acc[item.name] = {
              name: item.name,
              category: item.category,
              quantitySold: 0,
              revenue: 0,
              profit: 0
            };
          }
          acc[item.name].quantitySold += Number(item.quantity) || 0;
          acc[item.name].revenue += formatNumber(item.price * item.quantity);
          acc[item.name].profit += formatNumber((item.price - item.costPrice) * item.quantity);
        }
      });
      return acc;
    }, {});
  };

  const calculateCategoryTotals = (orders) => {
    if (!Array.isArray(orders)) return [];
    
    const categoryData = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (!acc[item.category]) {
          acc[item.category] = {
            name: item.category,
            totalRevenue: 0,
            totalQuantity: 0,
            totalProfit: 0
          };
        }
        acc[item.category].totalRevenue += formatNumber(item.price * item.quantity);
        acc[item.category].totalQuantity += Number(item.quantity) || 0;
        acc[item.category].totalProfit += formatNumber((item.price - item.costPrice) * item.quantity);
      });
      return acc;
    }, {});

    return Object.values(categoryData);
  };

  if (loading) return <Box sx={{ p: 3 }}><Typography>جاري تحميل بيانات المبيعات...</Typography></Box>;
  if (error) return <Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>;

  const profits = calculateProfits(orders);
  const productProfits = calculateDetailedProfits(orders);

  // Add this inside your Product Analysis TabPanel
  const renderCategoryAnalysis = () => (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">تحليل الفئات</Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>الفئة</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="الفئة"
                size="small"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={Object.values(calculateCategoryMetrics(orders, selectedCategory))}>
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <CartesianGrid stroke="#f5f5f5" />
              <Bar yAxisId="left" dataKey="quantitySold" fill="#8884d8" name="الكمية المباعة" />
              <Bar yAxisId="left" dataKey="revenue" fill="#82ca9d" name="الإيرادات" />
              <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#ff7300" name="الربح" />
            </ComposedChart>
          </ResponsiveContainer>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.values(calculateCategoryMetrics(orders, selectedCategory))}
                    dataKey="quantitySold"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {Object.values(calculateCategoryMetrics(orders, selectedCategory))
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.values(calculateCategoryMetrics(orders, selectedCategory))}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#82ca9d" name="الإيرادات" />
                  <Bar dataKey="profit" fill="#8884d8" name="الربح" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Existing revenue overview chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>نظرة عامة على الإيرادات</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(profits).map(([date, value]) => ({ date, value }))}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Replace existing pie chart with category analysis */}
      <Grid item xs={12} md={4}>
        <StyledCard>
          <CardContent>
            <StyledTypography className="subtitle">تحليل الفئات</StyledTypography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={calculateCategoryTotals(orders)}
                  dataKey="totalRevenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {calculateCategoryTotals(orders).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Add category metrics cards */}
      {calculateCategoryTotals(orders).map((category, index) => (
        <Grid item xs={12} md={3} key={index}>
          <StyledCard>
            <CardContent>
              <StyledTypography className="subtitle">{category.name}</StyledTypography>
              <Typography variant="body1" gutterBottom>
                الإيرادات: {category.totalRevenue.toFixed(2)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                الكمية: {category.totalQuantity}
              </Typography>
              <Typography variant="body1">
                الربح: {category.totalProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  );

  // Modify the renderSalesTimingAnalysis to handle image errors
  const renderSalesTimingAnalysis = () => (
    <Grid item xs={12}>
      <StyledCard>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <StyledTypography className="subtitle">تحليل أوقات البيع</StyledTypography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>الفئة</InputLabel>
              <Select
                value={selectedTimingCategory}
                onChange={(e) => setSelectedTimingCategory(e.target.value)}
                label="الفئة"
                size="small"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Grid container spacing={2}>
            {calculateProductTimings(orders)
              .filter(product => selectedTimingCategory === 'الكل' || product.category === selectedTimingCategory)
              .map((product, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <StyledCard variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ProductImage 
                          src={product.imageUrl || '/default-product.png'} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = '/default-product.png';
                            e.target.onerror = null;
                          }}
                        />
                        <StyledTypography variant="h6" color="primary">
                          {product.name}
                        </StyledTypography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        الفئة: {product.category}
                      </Typography>
                      <Typography variant="body1">
                        أفضل يوم للمبيعات: {product.peakDay}
                        <br />
                        الكمية: {product.maxDayQuantity}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        أفضل وقت للمبيعات: {product.peakTime}
                        <br />
                        الكمية: {product.maxTimeQuantity}
                      </Typography>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={product.timeChartData}>
                          <XAxis 
                            dataKey="time" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="qty" fill="#8884d8" name="الكمية" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>
            ))}
          </Grid>
        </CardContent>
      </StyledCard>
    </Grid>
  );

  return (
    <ErrorBoundary>
      <GlobalStylesWrapper>
        <Box sx={{ p: 3 }}>
          <TopBar>
            <ActionBar>
              <Link to="/pos" className="back-button">
                <FaArrowLeft /> {translations.backToSales}
              </Link>
            </ActionBar>
            <PageTitle>{translations.salesReports}</PageTitle>
          </TopBar>

          <Paper sx={{ p: 2, mb: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="تاريخ البداية"
                    value={dateRange.start}
                    onChange={(newValue) => setDateRange({ ...dateRange, start: newValue })}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="تاريخ النهاية"
                    value={dateRange.end}
                    onChange={(newValue) => setDateRange({ ...dateRange, end: newValue })}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>نوع التصفية</InputLabel>
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      label="نوع التصفية"
                    >
                      <MenuItem value="daily">يومي</MenuItem>
                      <MenuItem value="weekly">أسبوعي</MenuItem>
                      <MenuItem value="monthly">شهري</MenuItem>
                      <MenuItem value="yearly">سنوي</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    className="btn btn-primary text-white"
                    startIcon={<FaDownload />}
                    onClick={handleExport}
                    fullWidth
                    sx={{ backgroundColor: '#0d6efd', '&:hover': { backgroundColor: '#0b5ed7' } }}
                  >
                    تصدير التقرير
                  </Button>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Paper>

          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="نظرة عامة" />
            <Tab label="تحليل المنتجات" />
            <Tab label="الاتجاهات" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {renderOverviewTab()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>تحليل المنتجات</Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={calculateProductMetrics(orders)}>
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <CartesianGrid stroke="#f5f5f5" />
                        <Bar yAxisId="left" dataKey="quantitySold" fill="#8884d8" name="الكمية المباعة" />
                        <Bar yAxisId="left" dataKey="revenue" fill="#82ca9d" name="الإيرادات" />
                        <Line yAxisId="right" type="monotone" dataKey="profitMargin" stroke="#ff7300" name="هامش الربح %" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>توزيع الكميات المباعة</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={calculateProductMetrics(orders)}
                          dataKey="quantitySold"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {calculateProductMetrics(orders).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>تحليل الربحية</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={calculateProductMetrics(orders)}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="profit" fill="#82ca9d" name="الربح" />
                        <Bar dataKey="totalCost" fill="#8884d8" name="التكلفة" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {renderSalesTimingAnalysis()}

              {/* Add the new category analysis section */}
              {renderCategoryAnalysis()}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>اتجاهات المبيعات اليومية</Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={calculateDailyTrends(orders)}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <CartesianGrid stroke="#f5f5f5" />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="الإيرادات" />
                        <Line type="monotone" dataKey="itemsSold" stroke="#82ca9d" name="العناصر المباعة" />
                        <Line type="monotone" dataKey="averageOrderValue" stroke="#ffc658" name="متوسط قيمة الطلب" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>تحليل المبيعات التراكمية</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={calculateDailyTrends(orders)}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <CartesianGrid stroke="#f5f5f5" />
                        <Area type="monotone" dataKey="revenue" fill="#8884d8" stroke="#8884d8" name="الإيرادات التراكمية" />
                        <Line type="monotone" dataKey="orders" stroke="#ff7300" name="عدد الطلبات" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>معدل النمو</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={calculateDailyTrends(orders)}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="averageOrderValue" fill="#82ca9d" name="متوسط قيمة الطلب" />
                        <Line type="monotone" dataKey="orders" stroke="#ff7300" name="عدد الطلبات" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </GlobalStylesWrapper>
    </ErrorBoundary>
  );
};

export default SalesReports;