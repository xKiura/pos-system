import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaExclamationTriangle, FaSync, FaCheckCircle } from 'react-icons/fa';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Chip,
  Stack,
  Snackbar,
  Avatar // Add Avatar to the imports
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MdEdit, MdSearch, MdFilterList, MdClear } from 'react-icons/md';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios'; // Add this at the top with other imports

// Styled Components
const ManagementContainer = styled('div')(({ theme }) => ({
  maxWidth: '1400px',
  margin: '2rem auto',
  padding: '0 1.5rem',
  direction: 'rtl',
  '& *': {
    fontFamily: 'inherit !important' // Add !important to override any other font definitions
  }
}));

const TopBar = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  background: '#ffffff',
  padding: '1rem',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
  flexDirection: 'row-reverse',
  fontFamily: 'inherit'
}));

// Update GlobalStyles component
const GlobalStyles = styled('div')(({ theme }) => ({
  fontFamily: 'inherit',
  '& *': {
    fontFamily: 'inherit'
  },
  '.back-button': {
    direction: 'ltr',
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#4a5568',
    backgroundColor: '#edf2f7', // Updated to match SalesReports
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',

    '&:hover': {
      backgroundColor: '#e2e8f0', // Updated to match SalesReports
      transform: 'translateX(-2px)',
    }
  }
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  margin: 0,
  fontSize: '1.5rem',
  color: '#1e293b',
  fontWeight: 600,
  fontFamily: 'inherit'
}));

const StyledCard = styled(Card)({
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  '& .MuiTypography-root': {
    fontFamily: 'inherit'
  }
});

const StyledTableCell = styled(TableCell)({
  fontFamily: 'inherit !important',
  '& *': {
    fontFamily: 'inherit !important'
  }
});

const StyledAlert = styled(Alert)({
  '& .MuiAlert-message': {
    fontFamily: 'inherit !important'
  }
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ActionButton = styled(Button)(({ theme }) => ({
  fontFamily: 'inherit',
  backgroundColor: '#0d6efd',
  color: 'white',
  '&:hover': {
    backgroundColor: '#0b5ed7',
  }
}));

const StyledBackButton = styled(Link)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  background: '#edf2f7',
  color: '#4a5568',
  borderRadius: '8px',
  textDecoration: 'none',
  transition: 'all 0.2s',
  '&:hover': {
    background: '#e2e8f0',
    transform: 'translateX(-2px)'
  }
});

const StockAdjustmentDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    padding: '1rem',
    minWidth: '400px'
  }
});

const AdjustmentControls = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  margin: '1rem 0'
});

const StockButton = styled(IconButton)({
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '0.5rem',
  '&:hover': {
    backgroundColor: '#f7fafc'
  }
});

// Add StockAdjustmentDialogContent component
const StockAdjustmentDialogContent = ({ 
  selectedProduct, 
  newStockLevel,
  newCostPrice, 
  newMinStock,  // Add this
  setNewStockLevel,
  setNewCostPrice, 
  setNewMinStock,  // Add this
  handleUpdateStock, 
  onClose 
}) => (
  <>
    <DialogTitle sx={{ fontFamily: 'inherit' }}>
      تحديث المخزون - {selectedProduct?.name}
    </DialogTitle>
    <DialogContent>
      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="المستوى الجديد للمخزون"
          type="number"
          value={newStockLevel}
          onChange={(e) => setNewStockLevel(e.target.value)}
          sx={{ mb: 2, fontFamily: 'inherit' }}
          InputProps={{
            sx: { fontFamily: 'inherit' }
          }}
          InputLabelProps={{
            sx: { fontFamily: 'inherit' }
          }}
        />
        <TextField
          fullWidth
          label="الحد الأدنى للمخزون"
          type="number"
          value={newMinStock}
          onChange={(e) => setNewMinStock(e.target.value)}
          sx={{ mb: 2, fontFamily: 'inherit' }}
          InputProps={{
            sx: { fontFamily: 'inherit' }
          }}
          InputLabelProps={{
            sx: { fontFamily: 'inherit' }
          }}
        />
        <TextField
          fullWidth
          label="سعر التكلفة"
          type="number"
          value={newCostPrice}
          onChange={(e) => setNewCostPrice(e.target.value)}
          sx={{ fontFamily: 'inherit' }}
          InputProps={{
            sx: { fontFamily: 'inherit' }
          }}
          InputLabelProps={{
            sx: { fontFamily: 'inherit' }
          }}
        />
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ fontFamily: 'inherit' }}>إلغاء</Button>
      <Button 
        onClick={handleUpdateStock} 
        variant="contained" 
        color="primary"
        sx={{ fontFamily: 'inherit' }}
      >
        تحديث
      </Button>
    </DialogActions>
  </>
);

const StyledTab = styled(Tab)({
  fontFamily: 'inherit !important'
});

const StyledSelect = styled(Select)({
  fontFamily: 'inherit',
  '& .MuiSelect-select': {
    fontFamily: 'inherit'
  }
});

const StyledMenuItem = styled(MenuItem)({
  fontFamily: 'inherit'
});

const StyledFormControl = styled(FormControl)({
  '& .MuiInputLabel-root': {
    fontFamily: 'inherit'
  }
});

const StyledChip = styled(Chip)(({ theme }) => ({
  fontFamily: 'inherit',
  '&.MuiChip-root': {
    borderRadius: '16px',
    '&:hover': {
      backgroundColor: '#e2e8f0'
    }
  }
}));

const StyledResponsiveContainer = styled(ResponsiveContainer)({
  '& .recharts-text': {
    fontFamily: 'inherit'
  },
  '& .recharts-legend-item-text': {
    fontFamily: 'inherit'
  },
  '& .recharts-cartesian-axis-tick-value': {
    fontFamily: 'inherit'
  }
});

// Add this new styled component
const StyledTablePagination = styled(TablePagination)({
  fontFamily: 'inherit',
  '& .MuiTablePagination-select': {
    fontFamily: 'inherit'
  },
  '& .MuiTablePagination-displayedRows': {
    fontFamily: 'inherit'
  },
  '& .MuiTablePagination-selectLabel': {
    fontFamily: 'inherit'
  },
  '& .MuiTablePagination-menuItem': {
    fontFamily: 'inherit'
  }
});

const StyledTable = styled(Table)({
  '& .MuiTableCell-root': {
    fontFamily: 'inherit !important'
  }
});

// Add these styled components near the top with other styled components
const ActionMenu = styled('div')({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  justifyContent: 'flex-start'
});

const ActionIconButton = styled(IconButton)(({ theme }) => ({
  padding: '8px',
  borderRadius: '8px',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(54, 153, 255, 0.1)',
    transform: 'translateY(-2px)'
  }
}));

// Add this styled component with other styled components
const StyledSnackbar = styled(Snackbar)({
  '& .MuiAlert-root': {
    fontFamily: 'inherit',
    alignItems: 'center'
  },
  '& .MuiAlert-message': {
    fontFamily: 'inherit'
  }
});

// Update the styled table components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
  },
  '& .MuiTableRow-root': {
    backgroundColor: '#ffffff',
    '&:hover': {
      backgroundColor: '#f8fafc',
    }
  },
  '& .MuiTableCell-root': {
    borderBottom: 'none',
    padding: '16px',
    '&:first-of-type': {
      borderTopLeftRadius: '8px',
      borderBottomLeftRadius: '8px',
    },
    '&:last-of-type': {
      borderTopRightRadius: '8px',
      borderBottomRightRadius: '8px',
    }
  }
}));

// Add this function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
};

// Add this near other styled components
const StatusChip = styled(Chip)(({ theme }) => ({
  fontFamily: 'inherit',
  minWidth: '90px', // Increased from 80px to 90px
  height: '32px',   // Increased from 28px to 32px
  '& .MuiChip-icon': {
    fontSize: '16px',
    marginRight: '4px',  // Changed from -4px to 4px
    marginLeft: '4px'
  },
  '& .MuiChip-label': {
    padding: '0 8px',    // Reduced padding from 12px to 8px
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  '&.MuiChip-filled.MuiChip-colorError': {
    background: '#fee2e2',
    color: '#dc2626'
  },
  '&.MuiChip-filled.MuiChip-colorSuccess': {
    background: '#dcfce7',
    color: '#16a34a'
  }
}));

const InventoryReports = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [stockDialog, setStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStockLevel, setNewStockLevel] = useState('');
  const [categories, setCategories] = useState([]);
  const [adjustmentHistory, setAdjustmentHistory] = useState([]);
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newMinStock, setNewMinStock] = useState('');

  // Add these new state variables
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchInventory(); // Fetch inventory first
        await fetchCategories(); // Then fetch categories
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchInventory = async () => {
    try {
      console.log('Fetching inventory...');
      const response = await axios.get('http://localhost:5000/products'); // Changed from 5001 to 5000
      console.log('Received inventory data:', response.data);
      
      if (Array.isArray(response.data)) {
        setInventory(response.data);
      } else {
        console.error('Received non-array data:', response.data);
        setInventory([]);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to fetch inventory data');
      setInventory([]);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await axios.get('http://localhost:5000/categories');
      console.log('Received categories data:', response.data);
      
      if (Array.isArray(response.data)) {
        setCategories(response.data); // Remove 'الكل' - we'll use 'جميع الفئات' in the select instead
      } else {
        console.error('Received non-array data:', response.data);
        const uniqueCategories = [...new Set(inventory.map(item => item.category))];
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      const uniqueCategories = [...new Set(inventory.map(item => item.category))];
      setCategories(uniqueCategories);
    }
  };

  // Add this handler
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Update the handleUpdateStock function
  const handleUpdateStock = async () => {
    if (!selectedProduct) return;
  
    const stockLevel = Number(newStockLevel);
    const costPrice = Number(newCostPrice);
    const minStock = Number(newMinStock);
  
    if (isNaN(stockLevel) || isNaN(costPrice) || isNaN(minStock)) {
      setSnackbar({
        open: true,
        message: 'الرجاء إدخال قيم صحيحة',
        severity: 'error'
      });
      return;
    }
  
    try {
      // Create the updated product object
      const updatedProduct = {
        ...selectedProduct,
        stock: stockLevel,
        costPrice: costPrice,
        minStock: minStock
      };
  
      // Make the API call to update product
      const response = await axios.patch(`http://localhost:5000/products/${selectedProduct.id}`, updatedProduct);
  
      if (response.data) {
        // Update the local inventory state
        setInventory(prev => 
          prev.map(item => 
            item.id === selectedProduct.id ? response.data : item
          )
        );
  
        try {
          // Create a detailed history entry
          const changes = [];
          
          if (selectedProduct.stock !== stockLevel) {
            changes.push({
              field: 'المخزون',
              oldValue: selectedProduct.stock,
              newValue: stockLevel
            });
          }
          
          if (selectedProduct.costPrice !== costPrice) {
            changes.push({
              field: 'سعر التكلفة',
              oldValue: selectedProduct.costPrice,
              newValue: costPrice
            });
          }
          
          if (selectedProduct.minStock !== minStock) {
            changes.push({
              field: 'الحد الأدنى',
              oldValue: selectedProduct.minStock,
              newValue: minStock
            });
          }
  
          const historyEntry = {
            timestamp: new Date().toISOString(),
            employeeName: localStorage.getItem('employeeName') || 'Unknown',
            employeeNumber: localStorage.getItem('employeeNumber') || 'Unknown',
            type: 'INVENTORY_UPDATE',
            origin: 'تقارير المخزون',
            changes: [{
              productName: selectedProduct.name,
              oldStock: selectedProduct.stock,
              newStock: stockLevel,
              oldCostPrice: selectedProduct.costPrice,
              newCostPrice: costPrice,
              oldMinStock: selectedProduct.minStock,
              newMinStock: minStock,
              detailedChanges: changes
            }]
          };
  
          // Send to settings history endpoint for management page
          await axios.post('http://localhost:5001/settings-history', historyEntry);
        } catch (historyError) {
          console.warn('Failed to log history, but product was updated:', historyError);
        }
  
        setSnackbar({
          open: true,
          message: 'تم تحديث المخزون بنجاح',
          severity: 'success'
        });
  
        setStockDialog(false);
        setSelectedProduct(null);
        setNewStockLevel('');
        setNewCostPrice('');
        setNewMinStock('');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      setSnackbar({
        open: true,
        message: 'حدث خطأ أثناء تحديث المخزون',
        severity: 'error'
      });
    }
  };
  

  const exportInventory = async () => {
    const headers = ['Product Name,Category,Stock Level,Low Stock Alert,Cost Price,Selling Price\n'];
    const rows = inventory.map(item => 
      `${item.name},${item.category},${item.stock},${item.stock < item.minStock ? 'Yes' : 'No'},${item.costPrice},${item.price}\n`
    );
    
    const csvContent = headers.concat(rows).join('');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = `inventory_report_${new Date().toLocaleDateString()}.csv`;
    link.setAttribute('download', filename);

    // Update the history entry format
    try {
      const historyEntry = {
        timestamp: new Date().toISOString(),
        employeeName: localStorage.getItem('employeeName'),
        employeeNumber: localStorage.getItem('employeeNumber'),
        type: 'REPORT_EXPORT',
        origin: 'صفحة المخزون',
        changes: [{
          action: 'تصدير تقرير',
          details: `تم تصدير تقرير المخزون (${inventory.length} منتج)`
        }]
      };

      // Changed from settings-history to history and port from 5001 to 5000
      await axios.post('http://localhost:5000/history', historyEntry);
    } catch (err) {
      console.error('Error logging export:', err);
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = searchTerm 
        ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchTerm, filterCategory]);

  const getLowStockItems = () => inventory.filter(item => item.stock <= item.minStock);

  const getCategoryStats = () => {
    return inventory.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          category: item.category,
          totalItems: 0,
          totalValue: 0,
          lowStock: 0
        };
      }
      acc[item.category].totalItems += 1;
      acc[item.category].totalValue += item.stock * item.costPrice;
      if (item.stock <= item.minStock) acc[item.category].lowStock += 1;  // Changed < to <=
      return acc;
    }, {});
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderInventoryOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={2.5}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>إجمالي المنتجات</Typography>
            <Typography variant="h4">{inventory.length}</Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>المنتجات منخفضة المخزون</Typography>
            <Typography variant="h4" color="error">
              {getLowStockItems().length}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} md={2.5}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>قيمة المخزون</Typography>
            <Typography variant="h4">
              {inventory.reduce((sum, item) => {
                const stockValue = (item.stock || 0) * (item.costPrice || 0);
                return sum + (isNaN(stockValue) ? 0 : stockValue);
              }, 0).toFixed(2)} ر.س
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} md={3}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>الفئات</Typography>
            <Typography variant="h4">{categories.length}</Typography>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Category Distribution Chart */}
      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>توزيع المخزون حسب الفئة</Typography>
            <StyledResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.values(getCategoryStats())}
                  dataKey="totalItems"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {Object.values(getCategoryStats()).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </StyledResponsiveContainer>
          </CardContent>
        </StyledCard>
      </Grid>

      {/* Stock Levels Chart */}
      <Grid item xs={12} md={6}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>مستويات المخزون</Typography>
            <StyledResponsiveContainer width="100%" height={300}>
              <BarChart data={inventory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="stock" fill="#8884d8" name="المخزون الحالي" />
                <Bar dataKey="minStock" fill="#82ca9d" name="الحد الأدنى" />
              </BarChart>
            </StyledResponsiveContainer>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );

  const renderInventoryTable = () => (
    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="بحث عن منتج"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <MdClear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                '& .MuiInputLabel-root': { fontFamily: 'inherit' },
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#3699ff',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledFormControl fullWidth>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MdFilterList />
                  تصفية حسب الفئة
                </Box>
              </InputLabel>
              <StyledSelect
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="تصفية حسب الفئة"
              >
                <StyledMenuItem value="all">جميع الفئات</StyledMenuItem>
                {categories.map((category) => (
                  <StyledMenuItem key={category} value={category}>{category}</StyledMenuItem>
                ))}
              </StyledSelect>
            </StyledFormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FaDownload className='mx-2' />}
              onClick={exportInventory}
              sx={{
                bgcolor: '#3699ff',
                '&:hover': {
                  bgcolor: '#1e88e5',
                }
              }}
            >
              تصدير التقرير
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {(searchTerm || filterCategory !== 'all') && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {searchTerm && (
              <StyledChip
                label={`بحث: ${searchTerm}`}
                onDelete={() => setSearchTerm('')}
              />
            )}
            {filterCategory !== 'all' && (
              <StyledChip
                label={`الفئة: ${filterCategory}`}
                onDelete={() => setFilterCategory('all')}
              />
            )}
          </Stack>
        )}
      </Box>

      <StyledTableContainer>
        <StyledTable><TableHead><TableRow>
          <StyledTableCell>اسم المنتج</StyledTableCell>
          <StyledTableCell>الفئة</StyledTableCell>
          <StyledTableCell align="center">المخزون</StyledTableCell>
          <StyledTableCell align="center">الحد الأدنى</StyledTableCell>
          <StyledTableCell align="right">سعر التكلفة</StyledTableCell>
          <StyledTableCell align="right">سعر البيع</StyledTableCell>
          <StyledTableCell align="center">الحالة</StyledTableCell>
          <StyledTableCell align="center">الإجراءات</StyledTableCell>
        </TableRow></TableHead><TableBody>
          {filteredInventory
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((item) => (<TableRow key={item.id}>
              <StyledTableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {item.image && (
                    <Avatar
                      src={item.image}
                      alt={item.name}
                      sx={{ width: 40, height: 40 }}
                    />
                  )}
                  <Typography sx={{ fontWeight: 500 }}>{item.name}</Typography>
                </Box>
              </StyledTableCell>
              <StyledTableCell>
                <Chip
                  label={item.category}
                  size="small"
                  sx={{
                    bgcolor: '#e2e8f0',
                    color: '#475569',
                    fontWeight: 500
                  }}
                />
              </StyledTableCell>
              <StyledTableCell align="center">
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: item.stock <= item.minStock ? '#ef4444' : '#10b981'
                  }}
                >
                  {item.stock}
                </Typography>
              </StyledTableCell>
              <StyledTableCell align="center">{item.minStock}</StyledTableCell>
              <StyledTableCell align="right">
                {formatCurrency(item.costPrice)}
              </StyledTableCell>
              <StyledTableCell align="right">
                {formatCurrency(item.price)}
              </StyledTableCell>
              <StyledTableCell align="center">
                <StatusChip
                  label={item.stock <= item.minStock ? 'منخفض' : 'جيد'}
                  color={item.stock <= item.minStock ? 'error' : 'success'}
                  size="small"
                  icon={item.stock <= item.minStock ? <FaExclamationTriangle /> : <FaCheckCircle />}
                />
              </StyledTableCell>
              <StyledTableCell align="center">
                <Tooltip title="تحديث المخزون">
                  <ActionIconButton
                    onClick={() => {
                      setSelectedProduct(item);
                      setNewStockLevel(item.stock?.toString() || '0');
                      setNewCostPrice(item.costPrice?.toString() || '0');
                      setNewMinStock(item.minStock?.toString() || '0');
                      setStockDialog(true);
                    }}
                  >
                    <MdEdit />
                  </ActionIconButton>
                </Tooltip>
              </StyledTableCell>
            </TableRow>))}
        </TableBody></StyledTable>
        {filteredInventory.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="textSecondary">
              لا توجد نتائج تطابق معايير البحث
            </Typography>
          </Box>
        )}
      </StyledTableContainer>
      <StyledTablePagination
        component="div"
        count={filteredInventory.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="عدد العناصر في الصفحة:"
      />
    </Paper>
  );

  return (
    <GlobalStyles>
      <ManagementContainer>
        <TopBar>
          <Link to="/pos" className="back-button">
            <FaArrowLeft /> العودة لصفحة المبيعات
          </Link>
          <PageTitle>تقارير المخزون</PageTitle>
        </TopBar>

        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <StyledTab label="نظرة عامة" />
            <StyledTab label="جدول المخزون" />
          </Tabs>
        </Box>

        {tabValue === 0 && renderInventoryOverview()}
        {tabValue === 1 && renderInventoryTable()}

        {stockDialog && (
          <StockAdjustmentDialog open={stockDialog} onClose={() => setStockDialog(false)}>
            <StockAdjustmentDialogContent
              selectedProduct={selectedProduct}
              newStockLevel={newStockLevel}
              newCostPrice={newCostPrice}
              newMinStock={newMinStock}  // Add this
              setNewStockLevel={setNewStockLevel}
              setNewCostPrice={setNewCostPrice}
              setNewMinStock={setNewMinStock}  // Add this
              handleUpdateStock={handleUpdateStock}
              onClose={() => setStockDialog(false)}
            />
          </StockAdjustmentDialog>
        )}

        <StyledSnackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              fontSize: '1rem',
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {snackbar.message}
          </MuiAlert>
        </StyledSnackbar>
      </ManagementContainer>
    </GlobalStyles>
  );
};

export default InventoryReports;
