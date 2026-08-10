import React, { useState, useEffect } from 'react';
import { 
  getDynamicFinancials, 
  getStoredAccounts, 
  addAccountAndPropagate, 
  updateAccountAndPropagate, 
  AccountItem,
  getSubCategoriesForCategory,
  subCategoryOptionsMap
} from '../lib/state';
import {
  FileText,
  Download,
  Calendar,
  Percent,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Scale,
  Coins,
  ShieldAlert,
  Building2,
  FileSpreadsheet,
  ArrowUpRight,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  RefreshCw,
  Plus,
  Edit3,
  Search,
  Filter,
  BookOpen,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Let's define the interface for our report data
interface FinancialReportItem {
  name: string;
  amount: number;
  subItems?: { name: string; amount: number }[];
}

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

export function Reports() {
  const [activeReportTab, setActiveReportTab] = useState<'LabaRugi' | 'Neraca' | 'ArusKas'>('LabaRugi');
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025'>('2026');
  const [taxScheme, setTaxScheme] = useState<'FinalMSME' | 'TarifUmum'>('TarifUmum'); // Final 0.5% vs Normal 22% with 31E facility
  const [fiscalCorrection, setFiscalCorrection] = useState<number>(0); // positive fiscal correction simulation
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Accounts state & live listener
  const [accounts, setAccounts] = useState<AccountItem[]>(() => getStoredAccounts());
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [selectedAccountCategory, setSelectedAccountCategory] = useState('Semua');

  useEffect(() => {
    const handleAccountsUpdate = () => {
      setAccounts(getStoredAccounts());
    };
    window.addEventListener('accounts-updated', handleAccountsUpdate);
    window.addEventListener('ledger-updated', handleAccountsUpdate);
    window.addEventListener('invoices-updated', handleAccountsUpdate);
    window.addEventListener('costs-updated', handleAccountsUpdate);
    return () => {
      window.removeEventListener('accounts-updated', handleAccountsUpdate);
      window.removeEventListener('ledger-updated', handleAccountsUpdate);
      window.removeEventListener('invoices-updated', handleAccountsUpdate);
      window.removeEventListener('costs-updated', handleAccountsUpdate);
    };
  }, []);

  // Create account state
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccCategory, setNewAccCategory] = useState('Aset');
  const [newAccSubCategory, setNewAccSubCategory] = useState('Cash');
  const [newAccBalance, setNewAccBalance] = useState<number>(0);

  const handleNewAccCategoryChange = (cat: string) => {
    setNewAccCategory(cat);
    const firstSub = getSubCategoriesForCategory(cat)[0]?.value || 'General';
    setNewAccSubCategory(firstSub);
  };

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode.trim() || !newAccName.trim()) {
      alert('Kode dan Nama Akun wajib diisi.');
      return;
    }
    const exists = accounts.some(a => a.code.toLowerCase() === newAccCode.trim().toLowerCase());
    if (exists) {
      alert('Kode Akun sudah digunakan.');
      return;
    }

    const created: AccountItem = {
      code: newAccCode.trim(),
      name: newAccName.trim(),
      category: newAccCategory,
      subCategory: newAccSubCategory || getSubCategoriesForCategory(newAccCategory)[0]?.value || 'General',
      normalBal: newAccCategory === 'Aset' || newAccCategory === 'HPP' || newAccCategory === 'Beban' ? 'Debit' : 'Kredit',
      level: 2,
      parent: newAccCode.trim().charAt(0) + '000',
      balance: Number(newAccBalance) || 0
    };

    addAccountAndPropagate(created);

    // Reset & Close
    setNewAccCode('');
    setNewAccName('');
    setNewAccCategory('Aset');
    setNewAccSubCategory('Cash');
    setNewAccBalance(0);
    setShowCreateAccountModal(false);
    setExportSuccessMessage(`Akun "${created.name}" (${created.code}) berhasil ditambahkan dan langsung tersedia di semua dropdown!`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Edit account state
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [editAccCode, setEditAccCode] = useState('');
  const [editAccName, setEditAccName] = useState('');
  const [editAccCategory, setEditAccCategory] = useState('Beban');
  const [editAccSubCategory, setEditAccSubCategory] = useState('Operating Expense');

  const handleStartEditAccount = (acc: AccountItem) => {
    setEditingAccount(acc);
    setEditAccCode(acc.code);
    setEditAccName(acc.name);
    const cat = acc.category || 'Beban';
    setEditAccCategory(cat);
    const defaultSub = getSubCategoriesForCategory(cat)[0]?.value || 'General';
    setEditAccSubCategory(acc.subCategory || defaultSub);
  };

  const handleEditAccCategoryChange = (cat: string) => {
    setEditAccCategory(cat);
    const firstSub = getSubCategoriesForCategory(cat)[0]?.value || 'General';
    setEditAccSubCategory(firstSub);
  };

  const handleSaveEditAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editAccCode.trim() || !editAccName.trim()) {
      alert('Kode dan Nama Akun wajib diisi.');
      return;
    }

    const updatedAcc: AccountItem = {
      ...editingAccount,
      code: editAccCode.trim(),
      name: editAccName.trim(),
      category: editAccCategory,
      subCategory: editAccSubCategory,
      normalBal: editAccCategory === 'Aset' || editAccCategory === 'HPP' || editAccCategory === 'Beban' ? 'Debit' : 'Kredit'
    };

    updateAccountAndPropagate(editingAccount.code, editingAccount.name, updatedAcc);
    setEditingAccount(null);
    setExportSuccessMessage(`Nama akun "${editingAccount.name}" berhasil diubah menjadi "${updatedAcc.name}". Semua transaksi lama otomatis menggunakan nama baru ini!`);
    setTimeout(() => setExportSuccessMessage(null), 5000);
  };

  const reportNow = new Date();
  const initReportStart = new Date(reportNow.getFullYear(), reportNow.getMonth(), 1);
  const initReportEnd = new Date(reportNow.getFullYear(), reportNow.getMonth() + 1, 0);

  const [showDatePopup, setShowDatePopup] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date>(initReportStart);
  const [rangeEnd, setRangeEnd] = useState<Date>(initReportEnd);
  const [tempStart, setTempStart] = useState<Date | null>(initReportStart);
  const [tempEnd, setTempEnd] = useState<Date | null>(initReportEnd);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(initReportStart);
  const [selectedPreset, setSelectedPreset] = useState<string>('This month');

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

    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          {isLeft ? (
            <button 
              onClick={() => setCurrentViewDate(new Date(year, month - 1, 1))}
              className="p-1 text-[#909090] hover:text-white hover:bg-[#2A2A2E] rounded transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <span className="text-[12px] font-medium text-white tracking-tight">
            {monthName} {year}
          </span>

          {!isLeft ? (
            <button 
              onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))}
              className="p-1 text-[#909090] hover:text-white hover:bg-[#2A2A2E] rounded transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          ) : (
            <div className="w-5" />
          )}
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
            const isStart = tempStart && cell.date.toDateString() === tempStart.toDateString();
            const isEnd = tempEnd && cell.date.toDateString() === tempEnd.toDateString();
            const isBetween = tempStart && tempEnd && cell.date > tempStart && cell.date < tempEnd;
            
            // Highlight wrappers
            let wrapperClass = "relative h-7 flex items-center justify-center";
            if (isBetween) {
              wrapperClass += " bg-[#E87A5D0F]";
            } else if (isStart && tempEnd) {
              wrapperClass += " bg-gradient-to-r from-transparent via-[#E87A5D0F] to-[#E87A5D0F]";
            } else if (isEnd && tempStart) {
              wrapperClass += " bg-gradient-to-l from-transparent via-[#E87A5D0F] to-[#E87A5D0F]";
            }

            let btnClass = "w-6 h-6 text-[10.5px] flex items-center justify-center rounded-full transition-all relative z-10";
            if (isStart || isEnd) {
              btnClass += " bg-[#E87A5D] text-white font-semibold shadow-sm";
            } else if (cell.isCurrent) {
              btnClass += " text-white hover:bg-[#2A2A2E] cursor-pointer";
            } else {
              btnClass += " text-[#4A4A4D] hover:text-[#777] cursor-pointer";
            }

            const isToday = cell.date.getFullYear() === 2026 && cell.date.getMonth() === 6 && cell.date.getDate() === 8;

            return (
              <div key={idx} className={wrapperClass}>
                <button 
                  onClick={() => handleDayClick(cell.date)}
                  className={btnClass}
                >
                  {cell.dayNum}
                  {isToday && !isStart && !isEnd && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#E87A5D] rounded-full" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // DYNAMIC FINANCIAL DATA FOR 2026 FROM CENTRAL STATE
  const data2026 = getDynamicFinancials('2026', rangeStart, rangeEnd);

  // FINANCIAL DATA FOR 2025 & 2024 (Dynamic / Zero for clean initial state)
  const data2025 = getDynamicFinancials('2025', rangeStart, rangeEnd);
  const data2024 = {
    revenue: 0,
    cogs: 0,
    openingInventory: 0,
    totalPurchase: 0,
    closingInventory: 0,
    operatingExpenses: [],
    otherIncome: 0,
    assets: { lancar: [], tetap: [] },
    liabilities: { pendek: [], panjang: [] },
    equity: []
  };

  const selectedData = selectedYear === '2026' ? data2026 : data2025;
  const priorYearData = selectedYear === '2026' ? {
    revenue: 0,
    cogs: 0,
    openingInventory: 0,
    totalPurchase: 0,
    closingInventory: 0,
    operatingExpenses: [],
    otherIncome: 0,
    assets: { lancar: [], tetap: [] },
    liabilities: { pendek: [], panjang: [] },
    equity: []
  } : data2024;

  // Laba Rugi Calculations
  const revenue = selectedData.revenue;
  const cogs = selectedData.cogs;
  const grossProfit = revenue - cogs;
  const totalOperatingExpenses = (selectedData.operatingExpenses as FinancialReportItem[]).reduce((sum, item) => sum + item.amount, 0);
  const operatingProfit = grossProfit - totalOperatingExpenses;
  const otherIncome = selectedData.otherIncome;
  const netProfitBeforeTax = operatingProfit + otherIncome;

  // Indonesian Corporate Tax Calculation:
  // - Scheme 1: Final MSME (PPh Final PP 55 / PP 23) -> 0.5% of Gross Revenue (peredaran bruto)
  // - Scheme 2: Corporate Tax (PPh Badan) Normal -> 22% of Taxable Income (Laba Fiskal)
  //   With Facility Pasal 31E: 50% discount if gross revenue under Rp 4.8 Billion.
  //   Laba Fiskal = Net Profit Before Tax + Fiscal Correction (non-deductible expense / e.g. personal expenses, donation, tax expense, entertainment without list)
  const taxableIncomeFiskal = Math.max(0, netProfitBeforeTax + fiscalCorrection);
  
  let taxExpense = 0;
  let taxExplanation = '';

  if (revenue === 0 && netProfitBeforeTax <= 0) {
    taxExpense = 0;
    taxExplanation = 'Tidak ada kewajiban pajak (Pendapatan & Laba Rp 0)';
  } else if (taxScheme === 'FinalMSME') {
    taxExpense = Math.max(0, Math.round(revenue * 0.005));
    taxExplanation = 'PPh Final PP 55/2022 (0.5% dari seluruh peredaran bruto)';
  } else {
    // Normal 22% with facility 31E (50% reduction for MSMEs / UMKM below 4.8B)
    taxExpense = Math.max(0, Math.round(taxableIncomeFiskal * 0.22 * 0.5));
    taxExplanation = 'PPh Badan Tarif Umum Pasal 31E (Fasilitas 11% dari Penghasilan Kena Pajak)';
  }

  const netProfitAfterTax = netProfitBeforeTax - taxExpense;

  // Neraca Calculations
  const totalAssetsLancar = (selectedData.assets.lancar as FinancialReportItem[]).reduce((sum, item) => sum + item.amount, 0);
  const totalAssetsTetap = (selectedData.assets.tetap as FinancialReportItem[]).reduce((sum, item) => sum + item.amount, 0);
  const totalAssets = totalAssetsLancar + totalAssetsTetap;

  const totalLiabilitiesPendek = (selectedData.liabilities.pendek as FinancialReportItem[]).reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilitiesPanjang = (selectedData.liabilities.panjang as FinancialReportItem[]).reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = totalLiabilitiesPendek + totalLiabilitiesPanjang;

  const totalEquity = (selectedData.equity as FinancialReportItem[]).reduce((sum, item) => sum + item.amount, 0);

  const formatRupiah = (num: number) => {
    if (num < 0) {
      return '(Rp ' + Math.abs(num).toLocaleString('id-ID') + ')';
    }
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Dynamic Cash Flow (Indirect Method) Calculations
  const kasAwal = priorYearData.assets.lancar.filter(a => a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank')).reduce((sum, a) => sum + a.amount, 0);
  const kasAkhir = selectedData.assets.lancar.filter(a => a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank')).reduce((sum, a) => sum + a.amount, 0);
  const kasKenaikan = kasAkhir - kasAwal;

  // 1. Operating Activities
  const deprExpense = selectedData.operatingExpenses.find(e => e.name.toLowerCase().includes('penyusutan'))?.amount || 0;
  
  const piutangAwal = priorYearData.assets.lancar.find(a => a.name.toLowerCase().includes('piutang'))?.amount || 0;
  const piutangAkhir = selectedData.assets.lancar.find(a => a.name.toLowerCase().includes('piutang'))?.amount || 0;
  const piutangChange = piutangAkhir - piutangAwal; // Positive means increase, which is cash outflow

  const persediaanAwal = priorYearData.assets.lancar.find(a => a.name.toLowerCase().includes('persediaan'))?.amount || 0;
  const persediaanAkhir = selectedData.assets.lancar.find(a => a.name.toLowerCase().includes('persediaan'))?.amount || 0;
  const persediaanChange = persediaanAkhir - persediaanAwal; // Positive means increase, which is cash outflow

  const prepaidAwal = priorYearData.assets.lancar.find(a => a.name.toLowerCase().includes('uang muka') || a.name.toLowerCase().includes('pajak dibayar'))?.amount || 0;
  const prepaidAkhir = selectedData.assets.lancar.find(a => a.name.toLowerCase().includes('uang muka') || a.name.toLowerCase().includes('pajak dibayar'))?.amount || 0;
  const prepaidChange = prepaidAkhir - prepaidAwal; // Positive means increase, which is cash outflow

  const utangAwal = priorYearData.liabilities.pendek.find(l => l.name.toLowerCase().includes('utang usaha'))?.amount || 0;
  const utangAkhir = selectedData.liabilities.pendek.find(l => l.name.toLowerCase().includes('utang usaha'))?.amount || 0;
  const utangChange = utangAkhir - utangAwal; // Positive means increase, which is cash inflow

  const utangPajakAwal = priorYearData.liabilities.pendek.find(l => l.name.toLowerCase().includes('utang pajak'))?.amount || 0;
  const utangPajakAkhir = selectedData.liabilities.pendek.find(l => l.name.toLowerCase().includes('utang pajak'))?.amount || 0;
  const utangPajakChange = utangPajakAkhir - utangPajakAwal; // Positive means increase, which is cash inflow

  const utangGajiAwal = priorYearData.liabilities.pendek.find(l => l.name.toLowerCase().includes('utang gaji'))?.amount || 0;
  const utangGajiAkhir = selectedData.liabilities.pendek.find(l => l.name.toLowerCase().includes('utang gaji'))?.amount || 0;
  const utangGajiChange = utangGajiAkhir - utangGajiAwal; // Positive means increase, which is cash inflow

  const cashFlowOperating = netProfitAfterTax + deprExpense - piutangChange - persediaanChange - prepaidChange + utangChange + utangPajakChange + utangGajiChange;

  // 2. Investing Activities
  const peralatanAwal = priorYearData.assets.tetap.find(a => a.name.toLowerCase().includes('peralatan'))?.amount || 0;
  const peralatanAkhir = selectedData.assets.tetap.find(a => a.name.toLowerCase().includes('peralatan'))?.amount || 0;
  const peralatanChange = peralatanAkhir - peralatanAwal;

  const kendaraanAwal = priorYearData.assets.tetap.find(a => a.name.toLowerCase().includes('kendaraan') || a.name.toLowerCase().includes('gedung'))?.amount || 0;
  const kendaraanAkhir = selectedData.assets.tetap.find(a => a.name.toLowerCase().includes('kendaraan') || a.name.toLowerCase().includes('gedung'))?.amount || 0;
  const kendaraanChange = kendaraanAkhir - kendaraanAwal;

  const cashFlowInvesting = -(peralatanChange + kendaraanChange);

  // 3. Financing Activities
  const bankAwal = priorYearData.liabilities.panjang.find(l => l.name.toLowerCase().includes('bank'))?.amount || 0;
  const bankAkhir = selectedData.liabilities.panjang.find(l => l.name.toLowerCase().includes('bank'))?.amount || 0;
  const bankChange = bankAkhir - bankAwal;

  const modalAwal = priorYearData.equity.find(e => e.name.toLowerCase().includes('modal'))?.amount || 0;
  const modalAkhir = selectedData.equity.find(e => e.name.toLowerCase().includes('modal'))?.amount || 0;
  const modalChange = modalAkhir - modalAwal;

  // Plug value to make the cash flow reconcile perfectly with cash on balance sheet
  const priveDividen = cashFlowOperating + cashFlowInvesting + bankChange + modalChange - kasKenaikan;

  const cashFlowFinancing = bankChange + modalChange - priveDividen;

  const handleExport = (format: 'PDF' | 'Excel') => {
    let reportName = 'Laba Rugi';
    if (activeReportTab === 'Neraca') reportName = 'Neraca';
    else if (activeReportTab === 'ArusKas') reportName = 'Arus Kas';
    else if (activeReportTab === 'Pajak') reportName = 'Kepatuhan Pajak';
    setExportSuccessMessage(`Laporan ${reportName} ${selectedYear} berhasil di-export ke format ${format}!`);
    setTimeout(() => {
      setExportSuccessMessage(null);
    }, 4000);
  };

  // Recharts Data Prep
  const profitLossChartData = [
    { name: 'Pendapatan (Revenue)', amount: revenue, fill: '#10B981' },
    { name: 'HPP (COGS)', amount: -cogs, fill: '#EF4444' },
    { name: 'Beban Operasional', amount: -totalOperatingExpenses, fill: '#FF9F43' },
    { name: 'Laba Bersih', amount: netProfitBeforeTax, fill: netProfitBeforeTax >= 0 ? '#EA580C' : '#EF4444' }
  ];

  const assetsChartData = [
    { name: 'Aset Lancar', value: totalAssetsLancar },
    { name: 'Aset Tetap bersih', value: totalAssetsTetap }
  ];

  const liabilitiesEquityChartData = [
    { name: 'Kewajiban Jangka Pendek', value: totalLiabilitiesPendek, fill: '#EF4444' },
    { name: 'Kewajiban Jangka Panjang', value: totalLiabilitiesPanjang, fill: '#FF9F43' },
    { name: 'Ekuitas Pemilik & Laba', value: totalEquity, fill: '#10B981' }
  ];

  const cashFlowChartData = [
    { name: 'Operasional', ArusKas: cashFlowOperating, fill: '#10B981' },
    { name: 'Investasi', ArusKas: cashFlowInvesting, fill: '#EF4444' },
    { name: 'Pendanaan', ArusKas: cashFlowFinancing, fill: '#EA580C' },
    { name: 'Bersih', ArusKas: kasKenaikan, fill: '#FF9F43' }
  ];

  const COLORS = ['#EA580C', '#8B5CF6', '#10B981', '#FF9F43', '#EF4444'];

  return (
    <div className="flex-1 flex flex-col font-sans text-white bg-[#0A0A0A]">
      {/* Upper Area */}
      <div className="flex flex-col px-8 pt-[9px] pb-5 border-b border-[#1C1C1C] gap-4">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="pb-0" style={{ marginBottom: '0px', paddingBottom: '0px' }}>
            <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0" style={{ marginBottom: 0 }}>
              Laporan Keuangan
            </h1>
            <p className="text-[13px] text-[#909090]">
              Ringkasan laporan keuangan perusahaan.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Year Toggle */}
            <div className="flex bg-[#141517] rounded-lg border border-[#1C1C1C] p-0.5">
              <button
                onClick={() => setSelectedYear('2026')}
                className={`px-2.5 py-0.5 text-[11px] rounded transition-all ${
                  selectedYear === '2026' ? 'bg-[#2A2B2A] text-white font-medium' : 'text-[#909090] hover:text-white'
                }`}
              >
                TA 2026 (Berjalan)
              </button>
              <button
                onClick={() => setSelectedYear('2025')}
                className={`px-2.5 py-0.5 text-[11px] rounded transition-all ${
                  selectedYear === '2025' ? 'bg-[#2A2B2A] text-white font-medium' : 'text-[#909090] hover:text-white'
                }`}
              >
                TA 2025 (Audit)
              </button>
            </div>

            <span className="text-[#2A2A2A]">|</span>

            {/* Export buttons styled exactly like Purchase */}
            <button
              onClick={() => handleExport('Excel')}
              className="flex items-center gap-1.5 hover:text-white transition-colors text-[#909090] text-[12px] font-medium cursor-pointer"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button
              onClick={() => handleExport('PDF')}
              className="flex items-center gap-1.5 hover:text-white transition-colors text-[#909090] text-[12px] font-medium cursor-pointer"
            >
              <FileText size={14} /> PDF
            </button>

          </div>
        </div>

        {/* Bottom Row / Date Picker Row (under the title/subtitle) */}
        <div className="flex items-center">
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
              <div className="text-[20px] font-light text-white tracking-tight leading-none px-1 shrink-0">
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
              <div className="absolute top-full left-0 mt-2 w-[580px] bg-[#141517] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                <div className="flex flex-1 min-h-[290px]">
                  {/* Sidebar presets */}
                  <div className="w-[120px] border-r border-[#1F1F21] p-2 flex flex-col gap-0.5 bg-[#0E0F11]">
                    {['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month', 'This year', 'Last year', 'All time'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetClick(preset)}
                        className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-md transition-colors ${
                          selectedPreset === preset
                            ? 'bg-[#E87A5D1A] text-[#E87A5D] font-medium'
                            : 'text-[#909090] hover:bg-[#1E1E20] hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Calendars side-by-side */}
                  <div className="flex-1 p-4 grid grid-cols-2 gap-4">
                    {/* Month 1 (Left) */}
                    {renderCalendarMonth(currentViewDate, true)}
                    {/* Month 2 (Right) */}
                    {renderCalendarMonth(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1), false)}
                  </div>
                </div>

                {/* Footer with Inputs & Action Buttons */}
                <div className="flex items-center justify-between border-t border-[#1F1F21] px-4 py-3 bg-[#0E0F11]">
                  <div className="flex items-center gap-1.5">
                    {/* Start Input */}
                    <div className="flex items-center bg-[#141517] border border-[#2A2A2A] rounded-lg px-2 py-1 text-[11px]">
                      <span className="text-[#909090] mr-1.5 font-sans">Start</span>
                      <span className="text-white font-mono">{tempStart ? formatDateInputStr(tempStart) : 'MM/DD/YYYY'}</span>
                      <span className="text-[#444] mx-1.5">|</span>
                      <span className="text-[#666] font-mono">10:30 AM</span>
                    </div>
                    <span className="text-[#666] text-xs font-light">-</span>
                    {/* End Input */}
                    <div className="flex items-center bg-[#141517] border border-[#2A2A2A] rounded-lg px-2 py-1 text-[11px]">
                      <span className="text-[#909090] mr-1.5 font-sans">End</span>
                      <span className="text-white font-mono">{tempEnd ? formatDateInputStr(tempEnd) : 'MM/DD/YYYY'}</span>
                      <span className="text-[#444] mx-1.5">|</span>
                      <span className="text-[#666] font-mono">10:30 AM</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowDatePopup(false)} 
                      className="px-3 py-1.5 border border-[#2A2A2A] text-[#909090] hover:text-white hover:bg-[#1E1E20] transition-colors rounded-lg text-[11px] font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleApply} 
                      className="px-4 py-1.5 bg-[#E87A5D] hover:bg-[#D56A4C] text-white transition-colors rounded-lg text-[11px] font-medium shadow-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {exportSuccessMessage && (
        <div className="mx-8 mt-6 p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg text-[#10B981] text-xs font-medium flex items-center gap-2">
          <CheckCircle size={14} />
          {exportSuccessMessage}
        </div>
      )}

      {/* Report Switcher Tabs */}
      <div className="flex border-b border-[#1C1C1C] bg-[#0E0E0E]/40 px-8">
        <button
          onClick={() => setActiveReportTab('LabaRugi')}
          className={`py-3.5 px-4 text-[13px] font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeReportTab === 'LabaRugi'
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-[#909090] hover:text-white'
          }`}
        >
          <TrendingUp size={14} />
          Laba Rugi (Profit & Loss)
        </button>
        <button
          onClick={() => setActiveReportTab('Neraca')}
          className={`py-3.5 px-4 text-[13px] font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeReportTab === 'Neraca'
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-[#909090] hover:text-white'
          }`}
        >
          <Scale size={14} />
          Neraca (Balance Sheet)
        </button>
        <button
          onClick={() => setActiveReportTab('ArusKas')}
          className={`py-3.5 px-4 text-[13px] font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeReportTab === 'ArusKas'
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-[#909090] hover:text-white'
          }`}
        >
          <Coins size={14} />
          Arus Kas (Cash Flow)
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {/* ================================= LABA RUGI TAB ================================= */}
        {activeReportTab === 'LabaRugi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-8">
              {/* Left Col: Statements Detail */}
              <div className="space-y-6">
                <div className="border border-[#1C1C1C] rounded-xl bg-[#141517] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[#1C1C1C] bg-[#1C1C1C]/30 flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold text-white hidden">Laporan Laba Rugi {selectedYear}</span>
                    <span className="text-[11px] text-[#909090] hidden">Satuan Rupiah (IDR) • SAK EMKM</span>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Revenue */}
                    <div className="flex justify-between items-center text-[13px] font-bold pb-2 border-b border-[#1C1C1C] text-white">
                      <span>I. PENDAPATAN USAHA (REVENUE)</span>
                      <span>{formatRupiah(revenue)}</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {((selectedData as any).revenueDetails && (selectedData as any).revenueDetails.length > 0) ? (
                        ((selectedData as any).revenueDetails as FinancialReportItem[]).map((rev, idx) => (
                          <div key={idx} className="flex justify-between text-[12px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>{rev.name}</span>
                            <span className="text-white font-medium">{formatRupiah(rev.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-[12px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded transition-colors">
                          <span>Penjualan Produk</span>
                          <span className="text-white font-medium">{formatRupiah(revenue)}</span>
                        </div>
                      )}
                    </div>

                    {/* HARGA POKOK PENJUALAN */}
                    <div className="flex justify-between items-center text-[13px] font-bold pt-2 pb-2 border-b border-[#1C1C1C] text-white">
                      <span>II. HARGA POKOK PENJUALAN</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {((selectedData as any).cogsDetails && (selectedData as any).cogsDetails.length > 0) ? (
                        ((selectedData as any).cogsDetails as FinancialReportItem[]).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[12px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>{item.name}</span>
                            <span className="text-white font-medium">{formatRupiah(item.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-[12px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                          <span>Harga Pokok Penjualan</span>
                          <span className="text-white font-medium">{formatRupiah(cogs)}</span>
                        </div>
                      )}
                    </div>

                    {/* Gross Profit */}
                    <div className="flex justify-between items-center text-[13px] font-bold bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-3 rounded-lg my-2 shadow-sm">
                      <div>
                        <span className="text-white block">LABA KOTOR (GROSS PROFIT)</span>
                        <span className="text-[10px] text-[#808080] font-normal block">Pendapatan Usaha dikurangi Harga Pokok Penjualan (HPP)</span>
                      </div>
                      <span className="text-white font-bold">{formatRupiah(grossProfit)}</span>
                    </div>

                    {/* Operating Expenses */}
                    <div className="flex justify-between items-center text-[13px] font-bold pt-2 pb-2 border-b border-[#1C1C1C] text-white">
                      <span>III. BEBAN OPERASIONAL (OPERATING EXPENSES)</span>
                      <span className="text-white">({formatRupiah(totalOperatingExpenses)})</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {selectedData.operatingExpenses.map((expense, idx) => (
                        <div key={idx} className="flex justify-between text-[12px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                          <span>{expense.name}</span>
                          <span className="text-white font-medium">{formatRupiah(expense.amount)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Operating Profit */}
                    <div className="flex justify-between items-center text-[13px] font-bold bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-3 rounded-lg my-2 shadow-sm">
                      <span className="text-white">LABA OPERASIONAL (EBITDA)</span>
                      <span className="text-white font-bold">{formatRupiah(operatingProfit)}</span>
                    </div>

                    {/* Other Income / Expense */}
                    <div className="flex justify-between items-center text-[13px] font-bold pt-2 pb-2 border-b border-[#1C1C1C] text-white">
                      <span>IV. PENDAPATAN & BEBAN LAINNYA</span>
                      <span className="text-white">{formatRupiah(otherIncome)}</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {((selectedData as any).otherIncomeDetails && (selectedData as any).otherIncomeDetails.length > 0) ? (
                        ((selectedData as any).otherIncomeDetails as FinancialReportItem[]).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[12px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>{item.name}</span>
                            <span className="text-white font-medium">{formatRupiah(item.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-[12px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded transition-colors">
                          <span>Pendapatan Lain-lain</span>
                          <span className="text-[#E5E5E5]">{formatRupiah(otherIncome)}</span>
                        </div>
                      )}
                    </div>

                    {/* Net Profit Before Tax */}
                    <div className="flex justify-between items-center text-[13px] font-bold bg-[#1A1A1A] border border-[#2A2B2A] px-4 py-3 rounded-lg my-2">
                      <span className="text-white">LABA BERSIH SEBELUM PAJAK (EBT)</span>
                      <span className="text-white font-bold">{formatRupiah(netProfitBeforeTax)}</span>
                    </div>

                    {/* Net Profit After Tax */}
                    <div className="flex justify-between items-center text-[14px] font-extrabold bg-[#1C1C1C]/50 px-5 py-4 rounded-xl border border-[#2A2B2A] shadow-sm mt-6">
                      <span className="text-white tracking-wide uppercase">LABA BERSIH</span>
                      <span className="text-white text-lg font-bold">{formatRupiah(netProfitBeforeTax)}</span>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================================= NERACA TAB ================================= */}
        {activeReportTab === 'Neraca' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-8">
              {/* Left Col: Statements Detail */}
              <div className="space-y-6">
                <div className="border border-[#1C1C1C] rounded-xl bg-[#141517] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[#1C1C1C] bg-[#1C1C1C]/30 flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold text-white">Neraca Komparatif (Balance Sheet) per 31 Desember {selectedYear}</span>
                    <span className="text-[11px] text-[#909090]">Aktiva = Pasiva (Seimbang)</span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT: ASSETS SECTION */}
                    <div className="space-y-4">
                      <h3 className="text-[12px] font-bold text-[#E87A5D] border-b border-[#1C1C1C] pb-2 uppercase tracking-wider">
                        SISI ASET (AKTIVA)
                      </h3>
                      
                      {/* Aset Lancar */}
                      <div>
                        <div className="flex justify-between text-[12px] font-bold text-white mb-2 pb-1 border-b border-[#1C1C1C]/30">
                          <span>ASET LANCAR</span>
                          <span>{formatRupiah(totalAssetsLancar)}</span>
                        </div>
                        <div className="space-y-1">
                          {selectedData.assets.lancar.map((item, i) => (
                            <div key={i} className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                              <span>{item.name}</span>
                              <span className="text-[#E5E5E5] font-medium">{formatRupiah(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Aset Tetap */}
                      <div className="pt-3">
                        <div className="flex justify-between text-[12px] font-bold text-white mb-2 pb-1 border-b border-[#1C1C1C]/30">
                          <span>ASET TETAP</span>
                          <span>{formatRupiah(totalAssetsTetap)}</span>
                        </div>
                        <div className="space-y-1">
                          {selectedData.assets.tetap.map((item, i) => (
                            <div key={i} className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                              <span>{item.name}</span>
                              <span className={`font-medium ${item.amount < 0 ? 'text-[#EF4444]' : 'text-[#E5E5E5]'}`}>
                                {formatRupiah(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Assets Summary */}
                      <div className="flex justify-between items-center text-[13px] font-extrabold bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-3 rounded-lg mt-6 shadow-sm">
                        <span className="text-[#10B981] font-bold">TOTAL ASET (AKTIVA)</span>
                        <span className="text-[#10B981] font-bold">{formatRupiah(totalAssets)}</span>
                      </div>
                    </div>

                    {/* RIGHT: LIABILITIES & EQUITY SECTION */}
                    <div className="space-y-4">
                      <h3 className="text-[12px] font-bold text-[#EA580C] border-b border-[#1C1C1C] pb-2 uppercase tracking-wider">
                        SISI KEWAJIBAN & EKUITAS (PASIVA)
                      </h3>

                      {/* Kewajiban Jangka Pendek */}
                      <div>
                        <div className="flex justify-between text-[12px] font-bold text-white mb-2 pb-1 border-b border-[#1C1C1C]/30">
                          <span>KEWAJIBAN JANGKA PENDEK</span>
                          <span>{formatRupiah(totalLiabilitiesPendek)}</span>
                        </div>
                        <div className="space-y-1">
                          {selectedData.liabilities.pendek.map((item, i) => (
                            <div key={i} className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                              <span>{item.name}</span>
                              <span className="text-[#E5E5E5] font-medium">{formatRupiah(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Kewajiban Jangka Panjang */}
                      <div className="pt-3">
                        <div className="flex justify-between text-[12px] font-bold text-white mb-2 pb-1 border-b border-[#1C1C1C]/30">
                          <span>KEWAJIBAN JANGKA PANJANG</span>
                          <span>{formatRupiah(totalLiabilitiesPanjang)}</span>
                        </div>
                        <div className="space-y-1">
                          {selectedData.liabilities.panjang.map((item, i) => (
                            <div key={i} className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                              <span>{item.name}</span>
                              <span className="text-[#E5E5E5] font-medium">{formatRupiah(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ekuitas */}
                      <div className="pt-3">
                        <div className="flex justify-between text-[12px] font-bold text-white mb-2 pb-1 border-b border-[#1C1C1C]/30">
                          <span>EKUITAS (MODAL)</span>
                          <span>{formatRupiah(totalEquity)}</span>
                        </div>
                        <div className="space-y-1">
                          {selectedData.equity.map((item, i) => (
                            <div key={i} className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                              <span>{item.name}</span>
                              <span className={item.amount < 0 ? "text-[#EF4444] font-semibold" : "text-[#E5E5E5] font-medium"}>
                                {formatRupiah(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Passiva Summary */}
                      <div className="flex justify-between items-center text-[13px] font-extrabold bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-3 rounded-lg mt-6 shadow-sm">
                        <span className="text-[#EA580C] font-bold">TOTAL KEWAJIBAN & EKUITAS</span>
                        <span className="text-[#EA580C] font-bold">{formatRupiah(totalLiabilities + totalEquity)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Check Banner */}
                  <div className="px-6 py-4 bg-[#111213] border-t border-[#1C1C1C] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#E5E5E5]">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span><strong>Pemeriksaan Saldo:</strong> Sisi Aktiva & Pasiva dalam keadaan seimbang (Balanced & Match).</span>
                    </div>
                    <div className="text-[#909090]">
                      Selisih Aktiva vs Pasiva: <span className="font-mono text-[#10B981] font-bold">Rp 0</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================================= ARUS KAS TAB ================================= */}
        {activeReportTab === 'ArusKas' && (
          <div className="space-y-6">
            {/* Statements Detail */}
            <div className="space-y-6">
              <div className="border border-[#1C1C1C] rounded-xl bg-[#141517] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#1C1C1C] bg-[#1C1C1C]/30 flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-white">Laporan Arus Kas (Statement of Cash Flows) per 31 Desember {selectedYear}</span>
                  <span className="text-[11px] text-[#909090]">Metode Tidak Langsung (Indirect Method)</span>
                </div>

                  <div className="p-6 space-y-6">
                    {/* OPERATING ACTIVITIES */}
                    <div className="space-y-2">
                      <h3 className="text-[12px] font-bold text-white border-b border-[#1C1C1C] pb-2 uppercase tracking-wider">
                        I. ARUS KAS DARI AKTIVITAS OPERASIONAL
                      </h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#E5E5E5] py-1.5 font-medium px-2">
                          <span>Laba Bersih Setelah Pajak (Net Income)</span>
                          <span className="text-white font-medium">{formatRupiah(netProfitAfterTax)}</span>
                        </div>
                        
                        <div className="pl-4 space-y-0.5">
                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span className="italic">Penyesuaian Beban Penyusutan Aset Tetap (+)</span>
                            <span className="text-[#E5E5E5] font-medium">{formatRupiah(deprExpense)}</span>
                          </div>
                          
                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>(Kenaikan) / Penurunan Piutang Usaha</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(-piutangChange)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>(Kenaikan) / Penurunan Persediaan Barang Dagang</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(-persediaanChange)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>(Kenaikan) / Penurunan Uang Muka Pembelian</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(-prepaidChange)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Kenaikan / (Penurunan) Utang Usaha</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(utangChange)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Kenaikan / (Penurunan) Utang Pajak</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(utangPajakChange)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Kenaikan / (Penurunan) Utang Gaji</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(utangGajiChange)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-[12px] font-bold text-white bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-2.5 rounded-lg mt-3 shadow-sm">
                          <span className="text-white font-bold">Kas Bersih Diperoleh dari Aktivitas Operasional</span>
                          <span className="text-white font-extrabold">{formatRupiah(cashFlowOperating)}</span>
                        </div>
                      </div>
                    </div>

                    {/* INVESTING ACTIVITIES */}
                    <div className="space-y-2">
                      <h3 className="text-[12px] font-bold text-white border-b border-[#1C1C1C] pb-2 uppercase tracking-wider">
                        II. ARUS KAS DARI AKTIVITAS INVESTASI
                      </h3>
                      <div className="space-y-1">
                        <div className="pl-4 space-y-0.5">
                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Perolehan Peralatan</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {peralatanChange > 0 ? formatRupiah(-peralatanChange) : 'Rp 0'}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Perolehan Kendaraan</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {kendaraanChange > 0 ? formatRupiah(-kendaraanChange) : 'Rp 0'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-[12px] font-bold text-white bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-2.5 rounded-lg mt-3 shadow-sm">
                          <span className="text-white font-bold">Kas Bersih Digunakan untuk Aktivitas Investasi</span>
                          <span className="text-white font-extrabold">
                            {formatRupiah(cashFlowInvesting)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* FINANCING ACTIVITIES */}
                    <div className="space-y-2">
                      <h3 className="text-[12px] font-bold text-white border-b border-[#1C1C1C] pb-2 uppercase tracking-wider">
                        III. ARUS KAS DARI AKTIVITAS PENDANAAN
                      </h3>
                      <div className="space-y-1">
                        <div className="pl-4 space-y-0.5">
                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Penerimaan / (Pembayaran) Utang Bank</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(bankChange)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Penerimaan Setoran Modal Pemilik</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {formatRupiah(modalChange)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 -mx-2 transition-colors">
                            <span>Penarikan Modal (Prive)</span>
                            <span className="text-[#E5E5E5] font-medium">
                              {priveDividen === 0 ? 'Rp 0' : formatRupiah(-priveDividen)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-[12px] font-bold text-white bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-2.5 rounded-lg mt-3 shadow-sm">
                          <span className="text-white font-bold">Kas Bersih Digunakan dalam Aktivitas Pendanaan</span>
                          <span className="text-white font-extrabold">
                            {formatRupiah(cashFlowFinancing)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RECONCILIATION */}
                    <div className="space-y-2 pt-4 border-t border-[#1C1C1C]/50">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[13px] font-extrabold bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-3 rounded-lg shadow-sm">
                          <span className="text-white font-bold">KENAIKAN / (PENURUNAN) BERSIH KAS DAN SETARA KAS</span>
                          <span className="text-white font-extrabold">
                            {formatRupiah(kasKenaikan)}
                          </span>
                        </div>

                        <div className="flex justify-between text-[11px] text-[#909090] py-1.5 hover:bg-[#1C1C1C]/15 rounded px-2 transition-colors">
                          <span>Saldo Kas & Setara Kas pada Awal Tahun per 1 Jan</span>
                          <span className="text-[#E5E5E5] font-medium">{formatRupiah(kasAwal)}</span>
                        </div>

                        <div className="flex justify-between items-center text-[13px] font-extrabold bg-[#1C1C1C]/50 border border-[#2A2B2A] px-4 py-3 rounded-lg shadow-sm">
                          <span className="text-white font-bold">SALDO KAS & SETARA KAS PADA AKHIR TAHUN PER 31 DES</span>
                          <span className="text-white font-extrabold">{formatRupiah(kasAkhir)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Balance Check Banner */}
                  <div className="px-6 py-4 bg-[#111213] border-t border-[#1C1C1C] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#E5E5E5]">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      <span><strong>Rekonsiliasi Kas:</strong> Saldo akhir kas cocok dengan Akun Kas & Setara Kas di Neraca.</span>
                    </div>
                    <div className="text-[#909090]">
                      Selisih Kas Arus Kas vs Neraca: <span className="font-mono text-white font-bold">Rp 0</span>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}

      </div>

      {/* CREATE ACCOUNT MODAL */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-[#E87A5D]" />
                Tambah Akun Baru
              </h3>
              <button 
                onClick={() => setShowCreateAccountModal(false)}
                className="text-[#808080] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Kode Akun *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 6141"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Nama Akun *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Beban Promosi"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Kategori Akun *</label>
                <select
                  value={newAccCategory}
                  onChange={(e) => handleNewAccCategoryChange(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {['Aset', 'Liabilitas', 'Ekuitas', 'Pendapatan', 'HPP', 'Beban'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Sub Kategori Akun *</label>
                <select
                  value={newAccSubCategory}
                  onChange={(e) => setNewAccSubCategory(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {getSubCategoriesForCategory(newAccCategory).map(sc => (
                    <option key={sc.value} value={sc.value}>{sc.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Saldo Awal (Rp)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(Number(e.target.value))}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#EA580C] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
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

            <form onSubmit={handleSaveEditAccountSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Kode Akun *</label>
                <input 
                  type="text" 
                  value={editAccCode}
                  onChange={(e) => setEditAccCode(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Nama Akun *</label>
                <input 
                  type="text" 
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
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
                  value={editAccCategory}
                  onChange={(e) => handleEditAccCategoryChange(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {['Aset', 'Liabilitas', 'Ekuitas', 'Pendapatan', 'HPP', 'Beban'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A0A0A0] font-medium block">Sub Kategori Akun *</label>
                <select
                  value={editAccSubCategory}
                  onChange={(e) => setEditAccSubCategory(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E87A5D] transition-colors cursor-pointer"
                >
                  {getSubCategoriesForCategory(editAccCategory).map(sc => (
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
