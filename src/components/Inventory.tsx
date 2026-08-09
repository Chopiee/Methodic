import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { setHasUnsavedChanges } from '../lib/unsaved';
import { 
  Search, 
  HelpCircle, 
  FileText, 
  Warehouse as WarehouseIcon, 
  Plus, 
  Minus,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
  Coins,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  ChevronDown,
  Eye,
  User,
  Info,
  ArrowLeft,
  ClipboardList,
  Download,
  MapPin,
  Phone,
  SlidersHorizontal,
  Building2,
  Boxes,
  ShieldAlert,
  Check,
  RefreshCw,
  Upload,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardCheck,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getStoredProducts, saveProducts, ProductItem, getIdPrefixSettings } from '../lib/state';

// Date Utility Helpers
const getMonthName = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
};

const parseYMD = (str: string): Date => {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date();
};

const toYMD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  let startDayOfWeek = firstDay.getDay(); 
  let offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();
  
  const grid = [];
  
  // Faded days from previous month
  for (let i = offset - 1; i >= 0; i--) {
    grid.push({
      dayNum: prevDaysInMonth - i,
      date: new Date(year, month - 1, prevDaysInMonth - i),
      isCurrent: false
    });
  }
  
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({
      dayNum: d,
      date: new Date(year, month, d),
      isCurrent: true
    });
  }
  
  // Faded days of next month
  const remaining = 42 - grid.length;
  for (let d = 1; d <= remaining; d++) {
    grid.push({
      dayNum: d,
      date: new Date(year, month + 1, d),
      isCurrent: false
    });
  }
  
  return grid;
};

// Interface definitions
export interface WarehouseFacility {
  id: string;
  code: string;
  name: string;
  address: string;
  pic: string;
  phone: string;
  capacity: number; // Max items capacity
  status: 'Active' | 'Maintenance' | 'Full';
  notes?: string;
}

export interface MovementItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
}

export interface StockMovementDoc {
  id: string;
  type: 'Stock In' | 'Stock Out' | 'Audit';
  warehouse: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  date: string; // YYYY-MM-DD
  description: string;
  pic: string;
  status: 'Completed' | 'Draft' | 'Cancel';
  items: MovementItem[];
}

// Initial default Warehouses
const initialWarehouses: WarehouseFacility[] = [];

// Initial Stock Movement Documents
const initialMovementDocs: StockMovementDoc[] = [
  {
    id: 'INV-001',
    type: 'Stock In',
    warehouse: 'Gudang Utama Jakarta',
    date: '2026-08-01',
    description: 'Penerimaan barang dari supplier',
    pic: 'Budi Santoso',
    status: 'Completed',
    items: [
      { productId: 'P001', name: 'Sofa Minimalis 3 Seater', sku: 'SF-MINI-03', qty: 10 }
    ]
  },
  {
    id: 'INV-002',
    type: 'Stock In',
    warehouse: 'Gudang Surabaya Hub',
    date: '2026-08-02',
    description: 'Restock barang masuk',
    pic: 'Siti Aminah',
    status: 'Draft',
    items: [
      { productId: 'P002', name: 'Meja Makan Kayu Jati', sku: 'MJ-JATI-01', qty: 5 }
    ]
  },
  {
    id: 'INV-003',
    type: 'Stock Out',
    warehouse: 'Gudang Utama Jakarta',
    date: '2026-08-03',
    description: 'Pengiriman pesanan customer',
    pic: 'Ahmad Rizky',
    status: 'Completed',
    items: [
      { productId: 'P001', name: 'Sofa Minimalis 3 Seater', sku: 'SF-MINI-03', qty: 2 }
    ]
  },
  {
    id: 'INV-004',
    type: 'Stock Out',
    warehouse: 'Gudang Bandung',
    date: '2026-08-04',
    description: 'Transfer barang keluar',
    pic: 'Dewi Lestari',
    status: 'Draft',
    items: [
      { productId: 'P003', name: 'Kursi Kerja Ergonomis', sku: 'KR-ERGO-02', qty: 4 }
    ]
  },
  {
    id: 'INV-005',
    type: 'Audit',
    warehouse: 'Gudang Utama Jakarta',
    date: '2026-08-05',
    description: 'Stock opname fisik bulanan',
    pic: 'Budi Santoso',
    status: 'Completed',
    items: [
      { productId: 'P001', name: 'Sofa Minimalis 3 Seater', sku: 'SF-MINI-03', qty: 10 }
    ]
  },
  {
    id: 'INV-006',
    type: 'Audit',
    warehouse: 'Gudang Surabaya Hub',
    date: '2026-08-06',
    description: 'Penyesuaian stok opname berkala',
    pic: 'Siti Aminah',
    status: 'Draft',
    items: [
      { productId: 'P002', name: 'Meja Makan Kayu Jati', sku: 'MJ-JATI-01', qty: 5 }
    ]
  }
];

const getNextDocId = (docList: StockMovementDoc[]) => {
  const prefix = getIdPrefixSettings().inventoryDocPrefix || 'INV-';
  let max = 0;
  if (Array.isArray(docList)) {
    docList.forEach(d => {
      if (d && d.id) {
        const cleanId = String(d.id).replace(/\s+/g, '');
        const cleanPrefix = prefix.replace(/\s+/g, '');
        if (cleanId.startsWith(cleanPrefix)) {
          const numPart = parseInt(cleanId.replace(cleanPrefix, ''), 10);
          if (!isNaN(numPart) && numPart > max) {
            max = numPart;
          }
        }
      }
    });
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
};

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

const formatDateStr = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export function Inventory({ searchQuery = '' }: { searchQuery?: string }) {
  // Sync products state with LocalStorage
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());

  // Warehouses State
  const [warehouses, setWarehouses] = useState<WarehouseFacility[]>(() => {
    const saved = localStorage.getItem('methodic_warehouses_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse warehouses', e);
      }
    }
    return initialWarehouses;
  });

  // Stock Movement Documents State
  const [documents, setDocuments] = useState<StockMovementDoc[]>(() => {
    const saved = localStorage.getItem('methodic_stock_movements_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stock movements', e);
      }
    }
    return initialMovementDocs;
  });

  // Active Main Navigation Tab
  const [mainTab, setMainTab] = useState<'facilities' | 'movements' | 'stock'>('facilities');

  // Sub-filters
  const [movementTab, setMovementTab] = useState<'All' | 'Stock In' | 'Stock Out' | 'Audit'>('All');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // UI Modals & Form States
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<StockMovementDoc | null>(null);

  const handleOpenDocModal = (type: 'Stock In' | 'Stock Out' | 'Audit') => {
    setShowDocDropdown(false);
    setNewDocType(type);
    setNewDocId('');
    setNewDocDescription('');
    setNewDocPic('Budi Santoso');
    setFormItems([]);
    setShowTypeDropdown(false);
    setShowFromWarehouseDropdown(false);
    setShowToWarehouseDropdown(false);
    setShowStatusDropdown(false);

    const defaultWh = warehouses[0]?.name || 'Jakarta West Hub';
    if (type === 'Stock In') {
      setNewDocFromWarehouse('Pemasok / Eksternal');
      setNewDocToWarehouse(defaultWh);
      setNewDocWarehouse(defaultWh);
    } else if (type === 'Stock Out') {
      setNewDocFromWarehouse(defaultWh);
      setNewDocToWarehouse('Pelanggan / Eksternal');
      setNewDocWarehouse(defaultWh);
    } else {
      setNewDocFromWarehouse(defaultWh);
      setNewDocToWarehouse(defaultWh);
      setNewDocWarehouse(defaultWh);
    }

    setIsAddingDoc(true);
  };

  // Warehouse Add/Edit Modal
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(isAddingDoc || isWarehouseModalOpen);
  }, [isAddingDoc, isWarehouseModalOpen]);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseFacility | null>(null);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whPic, setWhPic] = useState('');
  const [whPhone, setWhPhone] = useState('');
  const [whCapacity, setWhCapacity] = useState('5000');
  const [whStatus, setWhStatus] = useState<'Active' | 'Maintenance' | 'Full'>('Active');
  const [whNotes, setWhNotes] = useState('');

  // Delete Confirm Modal
  const [deleteModal, setDeleteModal] = useState<{
    type: 'warehouse' | 'movement';
    id: string;
    name: string;
  } | null>(null);

  // Movement Doc Creation Form States
  const [newDocId, setNewDocId] = useState('');
  const [newDocType, setNewDocType] = useState<'Stock In' | 'Stock Out' | 'Audit'>('Stock In');
  const [newDocWarehouse, setNewDocWarehouse] = useState('Jakarta West Hub');
  const [newDocFromWarehouse, setNewDocFromWarehouse] = useState('Pemasok / Eksternal');
  const [newDocToWarehouse, setNewDocToWarehouse] = useState('Jakarta West Hub');
  const [newDocDate, setNewDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocPic, setNewDocPic] = useState('Budi Santoso');
  const [newDocStatus, setNewDocStatus] = useState<'Completed' | 'Draft'>('Completed');
  const [formItems, setFormItems] = useState<MovementItem[]>([]);

  // Custom Dropdown Open States in Document Creation Form
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showFromWarehouseDropdown, setShowFromWarehouseDropdown] = useState(false);
  const [showToWarehouseDropdown, setShowToWarehouseDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Calendar State for Date Picker
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [dateViewDate, setDateViewDate] = useState<Date>(() => new Date());

  const renderCustomSingleCalendar = (
    viewDate: Date,
    selectedYMD: string,
    onSelectDate: (ymd: string) => void,
    setViewDate: React.Dispatch<React.SetStateAction<Date>>
  ) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const grid = getMonthGrid(year, month);
    const monthName = getMonthName(viewDate);
    const selectedDate = parseYMD(selectedYMD);

    return (
      <div className="flex flex-col text-left font-sans">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewDate(new Date(year, month - 1, 1));
            }}
            className="p-1 text-[#909090] hover:text-white hover:bg-[#2A2A2E] rounded transition-colors cursor-pointer"
          >
            <ChevronLeft size={13} />
          </button>
          
          <span className="text-[12px] font-medium text-white tracking-tight">
            {monthName} {year}
          </span>

          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewDate(new Date(year, month + 1, 1));
            }}
            className="p-1 text-[#909090] hover:text-white hover:bg-[#2A2A2E] rounded transition-colors cursor-pointer"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-y-1 mb-1.5 text-center">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
            <span key={day} className="text-[9px] font-medium text-[#777] uppercase tracking-wider">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {grid.map((cell, idx) => {
            const isSelected = selectedDate && cell.date.toDateString() === selectedDate.toDateString();
            
            let btnClass = "w-6 h-6 text-[10.5px] flex items-center justify-center rounded-full transition-all relative z-10 mx-auto font-sans";
            if (isSelected) {
              btnClass += " bg-[#EA580C] text-white font-semibold shadow-sm";
            } else if (cell.isCurrent) {
              btnClass += " text-white hover:bg-[#2A2A2E] cursor-pointer";
            } else {
              btnClass += " text-[#4A4A4D] hover:text-[#777] cursor-pointer";
            }

            return (
              <div key={idx} className="relative h-7 flex items-center justify-center">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectDate(toYMD(cell.date));
                  }}
                  className={btnClass}
                >
                  {cell.dayNum}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Autocomplete / Search Product states inside creation form
  const [searchProductText, setSearchProductText] = useState('');
  const [searchProductQty, setSearchProductQty] = useState('1');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Unsaved changes confirmation dialog
  const [showUnsavedDocModal, setShowUnsavedDocModal] = useState(false);

  // Persist Warehouses
  useEffect(() => {
    localStorage.setItem('methodic_warehouses_v3', JSON.stringify(warehouses));
  }, [warehouses]);

  // Persist Stock Movement Documents
  useEffect(() => {
    localStorage.setItem('methodic_stock_movements_v3', JSON.stringify(documents));
  }, [documents]);

  const effectiveSearch = searchQuery || localSearch;

  // Filtered Warehouses
  const filteredWarehouses = warehouses.filter(wh => {
    const matchesSearch = 
      wh.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      wh.code.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      wh.address.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      wh.pic.toLowerCase().includes(effectiveSearch.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || wh.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Documents
  const filteredDocuments = documents.filter(doc => {
    const matchesMovementTab = movementTab === 'All' || doc.type === movementTab;
    const matchesSearch = 
      doc.id.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      doc.description.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      doc.pic.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      doc.warehouse.toLowerCase().includes(effectiveSearch.toLowerCase());
    
    const matchesWarehouse = selectedWarehouseFilter === 'All' || doc.warehouse === selectedWarehouseFilter;
    return matchesMovementTab && matchesSearch && matchesWarehouse;
  });

  // Filtered Products Stock
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(effectiveSearch.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Overall Statistics Calculations
  const totalWarehouses = warehouses.length;
  const activeWarehousesCount = warehouses.filter(w => w.status === 'Active').length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  const totalCapacitySum = warehouses.reduce((acc, w) => acc + w.capacity, 0);
  const capacityUsagePercent = totalCapacitySum > 0 ? Math.min(100, Math.round((totalStockUnits / totalCapacitySum) * 100)) : 0;
  const completedMovementsCount = documents.filter(d => d.status === 'Completed').length;
  const draftMovementsCount = documents.filter(d => d.status === 'Draft').length;

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Open Warehouse Modal
  const handleOpenWarehouseModal = (wh?: WarehouseFacility) => {
    if (wh) {
      setEditingWarehouse(wh);
      setWhName(wh.name);
      setWhCode(wh.code);
      setWhAddress(wh.address);
      setWhPic(wh.pic);
      setWhPhone(wh.phone);
      setWhCapacity(String(wh.capacity));
      setWhStatus(wh.status);
      setWhNotes(wh.notes || '');
    } else {
      setEditingWarehouse(null);
      setWhName('');
      setWhCode(`WH-${String(warehouses.length + 1).padStart(2, '0')}`);
      setWhAddress('');
      setWhPic('');
      setWhPhone('');
      setWhCapacity('5000');
      setWhStatus('Active');
      setWhNotes('');
    }
    setIsWarehouseModalOpen(true);
  };

  // Save Warehouse Facility
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whAddress.trim() || !whPic.trim()) {
      alert('Mohon lengkapi nama gudang, alamat, dan penanggung jawab (PIC)!');
      return;
    }

    const capNum = Math.max(100, parseInt(whCapacity, 10) || 1000);

    if (editingWarehouse) {
      setWarehouses(prev => prev.map(w => w.id === editingWarehouse.id ? {
        ...w,
        name: whName.trim(),
        code: whCode.trim(),
        address: whAddress.trim(),
        pic: whPic.trim(),
        phone: whPhone.trim(),
        capacity: capNum,
        status: whStatus,
        notes: whNotes.trim()
      } : w));
    } else {
      const newWh: WarehouseFacility = {
        id: `WH-${Date.now()}`,
        code: whCode.trim() || `WH-${warehouses.length + 1}`,
        name: whName.trim(),
        address: whAddress.trim(),
        pic: whPic.trim(),
        phone: whPhone.trim(),
        capacity: capNum,
        status: whStatus,
        notes: whNotes.trim()
      };
      setWarehouses(prev => [...prev, newWh]);
    }

    setIsWarehouseModalOpen(false);
  };

  // Confirm Delete
  const handleExecuteDelete = () => {
    if (!deleteModal) return;
    if (deleteModal.type === 'warehouse') {
      setWarehouses(prev => prev.filter(w => w.id !== deleteModal.id));
    } else if (deleteModal.type === 'movement') {
      setDocuments(prev => prev.filter(d => d.id !== deleteModal.id));
    }
    setDeleteModal(null);
  };

  // Product Autocomplete inside creation form
  const matchingProducts = searchProductText.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(searchProductText.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProductText.toLowerCase())
      );

  const handleSelectProduct = (p: ProductItem) => {
    setSelectedProduct(p);
    setSearchProductText(p.name);
    setShowSuggestions(false);
  };

  const handleAddProductToFormList = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let targetProduct = selectedProduct;
    if (!targetProduct) {
      if (matchingProducts.length === 1) {
        targetProduct = matchingProducts[0];
      } else if (searchProductText.trim() !== '') {
        const exactMatch = products.find(p => p.name.toLowerCase() === searchProductText.trim().toLowerCase() || p.sku.toLowerCase() === searchProductText.trim().toLowerCase());
        if (exactMatch) {
          targetProduct = exactMatch;
        }
      }
    }

    if (!targetProduct) {
      alert('Silakan ketik dan pilih produk dari daftar rekomendasi.');
      return;
    }

    const qty = Number(searchProductQty) || 1;

    const existingIdx = formItems.findIndex(item => item.productId === targetProduct!.id);
    if (existingIdx > -1) {
      const updated = [...formItems];
      updated[existingIdx].qty += qty;
      setFormItems(updated);
    } else {
      setFormItems(prev => [...prev, {
        productId: targetProduct!.id,
        name: targetProduct!.name,
        sku: targetProduct!.sku,
        qty
      }]);
    }

    setSelectedProduct(null);
    setSearchProductText('');
    setSearchProductQty('1');
    setShowSuggestions(false);
  };

  // Save Movement Doc
  const handleSaveMovementDocumentWithStatus = (overrideStatus?: 'Completed' | 'Draft') => {
    if (formItems.length === 0) {
      alert('Mohon tambahkan minimal 1 barang ke dalam surat pergerakan ini!');
      return;
    }

    const docStatus = overrideStatus || newDocStatus;
    const docId = newDocId.trim() || getNextDocId(documents);
    
    if (documents.some(d => d.id.toLowerCase() === docId.toLowerCase())) {
      alert(`Nomor Surat "${docId}" sudah digunakan. Silakan gunakan nomor yang lain.`);
      return;
    }

    const newDoc: StockMovementDoc = {
      id: docId,
      type: newDocType,
      warehouse: newDocToWarehouse || newDocWarehouse,
      fromWarehouse: newDocFromWarehouse,
      toWarehouse: newDocToWarehouse,
      date: newDocDate,
      description: newDocDescription || `${newDocType} Document`,
      pic: newDocPic || 'Budi Santoso',
      status: docStatus,
      items: formItems
    };

    if (docStatus === 'Completed') {
      const storedProds = getStoredProducts();
      const updatedProds = [...storedProds];

      newDoc.items.forEach(item => {
        const idx = updatedProds.findIndex(p => p.id === item.productId || p.sku === item.sku);
        if (idx > -1) {
          if (newDocType === 'Stock In') {
            updatedProds[idx].stock += item.qty;
          } else if (newDocType === 'Stock Out') {
            updatedProds[idx].stock = Math.max(0, updatedProds[idx].stock - item.qty);
          } else if (newDocType === 'Audit') {
            updatedProds[idx].stock = Math.max(0, updatedProds[idx].stock + item.qty);
          }

          const minStock = updatedProds[idx].minStock ?? 50;
          if (updatedProds[idx].stock === 0) {
            updatedProds[idx].status = 'Out of Stock';
          } else if (updatedProds[idx].stock <= minStock) {
            updatedProds[idx].status = 'Low Stock';
          } else {
            updatedProds[idx].status = 'In Stock';
          }
        }
      });

      saveProducts(updatedProds);
      setProducts(updatedProds);
    }

    setDocuments(prev => [newDoc, ...prev]);

    // Reset Form
    setNewDocId('');
    setNewDocDescription('');
    setNewDocPic('Budi Santoso');
    setFormItems([]);
    setIsAddingDoc(false);
  };

  const handleSaveMovementDocument = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveMovementDocumentWithStatus();
  };

  // Toggle draft document to completed
  const handleToggleDocStatus = (id: string, currentStatus: 'Completed' | 'Draft' | 'Cancel') => {
    if (currentStatus === 'Completed') {
      alert('Surat yang sudah "Completed" tidak dapat diubah statusnya demi keamanan pencatatan stok.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menyelesaikan (Completed) surat pergerakan ini? Hal ini akan langsung mengupdate stok produk!`)) {
      const updatedDocs = documents.map(doc => {
        if (doc.id === id) {
          const updatedDoc = { ...doc, status: 'Completed' as const };
          
          const storedProds = getStoredProducts();
          const updatedProds = [...storedProds];

          updatedDoc.items.forEach(item => {
            const idx = updatedProds.findIndex(p => p.id === item.productId || p.sku === item.sku);
            if (idx > -1) {
              if (updatedDoc.type === 'Stock In') {
                updatedProds[idx].stock += item.qty;
              } else if (updatedDoc.type === 'Stock Out') {
                updatedProds[idx].stock = Math.max(0, updatedProds[idx].stock - item.qty);
              } else if (updatedDoc.type === 'Audit') {
                updatedProds[idx].stock = Math.max(0, updatedProds[idx].stock + item.qty);
              }

              const minStock = updatedProds[idx].minStock ?? 50;
              if (updatedProds[idx].stock === 0) {
                updatedProds[idx].status = 'Out of Stock';
              } else if (updatedProds[idx].stock <= minStock) {
                updatedProds[idx].status = 'Low Stock';
              } else {
                updatedProds[idx].status = 'In Stock';
              }
            }
          });

          saveProducts(updatedProds);
          setProducts(updatedProds);
          return updatedDoc;
        }
        return doc;
      });

      setDocuments(updatedDocs);
    }
  };

  // Quick adjust products stock
  const handleProductQuickAdjust = (id: string, amount: number) => {
    const storedProds = getStoredProducts();
    const updated = storedProds.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + amount);
        const minStock = p.minStock ?? 50;
        const status: 'In Stock' | 'Low Stock' | 'Out of Stock' = newStock === 0 ? 'Out of Stock' : newStock <= minStock ? 'Low Stock' : 'In Stock';
        return { ...p, stock: newStock, status };
      }
      return p;
    });

    saveProducts(updated);
    setProducts(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (mainTab === 'facilities') {
      csvContent += 'Code,Name,PIC,Phone,Status,Capacity,Address\n';
      warehouses.forEach(w => {
        csvContent += `"${w.code}","${w.name}","${w.pic}","${w.phone}","${w.status}",${w.capacity},"${w.address}"\n`;
      });
    } else if (mainTab === 'movements') {
      csvContent += 'No. Surat,Type,Warehouse,Date,PIC,Status,Description\n';
      documents.forEach(d => {
        csvContent += `"${d.id}","${d.type}","${d.warehouse}","${d.date}","${d.pic}","${d.status}","${d.description}"\n`;
      });
    } else {
      csvContent += 'SKU,Name,Category,Brand,Stock,Cost Price,Sell Price,Status\n';
      products.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.category}","${p.brand || 'Serene'}",${p.stock},${p.price},${p.sellPrice},"${p.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warehouse_${mainTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (status: 'Completed' | 'Draft' | 'Cancel') => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FF9F43]/10 border border-[#FF9F43]/20 text-[#E87A5D]">
            <AlertTriangle size={11} className="text-[#E87A5D]" />
            Draft
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]">
            <CheckCircle size={11} className="text-[#10B981]" />
            Completed
          </span>
        );
      case 'Cancel':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]">
            <XCircle size={11} className="text-[#EF4444]" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // Render Document Creation View
  const renderCreateDocView = () => {
    const totalQty = formItems.reduce((acc, item) => acc + item.qty, 0);

    return (
      <div className="flex flex-col w-full h-full font-sans text-white bg-[#0A0A0A] overflow-y-auto min-h-screen">
        <div className="pl-8 pr-8 pb-8 pt-[9px] flex-1">
          
          {/* Top Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-[#1C1C1C] pb-5">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                  if (formItems.length > 0) {
                    setShowUnsavedDocModal(true);
                  } else {
                    setIsAddingDoc(false);
                  }
                }}
                className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-colors cursor-pointer text-[#909090] hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Action Buttons Row (Pill layout matching Purchase.tsx) */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center bg-[#18191E] border border-[#2B2E38] rounded-full p-1 shadow-lg">
                <button 
                  type="button"
                  onClick={() => handleSaveMovementDocumentWithStatus('Completed')}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#10B981] hover:text-[#34D399] hover:bg-[#10B981]/15 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle size={15} className="text-[#10B981]" />
                  <span>Simpan</span>
                </button>

                <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />

                <button 
                  type="button"
                  onClick={() => handleSaveMovementDocumentWithStatus('Draft')}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-white hover:text-gray-200 hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <FileText size={15} className="text-white" />
                  <span>Draft</span>
                </button>

                <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />

                <button 
                  type="button"
                  onClick={() => { 
                    if (formItems.length > 0) {
                      setShowUnsavedDocModal(true);
                    } else {
                      setIsAddingDoc(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#EF4444] hover:text-[#F87171] hover:bg-[#EF4444]/15 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <XCircle size={15} className="text-[#EF4444]" />
                  <span>Batal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Two-Column Responsive Workspace Grid (Matching Purchase.tsx) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Core Form Content (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* CARD 1: Transaction Information */}
              <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nomor Surat */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 font-sans">
                      Nomor Surat (No. Ref)
                    </label>
                    <input 
                      type="text" 
                      placeholder={`Otomatis (${getNextDocId(documents)})`}
                      value={newDocId}
                      onChange={(e) => setNewDocId(e.target.value)}
                      className="w-full h-[38px] px-3.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all font-sans"
                    />
                  </div>

                  {/* Gudang Asal (Dari) */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 font-sans">
                      <span className="text-red-500 mr-1">*</span>Gudang Asal (Dari)
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowFromWarehouseDropdown(!showFromWarehouseDropdown);
                          setShowTypeDropdown(false);
                          setShowToWarehouseDropdown(false);
                          setShowStatusDropdown(false);
                          setShowDateCalendar(false);
                        }}
                        className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left font-medium cursor-pointer font-sans"
                      >
                        <span className="truncate">{newDocFromWarehouse}</span>
                        <ChevronDown size={14} className="text-[#909090] shrink-0" />
                      </button>

                      <AnimatePresence>
                        {showFromWarehouseDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowFromWarehouseDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden font-sans"
                            >
                              <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                                {['Pemasok / Eksternal', ...warehouses.map(w => w.name)].map((whName, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setNewDocFromWarehouse(whName);
                                      setShowFromWarehouseDropdown(false);
                                    }}
                                    className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer font-sans ${
                                      newDocFromWarehouse === whName
                                        ? 'bg-[#222530] text-white font-semibold'
                                        : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                    }`}
                                  >
                                    <span className="truncate">{whName}</span>
                                    {newDocFromWarehouse === whName && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Gudang Tujuan (Ke) */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 font-sans">
                      <span className="text-red-500 mr-1">*</span>Gudang Tujuan (Ke)
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowToWarehouseDropdown(!showToWarehouseDropdown);
                          setShowTypeDropdown(false);
                          setShowFromWarehouseDropdown(false);
                          setShowStatusDropdown(false);
                          setShowDateCalendar(false);
                        }}
                        className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left font-medium cursor-pointer font-sans"
                      >
                        <span className="truncate">{newDocToWarehouse}</span>
                        <ChevronDown size={14} className="text-[#909090] shrink-0" />
                      </button>

                      <AnimatePresence>
                        {showToWarehouseDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowToWarehouseDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden font-sans"
                            >
                              <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                                {['Pelanggan / Eksternal', ...warehouses.map(w => w.name)].map((whName, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setNewDocToWarehouse(whName);
                                      setNewDocWarehouse(whName);
                                      setShowToWarehouseDropdown(false);
                                    }}
                                    className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer font-sans ${
                                      newDocToWarehouse === whName
                                        ? 'bg-[#222530] text-white font-semibold'
                                        : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                    }`}
                                  >
                                    <span className="truncate">{whName}</span>
                                    {newDocToWarehouse === whName && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Tanggal */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 font-sans">
                      <span className="text-red-500 mr-1">*</span>Tanggal
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDateCalendar(!showDateCalendar);
                          setShowTypeDropdown(false);
                          setShowFromWarehouseDropdown(false);
                          setShowToWarehouseDropdown(false);
                          setShowStatusDropdown(false);
                        }}
                        className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left font-medium cursor-pointer font-sans"
                      >
                        <span>{formatDateStr(newDocDate)}</span>
                        <Calendar size={14} className="text-[#909090]" />
                      </button>

                      <AnimatePresence>
                        {showDateCalendar && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDateCalendar(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute left-0 top-full mt-2 p-4 w-[290px] bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl z-50 flex flex-col overflow-hidden font-sans"
                            >
                              {renderCustomSingleCalendar(
                                dateViewDate,
                                newDocDate,
                                (ymd) => {
                                  setNewDocDate(ymd);
                                  setShowDateCalendar(false);
                                },
                                setDateViewDate
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Petugas (PIC) */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 font-sans">
                      Petugas (PIC)
                    </label>
                    <input 
                      type="text" 
                      required
                      value={newDocPic}
                      onChange={(e) => setNewDocPic(e.target.value)}
                      className="w-full h-[38px] px-3.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all font-sans font-medium"
                    />
                  </div>

                  {/* Keterangan / Memo */}
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 font-sans">
                      Keterangan / Memo
                    </label>
                    <input 
                      type="text" 
                      placeholder="Tulis alasan atau referensi..." 
                      value={newDocDescription}
                      onChange={(e) => setNewDocDescription(e.target.value)}
                      className="w-full h-[38px] px-3.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all font-sans font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: Product Picker & Table */}
              <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-8 relative">
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">Cari Nama / SKU Produk</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ketik nama produk atau SKU..." 
                        value={searchProductText}
                        onChange={(e) => {
                          setSearchProductText(e.target.value);
                          setShowSuggestions(true);
                          const exact = products.find(p => p.sku.toLowerCase() === e.target.value.toLowerCase() || p.name.toLowerCase() === e.target.value.toLowerCase());
                          if (exact) setSelectedProduct(exact);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddProductToFormList();
                          }
                        }}
                        className="w-full h-[38px] px-3.5 bg-[#141518] border border-[#2B2D36] focus:border-[#EA580C] rounded-xl text-[13px] text-white focus:outline-none transition-all font-medium"
                      />
                      {selectedProduct && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-[#EA580C]/20 text-[#EA580C] px-2 py-0.5 rounded font-mono font-bold">
                          {selectedProduct.sku}
                        </span>
                      )}
                    </div>

                    {showSuggestions && searchProductText.trim() !== '' && (
                      <div className="absolute left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-[#141518] border border-[#2B2D36] rounded-2xl shadow-2xl z-50 divide-y divide-[#20222B]">
                        {matchingProducts.length === 0 ? (
                          <div className="p-3 text-xs text-[#8E9099] italic text-center">
                            Produk tidak ditemukan
                          </div>
                        ) : (
                          matchingProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectProduct(p)}
                              className="w-full text-left px-4 py-2.5 hover:bg-[#20222B] transition-colors flex items-center justify-between text-xs cursor-pointer text-white"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-white">{p.name}</span>
                                <span className="text-[10px] text-[#8E9099] font-mono mt-0.5">{p.sku}</span>
                              </div>
                              <span className="text-[10px] bg-[#22242C] text-[#A0A2AC] font-mono px-2 py-0.5 rounded-md shrink-0">Stok: {p.stock}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                      {newDocType === 'Audit' ? 'Penyesuaian' : 'Kuantitas (Pcs)'}
                    </label>
                    <input 
                      type="number" 
                      placeholder="1"
                      value={searchProductQty}
                      onChange={(e) => setSearchProductQty(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddProductToFormList();
                        }
                      }}
                      className="w-full h-[38px] px-3 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] font-semibold text-center text-white focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleAddProductToFormList()}
                      className="w-[38px] h-[38px] bg-[#EA580C] hover:bg-[#D97706] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95 transition-all shrink-0"
                      title="Tambah Barang"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Form Items Table */}
                <div className="mt-4 border border-[#2B2D36] rounded-xl overflow-hidden bg-[#0E0F11]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#18191E] border-b border-[#2B2D36] text-[11px] font-semibold text-[#8E9099] tracking-wider">
                        <th className="py-3 px-4 w-32 font-medium">SKU</th>
                        <th className="py-3 px-4 font-medium">Nama Produk</th>
                        <th className="py-3 px-4 w-32 text-center font-medium">Kuantitas</th>
                        <th className="py-3 px-4 w-16 text-center font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#20222B]">
                      {formItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[#71737C] italic text-xs">
                            Belum ada barang dimasukkan ke surat pergerakan ini.
                          </td>
                        </tr>
                      ) : (
                        formItems.map((item, index) => (
                          <tr key={index} className="hover:bg-[#15171C] transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white text-xs">{item.sku}</td>
                            <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                            <td className="py-3 px-4 text-center font-semibold text-white">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                newDocType === 'Stock In' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                newDocType === 'Stock Out' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                item.qty >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {newDocType === 'Stock In' ? `+${item.qty}` : 
                                 newDocType === 'Stock Out' ? `-${item.qty}` : 
                                 item.qty >= 0 ? `+${item.qty}` : item.qty} Pcs
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setFormItems(prev => prev.filter((_, i) => i !== index))}
                                className="p-1.5 hover:bg-rose-500/10 rounded-lg text-[#8E9099] hover:text-rose-400 transition-all cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Summary & Status (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* CARD 3: Document Summary */}
              <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl p-6 shadow-xl space-y-5">
                <div className="pb-3 border-b border-[#22242C]">
                  <h2 className="text-sm font-bold text-white tracking-wide">Ringkasan Dokumen</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#18191E] border border-[#2B2D36] rounded-xl text-xs">
                    <span className="text-[#8E9099] font-medium">Total Jenis Barang</span>
                    <span className="font-bold text-white font-sans">{formItems.length} Item</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#18191E] border border-[#2B2D36] rounded-xl text-xs">
                    <span className="text-[#8E9099] font-medium">Total Kuantitas</span>
                    <span className="font-bold text-[#EA580C] font-sans">{totalQty} Pcs</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#18191E] border border-[#2B2D36] rounded-xl text-xs">
                    <span className="text-[#8E9099] font-medium">Gudang Asal (Dari)</span>
                    <span className="font-semibold text-white truncate max-w-[140px]">{newDocFromWarehouse}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#18191E] border border-[#2B2D36] rounded-xl text-xs">
                    <span className="text-[#8E9099] font-medium">Gudang Tujuan (Ke)</span>
                    <span className="font-semibold text-white truncate max-w-[140px]">{newDocToWarehouse}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full font-sans text-white bg-[#0A0A0A] overflow-y-auto min-h-screen relative overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {isAddingDoc ? (
          <motion.div
            key="create-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full flex flex-col"
          >
            {renderCreateDocView()}
          </motion.div>
        ) : (
          <motion.div
            key="main-view"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full flex flex-col"
          >
            <div className="pl-8 pr-8 pb-8 pt-[9px] flex-1">
              
              {/* TOP PAGE HEADER */}
              <div className="flex items-start justify-between mb-8">
                <div className="pb-0" style={{ marginBottom: '0px', paddingBottom: '0px' }}>
                  <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0" style={{ marginBottom: 0 }}>
                    <span>Warehouse</span>
                  </h1>
                  <p className="text-[13px] text-[#909090]">
                    Manage your warehouse facilities, capacity, and stock movement documents.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-5 text-[12px] font-medium text-[#909090] mb-8">
                    <button 
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <HelpCircle size={14} /> Guide
                    </button>
                    <button 
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <FileText size={14} /> PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT CONTAINER */}
              <div className="bg-[#141517] border border-[#1C1C1C] rounded-xl shadow-2xl relative z-10">
                
                {/* PRIMARY VIEW NAVIGATION TABS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#1C1C1C] px-4 bg-[#0F1012] gap-2 rounded-t-xl relative z-20">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      onClick={() => setMainTab('facilities')}
                      className={`flex items-center gap-2 px-4 py-3.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        mainTab === 'facilities' 
                          ? 'border-[#EA580C] text-white' 
                          : 'border-transparent text-[#909090] hover:text-white'
                      }`}
                    >
                      <span>Stock In</span>
                    </button>

                    <button
                      onClick={() => setMainTab('movements')}
                      className={`flex items-center gap-2 px-4 py-3.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        mainTab === 'movements' 
                          ? 'border-[#EA580C] text-white' 
                          : 'border-transparent text-[#909090] hover:text-white'
                      }`}
                    >
                      <span>Stock Out</span>
                    </button>

                    <button
                      onClick={() => setMainTab('stock')}
                      className={`flex items-center gap-2 px-4 py-3.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        mainTab === 'stock' 
                          ? 'border-[#EA580C] text-white' 
                          : 'border-transparent text-[#909090] hover:text-white'
                      }`}
                    >
                      <span>Audit</span>
                    </button>
                  </div>

                  {/* Search and Filters inside Tab bar */}
                  <div className="py-2 flex items-center gap-2">
                    <div className="relative min-w-[200px]">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707070]" />
                      <input 
                        type="text" 
                        placeholder="Cari no. surat, gudang, PIC..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full bg-[#1A1B1F] border border-[#2D2E33] focus:border-[#EA580C] text-xs text-white pl-8 pr-3 py-1.5 rounded-lg outline-none transition-colors"
                      />
                      {localSearch && (
                        <button 
                          onClick={() => setLocalSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#707070] hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Stock Movement Action Button + Dropdown */}
                    <div className="relative">
                      <motion.button 
                        onClick={() => setShowDocDropdown(!showDocDropdown)}
                        whileHover={{ backgroundColor: '#C2410C' }}
                        whileTap={{ scale: 0.95 }}
                        title="Buat Pergerakan Stok"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-[#EA580C] transition-all cursor-pointer shadow-lg hover:shadow-orange-500/20 active:scale-95 shrink-0"
                      >
                        <ClipboardList size={18} />
                      </motion.button>

                      <AnimatePresence>
                        {showDocDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDocDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute right-0 top-full mt-2 w-72 bg-[#1A1B1F] border border-[#2C2E35] text-white rounded-2xl shadow-2xl p-2 z-50 overflow-hidden font-sans select-none"
                            >
                              {/* Stock In */}
                              <button
                                onClick={() => handleOpenDocModal('Stock In')}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors shrink-0">
                                    <ArrowDownRight size={17} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-snug">Stock In</p>
                                    <p className="text-xs text-[#8E9099] leading-snug">Catat barang masuk ke gudang</p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ I</span>
                              </button>

                              {/* Stock Out */}
                              <button
                                onClick={() => handleOpenDocModal('Stock Out')}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center text-rose-400 transition-colors shrink-0">
                                    <ArrowUpRight size={17} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors leading-snug">Stock Out</p>
                                    <p className="text-xs text-[#8E9099] leading-snug">Catat barang keluar dari gudang</p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ O</span>
                              </button>

                              {/* Audit */}
                              <button
                                onClick={() => handleOpenDocModal('Audit')}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center text-purple-400 transition-colors shrink-0">
                                    <ClipboardCheck size={17} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors leading-snug">Audit</p>
                                    <p className="text-xs text-[#8E9099] leading-snug">Catat penyesuaian stok opname</p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ A</span>
                              </button>

                              <div className="my-1 border-t border-[#2C2E35]" />

                              {/* Cancel */}
                              <button
                                onClick={() => setShowDocDropdown(false)}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-500/10 transition-colors group text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors shrink-0">
                                    <XCircle size={17} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors leading-snug">Cancel</p>
                                    <p className="text-xs text-[#8E9099] leading-snug">Tutup menu dropdown</p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-medium text-red-400/80 group-hover:text-red-300">ESC</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* TAB 1: STOCK IN VIEW */}
                {mainTab === 'facilities' && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1C1C1C] bg-[#111112]">
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-36">No. Surat</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-28">Tipe</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-44">Gudang</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-36">Tanggal</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-32">PIC</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] text-center w-28">Status</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C1C]">
                          {filteredDocuments.filter(d => d.type === 'Stock In').length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-[#909090]">
                                <div className="flex flex-col items-center justify-center">
                                  <FileText size={32} className="text-[#333] mb-3" />
                                  <p className="text-[13px] text-white font-semibold mb-1">Tidak ada dokumen Stock In ditemukan</p>
                                  <p className="text-[11px] text-[#666]">Gunakan tombol "Buat Pergerakan" untuk membuat dokumen Stock In baru.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredDocuments.filter(d => d.type === 'Stock In').map((doc) => (
                              <tr key={doc.id} className="border-b border-[#1C1C1C] hover:bg-[#1C1D1F] transition-colors group">
                                <td className="py-3.5 px-4 text-[12px] font-bold text-[#EA580C] font-mono tracking-wider">
                                  {doc.id}
                                </td>
                                <td className="py-3.5 px-4 text-[11px] font-bold">
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {doc.type}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white font-semibold">
                                  <span>{doc.warehouse}</span>
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white">
                                  {formatDateStr(doc.date)}
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white font-semibold">
                                  {doc.pic}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {renderStatusBadge(doc.status)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setSelectedDocForDetail(doc)}
                                      title="Lihat detail"
                                      className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#909090] hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    
                                    {doc.status === 'Draft' && (
                                      <button
                                        onClick={() => handleToggleDocStatus(doc.id, doc.status)}
                                        title="Selesaikan & Update Stok"
                                        className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#10B981] hover:text-emerald-400 transition-colors cursor-pointer"
                                      >
                                        <CheckCircle size={14} />
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setDeleteModal({ type: 'movement', id: doc.id, name: doc.id })}
                                      title="Hapus"
                                      className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#909090] hover:text-rose-500 transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: STOCK OUT VIEW */}
                {mainTab === 'movements' && (
                  <div>
                    {/* Table of Movements */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1C1C1C] bg-[#111112]">
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-36">No. Surat</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-28">Tipe</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-44">Gudang</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-36">Tanggal</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-32">PIC</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] text-center w-28">Status</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C1C]">
                          {filteredDocuments.filter(d => d.type === 'Stock Out').length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-[#909090]">
                                <div className="flex flex-col items-center justify-center">
                                  <FileText size={32} className="text-[#333] mb-3" />
                                  <p className="text-[13px] text-white font-semibold mb-1">Tidak ada dokumen Stock Out ditemukan</p>
                                  <p className="text-[11px] text-[#666]">Gunakan tombol "Buat Pergerakan" untuk membuat dokumen Stock Out baru.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredDocuments.filter(d => d.type === 'Stock Out').map((doc) => (
                              <tr key={doc.id} className="border-b border-[#1C1C1C] hover:bg-[#1C1D1F] transition-colors group">
                                <td className="py-3.5 px-4 text-[12px] font-bold text-[#EA580C] font-mono tracking-wider">
                                  {doc.id}
                                </td>
                                <td className="py-3.5 px-4 text-[11px] font-bold">
                                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    {doc.type}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white font-semibold">
                                  <span>{doc.warehouse}</span>
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white">
                                  {formatDateStr(doc.date)}
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white font-semibold">
                                  {doc.pic}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {renderStatusBadge(doc.status)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setSelectedDocForDetail(doc)}
                                      title="Lihat detail"
                                      className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#909090] hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    
                                    {doc.status === 'Draft' && (
                                      <button
                                        onClick={() => handleToggleDocStatus(doc.id, doc.status)}
                                        title="Selesaikan & Update Stok"
                                        className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#10B981] hover:text-emerald-400 transition-colors cursor-pointer"
                                      >
                                        <CheckCircle size={14} />
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setDeleteModal({ type: 'movement', id: doc.id, name: doc.id })}
                                      title="Hapus"
                                      className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#909090] hover:text-rose-500 transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: AUDIT VIEW */}
                {mainTab === 'stock' && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1C1C1C] bg-[#111112]">
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-36">No. Surat</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-28">Tipe</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-44">Gudang</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-36">Tanggal</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] w-32">PIC</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] text-center w-28">Status</th>
                            <th className="py-3.5 px-4 font-medium text-[#909090] text-[12px] text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C1C]">
                          {filteredDocuments.filter(d => d.type === 'Audit').length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-[#909090]">
                                <div className="flex flex-col items-center justify-center">
                                  <FileText size={32} className="text-[#333] mb-3" />
                                  <p className="text-[13px] text-white font-semibold mb-1">Tidak ada dokumen Audit ditemukan</p>
                                  <p className="text-[11px] text-[#666]">Gunakan tombol "Buat Pergerakan" untuk membuat dokumen Audit baru.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredDocuments.filter(d => d.type === 'Audit').map((doc) => (
                              <tr key={doc.id} className="border-b border-[#1C1C1C] hover:bg-[#1C1D1F] transition-colors group">
                                <td className="py-3.5 px-4 text-[12px] font-bold text-[#EA580C] font-mono tracking-wider">
                                  {doc.id}
                                </td>
                                <td className="py-3.5 px-4 text-[11px] font-bold">
                                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {doc.type}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white font-semibold">
                                  <span>{doc.warehouse}</span>
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white">
                                  {formatDateStr(doc.date)}
                                </td>
                                <td className="py-3.5 px-4 text-[12px] text-white font-semibold">
                                  {doc.pic}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {renderStatusBadge(doc.status)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setSelectedDocForDetail(doc)}
                                      title="Lihat detail"
                                      className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#909090] hover:text-white transition-colors cursor-pointer"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    
                                    {doc.status === 'Draft' && (
                                      <button
                                        onClick={() => handleToggleDocStatus(doc.id, doc.status)}
                                        title="Selesaikan & Update Stok"
                                        className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#10B981] hover:text-emerald-400 transition-colors cursor-pointer"
                                      >
                                        <CheckCircle size={14} />
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setDeleteModal({ type: 'movement', id: doc.id, name: doc.id })}
                                      title="Hapus"
                                      className="p-1.5 hover:bg-[#25262B] rounded-lg text-[#909090] hover:text-rose-500 transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DETIL SURAT PERGERAKAN */}
      {selectedDocForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#2A2A2A] bg-[#141517] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#EA580C]" />
                <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Detil Surat Pergerakan</h3>
              </div>
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="p-1 hover:bg-[#202022] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
                <div>
                  <span className="block text-[10px] text-[#707070] font-bold uppercase tracking-wider">No. Surat</span>
                  <span className="text-[13px] font-bold text-[#EA580C] font-mono mt-0.5 block">{selectedDocForDetail.id}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#707070] font-bold uppercase tracking-wider">Tipe Surat</span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-white mt-0.5">
                    {selectedDocForDetail.type}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#707070] font-bold uppercase tracking-wider">Lokasi Gudang</span>
                  <span className="text-[12px] font-bold text-white mt-0.5 block">{selectedDocForDetail.warehouse}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#707070] font-bold uppercase tracking-wider">Tanggal</span>
                  <span className="text-[12px] font-bold text-white mt-0.5 block">{formatDateStr(selectedDocForDetail.date)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <span className="block text-[10px] text-[#707070] font-bold uppercase tracking-wider mb-1">Keterangan / Memo</span>
                  <p className="text-[12px] text-white font-medium bg-[#1a1b1e] p-3 rounded-lg border border-[#2A2A2A] italic">
                    "{selectedDocForDetail.description}"
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] text-[#707070] font-bold uppercase tracking-wider mb-1">Petugas (PIC)</span>
                  <div className="bg-[#1a1b1e] p-3 rounded-lg border border-[#2A2A2A] flex items-center gap-2">
                    <User size={13} className="text-[#909090]" />
                    <span className="text-[12px] text-white font-semibold">{selectedDocForDetail.pic}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-[#707070] font-bold uppercase tracking-wider mb-2">Daftar Barang yang Dimuat</span>
                <div className="border border-[#2A2A2A] rounded-xl overflow-hidden bg-[#0A0A0A]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#111112] border-b border-[#2A2A2A] text-[10px] font-bold uppercase tracking-wider text-[#707070]">
                        <th className="py-2.5 px-4 w-32">SKU</th>
                        <th className="py-2.5 px-4">Nama Produk</th>
                        <th className="py-2.5 px-4 w-32 text-center">Jumlah Transaksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C1C]">
                      {selectedDocForDetail.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#141517] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#EA580C] text-[11px]">{item.sku}</td>
                          <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              selectedDocForDetail.type === 'Stock In' ? 'text-emerald-400 bg-emerald-500/10' :
                              selectedDocForDetail.type === 'Stock Out' ? 'text-rose-400 bg-rose-500/10' :
                              item.qty >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                            }`}>
                              {selectedDocForDetail.type === 'Stock In' ? `+${item.qty}` : 
                               selectedDocForDetail.type === 'Stock Out' ? `-${item.qty}` : 
                               item.qty >= 0 ? `+${item.qty}` : item.qty} Pcs
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#2A2A2A] bg-[#141517] flex justify-end gap-2">
              <span className="text-[11px] text-[#707070] self-center mr-auto">
                Status: <strong className="text-white">{selectedDocForDetail.status}</strong>
              </span>
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Tutup Detil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT GUDANG */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-[#EA580C]" />
                <span>{editingWarehouse ? 'Edit Fasilitas Gudang' : 'Tambah Gudang Baru'}</span>
              </h3>
              <button
                onClick={() => setIsWarehouseModalOpen(false)}
                className="p-1 hover:bg-[#202022] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Kode Gudang</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: WH-JKT-01"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    className="w-full h-9 bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg px-3 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Status Gudang</label>
                  <select 
                    value={whStatus}
                    onChange={(e) => setWhStatus(e.target.value as 'Active' | 'Maintenance' | 'Full')}
                    className="w-full h-9 bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg px-3 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Nama Fasilitas Gudang</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Jakarta West Hub"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full h-9 bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg px-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Alamat Lengkap</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Jl. Panjang No. 88, Kebon Jeruk, Jakarta Barat"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  className="w-full bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg p-3 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Penanggung Jawab (PIC)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nama PIC"
                    value={whPic}
                    onChange={(e) => setWhPic(e.target.value)}
                    className="w-full h-9 bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Telepon / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="+62 812-3456-7890"
                    value={whPhone}
                    onChange={(e) => setWhPhone(e.target.value)}
                    className="w-full h-9 bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Maksimal Kapasitas (Pcs)</label>
                <input 
                  type="number" 
                  required
                  placeholder="5000"
                  value={whCapacity}
                  onChange={(e) => setWhCapacity(e.target.value)}
                  className="w-full h-9 bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg px-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#909090] mb-1 font-semibold">Catatan Tambahan (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Keterangan area atau tipe kargo..."
                  value={whNotes}
                  onChange={(e) => setWhNotes(e.target.value)}
                  className="w-full h-9 bg-[#0E0F11] border border-[#2A2A2A] focus:border-[#EA580C] rounded-lg px-3 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 border border-[#2A2A2A] text-xs font-semibold text-[#909090] hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EA580C] hover:bg-[#006CD9] text-xs font-bold text-white rounded-lg transition-colors shadow-md cursor-pointer"
                >
                  Simpan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Konfirmasi Hapus</h3>
              <p className="text-xs text-[#909090] mt-1">
                Apakah Anda yakin ingin menghapus {deleteModal.type === 'warehouse' ? 'gudang' : 'surat pergerakan'} <strong className="text-white">"{deleteModal.name}"</strong>? Action ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 border border-[#2A2A2A] text-xs font-semibold text-[#909090] hover:text-white rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white rounded-lg shadow-md cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERINGATAN DOKUMEN BELUM DISIMPAN */}
      {showUnsavedDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Membatalkan Pembuatan Surat?</h3>
              <p className="text-xs text-[#909090] mt-1">
                Terdapat {formItems.length} item dalam daftar pergerakan. Jika Anda keluar sekarang, data yang belum disimpan akan hilang.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowUnsavedDocModal(false)}
                className="px-4 py-2 border border-[#2A2A2A] text-xs font-semibold text-[#909090] hover:text-white rounded-lg cursor-pointer"
              >
                Lanjutkan Edit
              </button>
              <button
                onClick={() => {
                  setShowUnsavedDocModal(false);
                  setFormItems([]);
                  setIsAddingDoc(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white rounded-lg shadow-md cursor-pointer"
              >
                Keluar & Buang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PANDUAN PENGGUNAAN (WAREHOUSE GUIDE MODAL) */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGuideModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden p-6 space-y-5 text-left font-sans"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <HelpCircle size={18} className="text-[#EA580C]" />
                    Panduan Pengelolaan Pergudangan & Logistik (Warehouse Guide)
                  </h2>
                  <p className="text-xs text-[#909090] mt-0.5">
                    Petunjuk langkah demi langkah untuk mengelola pergerakan stok, gudang, dan dokumen logistik
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="p-1 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-[#CCCCCC] max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">1</span>
                    Dokumen Pergerakan Stok (Stock Movement)
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Gunakan opsi <strong>Stock In</strong> untuk pencatatan barang masuk dari pemasok, <strong>Stock Out</strong> untuk pengeluaran ke pelanggan, dan <strong>Audit</strong> untuk penyesuaian opname fisik stok.
                  </p>
                </div>

                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">2</span>
                    Gudang Asal & Tujuan (Warehouse Transfer)
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Pilih lokasi gudang asal dan gudang tujuan dengan benar. Sistem secara otomatis mencatat riwayat perpindahan barang untuk mempermudah pemantauan stok antar fasilitas.
                  </p>
                </div>

                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">3</span>
                    Status Dokumen (Completed & Draft)
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Dokumen dengan status <strong>Completed</strong> akan secara otomatis memperbarui saldo stok produk di sistem secara real-time. Gunakan <strong>Draft</strong> jika dokumen masih memerlukan revisi.
                  </p>
                </div>

                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">4</span>
                    Cetak PDF & Ekspor Data
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Gunakan tombol <strong>PDF</strong> di pojok kanan atas untuk mencetak atau menyimpan dokumen rekapitulasi pergudangan ke dalam format PDF secara langsung.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2A2A2A] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
