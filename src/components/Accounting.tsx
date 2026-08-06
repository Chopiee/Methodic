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
  Wallet
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
      {activeView === 'jurnal' && (
        <div className="flex-1 p-8 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Daftar Transaksi Jurnal Umum</h2>
            <span className="text-xs text-[#808080]">Total {ledger.length} entri terposting</span>
          </div>
          <div className="border border-[#2A2A2A] rounded-xl bg-[#0A0A0A] overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#121315]/80 text-[#909090] text-xs font-semibold">
                  <th className="py-3.5 px-4 w-28">Ref ID</th>
                  <th className="py-3.5 px-4 w-32">Tanggal</th>
                  <th className="py-3.5 px-4">Nama Akun</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4 text-right">Debit</th>
                  <th className="py-3.5 px-4 text-right">Kredit</th>
                  <th className="py-3.5 px-4 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]/40 text-xs">
                {ledger.length > 0 ? (
                  ledger.map((entry, index) => (
                    <tr key={`${entry.id}-${entry.account}-${index}`} className="hover:bg-[#141517] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#808080]">{entry.id}</td>
                      <td className="py-3.5 px-4 text-[#D5D5D5]">{entry.date}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{entry.account}</td>
                      <td className="py-3.5 px-4 text-[#A0A0A0]">{entry.description}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#10B981]">
                        {typeof entry.debit === 'number' && entry.debit > 0 ? `Rp ${entry.debit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#EF4444]">
                        {typeof entry.credit === 'number' && entry.credit > 0 ? `Rp ${entry.credit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#808080]">
                      Belum ada transaksi jurnal umum terposting.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRANSAKSI MANUAL VIEW */}
      {activeView === 'transaksi' && (
        <div className="flex-1 p-8 flex flex-col space-y-6">
          
          {/* Top Banner Alert if Success */}
          {txSuccessMsg && (
            <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] p-4 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} className="shrink-0" />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Manual Transaction Entry Form */}
            <div className="lg:col-span-2 bg-[#141517] border border-[#2B2D36] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#2B2D36] pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus size={18} className="text-[#E87A5D]" />
                    Catat Transaksi Manual
                  </h2>
                  <p className="text-xs text-[#909090] mt-0.5">
                    Masukkan entri jurnal berpasangan (Debit & Kredit) secara manual
                  </p>
                </div>
                <span className="text-[11px] bg-[#E87A5D]/10 text-[#E87A5D] border border-[#E87A5D]/20 px-2.5 py-1 rounded-full font-semibold">
                  Double Entry
                </span>
              </div>

              <form onSubmit={handleManualTxSubmit} className="space-y-4 text-xs">
                
                {/* Row 1: Tanggal & Ref ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#A0A0A0] font-medium block mb-1.5">Tanggal Transaksi *</label>
                    <input 
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E87A5D] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[#A0A0A0] font-medium block mb-1.5">No. Referensi / Bukti (Opsional)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: JV-2026-001 (Auto generated jika kosong)"
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E87A5D] transition-colors placeholder-[#606060]"
                    />
                  </div>
                </div>

                {/* Row 2: Debit & Credit Accounts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#EA580C] font-semibold block mb-1.5 flex items-center justify-between">
                      <span>Akun DEBIT *</span>
                      <span className="text-[10px] text-[#808080] font-normal">(Penambahan Aset/Beban)</span>
                    </label>
                    <select
                      value={txDebitCode}
                      onChange={(e) => setTxDebitCode(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#EA580C]/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#EA580C] transition-colors cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Akun Debit --</option>
                      {accounts.filter(a => !a.isHeader).map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name} ({acc.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#10B981] font-semibold block mb-1.5 flex items-center justify-between">
                      <span>Akun KREDIT *</span>
                      <span className="text-[10px] text-[#808080] font-normal">(Pengurangan Kas/Sumber)</span>
                    </label>
                    <select
                      value={txCreditCode}
                      onChange={(e) => setTxCreditCode(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#10B981]/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#10B981] transition-colors cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Akun Kredit --</option>
                      {accounts.filter(a => !a.isHeader).map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name} ({acc.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Nominal */}
                <div>
                  <label className="text-[#A0A0A0] font-medium block mb-1.5">Jumlah Nominal (Rp) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080] font-semibold">Rp</span>
                    <input 
                      type="number"
                      placeholder="0"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2B2D36] rounded-xl pl-10 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#E87A5D] transition-colors placeholder-[#606060]"
                      required
                      min={1}
                    />
                  </div>
                  {Number(txAmount) > 0 && (
                    <p className="text-[11px] text-[#E87A5D] mt-1 font-mono">
                      Terbilang: Rp {Number(txAmount).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                {/* Row 4: Keterangan / Memo */}
                <div>
                  <label className="text-[#A0A0A0] font-medium block mb-1.5">Keterangan Transaksi / Catatan *</label>
                  <textarea 
                    rows={3}
                    placeholder="Contoh: Pembayaran sewa kantor bulan ini via Bank BCA"
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#E87A5D] transition-colors placeholder-[#606060]"
                    required
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2B2D36]">
                  <button
                    type="button"
                    onClick={() => {
                      setTxAmount('');
                      setTxDesc('');
                      setTxRef('');
                      setTxDebitCode('');
                      setTxCreditCode('');
                    }}
                    className="px-4 py-2.5 bg-[#0A0A0A] border border-[#2B2D36] hover:bg-[#1E2026] text-[#D5D5D5] font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#E87A5D] hover:bg-[#D9694C] text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <Send size={15} />
                    <span>Posting Transaksi</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Right Col: Quick Presets & Account Overview */}
            <div className="space-y-6">
              
              {/* Quick Presets Card */}
              <div className="bg-[#141517] border border-[#2B2D36] rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap size={15} className="text-[#E87A5D]" />
                  Template Transaksi Cepat
                </h3>
                <p className="text-[11px] text-[#909090]">
                  Klik salah satu preset di bawah untuk mengisi pasangan akun secara otomatis:
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    { label: 'Beban Gaji Karyawan', debit: '6100', credit: '1130', desc: 'Pembayaran gaji karyawan via Bank BCA' },
                    { label: 'Beban Sewa Tempat', debit: '6110', credit: '1130', desc: 'Pembayaran sewa kantor/toko via Bank BCA' },
                    { label: 'Beban Listrik & Air', debit: '6120', credit: '1110', desc: 'Pembayaran tagihan listrik & air via Kas Kecil' },
                    { label: 'Beban Iklan & Promosi', debit: '6140', credit: '1130', desc: 'Biaya promosi & iklan online via Bank BCA' },
                    { label: 'Setoran Modal Pemilik', debit: '1130', credit: '3100', desc: 'Setoran modal tambahan ke rekening Bank BCA' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTxDebitCode(preset.debit);
                        setTxCreditCode(preset.credit);
                        if (!txDesc) setTxDesc(preset.desc);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-[#0A0A0A] border border-[#2B2D36] hover:border-[#E87A5D]/50 hover:bg-[#1E2026] transition-all cursor-pointer text-xs group"
                    >
                      <div className="font-semibold text-white group-hover:text-[#E87A5D] transition-colors flex items-center justify-between">
                        <span>{preset.label}</span>
                        <ArrowRight size={12} className="text-[#808080] group-hover:text-[#E87A5D]" />
                      </div>
                      <div className="text-[10px] text-[#808080] mt-0.5 flex items-center gap-1.5 font-mono">
                        <span className="text-[#EA580C]">D: {preset.debit}</span>
                        <span>|</span>
                        <span className="text-[#10B981]">K: {preset.credit}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Information Note Card */}
              <div className="bg-[#141517] border border-[#2B2D36] rounded-2xl p-5 shadow-xl space-y-2 text-xs">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <FileText size={15} className="text-[#EA580C]" />
                  Informasi Integrasi
                </h3>
                <p className="text-[#A0A0A0] text-[11px] leading-relaxed">
                  Setiap transaksi manual yang diposting akan langsung tersimpan di <span className="text-white font-medium">Jurnal Umum</span>, mempengaruhi <span className="text-white font-medium">Neraca</span>, dan otomatis terhitung pada laporan <span className="text-white font-medium">Laba Rugi</span> jika menggunakan akun Beban atau Pendapatan.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('jurnal')}
                  className="mt-2 text-[11px] text-[#EA580C] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>Lihat Seluruh Jurnal Umum</span>
                  <ArrowRight size={12} />
                </button>
              </div>

            </div>

          </div>

          {/* Recent Manual Transactions Table */}
          <div className="border border-[#2B2D36] rounded-2xl bg-[#141517] overflow-hidden shadow-xl mt-6">
            <div className="p-4 bg-[#0E0F11] border-b border-[#2B2D36] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">Riwayat Transaksi Jurnal Terbaru</h3>
                <p className="text-[11px] text-[#808080]">Daftar entri jurnal yang telah terposting</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('jurnal')}
                className="text-xs text-[#E87A5D] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Buka Jurnal Umum Lengkap</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#2B2D36] bg-[#0A0A0A] text-[#909090] text-[11px] font-semibold">
                    <th className="py-3 px-4 w-28">Ref ID</th>
                    <th className="py-3 px-4 w-32">Tanggal</th>
                    <th className="py-3 px-4">Nama Akun</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Debit</th>
                    <th className="py-3 px-4 text-right">Kredit</th>
                    <th className="py-3 px-4 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2D36]/60 text-xs">
                  {ledger.length > 0 ? (
                    ledger.slice(0, 8).map((entry, idx) => (
                      <tr key={`${entry.id}-${idx}`} className="hover:bg-[#1E2026]/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[#E87A5D] font-semibold">{entry.id}</td>
                        <td className="py-2.5 px-4 text-[#A0A0A0]">{entry.date}</td>
                        <td className="py-2.5 px-4 font-medium text-white">{entry.account}</td>
                        <td className="py-2.5 px-4 text-[#A0A0A0] max-w-xs truncate">{entry.description}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#EA580C]">
                          {typeof entry.debit === 'number' ? `Rp ${entry.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#10B981]">
                          {typeof entry.credit === 'number' ? `Rp ${entry.credit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                            {entry.status || 'Posted'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#808080]">
                        Belum ada transaksi di jurnal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
