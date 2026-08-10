import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { setHasUnsavedChanges } from '../lib/unsaved';
import { 
  getStoredAccounts, 
  saveAccounts, 
  addAccountAndPropagate,
  updateAccountAndPropagate,
  getStoredLedger, 
  getStoredInvoices,
  getStoredCosts,
  addManualTransaction,
  deleteJournalTransaction,
  updateJournalTransaction,
  AccountItem, 
  JournalEntry,
  InvoiceItem,
  CostItem,
  getSubCategoriesForCategory,
  subCategoryOptionsMap
} from '../lib/state';
import { 
  Search, 
  Plus, 
  Filter, 
  List, 
  Grid, 
  FileText, 
  BarChart3, 
  BookOpen, 
  Upload, 
  Printer, 
  MoreVertical, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  X, 
  ArrowLeft,
  Check,
  CheckCircle,
  Building2,
  Edit3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  Send,
  Zap,
  ArrowRight,
  Eye,
  Calendar,
  CreditCard,
  Layers,
  Tag,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  Trash2
} from 'lucide-react';

export interface UnifiedTransaction {
  id: string;
  sourceType: 'Penjualan' | 'Pembelian' | 'Biaya' | 'Jurnal';
  date: string;
  formattedDate: string;
  ref: string;
  partnerName: string;
  description: string;
  amount: number;
  remaining?: number;
  status: string;
  accountMethod: string;
  debitAccount?: string;
  creditAccount?: string;
  items?: any[];
  originalDoc?: any;
}

const parseAnyDate = (str?: string): Date | null => {
  if (!str) return null;
  const s = String(str).trim();
  if (s.includes('-')) {
    const parts = s.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      if (parts[0] > 1000) return new Date(parts[0], parts[1] - 1, parts[2]);
      if (parts[2] > 1000) return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  if (s.includes('/')) {
    const parts = s.split('/').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      if (parts[2] > 1000) return new Date(parts[2], parts[1] - 1, parts[0]);
      if (parts[0] > 1000) return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const getMonthName = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
};

const getDayName = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
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

const getMonthGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  let startDayOfWeek = firstDay.getDay(); 
  let offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();
  
  const grid = [];
  
  for (let i = offset - 1; i >= 0; i--) {
    grid.push({
      dayNum: prevDaysInMonth - i,
      date: new Date(year, month - 1, prevDaysInMonth - i),
      isCurrent: false
    });
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({
      dayNum: d,
      date: new Date(year, month, d),
      isCurrent: true
    });
  }
  
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

const buildUnifiedTransactions = (): UnifiedTransaction[] => {
  const invoices = getStoredInvoices();
  const costs = getStoredCosts();
  const ledger = getStoredLedger();

  const list: UnifiedTransaction[] = [];

  // 1. Sales & Purchase Invoices
  if (Array.isArray(invoices)) {
    invoices.forEach(inv => {
      const isSales = inv.isSales;
      const sourceType = isSales ? 'Penjualan' : 'Pembelian';
      
      let dateStr = inv.date || '';
      let formattedDate = inv.date || '-';
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const year = parts[2];
          if (p0 > 12) {
            dateStr = `${year}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
          } else {
            dateStr = `${year}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
          }
        }
      }

      const itemsSummary = inv.items && inv.items.length > 0 
        ? inv.items.map(i => `${i.name || i.productId} (${i.qty}x)`).join(', ')
        : (isSales ? 'Penjualan Produk' : 'Pembelian Barang Dagang');

      list.push({
        id: inv.id,
        sourceType,
        date: dateStr,
        formattedDate,
        ref: inv.ref || inv.id,
        partnerName: inv.partnerName || (isSales ? 'Pelanggan Umum' : 'Distributor / Vendor'),
        description: itemsSummary,
        amount: inv.total || 0,
        remaining: inv.remaining,
        status: inv.status || 'Paid',
        accountMethod: inv.paymentBank || (inv.remaining === 0 ? 'Kas / Bank (Lunas)' : isSales ? 'Piutang Usaha' : 'Utang Usaha'),
        debitAccount: isSales ? (inv.paymentBank ? `Bank / Kas (${inv.paymentBank})` : '1100 - Piutang Usaha') : '5100 - HPP / Persediaan',
        creditAccount: isSales ? '4100 - Penjualan Produk' : (inv.paymentBank ? `Bank / Kas (${inv.paymentBank})` : '2100 - Utang Usaha'),
        items: inv.items,
        originalDoc: inv,
      });
    });
  }

  // 2. Costs / Expenses
  if (Array.isArray(costs)) {
    costs.forEach(cost => {
      let dateStr = cost.date || '';
      let formattedDate = cost.date || '-';
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const year = parts[2];
          if (p0 > 12) {
            dateStr = `${year}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
          } else {
            dateStr = `${year}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
          }
        }
      }

      const debitAccName = cost.lineItems && cost.lineItems[0]?.account ? cost.lineItems[0].account : '6100 - Beban Operasional';

      list.push({
        id: cost.id,
        sourceType: 'Biaya',
        date: dateStr,
        formattedDate,
        ref: cost.id,
        partnerName: cost.penerima || 'Pihak Ketiga / Vendor Operasional',
        description: cost.desc || cost.memo || 'Beban Operasional',
        amount: cost.amount || 0,
        remaining: 0,
        status: cost.status || 'Paid',
        accountMethod: cost.dibayarDari || cost.method || 'Bank BCA',
        debitAccount: debitAccName,
        creditAccount: cost.dibayarDari || '1130 - Bank BCA',
        items: cost.lineItems,
        originalDoc: cost,
      });
    });
  }

  // 3. Manual Journal Ledger entries
  if (Array.isArray(ledger)) {
    const manualEntries = ledger.filter(entry => {
      if (entry.id.startsWith('JV-2026-INV-') || entry.id.startsWith('JV-2026-SLS-') || entry.id.startsWith('JV-2026-PUR-') || entry.id.startsWith('JV-2026-PAY-') || entry.id.startsWith('JV-2026-CST-')) {
        return false;
      }
      const d = entry.description || '';
      if (d.includes('Sales Invoice') || d.includes('Purchase Invoice') || d.startsWith('Pelunasan:') || d.startsWith('Pembayaran:') || d.startsWith('Biaya:') || d.startsWith('Pengeluaran Biaya')) {
        return false;
      }
      return true;
    });

    const ledgerMap: Record<string, { debit?: any; credit?: any }> = {};
    manualEntries.forEach(entry => {
      if (!ledgerMap[entry.id]) {
        ledgerMap[entry.id] = {};
      }
      if (typeof entry.debit === 'number' && entry.debit > 0) {
        ledgerMap[entry.id].debit = entry;
      } else if (typeof entry.credit === 'number' && entry.credit > 0) {
        ledgerMap[entry.id].credit = entry;
      } else {
        ledgerMap[entry.id].debit = entry;
      }
    });

    Object.keys(ledgerMap).forEach(refId => {
      const pair = ledgerMap[refId];
      const mainEntry = pair.debit || pair.credit;
      if (!mainEntry) return;

      let dateStr = mainEntry.date || '';
      const amt = typeof pair.debit?.debit === 'number' ? pair.debit.debit : (typeof pair.credit?.credit === 'number' ? pair.credit.credit : 0);

      list.push({
        id: refId,
        sourceType: 'Jurnal',
        date: dateStr,
        formattedDate: mainEntry.date,
        ref: refId,
        partnerName: 'Entri Jurnal Akuntansi',
        description: mainEntry.description || 'Transaksi Jurnal Manual',
        amount: amt,
        remaining: 0,
        status: mainEntry.status || 'Posted',
        accountMethod: `D: ${pair.debit?.account || '-'} | K: ${pair.credit?.account || '-'}`,
        debitAccount: pair.debit?.account,
        creditAccount: pair.credit?.account,
        originalDoc: pair,
      });
    });
  }

  // Sort by date descending
  list.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return list;
};

export function Accounting() {
  const [activeView, setActiveView] = useState<'akun' | 'jurnal' | 'transaksi' | 'laporan_labarugi' | 'laporan_neraca' | 'laporan_aruskas'>('akun');
  const [accounts, setAccounts] = useState<AccountItem[]>(() => getStoredAccounts());
  const [ledger, setLedger] = useState<JournalEntry[]>(() => getStoredLedger());
  const [unifiedTxList, setUnifiedTxList] = useState<UnifiedTransaction[]>(() => buildUnifiedTransactions());

  // Jurnal Umum Filter, Edit & Deletion States
  const [jurnalSearch, setJurnalSearch] = useState('');
  const [jurnalStartDate, setJurnalStartDate] = useState('');
  const [jurnalEndDate, setJurnalEndDate] = useState('');
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<{ id: string; date: string; account: string; debit: number | string; credit: number | string; index: number } | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // Edit Jurnal State
  const [editingJurnalTx, setEditingJurnalTx] = useState<{
    id: string;
    date: string;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    originalIndex: number;
  } | null>(null);
  const [editJurnalDate, setEditJurnalDate] = useState('');
  const [editJurnalDesc, setEditJurnalDesc] = useState('');
  const [editJurnalDebitAcc, setEditJurnalDebitAcc] = useState('');
  const [editJurnalCreditAcc, setEditJurnalCreditAcc] = useState('');
  const [editJurnalAmount, setEditJurnalAmount] = useState<number | ''>('');

  const handleStartEditJurnalTx = (tx: {
    id: string;
    date: string;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    originalIndex: number;
  }) => {
    setEditingJurnalTx(tx);
    let dStr = tx.date || '';
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        dStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    setEditJurnalDate(dStr);
    setEditJurnalDesc(tx.description || '');
    setEditJurnalDebitAcc(tx.debitAccount || (accounts[0] ? `${accounts[0].code} - ${accounts[0].name}` : ''));
    setEditJurnalCreditAcc(tx.creditAccount || (accounts[1] ? `${accounts[1].code} - ${accounts[1].name}` : ''));
    setEditJurnalAmount(tx.amount || 0);
  };

  const handleSaveEditJurnalTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJurnalTx) return;

    if (!editJurnalDate.trim()) {
      alert('Tanggal transaksi wajib diisi.');
      return;
    }
    if (!editJurnalDebitAcc || !editJurnalCreditAcc) {
      alert('Akun Debit dan Kredit wajib dipilih.');
      return;
    }
    if (typeof editJurnalAmount !== 'number' || editJurnalAmount <= 0) {
      alert('Nominal transaksi harus lebih besar dari 0.');
      return;
    }

    updateJournalTransaction(
      editingJurnalTx.id,
      {
        date: editJurnalDate,
        description: editJurnalDesc,
        debitAccount: editJurnalDebitAcc,
        creditAccount: editJurnalCreditAcc,
        amount: editJurnalAmount
      },
      editingJurnalTx.originalIndex
    );

    setLedger(getStoredLedger());
    setUnifiedTxList(buildUnifiedTransactions());
    setEditingJurnalTx(null);
    setDeleteSuccessMsg(`Transaksi Jurnal ${editingJurnalTx.id || 'berhasil'} diperbarui. Laporan keuangan telah disesuaikan.`);
    setTimeout(() => setDeleteSuccessMsg(''), 4000);
  };

  const handleDeleteJurnalTx = () => {
    if (!deleteConfirmTx) return;
    deleteJournalTransaction(deleteConfirmTx.id, deleteConfirmTx.index);
    setLedger(getStoredLedger());
    setUnifiedTxList(buildUnifiedTransactions());
    setDeleteSuccessMsg(`Transaksi Jurnal ${deleteConfirmTx.id || deleteConfirmTx.account} berhasil dihapus. Laporan keuangan telah diperbarui.`);
    setDeleteConfirmTx(null);
    setTimeout(() => setDeleteSuccessMsg(''), 4000);
  };

  const nowJurnal = new Date();
  const initJurnalStart = new Date(nowJurnal.getFullYear(), nowJurnal.getMonth(), 1);
  const initJurnalEnd = new Date(nowJurnal.getFullYear(), nowJurnal.getMonth() + 1, 0);

  // Jurnal Range Date Picker States (Purchase-style)
  const [jurnalRangeStart, setJurnalRangeStart] = useState<Date>(() => initJurnalStart);
  const [jurnalRangeEnd, setJurnalRangeEnd] = useState<Date>(() => initJurnalEnd);
  const [showJurnalDatePopup, setShowJurnalDatePopup] = useState(false);
  const [jurnalPreset, setJurnalPreset] = useState<string>('This month');
  const [jurnalTempStart, setJurnalTempStart] = useState<Date | null>(() => initJurnalStart);
  const [jurnalTempEnd, setJurnalTempEnd] = useState<Date | null>(() => initJurnalEnd);
  const [jurnalCurrentViewDate, setJurnalCurrentViewDate] = useState<Date>(() => initJurnalStart);

  const handleJurnalPresetClick = (preset: string) => {
    setJurnalPreset(preset);
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
        start.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        end = new Date(start);
        end.setDate(start.getDate() + 6);
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
        end = new Date(2030, 11, 31);
        break;
    }
    setJurnalTempStart(start);
    setJurnalTempEnd(end);
    setJurnalCurrentViewDate(new Date(start.getFullYear(), start.getMonth(), 1));
  };

  const handleJurnalDayClick = (date: Date) => {
    setJurnalPreset('');
    if (!jurnalTempStart || (jurnalTempStart && jurnalTempEnd)) {
      setJurnalTempStart(date);
      setJurnalTempEnd(null);
    } else if (jurnalTempStart && !jurnalTempEnd) {
      if (date < jurnalTempStart) {
        setJurnalTempStart(date);
      } else {
        setJurnalTempEnd(date);
      }
    }
  };

  const handleJurnalApplyDateRange = () => {
    if (jurnalTempStart && jurnalTempEnd) {
      setJurnalRangeStart(jurnalTempStart);
      setJurnalRangeEnd(jurnalTempEnd);
    } else if (jurnalTempStart) {
      setJurnalRangeStart(jurnalTempStart);
      setJurnalRangeEnd(jurnalTempStart);
    }
    setShowJurnalDatePopup(false);
  };

  const renderJurnalCalendarMonth = (dateObj: Date, isLeft: boolean) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const grid = getMonthGrid(year, month);
    const monthName = getMonthName(dateObj);

    const isCellInRange = (d: Date) => {
      if (!jurnalTempStart) return false;
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const s = new Date(jurnalTempStart.getFullYear(), jurnalTempStart.getMonth(), jurnalTempStart.getDate()).getTime();
      if (!jurnalTempEnd) return target === s;
      const e = new Date(jurnalTempEnd.getFullYear(), jurnalTempEnd.getMonth(), jurnalTempEnd.getDate()).getTime();
      return target >= s && target <= e;
    };

    return (
      <div className="flex flex-col select-none">
        <div className="flex items-center justify-between mb-3 px-1">
          {isLeft ? (
            <button 
              type="button"
              onClick={() => setJurnalCurrentViewDate(new Date(year, month - 1, 1))}
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
              onClick={() => setJurnalCurrentViewDate(new Date(jurnalCurrentViewDate.getFullYear(), jurnalCurrentViewDate.getMonth() + 1, 1))}
              className="p-1 text-white hover:text-gray-300 hover:bg-[#181C26] rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        <div className="grid grid-cols-7 gap-y-1 mb-2 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span key={day} className="text-[11px] font-medium text-[#808895]">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {grid.map((cell, idx) => {
            const isStart = jurnalTempStart && cell.date.toDateString() === jurnalTempStart.toDateString();
            const isEnd = jurnalTempEnd && cell.date.toDateString() === jurnalTempEnd.toDateString();
            const isBetween = jurnalTempStart && jurnalTempEnd && cell.date > jurnalTempStart && cell.date < jurnalTempEnd;
            const inRange = isStart || isEnd || isBetween;

            const col = idx % 7;
            const prevInRange = idx > 0 && isCellInRange(grid[idx - 1].date);
            const nextInRange = idx < grid.length - 1 && isCellInRange(grid[idx + 1].date);

            const isStripStart = inRange && (col === 0 || isStart || !prevInRange);
            const isStripEnd = inRange && (col === 6 || isEnd || !nextInRange);

            let wrapperClass = "relative h-8 flex items-center justify-center my-[1px]";
            if (inRange) {
              wrapperClass += " bg-[#081B33]";
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
                  onClick={() => handleJurnalDayClick(cell.date)}
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

  // Transaksi View Filter States
  const [txSearch, setTxSearch] = useState('');
  const [txCategory, setTxCategory] = useState<'Semua' | 'Penjualan' | 'Pembelian' | 'Biaya' | 'Jurnal'>('Semua');
  const [txStatus, setTxStatus] = useState<string>('Semua Status');
  const [txDateRange, setTxDateRange] = useState<string>('Semua Waktu');
  
  // Custom Dropdown Open States
  const [showTxStatusDropdown, setShowTxStatusDropdown] = useState(false);
  const [showTxDateDropdown, setShowTxDateDropdown] = useState(false);
  const [showDebitAccountDropdown, setShowDebitAccountDropdown] = useState(false);
  const [showCreditAccountDropdown, setShowCreditAccountDropdown] = useState(false);
  const [searchAccountDebit, setSearchAccountDebit] = useState('');
  const [searchAccountCredit, setSearchAccountCredit] = useState('');

  // Modals
  const [showManualTxModal, setShowManualTxModal] = useState(false);
  const [selectedDetailTx, setSelectedDetailTx] = useState<UnifiedTransaction | null>(null);

  // Transaksi Manual Form state
  const [showTxDatePicker, setShowTxDatePicker] = useState(false);
  const [txCalendarViewDate, setTxCalendarViewDate] = useState<Date>(() => new Date());
  const [txDate, setTxDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [txRef, setTxRef] = useState('');
  const [txDebitCode, setTxDebitCode] = useState('');
  const [txCreditCode, setTxCreditCode] = useState('');
  const [txAmount, setTxAmount] = useState<number | string>('');
  const [txDesc, setTxDesc] = useState('');
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);

  const handleTxDateSelect = (selectedDate: Date) => {
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    setTxDate(`${yyyy}-${mm}-${dd}`);
    setShowTxDatePicker(false);
  };

  const renderTxDatePickerCalendar = () => {
    const year = txCalendarViewDate.getFullYear();
    const month = txCalendarViewDate.getMonth();
    const grid = getMonthGrid(year, month);
    const monthName = getMonthName(txCalendarViewDate);
    const selectedDateObj = parseAnyDate(txDate);

    return (
      <div className="absolute top-full left-0 mt-2 z-50 bg-[#121214] border border-[#27272A] rounded-2xl p-4 shadow-2xl w-[300px] select-none font-sans">
        <div className="flex items-center justify-between mb-3 px-1">
          <button 
            type="button"
            onClick={() => setTxCalendarViewDate(new Date(year, month - 1, 1))}
            className="p-1 text-white hover:text-gray-300 hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-[13px] font-semibold text-white tracking-tight">
            {monthName} {year}
          </span>

          <button 
            type="button"
            onClick={() => setTxCalendarViewDate(new Date(year, month + 1, 1))}
            className="p-1 text-white hover:text-gray-300 hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1 mb-2 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span key={day} className="text-[11px] font-medium text-[#808895]">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {grid.map((cell, idx) => {
            const isSelected = selectedDateObj && 
              cell.date.getFullYear() === selectedDateObj.getFullYear() &&
              cell.date.getMonth() === selectedDateObj.getMonth() &&
              cell.date.getDate() === selectedDateObj.getDate();

            let btnClass = "w-8 h-8 text-xs font-medium flex items-center justify-center rounded-full transition-all mx-auto ";
            if (isSelected) {
              btnClass += "bg-[#EA580C] text-white font-bold shadow-md shadow-orange-500/20";
            } else if (cell.isCurrent) {
              btnClass += "text-white hover:bg-[#18181B] cursor-pointer";
            } else {
              btnClass += "text-[#4A505B] hover:text-[#788090] cursor-pointer";
            }

            return (
              <div key={idx} className="flex justify-center items-center">
                <button 
                  type="button"
                  onClick={() => handleTxDateSelect(cell.date)}
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

  React.useEffect(() => {
    const handleAccountsUpdate = () => {
      setAccounts(getStoredAccounts());
      setLedger(getStoredLedger());
      setUnifiedTxList(buildUnifiedTransactions());
    };

    setAccounts(getStoredAccounts());
    setLedger(getStoredLedger());
    setUnifiedTxList(buildUnifiedTransactions());

    window.addEventListener('accounts-updated', handleAccountsUpdate);
    window.addEventListener('invoices-updated', handleAccountsUpdate);
    window.addEventListener('costs-updated', handleAccountsUpdate);
    window.addEventListener('ledger-updated', handleAccountsUpdate);

    return () => {
      window.removeEventListener('accounts-updated', handleAccountsUpdate);
      window.removeEventListener('invoices-updated', handleAccountsUpdate);
      window.removeEventListener('costs-updated', handleAccountsUpdate);
      window.removeEventListener('ledger-updated', handleAccountsUpdate);
    };
  }, [activeView]);
  
  // Toolbar states
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Shortcut key Cmd+K or Ctrl+K to focus search input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Dropdown states
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Edit account modal state
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Beban');
  const [editSubCategory, setEditSubCategory] = useState('Operating Expense');

  React.useEffect(() => {
    setHasUnsavedChanges(showCreateModal || editingAccount !== null);
  }, [showCreateModal, editingAccount]);

  const handleStartEditAccount = (acc: AccountItem) => {
    setEditingAccount(acc);
    setEditCode(acc.code);
    setEditName(acc.name);
    const cat = acc.category || 'Beban';
    setEditCategory(cat);
    const defaultSub = getSubCategoriesForCategory(cat)[0]?.value || 'General';
    setEditSubCategory(acc.subCategory || defaultSub);
  };

  const handleEditCategoryChange = (cat: string) => {
    setEditCategory(cat);
    const firstSub = getSubCategoriesForCategory(cat)[0]?.value || 'General';
    setEditSubCategory(firstSub);
  };

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editCode.trim() || !editName.trim()) {
      alert('Kode dan Nama Akun wajib diisi.');
      return;
    }

    const updatedAcc: AccountItem = {
      ...editingAccount,
      code: editCode.trim(),
      name: editName.trim(),
      category: editCategory,
      subCategory: editSubCategory,
      normalBal: editCategory === 'Aset' || editCategory === 'HPP' || editCategory === 'Beban' ? 'Debit' : 'Kredit'
    };

    updateAccountAndPropagate(editingAccount.code, editingAccount.name, updatedAcc);
    setEditingAccount(null);
  };
  
  // New account form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Aset');
  const [newSubCategory, setNewSubCategory] = useState('Cash');
  const [newBalance, setNewBalance] = useState<number>(0);

  const handleNewCategoryChange = (cat: string) => {
    setNewCategory(cat);
    const firstSub = getSubCategoriesForCategory(cat)[0]?.value || 'General';
    setNewSubCategory(firstSub);
  };

  // Formatting helpers
  const formatSaldo = (val: number) => {
    if (val === 0) return '0';
    if (val < 0) {
      return `-${Math.abs(val).toLocaleString('id-ID')}`;
    }
    return val.toLocaleString('id-ID');
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = acc.code.toLowerCase().includes(term) || 
                          acc.name.toLowerCase().includes(term) ||
                          (acc.category && acc.category.toLowerCase().includes(term)) ||
                          (acc.subCategory && acc.subCategory.toLowerCase().includes(term));
    const matchesCat = selectedCategory === 'Semua' || 
                       acc.category === selectedCategory || 
                       (selectedCategory === 'Aset' && acc.code.startsWith('1')) || 
                       (selectedCategory === 'Liabilitas' && acc.code.startsWith('2')) || 
                       (selectedCategory === 'Ekuitas' && acc.code.startsWith('3')) || 
                       (selectedCategory === 'Pendapatan' && acc.code.startsWith('4')) || 
                       (selectedCategory === 'HPP' && acc.code.startsWith('5')) || 
                       (selectedCategory === 'Beban' && acc.code.startsWith('6'));
    return matchesSearch && matchesCat;
  });

  // Category options
  const categoryOptions = [
    'Semua',
    'Aset',
    'Liabilitas',
    'Ekuitas',
    'Pendapatan',
    'HPP',
    'Beban'
  ];

  // Create account submit
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('Kode dan Nama Akun wajib diisi.');
      return;
    }
    const exists = accounts.some(a => a.code.toLowerCase() === newCode.trim().toLowerCase());
    if (exists) {
      alert('Kode Akun sudah digunakan.');
      return;
    }

    const created: AccountItem = {
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      subCategory: newSubCategory || getSubCategoriesForCategory(newCategory)[0]?.value || 'General',
      normalBal: newCategory === 'Aset' || newCategory === 'HPP' || newCategory === 'Beban' ? 'Debit' : 'Kredit',
      level: 2,
      parent: newCode.trim().charAt(0) + '000',
      balance: Number(newBalance) || 0
    };

    addAccountAndPropagate(created);

    // Reset and close
    setNewCode('');
    setNewName('');
    setNewCategory('Aset');
    setNewSubCategory('Cash');
    setNewBalance(0);
    setShowCreateModal(false);
  };

  const handleManualTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDebitCode || !txCreditCode) {
      alert('Pilih Akun Debit dan Akun Kredit.');
      return;
    }
    if (txDebitCode === txCreditCode) {
      alert('Akun Debit dan Akun Kredit tidak boleh sama.');
      return;
    }
    const amt = Number(txAmount);
    if (!amt || amt <= 0) {
      alert('Nominal transaksi harus lebih besar dari 0.');
      return;
    }
    if (!txDesc.trim()) {
      alert('Keterangan transaksi wajib diisi.');
      return;
    }

    const debitAcc = accounts.find(a => a.code === txDebitCode);
    const creditAcc = accounts.find(a => a.code === txCreditCode);

    if (!debitAcc || !creditAcc) {
      alert('Akun tidak ditemukan.');
      return;
    }

    let formattedDate = txDate;
    if (txDate.includes('-')) {
      const [y, m, d] = txDate.split('-');
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      formattedDate = `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    }

    addManualTransaction({
      date: formattedDate,
      debitAccountCode: debitAcc.code,
      debitAccountName: debitAcc.name,
      creditAccountCode: creditAcc.code,
      creditAccountName: creditAcc.name,
      amount: amt,
      description: txDesc.trim(),
      ref: txRef.trim() || undefined
    });

    setTxSuccessMsg(`Transaksi berhasil diposting! Debit: ${debitAcc.name}, Kredit: ${creditAcc.name}, Nominal: Rp ${amt.toLocaleString('id-ID')}`);
    setTimeout(() => setTxSuccessMsg(null), 6000);

    setTxAmount('');
    setTxDesc('');
    setTxRef('');
    setLedger(getStoredLedger());
    setAccounts(getStoredAccounts());
  };

  // Financial Calculations for Reports
  const getBal = (code: string) => accounts.find(a => a.code === code)?.balance || 0;

  const totalKasBank = getBal('1100');
  const totalPiutang = getBal('1200');
  const totalPersediaan = getBal('1300');
  const totalAktivaLancarLainnya = getBal('1400');
  const totalAktivaLancar = totalKasBank + totalPiutang + totalPersediaan + totalAktivaLancarLainnya;
  const totalAktivaTetap = getBal('1500');
  const totalAktiva = accounts.find(a => a.code === '1000')?.balance || (totalAktivaLancar + totalAktivaTetap);

  const totalHutangUsaha = getBal('2100');
  const totalHutangLainnya = getBal('2200') + getBal('2300') + getBal('2400');
  const totalHutangPanjang = 0;
  const totalKewajiban = accounts.find(a => a.code === '2000')?.balance || (totalHutangUsaha + totalHutangLainnya + totalHutangPanjang);

  const totalEkuitas = accounts.find(a => a.code === '3000')?.balance || (getBal('3100') - getBal('3200') + getBal('3300') + getBal('3400'));
  const totalPendapatan = accounts
    .filter(a => (a.category === 'Pendapatan' || a.parent === '4000') && !a.isHeader && a.code !== '4200')
    .reduce((sum, a) => sum + a.balance, 0) || getBal('4100');
  const totalPendapatanLainnya = accounts
    .filter(a => (a.code === '4200' || a.category === 'Pendapatan Lainnya'))
    .reduce((sum, a) => sum + a.balance, 0) || getBal('4200');
  const totalHPP = accounts
    .filter(a => (a.category === 'HPP' || a.category === 'Beban Pokok Penjualan' || a.parent === '5000') && !a.isHeader)
    .reduce((sum, a) => sum + a.balance, 0) || getBal('5100');
  const totalBebanOperasional = accounts
    .filter(a => (a.category === 'Beban' || a.category === 'Beban Operational' || a.subCategory === 'Operating Expense' || a.parent === '6000') && !a.isHeader)
    .reduce((sum, a) => sum + a.balance, 0);

  const labaKotor = totalPendapatan - totalHPP;
  const labaOperasional = labaKotor - totalBebanOperasional;
  const labaBersih = labaOperasional + totalPendapatanLainnya;

  return (
    <div className="flex-1 flex flex-col font-sans text-white bg-[#0A0A0A] min-h-screen">
      
      {/* HEADER BAR (Matching Purchase style) */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-8 pt-[9px] pb-6 bg-[#0A0A0A]">
        <div className="pb-0" style={{ marginBottom: '0px', paddingBottom: '0px' }}>
          <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0 flex items-center gap-2" style={{ marginBottom: 0 }}>
            {activeView !== 'akun' && (
              <button 
                onClick={() => setActiveView('akun')}
                className="p-1 hover:bg-[#1F1F1F] text-[#909090] hover:text-white rounded transition-colors cursor-pointer mr-1"
                title="Kembali ke Daftar Akun"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <span>
              {activeView === 'akun' && 'Accounting'}
              {activeView === 'jurnal' && 'Jurnal Umum'}
              {activeView === 'transaksi' && 'Transaksi Manual'}
              {activeView === 'laporan_labarugi' && 'Laporan Laba Rugi'}
              {activeView === 'laporan_neraca' && 'Laporan Neraca'}
              {activeView === 'laporan_aruskas' && 'Laporan Arus Kas'}
            </span>
          </h1>
          <p className="text-[13px] text-[#909090]">
            {activeView === 'akun' && 'Manage your chart of accounts and general ledger entries here.'}
            {activeView === 'jurnal' && 'Daftar entri jurnal transaksi keuangan perusahaan.'}
            {activeView === 'transaksi' && 'Pencatatan transaksi keuangan manual untuk entri jurnal debit & kredit.'}
            {activeView === 'laporan_labarugi' && 'Laporan laba rugi dan performa operasional perusahaan.'}
            {activeView === 'laporan_neraca' && 'Ringkasan posisi keuangan, aset, kewajiban, dan ekuitas.'}
            {activeView === 'laporan_aruskas' && 'Laporan arus kas masuk dan keluar perusahaan.'}
          </p>
        </div>

        {/* Right Header Navigation & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Jurnal Umum Button */}
          <button
            onClick={() => setActiveView(activeView === 'jurnal' ? 'akun' : 'jurnal')}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
              activeView === 'jurnal' 
                ? 'bg-[#1C1C1E] border-[#10B981] text-white shadow-xs' 
                : 'bg-[#141518] border-[#2B2D36] text-[#D5D5D5] hover:bg-[#1E2026] hover:text-white'
            }`}
          >
            <BookOpen size={15} className="text-[#10B981]" />
            <span>Jurnal Umum</span>
          </button>

          {/* Transaksi Manual Button */}
          <button
            onClick={() => setActiveView(activeView === 'transaksi' ? 'akun' : 'transaksi')}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
              activeView === 'transaksi' 
                ? 'bg-[#1C1C1E] border-[#E87A5D] text-white shadow-xs' 
                : 'bg-[#141518] border-[#2B2D36] text-[#D5D5D5] hover:bg-[#1E2026] hover:text-white'
            }`}
          >
            <Plus size={15} className="text-[#E87A5D]" />
            <span>Transaksi</span>
          </button>
        </div>
      </div>

      {/* VIEW CONTENT */}
      {activeView === 'akun' && (
        <div className="flex-1 p-8 flex flex-col">
          
          {/* TOOLBAR (Left: View Switcher, Center: Search Bar, Right: Action Buttons) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
            
            {/* View Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-[#141518] border border-[#2B2D36] rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#2B2D36] text-white' : 'text-[#808080] hover:text-white'
                  }`}
                  title="List View"
                >
                  <List size={15} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#2B2D36] text-white' : 'text-[#808080] hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid size={15} />
                </button>
              </div>
            </div>

            {/* Search Bar - Exactly like Purchase Page */}
            <div className="flex-1 relative flex items-center min-w-[240px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B7E8C] pointer-events-none">
                <Search size={16} />
              </div>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141518] border border-[#2B2D36] rounded-xl pl-10 pr-12 py-2 text-[13px] text-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/30 transition-all placeholder:text-[#6E7079]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchTerm ? (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-[#808080] hover:text-white cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd className="px-1.5 py-0.5 border border-[#2B2D36] rounded-md bg-[#1D1E24] text-[#8A8F9E] text-[10px] font-medium font-sans">⌘K</kbd>
                )}
              </div>
            </div>

            {/* Right: Import, Print, Buat Akun Baru (Icon Only) Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Import Button */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => {
                    setShowImportDropdown(!showImportDropdown);
                    setShowReportDropdown(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#EA580C] bg-[#1E2026] hover:bg-[#282B33] hover:text-[#FB923C] transition-all px-3 py-2 rounded-xl cursor-pointer shrink-0 active:scale-95 border border-[#2C2F38] shadow-xs"
                >
                  <Upload size={14} />
                  <span>Import</span>
                  <ChevronDown size={13} className="text-[#FB923C]" />
                </button>

                {showImportDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowImportDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-[#1A1B1F] border border-[#2C2E35] rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-white">
                      <button
                        onClick={() => {
                          alert('Format file CSV / Excel yang didukung: Kode, Nama Akun, Kategori, Saldo Awal.');
                          setShowImportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#25272D] text-white cursor-pointer transition-colors"
                      >
                        Import file CSV / Excel
                      </button>
                      <button
                        onClick={() => {
                          setAccounts(getStoredAccounts());
                          alert('Data akun berhasil disinkronkan kembali.');
                          setShowImportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#25272D] text-white cursor-pointer transition-colors border-t border-[#2A2B30]"
                      >
                        Reset / Reload Akun Standar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-medium text-[#D5D5D5] bg-[#141518] hover:bg-[#1E2026] hover:text-white transition-all px-3 py-2 rounded-xl cursor-pointer shrink-0 active:scale-95 border border-[#2B2D36] shadow-xs"
              >
                <Printer size={14} className="text-[#909090]" />
                <span>Print</span>
              </button>

              {/* Buat Akun Baru Button (Icon Only) */}
              <button
                type="button"
                title="Buat Akun Baru"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center p-2 text-xs font-semibold bg-[#EA580C] hover:bg-[#D97706] text-white rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* MAIN CHART OF ACCOUNTS TABLE (Matching user's screenshot exactly) */}
          {viewMode === 'list' ? (
            <div className="border border-[#2A2A2A] rounded-xl bg-[#0A0A0A] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2A2A2A] bg-[#121315]/80 text-[#909090] text-xs font-semibold">
                      <th className="py-3.5 px-3 font-medium">Kode Akun</th>
                      <th className="py-3.5 px-3 font-medium">Nama Akun</th>
                      <th className="py-3.5 px-3 font-medium">Kategori</th>
                      <th className="py-3.5 px-3 font-medium">Subkategori</th>
                      <th className="py-3.5 px-3 font-medium text-center">Normal Bal</th>
                      <th className="py-3.5 px-3 font-medium text-center">Parent</th>
                      <th className="py-3.5 px-3 text-right font-medium pr-4">Saldo</th>
                      <th className="py-3.5 px-3 text-center font-medium w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]/40 text-xs">
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((acc) => {
                        const isHeader = acc.isHeader || acc.level === 1;

                        return (
                          <tr 
                            key={acc.code} 
                            className={`hover:bg-[#141517] transition-colors ${
                              isHeader ? 'bg-[#121315]/90 font-bold' : ''
                            }`}
                          >
                            <td className={`py-3 px-3 font-sans ${isHeader ? 'text-[#E87A5D] font-bold' : 'text-[#D5D5D5]'}`}>
                              {acc.code}
                            </td>
                            <td className="py-3 px-3">
                              <div style={{ paddingLeft: acc.level ? `${(acc.level - 1) * 14}px` : '0px' }}>
                                <span className={`font-sans ${isHeader ? 'text-white font-bold tracking-wide uppercase' : 'text-[#E5E5E5] font-medium'}`}>
                                  {acc.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#A0A0A0] font-sans">
                              {acc.category || '-'}
                            </td>
                            <td className="py-3 px-3 text-[#A0A0A0] font-sans">
                              {acc.subCategory || '-'}
                            </td>
                            <td className="py-3 px-3 text-center text-[#A0A0A0] font-sans">
                              <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-[12px] font-medium leading-none bg-[#22242C] ${
                                acc.normalBal === 'Debit' 
                                  ? 'text-[#EA580C]' 
                                  : 'text-[#FF5252]'
                              }`}>
                                {acc.normalBal || 'Debit'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-[#A0A0A0] font-sans">
                              {acc.parent || '-'}
                            </td>
                            <td className={`py-3 px-3 text-right pr-4 font-sans font-medium ${
                              acc.balance < 0 ? 'text-[#EF4444]' : isHeader ? 'text-[#10B981] font-bold' : 'text-white'
                            }`}>
                              Rp {acc.balance.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleStartEditAccount(acc)}
                                className="p-1 hover:bg-[#2A2A2A] text-[#909090] hover:text-[#E87A5D] rounded transition-colors cursor-pointer"
                                title="Edit Akun"
                              >
                                <Edit3 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-xs text-[#808080]">
                          Tidak ada akun yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAccounts.map((acc) => (
                <div key={acc.code} className="p-4 bg-[#141517] border border-[#2A2A2A] rounded-xl flex flex-col justify-between hover:border-[#E87A5D]/50 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#808080] mb-2">
                      <span className="font-mono bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#2A2A2A]">{acc.code}</span>
                      <span className="text-[11px] text-[#A0A0A0]">{acc.category}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-[#808080] shrink-0" />
                      <span className="text-xs font-semibold text-white hover:text-[#E87A5D] transition-colors cursor-pointer">{acc.name}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#2A2A2A]/40 flex items-center justify-between text-xs">
                    <span className="text-[#808080]">Saldo</span>
                    <span className={`font-bold ${acc.balance < 0 ? 'text-[#EF4444]' : 'text-white'}`}>
                      {formatSaldo(acc.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* JURNAL UMUM VIEW */}
      {activeView === 'jurnal' && (() => {
        interface GroupedTxItem {
          id: string;
          date: string;
          description: string;
          status: string;
          debitAccount: string;
          creditAccount: string;
          amount: number;
          originalIndices: number[];
        }

        const groupedMap = new Map<string, GroupedTxItem>();
        const listWithoutId: GroupedTxItem[] = [];

        ledger.forEach((entry, idx) => {
          const refId = entry.id ? entry.id.trim() : '';

          if (!refId) {
            const isDebit = entry.debit !== '-' && typeof entry.debit === 'number';
            const amt = isDebit ? (entry.debit as number) : (typeof entry.credit === 'number' ? entry.credit : 0);
            listWithoutId.push({
              id: `TX-${idx + 1}`,
              date: entry.date,
              description: entry.description,
              status: entry.status || 'Posted',
              debitAccount: isDebit ? entry.account : '-',
              creditAccount: !isDebit ? entry.account : '-',
              amount: amt,
              originalIndices: [idx]
            });
            return;
          }

          if (!groupedMap.has(refId)) {
            groupedMap.set(refId, {
              id: refId,
              date: entry.date,
              description: entry.description,
              status: entry.status || 'Posted',
              debitAccount: '',
              creditAccount: '',
              amount: 0,
              originalIndices: []
            });
          }

          const group = groupedMap.get(refId)!;
          group.originalIndices.push(idx);

          if (entry.date) group.date = entry.date;
          if (entry.description && !group.description) group.description = entry.description;

          const debAmt = typeof entry.debit === 'number' ? entry.debit : 0;
          const credAmt = typeof entry.credit === 'number' ? entry.credit : 0;

          if (debAmt > 0) {
            if (!group.debitAccount) group.debitAccount = entry.account;
            if (group.amount === 0) group.amount = debAmt;
          }
          if (credAmt > 0) {
            if (!group.creditAccount) group.creditAccount = entry.account;
            if (group.amount === 0) group.amount = credAmt;
          }
        });

        const groupedList: GroupedTxItem[] = [...Array.from(groupedMap.values()), ...listWithoutId];

        const filteredGrouped = groupedList.filter(group => {
          if (jurnalSearch.trim()) {
            const q = jurnalSearch.toLowerCase().trim();
            const matchesId = group.id.toLowerCase().includes(q);
            const matchesDate = group.date.toLowerCase().includes(q);
            const matchesDesc = (group.description || '').toLowerCase().includes(q);
            const matchesDebitAcc = group.debitAccount.toLowerCase().includes(q);
            const matchesCreditAcc = group.creditAccount.toLowerCase().includes(q);
            const matchesStatus = (group.status || '').toLowerCase().includes(q);
            const matchesAmount = group.amount.toString().includes(q);

            if (!matchesId && !matchesDate && !matchesDesc && !matchesDebitAcc && !matchesCreditAcc && !matchesStatus && !matchesAmount) {
              return false;
            }
          }

          if (jurnalRangeStart || jurnalRangeEnd) {
            const entryDate = parseAnyDate(group.date);
            if (entryDate) {
              if (jurnalRangeStart) {
                const start = new Date(jurnalRangeStart);
                start.setHours(0, 0, 0, 0);
                if (entryDate < start) return false;
              }
              if (jurnalRangeEnd) {
                const end = new Date(jurnalRangeEnd);
                end.setHours(23, 59, 59, 999);
                if (entryDate > end) return false;
              }
            }
          }

          return true;
        });

        const totalFilteredAmount = filteredGrouped.reduce((sum, g) => sum + g.amount, 0);

        return (
          <div className="flex-1 p-8 flex flex-col space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Daftar Transaksi Jurnal Umum</h2>
                <p className="text-xs text-[#909090] mt-0.5">
                  Menampilkan {filteredGrouped.length} dari {groupedList.length} transaksi terposting
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs bg-[#EA580C]/10 text-[#EA580C] border border-[#EA580C]/20 px-3 py-1.5 rounded-xl font-medium">
                  Total Transaksi: Rp {totalFilteredAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Filter Toolbar: Search Bar & Date Range Picker */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Cari Ref ID, Akun Debit/Kredit, Keterangan..."
                  value={jurnalSearch}
                  onChange={(e) => setJurnalSearch(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-9 pr-8 py-2 text-white placeholder-[#52525B] focus:outline-none focus:border-[#EA580C] transition-colors"
                />
                {jurnalSearch && (
                  <button
                    onClick={() => setJurnalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#18181B] px-3.5 py-2 rounded-xl border border-[#27272A] bg-[#18181B] transition-all shrink-0"
                    onClick={() => setShowJurnalDatePopup(!showJurnalDatePopup)}
                  >
                    <Calendar size={15} className="text-[#EA580C]" />
                    <div className="flex flex-col justify-center leading-tight shrink-0 text-right">
                      <span className="text-[12px] font-medium text-white">{getDayName(jurnalRangeStart)}</span>
                      <span className="text-[11px] text-[#A1A1AA]">{formatDateStr(jurnalRangeStart)}</span>
                    </div>

                    <div className="text-[18px] font-light text-white tracking-tight leading-none px-0.5 shrink-0">
                      -
                    </div>

                    <div className="flex flex-col justify-center leading-tight shrink-0">
                      <span className="text-[12px] font-medium text-white">{getDayName(jurnalRangeEnd)}</span>
                      <span className="text-[11px] text-[#A1A1AA]">{formatDateStr(jurnalRangeEnd)}</span>
                    </div>
                  </div>

                  {showJurnalDatePopup && (
                    <div className="absolute top-full right-0 md:left-auto mt-2 w-[600px] bg-[#05070A] border border-[#181C26] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden font-sans">
                      <div className="flex flex-1 min-h-[300px]">
                        {/* Sidebar presets */}
                        <div className="w-[125px] border-r border-[#141822] p-2 flex flex-col gap-0.5 bg-[#030407]">
                          {['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month', 'This year', 'Last year', 'All time'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleJurnalPresetClick(preset)}
                              className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                jurnalPreset === preset
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
                          {renderJurnalCalendarMonth(jurnalCurrentViewDate, true)}
                          {renderJurnalCalendarMonth(new Date(jurnalCurrentViewDate.getFullYear(), jurnalCurrentViewDate.getMonth() + 1, 1), false)}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-[#141822] px-4 py-3 bg-[#030407]">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center bg-[#090C12] border border-[#1B202D] rounded-lg px-2.5 py-1 text-[11px]">
                            <span className="text-[#7E8592] mr-1.5 font-sans">Start</span>
                            <span className="text-white font-sans">{jurnalTempStart ? formatDateInputStr(jurnalTempStart) : 'MM/DD/YYYY'}</span>
                          </div>
                          <span className="text-[#5B6270] text-xs font-light">-</span>
                          <div className="flex items-center bg-[#090C12] border border-[#1B202D] rounded-lg px-2.5 py-1 text-[11px]">
                            <span className="text-[#7E8592] mr-1.5 font-sans">End</span>
                            <span className="text-white font-sans">{jurnalTempEnd ? formatDateInputStr(jurnalTempEnd) : 'MM/DD/YYYY'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setShowJurnalDatePopup(false)} 
                            className="px-3.5 py-1.5 border border-[#1B202D] text-[#888E99] hover:text-white hover:bg-[#0E121B] transition-colors rounded-lg text-[11px] font-medium cursor-pointer"
                          >
                            Batal
                          </button>
                          <button 
                            type="button"
                            onClick={handleJurnalApplyDateRange} 
                            className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#D9694C] text-white transition-colors rounded-lg text-[11px] font-semibold cursor-pointer shadow-lg shadow-orange-500/10"
                          >
                            Terapkan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(jurnalSearch || jurnalPreset !== 'All time') && (
                  <button
                    onClick={() => {
                      setJurnalSearch('');
                      handleJurnalPresetClick('All time');
                      handleJurnalApplyDateRange();
                    }}
                    className="px-3 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw size={12} />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Success Alert */}
            {deleteSuccessMsg && (
              <div className="bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} />
                  <span>{deleteSuccessMsg}</span>
                </div>
                <button onClick={() => setDeleteSuccessMsg('')} className="cursor-pointer text-[#10B981] hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Table */}
            <div className="border border-[#27272A] rounded-2xl bg-[#121214] overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272A] bg-[#18181B] text-[#8E9097] text-xs font-semibold">
                    <th className="py-3.5 px-4 w-28">Ref ID</th>
                    <th className="py-3.5 px-4 w-28">Tanggal</th>
                    <th className="py-3.5 px-4">Akun Debit & Kredit</th>
                    <th className="py-3.5 px-4">Catatan / Note</th>
                    <th className="py-3.5 px-4 text-right w-36">Nominal (Rp)</th>
                    <th className="py-3.5 px-4 text-center w-24">Status</th>
                    <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/60 text-xs">
                  {filteredGrouped.length > 0 ? (
                    filteredGrouped.map((tx, index) => (
                      <tr key={`${tx.id}-${index}`} className="hover:bg-[#18181B] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[#A1A1AA] font-medium">{tx.id}</td>
                        <td className="py-3.5 px-4 text-[#D4D4D8]">{tx.date}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 py-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-1.5 py-0.5 rounded shrink-0">Dr</span>
                              <span className="font-semibold text-white truncate">{tx.debitAccount || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-2">
                              <span className="text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 px-1.5 py-0.5 rounded shrink-0">Cr</span>
                              <span className="text-[#D4D4D8] truncate">{tx.creditAccount || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#A1A1AA] max-w-xs">{tx.description || '-'}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-white">
                          Rp {tx.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEditJurnalTx({
                                id: tx.id,
                                date: tx.date,
                                description: tx.description,
                                debitAccount: tx.debitAccount,
                                creditAccount: tx.creditAccount,
                                amount: tx.amount,
                                originalIndex: tx.originalIndices[0] ?? -1
                              })}
                              className="p-1.5 hover:bg-[#EA580C]/10 text-[#71717A] hover:text-[#EA580C] rounded-lg transition-colors cursor-pointer"
                              title="Edit Transaksi Jurnal (Tanggal, Note, Akun)"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmTx({
                                id: tx.id,
                                date: tx.date,
                                account: `Debit: ${tx.debitAccount} | Kredit: ${tx.creditAccount}`,
                                debit: tx.amount,
                                credit: tx.amount,
                                index: tx.originalIndices[0] ?? -1
                              })}
                              className="p-1.5 hover:bg-red-500/10 text-[#71717A] hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Transaksi Jurnal"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#71717A]">
                        Tidak ada transaksi jurnal umum yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Edit Journal Transaction */}
            {editingJurnalTx && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#121214] border border-[#27272A] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
                  <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Edit3 size={18} className="text-[#EA580C]" />
                      <span>Edit Transaksi Jurnal ({editingJurnalTx.id})</span>
                    </div>
                    <button 
                      onClick={() => setEditingJurnalTx(null)}
                      className="text-[#71717A] hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditJurnalTx} className="space-y-4 text-xs">
                    {/* Tanggal Transaksi */}
                    <div>
                      <label className="block text-[#A1A1AA] font-medium mb-1.5">Tanggal Transaksi</label>
                      <input
                        type="date"
                        value={editJurnalDate}
                        onChange={(e) => setEditJurnalDate(e.target.value)}
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                        required
                      />
                    </div>

                    {/* Keterangan / Note */}
                    <div>
                      <label className="block text-[#A1A1AA] font-medium mb-1.5">Keterangan / Catatan Transaksi</label>
                      <input
                        type="text"
                        value={editJurnalDesc}
                        onChange={(e) => setEditJurnalDesc(e.target.value)}
                        placeholder="Contoh: Penjualan produk, Pembayaran biaya operasional..."
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white placeholder-[#52525B] focus:outline-none focus:border-[#EA580C] transition-colors"
                        required
                      />
                    </div>

                    {/* Akun Debit */}
                    <div>
                      <label className="block text-[#A1A1AA] font-medium mb-1.5">Akun Debit (Dr)</label>
                      <select
                        value={editJurnalDebitAcc}
                        onChange={(e) => setEditJurnalDebitAcc(e.target.value)}
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                      >
                        {accounts.map((acc) => (
                          <option key={`deb-${acc.code}`} value={`${acc.code} - ${acc.name}`}>
                            {acc.code} - {acc.name} ({acc.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Akun Kredit */}
                    <div>
                      <label className="block text-[#A1A1AA] font-medium mb-1.5">Akun Kredit (Cr)</label>
                      <select
                        value={editJurnalCreditAcc}
                        onChange={(e) => setEditJurnalCreditAcc(e.target.value)}
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                      >
                        {accounts.map((acc) => (
                          <option key={`cred-${acc.code}`} value={`${acc.code} - ${acc.name}`}>
                            {acc.code} - {acc.name} ({acc.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nominal Rp */}
                    <div>
                      <label className="block text-[#A1A1AA] font-medium mb-1.5">Nominal Transaksi (Rp)</label>
                      <input
                        type="number"
                        min="1"
                        value={editJurnalAmount}
                        onChange={(e) => setEditJurnalAmount(e.target.value ? Number(e.target.value) : '')}
                        placeholder="0"
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                        required
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272A]">
                      <button
                        type="button"
                        onClick={() => setEditingJurnalTx(null)}
                        className="px-4 py-2 border border-[#27272A] hover:bg-[#18181B] text-[#A1A1AA] hover:text-white rounded-xl font-medium transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#EA580C] hover:bg-[#D9694C] text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-lg shadow-orange-500/20"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Delete Confirmation */}
            {deleteConfirmTx && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#121214] border border-[#27272A] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
                  <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                    <div className="flex items-center gap-2.5 text-red-400 font-semibold text-sm">
                      <Trash2 size={18} />
                      <span>Konfirmasi Hapus Transaksi</span>
                    </div>
                    <button
                      onClick={() => setDeleteConfirmTx(null)}
                      className="text-[#71717A] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-[#D4D4D8]">
                    <p>Apakah Anda yakin ingin menghapus entri jurnal ini?</p>
                    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Ref ID:</span>
                        <span className="font-mono text-white font-medium">{deleteConfirmTx.id || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Tanggal:</span>
                        <span className="text-white">{deleteConfirmTx.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Akun:</span>
                        <span className="text-white font-medium">{deleteConfirmTx.account}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Nominal:</span>
                        <span className="text-[#10B981] font-semibold">
                          {typeof deleteConfirmTx.debit === 'number' && deleteConfirmTx.debit > 0
                            ? `Debit Rp ${deleteConfirmTx.debit.toLocaleString('id-ID')}`
                            : typeof deleteConfirmTx.credit === 'number' && deleteConfirmTx.credit > 0
                            ? `Kredit Rp ${deleteConfirmTx.credit.toLocaleString('id-ID')}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] italic bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2.5 rounded-lg">
                      ⚠️ Menghapus transaksi ini akan membatalkan pengaruhnya terhadap saldo akun, Laba Rugi, dan Neraca secara otomatis.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmTx(null)}
                      className="px-4 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteJurnalTx}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/20"
                    >
                      <Trash2 size={13} />
                      <span>Ya, Hapus Transaksi</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* TRANSAKSI MANUAL VIEW */}
      {activeView === 'transaksi' && (
        <div className="flex-1 w-full px-8 py-6 space-y-6">
          
          {/* Top Banner Alert if Success */}
          {txSuccessMsg && (
            <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] p-4 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} className="shrink-0 text-[#10B981]" />
                <span>{txSuccessMsg}</span>
              </div>
              <button 
                onClick={() => setTxSuccessMsg(null)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="w-full space-y-6">
            
            <form onSubmit={handleManualTxSubmit} className="w-full space-y-4 text-xs">
              
              {/* Row 1: Tanggal & Ref ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[#A1A1AA] font-medium block mb-1.5">Tanggal Transaksi *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTxDatePicker(!showTxDatePicker);
                      setShowDebitAccountDropdown(false);
                      setShowCreditAccountDropdown(false);
                    }}
                    className="w-full bg-[#18181B] border border-[#27272A] hover:border-[#EA580C]/50 rounded-xl px-3.5 py-2.5 text-white flex items-center justify-between transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar size={15} className="text-[#EA580C]" />
                      <span className="text-white font-medium">
                        {(() => {
                          const d = parseAnyDate(txDate) || new Date();
                          return `${getDayName(d)}, ${formatDateStr(d)}`;
                        })()}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-[#71717A] transition-transform ${showTxDatePicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showTxDatePicker && renderTxDatePickerCalendar()}
                </div>

                <div>
                  <label className="text-[#A1A1AA] font-medium block mb-1.5">No. Referensi / Bukti (Opsional)</label>
                  <input 
                    type="text"
                    placeholder="Contoh: JV-2026-001 (Auto generated jika kosong)"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all placeholder-[#52525B]"
                  />
                </div>
              </div>

              {/* Row 2: Custom Dropdowns for Debit & Credit Accounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Akun DEBIT Custom Dropdown */}
                <div className="relative">
                  <label className="text-[#EA580C] font-semibold block mb-1.5 flex items-center justify-between">
                    <span>Akun DEBIT *</span>
                    <span className="text-[10px] text-[#71717A] font-normal">(Penambahan Aset/Beban)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDebitAccountDropdown(!showDebitAccountDropdown);
                      setShowCreditAccountDropdown(false);
                    }}
                    className="w-full bg-[#18181B] border border-[#EA580C]/50 rounded-xl px-3.5 py-2.5 text-white flex items-center justify-between hover:border-[#EA580C] transition-all cursor-pointer text-left"
                  >
                    <span className={txDebitCode ? "text-white font-medium" : "text-[#71717A]"}>
                      {txDebitCode ? (
                        (() => {
                          const acc = accounts.find(a => a.code === txDebitCode);
                          return acc ? `${acc.code} - ${acc.name} (${acc.category})` : txDebitCode;
                        })()
                      ) : "-- Pilih Akun Debit --"}
                    </span>
                    <ChevronDown size={16} className={`text-[#71717A] transition-transform ${showDebitAccountDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDebitAccountDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-64">
                      <div className="p-2 border-b border-[#27272A] bg-[#18181B] sticky top-0 z-10">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                          <input
                            type="text"
                            placeholder="Cari kode atau nama akun..."
                            value={searchAccountDebit}
                            onChange={(e) => setSearchAccountDebit(e.target.value)}
                            className="w-full bg-[#121214] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-[#EA580C]"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto divide-y divide-[#27272A]/40">
                        {accounts
                          .filter(a => !a.isHeader)
                          .filter(a => 
                            !searchAccountDebit || 
                            a.code.toLowerCase().includes(searchAccountDebit.toLowerCase()) || 
                            a.name.toLowerCase().includes(searchAccountDebit.toLowerCase()) ||
                            (a.category && a.category.toLowerCase().includes(searchAccountDebit.toLowerCase()))
                          )
                          .map(acc => (
                            <button
                              key={acc.code}
                              type="button"
                              onClick={() => {
                                setTxDebitCode(acc.code);
                                setShowDebitAccountDropdown(false);
                                setSearchAccountDebit('');
                              }}
                              className={`w-full text-left px-3.5 py-2.5 hover:bg-[#18181B] transition-colors flex items-center justify-between cursor-pointer ${
                                txDebitCode === acc.code ? 'bg-[#EA580C]/10 border-l-2 border-[#EA580C]' : ''
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-white text-xs flex items-center gap-2">
                                  <span className="font-mono text-[#EA580C] bg-[#EA580C]/10 px-1.5 py-0.5 rounded text-[10px]">{acc.code}</span>
                                  <span>{acc.name}</span>
                                </div>
                                <div className="text-[10px] text-[#71717A] mt-0.5">{acc.category}</div>
                              </div>
                              {txDebitCode === acc.code && <Check size={14} className="text-[#EA580C]" />}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Akun KREDIT Custom Dropdown */}
                <div className="relative">
                  <label className="text-[#10B981] font-semibold block mb-1.5 flex items-center justify-between">
                    <span>Akun KREDIT *</span>
                    <span className="text-[10px] text-[#71717A] font-normal">(Pengurangan Kas/Sumber)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreditAccountDropdown(!showCreditAccountDropdown);
                      setShowDebitAccountDropdown(false);
                    }}
                    className="w-full bg-[#18181B] border border-[#10B981]/50 rounded-xl px-3.5 py-2.5 text-white flex items-center justify-between hover:border-[#10B981] transition-all cursor-pointer text-left"
                  >
                    <span className={txCreditCode ? "text-white font-medium" : "text-[#71717A]"}>
                      {txCreditCode ? (
                        (() => {
                          const acc = accounts.find(a => a.code === txCreditCode);
                          return acc ? `${acc.code} - ${acc.name} (${acc.category})` : txCreditCode;
                        })()
                      ) : "-- Pilih Akun Kredit --"}
                    </span>
                    <ChevronDown size={16} className={`text-[#71717A] transition-transform ${showCreditAccountDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCreditAccountDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-64">
                      <div className="p-2 border-b border-[#27272A] bg-[#18181B] sticky top-0 z-10">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                          <input
                            type="text"
                            placeholder="Cari kode atau nama akun..."
                            value={searchAccountCredit}
                            onChange={(e) => setSearchAccountCredit(e.target.value)}
                            className="w-full bg-[#121214] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-[#10B981]"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto divide-y divide-[#27272A]/40">
                        {accounts
                          .filter(a => !a.isHeader)
                          .filter(a => 
                            !searchAccountCredit || 
                            a.code.toLowerCase().includes(searchAccountCredit.toLowerCase()) || 
                            a.name.toLowerCase().includes(searchAccountCredit.toLowerCase()) ||
                            (a.category && a.category.toLowerCase().includes(searchAccountCredit.toLowerCase()))
                          )
                          .map(acc => (
                            <button
                              key={acc.code}
                              type="button"
                              onClick={() => {
                                setTxCreditCode(acc.code);
                                setShowCreditAccountDropdown(false);
                                setSearchAccountCredit('');
                              }}
                              className={`w-full text-left px-3.5 py-2.5 hover:bg-[#18181B] transition-colors flex items-center justify-between cursor-pointer ${
                                txCreditCode === acc.code ? 'bg-[#10B981]/10 border-l-2 border-[#10B981]' : ''
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-white text-xs flex items-center gap-2">
                                  <span className="font-mono text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded text-[10px]">{acc.code}</span>
                                  <span>{acc.name}</span>
                                </div>
                                <div className="text-[10px] text-[#71717A] mt-0.5">{acc.category}</div>
                              </div>
                              {txCreditCode === acc.code && <Check size={14} className="text-[#10B981]" />}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Row 3: Nominal */}
              <div>
                <label className="text-[#A1A1AA] font-medium block mb-1.5">Jumlah Nominal (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] font-semibold">Rp</span>
                  <input 
                    type="number"
                    placeholder="0"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-10 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all placeholder-[#52525B]"
                    required
                    min={1}
                  />
                </div>
                {Number(txAmount) > 0 && (
                  <p className="text-[11px] text-[#EA580C] mt-1 font-mono">
                    Terbilang: Rp {Number(txAmount).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Row 4: Keterangan / Memo */}
              <div>
                <label className="text-[#A1A1AA] font-medium block mb-1.5">Keterangan Transaksi / Catatan *</label>
                <textarea 
                  rows={3}
                  placeholder="Contoh: Pembayaran sewa kantor bulan ini via Bank BCA"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all placeholder-[#52525B]"
                  required
                />
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => {
                    setTxAmount('');
                    setTxDesc('');
                    setTxRef('');
                    setTxDebitCode('');
                    setTxCreditCode('');
                  }}
                  className="px-4 py-2.5 bg-[#1C1D21] hover:bg-[#25262B] border border-[#27272A] text-[#A1A1AA] hover:text-white font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#c2410c] text-white font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#EA580C]/20 flex items-center gap-2 active:scale-95"
                >
                  <Send size={15} />
                  <span>Posting Transaksi</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* FINANCIAL REPORTS (Laporan Laba Rugi) */}
      {activeView === 'laporan_labarugi' && (
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="text-center border-b border-[#2A2A2A] pb-6">
              <h2 className="text-xl font-bold text-white">LAPORAN LABA RUGI (INCOME STATEMENT)</h2>
              <p className="text-xs text-[#808080] mt-1">Periode Berjalan Tahun 2026</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-[#E87A5D] uppercase tracking-wider text-[11px]">
                  <span>I. Pendapatan Usaha</span>
                  <span>Rp {totalPendapatan.toLocaleString('id-ID')}</span>
                </div>
                {accounts.filter(a => (a.category === 'Pendapatan' || a.parent === '4000') && !a.isHeader && a.code !== '4200').map(acc => (
                  <div key={acc.code} className="pl-4 flex justify-between text-[#D5D5D5]">
                    <span>{acc.name}</span>
                    <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* COGS / HPP */}
              <div className="space-y-2 pt-2 border-t border-[#2A2A2A]/40">
                <div className="flex justify-between font-bold text-[#E87A5D] uppercase tracking-wider text-[11px]">
                  <span>II. Beban Pokok Penjualan (HPP)</span>
                  <span>(Rp {totalHPP.toLocaleString('id-ID')})</span>
                </div>
                {accounts.filter(a => (a.category === 'HPP' || a.category === 'Beban Pokok Penjualan' || a.parent === '5000') && !a.isHeader).map(acc => (
                  <div key={acc.code} className="pl-4 flex justify-between text-[#D5D5D5]">
                    <span>{acc.name}</span>
                    <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* Gross Profit */}
              <div className="p-3 bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] flex justify-between items-center font-bold text-sm text-white">
                <div>
                  <span className="block">LABA KOTOR (GROSS PROFIT)</span>
                  <span className="block text-[10px] text-[#808080] font-normal">Pendapatan Usaha dikurangi Harga Pokok Penjualan (HPP)</span>
                </div>
                <span className={labaKotor >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                  Rp {labaKotor.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-2 pt-2 border-t border-[#2A2A2A]/40">
                <div className="flex justify-between font-bold text-[#E87A5D] uppercase tracking-wider text-[11px]">
                  <span>III. Beban Operasional</span>
                  <span>(Rp {totalBebanOperasional.toLocaleString('id-ID')})</span>
                </div>
                {accounts.filter(a => (a.category === 'Beban' || a.category === 'Beban Operational' || a.parent === '6000') && !a.isHeader).map(acc => (
                  <div key={acc.code} className="pl-4 flex justify-between text-[#D5D5D5]">
                    <span>{acc.name}</span>
                    <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* Operating Profit */}
              <div className="p-3 bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] flex justify-between font-bold text-sm text-white">
                <span>LABA OPERASIONAL (EBITDA)</span>
                <span className={labaOperasional >= 0 ? 'text-white' : 'text-[#EF4444]'}>
                  Rp {labaOperasional.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Other Income / Expenses */}
              <div className="space-y-2 pt-2 border-t border-[#2A2A2A]/40">
                <div className="flex justify-between font-bold text-[#E87A5D] uppercase tracking-wider text-[11px]">
                  <span>IV. Pendapatan & Beban Lainnya</span>
                  <span>Rp {totalPendapatanLainnya.toLocaleString('id-ID')}</span>
                </div>
                {accounts.filter(a => a.code === '4200' || a.category === 'Pendapatan Lainnya').map(acc => (
                  <div key={acc.code} className="pl-4 flex justify-between text-[#D5D5D5]">
                    <span>{acc.name}</span>
                    <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* Net Income */}
              <div className="p-4 bg-[#E87A5D]/10 border border-[#E87A5D]/30 rounded-xl flex justify-between font-bold text-base text-white mt-6">
                <span>LABA BERSIH (NET PROFIT)</span>
                <span className={labaBersih >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                  Rp {labaBersih.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FINANCIAL REPORTS (Laporan Neraca) */}
      {activeView === 'laporan_neraca' && (
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="text-center border-b border-[#2A2A2A] pb-6">
              <h2 className="text-xl font-bold text-white">LAPORAN NERACA (BALANCE SHEET)</h2>
              <p className="text-xs text-[#808080] mt-1">Per Posisi Juli 2026</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              {/* ASSETS / AKTIVA */}
              <div className="space-y-4 bg-[#0A0A0A] p-5 rounded-xl border border-[#2A2A2A]">
                <h3 className="font-bold text-white uppercase text-[12px] border-b border-[#2A2A2A] pb-2">
                  AKTIVA (ASSETS)
                </h3>
                
                {/* Aktiva Lancar */}
                <div className="space-y-2">
                  <span className="font-semibold text-white block">Aktiva Lancar</span>
                  <div className="pl-2 space-y-1.5 text-[#D5D5D5]">
                    {/* Kas & Bank */}
                    {accounts.filter(a => (a.parent === '1100' || a.category === 'Kas & Bank' || a.subCategory === 'Cash' || a.subCategory === 'Bank') && !a.isHeader).map(acc => (
                      <div key={acc.code} className="flex justify-between">
                        <span className="text-[#A0A0A0]">{acc.name}</span>
                        <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    {/* Piutang */}
                    {accounts.filter(a => (a.code === '1200' || a.category === 'Akun Piutang' || a.subCategory === 'Receivable') && !a.isHeader).map(acc => (
                      <div key={acc.code} className="flex justify-between">
                        <span className="text-[#A0A0A0]">{acc.name}</span>
                        <span className={acc.balance < 0 ? 'text-[#EF4444]' : ''}>
                          {formatSaldo(acc.balance)}
                        </span>
                      </div>
                    ))}
                    {/* Persediaan */}
                    {accounts.filter(a => (a.code === '1300' || a.category === 'Persediaan' || a.subCategory === 'Inventory') && !a.isHeader).map(acc => (
                      <div key={acc.code} className="flex justify-between">
                        <span className="text-[#A0A0A0]">{acc.name}</span>
                        <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    {/* Aktiva Lancar Lainnya */}
                    {accounts.filter(a => (a.code === '1400' || a.category === 'Aktiva Lancar Lainnya' || a.subCategory === 'Prepaid') && !a.isHeader && a.balance !== 0).map(acc => (
                      <div key={acc.code} className="flex justify-between">
                        <span className="text-[#A0A0A0]">{acc.name}</span>
                        <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-[#2A2A2A]/40 text-[11px]">
                    <span>Total Aktiva Lancar</span>
                    <span>Rp {totalAktivaLancar.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Aktiva Tetap */}
                <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
                  <span className="font-semibold text-white block">Aktiva Tetap</span>
                  <div className="pl-2 space-y-1.5 text-[#D5D5D5]">
                    {accounts.filter(a => (a.parent === '1500' || a.category === 'Aktiva Tetap' || a.subCategory === 'Fixed Asset' || a.subCategory === 'Contra Asset') && !a.isHeader).map(acc => (
                      <div key={acc.code} className="flex justify-between">
                        <span className="text-[#A0A0A0]">{acc.name}</span>
                        <span className={acc.balance < 0 ? 'text-[#EF4444]' : ''}>
                          {formatSaldo(acc.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-[#2A2A2A]/40 text-[11px]">
                    <span>Total Aktiva Tetap</span>
                    <span>Rp {totalAktivaTetap.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg flex justify-between font-bold text-xs text-white">
                  <span>TOTAL AKTIVA</span>
                  <span>Rp {totalAktiva.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY / PASIVA */}
              <div className="space-y-4 bg-[#0A0A0A] p-5 rounded-xl border border-[#2A2A2A]">
                <h3 className="font-bold text-[#E87A5D] uppercase text-[12px] border-b border-[#2A2A2A] pb-2">
                  PASIVA (KEWAJIBAN & EKUITAS)
                </h3>

                {/* Kewajiban */}
                <div className="space-y-2">
                  <span className="font-semibold text-white block">Kewajiban / Hutang</span>
                  <div className="pl-2 space-y-1.5 text-[#D5D5D5]">
                    {accounts.filter(a => (a.category === 'Liabilitas' || a.category === 'Akun Hutang' || a.parent === '2000') && !a.isHeader).map(acc => (
                      <div key={acc.code} className="flex justify-between">
                        <span className="text-[#A0A0A0]">{acc.name}</span>
                        <span>Rp {acc.balance.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-[#2A2A2A]/40 text-[11px]">
                    <span>Total Kewajiban</span>
                    <span>Rp {totalKewajiban.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Ekuitas */}
                <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
                  <span className="font-semibold text-white block">Ekuitas / Modal</span>
                  <div className="pl-2 space-y-1.5 text-[#D5D5D5]">
                    {accounts.filter(a => (a.category === 'Ekuitas' || a.parent === '3000') && !a.isHeader).map(acc => (
                      <div key={acc.code} className="flex justify-between">
                        <span className="text-[#A0A0A0]">{acc.name}</span>
                        <span className={acc.balance < 0 ? 'text-[#EF4444] font-semibold' : ''}>
                          {acc.balance < 0 ? `-Rp ${Math.abs(acc.balance).toLocaleString('id-ID')}` : `Rp ${acc.balance.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-[#2A2A2A]/40 text-[11px]">
                    <span>Total Ekuitas</span>
                    <span className={totalEkuitas < 0 ? 'text-[#EF4444]' : ''}>
                      {totalEkuitas < 0 ? `-Rp ${Math.abs(totalEkuitas).toLocaleString('id-ID')}` : `Rp ${totalEkuitas.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#E87A5D]/10 border border-[#E87A5D]/30 rounded-lg flex justify-between font-bold text-xs text-white">
                  <span>TOTAL PASIVA</span>
                  <span>
                    {(totalKewajiban + totalEkuitas) < 0 
                      ? `-Rp ${Math.abs(totalKewajiban + totalEkuitas).toLocaleString('id-ID')}`
                      : `Rp ${(totalKewajiban + totalEkuitas).toLocaleString('id-ID')}`
                    }
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FINANCIAL REPORTS (Laporan Arus Kas) */}
      {activeView === 'laporan_aruskas' && (
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="text-center border-b border-[#2A2A2A] pb-6">
              <h2 className="text-xl font-bold text-white">LAPORAN ARUS KAS (CASH FLOW STATEMENT)</h2>
              <p className="text-xs text-[#808080] mt-1">Metode Langsung Periode 2026</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] space-y-3">
                <span className="font-bold text-[#E87A5D] uppercase text-[11px] block">
                  Arus Kas Dari Aktivitas Operasional
                </span>
                <div className="flex justify-between text-[#D5D5D5]">
                  <span>Penerimaan dari Pelanggan</span>
                  <span>Rp {totalPendapatan.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[#D5D5D5]">
                  <span>Pembayaran kepada Pemasok & Operasional</span>
                  <span>(Rp {(totalHPP + totalBebanOperasional).toLocaleString('id-ID')})</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-[#2A2A2A]/40">
                  <span>Kas Bersih Dari Aktivitas Operasional</span>
                  <span className="text-[#10B981]">Rp {labaBersih.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="p-4 bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] space-y-3">
                <span className="font-bold text-[#E87A5D] uppercase text-[11px] block">
                  Saldo Kas Perusahaan
                </span>
                <div className="flex justify-between text-[#D5D5D5]">
                  <span>Saldo Kas & Bank Awal</span>
                  <span>Rp {(totalKasBank - labaBersih).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-[#2A2A2A]/40">
                  <span>Total Kas & Bank Akhir</span>
                  <span className="text-white">Rp {totalKasBank.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT AKUN BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <h3 className="text-sm font-bold text-white">Buat Akun Baru</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-[#808080] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Kode Akun *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 1-10600"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Nama Akun *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Kas Kecil Operasional"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Kategori Akun *</label>
                <select
                  value={newCategory}
                  onChange={(e) => handleNewCategoryChange(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {categoryOptions.filter(c => c !== 'Semua').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Sub Kategori Akun *</label>
                <select
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {getSubCategoriesForCategory(newCategory).map(sc => (
                    <option key={sc.value} value={sc.value}>{sc.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Saldo Awal (Rp)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(Number(e.target.value))}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] hover:bg-[#1C1C1E] text-[#D5D5D5] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E87A5D] hover:bg-[#D9694C] text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCOUNT MODAL */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 size={16} className="text-[#E87A5D]" />
                Edit / Ganti Nama Akun
              </h3>
              <button 
                onClick={() => setEditingAccount(null)}
                className="text-[#808080] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAccount} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Kode Akun *</label>
                <input 
                  type="text" 
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Nama Akun *</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                  required
                />
                <p className="text-[11px] text-[#808080]">
                  Mengganti nama akun akan memperbarui semua transaksi lama yang menggunakan akun ini secara otomatis.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Kategori Akun *</label>
                <select
                  value={editCategory}
                  onChange={(e) => handleEditCategoryChange(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {categoryOptions.filter(c => c !== 'Semua').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Sub Kategori Akun *</label>
                <select
                  value={editSubCategory}
                  onChange={(e) => setEditSubCategory(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {getSubCategoriesForCategory(editCategory).map(sc => (
                    <option key={sc.value} value={sc.value}>{sc.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] hover:bg-[#1C1C1E] text-[#D5D5D5] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E87A5D] hover:bg-[#D9694C] text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
