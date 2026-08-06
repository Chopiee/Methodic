import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredInvoices, registerNewInvoice, updateInvoice, getStoredPartners, getStoredProducts, saveInvoices, savePartners, saveProducts, getIdPrefixSettings, getNextId, getStoredAccounts, getInvoiceLogs, formatLogTimestamp, DocumentActivityLog, InvoiceItem, getCompanySettings } from '../lib/state';
import { setHasUnsavedChanges } from '../lib/unsaved';
import { 
  ChevronDown, Filter, List, LayoutGrid, Kanban, SlidersHorizontal, 
  Search, 
  Calendar, 
  Trash2, 
  Printer, 
  Mail, 
  MessageCircle, 
  CheckCircle, 
  Plus, 
  Download, 
  MoreVertical, 
  BarChart2, 
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Hash,
  Building2,
  Link2,
  Clock,
  Info,
  Coins,
  Wallet,
  AlertTriangle,
  AlertCircle,
  CircleDashed,
  Send,
  Eye,
  XCircle,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  ArrowLeft,
  Paperclip,
  Edit3,
  Upload,
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  Truck,
  Image as ImageIcon,
  User
} from 'lucide-react';

const getNextInvoiceNo = (type: string, isSalesMode: boolean, invoiceList: any[]) => {
  const settings = getIdPrefixSettings();
  const prefix = type === 'Invoice' ? (isSalesMode ? (settings.salesInvoicePrefix || 'SLS-') : (settings.purchaseInvoicePrefix || 'PUR-'))
    : type === 'Quotation' ? (isSalesMode ? (settings.salesQuotationPrefix || 'QSL-') : (settings.purchaseQuotationPrefix || 'QPR-'))
    : type === 'Delivery' ? (isSalesMode ? (settings.deliveryOrderPrefix || 'SJL-') : 'SJR-')
    : (isSalesMode ? (settings.returnSalesPrefix || 'RTS-') : (settings.returnPurchasePrefix || 'RTP-'));

  let max = 0;
  if (Array.isArray(invoiceList)) {
    invoiceList.forEach((inv: any) => {
      if (inv && inv.id) {
        const cleanId = String(inv.id).replace(/\s+/g, '');
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

const invoiceData = [
  // Invoice type documents
  { id: 'INV - RK - 217', distributor: 'PT. Asia Paramita Indah', ref: 'Pixy | PIM26060399', date: '04/07/2026', due: '03/08/2026', type: 'Invoice', status: 'Unpaid', remaining: '3.208.952', total: '3.208.952' },
  { id: 'INV - RK - 222', distributor: 'PT. Dinamika Daya Segara', ref: 'Azzura | HG51020499', date: '03/07/2026', due: '16/07/2026', type: 'Invoice', status: 'Unpaid', remaining: '3.116.128', total: '3.116.128' },
  { id: 'INV - RK - 221', distributor: 'Monic', ref: 'Monic | 03072026', date: '03/07/2026', due: '03/07/2026', type: 'Invoice', status: 'Partially Paid', remaining: '2.232.000', total: '2.232.000' },
  { id: 'INV - RK - 223', distributor: 'PT. Asia Paramita Indah', ref: 'Gatsby | TAM26060920', date: '02/07/2026', due: '29/07/2026', type: 'Invoice', status: 'Paid', remaining: '0', total: '1.541.219' },
  { id: 'INV - RK - 220', distributor: 'PT. Asia Paramita Indah', ref: 'Pixy | PUM26060457', date: '02/07/2026', due: '29/07/2026', type: 'Invoice', status: 'Paid', remaining: '0', total: '1.100.580' },
  { id: 'INV - RK - 219', distributor: 'PT. Asia Paramita Indah', ref: 'Pixy | PIM26060401', date: '02/07/2026', due: '29/07/2026', type: 'Invoice', status: 'Unpaid', remaining: '2.629.380', total: '2.629.380' },
  { id: 'INV - RK - 218', distributor: 'PT. Asia Paramita Indah', ref: 'Pixy | PIM26060393', date: '02/07/2026', due: '29/07/2026', type: 'Invoice', status: 'Unpaid', remaining: '2.547.480', total: '2.547.480' },
  { id: 'INV - RK - 216', distributor: 'PT. Asia Paramita Indah', ref: 'Pixy | PUM26060451', date: '02/07/2026', due: '29/07/2026', type: 'Invoice', status: 'Unpaid', remaining: '3.545.880', total: '3.545.880' },
  { id: 'INV - RK - 215', distributor: 'PT. Asia Paramita Indah', ref: 'Pixy | PIM26060398', date: '02/07/2026', due: '29/07/2026', type: 'Invoice', status: 'Partially Paid', remaining: '3.242.460', total: '3.242.460' },
  { id: 'INV - RK - 214', distributor: 'PT. Asia Paramita Indah', ref: 'Pixy | PIM26060402', date: '02/07/2026', due: '29/07/2026', type: 'Invoice', status: 'Paid', remaining: '0', total: '989.820' },

  // Quotation type documents
  { id: 'PNW - RK - 001', distributor: 'PT. Sumber Makmur', ref: 'Penawaran Bahan Baku', date: '01/07/2026', due: '15/07/2026', type: 'Quotation', status: 'Approved', remaining: '5.000.000', total: '5.000.000' },
  { id: 'PNW - RK - 002', distributor: 'CV. Sentosa Jaya', ref: 'Penawaran Kemasan', date: '28/06/2026', due: '10/07/2026', type: 'Quotation', status: 'Draft', remaining: '1.250.000', total: '1.250.000' },
  { id: 'PNW - RK - 003', distributor: 'PT. Dinamika Daya Segara', ref: 'Penawaran Distribusi', date: '25/06/2026', due: '05/07/2026', type: 'Quotation', status: 'Rejected', remaining: '8.400.000', total: '8.400.000' },

  // Delivery type documents
  { id: 'SJM - RK - 101', distributor: 'PT. Asia Paramita Indah', ref: 'Surat Jalan Pixy', date: '03/07/2026', due: '03/07/2026', type: 'Delivery', status: 'Shipped', remaining: '0', total: '0', driver: 'Budi Santoso', vehicleNo: 'B 9123 SQR' },
  { id: 'SJM - RK - 102', distributor: 'PT. Dinamika Daya Segara', ref: 'Surat Jalan Azzura', date: '02/07/2026', due: '02/07/2026', type: 'Delivery', status: 'Completed', remaining: '0', total: '0', driver: 'Ahmad Supardi', vehicleNo: 'B 9841 TZX' },

  // Return type documents
  { id: 'RTR - RK - 301', distributor: 'PT. Asia Paramita Indah', ref: 'Retur Pixy Rusak', date: '04/07/2026', due: '04/07/2026', type: 'Return', status: 'Processing', remaining: '320.000', total: '320.000' },
  { id: 'RTR - RK - 302', distributor: 'Monic', ref: 'Retur Monic Salah Kirim', date: '01/07/2026', due: '01/07/2026', type: 'Return', status: 'Completed', remaining: '150.000', total: '150.000' }
];

const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const getMonthName = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
};

const formatDateStr = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = getMonthName(date);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatDateInputStr = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const parseDateStr = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const formatAmount = (val: any) => {
  if (val === undefined || val === null) return 'Rp 0';
  if (typeof val === 'number') {
    return 'Rp ' + val.toLocaleString('id-ID');
  }
  if (String(val).includes('Rp') || String(val).includes('.')) {
    return String(val).startsWith('Rp') ? val : 'Rp ' + val;
  }
  const num = Number(val);
  if (!isNaN(num)) {
    return 'Rp ' + num.toLocaleString('id-ID');
  }
  return 'Rp ' + val;
};

const getRelativeDueDate = (dueDate: Date): string => {
  const today = new Date(2026, 6, 9); // 9 July 2026
  const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d2 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} late`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `${diffDays} days left`;
  }
};

const parseYMD = (str: string): Date => {
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

const getRelativeDueDateClass = (dueDate: Date): string => {
  const today = new Date(2026, 6, 9); // 9 July 2026
  const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d2 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'text-[#EF4444]'; // Red for late
  } else if (diffDays === 0) {
    return 'text-[#F59E0B]'; // Amber for today
  } else if (diffDays <= 7) {
    return 'text-[#F59E0B]'; // Amber for soon
  } else {
    return 'text-white'; // White for distant future
  }
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
  
  // Faded days of next month to fill grid to 42 cells (6 rows of 7 days)
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

const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-amber-300 via-rose-300 to-pink-400',
    'from-emerald-300 via-teal-400 to-cyan-500',
    'from-rose-300 via-red-400 to-pink-500',
    'from-amber-300 via-orange-400 to-red-500',
    'from-amber-200 via-orange-400 to-amber-600',
    'from-orange-300 via-[#E87A5D] to-rose-400'
  ];
  let hash = 0;
  const str = name || 'User';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const renderStatusBadge = (status: string) => {
  let textColorClass = 'text-white';

  switch (status) {
    case 'Unpaid':
    case 'Rejected':
    case 'Inactive':
    case 'Cancel':
      textColorClass = 'text-[#F87171]'; // Danger
      break;
    case 'Partially Paid':
    case 'Processing':
    case 'On Leave':
    case 'Pending':
      textColorClass = 'text-[#FBBF24]'; // Warning
      break;
    case 'Shipped':
    case 'Delivery':
    case 'Draft':
      textColorClass = 'text-[#EA580C]'; // Accent
      break;
    case 'Paid':
    case 'Completed':
    case 'Approved':
    case 'Active':
      textColorClass = 'text-[#4ADE80]'; // Success
      break;
    default:
      textColorClass = 'text-white'; // Default
      break;
  }

  return (
    <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-[12px] font-medium leading-none bg-[#22242C] ${textColorClass}`}>
      {status}
    </span>
  );
};

interface PurchaseProps {
  isSales?: boolean;
  key?: string;
  searchQuery?: string;
}

export function Purchase({ isSales = false, searchQuery = '' }: PurchaseProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('Invoice');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [sortFilter, setSortFilter] = useState('');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [partnerFilter, setPartnerFilter] = useState('');
  const [showPartnerFilterDropdown, setShowPartnerFilterDropdown] = useState(false);
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [maxAmountFilter, setMaxAmountFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [showDatePopup, setShowDatePopup] = useState(false);

  const [rangeStart, setRangeStart] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
  const [rangeEnd, setRangeEnd] = useState<Date>(new Date(new Date().getFullYear(), 11, 31));

  // For the active selection process inside the calendar
  const [tempStart, setTempStart] = useState<Date | null>(new Date(new Date().getFullYear(), 0, 1));
  const [tempEnd, setTempEnd] = useState<Date | null>(new Date(new Date().getFullYear(), 11, 31));

  // Current left calendar view date: current month
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // Selected preset state
  const [selectedPreset, setSelectedPreset] = useState<string>('This year');

  const [invoices, setInvoices] = useState<any[]>(() => getStoredInvoices());

  // Add Transaction Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newDate, setNewDate] = useState('2026-07-09');
  const [newDue, setNewDue] = useState('2026-08-09');
  const [newType, setNewType] = useState<'Invoice' | 'Quotation' | 'Delivery' | 'Return'>('Invoice');
  const [newStatus, setNewStatus] = useState('Unpaid');
  const [newSelectedProductId, setNewSelectedProductId] = useState('');
  const [newQty, setNewQty] = useState('10');
  const [newPrice, setNewPrice] = useState('150000');

  // Multi-line editor and page view states
  const [view, setView] = useState<'list' | 'create'>('list');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isFormEditable, setIsFormEditable] = useState(true);
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentBank, setPaymentBank] = useState('BCA');
  const [paymentInvoices, setPaymentInvoices] = useState<any[]>([]);

  // Accounting Preview & Editable Account States
  const [showAccountingModal, setShowAccountingModal] = useState(false);
  const [showSaveAccountingModal, setShowSaveAccountingModal] = useState(false);
  const [saveDebitAccount, setSaveDebitAccount] = useState(isSales ? '1200 - Piutang Usaha' : '5100 - Harga Pokok Penjualan');
  const [saveCreditAccount, setSaveCreditAccount] = useState(isSales ? '4100 - Penjualan Produk' : '2100 - Utang Usaha');
  const [showSaveDebitDropdown, setShowSaveDebitDropdown] = useState(false);
  const [showSaveCreditDropdown, setShowSaveCreditDropdown] = useState(false);
  const [paymentDebitAccount, setPaymentDebitAccount] = useState('1130 - Bank BCA');
  const [paymentCreditAccount, setPaymentCreditAccount] = useState('1200 - Piutang Usaha');

  React.useEffect(() => {
    setHasUnsavedChanges(view === 'create');
  }, [view]);

  React.useEffect(() => {
    if (!editingInvoiceId) {
      setSaveDebitAccount(isSales ? '1200 - Piutang Usaha' : '5100 - Harga Pokok Penjualan');
      setSaveCreditAccount(isSales ? '4100 - Penjualan Produk' : '2100 - Utang Usaha');
    }
  }, [isSales, editingInvoiceId]);

  const coaAccountsList = React.useMemo(() => {
    const stored = getStoredAccounts();
    const nonHeader = stored.filter(a => !a.isHeader);
    if (nonHeader.length > 0) {
      return nonHeader.map(a => ({
        code: a.code,
        name: a.name,
        label: `${a.code} - ${a.name}`
      }));
    }
    return [
      { code: '1110', name: 'Kas Kecil', label: '1110 - Kas Kecil' },
      { code: '1120', name: 'Kas di Toko', label: '1120 - Kas di Toko' },
      { code: '1130', name: 'Bank BCA', label: '1130 - Bank BCA' },
      { code: '1140', name: 'Bank Mandiri', label: '1140 - Bank Mandiri' },
      { code: '1200', name: 'Piutang Usaha', label: '1200 - Piutang Usaha' },
      { code: '1300', name: 'Persediaan Barang Dagang', label: '1300 - Persediaan Barang Dagang' },
      { code: '2100', name: 'Utang Usaha', label: '2100 - Utang Usaha' },
      { code: '4100', name: 'Penjualan Produk', label: '4100 - Penjualan Produk' },
      { code: '5100', name: 'Harga Pokok Penjualan', label: '5100 - Harga Pokok Penjualan' },
      { code: '6100', name: 'Beban Gaji', label: '6100 - Beban Gaji' },
      { code: '6190', name: 'Beban Lain-lain', label: '6190 - Beban Lain-lain' }
    ];
  }, [showSaveAccountingModal, showPaymentModal, showAccountingModal]);

  // Cash & Bank accounts list for payment dropdown
  const paymentBankAccounts = React.useMemo(() => {
    const stored = getStoredAccounts();
    const cashOrBank = stored.filter(a => {
      if (a.isHeader) return false;
      const subLower = (a.subCategory || '').toLowerCase().trim();
      return subLower === 'cash' || subLower === 'bank';
    });

    if (cashOrBank.length > 0) {
      return cashOrBank.map(a => ({
        code: a.code,
        name: a.name,
        label: `${a.code} - ${a.name}`
      }));
    }

    return [
      { code: '1110', name: 'Kas Kecil', label: '1110 - Kas Kecil' },
      { code: '1120', name: 'Kas di Toko', label: '1120 - Kas di Toko' },
      { code: '1130', name: 'Bank BCA', label: '1130 - Bank BCA' },
      { code: '1140', name: 'Bank Mandiri', label: '1140 - Bank Mandiri' },
    ];
  }, [showPaymentModal]);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Three-dot and accounting modal states
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showSingleDeleteModal, setShowSingleDeleteModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Import CSV States & Functions
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);
  const [quickPreviewInvoice, setQuickPreviewInvoice] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Add Partner Modal States
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [addPartnerCategory, setAddPartnerCategory] = useState<'Customer' | 'Distributor'>('Customer');
  const [addPartnerName, setAddPartnerName] = useState('');
  const [addPartnerNumber, setAddPartnerNumber] = useState('');
  const [addPartnerPic, setAddPartnerPic] = useState('');
  const [addPartnerSalutation, setAddPartnerSalutation] = useState('Salutation');
  const [addPartnerPhone, setAddPartnerPhone] = useState('');
  const [addPartnerEmail, setAddPartnerEmail] = useState('');
  const [addPartnerAddress, setAddPartnerAddress] = useState('');
  const [addPartnerBalance, setAddPartnerBalance] = useState('0');
  const [addPartnerNpwp, setAddPartnerNpwp] = useState('');
  const [addPartnerStatus, setAddPartnerStatus] = useState<'Active' | 'Inactive'>('Active');
  const [addPartnerImage, setAddPartnerImage] = useState('');

  // Quick Add Product Modal States
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [modalTargetRowIdx, setModalTargetRowIdx] = useState<number | null>(null);
  const [addProductName, setAddProductName] = useState('');
  const [addProductCategory, setAddProductCategory] = useState('Skincare');
  const [addProductBrand, setAddProductBrand] = useState('Serene');
  const [addProductSku, setAddProductSku] = useState('');
  const [addProductUnit, setAddProductUnit] = useState('Pcs');
  const [addProductPrice, setAddProductPrice] = useState('100000');
  const [addProductSellPrice, setAddProductSellPrice] = useState('150000');
  const [addProductStock, setAddProductStock] = useState('100');
  const [addProductMinStock, setAddProductMinStock] = useState('10');
  const [addProductImage, setAddProductImage] = useState('');

  // Product Modal Dropdown States
  const [showProdCategoryDropdown, setShowProdCategoryDropdown] = useState(false);
  const [showProdBrandDropdown, setShowProdBrandDropdown] = useState(false);
  const [prodCategorySearch, setProdCategorySearch] = useState('');
  const [prodBrandSearch, setProdBrandSearch] = useState('');
  const [isAddingProdCategory, setIsAddingProdCategory] = useState(false);
  const [newProdCategoryInput, setNewProdCategoryInput] = useState('');
  const [isAddingProdBrand, setIsAddingProdBrand] = useState(false);
  const [newProdBrandInput, setNewProdBrandInput] = useState('');
  const [customCategoryList, setCustomCategoryList] = useState<string[]>([]);
  const [customBrandList, setCustomBrandList] = useState<string[]>([]);

  const getProductCategories = () => {
    const defaultCats = ['Skincare', 'Makeup', 'Haircare', 'Bodycare'];
    const storedProds = getStoredProducts();
    const setCats = new Set([...defaultCats, ...customCategoryList]);
    storedProds.forEach(p => { if (p.category) setCats.add(p.category); });
    return Array.from(setCats);
  };

  const getProductBrands = () => {
    const defaultBrands = ['Serene', "L'Oreal", 'Innisfree', 'Somethinc', 'The Ordinary'];
    const storedProds = getStoredProducts();
    const setBrands = new Set([...defaultBrands, ...customBrandList]);
    storedProds.forEach(p => { if (p.brand) setBrands.add(p.brand); });
    return Array.from(setBrands);
  };

  const handleSaveNewPartner = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameTrimmed = addPartnerName.trim();
    if (!nameTrimmed) return;

    const currentPartners = getStoredPartners();
    const settings = getIdPrefixSettings();
    const prefix = addPartnerCategory === 'Customer' ? (settings.customerPrefix || 'CSTMR-') : (settings.distributorPrefix || 'DIST-');
    const newId = addPartnerNumber.trim() || getNextId(currentPartners, prefix);
    const salutationPrefix = addPartnerSalutation && addPartnerSalutation !== 'Sapaan' && addPartnerSalutation !== 'Salutation' ? `${addPartnerSalutation} ` : '';
    const finalPic = `${salutationPrefix}${addPartnerPic}`.trim() || '-';

    const newPartner: any = {
      id: newId,
      name: nameTrimmed,
      category: addPartnerCategory,
      pic: finalPic,
      email: addPartnerEmail.trim() || '-',
      phone: addPartnerPhone.trim() || '-',
      address: addPartnerAddress.trim() || '-',
      balance: Number(addPartnerBalance || 0),
      status: addPartnerStatus,
      npwp: addPartnerNpwp.trim() || '-',
      image: addPartnerImage || '',
      avatar: addPartnerImage || ''
    };

    const updated = [newPartner, ...currentPartners];
    savePartners(updated);

    // Auto select this new partner in the form
    setVendorId(nameTrimmed);

    setShowAddPartnerModal(false);
    setAddPartnerName('');
    setAddPartnerNumber('');
    setAddPartnerPic('');
    setAddPartnerPhone('');
    setAddPartnerEmail('');
    setAddPartnerAddress('');
    setAddPartnerBalance('0');
    setAddPartnerNpwp('');
    setAddPartnerImage('');
  };

  const handleSaveNewProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prodNameTrimmed = addProductName.trim();
    if (!prodNameTrimmed) return;

    const currentProducts = getStoredProducts();
    const prefix = getIdPrefixSettings().productPrefix || 'PRD-';
    const stockNum = Number(addProductStock) || 0;
    const minStockNum = Number(addProductMinStock) || 10;

    const newProduct: any = {
      id: `${prefix}${String(currentProducts.length + 1).padStart(3, '0')}`,
      name: prodNameTrimmed,
      category: addProductCategory || 'Skincare',
      brand: addProductBrand || 'Serene',
      sku: addProductSku || `SKU/${Math.floor(10000 + Math.random() * 90000)}`,
      stock: stockNum,
      price: Number(addProductPrice) || 0,
      sellPrice: Number(addProductSellPrice) || 0,
      hop: Number(addProductPrice) || 0,
      weight: '',
      image: addProductImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=100&q=80',
      minStock: minStockNum,
      status: stockNum === 0 ? 'Out of Stock' : stockNum <= minStockNum ? 'Low Stock' : 'In Stock'
    };

    const updated = [newProduct, ...currentProducts];
    saveProducts(updated);

    // Auto select this new product in row if target row is set
    if (modalTargetRowIdx !== null && modalTargetRowIdx >= 0) {
      setFormLineItems(prev => {
        const updatedItems = [...prev];
        if (updatedItems[modalTargetRowIdx]) {
          updatedItems[modalTargetRowIdx] = {
            ...updatedItems[modalTargetRowIdx],
            productId: newProduct.id,
            description: newProduct.name,
            price: isSales ? newProduct.sellPrice : newProduct.price,
          };
        }
        return updatedItems;
      });
    }

    setShowAddProductModal(false);
    setAddProductName('');
    setAddProductSku('');
    setAddProductPrice('100000');
    setAddProductSellPrice('150000');
    setAddProductStock('100');
    setAddProductMinStock('10');
    setAddProductImage('');
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const hoverTimerRef = React.useRef<any>(null);

  const handleMouseEnterId = (invoice: any) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setQuickPreviewInvoice(invoice);
    }, 3000);
  };

  const handleMouseLeaveId = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const downloadCSVTemplate = () => {
    const company = getCompanySettings();
    const mainColHeader = isSales ? "Customer" : "Distributor";
    const samplePartner = isSales ? company.companyName : "Nexus CRM Inc.";
    const headers = `${mainColHeader},Reference,Document_Type,Product_Name,Quantity,Unit,Discount,Tax,Unit_Price\n`;
    const row1 = `"${samplePartner}",${company.companyName} Integration,Invoice,Enterprise Core Integration,1,Pcs,0%,PPN 11%,30000\n`;
    const row2 = `"${samplePartner}",${company.companyName} Integration,Invoice,Technical Support,10,Pcs,0%,PPN 11%,450`;
    const csvContent = headers + row1 + row2;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `template_${isSales ? 'sales' : 'purchase'}_invoice.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return {
        success: false,
        error: "CSV file is empty or only contains headers."
      };
    }

    const products = getStoredProducts();
    const items: any[] = [];
    let expectedDistributor = '';
    let expectedReference = '';
    let expectedDocType = '';
    const mainColHeader = isSales ? "Customer" : "Distributor";

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0 || cols.every(c => c === '')) continue;

      if (cols.length < 9) {
        return {
          success: false,
          error: `Incomplete columns on Row ${i + 1}. Template requires 9 columns: ${mainColHeader}, Reference, Document_Type, Product_Name, Quantity, Unit, Discount, Tax, Unit_Price.`
        };
      }

      const distributor = cols[0];
      const reference = cols[1];
      const docType = cols[2];
      const prodName = cols[3];
      const qtyStr = cols[4];
      const unit = cols[5];
      const discount = cols[6];
      const tax = cols[7];
      const priceStr = cols[8];

      // 1. Validate Distributor/Customer
      if (!distributor) {
        return {
          success: false,
          error: `Row ${i + 1}: ${mainColHeader} cannot be empty.`
        };
      }
      if (!expectedDistributor) {
        expectedDistributor = distributor;
      } else if (distributor.toLowerCase() !== expectedDistributor.toLowerCase()) {
        return {
          success: false,
          error: `Row ${i + 1}: ${mainColHeader} names must be uniform. Current row uses "${distributor}", while previous row used "${expectedDistributor}".`
        };
      }

      // 2. Validate Reference
      if (!reference) {
        return {
          success: false,
          error: `Row ${i + 1}: Reference cannot be empty.`
        };
      }
      if (!expectedReference) {
        expectedReference = reference;
      } else if (reference.toLowerCase() !== expectedReference.toLowerCase()) {
        return {
          success: false,
          error: `Row ${i + 1}: Reference must be uniform. Current row uses "${reference}", while previous row used "${expectedReference}".`
        };
      }

      // 3. Validate Document_Type
      if (!docType) {
        return {
          success: false,
          error: `Row ${i + 1}: Document Type cannot be empty.`
        };
      }
      const allowedDocTypes = ['Invoice', 'Quotation', 'Delivery', 'Return'];
      const matchedDocType = allowedDocTypes.find(t => t.toLowerCase() === docType.toLowerCase()) || docType;
      
      if (!expectedDocType) {
        expectedDocType = matchedDocType;
      } else if (matchedDocType.toLowerCase() !== expectedDocType.toLowerCase()) {
        return {
          success: false,
          error: `Row ${i + 1}: Document Type must be uniform. Current row uses "${docType}", while previous row used "${expectedDocType}".`
        };
      }

      // 4. Validate Product_Name
      if (!prodName) {
        return {
          success: false,
          error: `Row ${i + 1}: Product Name cannot be empty.`
        };
      }
      const matchedProd = products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
      if (!matchedProd) {
        return {
          success: false,
          error: `Row ${i + 1}: Product "${prodName}" not found. Please register it in the Inventory menu first.`
        };
      }

      const qty = parseInt(qtyStr.replace(/[^0-9]+/g, '')) || 1;
      const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, '')) || 0;

      items.push({
        productId: matchedProd.id,
        name: matchedProd.name,
        description: matchedProd.name,
        qty: qty,
        unit: unit || 'Pcs',
        discount: discount || '0%',
        price: price,
        tax: tax || 'Tanpa Pajak'
      });
    }

    return {
      success: true,
      data: {
        supplierName: expectedDistributor,
        ref: expectedReference,
        docType: expectedDocType,
        items
      }
    };
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseCSV(text);
      if (!result.success) {
        setImportError(result.error || 'Failed to parse CSV');
      } else {
        const parsed = result.data;
        if (parsed) {
          if (parsed.docType) setNewType(parsed.docType as any);
          
          setInvoiceNo(getNextInvoiceNo(parsed.docType || 'Invoice', isSales, invoices));

          if (parsed.supplierName) setVendorId(parsed.supplierName);
          if (parsed.ref) setRefStr(parsed.ref);
          
          setTransDate('2026-07-20');
          setDueDateStr('2026-08-20');
          setPaymentTerm('Net 30');

          if (parsed.items && Array.isArray(parsed.items)) {
            setFormLineItems(parsed.items.map((item: any, idx: number) => ({
              id: String(idx + 1),
              productId: item.productId || '',
              description: item.description || item.name || '',
              qty: item.qty || 1,
              unit: item.unit || 'Pcs',
              discount: item.discount || '0%',
              price: item.price || 0,
              tax: item.tax || 'Tanpa Pajak'
            })));
          }

          setView('create');
          setShowImportModal(false);
          setImportError(null);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [vendorId, setVendorId] = useState('');
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const [activeProductDropdownIdx, setActiveProductDropdownIdx] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [activeTaxDropdownIdx, setActiveTaxDropdownIdx] = useState<number | null>(null);
  const [taxDropdownCoords, setTaxDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showDocTypeDropdown, setShowDocTypeDropdown] = useState(false);
  const [docTypeDropdownCoords, setDocTypeDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [activeUnitDropdownIdx, setActiveUnitDropdownIdx] = useState<number | null>(null);
  const [unitDropdownCoords, setUnitDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  React.useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeProductDropdownIdx !== null) {
        setActiveProductDropdownIdx(null);
      }
      if (activeTaxDropdownIdx !== null) {
        setActiveTaxDropdownIdx(null);
      }
      if (showDocTypeDropdown) {
        setShowDocTypeDropdown(false);
      }
      if (activeUnitDropdownIdx !== null) {
        setActiveUnitDropdownIdx(null);
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeProductDropdownIdx, activeTaxDropdownIdx, showDocTypeDropdown, activeUnitDropdownIdx]);
  const [showTransDateCalendar, setShowTransDateCalendar] = useState(false);
  const [showDueDateCalendar, setShowDueDateCalendar] = useState(false);
  const [transDateViewDate, setTransDateViewDate] = useState<Date>(new Date(2026, 6, 12));
  const [dueDateViewDate, setDueDateViewDate] = useState<Date>(new Date(2026, 7, 11));
  const [transDate, setTransDate] = useState('2026-07-12');
  const [dueDateStr, setDueDateStr] = useState('2026-08-11');
  const [refStr, setRefStr] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('Net 30');
  const [tagStr, setTagStr] = useState('');

  React.useEffect(() => {
    if (paymentTerm === 'Custom') return;
    
    const parts = transDate.split('-');
    if (parts.length !== 3) return;
    const tDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    
    let daysToAdd = 0;
    if (paymentTerm === 'Net 15') daysToAdd = 15;
    else if (paymentTerm === 'Net 30') daysToAdd = 30;
    else if (paymentTerm === 'Net 45') daysToAdd = 45;
    else if (paymentTerm === 'Net 60') daysToAdd = 60;
    else if (paymentTerm === 'COD') daysToAdd = 0;
    
    const dDate = new Date(tDate);
    dDate.setDate(dDate.getDate() + daysToAdd);
    
    const yyyy = dDate.getFullYear();
    const mm = String(dDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dDate.getDate()).padStart(2, '0');
    setDueDateStr(`${yyyy}-${mm}-${dd}`);
  }, [paymentTerm, transDate]);

  React.useEffect(() => {
    if (isSales) return;
    const importedData = sessionStorage.getItem('imported_purchase_invoice');
    if (importedData) {
      try {
        const parsed = JSON.parse(importedData);
        sessionStorage.removeItem('imported_purchase_invoice');
        
        if (parsed) {
          if (parsed.docType) setNewType(parsed.docType);
          
          setInvoiceNo(getNextInvoiceNo(parsed.docType || 'Invoice', isSales, invoices));

          if (parsed.supplierName) setVendorId(parsed.supplierName);
          if (parsed.ref) setRefStr(parsed.ref);
          
          // Use current local date from metadata (2026-07-20)
          setTransDate('2026-07-20');
          setDueDateStr('2026-08-20');
          setPaymentTerm('Net 30');

          if (parsed.items && Array.isArray(parsed.items)) {
            setFormLineItems(parsed.items.map((item: any, idx: number) => ({
              id: String(idx + 1),
              productId: item.productId || '',
              description: item.description || item.name || '',
              qty: item.qty || 1,
              unit: item.unit || 'Pcs',
              discount: item.discount || '0%',
              price: item.price || 0,
              tax: item.tax || 'Tanpa Pajak'
            })));
          }

          setView('create');
        }
      } catch (err) {
        console.error('Error loading imported invoice:', err);
      }
    }
  }, [isSales]);
  const [showShippingInfo, setShowShippingInfo] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleNoStr, setVehicleNoStr] = useState('');
  const [barcodeScan, setBarcodeScan] = useState('');
  const [autoAddRow, setAutoAddRow] = useState(false);
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const [messageNotes, setMessageNotes] = useState('');
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);

  // Additional fees and modifiers
  const [addDiscount, setAddDiscount] = useState<number>(0);
  const [addDiscountType, setAddDiscountType] = useState<'Rp'|'%'>('Rp');
  const [shipFee, setShipFee] = useState<number>(0);
  const [shipFeeType, setShipFeeType] = useState<'Rp'|'%'>('Rp');
  const [txnFee, setTxnFee] = useState<number>(0);
  const [txnFeeType, setTxnFeeType] = useState<'Rp'|'%'>('Rp');
  const [withholdingTax, setWithholdingTax] = useState<number>(0);
  const [withholdingTaxType, setWithholdingTaxType] = useState<'Rp'|'%'>('Rp');

  const [showAddDiscountInput, setShowAddDiscountInput] = useState(false);
  const [showShipFeeInput, setShowShipFeeInput] = useState(false);
  const [showTxnFeeInput, setShowTxnFeeInput] = useState(false);
  const [showWithholdingInput, setShowWithholdingInput] = useState(false);

  // Line items state
  interface FormLineItem {
    id: string;
    productId: string;
    description: string;
    qty: number;
    unit: string;
    discount: string;
    price: number;
    tax: string;
  }
  const [formLineItems, setFormLineItems] = useState<FormLineItem[]>([
    { id: '1', productId: '', description: '', qty: 1, unit: 'Pcs', discount: '0%', price: 0, tax: 'Tanpa Pajak' }
  ]);
  const getLineItemTotal = (item: FormLineItem) => {
    const basicAmount = (item.qty || 0) * (item.price || 0);
    let discVal = 0;
    if (item.discount) {
      if (item.discount.endsWith('%')) {
        const pct = parseFloat(item.discount.replace('%', '')) || 0;
        discVal = (basicAmount * pct) / 100;
      } else {
        discVal = parseFloat(item.discount) || 0;
      }
    }
    const afterDisc = Math.max(0, basicAmount - discVal);
    
    if (isTaxEnabled && item.tax === 'PPN 11%') {
      return afterDisc * 1.11;
    }
    return afterDisc;
  };

  const calculateSubTotal = () => {
    return formLineItems.reduce((sum, item) => sum + getLineItemTotal(item), 0);
  };

  const calculateGrandTotal = () => {
    const subTotal = calculateSubTotal();
    const calcVal = (val: number, type: 'Rp' | '%') => type === '%' ? (subTotal * val / 100) : val;
    const total = subTotal - calcVal(addDiscount, addDiscountType) + calcVal(shipFee, shipFeeType) + calcVal(txnFee, txnFeeType) - calcVal(withholdingTax, withholdingTaxType);
    return Math.max(0, total);
  };

  const saveTransaction = (isDraft: boolean = false, customDebit?: string, customCredit?: string) => {
    setAttemptedSave(!isDraft);
    const hasValidItems = formLineItems.some(item => item.productId);

    if (!isDraft && (!vendorId || !hasValidItems)) {
      let errMsg = '';
      if (!vendorId && !hasValidItems) {
        errMsg = `Please select a ${isSales ? 'Customer' : 'Distributor'} and at least one Product first.`;
      } else if (!vendorId) {
        errMsg = `Please select a ${isSales ? 'Customer' : 'Distributor'} first.`;
      } else {
        errMsg = `Please select at least one Product first.`;
      }
      alert(errMsg);
      return false;
    }

    const grandTotal = calculateGrandTotal();

    const reformatDate = (dStr: string) => {
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return '12/07/2026';
    };

    const savedItems = formLineItems
      .filter(item => item.productId || isDraft)
      .map(item => {
        const prod = getStoredProducts().find(p => p.id === item.productId);
        return {
          productId: item.productId || 'DRAFT_PROD',
          name: prod ? prod.name : item.description || 'Draft Item',
          qty: item.qty || 1,
          price: item.price || 0
        };
      });

    const chosenDebit = customDebit || saveDebitAccount || (isSales ? '1200 - Piutang Usaha' : '5100 - Harga Pokok Penjualan');
    const chosenCredit = customCredit || saveCreditAccount || (isSales ? '4100 - Penjualan Produk' : '2100 - Utang Usaha');

    const nowLogTime = formatLogTimestamp();

    const newInv: InvoiceItem = {
      id: invoiceNo || getNextInvoiceNo(newType, isSales, invoices),
      partnerName: vendorId || 'Draft Partner',
      ref: refStr,
      date: transDate ? reformatDate(transDate) : new Date().toLocaleDateString('en-US'),
      due: dueDateStr ? reformatDate(dueDateStr) : new Date().toLocaleDateString('en-US'),
      type: newType,
      status: isDraft ? 'Draft' : newType === 'Invoice' ? 'Unpaid' : newType === 'Quotation' ? 'Approved' : 'Completed',
      remaining: (newType === 'Invoice' || isDraft) ? grandTotal : 0,
      total: grandTotal,
      isSales,
      items: savedItems,
      driver: driverName,
      vehicleNo: vehicleNoStr,
      customDebitAccount: chosenDebit,
      customCreditAccount: chosenCredit,
      createdAt: nowLogTime,
      createdBy: 'Admin',
      updatedAt: nowLogTime,
      updatedBy: 'Admin',
      logs: [
        {
          id: 'log-create-' + Date.now(),
          type: 'created',
          title: 'Surat Dibuat',
          user: 'Admin',
          timestamp: nowLogTime,
          details: `Surat ini dibuat oleh Admin pada ${nowLogTime}`
        }
      ]
    };

    if (editingInvoiceId) {
      const oldInv = invoices.find(i => i.id === editingInvoiceId);
      if (oldInv) {
        const totalDiff = grandTotal - oldInv.total;
        const newRemaining = Math.max(0, oldInv.remaining + totalDiff);
        let newStatus = oldInv.status;
        if (!isDraft) {
           if (newType === 'Invoice') {
              if (newRemaining === 0) newStatus = 'Paid';
              else if (newRemaining < grandTotal) newStatus = 'Partially Paid';
              else newStatus = 'Unpaid';
           }
        } else {
           newStatus = 'Draft';
        }

        const existingLogs = oldInv.logs && oldInv.logs.length > 0 ? oldInv.logs : getInvoiceLogs(oldInv);
        const updateLog: DocumentActivityLog = {
          id: 'log-update-' + Date.now(),
          type: 'updated',
          title: 'Surat Diupdate',
          user: 'Admin',
          timestamp: nowLogTime,
          details: `Diupdate oleh Admin pada ${nowLogTime}`
        };

        const updated: InvoiceItem = { 
          ...newInv, 
          id: oldInv.id, 
          status: newStatus, 
          remaining: newRemaining,
          customDebitAccount: chosenDebit,
          customCreditAccount: chosenCredit,
          createdAt: oldInv.createdAt || oldInv.date,
          createdBy: oldInv.createdBy || 'Admin',
          updatedAt: nowLogTime,
          updatedBy: 'Admin',
          paidAt: oldInv.paidAt,
          paidBy: oldInv.paidBy,
          logs: [...existingLogs, updateLog]
        };
        updateInvoice(updated, oldInv);
      }
    } else {
      registerNewInvoice(newInv);
      setEditingInvoiceId(newInv.id);
    }
    setInvoices(getStoredInvoices());
    alert(isDraft ? 'Draft saved successfully.' : 'Transaction saved successfully.');
    return true;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesTab = invoice.type === activeTab && 
                       (invoice.isSales === undefined ? !isSales : invoice.isSales === isSales);
    if (!matchesTab) return false;

    if (statusFilter) {
      if (invoice.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    if (partnerFilter) {
      const partnerName = invoice.partnerName || invoice.distributor || '';
      if (partnerName !== partnerFilter) return false;
    }

    const parseNumeric = (val: any) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return parseFloat(String(val).replace(/\./g, '').replace(/,/g, '.')) || 0;
    };

    if (minAmountFilter) {
      const minVal = parseFloat(minAmountFilter.replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(minVal) && parseNumeric(invoice.total) < minVal) return false;
    }

    if (maxAmountFilter) {
      const maxVal = parseFloat(maxAmountFilter.replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(maxVal) && parseNumeric(invoice.total) > maxVal) return false;
    }

    try {
      const d = parseDateStr(invoice.date);
      const rStart = new Date(rangeStart);
      rStart.setHours(0, 0, 0, 0);
      const rEnd = new Date(rangeEnd);
      rEnd.setHours(23, 59, 59, 999);
      if (d < rStart || d > rEnd) {
        return false;
      }
    } catch (e) {
      // Ignore
    }

    const effectiveQuery = (localSearch || searchQuery).toLowerCase();
    if (!effectiveQuery) return true;

    const partnerName = invoice.partnerName || invoice.distributor || '';
    const ref = invoice.ref || '';
    const invoiceId = invoice.id || '';
    return (
      invoiceId.toLowerCase().includes(effectiveQuery) ||
      partnerName.toLowerCase().includes(effectiveQuery) ||
      ref.toLowerCase().includes(effectiveQuery)
    );
  });

  const visibleInvoices = [...filteredInvoices].sort((a, b) => {
    const parseNumeric = (val: any) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return parseFloat(String(val).replace(/\./g, '').replace(/,/g, '.')) || 0;
    };

    if (sortFilter === 'A-Z') {
      const nameA = (a.partnerName || a.distributor || a.id || '').toLowerCase();
      const nameB = (b.partnerName || b.distributor || b.id || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortFilter === 'Z-A') {
      const nameA = (a.partnerName || a.distributor || a.id || '').toLowerCase();
      const nameB = (b.partnerName || b.distributor || b.id || '').toLowerCase();
      return nameB.localeCompare(nameA);
    }
    if (sortFilter === 'Highest') {
      return parseNumeric(b.total) - parseNumeric(a.total);
    }
    if (sortFilter === 'Lowest') {
      return parseNumeric(a.total) - parseNumeric(b.total);
    }
    if (sortFilter === 'Newest') {
      try {
        return parseDateStr(b.date).getTime() - parseDateStr(a.date).getTime();
      } catch (e) { return 0; }
    }
    if (sortFilter === 'Oldest') {
      try {
        return parseDateStr(a.date).getTime() - parseDateStr(b.date).getTime();
      } catch (e) { return 0; }
    }
    return 0;
  });

  const handlePaymentBankChange = (newBankAccLabel: string) => {
    setPaymentBank(newBankAccLabel);
    if (isSales) {
      setPaymentDebitAccount(newBankAccLabel);
      setPaymentCreditAccount('1200 - Piutang Usaha');
    } else {
      setPaymentDebitAccount('2100 - Utang Usaha');
      setPaymentCreditAccount(newBankAccLabel);
    }
  };

  const openPaymentModal = (invs: any[]) => {
    const totalRemaining = invs.reduce((sum, i) => sum + i.remaining, 0);
    setPaymentInvoices(invs);
    setPaymentAmount(totalRemaining);
    
    const defaultAccLabel = paymentBankAccounts[0]?.label || '1130 - Bank BCA';
    setPaymentBank(defaultAccLabel);

    if (isSales) {
      setPaymentDebitAccount(defaultAccLabel);
      setPaymentCreditAccount('1200 - Piutang Usaha');
    } else {
      setPaymentDebitAccount('2100 - Utang Usaha');
      setPaymentCreditAccount(defaultAccLabel);
    }

    setShowPaymentModal(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const totalRemaining = paymentInvoices.reduce((sum, i) => sum + i.remaining, 0);
    if (paymentAmount <= 0 || paymentAmount > totalRemaining) {
      return;
    }
    let remainingPayment = paymentAmount;
    
    const nowLogTime = formatLogTimestamp();
    const currentUser = 'Admin (Finance)';

    // Sort invoices by due date or just iterate
    const updatedInvoices = invoices.map(inv => {
      const payingInv = paymentInvoices.find(p => p.id === inv.id);
      if (payingInv && remainingPayment > 0) {
        const payAmount = Math.min(inv.remaining, remainingPayment);
        const newRemaining = inv.remaining - payAmount;
        let newStatus = inv.status;
        if (newRemaining <= 0) newStatus = 'Paid';
        else if (newRemaining < inv.total) newStatus = 'Partially Paid';
        
        remainingPayment -= payAmount;

        const existingLogs = inv.logs && inv.logs.length > 0 ? inv.logs : getInvoiceLogs(inv);
        const payLog: DocumentActivityLog = {
          id: 'log-pay-' + Date.now() + '-' + inv.id,
          type: 'paid',
          title: 'Surat Dibayar',
          user: currentUser,
          timestamp: nowLogTime,
          details: `Dibayar oleh ${currentUser} sebesar ${formatAmount(payAmount)} pada ${nowLogTime} via ${paymentBank || 'Transfer Bank'}`
        };

        const updatedInv: InvoiceItem = { 
          ...inv, 
          remaining: newRemaining, 
          status: newStatus, 
          paymentBank: paymentBank,
          paidAt: nowLogTime,
          paidBy: currentUser,
          updatedAt: nowLogTime,
          updatedBy: currentUser,
          customPaymentDebitAccount: paymentDebitAccount,
          customPaymentCreditAccount: paymentCreditAccount,
          logs: [...existingLogs, payLog]
        };
        
        // Also update local storage and the central accounting ledger
        updateInvoice(updatedInv, inv);

        return updatedInv;
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    
    // If in edit view, exit back to list to reflect changes
    if (editingInvoiceId) {
       setView('list');
       setEditingInvoiceId(null);
    }
    
    setShowPaymentModal(false);
  };

  const handleDeleteSelected = () => {
    const updatedInvoices = invoices.filter(inv => !selectedIds.includes(inv.id));
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);
    setSelectedIds([]);
    setShowDeleteModal(false);
  };

  const handleBulkConvert = (targetType: 'Delivery' | 'Invoice') => {
    const selectedDocs = invoices.filter(inv => selectedIds.includes(inv.id));
    if (selectedDocs.length === 0) return;
    
    selectedDocs.forEach(doc => {
      const prefix = targetType === 'Invoice' ? (isSales ? 'INV-SLS-' : 'INV-RK-') : (isSales ? 'SJM-SLS-' : 'SJM-RK-');
      const randNum = Math.floor(100 + Math.random() * 900);
      const newId = `${prefix}${randNum}`;
      
      const newDoc = {
        ...doc,
        id: newId,
        type: targetType,
        status: targetType === 'Invoice' ? 'Unpaid' : 'Completed',
        remaining: targetType === 'Invoice' ? doc.total : 0,
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      };
      
      updateInvoice(newDoc, doc);
    });

    setInvoices(getStoredInvoices());
    setSelectedIds([]);
  };

  const handleSingleConvert = (doc: any, targetType: 'Delivery' | 'Invoice') => {
    const prefix = targetType === 'Invoice' ? (isSales ? 'INV-SLS-' : 'INV-RK-') : (isSales ? 'SJM-SLS-' : 'SJM-RK-');
    const randNum = Math.floor(100 + Math.random() * 900);
    const newId = `${prefix}${randNum}`;
    
    const partnerName = doc.partnerName || doc.distributor || 'General Partner';
    const newDoc = {
      ...doc,
      id: newId,
      partnerName,
      type: targetType,
      status: targetType === 'Invoice' ? 'Unpaid' : 'Completed',
      remaining: targetType === 'Invoice' ? doc.total : 0,
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    };
    
    updateInvoice(newDoc, doc);
    setInvoices(getStoredInvoices());
  };

  const handleDeleteSingle = () => {
    if (editingInvoiceId) {
      const updatedInvoices = invoices.filter(inv => inv.id !== editingInvoiceId);
      setInvoices(updatedInvoices);
      saveInvoices(updatedInvoices);
      setEditingInvoiceId(null);
      setView('list');
      setShowSingleDeleteModal(false);
    }
  };

  const handleEditInvoice = (invoice: any) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setQuickPreviewInvoice(null);
    setEditingInvoiceId(invoice.id);
    setNewType(invoice.type as any);
    setVendorId(invoice.partnerName);
    
    const parseDDMMYYYY = (dateStr: string) => {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return '2026-07-12';
    };
    
    setTransDate(parseDDMMYYYY(invoice.date));
    setDueDateStr(parseDDMMYYYY(invoice.due));
    setRefStr(invoice.ref || '');
    setDriverName(invoice.driver || '');
    setVehicleNoStr(invoice.vehicleNo || invoice.plateNo || '');
    setInvoiceNo(invoice.id);
    
    if (invoice.items && invoice.items.length > 0) {
      setFormLineItems(invoice.items.map((item: any, idx: number) => ({
        id: String(idx + 1),
        productId: item.productId,
        description: item.name,
        qty: item.qty,
        unit: 'Pcs',
        discount: '0%',
        price: item.price,
        tax: 'Tanpa Pajak'
      })));
    } else {
      setFormLineItems([{ id: '1', productId: '', description: '', qty: 1, unit: 'Pcs', discount: '0%', price: 0, tax: 'Tanpa Pajak' }]);
    }
    
    setIsFormEditable(false);
    setView('create');
  };

  const handleAddInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName) return;

    const matchedProd = getStoredProducts().find(p => p.id === newSelectedProductId);
    const lineTotal = Number(newQty) * Number(newPrice);
    const invoiceId = getNextInvoiceNo(newType, isSales, invoices);

    // convert YYYY-MM-DD to DD/MM/YYYY
    const formatDateObj = (str: string) => {
      const parts = str.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return '09/07/2026';
    };

    const newInv = {
      id: invoiceId,
      partnerName: newPartnerName,
      ref: newRef,
      date: formatDateObj(newDate),
      due: formatDateObj(newDue),
      type: newType,
      status: newStatus,
      remaining: newStatus === 'Paid' ? 0 : lineTotal,
      total: lineTotal,
      isSales,
      customDebitAccount: saveDebitAccount || (isSales ? '1200 - Piutang Usaha' : '5100 - Harga Pokok Penjualan'),
      customCreditAccount: saveCreditAccount || (isSales ? '4100 - Penjualan Produk' : '2100 - Utang Usaha'),
      items: matchedProd ? [{
        productId: matchedProd.id,
        name: matchedProd.name,
        qty: Number(newQty),
        price: Number(newPrice)
      }] : []
    };

    registerNewInvoice(newInv);
    
    // Refresh local invoices state
    setInvoices(getStoredInvoices());
    setShowAddModal(false);

    // Reset fields
    setNewPartnerName('');
    setNewRef('');
    setNewSelectedProductId('');
    setNewQty('10');
    setNewPrice('150000');
  };

  const toggleSelectAll = () => {
    const visibleIds = visibleInvoices.map(inv => inv.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds([...new Set([...selectedIds, ...visibleIds])]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedPreset(''); // clear preset
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (date < tempStart) {
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      setRangeStart(tempStart);
      setRangeEnd(tempEnd);
    } else if (tempStart) {
      setRangeStart(tempStart);
      setRangeEnd(tempStart);
    }
    setShowDatePopup(false);
  };

  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);

    switch (preset) {
      case 'Today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'Yesterday':
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = new Date(start);
        break;
      case 'This week':
        const dayOfWeek = today.getDay();
        start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Sunday
        break;
      case 'Last week':
        const lastWeekToday = new Date(today);
        lastWeekToday.setDate(today.getDate() - 7);
        const lastWeekDayOfWeek = lastWeekToday.getDay();
        start = new Date(lastWeekToday);
        start.setDate(lastWeekToday.getDate() - lastWeekDayOfWeek + (lastWeekDayOfWeek === 0 ? -6 : 1));
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'This month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'Last month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'This year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'Last year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'All time':
        start = new Date(2024, 0, 1);
        end = new Date();
        break;
    }
    setTempStart(start);
    setTempEnd(end);
    
    // Adjust current view date to match the range start month
    setCurrentViewDate(new Date(start.getFullYear(), start.getMonth(), 1));
  };

  const renderCalendarMonth = (dateObj: Date, isLeft: boolean) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const grid = getMonthGrid(year, month);
    const monthName = getMonthName(dateObj);

    const isCellInRange = (d: Date) => {
      if (!tempStart) return false;
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const s = new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate()).getTime();
      if (!tempEnd) return target === s;
      const e = new Date(tempEnd.getFullYear(), tempEnd.getMonth(), tempEnd.getDate()).getTime();
      return target >= s && target <= e;
    };

    return (
      <div className="flex flex-col select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          {isLeft ? (
            <button 
              type="button"
              onClick={() => setCurrentViewDate(new Date(year, month - 1, 1))}
              className="p-1 text-white hover:text-gray-300 hover:bg-[#181C26] rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <span className="text-[13px] font-semibold text-white tracking-tight">
            {monthName} {year}
          </span>

          {!isLeft ? (
            <button 
              type="button"
              onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))}
              className="p-1 text-white hover:text-gray-300 hover:bg-[#181C26] rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-y-1 mb-2 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span key={day} className="text-[11px] font-medium text-[#808895]">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {grid.map((cell, idx) => {
            const isStart = tempStart && cell.date.toDateString() === tempStart.toDateString();
            const isEnd = tempEnd && cell.date.toDateString() === tempEnd.toDateString();
            const isBetween = tempStart && tempEnd && cell.date > tempStart && cell.date < tempEnd;
            const inRange = isStart || isEnd || isBetween;

            const col = idx % 7; // 0 = Mon, 6 = Sun
            const prevInRange = idx > 0 && isCellInRange(grid[idx - 1].date);
            const nextInRange = idx < grid.length - 1 && isCellInRange(grid[idx + 1].date);

            const isStripStart = inRange && (col === 0 || isStart || !prevInRange);
            const isStripEnd = inRange && (col === 6 || isEnd || !nextInRange);

            // Row strip wrapper styling
            let wrapperClass = "relative h-8 flex items-center justify-center my-[1px]";
            if (inRange) {
              wrapperClass += " bg-[#081B33]"; // Dark navy background from screenshot
              if (isStripStart && isStripEnd) {
                wrapperClass += " rounded-full";
              } else if (isStripStart) {
                wrapperClass += " rounded-l-full";
              } else if (isStripEnd) {
                wrapperClass += " rounded-r-full";
              }
            }

            let btnClass = "w-8 h-8 text-xs font-medium flex items-center justify-center rounded-full transition-all relative z-10 mx-auto";
            if (isStart || isEnd) {
              btnClass += " bg-[#EA580C] text-white font-bold shadow-md shadow-orange-500/20";
            } else if (isBetween) {
              btnClass += " text-white font-medium hover:bg-[#122F56] cursor-pointer";
            } else if (cell.isCurrent) {
              btnClass += " text-white hover:bg-[#181C24] cursor-pointer";
            } else {
              btnClass += " text-[#4A505B] hover:text-[#788090] cursor-pointer";
            }

            return (
              <div key={idx} className={wrapperClass}>
                <button 
                  type="button"
                  onClick={() => handleDayClick(cell.date)}
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

  const renderCreateView = () => {
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
        <div className="flex flex-col text-left">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewDate(new Date(year, month - 1, 1));
              }}
              className="p-1 text-[#909090] hover:text-white hover:bg-[#2A2A2E] rounded transition-colors"
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
              className="p-1 text-[#909090] hover:text-white hover:bg-[#2A2A2E] rounded transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-y-1 mb-1.5 text-center">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <span key={day} className="text-[9px] font-medium text-[#555] uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {grid.map((cell, idx) => {
              const isSelected = selectedDate && cell.date.toDateString() === selectedDate.toDateString();
              
              let btnClass = "w-6 h-6 text-[10.5px] flex items-center justify-center rounded-full transition-all relative z-10 mx-auto";
              if (isSelected) {
                btnClass += " bg-[#EA580C] text-white font-semibold shadow-sm";
              } else if (cell.isCurrent) {
                btnClass += " text-white hover:bg-[#2A2A2E] cursor-pointer";
              } else {
                btnClass += " text-[#4A4A4D] hover:text-[#777] cursor-pointer";
              }

              const isToday = cell.date.getFullYear() === 2026 && cell.date.getMonth() === 6 && cell.date.getDate() === 8;

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
                    {isToday && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#EA580C] rounded-full" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const handleProductChange = (index: number, prodId: string) => {
      const prod = getStoredProducts().find(p => p.id === prodId);
      const updated = [...formLineItems];
      updated[index].productId = prodId;
      if (prod) {
        updated[index].price = isSales ? prod.sellPrice : prod.price;
        updated[index].description = prod.name;
      } else {
        updated[index].price = 0;
        updated[index].description = '';
      }
      setFormLineItems(updated);
    };

    const handleQtyChange = (index: number, val: string) => {
      const qty = parseInt(val) || 0;
      const updated = [...formLineItems];
      updated[index].qty = qty;
      setFormLineItems(updated);
    };

    const handlePriceChange = (index: number, val: string) => {
      const price = parseFloat(val) || 0;
      const updated = [...formLineItems];
      updated[index].price = price;
      setFormLineItems(updated);
    };

    const handleDiscountChange = (index: number, val: string) => {
      const updated = [...formLineItems];
      updated[index].discount = val;
      setFormLineItems(updated);
    };

    const handleUnitChange = (index: number, val: string) => {
      const updated = [...formLineItems];
      updated[index].unit = val;
      setFormLineItems(updated);
    };

    const handleTaxChange = (index: number, val: string) => {
      const updated = [...formLineItems];
      updated[index].tax = val;
      setFormLineItems(updated);
    };

    const handleDescChange = (index: number, val: string) => {
      const updated = [...formLineItems];
      updated[index].description = val;
      setFormLineItems(updated);
    };

    const handleAddRow = () => {
      setFormLineItems([
        ...formLineItems,
        { id: String(Date.now()), productId: '', description: '', qty: 1, unit: 'Pcs', discount: '0%', price: 0, tax: 'Tanpa Pajak' }
      ]);
    };

    const handleRemoveRow = (index: number) => {
      if (formLineItems.length === 1) {
        setFormLineItems([
          { id: '1', productId: '', description: '', qty: 1, unit: 'Pcs', discount: '0%', price: 0, tax: 'Tanpa Pajak' }
        ]);
      } else {
        setFormLineItems(formLineItems.filter((_, i) => i !== index));
      }
    };

    const handleSaveTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      setAttemptedSave(true);
      const hasValidItems = formLineItems.some(item => item.productId);

      if (!vendorId || !hasValidItems) {
        let errMsg = '';
        if (!vendorId && !hasValidItems) {
          errMsg = `Please select a ${isSales ? 'Customer' : 'Distributor'} and at least one Product first.`;
        } else if (!vendorId) {
          errMsg = `Please select a ${isSales ? 'Customer' : 'Distributor'} first.`;
        } else {
          errMsg = `Please select at least one Product first.`;
        }
        alert(errMsg);
        return;
      }

      const currentInv = editingInvoiceId ? invoices.find(i => i.id === editingInvoiceId) : null;
      const chosenDebit = saveDebitAccount || currentInv?.customDebitAccount || (isSales ? '1200 - Piutang Usaha' : '5100 - Harga Pokok Penjualan');
      const chosenCredit = saveCreditAccount || currentInv?.customCreditAccount || (isSales ? '4100 - Penjualan Produk' : '2100 - Utang Usaha');

      if (saveTransaction(false, chosenDebit, chosenCredit)) {
        setIsFormEditable(false);
      }
    };

    const handleBackNavigation = () => {
      if (!editingInvoiceId) {
        setShowDiscardModal(true);
      } else {
        setView('list'); setEditingInvoiceId(null);
      }
    };

    const formatPreviewDate = (dateStr: string) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const day = parseInt(parts[2]);
        const monthIndex = parseInt(parts[1]) - 1;
        const year = parts[0];
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${day} ${months[monthIndex]}, ${year}`;
        }
      }
      return dateStr;
    };

    const handlePrintDocument = (docToPrint?: any) => {
      const company = getCompanySettings();
      const docId = docToPrint ? docToPrint.id : (invoiceNo || 'INV-2026-001');
      const reference = docToPrint ? (docToPrint.ref || '-') : (refStr || '-');
      const pName = docToPrint ? (docToPrint.partnerName || docToPrint.distributor || '-') : (vendorId || '-');
      const dType = docToPrint ? docToPrint.type : newType;
      const issueDate = docToPrint ? docToPrint.date : (transDate ? formatPreviewDate(transDate) : '-');
      const dueDate = docToPrint ? docToPrint.due : (dueDateStr ? formatPreviewDate(dueDateStr) : '-');
      const itemsList = docToPrint 
        ? (docToPrint.items || []) 
        : formLineItems.map(it => ({
            description: it.description || 'Custom Item',
            qty: it.qty || 1,
            price: it.price || 0
          }));
      const totalAmt = docToPrint ? (docToPrint.total || 0) : calculateGrandTotal();

      const partnerObj = getStoredPartners().find(p => p.name === pName);
      const pAddress = partnerObj?.address || 'Jl. Raya Utama No. 88, Jakarta';
      const pNpwp = partnerObj?.npwp && partnerObj.npwp !== '-' ? partnerObj.npwp : '';

      const docTypeName = dType === 'Quotation' ? 'PENAWARAN HARGA (QUOTATION)' :
                          dType === 'Delivery' ? 'SURAT JALAN (DELIVERY ORDER)' :
                          dType === 'Return' ? 'SURAT RETUR (RETURN NOTE)' :
                          (isSales ? 'FAKTUR PENJUALAN (SALES INVOICE)' : 'FAKTUR PEMBELIAN (PURCHASE INVOICE)');

      const printWindow = window.open('', '_blank', 'width=850,height=1100');
      if (!printWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Surat_${docId}_${reference.replace(/[^a-zA-Z0-9_-]/g, '_')}</title>
            <meta charset="utf-8" />
            <style>
              @page { size: A4; margin: 15mm 20mm 20mm 20mm; }
              body {
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                background: #ffffff;
                margin: 0;
                padding: 24px;
                font-size: 13px;
                line-height: 1.5;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 16px;
                margin-bottom: 20px;
              }
              .company-name {
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
              }
              .company-info {
                font-size: 11px;
                color: #64748b;
                margin-top: 4px;
              }
              .doc-title {
                text-align: right;
              }
              .doc-title h1 {
                font-size: 15px;
                font-weight: 800;
                margin: 0 0 6px 0;
                color: #ea580c;
                text-transform: uppercase;
              }
              .meta-table {
                margin-top: 4px;
                font-size: 11px;
                color: #334155;
              }
              .meta-table td {
                padding: 2px 4px;
              }
              .meta-label {
                font-weight: 600;
                color: #64748b;
              }
              .meta-value {
                font-weight: 700;
                color: #0f172a;
              }
              .ref-text {
                font-weight: 600;
                color: #0f172a;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 24px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 16px;
                border-radius: 8px;
              }
              .info-block p {
                margin: 2px 0;
              }
              .info-block .label {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                color: #64748b;
                margin-bottom: 4px;
              }
              table.items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
              }
              table.items-table th {
                background: #0f172a;
                color: #ffffff;
                font-size: 11px;
                text-transform: uppercase;
                padding: 10px 12px;
                text-align: left;
              }
              table.items-table td {
                border-bottom: 1px solid #e2e8f0;
                padding: 10px 12px;
                font-size: 12px;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .summary-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-top: 16px;
              }
              .notes-box {
                max-width: 350px;
                font-size: 11px;
                color: #64748b;
              }
              .total-box {
                width: 240px;
                font-size: 13px;
              }
              .total-row.grand {
                border-top: 2px solid #0f172a;
                font-weight: 800;
                font-size: 15px;
                color: #0f172a;
                padding-top: 8px;
                margin-top: 4px;
                display: flex;
                justify-content: space-between;
              }
              .signatures {
                margin-top: 48px;
                display: flex;
                justify-content: space-between;
                text-align: center;
              }
              .sig-box {
                width: 200px;
              }
              .sig-line {
                margin-top: 60px;
                border-top: 1px solid #0f172a;
                font-weight: 700;
                font-size: 12px;
                padding-top: 4px;
              }
              @media print {
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 16px; text-align: right;">
              <button onclick="window.print()" style="padding: 8px 20px; background: #ea580c; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                🖨️ Cetak / Simpan PDF
              </button>
            </div>

            <div class="header">
              <div>
                <div class="company-name">${company.companyName}</div>
                <div class="company-info">${company.companyAddress}</div>
                <div class="company-info">Email: ${company.companyEmail} | Telp: ${company.companyPhone}</div>
                ${company.taxId ? `<div class="company-info">NPWP Perusahaan: ${company.taxId}</div>` : ''}
              </div>
              <div class="doc-title">
                <h1>${docTypeName}</h1>
                <table class="meta-table">
                  <tr>
                    <td class="meta-label">No. Dokumen:</td>
                    <td class="meta-value">${docId}</td>
                  </tr>
                  <tr>
                    <td class="meta-label">No. Referensi:</td>
                    <td class="meta-value">${reference}</td>
                  </tr>
                  <tr>
                    <td class="meta-label">Tanggal Surat:</td>
                    <td class="meta-value">${issueDate}</td>
                  </tr>
                  ${dueDate ? `<tr><td class="meta-label">Jatuh Tempo:</td><td class="meta-value">${dueDate}</td></tr>` : ''}
                </table>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-block">
                <div class="label">${isSales ? 'Kepada (Customer / Pembeli):' : 'Dari (Distributor / Supplier):'}</div>
                <p style="font-weight: 800; font-size: 14px; color: #0f172a;">${pName}</p>
                <p>${pAddress}</p>
                ${pNpwp ? `<p style="font-family: monospace; font-size: 11px; color: #475569;">NPWP: ${pNpwp}</p>` : ''}
              </div>
              <div class="info-block">
                <div class="label">Informasi Transaksi:</div>
                <p><strong>Status Transaksi:</strong> ${docToPrint ? (docToPrint.status || 'Aktif') : 'Resmi Tercatat'}</p>
                <p style="font-size: 11px; color: #64748b; margin-top: 6px;">
                  Dokumen resmi ini diterbitkan secara elektronik dan mengikat sebagai bukti transaksi legal.
                </p>
              </div>
            </div>

            <div style="margin-bottom: 8px; font-size: 12px; color: #334155;">
              <span style="color: #64748b; font-weight: 500;">No. Referensi:</span> <span style="font-weight: 600; color: #0f172a;">${reference}</span>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px;" class="text-center">No</th>
                  <th>Deskripsi / Item Barang</th>
                  <th style="width: 80px;" class="text-center">Qty</th>
                  <th style="width: 140px;" class="text-right">Harga Satuan (Rp)</th>
                  <th style="width: 140px;" class="text-right">Total (Rp)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList.length > 0 ? itemsList.map((it: any, idx: number) => `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><strong>${it.description || it.name || it.productId || 'Item Baris'}</strong></td>
                    <td class="text-center">${it.qty || 1}</td>
                    <td class="text-right">${typeof it.price === 'number' ? it.price.toLocaleString('id-ID') : formatAmount(it.price || 0)}</td>
                    <td class="text-right">${typeof (it.qty * it.price) === 'number' ? ((it.qty || 1) * (it.price || 0)).toLocaleString('id-ID') : formatAmount((it.qty || 1) * (it.price || 0))}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="5" class="text-center" style="padding: 20px; color: #64748b;">
                      Detail transaksi tercatat resmi dalam sistem ERP.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>

            <div class="summary-container">
              <div class="notes-box">
                <p style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Catatan / Syarat Pembayaran:</p>
                <p>${messageNotes || 'Pembayaran dilakukan secara resmi sesuai termin yang disepakati.'}</p>
              </div>
              <div class="total-box">
                <div class="total-row grand">
                  <span>TOTAL DOKUMEN:</span>
                  <span>Rp ${typeof totalAmt === 'number' ? totalAmt.toLocaleString('id-ID') : totalAmt}</span>
                </div>
              </div>
            </div>

            <div class="signatures">
              <div class="sig-box">
                <p>Hormat Kami,</p>
                <div class="sig-line">${company.companyName}</div>
              </div>
              <div class="sig-box">
                <p>Diterima / Disetujui Oleh,</p>
                <div class="sig-line">${pName}</div>
              </div>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    };

    const renderInvoicePreview = () => {
      const company = getCompanySettings();
      const partners = getStoredPartners();
      const currentPartnerObj = partners.find(p => p.name === vendorId);
      const partnerEmail = currentPartnerObj?.email || '';
      const partnerAddress = currentPartnerObj?.address || (vendorId ? `Kawasan Industri ${vendorId}, Jl. Raya Utama No. 88, Jakarta` : 'Gedung Wisma Industri Lt. 3, Jakarta');

      const rawSubtotal = formLineItems.reduce((sum, item) => sum + ((item.qty || 1) * (item.price || 0)), 0);
      const invoiceGrandTotal = calculateGrandTotal();
      const invoiceTax = isTaxEnabled ? rawSubtotal * 0.11 : 0;

      const currentInv = editingInvoiceId ? invoices.find(i => i.id === editingInvoiceId) : null;
      const currentStatus = currentInv?.status || 'Unpaid';

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Main Invoice Document Card */}
          <div className="lg:col-span-8 bg-white rounded-xl p-8 shadow-xl text-left font-sans border border-gray-100">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              {/* Logo & Company Name */}
              <div className="flex items-center gap-3">
                {company.companyLogo ? (
                  <img src={company.companyLogo} alt="Logo" className="h-14 w-auto max-w-[160px] object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white shadow-md shadow-orange-500/20 text-lg">
                    {company.companyName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Metadata */}
              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2.5 ${
                  currentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                  currentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentStatus}
                </span>
                <p className="text-[13px] font-bold text-gray-900 mb-1">{invoiceNo || 'INV-2026-001'}</p>
                <div className="text-[12px] text-gray-500 space-y-0.5">
                  {refStr && (
                    <p>No. Ref: {refStr}</p>
                  )}
                  <p>Issue Date: {formatPreviewDate(transDate)}</p>
                  <p>Due Date: {formatPreviewDate(dueDateStr)}</p>
                </div>
              </div>
            </div>

            {/* Company / Issuer Address (Perusahaan Kita) */}
            <div className="text-[12px] text-gray-500 mb-8 leading-relaxed">
              <p className="font-semibold text-gray-800">{company.companyName}</p>
              <p>{company.companyAddress}</p>
              <p>{company.companyEmail}</p>
              <p>{company.companyPhone}</p>
              {company.taxId && <p>Tax ID: {company.taxId}</p>}
            </div>

            {/* Separator */}
            <div className="h-px w-full bg-gray-100 mb-8" />

            {/* Recipient / Partner Details & Transaction Reference */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[12px] text-gray-500 mb-2">{isSales ? 'Bill to / Customer' : 'Bill from / Distributor'}</p>
                <p className="text-[13px] font-bold text-gray-900 mb-1">{vendorId || (isSales ? 'Direct Retail Client' : 'Distributor')}</p>
                <p className="text-[12px] text-gray-500">{partnerAddress}</p>
                {currentPartnerObj?.npwp && currentPartnerObj.npwp !== '-' && (
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">NPWP: {currentPartnerObj.npwp}</p>
                )}
              </div>
              <div>
                <p className="text-[12px] text-gray-500 mb-1">Informasi Transaksi</p>
                <p className="text-[12px] text-gray-500 mb-2">
                  No. Referensi: {refStr || '-'}
                </p>
                {partnerEmail && (
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Email Kontak</p>
                    <p className="text-[12px] font-medium text-gray-800">{partnerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Table of Line Items */}
            <div className="mb-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-t border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-1 text-left">Description</th>
                    <th className="py-3.5 px-3 text-center w-20">Qty</th>
                    <th className="py-3.5 px-3 text-right w-36">Unit Price</th>
                    <th className="py-3.5 px-1 text-right w-36">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formLineItems.map((item, index) => {
                    const priceVal = item.price || 0;
                    const totalVal = (item.qty || 1) * priceVal;
                    return (
                      <tr key={item.id || index} className="text-[13px] group">
                        <td className="py-4 px-1 text-left font-medium text-gray-900 group-hover:text-orange-600 transition-colors">{item.description || 'Custom Line Item'}</td>
                        <td className="py-4 px-3 text-center text-gray-600">{item.qty}</td>
                        <td className="py-4 px-3 text-right text-gray-600">{formatAmount(priceVal)}</td>
                        <td className="py-4 px-1 text-right font-medium text-gray-900">{formatAmount(totalVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Notes */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Notes & Banking Terms</p>
                <p className="text-[12px] text-gray-500 leading-relaxed max-w-sm">
                  {messageNotes || 'MIL-01 milestones payments executed securely via Direct Bank Wire Transfer.'}
                </p>
              </div>
              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatAmount(rawSubtotal)}</span>
                </div>
                {isTaxEnabled && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-500">Taxes (11%)</span>
                    <span className="font-medium text-gray-900">{formatAmount(invoiceTax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] pt-3 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="font-bold text-gray-900">{formatAmount(invoiceGrandTotal)}</span>
                </div>
              </div>
            </div>


          </div>

          {/* RIGHT COLUMN: Action panel & Context */}
          <div className="lg:col-span-4 space-y-6 text-left font-sans">
            
            {/* Print / Export Document Action Box */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-5 shadow-xl flex items-center justify-between gap-4">
              <div className="text-left">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Printer size={16} className="text-[#EA580C]" /> Cetak Surat Resmi
                </h3>
                <p className="text-xs text-[#909090] mt-1">
                  Cetak atau ekspor PDF lengkap dengan <span className="text-white font-medium">No. Referensi ({refStr || 'PO/Ref'})</span> &amp; tanda tangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePrintDocument()}
                className="px-4 py-2 bg-[#EA580C] hover:bg-[#d44d05] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-[#EA580C]/20 active:scale-95"
              >
                <Printer size={14} />
                <span>Cetak Surat</span>
              </button>
            </div>

            {/* Document Activity Logs */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <Clock size={16} className="text-[#EA580C]" /> Document Activity Logs
              </h3>
              
              <div className="relative pl-5 border-l border-[#2A2A2A] space-y-6 text-left ml-2">
                {(() => {
                  const currentInvObj = editingInvoiceId ? invoices.find(i => i.id === editingInvoiceId) : null;
                  const logsToDisplay = currentInvObj 
                    ? getInvoiceLogs(currentInvObj)
                    : [
                        {
                          id: 'log-draft-now',
                          type: 'created' as const,
                          title: 'Surat Dibuat (Draft)',
                          user: 'Admin',
                          timestamp: formatLogTimestamp(),
                          details: `Surat ${invoiceNo || 'Baru'} sedang dibuat oleh Admin pada ${formatLogTimestamp()}`
                        }
                      ];

                  return logsToDisplay.map((log) => (
                    <div key={log.id} className="relative text-left">
                      <div className="absolute -left-[28px] top-0.5 w-4 h-4 bg-[#141517] border border-[#2A2A2A] rounded flex items-center justify-center shadow-sm">
                        {log.type === 'created' ? (
                          <FileText size={9} className="text-[#EA580C]" />
                        ) : log.type === 'updated' ? (
                          <Edit3 size={9} className="text-amber-400" />
                        ) : log.type === 'paid' ? (
                          <CheckCircle size={9} className="text-emerald-400" />
                        ) : (
                          <Clock size={9} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-white">{log.title}</p>
                        <span className="text-[10px] font-mono text-[#909090]">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed">
                        {log.details}
                      </p>
                      <p className="text-[10px] text-[#707070] mt-1">
                        Oleh: <span className="text-gray-300 font-medium">{log.user}</span>
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      );
    };

    const pageTitle = () => {
      const docName = newType === 'Invoice' ? 'Invoice' : newType === 'Quotation' ? 'Quotation' : 'Return';
      const actionName = isSales ? 'Sales' : 'Purchase';
      const actionPrefix = editingInvoiceId ? 'Edit' : 'Create';
      return `${actionPrefix} ${actionName} ${docName}`;
    };

    return (
      <>
      <AnimatePresence>
        {showDiscardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDiscardModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#18181A] border border-[#27272A] rounded-[24px] shadow-2xl w-full max-w-md relative z-10 p-6 overflow-hidden text-left"
            >
              {/* Top Header Row */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-full bg-[#3F1D24] text-[#F87171] border border-red-900/30 flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="w-8 h-8 rounded-full bg-[#27272A] hover:bg-[#3F3F46] transition-colors text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                Discard unsaved changes?
              </h2>

              {/* Description */}
              <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
                You have unsaved changes in <span className="text-white font-medium">{editingInvoiceId || 'this document'}</span>. Discarding will remove all unsaved edits. This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (saveTransaction(true)) {
                      setView('list');
                      setEditingInvoiceId(null);
                      setShowDiscardModal(false);
                    }
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setView('list'); 
                    setEditingInvoiceId(null);
                    setShowDiscardModal(false);
                  }}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20"
                >
                  Discard Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="w-full min-h-screen bg-[#0A0A0A] text-white pl-8 pr-8 pb-12 pt-[9px] font-sans">
        <div className="w-full">
          {/* Header bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleBackNavigation}
              className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-colors cursor-pointer text-[#909090] hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest block mb-0.5">{editingInvoiceId ? 'Edit Transaction' : 'New Transaction'}</span>
              <h1 className="text-[18px] font-semibold tracking-tight text-white leading-tight">
                {pageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-5 text-[12px] font-medium text-[#909090]">
              <button 
                type="button" 
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle size={14} /> Guide
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-3">
            {!isFormEditable ? (
              <div className="inline-flex items-center bg-[#18191E] border border-[#2B2E38] rounded-full p-1 shadow-lg">
                <button 
                  type="button"
                  onClick={() => setIsFormEditable(true)}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#EA580C] hover:text-[#70B0FF] hover:bg-[#232630] rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <FileText size={15} className="text-[#EA580C]" />
                  <span>Edit</span>
                </button>
                {editingInvoiceId && invoices.find(i => i.id === editingInvoiceId)?.status !== 'Paid' && invoices.find(i => i.id === editingInvoiceId)?.type === 'Invoice' && (
                  <>
                    <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />
                    <button 
                      type="button"
                      onClick={() => {
                        const inv = invoices.find(i => i.id === editingInvoiceId);
                        if (inv) {
                          openPaymentModal([inv]);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#EA580C] hover:text-[#70B0FF] hover:bg-[#232630] rounded-full transition-all cursor-pointer active:scale-95"
                    >
                      <CheckCircle size={15} className="text-[#EA580C]" />
                      <span>Payment</span>
                    </button>
                  </>
                )}
                {editingInvoiceId && (() => {
                  const currentInv = invoices.find(i => i.id === editingInvoiceId);
                  if (!currentInv) return null;
                  return (
                    <>
                      <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
                          className="flex items-center justify-center px-3 py-1.5 text-[13px] font-medium text-[#EA580C] hover:text-[#70B0FF] hover:bg-[#232630] rounded-full transition-all cursor-pointer active:scale-95"
                        >
                          <MoreVertical size={16} className="text-[#EA580C]" />
                        </button>
                        <AnimatePresence>
                          {showThreeDotMenu && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowThreeDotMenu(false)} />
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute right-0 mt-2 w-36 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowThreeDotMenu(false);
                                    setShowAccountingModal(true);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-white hover:bg-[#20222B] rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                >
                                  <BarChart2 size={13} className="text-[#EA580C]" />
                                  <span>Akuntansi</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowThreeDotMenu(false);
                                    setShowSingleDeleteModal(true);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-950/30 hover:text-red-400 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <>
              <div className="inline-flex items-center bg-[#18191E] border border-[#2B2E38] rounded-full p-1 shadow-lg">
                <button 
                  type="button"
                  onClick={handleSaveTransaction}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#10B981] hover:text-[#34D399] hover:bg-[#10B981]/15 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle size={15} className="text-[#10B981]" />
                  <span>{editingInvoiceId ? 'Update' : 'Save'}</span>
                </button>

                <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />

                <button 
                  type="button"
                  onClick={() => {
                    if (saveTransaction(true)) {
                      setIsFormEditable(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-white hover:text-gray-200 hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <FileText size={15} className="text-white" />
                  <span>Draft</span>
                </button>

                <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />

                <button 
                  type="button"
                  onClick={() => { 
                    if (editingInvoiceId) {
                      setIsFormEditable(false);
                      handleEditInvoice(invoices.find(i => i.id === editingInvoiceId));
                    } else {
                      handleBackNavigation();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#EF4444] hover:text-[#F87171] hover:bg-[#EF4444]/15 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <XCircle size={15} className="text-[#EF4444]" />
                  <span>Cancel</span>
                </button>
              </div>
              </>
            )}
          </div>
        </div>

        {/* Two-Column Responsive Workspace Grid */}
        {!isFormEditable ? (
          renderInvoicePreview()
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Core Form Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: Transaction Information */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Partner & Dates */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                      <span className="text-red-500 mr-1">*</span>{isSales ? 'Customer' : 'Distributor'}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowVendorDropdown(!showVendorDropdown);
                          setShowTransDateCalendar(false);
                          setShowDueDateCalendar(false);
                          setShowTermDropdown(false);
                        }}
                        className={`w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left ${
                          attemptedSave && !vendorId ? 'border-red-500' : 'border-[#2B2D36]'
                        }`}
                      >
                        <span className={vendorId ? "text-white" : "text-[#707070]"}>
                          {vendorId ? (() => {
                            const p = getStoredPartners().find(p => p.name === vendorId);
                            return p ? p.name : vendorId;
                          })() : "Select contact"}
                        </span>
                        <ChevronDown size={14} className="text-[#909090]" />
                      </button>

                      <AnimatePresence>
                        {showVendorDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowVendorDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                            >
                              <div className="p-2 mb-1 border-b border-[#262830] flex items-center gap-2 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                                <Search size={14} className="text-[#8A8F9E]" />
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  value={vendorSearch}
                                  onChange={(e) => setVendorSearch(e.target.value)}
                                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                  autoFocus
                                />
                                {vendorSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setVendorSearch('')}
                                    className="text-[#8A8F9E] hover:text-white"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>

                              <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                                {(() => {
                                  const partnersList = getStoredPartners().filter(p => isSales ? p.category === 'Customer' : p.category !== 'Customer');
                                  const partnerOptions = [...partnersList, { id: 'WALK-IN', name: "Direct Walk-in Retail Client" } as any];
                                  const filteredPartners = partnerOptions.filter(p => 
                                    p.name.toLowerCase().includes(vendorSearch.toLowerCase())
                                  );

                                  return (
                                    <>
                                      {filteredPartners.map((p, index) => (
                                        <button
                                          key={index}
                                          type="button"
                                          onClick={() => {
                                            setVendorId(p.name);
                                            setShowVendorDropdown(false);
                                            setVendorSearch('');
                                          }}
                                          className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                            vendorId === p.name
                                              ? 'bg-[#222530] text-white font-semibold'
                                              : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                          }`}
                                        >
                                          <span>{p.name}</span>
                                          {vendorId === p.name && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
                                        </button>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowVendorDropdown(false);
                                          setVendorSearch('');
                                          const defaultCat: 'Customer' | 'Distributor' = isSales ? 'Customer' : 'Distributor';
                                          setAddPartnerCategory(defaultCat);
                                          const settings = getIdPrefixSettings();
                                          const prefix = defaultCat === 'Customer' ? (settings.customerPrefix || 'CSTMR-') : (settings.distributorPrefix || 'DIST-');
                                          setAddPartnerNumber(getNextId(getStoredPartners(), prefix));
                                          setShowAddPartnerModal(true);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                                      >
                                        <Plus size={14} />
                                        <span>Add {isSales ? 'Customer' : 'Distributor'}</span>
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                        <span className="text-red-500 mr-1">*</span>Date
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowTransDateCalendar(!showTransDateCalendar);
                            setShowDueDateCalendar(false);
                            setShowVendorDropdown(false);
                            setShowTermDropdown(false);
                          }}
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left"
                        >
                          <span>{formatDateStr(parseYMD(transDate))}</span>
                          <Calendar size={14} className="text-[#909090]" />
                        </button>

                        <AnimatePresence>
                          {showTransDateCalendar && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowTransDateCalendar(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.12 }}
                                className="absolute left-0 top-full mt-2 p-4 w-[290px] bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl z-50 flex flex-col overflow-hidden"
                              >
                                {renderCustomSingleCalendar(
                                  transDateViewDate,
                                  transDate,
                                  (ymd) => {
                                    setTransDate(ymd);
                                    setShowTransDateCalendar(false);
                                  },
                                  setTransDateViewDate
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                        Due Date
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDueDateCalendar(!showDueDateCalendar);
                            setShowTransDateCalendar(false);
                            setShowVendorDropdown(false);
                            setShowTermDropdown(false);
                          }}
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left"
                        >
                          <span>{formatDateStr(parseYMD(dueDateStr))}</span>
                          <Calendar size={14} className="text-[#909090]" />
                        </button>

                        <AnimatePresence>
                          {showDueDateCalendar && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowDueDateCalendar(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.12 }}
                                className="absolute left-0 top-full mt-2 p-4 w-[290px] bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl z-50 flex flex-col overflow-hidden"
                              >
                                {renderCustomSingleCalendar(
                                  dueDateViewDate,
                                  dueDateStr,
                                  (ymd) => {
                                    setDueDateStr(ymd);
                                    setPaymentTerm('Custom');
                                    setShowDueDateCalendar(false);
                                  },
                                  setDueDateViewDate
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                      Term
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTermDropdown(!showTermDropdown);
                          setShowVendorDropdown(false);
                          setShowTransDateCalendar(false);
                          setShowDueDateCalendar(false);
                        }}
                        className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left"
                      >
                        <span className={paymentTerm ? "text-white" : "text-[#707070]"}>
                          {paymentTerm || "Select Term"}
                        </span>
                        <ChevronDown size={14} className="text-[#909090]" />
                      </button>

                      <AnimatePresence>
                        {showTermDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowTermDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                            >
                              {['COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'].map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  onClick={() => {
                                    setPaymentTerm(term);
                                    setShowTermDropdown(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                    paymentTerm === term
                                      ? 'bg-[#222530] text-white font-semibold'
                                      : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                  }`}
                                >
                                  <span>{term}</span>
                                  {paymentTerm === term && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Right side: Identifiers & Tags */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                      ID <Info size={13} className="text-[#606060]" />
                    </label>
                    <input 
                      type="text" 
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="e.g. INV-RK-224"
                      className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                      Reference <Info size={13} className="text-[#606060]" />
                    </label>
                    <input 
                      type="text" 
                      value={refStr}
                      onChange={(e) => setRefStr(e.target.value)}
                      placeholder="e.g. PO/098/X/2026"
                      className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Info collapse section */}
              <div className="mt-5 pt-4 border-t border-[#2A2A2A]/50">
                <button 
                  type="button"
                  onClick={() => setShowShippingInfo(!showShippingInfo)}
                  className="text-xs font-semibold text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showShippingInfo ? '− Hide Shipping Details' : '+ Set Shipping & Tracking Details'}</span>
                </button>
                
                <AnimatePresence>
                  {showShippingInfo && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2A2A2A]/30 pt-4"
                    >
                      <div>
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">Shipping Address</label>
                        <textarea 
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Enter complete shipping destination address..."
                          rows={2}
                          className="w-full px-3.5 py-2 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all resize-none placeholder:text-[#6E7079]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">Tracking Number</label>
                        <input 
                          type="text" 
                          value={trackingNo}
                          onChange={(e) => setTrackingNo(e.target.value)}
                          placeholder="e.g. JNE1234567890"
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">Driver Name</label>
                        <input 
                          type="text" 
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          placeholder="e.g. Budi Santoso"
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">Vehicle No.</label>
                        <input 
                          type="text" 
                          value={vehicleNoStr}
                          onChange={(e) => setVehicleNoStr(e.target.value)}
                          placeholder="e.g. B 9123 SQR"
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* CARD 2: Detail Produk (Line Items workspace) */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-4 pb-2.5 border-b border-[#2A2A2A]">
                {/* Quick actions nested in card header */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Barcode Search input */}
                  <div className="relative w-[240px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#909090]">
                      <Search size={14} />
                    </span>
                    <input 
                      type="text" 
                      value={barcodeScan}
                      onChange={(e) => setBarcodeScan(e.target.value)}
                      placeholder="Scan Barcode / SKU..."
                      className="w-full h-[38px] pl-9 pr-4 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all placeholder:text-[#6E7079]"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[#A0A0A0]">
                    {/* Auto add row */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={autoAddRow}
                        onChange={(e) => setAutoAddRow(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-7 h-3.5 rounded-full transition-colors relative ${autoAddRow ? 'bg-[#EA580C]' : 'bg-[#2A2A2A]'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${autoAddRow ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <span>Auto Row</span>
                    </label>

                    {/* Tax enabled */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isTaxEnabled}
                        onChange={(e) => setIsTaxEnabled(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-7 h-3.5 rounded-full transition-colors relative ${isTaxEnabled ? 'bg-[#EA580C]' : 'bg-[#2A2A2A]'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${isTaxEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <span>Tax</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto border border-[#2A2A2A] rounded-xl bg-[#0C0D0E]/50">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-[#0A0A0A] border-b border-[#2A2A2A] text-[12px] font-semibold text-[#808080]">
                      <th className="py-3 px-3 w-[35%] min-w-[320px]">Product</th>
                      <th className="py-3 px-3 w-16 text-center">Quantity</th>
                      <th className="py-3 px-3 w-20 text-center">Discount</th>
                      <th className="py-3 px-3 w-28">Price</th>
                      {isTaxEnabled && <th className="py-3 px-3 w-32">Tax</th>}
                      <th className="py-3 px-3 w-28 text-right">Amount</th>
                      <th className="py-3 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formLineItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-[#2A2A2A]/40 hover:bg-[#1C1D21]/20 transition-colors">
                        {/* Product selector column */}
                        <td className="py-2.5 px-3">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownCoords({
                                  top: rect.bottom,
                                  left: rect.left,
                                  width: rect.width
                                });
                                setActiveProductDropdownIdx(activeProductDropdownIdx === index ? null : index);
                                setProductSearch('');
                                setShowVendorDropdown(false);
                                setShowTransDateCalendar(false);
                                setShowDueDateCalendar(false);
                                setShowTermDropdown(false);
                              }}
                              className={`w-full h-[38px] px-3 bg-[#141518] border rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left ${
                                attemptedSave && (
                                  !item.productId && (
                                    !formLineItems.some(it => it.productId) || 
                                    item.price > 0 || 
                                    item.description !== ''
                                  )
                                ) ? 'border-red-500' : 'border-[#2B2D36]'
                              }`}
                            >
                              <span className="truncate">
                                {(() => {
                                  const selectedProd = getStoredProducts().find(p => p.id === item.productId);
                                  return selectedProd ? selectedProd.name : "Select Product";
                                })()}
                              </span>
                              <ChevronDown size={12} className="text-[#909090] flex-shrink-0 ml-1" />
                            </button>

                            <AnimatePresence>
                              {activeProductDropdownIdx === index && dropdownCoords && (
                                <>
                                  {createPortal(
                                    <>
                                      {/* Backdrop to close dropdown on click outside */}
                                      <div className="fixed inset-0 z-[9999]" onClick={() => setActiveProductDropdownIdx(null)} />
                                      <motion.div
                                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                        transition={{ duration: 0.12 }}
                                        className="bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl overflow-hidden p-1.5"
                                        style={{
                                          position: 'fixed',
                                          top: `${dropdownCoords.top + 4}px`,
                                          left: `${dropdownCoords.left}px`,
                                          width: `${dropdownCoords.width}px`,
                                          zIndex: 10000,
                                        }}
                                      >
                                        <div className="p-2 mb-1 border-b border-[#262830] flex items-center gap-2 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                                          <Search size={14} className="text-[#8A8F9E]" />
                                          <input
                                            type="text"
                                            placeholder="Search product..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                            autoFocus
                                          />
                                          {productSearch && (
                                            <button
                                              type="button"
                                              onClick={() => setProductSearch('')}
                                              className="text-[#8A8F9E] hover:text-white"
                                            >
                                              <X size={12} />
                                            </button>
                                          )}
                                        </div>

                                        <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                                          {(() => {
                                            const allProducts = getStoredProducts();
                                            const filteredProducts = allProducts.filter(p => 
                                              p.name.toLowerCase().includes(productSearch.toLowerCase())
                                            );

                                            return (
                                              <>
                                                {filteredProducts.map((p) => (
                                                  <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                      handleProductChange(index, p.id);
                                                      setActiveProductDropdownIdx(null);
                                                      setProductSearch('');
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                                      item.productId === p.id
                                                        ? 'bg-[#222530] text-white font-semibold'
                                                        : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                                    }`}
                                                  >
                                                    <span className="truncate">{p.name}</span>
                                                    <span className="text-[11px] text-[#8A8F9E] ml-2 font-mono flex-shrink-0">Stock: {p.stock}</span>
                                                  </button>
                                                ))}
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setActiveProductDropdownIdx(null);
                                                    setProductSearch('');
                                                    setModalTargetRowIdx(index);
                                                    setAddProductSku(`SKU/${Math.floor(10000 + Math.random() * 90000)}`);
                                                    setShowAddProductModal(true);
                                                  }}
                                                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                                                >
                                                  <Plus size={14} />
                                                  <span>Add Product</span>
                                                </button>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </motion.div>
                                    </>,
                                    document.body
                                  )}
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>

                        {/* Qty column */}
                        <td className="py-2.5 px-3">
                          <input 
                            type="number" 
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                            className="w-full h-[38px] px-2 bg-[#141518] border border-[#2B2D36] rounded-xl text-xs text-white text-center focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all font-semibold"
                          />
                        </td>

                        {/* Discount column */}
                        <td className="py-2.5 px-3">
                          <input 
                            type="text" 
                            value={item.discount}
                            onChange={(e) => handleDiscountChange(index, e.target.value)}
                            placeholder="0%"
                            className="w-full h-[38px] px-2 bg-[#141518] border border-[#2B2D36] rounded-xl text-xs text-white text-center focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all font-sans placeholder:text-[#6E7079]"
                          />
                        </td>

                        {/* Price Column */}
                        <td className="py-2.5 px-3">
                          <input 
                            type="number" 
                            min="0"
                            value={item.price}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className="w-full h-[38px] px-3 bg-[#141518] border border-[#2B2D36] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all font-sans"
                          />
                        </td>

                        {/* Tax selector */}
                        {isTaxEnabled && (
                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTaxDropdownCoords({
                                    top: rect.bottom,
                                    left: rect.left,
                                    width: rect.width
                                  });
                                  setActiveTaxDropdownIdx(activeTaxDropdownIdx === index ? null : index);
                                  setActiveProductDropdownIdx(null);
                                  setShowVendorDropdown(false);
                                  setShowTransDateCalendar(false);
                                  setShowDueDateCalendar(false);
                                  setShowTermDropdown(false);
                                }}
                                className="w-full h-[38px] px-2.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left"
                              >
                                <span className="truncate font-semibold">
                                  {item.tax === 'Tanpa Pajak' ? '...' : item.tax}
                                </span>
                                <ChevronDown size={12} className="text-[#909090] flex-shrink-0 ml-1" />
                              </button>

                              <AnimatePresence>
                                {activeTaxDropdownIdx === index && taxDropdownCoords && (
                                  <>
                                    {createPortal(
                                      <>
                                        {/* Backdrop to close dropdown on click outside */}
                                        <div className="fixed inset-0 z-[9999]" onClick={() => setActiveTaxDropdownIdx(null)} />
                                        <motion.div
                                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                          transition={{ duration: 0.12 }}
                                          className="bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl overflow-hidden p-1.5"
                                          style={{
                                            position: 'fixed',
                                            top: `${taxDropdownCoords.top + 4}px`,
                                            left: `${taxDropdownCoords.left}px`,
                                            width: `${taxDropdownCoords.width}px`,
                                            zIndex: 10000,
                                          }}
                                        >
                                          <div className="max-h-[160px] overflow-y-auto space-y-0.5">
                                            {[
                                              { value: 'Tanpa Pajak', label: 'Tanpa Pajak (...)' },
                                              { value: 'PPN 11%', label: 'PPN 11%' },
                                              { value: 'PPH 23', label: 'PPH 23' }
                                            ].map((taxOpt) => (
                                              <button
                                                key={taxOpt.value}
                                                type="button"
                                                onClick={() => {
                                                  handleTaxChange(index, taxOpt.value);
                                                  setActiveTaxDropdownIdx(null);
                                                }}
                                                className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                                  item.tax === taxOpt.value
                                                    ? 'bg-[#222530] text-white font-semibold'
                                                    : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                                }`}
                                              >
                                                <span>{taxOpt.label}</span>
                                                {item.tax === taxOpt.value && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
                                              </button>
                                            ))}
                                          </div>
                                        </motion.div>
                                      </>,
                                      document.body
                                    )}
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        )}

                        {/* Line Total Column */}
                        <td className="py-2.5 px-3 text-right text-xs font-sans font-bold text-white">
                          {formatAmount(getLineItemTotal(item))}
                        </td>

                        {/* Row action delete */}
                        <td className="py-2.5 px-2 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className="p-1.5 text-[#606060] hover:text-[#E87A5D] hover:bg-[#E87A5D]/10 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add line row trigger */}
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#EA580C] bg-[#1E2026] hover:bg-[#282B33] hover:text-[#FB923C] transition-all px-3.5 py-2 rounded-xl cursor-pointer active:scale-95 border border-[#2C2F38] shadow-xs"
                >
                  <Plus size={15} className="text-[#EA580C]" />
                  <span>Add Row</span>
                </button>
              </div>
            </div>


          </div>

          {/* RIGHT COLUMN: Sticky Sidebar Summary & Actions (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
            
            {/* CARD 4: Ringkasan Total & Actions Sidebar */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-5 shadow-xl space-y-5">
              {/* Subtotal */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#909090] font-medium">Sub Total</span>
                  <span className="font-sans text-white font-semibold">{formatAmount(calculateSubTotal())}</span>
                </div>

                {/* Modifier Inputs Block */}
                <div className="border-t border-b border-[#2A2A2A]/50 py-3 space-y-2.5">
                  
                  {/* Additional Discount */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#909090] text-[11px]">Additional Discount</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (showAddDiscountInput) { setAddDiscount(0); }
                          setShowAddDiscountInput(!showAddDiscountInput);
                        }}
                        className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        {showAddDiscountInput ? 'Hide' : '+ Set'}
                      </button>
                    </div>
                    {showAddDiscountInput && (
                      <div className="flex bg-[#141518] border border-[#2B2D36] rounded-xl overflow-hidden focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] transition-all h-[38px]">
                        <select
                          value={addDiscountType}
                          onChange={(e) => setAddDiscountType(e.target.value as 'Rp' | '%')}
                          className="bg-transparent text-[#909090] text-xs px-2 border-r border-[#2B2D36] focus:outline-none cursor-pointer"
                        >
                          <option value="Rp" className="bg-[#141518]">Rp</option>
                          <option value="%" className="bg-[#141518]">%</option>
                        </select>
                        <input 
                          type="number" 
                          min="0"
                          value={addDiscount || ''}
                          onChange={(e) => setAddDiscount(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-transparent px-3 py-1.5 text-right text-[13px] text-white focus:outline-none placeholder:text-[#6E7079]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Shipping Fee */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#909090] text-[11px]">Shipping Fee</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (showShipFeeInput) { setShipFee(0); }
                          setShowShipFeeInput(!showShipFeeInput);
                        }}
                        className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        {showShipFeeInput ? 'Hide' : '+ Set'}
                      </button>
                    </div>
                    {showShipFeeInput && (
                      <div className="flex bg-[#141518] border border-[#2B2D36] rounded-xl overflow-hidden focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] transition-all h-[38px]">
                        <select
                          value={shipFeeType}
                          onChange={(e) => setShipFeeType(e.target.value as 'Rp' | '%')}
                          className="bg-transparent text-[#909090] text-xs px-2 border-r border-[#2B2D36] focus:outline-none cursor-pointer"
                        >
                          <option value="Rp" className="bg-[#141518]">Rp</option>
                          <option value="%" className="bg-[#141518]">%</option>
                        </select>
                        <input 
                          type="number" 
                          min="0"
                          value={shipFee || ''}
                          onChange={(e) => setShipFee(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-transparent px-3 py-1.5 text-right text-[13px] text-white focus:outline-none placeholder:text-[#6E7079]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Transaction Fee */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#909090] text-[11px]">Transaction Fee</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (showTxnFeeInput) { setTxnFee(0); }
                          setShowTxnFeeInput(!showTxnFeeInput);
                        }}
                        className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        {showTxnFeeInput ? 'Hide' : '+ Set'}
                      </button>
                    </div>
                    {showTxnFeeInput && (
                      <div className="flex bg-[#141518] border border-[#2B2D36] rounded-xl overflow-hidden focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] transition-all h-[38px]">
                        <select
                          value={txnFeeType}
                          onChange={(e) => setTxnFeeType(e.target.value as 'Rp' | '%')}
                          className="bg-transparent text-[#909090] text-xs px-2 border-r border-[#2B2D36] focus:outline-none cursor-pointer"
                        >
                          <option value="Rp" className="bg-[#141518]">Rp</option>
                          <option value="%" className="bg-[#141518]">%</option>
                        </select>
                        <input 
                          type="number" 
                          min="0"
                          value={txnFee || ''}
                          onChange={(e) => setTxnFee(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-transparent px-3 py-1.5 text-right text-[13px] text-white focus:outline-none placeholder:text-[#6E7079]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Withholding Tax Deduction */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#909090] text-[11px]">Withholding Tax Deduction</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (showWithholdingInput) { setWithholdingTax(0); }
                          setShowWithholdingInput(!showWithholdingInput);
                        }}
                        className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        {showWithholdingInput ? 'Hide' : '+ Set'}
                      </button>
                    </div>
                    {showWithholdingInput && (
                      <div className="flex bg-[#141518] border border-[#2B2D36] rounded-xl overflow-hidden focus-within:border-[#EA580C] focus-within:ring-1 focus-within:ring-[#EA580C] transition-all h-[38px]">
                        <select
                          value={withholdingTaxType}
                          onChange={(e) => setWithholdingTaxType(e.target.value as 'Rp' | '%')}
                          className="bg-transparent text-[#909090] text-xs px-2 border-r border-[#2B2D36] focus:outline-none cursor-pointer"
                        >
                          <option value="Rp" className="bg-[#141518]">Rp</option>
                          <option value="%" className="bg-[#141518]">%</option>
                        </select>
                        <input 
                          type="number" 
                          min="0"
                          value={withholdingTax || ''}
                          onChange={(e) => setWithholdingTax(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-transparent px-3 py-1.5 text-right text-[13px] text-white focus:outline-none placeholder:text-[#6E7079]"
                        />
                      </div>
                    )}
                  </div>

                </div>

                {/* Grand Total Display */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-white font-bold">Grand Total</span>
                  <span className="font-sans text-white font-bold">{formatAmount(calculateGrandTotal())}</span>
                </div>
              </div>

              {/* Akun Akuntansi Jurnal Selection on Form */}
              <div className="border-t border-[#2A2A2A]/50 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#909090] flex items-center gap-1.5">
                    <BarChart2 size={13} className="text-[#EA580C]" />
                    Akun Akuntansi Jurnal
                  </span>
                  <span className="text-[10px] text-[#808080]">Debit & Kredit</span>
                </div>
                
                <div className="space-y-2.5">
                  <div className="relative">
                    <label className="block text-[11px] font-medium text-[#909090] mb-1">
                      Akun Debit (Dr.)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveDebitDropdown(!showSaveDebitDropdown);
                        setShowSaveCreditDropdown(false);
                      }}
                      className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] hover:border-[#3A3D4A] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] rounded-xl text-xs text-white transition-all flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="truncate">{saveDebitAccount}</span>
                      <ChevronDown size={14} className="text-[#909090] shrink-0 ml-1" />
                    </button>

                    <AnimatePresence>
                      {showSaveDebitDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSaveDebitDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 top-full mt-1.5 w-full bg-[#141518] border border-[#262830] rounded-xl shadow-2xl p-1.5 z-50 max-h-[220px] overflow-y-auto space-y-0.5"
                          >
                            {coaAccountsList.map((a) => (
                              <button
                                key={`pdeb-card-${a.code}`}
                                type="button"
                                onClick={() => {
                                  setSaveDebitAccount(a.label);
                                  setShowSaveDebitDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                  saveDebitAccount === a.label
                                    ? 'bg-[#EA580C]/15 text-[#EA580C] font-semibold'
                                    : 'text-white hover:bg-[#20222B]'
                                }`}
                              >
                                <span className="truncate">{a.label}</span>
                                {saveDebitAccount === a.label && <Check size={13} className="text-[#EA580C] shrink-0" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <label className="block text-[11px] font-medium text-[#909090] mb-1">
                      Akun Kredit (Cr.)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveCreditDropdown(!showSaveCreditDropdown);
                        setShowSaveDebitDropdown(false);
                      }}
                      className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] hover:border-[#3A3D4A] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] rounded-xl text-xs text-white transition-all flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="truncate">{saveCreditAccount}</span>
                      <ChevronDown size={14} className="text-[#909090] shrink-0 ml-1" />
                    </button>

                    <AnimatePresence>
                      {showSaveCreditDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSaveCreditDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 top-full mt-1.5 w-full bg-[#141518] border border-[#262830] rounded-xl shadow-2xl p-1.5 z-50 max-h-[220px] overflow-y-auto space-y-0.5"
                          >
                            {coaAccountsList.map((a) => (
                              <button
                                key={`pcred-card-${a.code}`}
                                type="button"
                                onClick={() => {
                                  setSaveCreditAccount(a.label);
                                  setShowSaveCreditDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                  saveCreditAccount === a.label
                                    ? 'bg-[#EA580C]/15 text-[#EA580C] font-semibold'
                                    : 'text-white hover:bg-[#20222B]'
                                }`}
                              >
                                <span className="truncate">{a.label}</span>
                                {saveCreditAccount === a.label && <Check size={13} className="text-[#EA580C] shrink-0" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Notes & Attachments */}
              <div className="border-t border-[#2A2A2A]/50 pt-4 space-y-4">
                {/* Notes Column */}
                <div className="space-y-2">
                  <span className="text-[12px] font-bold text-[#808080] block">Notes</span>
                  <textarea 
                    value={messageNotes}
                    onChange={(e) => setMessageNotes(e.target.value)}
                    placeholder="Write a message to the client, payment terms detail, or internal transaction notes here..."
                    rows={4}
                    className="w-full bg-[#141518] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all resize-none h-[80px] placeholder:text-[#6E7079]"
                  />
                </div>

                {/* Attachments Upload Column */}
                <div className="space-y-3">
                  <span className="text-[12px] font-bold text-[#808080] block">Attachment</span>
                  <label className="border border-dashed border-[#2B2D36] rounded-xl p-4 flex flex-col items-center justify-center hover:bg-[#EA580C]/10 hover:border-[#EA580C] transition-all cursor-pointer group text-center h-[100px] bg-[#141518]">
                    <input 
                      type="file" 
                      multiple 
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files) {
                          const list = Array.from(e.target.files).map((f: any) => ({
                            name: f.name,
                            size: (f.size / 1024).toFixed(1) + ' KB'
                          }));
                          setUploadedFiles([...uploadedFiles, ...list]);
                        }
                      }}
                    />
                    <Upload size={16} className="text-[#8A8F9E] group-hover:text-[#EA580C] transition-colors mb-1.5" />
                    <span className="text-[10px] font-semibold text-[#D5D5D5] group-hover:text-white transition-colors">Drag file / Click to upload</span>
                    <span className="text-[9px] text-[#6E7079] mt-0.5 group-hover:text-[#8A8F9E] transition-colors">Max. 10MB per file</span>
                  </label>

                  {/* List of uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-bold text-[#808080] uppercase block">File List ({uploadedFiles.length})</span>
                      <div className="max-h-[100px] overflow-y-auto space-y-1">
                        {uploadedFiles.map((file: any, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-[#141518] px-3 py-1.5 rounded-lg border border-[#2B2D36] text-[11px] hover:border-[#EA580C]/50 transition-colors">
                            <span className="truncate max-w-[150px] text-[#D5D5D5] flex items-center gap-1.5 font-sans">
                              <Paperclip size={11} className="text-[#EA580C]" />
                              {file.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-[#6E7079]">{file.size}</span>
                              <button 
                                type="button"
                                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                                className="text-[#6E7079] hover:text-[#EA580C] transition-colors"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>
        )}
        </div>
      </div>
      </>
    );
  };

  const tabs = ['Invoice', 'Quotation', 'Delivery', 'Return'];

  return (
    <div className="flex flex-col w-full h-full font-sans relative overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {view === 'create' ? (
          <motion.div
            key="create-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col"
          >
            {renderCreateView()}
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col"
          >
            <div className="pl-8 pr-8 pb-8 pt-[9px] overflow-y-auto flex-1 bg-[#0A0A0A]">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="pb-0" style={{ marginBottom: '0px', paddingBottom: '0px' }}>
            <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0" style={{ marginBottom: 0 }}>
              <span>{isSales ? 'Sales' : 'Purchase'}</span>
            </h1>
            <p className="text-[13px] text-[#909090]">
              {isSales ? 'Manage your sales invoices here.' : 'Manage your purchase invoices here.'}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-5 text-[12px] font-medium text-[#909090] mb-8">
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center gap-5 mr-1 pr-5 border-r border-[#2A2A2A]"
                  >
                    <span className="text-[#E87A5D] mr-2">{selectedIds.length} selected</span>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <Mail size={14} /> Send Email
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <MessageCircle size={14} /> Send WhatsApp
                    </button>
                    {(!invoices.filter(inv => selectedIds.includes(inv.id)).some(inv => inv.status === 'Paid') || activeTab !== 'Invoice') && (
                      <button 
                        onClick={() => {
                          if (activeTab === 'Invoice') {
                            const selectedInvoicesToPay = invoices.filter(inv => selectedIds.includes(inv.id) && inv.status !== 'Paid');
                            if (selectedInvoicesToPay.length > 0) openPaymentModal(selectedInvoicesToPay);
                          } else if (activeTab === 'Quotation' || activeTab === 'Delivery') {
                            handleBulkConvert(activeTab === 'Quotation' ? 'Delivery' : 'Invoice');
                          }
                        }}
                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                      >
                        <CheckCircle size={14} /> 
                        {activeTab === 'Quotation' ? 'Move to Delivery' : activeTab === 'Delivery' ? 'Move to Invoice' : activeTab === 'Return' ? 'Complete' : 'Payment'}
                      </button>
                    )}
                    {activeTab === 'Quotation' && (
                      <button 
                        onClick={() => handleBulkConvert('Invoice')}
                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                      >
                        <FileText size={14} /> Move to Invoice
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                <HelpCircle size={14} /> Guide
              </button>
              <button className={`flex items-center gap-1.5 transition-colors ${selectedIds.length > 0 ? 'text-white' : 'hover:text-white'}`}>
                <FileText size={14} /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-[#1C1C1C] px-3 py-1.5 -ml-3 rounded-lg transition-colors"
              onClick={() => setShowDatePopup(!showDatePopup)}
            >
              {/* Start Date */}
              <div className="flex flex-col justify-center leading-tight shrink-0 text-right">
                <span className="text-[12px] font-medium text-white">{getDayName(rangeStart)}</span>
                <span className="text-[11px] text-[#dbdbdb]">{formatDateStr(rangeStart)}</span>
              </div>

              {/* Separator */}
              <div className="text-[22px] font-light text-white tracking-tight leading-none px-1 shrink-0">
                -
              </div>

              {/* End Date */}
              <div className="flex flex-col justify-center leading-tight shrink-0">
                <span className="text-[12px] font-medium text-white">{getDayName(rangeEnd)}</span>
                <span className="text-[11px] text-[#dbdbdb]">{formatDateStr(rangeEnd)}</span>
              </div>
            </div>

            {/* Date Popup */}
            {showDatePopup && (
              <div className="absolute top-full left-0 mt-2 w-[600px] bg-[#05070A] border border-[#181C26] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden font-sans">
                <div className="flex flex-1 min-h-[300px]">
                  {/* Sidebar presets */}
                  <div className="w-[125px] border-r border-[#141822] p-2 flex flex-col gap-0.5 bg-[#030407]">
                    {['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month', 'This year', 'Last year', 'All time'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          selectedPreset === preset
                            ? 'bg-[#EA580C]/20 text-[#EA580C] font-semibold'
                            : 'text-[#888E99] hover:bg-[#0E121B] hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Calendars side-by-side */}
                  <div className="flex-1 p-4 grid grid-cols-2 gap-5 bg-[#05070A]">
                    {/* Month 1 (Left) */}
                    {renderCalendarMonth(currentViewDate, true)}
                    {/* Month 2 (Right) */}
                    {renderCalendarMonth(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1), false)}
                  </div>
                </div>

                {/* Footer with Inputs & Action Buttons */}
                <div className="flex items-center justify-between border-t border-[#141822] px-4 py-3 bg-[#030407]">
                  <div className="flex items-center gap-1.5">
                    {/* Start Input */}
                    <div className="flex items-center bg-[#090C12] border border-[#1B202D] rounded-lg px-2.5 py-1 text-[11px]">
                      <span className="text-[#7E8592] mr-1.5 font-sans">Start</span>
                      <span className="text-white font-sans">{tempStart ? formatDateInputStr(tempStart) : 'MM/DD/YYYY'}</span>
                      <span className="text-[#2C3240] mx-1.5">|</span>
                      <span className="text-[#5B6270] font-sans">10:30 AM</span>
                    </div>
                    <span className="text-[#5B6270] text-xs font-light">-</span>
                    {/* End Input */}
                    <div className="flex items-center bg-[#090C12] border border-[#1B202D] rounded-lg px-2.5 py-1 text-[11px]">
                      <span className="text-[#7E8592] mr-1.5 font-sans">End</span>
                      <span className="text-white font-sans">{tempEnd ? formatDateInputStr(tempEnd) : 'MM/DD/YYYY'}</span>
                      <span className="text-[#2C3240] mx-1.5">|</span>
                      <span className="text-[#5B6270] font-sans">10:30 AM</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowDatePopup(false)} 
                      className="px-3.5 py-1.5 border border-[#1B202D] text-[#888E99] hover:text-white hover:bg-[#0E121B] transition-colors rounded-lg text-[11px] font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleApply} 
                      className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#D97706] text-white transition-colors rounded-lg text-[11px] font-medium shadow-md shadow-orange-500/20 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 relative">
            <motion.button 
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              whileHover={{ backgroundColor: '#D97706' }}
              whileTap={{ scale: 0.95 }}
              title={`Add ${isSales ? 'Sales' : 'Purchase'}`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-[#EA580C] transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 shrink-0"
            >
              <Plus size={18} />
            </motion.button>

            <AnimatePresence>
              {showAddDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAddDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-72 bg-[#1A1B1F] border border-[#2C2E35] text-white rounded-2xl shadow-2xl p-2 z-50 overflow-hidden font-sans select-none"
                  >
                    {/* Invoice */}
                    <button
                      onClick={() => {
                        setShowAddDropdown(false);
                        setNewType('Invoice');
                        setAttemptedSave(false);
                        setTagStr('');
                        setShowShippingInfo(false);
                        setShippingAddress('');
                        setTrackingNo('');
                        setBarcodeScan('');
                        setAutoAddRow(false);
                        setIsTaxEnabled(true);
                        setInvoiceNo(getNextInvoiceNo('Invoice', isSales, invoices));
                        setVendorId('');
                        const today = new Date();
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        setTransDate(today.toISOString().split('T')[0]);
                        setDueDateStr(nextMonth.toISOString().split('T')[0]);
                        setPaymentTerm('Net 30');
                        setRefStr('');
                        setFormLineItems([
                          { id: '1', productId: '', description: '', qty: 1, unit: 'Pcs', discount: '0%', price: 0, tax: 'Tanpa Pajak' }
                        ]);
                        setMessageNotes('');
                        setAddDiscount(0);
                        setAddDiscountType('Rp');
                        setShipFee(0);
                        setShipFeeType('Rp');
                        setTxnFee(0);
                        setTxnFeeType('Rp');
                        setWithholdingTax(0);
                        setWithholdingTaxType('Rp');
                        setShowAddDiscountInput(false);
                        setShowShipFeeInput(false);
                        setShowTxnFeeInput(false);
                        setShowWithholdingInput(false);
                        setUploadedFiles([]);
                        setEditingInvoiceId(null);
                        setIsFormEditable(true);
                        setView('create');
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#25272D] group-hover:bg-[#EA580C]/20 flex items-center justify-center text-gray-300 group-hover:text-[#EA580C] transition-colors shrink-0">
                          <FileText size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors leading-snug">Invoice</p>
                          <p className="text-xs text-[#8E9099] leading-snug">Create a new {isSales ? 'sales' : 'purchase'} invoice</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ I</span>
                    </button>

                    {/* Quotation */}
                    <button
                      onClick={() => {
                        setShowAddDropdown(false);
                        setNewType('Quotation');
                        setAttemptedSave(false);
                        setTagStr('');
                        setShowShippingInfo(false);
                        setShippingAddress('');
                        setTrackingNo('');
                        setBarcodeScan('');
                        setAutoAddRow(false);
                        setIsTaxEnabled(true);
                        setInvoiceNo(getNextInvoiceNo('Quotation', isSales, invoices));
                        setVendorId('');
                        const today = new Date();
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        setTransDate(today.toISOString().split('T')[0]);
                        setDueDateStr(nextMonth.toISOString().split('T')[0]);
                        setPaymentTerm('Net 30');
                        setRefStr('');
                        setFormLineItems([
                          { id: '1', productId: '', description: '', qty: 1, unit: 'Pcs', discount: '0%', price: 0, tax: 'Tanpa Pajak' }
                        ]);
                        setMessageNotes('');
                        setAddDiscount(0);
                        setAddDiscountType('Rp');
                        setShipFee(0);
                        setShipFeeType('Rp');
                        setTxnFee(0);
                        setTxnFeeType('Rp');
                        setWithholdingTax(0);
                        setWithholdingTaxType('Rp');
                        setShowAddDiscountInput(false);
                        setShowShipFeeInput(false);
                        setShowTxnFeeInput(false);
                        setShowWithholdingInput(false);
                        setUploadedFiles([]);
                        setEditingInvoiceId(null);
                        setIsFormEditable(true);
                        setView('create');
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#25272D] group-hover:bg-[#EA580C]/20 flex items-center justify-center text-gray-300 group-hover:text-[#EA580C] transition-colors shrink-0">
                          <FileSpreadsheet size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors leading-snug">Quotation</p>
                          <p className="text-xs text-[#8E9099] leading-snug">Create a new quotation</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ Q</span>
                    </button>

                    {/* Return */}
                    <button
                      onClick={() => {
                        setShowAddDropdown(false);
                        setNewType('Return');
                        setAttemptedSave(false);
                        setTagStr('');
                        setShowShippingInfo(false);
                        setShippingAddress('');
                        setTrackingNo('');
                        setBarcodeScan('');
                        setAutoAddRow(false);
                        setIsTaxEnabled(true);
                        setInvoiceNo(getNextInvoiceNo('Return', isSales, invoices));
                        setVendorId('');
                        const today = new Date();
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        setTransDate(today.toISOString().split('T')[0]);
                        setDueDateStr(nextMonth.toISOString().split('T')[0]);
                        setPaymentTerm('Net 30');
                        setRefStr('');
                        setFormLineItems([
                          { id: '1', productId: '', description: '', qty: 1, unit: 'Pcs', discount: '0%', price: 0, tax: 'Tanpa Pajak' }
                        ]);
                        setMessageNotes('');
                        setAddDiscount(0);
                        setAddDiscountType('Rp');
                        setShipFee(0);
                        setShipFeeType('Rp');
                        setTxnFee(0);
                        setTxnFeeType('Rp');
                        setWithholdingTax(0);
                        setWithholdingTaxType('Rp');
                        setShowAddDiscountInput(false);
                        setShowShipFeeInput(false);
                        setShowTxnFeeInput(false);
                        setShowWithholdingInput(false);
                        setUploadedFiles([]);
                        setEditingInvoiceId(null);
                        setIsFormEditable(true);
                        setView('create');
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#25272D] group-hover:bg-[#EA580C]/20 flex items-center justify-center text-gray-300 group-hover:text-[#EA580C] transition-colors shrink-0">
                          <RotateCcw size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors leading-snug">Return</p>
                          <p className="text-xs text-[#8E9099] leading-snug">Create a return record</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ R</span>
                    </button>

                    <div className="my-1 border-t border-[#2C2E35]" />

                    {/* Cancel */}
                    <button
                      onClick={() => setShowAddDropdown(false)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-500/10 transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors shrink-0">
                          <XCircle size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors leading-snug">Cancel</p>
                          <p className="text-xs text-[#8E9099] leading-snug">Close dropdown menu</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium text-red-400/80 group-hover:text-red-300">ESC</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>        {/* Card Container for Tabs and Table */}
        <div className="bg-[#131417] border border-[#232427] rounded-2xl shadow-2xl relative z-10">
          
          {/* Tabs */}
          <div className="flex items-center border-b border-[#232427] px-4 pt-1 bg-[#1A1B1F] rounded-t-2xl">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedIds([]);
                }}
                className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab 
                    ? 'border-[#EA580C] text-white' 
                    : 'border-transparent text-[#909299] hover:text-white'
                }`}
              >
                <span>{tab}</span>
              </button>
            ))}
          </div>

          {/* Action Bar (Search and Filters) */}
          {(() => {
            const activeFilterCount = (sortFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (partnerFilter ? 1 : 0) + (minAmountFilter ? 1 : 0) + (maxAmountFilter ? 1 : 0);
            
            const getSortFilterLabel = () => {
              if (sortFilter === 'A-Z') return 'A to Z';
              if (sortFilter === 'Z-A') return 'Z to A';
              if (sortFilter === 'Highest') return 'Highest Amount';
              if (sortFilter === 'Lowest') return 'Lowest Amount';
              if (sortFilter === 'Newest') return 'Newest First';
              if (sortFilter === 'Oldest') return 'Oldest First';
              return 'Show Filters';
            };

            return (
              <>
                <div className="flex items-center gap-3 p-3.5 border-b border-[#232427] bg-[#16171A] relative z-30">
                  {/* Show Filters Dropdown */}
                  <div className="relative z-30">
                    <button 
                      type="button"
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className={`flex items-center justify-between gap-2.5 px-3.5 py-2 text-[13px] font-medium text-white bg-[#141518] transition-all cursor-pointer rounded-xl border ${
                        showSortDropdown 
                          ? 'border-[#EA580C] ring-2 ring-[#EA580C]' 
                          : sortFilter || showFilterPanel || activeFilterCount > 0
                            ? 'border-[#EA580C] text-white'
                            : 'border-[#2B2D36] hover:border-[#3E414E]'
                      }`}
                    >
                      <SlidersHorizontal size={14} className="text-[#8A8F9E]" />
                      <span>{getSortFilterLabel()}</span>
                      <ChevronDown size={15} className={`text-[#8A8F9E] transition-transform duration-200 shrink-0 ${showSortDropdown ? 'rotate-180 text-white' : ''}`} />
                      {activeFilterCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#EA580C] text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showSortDropdown && (
                        <>
                          <div className="fixed inset-0 z-[999]" onClick={() => setShowSortDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 top-full mt-2 w-52 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-[1000] overflow-hidden"
                          >
                            {[
                              { label: 'Default Order', value: '' },
                              { label: 'A to Z (Name / ID)', value: 'A-Z' },
                              { label: 'Z to A (Name / ID)', value: 'Z-A' },
                              { label: 'Highest Amount', value: 'Highest' },
                              { label: 'Lowest Amount', value: 'Lowest' },
                              { label: 'Newest Date', value: 'Newest' },
                              { label: 'Oldest Date', value: 'Oldest' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setSortFilter(opt.value);
                                  setShowSortDropdown(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                  sortFilter === opt.value
                                    ? 'bg-[#222530] text-white'
                                    : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {sortFilter === opt.value && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                                )}
                              </button>
                            ))}

                            <div className="my-1 border-t border-[#262830]" />

                            <button
                              type="button"
                              onClick={() => {
                                setShowFilterPanel(!showFilterPanel);
                                setShowSortDropdown(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-[#EA580C] hover:bg-[#20222B] hover:text-white transition-all flex items-center justify-between rounded-xl cursor-pointer"
                            >
                              <span>{showFilterPanel ? 'Hide More Filters' : 'More Advanced Filters'}</span>
                              <SlidersHorizontal size={14} />
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2 text-[13px] font-medium text-white bg-[#141518] transition-all cursor-pointer min-w-[130px] rounded-xl border ${
                        showStatusDropdown 
                          ? 'border-[#EA580C] ring-2 ring-[#EA580C]' 
                          : 'border-[#2B2D36] hover:border-[#3E414E]'
                      }`}
                    >
                      <span className="truncate">{statusFilter ? statusFilter : 'All Status'}</span>
                      <ChevronDown size={15} className={`text-[#8A8F9E] transition-transform duration-200 shrink-0 ${showStatusDropdown ? 'rotate-180 text-white' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showStatusDropdown && (
                        <>
                          <div className="fixed inset-0 z-[999]" onClick={() => setShowStatusDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 top-full mt-2 w-44 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-[1000] overflow-hidden"
                          >
                            {[
                              { label: 'All Status', value: '' },
                              { label: 'Paid', value: 'Paid' },
                              { label: 'Unpaid', value: 'Unpaid' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setStatusFilter(opt.value);
                                  setShowStatusDropdown(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                  statusFilter === opt.value
                                    ? 'bg-[#222530] text-white'
                                    : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {statusFilter === opt.value && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1 relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B7E8C] pointer-events-none">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-[#141518] border border-[#2B2D36] rounded-xl pl-10 pr-12 py-2 text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C] transition-all placeholder:text-[#6E7079]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                      <kbd className="px-1.5 py-0.5 border border-[#2B2D36] rounded-md bg-[#1D1E24] text-[#8A8F9E] text-[10px] font-medium font-sans">⌘K</kbd>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setImportError(null);
                      setShowImportModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#EA580C] bg-[#1E2026] hover:bg-[#282B33] hover:text-[#FB923C] transition-all px-3 py-2 rounded-xl cursor-pointer shrink-0 active:scale-95 border border-[#2C2F38] shadow-xs"
                  >
                    <Upload size={14} />
                    <span>Import</span>
                  </button>
                </div>

                {/* Expandable Filter Panel */}
                <AnimatePresence>
                  {showFilterPanel && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-b border-[#232427] bg-[#1A1B1F] px-4 py-3 relative z-20"
                    >
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#909299]">
                        {/* Partner / Distributor Filter Dropdown */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-[#707279]">
                            {isSales ? 'Customer' : 'Distributor'}
                          </label>
                          <div className="relative z-30">
                            <button
                              type="button"
                              onClick={() => setShowPartnerFilterDropdown(!showPartnerFilterDropdown)}
                              className="flex items-center justify-between gap-2 px-3 py-1.5 border border-[#2D2E33] rounded-lg text-[12px] font-medium text-[#D5D5D5] bg-[#1C1D21] hover:bg-[#25262B] transition-colors cursor-pointer min-w-[170px]"
                            >
                              <span className="truncate max-w-[140px]">{partnerFilter || `All ${isSales ? 'Customers' : 'Distributors'}`}</span>
                              <ChevronDown size={14} className={`text-[#909299] transition-transform duration-200 ${showPartnerFilterDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {showPartnerFilterDropdown && (
                                <>
                                  <div className="fixed inset-0 z-[999]" onClick={() => setShowPartnerFilterDropdown(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                    className="absolute left-0 top-full mt-1.5 w-60 bg-[#1A1B1F] border border-[#2D2E33] rounded-xl shadow-2xl py-1 z-[1000] max-h-48 overflow-y-auto"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => { setPartnerFilter(''); setShowPartnerFilterDropdown(false); }}
                                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                        !partnerFilter ? 'bg-[#E87A5D1A] text-[#E87A5D] font-medium' : 'text-[#D5D5D5] hover:bg-[#25262B]'
                                      }`}
                                    >
                                      All {isSales ? 'Customers' : 'Distributors'}
                                    </button>
                                    {Array.from(new Set([
                                      ...getStoredPartners().filter(p => isSales ? p.category === 'Customer' : p.category !== 'Customer').map(p => p.name),
                                      ...invoices.map(i => i.partnerName || i.distributor).filter(Boolean)
                                    ])).map((name) => (
                                      <button
                                        key={name}
                                        type="button"
                                        onClick={() => { setPartnerFilter(name); setShowPartnerFilterDropdown(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                          partnerFilter === name ? 'bg-[#E87A5D1A] text-[#E87A5D] font-medium' : 'text-[#D5D5D5] hover:bg-[#25262B]'
                                        }`}
                                      >
                                        {name}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Min Amount Filter */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-[#707279]">Min Amount (Rp)</label>
                          <input
                            type="text"
                            placeholder="e.g. 1000000"
                            value={minAmountFilter}
                            onChange={(e) => setMinAmountFilter(e.target.value)}
                            className="w-32 bg-[#1C1D21] border border-[#2D2E33] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                          />
                        </div>

                        {/* Max Amount Filter */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-[#707279]">Max Amount (Rp)</label>
                          <input
                            type="text"
                            placeholder="e.g. 5000000"
                            value={maxAmountFilter}
                            onChange={(e) => setMaxAmountFilter(e.target.value)}
                            className="w-32 bg-[#1C1D21] border border-[#2D2E33] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                          />
                        </div>

                        {/* Reset Filters */}
                        {activeFilterCount > 0 && (
                          <div className="flex flex-col justify-end self-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSortFilter('');
                                setStatusFilter('');
                                setPartnerFilter('');
                                setMinAmountFilter('');
                                setMaxAmountFilter('');
                                setLocalSearch('');
                              }}
                              className="px-3 py-1 text-xs font-medium text-[#E87A5D] hover:bg-[#E87A5D1A] rounded-lg transition-colors border border-transparent hover:border-[#E87A5D33] cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            );
          })()}

          {/* Table */}
          <div className="overflow-x-auto rounded-b-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232427] bg-[#1A1B1F]">
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>ID</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <div className="flex items-center gap-1.5">
                      <span>{isSales ? 'Customer' : 'Distributor'}</span>
                      <ChevronDown size={14} className="text-[#8E9097]" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>Reference</span>
                  </th>
                  {activeTab === 'Delivery' && (
                    <>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Driver</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Vehicle No.</span>
                      </th>
                    </>
                  )}
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>{activeTab === 'Delivery' ? 'Delivery Date' : 'Due Date'}</span>
                  </th>
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                    <span>Status</span>
                  </th>
                  {activeTab !== 'Delivery' && activeTab !== 'Quotation' && (
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right">
                      <span>Remaining</span>
                    </th>
                  )}
                  {activeTab !== 'Delivery' && (
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right">
                      <span>Total</span>
                    </th>
                  )}
                  <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-center w-28">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'Delivery' ? 8 : activeTab === 'Quotation' ? 7 : 8} className="py-12 text-center text-[#8E9097]">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={36} className="text-[#333] mb-3 animate-pulse" />
                        <p className="text-[13px] text-white font-medium mb-1">No {activeTab}s recorded</p>
                        <p className="text-[11px] text-[#7A7C85] max-w-[280px] mb-4">You have zero {activeTab.toLowerCase()} transactions logged. Add one manually or populate with sample data.</p>
                        <button 
                          onClick={() => setInvoices(invoiceData)}
                          className="text-[11px] font-medium text-white bg-[#1C1D21] hover:bg-[#25262B] border border-[#2D2E33] transition-colors px-3.5 py-1.5 rounded-lg"
                        >
                          Load Sample Data
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleInvoices.map((invoice, index) => {
                    const partnerName = invoice.partnerName || invoice.distributor || 'Distributor / Partner';
                    const isCopied = copiedId === invoice.id;

                    return (
                      <tr 
                        key={`${invoice.id}-${index}`} 
                        onClick={() => handleEditInvoice(invoice)}
                        className={`border-b border-[#202125] last:border-b-0 hover:bg-[#18191D] transition-colors cursor-pointer ${
                          selectedIds.includes(invoice.id) ? 'bg-[#18191D]/80' : ''
                        }`}
                      >
                        {/* Worker ID / Invoice ID */}
                        <td className="py-4 px-4 text-[13px]">
                          <span 
                            className="font-semibold text-white tracking-tight hover:text-[#EA580C] transition-colors cursor-pointer"
                            onMouseEnter={() => handleMouseEnterId(invoice)}
                            onMouseLeave={handleMouseLeaveId}
                          >
                            {invoice.id}
                          </span>
                        </td>

                        {/* Member / Partner Column with Gradient Avatar */}
                        <td className="py-4 px-4 text-[13px]">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(partnerName)} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`}>
                              {partnerName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white text-[13px] truncate">
                              {partnerName}
                            </span>
                          </div>
                        </td>

                        {/* Role / Reference */}
                        <td className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal">
                          {invoice.ref || (isSales ? 'Sales Partner' : 'Distributor Partner')}
                        </td>

                        {/* Driver & Vehicle No for Delivery */}
                        {activeTab === 'Delivery' && (
                          <>
                            <td className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal">
                              {invoice.driver || 'Budi Santoso'}
                            </td>
                            <td className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal">
                              {invoice.vehicleNo || invoice.plateNo || 'B 9123 SQR'}
                            </td>
                          </>
                        )}

                        {/* Date Column */}
                        <td className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal">
                          <span className="text-white text-[13px] font-normal">{formatDateStr(parseDateStr(invoice.date))}</span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 text-[13px]">
                          {renderStatusBadge(invoice.status)}
                        </td>

                        {/* Remaining & Total */}
                        {activeTab !== 'Delivery' && activeTab !== 'Quotation' && (
                          <td className="py-4 px-4 text-[13px] text-[#C5C7CE] text-right font-normal">
                            {formatAmount(invoice.remaining)}
                          </td>
                        )}
                        {activeTab !== 'Delivery' && (
                          <td className="py-4 px-4 text-[13px] text-white font-semibold text-right">
                            {formatAmount(invoice.total)}
                          </td>
                        )}

                        {/* Actions (View eye button matching reference photo) */}
                        <td className="py-4 px-4 text-[13px] text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {activeTab === 'Quotation' && (
                              <>
                                <button
                                  type="button"
                                  title="Move to Delivery"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleConvert(invoice, 'Delivery');
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#EA580C]/20 text-[#EA580C] hover:text-orange-300 border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Truck size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Move to Invoice"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleConvert(invoice, 'Invoice');
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#10B981]/20 text-[#10B981] hover:text-emerald-300 border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <FileText size={14} />
                                </button>
                              </>
                            )}
                            {activeTab === 'Delivery' && (
                              <button
                                type="button"
                                title="Move to Invoice"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSingleConvert(invoice, 'Invoice');
                                }}
                                className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#10B981]/20 text-[#10B981] hover:text-emerald-300 border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <FileText size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              title={isSales ? "View / Edit Sales" : "View / Edit Purchase"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditInvoice(invoice);
                              }}
                              className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#909299] hover:text-white border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>
                            {activeTab !== 'Quotation' && activeTab !== 'Delivery' && (
                              <button
                                type="button"
                                title="Accounting Journal"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingInvoiceId(invoice.id);
                                  setShowAccountingModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#EA580C] hover:text-orange-400 border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <BookOpen size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              title={isSales ? "Delete Sales" : "Delete Purchase"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingInvoiceId(invoice.id);
                                setShowSingleDeleteModal(true);
                              }}
                              className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#F87171] hover:text-rose-400 border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#0A0A0A]">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Coins size={16} className="text-[#E87A5D]" /> Add New {newType} ({isSales ? 'Sales' : 'Purchase'})
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#909090] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddInvoiceSubmit} className="p-6 space-y-4 font-sans text-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">Document Type</label>
                  <select 
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E87A5D]"
                  >
                    <option value="Invoice">Invoice (Settle Ledger & Stock)</option>
                    <option value="Quotation">Quotation (Draft Proposal)</option>
                    <option value="Delivery">Delivery Order</option>
                    <option value="Return">Product Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">Payment Status</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E87A5D]"
                  >
                    <option value="Unpaid">Unpaid (Accounts Payable/Receivable)</option>
                    <option value="Paid">Paid (Cash / Bank Settlement)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">
                  {isSales ? 'Customer / Partner' : 'Distributor'}
                </label>
                <select 
                  required
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E87A5D]"
                >
                  <option value="">-- Select Partner --</option>
                  {getStoredPartners().filter(p => isSales ? p.category === 'Customer' : p.category !== 'Customer').map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.pic})</option>
                  ))}
                  <option value="Other Partner">Direct Walk-in Retail Client</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">Reference / Notes</label>
                <input 
                  type="text" 
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="e.g. Bulk order face cream promo"
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E87A5D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">Transaction Date</label>
                  <input 
                    type="date" 
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E87A5D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E87A5D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#2A2A2A] pt-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">Akun Debit (Dr.)</label>
                  <select
                    value={saveDebitAccount}
                    onChange={(e) => setSaveDebitAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-xs text-white focus:outline-none focus:border-[#E87A5D]"
                  >
                    {coaAccountsList.map(a => (
                      <option key={`quickdeb-${a.code}`} value={a.label}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#909090] uppercase tracking-wider mb-1.5">Akun Kredit (Cr.)</label>
                  <select
                    value={saveCreditAccount}
                    onChange={(e) => setSaveCreditAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-xs text-white focus:outline-none focus:border-[#E87A5D]"
                  >
                    {coaAccountsList.map(a => (
                      <option key={`quickcred-${a.code}`} value={a.label}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-[#2A2A2A] pt-3">
                <h4 className="text-[11px] font-bold text-[#E87A5D] uppercase tracking-wider mb-3">Line Item (Inventory Link)</h4>
                
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6">
                    <label className="block text-[10px] font-medium text-[#909090] mb-1">Select Product</label>
                    <select 
                      value={newSelectedProductId}
                      onChange={(e) => {
                        setNewSelectedProductId(e.target.value);
                        const p = getStoredProducts().find(item => item.id === e.target.value);
                        if (p) {
                          setNewPrice(String(isSales ? p.sellPrice : p.price));
                        }
                      }}
                      className="w-full px-2 py-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-xs text-white focus:outline-none focus:border-[#E87A5D]"
                    >
                      <option value="">-- Choose Product --</option>
                      {getStoredProducts().map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-medium text-[#909090] mb-1">Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-xs text-white focus:outline-none focus:border-[#E87A5D]"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[10px] font-medium text-[#909090] mb-1">Unit Price (Rp)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-xs text-white focus:outline-none focus:border-[#E87A5D]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A2A]">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#909090] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#E87A5D] hover:bg-[#D56A4C] rounded-lg transition-colors shadow-md cursor-pointer"
                >
                  Submit Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
                <div>
                  <h2 className="text-lg font-semibold text-white">Payment Details</h2>
                  <p className="text-xs text-[#909090] mt-0.5">Record incoming payment for selected invoice(s)</p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleProcessPayment}>
                <div className="p-5 space-y-5">
                  <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3.5 space-y-2.5">
                    <h3 className="text-[11px] font-bold text-[#909090] uppercase tracking-wider">Invoice Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#909090] block mb-1">Total Tagihan:</span>
                        <span className="text-white font-semibold font-sans">
                          {formatAmount(paymentInvoices.reduce((sum, i) => sum + i.total, 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#909090] block mb-1">Sisa Tagihan:</span>
                        <span className="text-[#E87A5D] font-semibold font-sans">
                          {formatAmount(paymentInvoices.reduce((sum, i) => sum + i.remaining, 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">Total Amount to Pay</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#909090] text-[13px]">Rp</span>
                      <input 
                        type="number"
                        required
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className={`w-full h-10 pl-9 pr-3 bg-[#0A0A0A] border rounded-lg text-[13px] text-white focus:outline-none transition-colors font-mono ${
                          paymentAmount > paymentInvoices.reduce((sum, i) => sum + i.remaining, 0)
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#2A2A2A] focus:border-[#E87A5D]'
                        }`}
                      />
                    </div>
                    {paymentAmount > paymentInvoices.reduce((sum, i) => sum + i.remaining, 0) ? (
                      <p className="text-[11px] text-red-500 mt-1.5 font-semibold">
                        ⚠️ Jumlah bayar melebihi sisa tagihan!
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#E87A5D] mt-1.5 font-medium">
                        Note: You can change this amount for partial payments.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 font-sans">Bank / Kas Account *</label>
                    <select 
                      value={paymentBank}
                      onChange={(e) => handlePaymentBankChange(e.target.value)}
                      className="w-full h-10 px-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[13px] text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                    >
                      {paymentBankAccounts.map(a => (
                        <option key={`pbank-${a.code}`} value={a.label}>{a.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3 space-y-3">
                    <h3 className="text-[11px] font-semibold text-[#A0A0A0] uppercase tracking-wider">Pratinjau & Ubah Akun Jurnal Pelunasan</h3>
                    <div className="space-y-2.5 text-[12px]">
                      <div>
                        <label className="block text-[11px] text-[#909090] mb-1 font-mono">Akun Debit (Dr.)</label>
                        <select
                          value={paymentDebitAccount}
                          onChange={(e) => setPaymentDebitAccount(e.target.value)}
                          className="w-full h-9 px-2.5 bg-[#141517] border border-[#2A2A2A] rounded-lg text-[12px] text-white focus:outline-none focus:border-[#E87A5D]"
                        >
                          {coaAccountsList.map(a => (
                            <option key={`pdeb-${a.code}`} value={a.label}>{a.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#909090] mb-1 font-mono">Akun Kredit (Cr.)</label>
                        <select
                          value={paymentCreditAccount}
                          onChange={(e) => setPaymentCreditAccount(e.target.value)}
                          className="w-full h-9 px-2.5 bg-[#141517] border border-[#2A2A2A] rounded-lg text-[12px] text-white focus:outline-none focus:border-[#E87A5D]"
                        >
                          {coaAccountsList.map(a => (
                            <option key={`pcred-${a.code}`} value={a.label}>{a.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-[#909090] pt-1">
                        <span>Nominal Pelunasan:</span>
                        <span className="font-mono text-green-400 font-semibold">{formatAmount(paymentAmount || 0)}</span>
                      </div>
                    </div>
                  </div>

                </div>
                <div className="flex items-center justify-end gap-3 p-5 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                  <button 
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-transparent border border-[#2A2A2A] hover:bg-[#1C1C1E] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={paymentAmount <= 0 || paymentAmount > paymentInvoices.reduce((sum, i) => sum + i.remaining, 0)}
                    className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 ${
                      paymentAmount <= 0 || paymentAmount > paymentInvoices.reduce((sum, i) => sum + i.remaining, 0)
                        ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                    }`}
                  >
                    <CheckCircle size={14} /> 
                    Confirm Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#18181A] border border-[#27272A] rounded-[24px] shadow-2xl w-full max-w-md relative z-10 p-6 overflow-hidden text-left"
            >
              {/* Top Header Row */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-full bg-[#3F1D24] text-[#F87171] border border-red-900/30 flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-8 h-8 rounded-full bg-[#27272A] hover:bg-[#3F3F46] transition-colors text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                Delete documents permanently?
              </h2>

              {/* Description */}
              <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
                This will permanently delete <span className="text-white font-medium">{selectedIds.length} selected {selectedIds.length === 1 ? 'item' : 'items'}</span> and all of their data. This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20"
                >
                  Delete Selected
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSingleDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSingleDeleteModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#18181A] border border-[#27272A] rounded-[24px] shadow-2xl w-full max-w-md relative z-10 p-6 overflow-hidden text-left"
            >
              {/* Top Header Row */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-full bg-[#3F1D24] text-[#F87171] border border-red-900/30 flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowSingleDeleteModal(false)}
                  className="w-8 h-8 rounded-full bg-[#27272A] hover:bg-[#3F3F46] transition-colors text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                Delete document permanently?
              </h2>

              {/* Description */}
              <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
                This will permanently delete <span className="text-white font-medium">{editingInvoiceId || 'this document'}</span> and all of its data. This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowSingleDeleteModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteSingle}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20"
                >
                  Delete Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccountingModal && editingInvoiceId && (() => {
          const currentInv = invoices.find(i => i.id === editingInvoiceId);
          if (!currentInv) return null;
          const totalVal = currentInv.total;
          const remainingVal = currentInv.remaining;
          const paidVal = totalVal - remainingVal;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAccountingModal(false)} />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Detail Jurnal Akuntansi</h2>
                    <p className="text-xs text-[#909090] mt-0.5">Entri jurnal otomatis untuk dokumen {currentInv.id}</p>
                  </div>
                  <button 
                    onClick={() => setShowAccountingModal(false)}
                    className="p-1.5 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4">
                    <div>
                      <span className="text-[11px] text-[#909090] block uppercase tracking-wider font-semibold">Total Tagihan</span>
                      <span className="text-white text-base font-semibold font-sans mt-1 block">{formatAmount(totalVal)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#909090] block uppercase tracking-wider font-semibold">Telah Dibayar</span>
                      <span className="text-green-400 text-base font-semibold font-sans mt-1 block">{formatAmount(paidVal)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#909090] block uppercase tracking-wider font-semibold">Sisa Tagihan</span>
                      <span className="text-[#E87A5D] text-base font-semibold font-sans mt-1 block">{formatAmount(remainingVal)}</span>
                    </div>
                  </div>

                  {/* Journal Tables */}
                  <div className="space-y-5">
                    {/* 1. Pengakuan Invoice */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#E87A5D] rounded-full"></span>
                          1. Jurnal Pengakuan Tagihan (Invoicing)
                        </h3>
                        <span className="text-[11px] text-[#909090]">Dapat Disesuaikan</span>
                      </div>
                      <div className="border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#0A0A0A]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#2A2A2A] bg-[#141517] text-[#909090] font-semibold">
                              <th className="py-2.5 px-3">Posisi</th>
                              <th className="py-2.5 px-3">Akun Pilihan</th>
                              <th className="py-2.5 px-3 text-right">Debit</th>
                              <th className="py-2.5 px-3 text-right">Kredit</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-[#2A2A2A]/40 text-white">
                              <td className="py-2 px-3 font-semibold text-green-400">Debit (Dr.)</td>
                              <td className="py-2 px-3">
                                <select
                                  value={currentInv.customDebitAccount || (isSales ? '1200 - Piutang Usaha' : '5100 - Harga Pokok Penjualan')}
                                  onChange={(e) => {
                                    const updated = { ...currentInv, customDebitAccount: e.target.value };
                                    updateInvoice(updated, currentInv);
                                    setInvoices(getStoredInvoices());
                                  }}
                                  className="w-full h-8 px-2 bg-[#141517] border border-[#2A2A2A] rounded text-[11.5px] text-white focus:outline-none focus:border-[#E87A5D]"
                                >
                                  {coaAccountsList.map(a => (
                                    <option key={`mdeb-${a.code}`} value={a.label}>{a.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3 text-right font-sans">{formatAmount(totalVal)}</td>
                              <td className="py-2 px-3 text-right font-sans">-</td>
                            </tr>
                            <tr className="text-white">
                              <td className="py-2 px-3 font-semibold text-red-400">Kredit (Cr.)</td>
                              <td className="py-2 px-3">
                                <select
                                  value={currentInv.customCreditAccount || (isSales ? '4100 - Penjualan Produk' : '2100 - Utang Usaha')}
                                  onChange={(e) => {
                                    const updated = { ...currentInv, customCreditAccount: e.target.value };
                                    updateInvoice(updated, currentInv);
                                    setInvoices(getStoredInvoices());
                                  }}
                                  className="w-full h-8 px-2 bg-[#141517] border border-[#2A2A2A] rounded text-[11.5px] text-white focus:outline-none focus:border-[#E87A5D]"
                                >
                                  {coaAccountsList.map(a => (
                                    <option key={`mcred-${a.code}`} value={a.label}>{a.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3 text-right font-sans">-</td>
                              <td className="py-2 px-3 text-right font-sans">{formatAmount(totalVal)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. Jurnal Pembayaran */}
                    {paidVal > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          2. Jurnal Pelunasan / Pembayaran (Payment)
                        </h3>
                        <div className="border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#0A0A0A]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-[#2A2A2A] bg-[#141517] text-[#909090] font-semibold">
                                <th className="py-2.5 px-3">Posisi</th>
                                <th className="py-2.5 px-3">Akun Pilihan</th>
                                <th className="py-2.5 px-3 text-right">Debit</th>
                                <th className="py-2.5 px-3 text-right">Kredit</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-[#2A2A2A]/40 text-white">
                                <td className="py-2 px-3 font-semibold text-green-400">Debit (Dr.)</td>
                                <td className="py-2 px-3">
                                  <select
                                    value={currentInv.customPaymentDebitAccount || (isSales ? ((currentInv.paymentBank || paymentBank) === 'Cash' ? '1120 - Kas di Toko' : '1130 - Bank BCA') : '2100 - Utang Usaha')}
                                    onChange={(e) => {
                                      const updated = { ...currentInv, customPaymentDebitAccount: e.target.value };
                                      updateInvoice(updated, currentInv);
                                      setInvoices(getStoredInvoices());
                                    }}
                                    className="w-full h-8 px-2 bg-[#141517] border border-[#2A2A2A] rounded text-[11.5px] text-white focus:outline-none focus:border-[#E87A5D]"
                                  >
                                    {coaAccountsList.map(a => (
                                      <option key={`mpdeb-${a.code}`} value={a.label}>{a.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-3 text-right font-sans text-green-400">{formatAmount(paidVal)}</td>
                                <td className="py-2 px-3 text-right font-sans">-</td>
                              </tr>
                              <tr className="text-white">
                                <td className="py-2 px-3 font-semibold text-red-400">Kredit (Cr.)</td>
                                <td className="py-2 px-3">
                                  <select
                                    value={currentInv.customPaymentCreditAccount || (isSales ? '1200 - Piutang Usaha' : ((currentInv.paymentBank || paymentBank) === 'Cash' ? '1120 - Kas di Toko' : '1130 - Bank BCA'))}
                                    onChange={(e) => {
                                      const updated = { ...currentInv, customPaymentCreditAccount: e.target.value };
                                      updateInvoice(updated, currentInv);
                                      setInvoices(getStoredInvoices());
                                    }}
                                    className="w-full h-8 px-2 bg-[#141517] border border-[#2A2A2A] rounded text-[11.5px] text-white focus:outline-none focus:border-[#E87A5D]"
                                  >
                                    {coaAccountsList.map(a => (
                                      <option key={`mpcred-${a.code}`} value={a.label}>{a.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-3 text-right font-sans">-</td>
                                <td className="py-2 px-3 text-right font-sans text-red-400">{formatAmount(paidVal)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-5 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                  <button 
                    type="button"
                    onClick={() => setShowAccountingModal(false)}
                    className="px-5 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
                <div>
                  <h2 className="text-lg font-semibold text-white">Import</h2>
                  <p className="text-xs text-[#909090] mt-0.5">Upload a CSV file containing your {isSales ? 'sales' : 'purchase'} details to instantly draft a document.</p>
                </div>
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Download Template Card */}
                <div className="flex items-center justify-between p-4 bg-[#1C1C1E] border border-[#2A2A2A] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E87A5D]/10 flex items-center justify-center text-[#E87A5D]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-semibold text-white">{isSales ? 'Sales' : 'Purchase'} CSV Template</h4>
                      <p className="text-[10.5px] text-[#909090]">Use this standard template to structure your invoice details</p>
                    </div>
                  </div>
                  <button 
                    onClick={downloadCSVTemplate}
                    className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold text-white bg-[#0A0A0A] border border-[#2A2A2A] hover:bg-[#1C1C1C] hover:border-[#E87A5D] transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Download size={13} /> Download Template
                  </button>
                </div>

                {/* Upload Zone */}
                <div 
                  onClick={() => importFileInputRef.current?.click()}
                  className="border border-dashed border-[#2A2A2A] rounded-xl p-8 flex flex-col items-center justify-center hover:bg-[#1C1C1E]/30 hover:border-[#E87A5D]/40 transition-all cursor-pointer text-center group bg-[#0A0A0A]/20"
                >
                  <input 
                    type="file" 
                    ref={importFileInputRef}
                    accept=".csv"
                    className="sr-only"
                    onChange={handleImportFileChange}
                  />
                  <Upload size={32} className="text-[#606060] group-hover:text-[#E87A5D] transition-colors mb-3" />
                  <span className="text-sm font-medium text-white mb-1">Click to browse or drop CSV here</span>
                  <span className="text-xs text-[#606060]">Supports {isSales ? 'sales' : 'purchase'} invoice standard template files (.csv)</span>
                </div>

                {/* Error Box */}
                {importError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div className="space-y-0.5 leading-snug">
                      <p className="text-[12px] font-semibold">Import Error</p>
                      <p className="text-[11px] text-[#d48c8c]">{importError}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                <button 
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-transparent border border-[#2A2A2A] hover:bg-[#1C1C1E] rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Preview Hover Popup Modal */}
        {quickPreviewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/75 backdrop-blur-sm" 
              onClick={() => setQuickPreviewInvoice(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 px-5 border-b border-[#2A2A2A] bg-[#0A0A0A]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E87A5D]/10 text-[#E87A5D] flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-white">{quickPreviewInvoice.id}</h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        quickPreviewInvoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        quickPreviewInvoice.status === 'Partially Paid' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {quickPreviewInvoice.status || 'Unpaid'}
                      </span>
                    </div>
                    <p className="text-xs text-[#909090] mt-0.5">Quick Document Preview</p>
                  </div>
                </div>
                <button 
                  onClick={() => setQuickPreviewInvoice(null)}
                  className="p-1.5 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Document Paper Body */}
              <div className="p-5 overflow-y-auto bg-[#0A0A0A] flex-1">
                <div className="bg-white rounded-lg p-6 text-gray-900 shadow-xl font-sans text-left border border-gray-100">
                  {/* Company & Doc Header */}
                  {(() => {
                    const company = getCompanySettings();
                    return (
                      <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            {company.companyLogo ? (
                              <img src={company.companyLogo} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white text-xs">
                                {company.companyName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 leading-tight">{company.companyAddress}</p>
                          <p className="text-[11px] text-gray-500">{company.companyEmail}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded mb-1">
                            {quickPreviewInvoice.type || (isSales ? 'Sales' : 'Purchase')}
                          </span>
                          <p className="text-xs font-bold text-gray-900">{quickPreviewInvoice.id}</p>
                          {quickPreviewInvoice.ref && (
                            <p className="text-[11px] text-gray-500 mt-0.5">No. Ref: {quickPreviewInvoice.ref}</p>
                          )}
                          <p className="text-[11px] text-gray-500 mt-0.5">Tanggal: {quickPreviewInvoice.date}</p>
                          {quickPreviewInvoice.due && (
                            <p className="text-[11px] text-gray-500">Jatuh Tempo: {quickPreviewInvoice.due}</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Partner Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1">
                        {isSales ? 'Bill to / Customer' : 'Bill from / Distributor'}
                      </p>
                      <p className="font-bold text-gray-900">{quickPreviewInvoice.partnerName || quickPreviewInvoice.distributor || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Document</p>
                      <p className="text-base font-bold text-emerald-600">Rp {quickPreviewInvoice.total || '0'}</p>
                      {quickPreviewInvoice.remaining !== undefined && quickPreviewInvoice.remaining !== '0' && (
                        <p className="text-[11px] text-red-500 mt-0.5 font-medium">Sisa: Rp {quickPreviewInvoice.remaining}</p>
                      )}
                    </div>
                  </div>

                  {/* Reference (Plain text directly above table) */}
                  {quickPreviewInvoice.ref && (
                    <div className="mb-2 text-[11px] text-gray-700 font-medium">
                      <span className="text-gray-500 font-normal">No. Referensi:</span> <span className="font-semibold text-gray-900">{quickPreviewInvoice.ref}</span>
                    </div>
                  )}

                  {/* Line items if available */}
                  {quickPreviewInvoice.items && quickPreviewInvoice.items.length > 0 ? (
                    <div className="border border-gray-100 rounded overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-[10px] text-gray-500 font-semibold uppercase">
                          <tr>
                            <th className="py-2 px-3">Item / Deskripsi</th>
                            <th className="py-2 px-2 text-center w-12">Qty</th>
                            <th className="py-2 px-3 text-right">Harga</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {quickPreviewInvoice.items.map((it: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 text-gray-800">{it.description || it.productId || 'Item'}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{it.qty || 1}</td>
                              <td className="py-2 px-3 text-right text-gray-800">Rp {formatAmount(it.price || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">Catatan Referensi:</span> {quickPreviewInvoice.ref || 'Rincian transaksi resmi tercatat.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-3 p-4 px-5 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                <button 
                  type="button"
                  onClick={() => setQuickPreviewInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#D5D5D5] bg-transparent border border-[#2A2A2A] hover:bg-[#1C1C1E] rounded-lg transition-colors cursor-pointer"
                >
                  Tutup Preview
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handlePrintDocument(quickPreviewInvoice)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2A2B30] hover:bg-[#34363F] border border-[#3A3D4A] rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer size={14} className="text-[#EA580C]" />
                    <span>Cetak Surat</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const inv = quickPreviewInvoice;
                      setQuickPreviewInvoice(null);
                      handleEditInvoice(inv);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#E87A5D] hover:bg-[#d46b4f] rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#E87A5D]/20"
                  >
                    <ExternalLink size={14} />
                    Buka Dokumen Lengkap
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Partner Modal */}
      <AnimatePresence>
        {showAddPartnerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#18191E] border border-[#2C2F3A] rounded-2xl p-6 shadow-2xl text-white space-y-5 font-sans"
            >
              <div className="flex items-center justify-end pb-3 border-b border-[#2C2F3A]">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="p-1.5 hover:bg-[#22242C] rounded-lg transition-colors text-[#8E9099] hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveNewPartner} className="space-y-4">
                {/* Upload Foto / Logo Partner */}
                <div>
                  <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Foto Profile / Logo Partner</label>
                  <div className="flex items-center gap-4 p-3 bg-[#121316] border border-[#2B2D38] rounded-xl">
                    <div className="w-14 h-14 rounded-xl bg-[#1D1F27] border border-[#2F3240] overflow-hidden flex items-center justify-center shrink-0 relative">
                      {addPartnerImage ? (
                        <img src={addPartnerImage} alt="Partner Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-[#6E7079]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#22242C] hover:bg-[#2B2D38] border border-[#3A3D4A] rounded-lg cursor-pointer transition-colors">
                          <Upload size={13} />
                          <span>{addPartnerImage ? 'Ganti Foto' : 'Upload Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setAddPartnerImage(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {addPartnerImage && (
                          <button
                            type="button"
                            onClick={() => setAddPartnerImage('')}
                            className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg font-medium transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6E7079] mt-1.5">Format foto: JPG, PNG, WEBP. Maksimal 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">
                      Nama Perusahaan / Display Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addPartnerName}
                      onChange={(e) => setAddPartnerName(e.target.value)}
                      placeholder="e.g. PT. Sumber Makmur Jaya"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">ID / Kode Partner</label>
                    <input
                      type="text"
                      value={addPartnerNumber}
                      onChange={(e) => setAddPartnerNumber(e.target.value)}
                      placeholder="e.g. CST-001"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Contact Person (PIC)</label>
                    <input
                      type="text"
                      value={addPartnerPic}
                      onChange={(e) => setAddPartnerPic(e.target.value)}
                      placeholder="e.g. Budi Santoso"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Nomor Telepon / HP</label>
                    <input
                      type="text"
                      value={addPartnerPhone}
                      onChange={(e) => setAddPartnerPhone(e.target.value)}
                      placeholder="e.g. 081234567890"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Email</label>
                    <input
                      type="email"
                      value={addPartnerEmail}
                      onChange={(e) => setAddPartnerEmail(e.target.value)}
                      placeholder="e.g. kontak@sumbermakmur.com"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Nomor NPWP / Tax ID</label>
                    <input
                      type="text"
                      value={addPartnerNpwp}
                      onChange={(e) => setAddPartnerNpwp(e.target.value)}
                      placeholder="e.g. 01.234.567.8-012.000"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Saldo Awal (Rp)</label>
                    <input
                      type="number"
                      value={addPartnerBalance}
                      onChange={(e) => setAddPartnerBalance(e.target.value)}
                      placeholder="0"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    value={addPartnerAddress}
                    onChange={(e) => setAddPartnerAddress(e.target.value)}
                    placeholder="Alamat kantor / gudang pengiriman..."
                    className="w-full p-3 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all resize-none placeholder:text-[#5E606A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2F3A]">
                  <button
                    type="button"
                    onClick={() => setShowAddPartnerModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#22242C] hover:bg-[#2B2D38] border border-[#3A3D4A] rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-xl transition-colors cursor-pointer shadow-lg shadow-[#EA580C]/20 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    <span>Simpan Partner</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Product Modal */}
      <AnimatePresence>
        {showAddProductModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#18191E] border border-[#2C2F3A] rounded-2xl p-6 shadow-2xl text-white space-y-5 font-sans"
            >
              <div className="flex items-center justify-end pb-3 border-b border-[#2C2F3A]">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="p-1.5 hover:bg-[#22242C] rounded-lg transition-colors text-[#8E9099] hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveNewProduct} className="space-y-4">
                {/* Upload Foto Produk */}
                <div>
                  <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Foto Produk</label>
                  <div className="flex items-center gap-4 p-3 bg-[#121316] border border-[#2B2D38] rounded-xl">
                    <div className="w-16 h-16 rounded-xl bg-[#1D1F27] border border-[#2F3240] overflow-hidden flex items-center justify-center shrink-0 relative">
                      {addProductImage ? (
                        <img src={addProductImage} alt="Product Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={26} className="text-[#6E7079]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#22242C] hover:bg-[#2B2D38] border border-[#3A3D4A] rounded-lg cursor-pointer transition-colors">
                          <Upload size={13} />
                          <span>{addProductImage ? 'Ganti Foto' : 'Upload Foto Produk'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setAddProductImage(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {addProductImage && (
                          <button
                            type="button"
                            onClick={() => setAddProductImage('')}
                            className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg font-medium transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6E7079] mt-1.5">Format foto: JPG, PNG, WEBP. Maksimal 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">
                      Nama Produk <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addProductName}
                      onChange={(e) => setAddProductName(e.target.value)}
                      placeholder="e.g. Serene Glow Sunscreen SPF 50"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  {/* Kategori Custom Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Kategori</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProdCategoryDropdown(!showProdCategoryDropdown);
                        setShowProdBrandDropdown(false);
                      }}
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all flex items-center justify-between text-left cursor-pointer hover:border-[#3A3D4A]"
                    >
                      <span>{addProductCategory || 'Pilih Kategori'}</span>
                      <ChevronDown size={14} className="text-[#8E9099]" />
                    </button>

                    <AnimatePresence>
                      {showProdCategoryDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              setShowProdCategoryDropdown(false);
                              setIsAddingProdCategory(false);
                              setNewProdCategoryInput('');
                              setProdCategorySearch('');
                            }}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                          >
                            <div className="p-2 mb-1 border-b border-[#262830] flex items-center gap-2 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                              <Search size={14} className="text-[#8A8F9E] shrink-0" />
                              <input
                                type="text"
                                value={prodCategorySearch}
                                onChange={(e) => setProdCategorySearch(e.target.value)}
                                placeholder="Cari kategori..."
                                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                              />
                              {prodCategorySearch && (
                                <button
                                  type="button"
                                  onClick={() => setProdCategorySearch('')}
                                  className="text-[#8A8F9E] hover:text-white shrink-0"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                              {getProductCategories()
                                .filter(cat => cat.toLowerCase().includes(prodCategorySearch.toLowerCase()))
                                .map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                      setAddProductCategory(cat);
                                      setShowProdCategoryDropdown(false);
                                      setProdCategorySearch('');
                                    }}
                                    className={`w-full text-left px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                      addProductCategory === cat
                                        ? 'bg-[#222530] text-white font-semibold'
                                        : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                    }`}
                                  >
                                    <span>{cat}</span>
                                    {addProductCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
                                  </button>
                                ))}
                            </div>

                            {!isAddingProdCategory ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsAddingProdCategory(true);
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Tambah Kategori Baru</span>
                              </button>
                            ) : (
                              <div className="p-2 border-t border-[#262830] mt-1 flex items-center gap-1.5 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={newProdCategoryInput}
                                  onChange={(e) => setNewProdCategoryInput(e.target.value)}
                                  placeholder="Nama kategori..."
                                  className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const trimmed = newProdCategoryInput.trim();
                                      if (trimmed) {
                                        setCustomCategoryList(prev => [...prev, trimmed]);
                                        setAddProductCategory(trimmed);
                                        setNewProdCategoryInput('');
                                        setIsAddingProdCategory(false);
                                        setShowProdCategoryDropdown(false);
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = newProdCategoryInput.trim();
                                    if (trimmed) {
                                      setCustomCategoryList(prev => [...prev, trimmed]);
                                      setAddProductCategory(trimmed);
                                      setNewProdCategoryInput('');
                                      setIsAddingProdCategory(false);
                                      setShowProdCategoryDropdown(false);
                                    }
                                  }}
                                  className="p-1 bg-[#EA580C] hover:bg-[#C2410C] rounded-lg text-white cursor-pointer transition-colors"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingProdCategory(false);
                                    setNewProdCategoryInput('');
                                  }}
                                  className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Merek / Brand Custom Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Merek / Brand</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProdBrandDropdown(!showProdBrandDropdown);
                        setShowProdCategoryDropdown(false);
                      }}
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all flex items-center justify-between text-left cursor-pointer hover:border-[#3A3D4A]"
                    >
                      <span>{addProductBrand || 'Pilih Merek / Brand'}</span>
                      <ChevronDown size={14} className="text-[#8E9099]" />
                    </button>

                    <AnimatePresence>
                      {showProdBrandDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              setShowProdBrandDropdown(false);
                              setIsAddingProdBrand(false);
                              setNewProdBrandInput('');
                              setProdBrandSearch('');
                            }}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                          >
                            <div className="p-2 mb-1 border-b border-[#262830] flex items-center gap-2 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                              <Search size={14} className="text-[#8A8F9E] shrink-0" />
                              <input
                                type="text"
                                value={prodBrandSearch}
                                onChange={(e) => setProdBrandSearch(e.target.value)}
                                placeholder="Cari brand..."
                                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                              />
                              {prodBrandSearch && (
                                <button
                                  type="button"
                                  onClick={() => setProdBrandSearch('')}
                                  className="text-[#8A8F9E] hover:text-white shrink-0"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                              {getProductBrands()
                                .filter(b => b.toLowerCase().includes(prodBrandSearch.toLowerCase()))
                                .map((b) => (
                                  <button
                                    key={b}
                                    type="button"
                                    onClick={() => {
                                      setAddProductBrand(b);
                                      setShowProdBrandDropdown(false);
                                      setProdBrandSearch('');
                                    }}
                                    className={`w-full text-left px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                      addProductBrand === b
                                        ? 'bg-[#222530] text-white font-semibold'
                                        : 'text-[#D5D5D5] hover:bg-[#20222B] hover:text-white'
                                    }`}
                                  >
                                    <span>{b}</span>
                                    {addProductBrand === b && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
                                  </button>
                                ))}
                            </div>

                            {!isAddingProdBrand ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsAddingProdBrand(true);
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 text-[#EA580C] hover:bg-[#20222B] border-t border-[#262830] mt-1 cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Tambah Brand Baru</span>
                              </button>
                            ) : (
                              <div className="p-2 border-t border-[#262830] mt-1 flex items-center gap-1.5 bg-[#1B1D24] rounded-xl" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={newProdBrandInput}
                                  onChange={(e) => setNewProdBrandInput(e.target.value)}
                                  placeholder="Nama brand..."
                                  className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const trimmed = newProdBrandInput.trim();
                                      if (trimmed) {
                                        setCustomBrandList(prev => [...prev, trimmed]);
                                        setAddProductBrand(trimmed);
                                        setNewProdBrandInput('');
                                        setIsAddingProdBrand(false);
                                        setShowProdBrandDropdown(false);
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = newProdBrandInput.trim();
                                    if (trimmed) {
                                      setCustomBrandList(prev => [...prev, trimmed]);
                                      setAddProductBrand(trimmed);
                                      setNewProdBrandInput('');
                                      setIsAddingProdBrand(false);
                                      setShowProdBrandDropdown(false);
                                    }
                                  }}
                                  className="p-1 bg-[#EA580C] hover:bg-[#C2410C] rounded-lg text-white cursor-pointer transition-colors"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingProdBrand(false);
                                    setNewProdBrandInput('');
                                  }}
                                  className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">SKU / Barcode</label>
                    <input
                      type="text"
                      value={addProductSku}
                      onChange={(e) => setAddProductSku(e.target.value)}
                      placeholder="e.g. SKU/82910"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Satuan (Unit)</label>
                    <select
                      value={addProductUnit}
                      onChange={(e) => setAddProductUnit(e.target.value)}
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all"
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Box">Box</option>
                      <option value="Botol">Botol</option>
                      <option value="Pack">Pack</option>
                      <option value="Tube">Tube</option>
                      <option value="Sachet">Sachet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Harga Beli / Modal (HPP)</label>
                    <input
                      type="number"
                      value={addProductPrice}
                      onChange={(e) => setAddProductPrice(e.target.value)}
                      placeholder="100000"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Harga Jual</label>
                    <input
                      type="number"
                      value={addProductSellPrice}
                      onChange={(e) => setAddProductSellPrice(e.target.value)}
                      placeholder="150000"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Stok Awal</label>
                    <input
                      type="number"
                      value={addProductStock}
                      onChange={(e) => setAddProductStock(e.target.value)}
                      placeholder="100"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A2AC] mb-1.5">Batas Stok Minimum</label>
                    <input
                      type="number"
                      value={addProductMinStock}
                      onChange={(e) => setAddProductMinStock(e.target.value)}
                      placeholder="10"
                      className="w-full h-10 px-3.5 bg-[#121316] border border-[#2B2D38] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] transition-all placeholder:text-[#5E606A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2F3A]">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#22242C] hover:bg-[#2B2D38] border border-[#3A3D4A] rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#D97706] rounded-xl transition-colors cursor-pointer shadow-lg shadow-[#EA580C]/20 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    <span>Simpan Produk</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
