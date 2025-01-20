import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaExclamationTriangle, FaSync } from 'react-icons/fa';
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
  Stack
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

// Styled Components
const ManagementContainer = styled('div')(({ theme }) => ({
  maxWidth: '1400px',
  margin: '2rem auto',
  padding: '0 1.5rem',
  direction: 'rtl',
  fontFamily: 'inherit',
  '& *': {
    fontFamily: 'inherit'
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
  fontWeight: 500,
  fontFamily: 'inherit',
  '& *': {
    fontFamily: 'inherit'
  }
});

const StyledAlert = styled(Alert)({
  margin: '1rem 0',
  '& .MuiAlert-message': {
    fontFamily: 'inherit'
  },
  '& *': {
    fontFamily: 'inherit'
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
  setNewStockLevel,
  setNewCostPrice, 
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
  fontFamily: 'inherit'
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

  useEffect(() => {
    const init = async () => {
      await fetchInventory();
      await fetchCategories();
    };
    init();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/products');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback: Extract unique categories from inventory
      const uniqueCategories = [...new Set(inventory.map(item => item.category))];
      setCategories(uniqueCategories);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || !newStockLevel || isNaN(Number(newStockLevel))) {
      alert('الرجاء إدخال قيمة صحيحة للمخزون');
      return;
    }

    try {
      const stockLevel = Number(newStockLevel);
      const costPrice = Number(newCostPrice);
      
      if (stockLevel < 0) {
        alert('لا يمكن أن يكون المخزون بقيمة سالبة');
        return;
      }

      // First update the product
      const response = await fetch(`http://localhost:5000/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: stockLevel,
          costPrice: costPrice,
          adjustmentDate: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to update stock');
      const updatedProduct = await response.json();

      // Update the history entry format
      const historyEntry = {
        timestamp: new Date().toISOString(),
        employeeName: localStorage.getItem('employeeName'),
        employeeNumber: localStorage.getItem('employeeNumber'),
        type: 'INVENTORY_UPDATE',
        origin: 'صفحة المخزون',
        changes: [{
          productName: selectedProduct.name,
          oldStock: selectedProduct.stock,
          newStock: stockLevel,
          oldCostPrice: selectedProduct.costPrice,
          newCostPrice: costPrice
        }]
      };

      // Save to history
      await fetch('http://localhost:5001/settings-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyEntry)
      });

      setInventory(prev => prev.map(item => 
        item.id === selectedProduct.id ? updatedProduct : item
      ));

      alert('تم تحديث المخزون بنجاح');
      setStockDialog(false);
      setNewStockLevel('');
      setNewCostPrice('');
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('حدث خطأ أثناء تحديث المخزون');
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

      await fetch('http://localhost:5001/settings-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyEntry)
      });
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

  const getLowStockItems = () => inventory.filter(item => item.stock < item.minStock);

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
      if (item.stock < item.minStock) acc[item.category].lowStock += 1;
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
      <Grid item xs={12} md={3}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>إجمالي المنتجات</Typography>
            <Typography variant="h4">{inventory.length}</Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} md={3}>
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>المنتجات منخفضة المخزون</Typography>
            <Typography variant="h4" color="error">
              {getLowStockItems().length}
            </Typography>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} md={3}>
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

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>اسم المنتج</StyledTableCell>
              <StyledTableCell>الفئة</StyledTableCell>
              <StyledTableCell>المخزون</StyledTableCell>
              <StyledTableCell>سعر التكلفة</StyledTableCell>
              <StyledTableCell>سعر البيع</StyledTableCell>
              <StyledTableCell>الحالة</StyledTableCell>
              <StyledTableCell>الإجراءات</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => (
                <TableRow 
                  key={item.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      )}
                      <Typography sx={{ fontFamily: 'inherit' }}>{item.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'inherit' }}>{item.category}</TableCell>
                  <TableCell sx={{ fontFamily: 'inherit' }}>{item.stock}</TableCell>
                  <TableCell sx={{ fontFamily: 'inherit' }}>{item.costPrice} ر.س</TableCell>
                  <TableCell sx={{ fontFamily: 'inherit' }}>{item.price} ر.س</TableCell>
                  <TableCell>
                    <Alert 
                      severity={item.stock < item.minStock ? "error" : "success"}
                      icon={item.stock < item.minStock ? <FaExclamationTriangle /> : null}
                      sx={{ 
                        '& .MuiAlert-message': { 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          fontFamily: 'inherit'
                        }
                      }}
                    >
                      {item.stock < item.minStock ? 'منخفض' : 'جيد'}
                    </Alert>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="تحديث المخزون والتكلفة">
                      <IconButton
                        onClick={() => {
                          setSelectedProduct(item);
                          setNewStockLevel(item.stock?.toString() || '0');
                          setNewCostPrice(item.costPrice?.toString() || '0');
                          setStockDialog(true);
                        }}
                        sx={{
                          color: '#3699ff',
                          '&:hover': {
                            backgroundColor: 'rgba(54, 153, 255, 0.1)',
                          }
                        }}
                      >
                        <MdEdit size={20} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {filteredInventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    لا توجد نتائج تطابق معايير البحث
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <StyledTablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredInventory.length}
        rowsPerPage={rowsPerPage}
        page={page}
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
              setNewStockLevel={setNewStockLevel}
              setNewCostPrice={setNewCostPrice}
              handleUpdateStock={handleUpdateStock}
              onClose={() => setStockDialog(false)}
            />
          </StockAdjustmentDialog>
        )}
      </ManagementContainer>
    </GlobalStyles>
  );
};

export default InventoryReports;
