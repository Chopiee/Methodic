import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredCosts, registerNewCost, deleteCost, getStoredPartners, saveCosts, CostItem, getStoredLedger, getIdPrefixSettings, getStoredAccounts } from '../lib/state';
import { setHasUnsavedChanges } from '../lib/unsaved';
import { 
  HelpCircle, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Search, 
  Percent, 
  Receipt, 
  ShoppingBag, 
  Hash, 
  Tag, 
  Calendar, 
  CreditCard, 
  Coins, 
  Info,
  ArrowLeft,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  X,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit3,
  BookOpen,
  Eye,
  MoreVertical
} from 'lucide-react';

const getMonthName = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
};

const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-amber-300 via-rose-300 to-pink-400',
    'from-emerald-300 via-teal-400 to-cyan-500',
    'from-rose-300 via-red-400 to-pink-500',
    'from-amber-300 via-orange-400 to-red-500',
    'from-amber-200 via-orange-400 to-amber-600',
    'from-blue-300 via-[#EA580C] to-indigo-400'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
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

const getNextCostNo = (costList: any[]) => {
  const prefix = getIdPrefixSettings().costPrefix || 'CST-';
  let max = 0;
  if (Array.isArray(costList)) {
    costList.forEach((c: any) => {
      if (c && c.id) {
        const cleanId = String(c.id).replace(/\s+/g, '');
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

const initialCostTransactions: any[] = [
  { id: 'CST-001', category: 'Procurement', penerima: 'PT Jaya Mandiri', desc: 'Pembelian Bahan Baku Tekstil', date: '10/07/2026', amount: 15500000, method: 'Bank BCA', status: 'Approved' },
  { id: 'CST-002', category: 'Marketing', penerima: 'Meta Ads Indonesia', desc: 'Kampanye Iklan Digital Q3', date: '12/07/2026', amount: 4800000, method: 'Credit Card', status: 'Approved' },
  { id: 'CST-003', category: 'Operational', penerima: 'Gedung Graha Utama', desc: 'Sewa Kantor & Utilities Bulan Juli', date: '13/07/2026', amount: 8200000, method: 'Bank Mandiri', status: 'Approved' }
];

export function Cost() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>(() => {
    const stored = getStoredCosts();
    if (stored.length === 5 && stored[0].id === 'CST-2091') {
      return [];
    }
    return stored;
  });

  React.useEffect(() => {
    const stored = getStoredCosts();
    if (stored.length === 5 && stored[0].id === 'CST-2091') {
      saveCosts([]);
      setTransactions([]);
    }
  }, []);

  // Mode View State
  const [view, setView] = useState<'list' | 'create'>('list');

  React.useEffect(() => {
    setHasUnsavedChanges(view === 'create');
  }, [view]);

  // Date Range Picker States
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date>(new Date(2026, 0, 1)); // 1 Jan 2026
  const [rangeEnd, setRangeEnd] = useState<Date>(new Date(2026, 11, 31)); // 31 Dec 2026

  // For the active selection process inside the calendar
  const [tempStart, setTempStart] = useState<Date | null>(new Date(2026, 0, 1));
  const [tempEnd, setTempEnd] = useState<Date | null>(new Date(2026, 11, 31));

  // Current left calendar view date: January 2026
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date(2026, 0, 1)); // Jan 2026
  
  // Selected preset state
  const [selectedPreset, setSelectedPreset] = useState<string>('This year');

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
    const today = new Date(2026, 6, 8); // Mocking Today as July 8, 2026 to fit context
    let start = new Date(today);
    let end = new Date(today);

    switch (preset) {
      case 'Today':
        start = new Date(2026, 6, 8);
        end = new Date(2026, 6, 8);
        break;
      case 'Yesterday':
        start = new Date(2026, 6, 7);
        end = new Date(2026, 6, 7);
        break;
      case 'This week':
        start = new Date(2026, 6, 6);
        end = new Date(2026, 6, 12);
        break;
      case 'Last week':
        start = new Date(2026, 5, 29);
        end = new Date(2026, 6, 5);
        break;
      case 'This month':
        start = new Date(2026, 6, 1);
        end = new Date(2026, 6, 31);
        break;
      case 'Last month':
        start = new Date(2026, 5, 1);
        end = new Date(2026, 5, 30);
        break;
      case 'This year':
        start = new Date(2026, 0, 1);
        end = new Date(2026, 11, 31);
        break;
      case 'Last year':
        start = new Date(2025, 6, 7);
        end = new Date(2026, 6, 7);
        break;
      case 'All time':
        start = new Date(2024, 0, 1);
        end = new Date(2026, 6, 8);
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
              btnClass += " text-white hover:bg-[#181C26] cursor-pointer";
            } else {
              btnClass += " text-[#3F4654] hover:text-[#7E8592] cursor-pointer";
            }

            return (
              <div key={idx} className={wrapperClass}>
                <button 
                  type="button"
                  onClick={() => handleDayClick(cell.date)}
                  className={btnClass}
                >
                  {cell.date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // "Tambah Biaya" (Create Cost) Form States
  const [dibayarDari, setDibayarDari] = useState('1120 Kas di Toko');
  const [showDibayarDariDropdown, setShowDibayarDariDropdown] = useState(false);
  const [bayarNanti, setBayarNanti] = useState(false);
  const [penerima, setPenerima] = useState('');
  const [showPenerimaDropdown, setShowPenerimaDropdown] = useState(false);
  const [penerimaSearch, setPenerimaSearch] = useState('');
  const [tglTransaksi, setTglTransaksi] = useState('2026-07-13');
  const [showTglTransaksiCalendar, setShowTglTransaksiCalendar] = useState(false);
  const [tglTransaksiViewDate, setTglTransaksiViewDate] = useState<Date>(new Date(2026, 6, 13));
  const [nomor, setNomor] = useState('');
  const [referensi, setReferensi] = useState('');
  const [tag, setTag] = useState('Operational');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagOptions, setTagOptions] = useState([
    { value: 'Operational', label: 'Operational' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Procurement', label: 'Procurement' }
  ]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const handleAddCategorySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    const exists = tagOptions.some(opt => opt.value.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setTagOptions(prev => [...prev, { value: trimmed, label: trimmed }]);
    }
    setTag(trimmed);
    setNewCategoryInput('');
    setShowAddCategoryModal(false);
  };
  const [hargaTermasukPajak, setHargaTermasukPajak] = useState(false);
  
  // Line items state
  const [lineItems, setLineItems] = useState<Array<{
    id: number;
    account: string;
    description: string;
    tax: string; // e.g. 'Tanpa Pajak', 'PPN 11%', 'PPH 23'
    amount: number;
    showAccountDropdown?: boolean;
    accountSearch?: boolean;
    showTaxDropdown?: boolean;
  }>>([
    { id: Date.now(), account: '', description: '', tax: 'Tanpa Pajak', amount: 0 }
  ]);

  const [activeTaxDropdownIdx, setActiveTaxDropdownIdx] = useState<number | null>(null);
  const [taxDropdownCoords, setTaxDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [activeAccountDropdownIdx, setActiveAccountDropdownIdx] = useState<number | null>(null);
  const [accountDropdownCoords, setAccountDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [accountSearchTerms, setAccountSearchTerms] = useState<Record<number, string>>({});

  // Bottom accordions & elements
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [journalModalCost, setJournalModalCost] = useState<CostItem | null>(null);
  const [showAccountingModal, setShowAccountingModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState<boolean>(false);

  const [pesan, setPesan] = useState('');
  const [showPesan, setShowPesan] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [showAttachment, setShowAttachment] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [pemotonganActive, setPemotonganActive] = useState(false);
  const [pemotonganAmount, setPemotonganAmount] = useState('0');

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

            const isToday = cell.date.getFullYear() === 2026 && cell.date.getMonth() === 6 && cell.date.getDate() === 13;

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

  // Stats calculation
  const filteredByDateTransactions = transactions.filter(t => {
    const tDate = parseDateStr(t.date);
    const dStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    const dEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
    const dTx = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
    return dTx >= dStart && dTx <= dEnd;
  });

  const totalCost = filteredByDateTransactions.reduce((sum, t) => {
    const amt = typeof t.amount === 'number' ? t.amount : Number(String(t.amount).replace(/[^0-9]/g, ''));
    return sum + amt;
  }, 0);

  const procurementCost = filteredByDateTransactions.filter(t => t.category === 'Procurement').reduce((sum, t) => {
    const amt = typeof t.amount === 'number' ? t.amount : Number(String(t.amount).replace(/[^0-9]/g, ''));
    return sum + amt;
  }, 0);

  const marketingCost = filteredByDateTransactions.filter(t => t.category === 'Marketing').reduce((sum, t) => {
    const amt = typeof t.amount === 'number' ? t.amount : Number(String(t.amount).replace(/[^0-9]/g, ''));
    return sum + amt;
  }, 0);

  const operationalCost = filteredByDateTransactions.filter(t => t.category === 'Operational').reduce((sum, t) => {
    const amt = typeof t.amount === 'number' ? t.amount : Number(String(t.amount).replace(/[^0-9]/g, ''));
    return sum + amt;
  }, 0);

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const dynamicStats = [
    { title: 'Total Expenditures', value: formatRupiah(totalCost), change: '+5.4%', trend: 'up', icon: TrendingDown, prev: formatRupiah(40250000) },
    { title: 'Procurement Cost', value: formatRupiah(procurementCost), change: '-4.2%', trend: 'down', icon: ShoppingBag, prev: formatRupiah(29350000) },
    { title: 'Marketing Expenses', value: formatRupiah(marketingCost), change: '+22.5%', trend: 'up', icon: Percent, prev: formatRupiah(6880000) },
    { title: 'Other Operational Cost', value: formatRupiah(operationalCost), change: '+1.8%', trend: 'up', icon: Receipt, prev: formatRupiah(8540000) }
  ];

  const [allAccounts, setAllAccounts] = useState(() => getStoredAccounts());

  React.useEffect(() => {
    const handleAccountsUpdate = () => {
      setAllAccounts(getStoredAccounts());
    };
    const handleCostsUpdate = () => {
      setTransactions(getStoredCosts());
    };
    window.addEventListener('accounts-updated', handleAccountsUpdate);
    window.addEventListener('costs-updated', handleCostsUpdate);
    return () => {
      window.removeEventListener('accounts-updated', handleAccountsUpdate);
      window.removeEventListener('costs-updated', handleCostsUpdate);
    };
  }, []);

  // Paid From Accounts (Hanya Akun dengan Saldo Normal Debit & Sub Kategori Cash/Bank)
  const paidFromAccounts = React.useMemo(() => {
    const cashAccs = allAccounts.filter(a => {
      if (a.isHeader) return false;

      // Harus saldo normal Debit (bukan Kredit)
      const isDebit = a.normalBal !== 'Kredit';

      // Harus sub-kategori Cash atau Bank (bukan sekedar nama)
      const subLower = (a.subCategory || '').toLowerCase().trim();
      const isCashOrBankSub = subLower === 'cash' || subLower === 'bank';

      return isDebit && isCashOrBankSub;
    });

    if (cashAccs.length > 0) {
      return cashAccs.map(a => `${a.code} ${a.name}`);
    }

    return [
      '1110 Kas Kecil',
      '1120 Kas di Toko',
      '1130 Bank BCA',
      '1140 Bank Mandiri'
    ];
  }, [allAccounts]);

  // Expense Accounts - Beban Operasional (Kelompok 5000 & 6000)
  const expenseAccounts = React.useMemo(() => {
    const expAccs = allAccounts.filter(a => !a.isHeader && (a.category === 'Beban' || a.category === 'HPP' || a.code.startsWith('6') || a.code.startsWith('5')));
    if (expAccs.length > 0) {
      return expAccs.map(a => `${a.code} ${a.name}`);
    }
    return [
      '6100 Beban Gaji',
      '6110 Beban Sewa',
      '6120 Beban Listrik & Air',
      '6130 Beban Internet',
      '6140 Beban Iklan & Promosi',
      '6150 Beban Pengiriman',
      '6160 Beban Administrasi Bank',
      '6170 Beban Penyusutan',
      '6180 Beban ATK',
      '6190 Beban Lain-lain'
    ];
  }, [allAccounts]);

  const getFilteredExpenseAccounts = (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return expenseAccounts;
    const term = searchTerm.toLowerCase().trim();
    return expenseAccounts.filter(acc => acc.toLowerCase().includes(term));
  };

  // Tags/Category mapping options handled in state above

  // Toggle Add row
  const handleAddRow = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now() + Math.random(), account: '', description: '', tax: 'Tanpa Pajak', amount: 0 }
    ]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (lineItems.length === 1) {
      setLineItems([{ id: Date.now(), account: '', description: '', tax: 'Tanpa Pajak', amount: 0 }]);
    } else {
      setLineItems(lineItems.filter((_, idx) => idx !== index));
    }
  };

  // Update line item property
  const updateLineItem = (index: number, key: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [key]: value };
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const calculatePPN = () => {
    let ppnTotal = 0;
    lineItems.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.tax === 'PPN 11%') {
        if (hargaTermasukPajak) {
          ppnTotal += amt * (11 / 111);
        } else {
          ppnTotal += amt * 0.11;
        }
      }
    });
    return ppnTotal;
  };

  const calculatePPH = () => {
    let pphTotal = 0;
    lineItems.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.tax === 'PPH 23') {
        pphTotal += amt * 0.02;
      }
    });
    return pphTotal;
  };

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const ppn = hargaTermasukPajak ? 0 : calculatePPN();
    const pph = calculatePPH();
    const deduction = Number(pemotonganAmount) || 0;
    return Math.max(0, sub + ppn - pph - deduction);
  };

  // Form Initializer & Trigger
  const handleTriggerAddCost = () => {
    setEditingCostId(null);
    setNomor(getNextCostNo(transactions));
    setDibayarDari('1120 Kas di Toko');
    setShowDibayarDariDropdown(false);
    setBayarNanti(false);
    setPenerima('');
    setShowPenerimaDropdown(false);
    setTglTransaksi('2026-07-13');
    setShowTglTransaksiCalendar(false);
    setTglTransaksiViewDate(new Date(2026, 6, 13));
    setReferensi('');
    setTag('Operational');
    setShowTagDropdown(false);
    setHargaTermasukPajak(false);
    setLineItems([{ id: Date.now(), account: '6190 Beban Lain-lain', description: '', tax: 'Tanpa Pajak', amount: 0 }]);
    setPesan('');
    setUploadedFiles([]);
    setShowPesan(false);
    setShowAttachment(false);
    setAttemptedSave(false);
    setPemotonganActive(false);
    setPemotonganAmount('0');
    setView('create');
  };

  const handleEditCost = (tx: CostItem) => {
    setEditingCostId(tx.id);
    setNomor(tx.id);
    setPenerima(tx.penerima || tx.desc || '');
    setShowPenerimaDropdown(false);

    let formattedDate = '2026-07-13';
    if (tx.date) {
      if (tx.date.includes('/')) {
        const parts = tx.date.split('/');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (tx.date.includes('-')) {
        formattedDate = tx.date;
      }
    }
    setTglTransaksi(formattedDate);
    const parts = formattedDate.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1]) {
      setTglTransaksiViewDate(new Date(parts[0], parts[1] - 1, parts[2] || 1));
    }

    setDibayarDari(tx.dibayarDari || (tx.method === 'Cash' || tx.method === 'Kas' ? '1120 Kas di Toko' : '1130 Bank BCA'));
    setShowDibayarDariDropdown(false);
    setBayarNanti(!!tx.bayarNanti || tx.method?.includes('Pay Later') || tx.method?.includes('Utang'));
    setTag(tx.category || 'Operational');
    setShowTagDropdown(false);
    setPesan(tx.pesan || tx.memo || '');
    setShowPesan(!!(tx.pesan || tx.memo));

    if (tx.lineItems && tx.lineItems.length > 0) {
      setLineItems(tx.lineItems.map((item, idx) => ({
        id: Date.now() + idx,
        account: item.account || '',
        description: item.description || '',
        amount: Number(item.amount) || 0,
        tax: item.tax || 'Tanpa Pajak',
        showAccountDropdown: false,
        showTaxDropdown: false
      })));
    } else {
      setLineItems([{
        id: Date.now(),
        account: tx.category === 'Marketing' ? '6140 Beban Iklan & Promosi' : tx.category === 'Procurement' ? '5100 Harga Pokok Penjualan' : '6190 Beban Lain-lain',
        description: tx.desc || '',
        amount: tx.amount || 0,
        tax: 'Tanpa Pajak',
        showAccountDropdown: false,
        showTaxDropdown: false
      }]);
    }

    setAttemptedSave(false);
    setView('create');
  };

  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [costToDelete, setCostToDelete] = useState<string | null>(null);

  const handleDeleteCost = (costId: string) => {
    setCostToDelete(costId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCost = () => {
    if (costToDelete) {
      deleteCost(costToDelete);
      setTransactions(getStoredCosts());
      if (editingCostId === costToDelete) {
        setEditingCostId(null);
        setView('list');
      }
      setCostToDelete(null);
      setShowDeleteModal(false);
    }
  };

  // Save/Submit Form
  const saveCostTransaction = (isDraft: boolean = false) => {
    setAttemptedSave(!isDraft);

    if (!isDraft) {
      // Validations:
      // 1. Recipient (Penerima) must be selected
      // 2. Line Items must have an account selected and amount > 0
      const hasValidPenerima = penerima.trim() !== '';
      const hasValidItems = lineItems.every(item => item.account !== '' && Number(item.amount) > 0);

      if (!hasValidPenerima || !hasValidItems) {
        let errMsg = 'Harap lengkapi bidang wajib berikut:\n';
        if (!hasValidPenerima) {
          errMsg += `- Penerima (Penerima) wajib diisi.\n`;
        }
        if (!hasValidItems) {
          errMsg += `- Semua baris harus memiliki Akun dan Jumlah lebih dari 0.`;
        }
        alert(errMsg);
        return false;
      }
    }

    // Process Date conversion: YYYY-MM-DD to DD/MM/YYYY
    const convertDateStr = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return '13/07/2026';
    };

    // Combine descriptions for storing
    const combinedDesc = lineItems.map(item => {
      const accClean = item.account ? (item.account.split(' ').slice(1).join(' ') || item.account) : 'Uncategorized Account';
      return `${accClean}${item.description ? ` (${item.description})` : ''}`;
    }).filter(Boolean).join(', ') || 'Draft Expense';

    // Register Cost through Central State Manager
    registerNewCost({
      id: nomor || getNextCostNo(transactions),
      category: (tag || 'Operational') as 'Operational' | 'Marketing' | 'Procurement',
      desc: combinedDesc,
      date: convertDateStr(tglTransaksi),
      amount: calculateGrandTotal(),
      method: bayarNanti ? 'Pay Later (A/P)' : (dibayarDari ? (dibayarDari.split(' ').slice(1).join(' ') || dibayarDari) : 'Cash'),
      status: isDraft ? 'Draft' : 'Approved',
      penerima,
      dibayarDari,
      bayarNanti,
      memo: pesan,
      pesan,
      lineItems: lineItems.map(item => ({
        account: item.account,
        description: item.description,
        amount: Number(item.amount) || 0,
        tax: item.tax
      }))
    });

    // Refresh list data
    setTransactions(getStoredCosts());
    alert(isDraft ? 'Draft berhasil disimpan.' : editingCostId ? 'Biaya berhasil diperbarui.' : 'Biaya berhasil disimpan.');
    setEditingCostId(null);
    setView('list');
    return true;
  };

  const handleSaveCostTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    saveCostTransaction(false);
  };

  // Filtered partners list for search
  const filteredPartners = getStoredPartners()
    .map(p => p.name)
    .filter(name => name.toLowerCase().includes(penerimaSearch.toLowerCase()));

  // Fallback partners if none stored
  const fallbackPartners = [
    'PT. Paragon Cosmetics',
    'CV. Multi Jaya Pack',
    'Instagram Ads Service',
    'Sinar Abadi Stationery',
    'PLN Persero',
    'Telkom Indonesia'
  ].filter(name => name.toLowerCase().includes(penerimaSearch.toLowerCase()));

  const partnersToDisplay = filteredPartners.length > 0 ? filteredPartners : fallbackPartners;

  return (
    <div className="flex flex-col w-full h-full font-sans">
      <AnimatePresence mode="wait" initial={false}>
        {view === 'create' ? (
          <motion.div
            key="create-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pl-8 pr-8 pb-8 pt-[9px] overflow-y-auto flex-1 bg-[#0A0A0A]"
          >
            {/* Header / Title bar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowDiscardModal(true)}
                  className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-colors cursor-pointer text-[#909090] hover:text-white"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest block mb-0.5">
                    {editingCostId ? 'Edit Expenditure' : 'New Expenditure'}
                  </span>
                  <h1 className="text-[18px] font-semibold tracking-tight text-white leading-tight">
                    {editingCostId ? `Edit Biaya ${editingCostId}` : 'Tambah Biaya Baru'}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="flex items-center gap-5 text-[12px] font-medium text-[#909090]">
                  <button 
                    type="button" 
                    onClick={() => setShowGuideModal(true)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <HelpCircle size={14} /> Guide
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-end mb-6">
              <div className="inline-flex items-center bg-[#18191E] border border-[#2B2E38] rounded-full p-1 shadow-lg">
                <button 
                  type="button"
                  onClick={(e) => handleSaveCostTransaction(e as any)}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#10B981] hover:text-[#34D399] hover:bg-[#10B981]/15 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle size={15} className="text-[#10B981]" />
                  <span>{editingCostId ? 'Perbarui' : 'Simpan'}</span>
                </button>

                {!editingCostId && (
                  <>
                    <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />
                    <button 
                      type="button" 
                      onClick={() => saveCostTransaction(true)}
                      className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-white hover:text-gray-200 hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-95"
                    >
                      <FileText size={15} className="text-white" />
                      <span>Draft</span>
                    </button>
                  </>
                )}

                <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />

                <button 
                  type="button" 
                  onClick={() => setShowDiscardModal(true)}
                  className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-[#EF4444] hover:text-[#F87171] hover:bg-[#EF4444]/15 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <XCircle size={15} className="text-[#EF4444]" />
                  <span>Cancel</span>
                </button>

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
                          className="absolute right-0 mt-2 w-44 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowThreeDotMenu(false);
                              const currentCost: CostItem = {
                                id: nomor || editingCostId || 'COST-PREVIEW',
                                category: (tag || 'Operational') as any,
                                desc: lineItems.map(l => l.account).join(', ') || 'Preview Cost',
                                date: tglTransaksi,
                                amount: calculateGrandTotal(),
                                method: bayarNanti ? 'Pay Later (A/P)' : dibayarDari,
                                status: 'Approved',
                                penerima,
                                dibayarDari,
                                bayarNanti,
                                pesan,
                                lineItems: lineItems.map(l => ({ account: l.account, description: l.description, amount: Number(l.amount) || 0, tax: l.tax }))
                              };
                              setJournalModalCost(currentCost);
                              setShowAccountingModal(true);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-white hover:bg-[#20222B] rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <BookOpen size={13} className="text-[#EA580C]" />
                            <span>Jurnal Akuntansi</span>
                          </button>

                          {editingCostId && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowThreeDotMenu(false);
                                handleDeleteCost(editingCostId);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-950/30 hover:text-red-400 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Hapus</span>
                            </button>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveCostTransaction} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: Core Form Content (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* CARD 1: Core Cost Details */}
                <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-6 shadow-xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column in Card 1 */}
                    <div className="space-y-4">
                      {/* Paid From & Pay Later Toggle */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-[12px] font-semibold text-[#A0A0A0]">
                            <span className="text-[#EA580C] mr-1">*</span>Dibayar Dari
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group text-xs text-[#D5D5D5] select-none">
                            <input
                              type="checkbox"
                              checked={bayarNanti}
                              onChange={(e) => setBayarNanti(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${bayarNanti ? 'bg-[#EA580C]' : 'bg-[#2B2D36]'}`}>
                              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${bayarNanti ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                            </div>
                            <span>Bayar Nanti</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          disabled={bayarNanti}
                          onClick={() => {
                            setShowDibayarDariDropdown(!showDibayarDariDropdown);
                            setShowTglTransaksiCalendar(false);
                            setShowPenerimaDropdown(false);
                            setShowTagDropdown(false);
                          }}
                          className={`w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left ${
                            bayarNanti ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <span>{dibayarDari}</span>
                          <ChevronDown size={14} className="text-[#909090]" />
                        </button>

                        <AnimatePresence>
                          {showDibayarDariDropdown && !bayarNanti && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              style={{ originY: 0 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                            >
                              {paidFromAccounts.map((acc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setDibayarDari(acc);
                                    setShowDibayarDariDropdown(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-[#20222B] rounded-xl transition-all cursor-pointer"
                                >
                                  {acc}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Penerima */}
                      <div className="relative">
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                          <span className="text-[#EA580C] mr-1">*</span>Penerima
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPenerimaDropdown(!showPenerimaDropdown);
                            setShowTglTransaksiCalendar(false);
                            setShowDibayarDariDropdown(false);
                            setShowTagDropdown(false);
                          }}
                          className={`w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer ${
                            attemptedSave && !penerima ? 'border-[#EA580C]' : 'border-[#2B2D36]'
                          }`}
                        >
                          <span className={penerima ? "text-white" : "text-[#6E7079]"}>
                            {penerima || "Pilih penerima"}
                          </span>
                          <ChevronDown size={14} className="text-[#909090]" />
                        </button>

                        <AnimatePresence>
                          {showPenerimaDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              style={{ originY: 0 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden max-h-[220px] flex flex-col"
                            >
                              <div className="p-2 mb-1 border-b border-[#262830] flex items-center gap-2 bg-[#1B1D24] rounded-xl">
                                <Search size={14} className="text-[#909090]" />
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  value={penerimaSearch}
                                  onChange={(e) => setPenerimaSearch(e.target.value)}
                                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                />
                              </div>
                              <div className="overflow-y-auto flex-1 space-y-0.5">
                                {partnersToDisplay.map((name, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setPenerima(name);
                                      setShowPenerimaDropdown(false);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#20222B] rounded-xl transition-all cursor-pointer"
                                  >
                                    {name}
                                  </button>
                                ))}
                                {partnersToDisplay.length === 0 && (
                                  <div className="px-3.5 py-2 text-xs text-[#6E7079] italic">No recipient found</div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Tgl Transaksi */}
                      <div className="relative">
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2">
                          <span className="text-[#EA580C] mr-1">*</span>Tgl. Transaksi
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTglTransaksiCalendar(!showTglTransaksiCalendar);
                            setShowDibayarDariDropdown(false);
                            setShowPenerimaDropdown(false);
                            setShowTagDropdown(false);
                          }}
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer"
                        >
                          <span>{formatDateStr(parseYMD(tglTransaksi))}</span>
                          <Calendar size={14} className="text-[#909090]" />
                        </button>

                        <AnimatePresence>
                          {showTglTransaksiCalendar && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowTglTransaksiCalendar(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 mt-2 p-4 w-[280px] bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl z-50 flex flex-col overflow-hidden"
                              >
                                {renderCustomSingleCalendar(
                                  tglTransaksiViewDate,
                                  tglTransaksi,
                                  (ymd) => {
                                    setTglTransaksi(ymd);
                                    setShowTglTransaksiCalendar(false);
                                  },
                                  setTglTransaksiViewDate
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Right Column in Card 1 */}
                    <div className="space-y-4">
                      {/* Nomor */}
                      <div>
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 flex items-center gap-1">
                          Nomor
                          <HelpCircle size={12} className="text-[#6E7079]" />
                        </label>
                        <input
                          type="text"
                          value={nomor}
                          onChange={(e) => setNomor(e.target.value)}
                          placeholder="GEN - RK - 086"
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                        />
                      </div>

                      {/* Referensi */}
                      <div>
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 flex items-center gap-1">
                          Referensi
                          <HelpCircle size={12} className="text-[#6E7079]" />
                        </label>
                        <input
                          type="text"
                          value={referensi}
                          onChange={(e) => setReferensi(e.target.value)}
                          placeholder="Referensi"
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                        />
                      </div>

                      {/* Tag / Kategori */}
                      <div className="relative">
                        <label className="block text-[12px] font-semibold text-[#A0A0A0] mb-2 flex items-center gap-1">
                          Tag / Kategori
                          <HelpCircle size={12} className="text-[#6E7079]" />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTagDropdown(!showTagDropdown);
                            setShowTglTransaksiCalendar(false);
                            setShowDibayarDariDropdown(false);
                            setShowPenerimaDropdown(false);
                          }}
                          className="w-full h-[38px] px-3.5 py-1.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer"
                        >
                          <span>{tagOptions.find(opt => opt.value === tag)?.label || tag}</span>
                          <ChevronDown size={14} className="text-[#909090]" />
                        </button>

                        <AnimatePresence>
                          {showTagDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              style={{ originY: 0 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                            >
                              {tagOptions.map((opt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setTag(opt.value);
                                    setShowTagDropdown(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#20222B] rounded-xl transition-all cursor-pointer flex items-center justify-between"
                                >
                                  <span>{opt.label}</span>
                                  {tag === opt.value && <CheckCircle size={12} className="text-[#EA580C]" />}
                                </button>
                              ))}
                              <div className="border-t border-[#262830] my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setShowTagDropdown(false);
                                  setShowAddCategoryModal(true);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#EA580C] hover:bg-[#20222B] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus size={13} />
                                <span>Add Category</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Line Items */}
                <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
                    <span className="text-[12px] font-bold text-white uppercase tracking-wider">Detail Akun Biaya</span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#A0A0A0] select-none">
                      <input
                        type="checkbox"
                        checked={hargaTermasukPajak}
                        onChange={(e) => setHargaTermasukPajak(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${hargaTermasukPajak ? 'bg-[#EA580C]' : 'bg-[#2B2D36]'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${hargaTermasukPajak ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </div>
                      <span>Harga termasuk pajak</span>
                    </label>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#2B2D36]/60">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-[#1A1B1F] border-b border-[#232427] text-[11px] font-semibold text-[#A0A0A0]">
                          <th className="py-3 px-3.5 w-[35%] min-w-[240px]">Akun Biaya</th>
                          <th className="py-3 px-3.5 w-[30%]">Deskripsi</th>
                          <th className="py-3 px-3.5 w-[15%]">Pajak</th>
                          <th className="py-3 px-3.5 w-[15%] text-right font-semibold">Amount</th>
                          <th className="py-3 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#232427]/50 bg-[#141517]">
                        {lineItems.map((item, index) => (
                          <tr key={item.id} className="hover:bg-[#18191E] transition-colors">
                            
                            {/* Akun Biaya */}
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setAccountDropdownCoords({
                                    top: rect.bottom,
                                    left: rect.left,
                                    width: Math.max(300, rect.width)
                                  });
                                  if (activeAccountDropdownIdx === index) {
                                    setActiveAccountDropdownIdx(null);
                                  } else {
                                    setActiveAccountDropdownIdx(index);
                                    setAccountSearchTerms(prev => ({ ...prev, [index]: '' }));
                                  }
                                }}
                                className={`w-full h-[38px] px-3.5 bg-[#141518] border rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer ${
                                  attemptedSave && !item.account ? 'border-[#EA580C]' : 'border-[#2B2D36]'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {item.account ? (
                                    <>
                                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#202125] text-white font-semibold">
                                        {item.account.split(' ')[0]}
                                      </span>
                                      <span className="truncate font-medium text-white">
                                        {item.account.split(' ').slice(1).join(' ')}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-[#6E7079]">Pilih akun biaya...</span>
                                  )}
                                </div>
                                <ChevronDown size={12} className="text-[#909090] flex-shrink-0 ml-1" />
                              </button>

                              <AnimatePresence>
                                {activeAccountDropdownIdx === index && accountDropdownCoords && (
                                  <>
                                    {createPortal(
                                      <>
                                        <div className="fixed inset-0 z-[9999]" onClick={() => setActiveAccountDropdownIdx(null)} />
                                        <motion.div
                                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                          transition={{ duration: 0.15, ease: "easeOut" }}
                                          style={{
                                            position: 'fixed',
                                            top: `${accountDropdownCoords.top + 4}px`,
                                            left: `${accountDropdownCoords.left}px`,
                                            width: `${accountDropdownCoords.width}px`,
                                            zIndex: 10000,
                                          }}
                                          className="bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl overflow-hidden p-1.5"
                                        >
                                          {/* Search Input Bar */}
                                          <div className="p-2 mb-1 border-b border-[#262830] bg-[#1B1D24] rounded-xl">
                                            <div className="relative flex items-center gap-2">
                                              <Search size={13} className="text-[#909090]" />
                                              <input
                                                type="text"
                                                autoFocus
                                                value={accountSearchTerms[index] || ''}
                                                onChange={(e) => {
                                                  const term = e.target.value;
                                                  setAccountSearchTerms(prev => ({ ...prev, [index]: term }));
                                                }}
                                                placeholder="Cari akun beban operasional..."
                                                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-[#6E7079]"
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            </div>
                                          </div>

                                          {/* Group Header */}
                                          <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-[#EA580C] uppercase tracking-wider select-none">
                                            <span>Beban Operasional</span>
                                            <span className="font-mono text-[#808080] font-normal">Kelompok 6000</span>
                                          </div>

                                          {/* Account List */}
                                          <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                                            {getFilteredExpenseAccounts(accountSearchTerms[index] || '').length > 0 ? (
                                              getFilteredExpenseAccounts(accountSearchTerms[index] || '').map((acc, idx) => {
                                                const parts = acc.split(' ');
                                                const code = parts[0];
                                                const name = parts.slice(1).join(' ');
                                                const isSelected = item.account === acc;
                                                return (
                                                  <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                      updateLineItem(index, 'account', acc);
                                                      setActiveAccountDropdownIdx(null);
                                                      setAccountSearchTerms(prev => ({ ...prev, [index]: '' }));
                                                    }}
                                                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between group rounded-xl transition-all cursor-pointer ${
                                                      isSelected ? 'bg-[#EA580C]/20 text-[#EA580C]' : 'hover:bg-[#20222B] text-white'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                      <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                                                        isSelected 
                                                          ? 'bg-[#EA580C]/30 text-white font-bold' 
                                                          : 'bg-[#202125] text-white font-medium'
                                                      }`}>
                                                        {code}
                                                      </span>
                                                      <span className="text-xs truncate font-medium">{name}</span>
                                                    </div>
                                                    {isSelected && <Check size={14} className="text-[#EA580C] flex-shrink-0 ml-2" />}
                                                  </button>
                                                );
                                              })
                                            ) : (
                                              <div className="px-3 py-4 text-center text-xs text-[#808080]">
                                                Tidak ada akun beban operasional yang cocok
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      </>,
                                      document.body
                                    )}
                                  </>
                                )}
                              </AnimatePresence>
                            </td>

                            {/* Deskripsi */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                placeholder="Deskripsi biaya..."
                                className="w-full h-[38px] px-3.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all placeholder:text-[#6E7079]"
                              />
                            </td>

                            {/* Pajak Selector */}
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
                                  }}
                                  className="w-full h-[38px] px-3.5 bg-[#141518] border border-[#2B2D36] rounded-xl text-xs text-white focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all flex items-center justify-between text-left cursor-pointer font-semibold"
                                >
                                  <span>{item.tax === 'Tanpa Pajak' ? '...' : item.tax}</span>
                                  <ChevronDown size={12} className="text-[#909090] flex-shrink-0 ml-1" />
                                </button>

                                <AnimatePresence>
                                  {activeTaxDropdownIdx === index && taxDropdownCoords && (
                                    <>
                                      {createPortal(
                                        <>
                                          <div className="fixed inset-0 z-[9999]" onClick={() => setActiveTaxDropdownIdx(null)} />
                                          <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-[10000]"
                                            style={{
                                              position: 'fixed',
                                              top: `${taxDropdownCoords.top + 4}px`,
                                              left: `${taxDropdownCoords.left}px`,
                                              width: `${taxDropdownCoords.width}px`,
                                            }}
                                          >
                                            <div className="space-y-0.5">
                                              {[
                                                { value: 'Tanpa Pajak', label: 'Tanpa Pajak (...)' },
                                                { value: 'PPN 11%', label: 'PPN 11%' },
                                                { value: 'PPH 23', label: 'PPH 23' }
                                              ].map((opt, idx) => (
                                                <button
                                                  key={idx}
                                                  type="button"
                                                  onClick={() => {
                                                    updateLineItem(index, 'tax', opt.value);
                                                    setActiveTaxDropdownIdx(null);
                                                  }}
                                                  className={`w-full text-left px-3.5 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                                                    item.tax === opt.value
                                                      ? 'bg-[#EA580C]/20 text-[#EA580C] font-medium'
                                                      : 'text-white hover:bg-[#20222B]'
                                                  }`}
                                                >
                                                  {opt.label}
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

                            {/* Total (Amount) Input */}
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={item.amount || ''}
                                onChange={(e) => updateLineItem(index, 'amount', Number(e.target.value))}
                                className={`w-full h-[38px] px-3.5 bg-[#141518] border rounded-xl text-xs text-white font-sans font-bold text-right focus:outline-none focus:border-[#EA580C] hover:border-[#3A3D4A] transition-all ${
                                  attemptedSave && (!item.amount || item.amount <= 0) ? 'border-[#EA580C]' : 'border-[#2B2D36]'
                                }`}
                              />
                            </td>

                            {/* Remove row button */}
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="p-1.5 text-[#606060] hover:text-[#EA580C] hover:bg-[#EA580C]/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-[#1A1B1F] border border-[#2B2D36] hover:bg-[#23242B] hover:border-[#3A3D4A] text-[#D5D5D5] rounded-xl transition-all cursor-pointer"
                    >
                      <Plus size={14} className="text-[#EA580C]" />
                      <span>Add Row</span>
                    </button>
                  </div>

                </div>

              </div>

              {/* RIGHT COLUMN: Sticky Sidebar Totals & Submit (4 cols) */}
              <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
                <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl p-5 shadow-xl space-y-5">
                  <h2 className="text-[12px] font-bold text-white uppercase tracking-wider pb-2.5 border-b border-[#2A2A2A]">
                    Ringkasan Biaya
                  </h2>

                  <div className="space-y-3.5">
                    {/* Sub Total */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A0A0A0] font-medium">Sub Total</span>
                      <span className="font-sans text-white font-semibold">{formatAmount(calculateSubtotal())}</span>
                    </div>

                    {/* Modifier Inputs Block */}
                    <div className="border-t border-b border-[#2A2A2A]/50 py-3 space-y-2.5">
                      {/* PPN 11% */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A0A0A0] text-[11px]">PPN 11% {hargaTermasukPajak ? '(Included)' : ''}</span>
                          <span className="font-sans text-white font-semibold">{formatAmount(calculatePPN())}</span>
                        </div>
                      </div>

                      {/* PPh 23 */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A0A0A0] text-[11px]">PPh 23 (Withholding 2%)</span>
                          <span className="font-sans text-white font-semibold">-{formatAmount(calculatePPH())}</span>
                        </div>
                      </div>

                      {/* Pemotongan / Deduction */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A0A0A0] text-[11px]">Deduction / Pemotongan</span>
                          <button
                            type="button"
                            onClick={() => setPemotonganActive(!pemotonganActive)}
                            className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                          >
                            {pemotonganActive ? 'Hide' : '+ Set'}
                          </button>
                        </div>
                        {pemotonganActive && (
                          <div className="flex bg-[#141518] border border-[#2B2D36] rounded-xl overflow-hidden focus-within:border-[#EA580C] transition-all h-[38px]">
                            <input
                              type="number"
                              min="0"
                              value={pemotonganAmount}
                              onChange={(e) => setPemotonganAmount(e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent px-3.5 py-1.5 text-right text-[13px] text-white font-sans font-semibold focus:outline-none placeholder:text-[#6E7079]"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grand Total Display */}
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-white font-bold text-[13px]">Total Biaya</span>
                      <span className="font-sans text-[#EA580C] font-bold text-base">{formatAmount(calculateGrandTotal())}</span>
                    </div>

                  </div>

                  {/* Notes & Attachments */}
                  <div className="border-t border-[#2A2A2A]/50 pt-4 space-y-4">
                    {/* Notes Column */}
                    <div className="space-y-2">
                      <span className="text-[12px] font-semibold text-[#A0A0A0] block">Notes</span>
                      <textarea 
                        value={pesan}
                        onChange={(e) => setPesan(e.target.value)}
                        placeholder="Write a message or internal transaction notes here..."
                        rows={4}
                        className="w-full bg-[#141518] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all resize-none h-[80px] placeholder:text-[#6E7079]"
                      />
                    </div>

                    {/* Attachments Upload Column */}
                    <div className="space-y-3">
                      <span className="text-[12px] font-semibold text-[#A0A0A0] block">Attachment</span>
                      <label className="border border-dashed border-[#2B2D36] rounded-xl p-4 flex flex-col items-center justify-center hover:bg-[#1B1C22] hover:border-[#EA580C]/50 transition-all cursor-pointer group text-center h-[100px] bg-[#141518]">
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
                        <Upload size={16} className="text-[#6E7079] group-hover:text-[#EA580C] transition-colors mb-1.5" />
                        <span className="text-[11px] font-semibold text-[#D5D5D5]">Drag file / Click to upload</span>
                        <span className="text-[9px] text-[#6E7079] mt-0.5">Max. 10MB per file</span>
                      </label>

                      {/* List of uploaded files */}
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] font-bold text-[#A0A0A0] uppercase block">File List ({uploadedFiles.length})</span>
                          <div className="max-h-[100px] overflow-y-auto space-y-1">
                            {uploadedFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-[#141518] px-3.5 py-2 rounded-xl border border-[#2B2D36] text-[12px]">
                                <span className="truncate max-w-[150px] text-white flex items-center gap-1.5 font-sans">
                                  <Paperclip size={11} className="text-[#EA580C]" />
                                  {file.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-[#6E7079]">{file.size}</span>
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
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pl-8 pr-8 pb-8 pt-[9px] overflow-y-auto flex-1"
          >
            {/* Top Right Utilities & Actions Row */}
            <div className="flex items-start justify-between mb-8">
              <div className="pb-0" style={{ paddingBottom: '0px' }}>
                <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0 flex items-baseline" style={{ marginBottom: 0 }}>
                  Cost
                </h1>
                <p className="text-[13px] text-[#909090]">
                  Monitor, categorize and analyze all company expenditures.
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
                  <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
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
                  onClick={handleTriggerAddCost}
                  whileHover={{ backgroundColor: '#D97706' }}
                  whileTap={{ scale: 0.95 }}
                  title="Add Cost"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-[#EA580C] transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 shrink-0"
                >
                  <Plus size={18} />
                </motion.button>
              </div>
            </div>



            {/* Transactions Table Section */}
            <div className="bg-[#141517] border border-[#232427] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#232427] bg-[#1A1B1F]">
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>ID</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Penerima</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Category</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Reference</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Date</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Payment Method</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">
                        <span>Status</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right">
                        <span>Amount</span>
                      </th>
                      <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-center w-28">
                        <span>Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202125]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-[#8E9097]">
                          <div className="flex flex-col items-center justify-center">
                            <Coins size={36} className="text-[#333] mb-3 animate-pulse" />
                            <p className="text-[13px] text-white font-medium mb-1">No expenditures logged</p>
                            <p className="text-[11px] text-[#7A7C85] max-w-[280px] mb-4">You have zero costs recorded. Log a transaction or populate with sample data.</p>
                            <button 
                              onClick={() => setTransactions(initialCostTransactions)}
                              className="text-[11px] font-medium text-white bg-[#1C1D21] hover:bg-[#25262B] border border-[#2D2E33] transition-colors px-3.5 py-1.5 rounded-lg cursor-pointer"
                            >
                              Load Sample Data
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredByDateTransactions.filter(t => 
                        (t.desc && t.desc.toLowerCase().includes(searchTerm.toLowerCase())) || 
                        (t.id && t.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (t.penerima && t.penerima.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).map((tx, idx) => {
                        const penerimaName = tx.penerima || tx.vendor || tx.partner || 'General Partner';
                        return (
                          <tr 
                            key={idx} 
                            onClick={() => handleEditCost(tx)}
                            className="border-b border-[#202125] last:border-b-0 hover:bg-[#18191D] transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-4 text-[13px]">
                              <span 
                                className="font-semibold text-white tracking-tight hover:text-[#EA580C] transition-colors cursor-pointer"
                              >
                                {tx.id}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-[13px]">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(penerimaName)} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`}>
                                  {penerimaName.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-white text-[13px] truncate">
                                  {penerimaName}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-[13px]">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium leading-none bg-[#22242C] text-[#C5C7CE]">
                                {tx.category || 'Operational'}
                              </span>
                            </td>
                            <td 
                              onClick={() => handleEditCost(tx)}
                              className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal max-w-xs truncate cursor-pointer hover:text-white"
                            >
                              {tx.referensi || tx.desc || '-'}
                            </td>
                            <td className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal">
                              <span className="text-white text-[13px] font-normal">{formatDateStr(parseDateStr(tx.date))}</span>
                            </td>
                            <td className="py-4 px-4 text-[13px] text-[#C5C7CE] font-normal">{tx.method}</td>
                            <td className="py-4 px-4 text-[13px]">
                              {renderStatusBadge(tx.status || 'Approved')}
                            </td>
                            <td className="py-4 px-4 text-[13px] text-white font-semibold text-right">
                              {typeof tx.amount === 'number' ? formatRupiah(tx.amount) : tx.amount}
                            </td>
                            <td className="py-4 px-4 text-[13px] text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  title="View / Edit Biaya"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCost(tx);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#909299] hover:text-white border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  title="Jurnal Akuntansi"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setJournalModalCost(tx);
                                    setShowAccountingModal(true);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#1F2024] hover:bg-[#2A2B30] text-[#EA580C] hover:text-orange-400 border border-[#2A2B30] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <BookOpen size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Hapus Biaya"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCost(tx.id);
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Add Category */}
      <AnimatePresence>
        {showAddCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCategoryModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden p-6 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Plus size={16} className="text-[#EA580C]" />
                  Tambah Kategori Baru
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="p-1 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#A0A0A0]">Nama Kategori / Tag</label>
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Contoh: Utilities, HR, Logistics..."
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2A2A]">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(false)}
                    className="px-4 py-2 text-xs text-[#A0A0A0] hover:text-white bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg transition-colors cursor-pointer"
                  >
                    Simpan Kategori
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Jurnal Akuntansi */}
      <AnimatePresence>
        {showAccountingModal && journalModalCost && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAccountingModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden p-6 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-[#EA580C]" />
                    Jurnal Akuntansi (Buku Besar) - {journalModalCost.id}
                  </h2>
                  <p className="text-xs text-[#909090] mt-0.5">
                    Entri jurnal otomatis berdasarkan akun biaya dan sumber pembayaran
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountingModal(false)}
                  className="p-1 hover:bg-[#1C1C1E] rounded-lg transition-colors text-[#909090] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Transaction Summary Header */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#0E0F11] border border-[#2A2A2A] rounded-lg text-xs">
                <div>
                  <span className="text-[#808080] block text-[10px] uppercase">Penerima</span>
                  <span className="text-white font-medium">{journalModalCost.penerima || journalModalCost.desc || '-'}</span>
                </div>
                <div>
                  <span className="text-[#808080] block text-[10px] uppercase">Dibayar Dari</span>
                  <span className="text-white font-medium">{journalModalCost.dibayarDari || journalModalCost.method || '-'}</span>
                </div>
                <div>
                  <span className="text-[#808080] block text-[10px] uppercase">Total Biaya</span>
                  <span className="text-[#EA580C] font-mono font-bold">{formatRupiah(journalModalCost.amount)}</span>
                </div>
              </div>

              {/* Journal Table */}
              <div className="border border-[#2A2A2A] rounded-lg overflow-hidden bg-[#0A0A0A]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141517] border-b border-[#2A2A2A] text-[#909090] font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Kode Akun</th>
                      <th className="py-2.5 px-3">Nama Akun</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-right">Debit (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]/40 text-white">
                    {(() => {
                      const ledgerEntries = getStoredLedger().filter(l => l.description.includes(journalModalCost.id));
                      if (ledgerEntries.length > 0) {
                        return ledgerEntries.map((l, i) => (
                          <tr key={i} className="hover:bg-[#141517]">
                            <td className="py-2.5 px-3 font-mono text-white font-medium">
                              {l.account.match(/^\d+/)?.[0] || (l.category === 'Expense' ? '6100' : '1120')}
                            </td>
                            <td className="py-2.5 px-3 font-medium">{l.account}</td>
                            <td className="py-2.5 px-3 text-[#909090]">{l.category}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-400">
                              {typeof l.debit === 'number' ? formatRupiah(l.debit) : l.debit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-400">
                              {typeof l.credit === 'number' ? formatRupiah(l.credit) : l.credit}
                            </td>
                          </tr>
                        ));
                      }

                      // Reconstruct preview entries if not yet saved in ledger
                      const previewItems: any[] = [];
                      if (journalModalCost.lineItems && journalModalCost.lineItems.length > 0) {
                        journalModalCost.lineItems.forEach((item) => {
                          const amt = Number(item.amount) || 0;
                          if (amt > 0) {
                            previewItems.push({
                              code: item.account.split(' ')[0] || '6100',
                              name: item.account.split(' ').slice(1).join(' ') || item.account || 'Beban Operasional',
                              cat: 'Expense',
                              debit: amt,
                              credit: '-'
                            });
                          }
                        });
                      } else {
                        previewItems.push({
                          code: '6190',
                          name: journalModalCost.desc || 'Beban Lain-lain',
                          cat: 'Expense',
                          debit: journalModalCost.amount,
                          credit: '-'
                        });
                      }

                      const creditAcc = journalModalCost.bayarNanti ? 'Utang Usaha' : (journalModalCost.dibayarDari || journalModalCost.method || 'Kas di Toko');
                      previewItems.push({
                        code: creditAcc.includes('Mandiri') ? '1140' : creditAcc.includes('BCA') ? '1130' : creditAcc.includes('Kecil') ? '1110' : creditAcc.includes('Utang') ? '2100' : '1120',
                        name: creditAcc,
                        cat: journalModalCost.bayarNanti ? 'Liability' : 'Asset',
                        debit: '-',
                        credit: journalModalCost.amount
                      });

                      return previewItems.map((item, i) => (
                        <tr key={i} className="hover:bg-[#141517]">
                          <td className="py-2.5 px-3 font-mono text-white font-medium">{item.code}</td>
                          <td className="py-2.5 px-3 font-medium">{item.name}</td>
                          <td className="py-2.5 px-3 text-[#909090]">{item.cat}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-400">
                            {typeof item.debit === 'number' ? formatRupiah(item.debit) : item.debit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-400">
                            {typeof item.credit === 'number' ? formatRupiah(item.credit) : item.credit}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between text-xs bg-[#0E0F11] p-3 rounded-lg border border-[#2A2A2A]">
                <span className="text-[#808080]">Status Terbaca: <strong className="text-emerald-400 font-semibold">Tersetel ke General Ledger (Buku Besar)</strong></span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                  <CheckCircle size={13} /> Balanced (Debet = Kredit)
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Panduan Penggunaan (Expenses Guide Modal) */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGuideModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden p-6 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <HelpCircle size={18} className="text-[#EA580C]" />
                    Panduan Pengelolaan Biaya & Beban (Expenses Guide)
                  </h2>
                  <p className="text-xs text-[#909090] mt-0.5">
                    Petunjuk langkah demi langkah untuk mencatat biaya operasional dan akuntansi
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
                    Pilih Penerima & Tanggal Transaksi
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Tentukan nama penerima pembayaran pada kolom <strong>Penerima</strong>. Tentukan tanggal transaksi dan pilih kategori tag (seperti <em>Operational</em>, <em>Marketing</em>, atau <em>Procurement</em>).
                  </p>
                </div>

                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">2</span>
                    Pilih Akun Beban & Nominal
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Pada rincian item, pilih kode akun beban yang sesuai (misal: <em>6110 Beban Sewa</em>, <em>6140 Beban Iklan</em>, <em>6190 Beban Lain-lain</em>), tuliskan deskripsi, dan isi jumlah nominal biaya. Anda dapat menambah beberapa baris akun sekaligus.
                  </p>
                </div>

                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">3</span>
                    Metode Pembayaran (Tunai / Bank vs Bayar Nanti)
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    - <strong>Pembayaran Langsung</strong>: Pilih sumber dana di field <em>Dibayar Dari</em> (seperti Kas di Toko, Kas Kecil, BCA, atau Mandiri).<br />
                    - <strong>Bayar Nanti (Pay Later)</strong>: Centang opsi <em>Bayar Nanti</em> jika pembayaran belum dilunasi. Transaksi ini akan otomatis dicatat sebagai <strong>Utang Usaha (Accounts Payable)</strong>.
                  </p>
                </div>

                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">4</span>
                    Pencatatan Otomatis ke Jurnal & Laporan Keuangan
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Sistem secara otomatis mendebit Akun Beban dan mengkredit Akun Kas/Bank atau Utang Usaha. Seluruh transaksi akan langsung memperbarui laporan <strong>Laba Rugi</strong>, <strong>Neraca</strong>, dan <strong>Buku Besar (Accounting Ledger)</strong>.
                  </p>
                </div>

                <div className="bg-[#0E0F11] border border-[#2A2A2A] p-3.5 rounded-lg space-y-1.5">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center text-[10px] font-bold">5</span>
                    Aksi & Menu Titik Tiga (...)
                  </h3>
                  <p className="text-[#A0A0A0] leading-relaxed pl-7">
                    Gunakan tombol titik tiga <strong>(...)</strong> di bagian kanan atas form transaksi untuk membuka modal <strong>Jurnal Akuntansi</strong> atau <strong>Menghapus Transaksi Biaya</strong>.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg transition-colors cursor-pointer"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Unsaved Changes Discard Modal */}
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
                  You have unsaved changes in <span className="text-white font-medium">{editingCostId || 'this expense record'}</span>. Discarding will remove all unsaved edits. This action cannot be undone.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      saveCostTransaction(true);
                      setShowDiscardModal(false);
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setView('list'); 
                      setEditingCostId(null);
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

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCostToDelete(null);
                    }}
                    className="w-8 h-8 rounded-full bg-[#27272A] hover:bg-[#3F3F46] transition-colors text-[#A1A1AA] hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                  Delete expense record permanently?
                </h2>

                {/* Description */}
                <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
                  This will permanently delete expense transaction <span className="text-white font-medium">{costToDelete}</span> and all of its data. This action cannot be undone.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCostToDelete(null);
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteCost}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20"
                  >
                    Delete Record
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}

// Helpers
function formatAmount(val: number) {
  return val.toLocaleString('id-ID');
}
