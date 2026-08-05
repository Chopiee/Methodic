import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Search, 
  Plus, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  FileText, 
  Coins, 
  Tag, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setHasUnsavedChanges } from '../lib/unsaved';

interface DiscountItem {
  id: string;
  code: string;
  name: string;
  type: 'Percentage' | 'Fixed Amount' | 'Free Shipping';
  value: number; // e.g. 15 for 15%, 50000 for Rp 50.000
  minPurchase: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Draft' | 'Expired';
  usageCount: number;
  maxUsage?: number;
  applicableTo: string; // 'All Products', 'Skincare', 'Makeup', etc.
}

const initialDiscounts: DiscountItem[] = [];

const formatIDR = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export function Discount({ searchQuery = '' }: { searchQuery?: string }) {
  const [discounts, setDiscounts] = useState<DiscountItem[]>(() => {
    const saved = localStorage.getItem('methodic_discounts_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse discounts', e);
      }
    }
    return initialDiscounts;
  });

  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Draft' | 'Expired'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(showAddModal);
  }, [showAddModal]);
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed Amount' | 'Free Shipping'>('Percentage');

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('0');
  const [maxUsage, setMaxUsage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicableTo, setApplicableTo] = useState('All Products');
  const [formStatus, setFormStatus] = useState<'Active' | 'Draft'>('Active');

  useEffect(() => {
    localStorage.setItem('methodic_discounts_v2', JSON.stringify(discounts));
  }, [discounts]);

  // Statistics
  const activeCount = discounts.filter(d => d.status === 'Active').length;
  const draftCount = discounts.filter(d => d.status === 'Draft').length;
  const totalUsage = discounts.reduce((acc, d) => acc + d.usageCount, 0);
  const estSavings = discounts.reduce((acc, d) => {
    if (d.type === 'Percentage') {
      return acc + (d.value * 25000 * d.usageCount); // Estimated average order of 250k
    } else if (d.type === 'Fixed Amount') {
      return acc + (d.value * d.usageCount);
    } else {
      return acc + (15000 * d.usageCount); // Estimated 15k free shipping savings
    }
  }, 0);

  const stats = [
    { title: 'Kupon Aktif', value: `${activeCount} Promo`, label: 'Sedang berjalan', trend: 'positive', icon: Percent },
    { title: 'Total Pemakaian', value: `${totalUsage} Kali`, label: 'Redemption rate tinggi', trend: 'positive', icon: Users },
    { title: 'Estimasi Hemat', value: formatIDR(estSavings), label: 'Total potongan harga', trend: 'positive', icon: Coins },
    { title: 'Draf Campaign', value: `${draftCount} Berkas`, label: 'Belum dipublikasikan', trend: 'neutral', icon: FileText }
  ];

  const handleToggleStatus = (id: string) => {
    setDiscounts(prev => prev.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'Active' ? 'Draft' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  const handleDeleteDiscount = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus diskon ini?')) {
      setDiscounts(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleAddDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('Mohon isi kode dan nama diskon');
      return;
    }

    const newDiscount: DiscountItem = {
      id: `DSC-${String(discounts.length + 1).padStart(3, '0')}`,
      code: code.toUpperCase().replace(/\s+/g, ''),
      name,
      type: discountType,
      value: discountType === 'Free Shipping' ? 0 : (Number(value) || 0),
      minPurchase: Number(minPurchase) || 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: formStatus,
      usageCount: 0,
      maxUsage: maxUsage ? Number(maxUsage) : undefined,
      applicableTo
    };

    setDiscounts([newDiscount, ...discounts]);
    setShowAddModal(false);

    // Reset Form Fields
    setCode('');
    setName('');
    setValue('');
    setMinPurchase('0');
    setMaxUsage('');
    setStartDate('');
    setEndDate('');
    setApplicableTo('All Products');
    setDiscountType('Percentage');
    setFormStatus('Active');
  };

  const filteredDiscounts = discounts.filter(d => {
    const matchesSearch = d.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || d.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex-1 flex flex-col font-sans text-white bg-[#0A0A0A] overflow-y-auto min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-8 py-6 border-b border-[#1C1C1C]">
        <div>
          <span className="text-[10px] font-bold text-[#E87A5D] uppercase tracking-widest block mb-0.5">Marketing & Loyalty</span>
          <h1 className="text-xl font-semibold text-white tracking-tight">Diskon & Kupon Promo</h1>
          <p className="text-[#909090] text-[13px] mt-0.5">Kelola kode promosi, diskon persentase, nominal tetap, dan subsidi gratis ongkir.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Buat Kupon Baru</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#1C1C1C]">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className={`p-6 flex flex-col justify-between min-h-[125px] ${
              i < 3 ? 'border-r border-[#1C1C1C] border-b sm:border-b-0' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#909090] font-medium">{stat.title}</span>
              <div className="w-[30px] h-[30px] rounded-full bg-[#1A1A1A] flex items-center justify-center border border-[#222222]">
                <stat.icon size={14} className="text-[#E87A5D]" />
              </div>
            </div>
            
            <div className="flex items-end justify-between mt-4">
              <div className="flex flex-col">
                <span className="text-[20px] font-semibold tracking-tight text-white font-sans">{stat.value}</span>
                <span className="text-[11px] text-[#707070] mt-0.5">{stat.label}</span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#161616] border border-[#262626] text-[#E5E5E5]">
                {stat.trend === 'positive' ? '● Active' : '● Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Tables */}
      <div className="flex-1 p-8 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {(['All', 'Active', 'Draft', 'Expired'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[12px] px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer border ${
                  activeTab === tab 
                    ? 'bg-[#2A2B2A] text-white font-semibold border-[#3A3B3A]' 
                    : 'text-[#909090] hover:text-white hover:bg-[#1A1A1A] border-transparent'
                }`}
              >
                {tab === 'All' ? 'Semua Diskon' : 
                 tab === 'Active' ? 'Aktif' : 
                 tab === 'Draft' ? 'Draf Campaign' : 'Kedaluwarsa'}
              </button>
            ))}
          </div>
          
          <div className="text-[#909090] text-xs font-mono">
            Menampilkan <span className="text-white font-semibold">{filteredDiscounts.length}</span> dari {discounts.length} kupon
          </div>
        </div>

        {/* Directory Table */}
        <div className="border border-[#1C1C1C] rounded-xl bg-[#0E0E0E] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1C1C1C] bg-[#090909]">
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px] w-48">Kode Promo</th>
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px]">Detail Campaign</th>
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px] w-36">Tipe Diskon</th>
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px] text-right w-36">Potongan</th>
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px] w-36 text-center">Pemakaian</th>
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px] w-44">Periode Aktif</th>
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px] text-center w-28">Status</th>
                  <th className="py-3.5 px-5 font-medium text-[#909090] text-[13px] text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.length > 0 ? (
                  filteredDiscounts.map((d) => (
                    <tr key={d.id} className="border-b border-[#1C1C1C] hover:bg-[#131313] transition-colors last:border-b-0">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#E87A5D]/10 border border-[#E87A5D]/20 flex items-center justify-center text-[#E87A5D] shrink-0 font-mono text-xs font-bold">
                            %
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] text-white font-bold font-mono tracking-wider select-all cursor-pointer hover:text-[#E87A5D] transition-colors">
                              {d.code}
                            </span>
                            <span className="text-[10px] text-[#606060] font-mono">{d.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-white font-semibold">{d.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C1C1D] text-[#A0A0A0] border border-[#2A2A2D]">
                              Min. Belanja: {formatIDR(d.minPurchase)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C1C1D] text-[#A0A0A0] border border-[#2A2A2D]">
                              Untuk: {d.applicableTo}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          d.type === 'Percentage' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          d.type === 'Fixed Amount' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {d.type === 'Percentage' ? 'Persentase' : 
                           d.type === 'Fixed Amount' ? 'Nominal Tetap' : 'Gratis Ongkir'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-[13px]">
                        {d.type === 'Percentage' ? (
                          <span className="text-orange-400 font-bold">{d.value}%</span>
                        ) : d.type === 'Fixed Amount' ? (
                          <span className="text-purple-400 font-bold">{formatIDR(d.value)}</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Free Ongkir</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[13px] text-white font-semibold">{d.usageCount}</span>
                          <span className="text-[10px] text-[#606060]">
                            dari {d.maxUsage ? d.maxUsage : '∞'} limit
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs text-[#909090]">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-[#606060]" />
                          <span>{d.startDate} s/d {d.endDate}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          d.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          d.status === 'Draft' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {d.status === 'Active' ? 'Aktif' : 
                           d.status === 'Draft' ? 'Draf' : 'Kedaluwarsa'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {d.status !== 'Expired' && (
                            <button
                              onClick={() => handleToggleStatus(d.id)}
                              title={d.status === 'Active' ? 'Nonaktifkan' : 'Aktifkan'}
                              className="p-1 hover:bg-[#1E1E22] rounded text-[#909090] hover:text-[#E87A5D] transition-colors cursor-pointer"
                            >
                              {d.status === 'Active' ? <ToggleRight size={18} className="text-[#E87A5D]" /> : <ToggleLeft size={18} />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDiscount(d.id)}
                            title="Hapus"
                            className="p-1 hover:bg-[#1E1E22] rounded text-[#909090] hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#909090] text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Percent size={24} className="text-[#404040] mb-1" />
                        <p className="font-semibold text-white">Tidak ada promo diskon ditemukan</p>
                        <p className="text-[11px]">Silakan cari kata kunci lain atau buat kupon promosi baru.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Discount Modal Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#141517] border border-[#2A2A2A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#141517]">
                <div className="flex items-center gap-2">
                  <Percent size={16} className="text-[#E87A5D]" />
                  <h3 className="text-[15px] font-bold text-white">Tambah Kupon Promo Baru</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-[#202022] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form content */}
              <form onSubmit={handleAddDiscount} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Kode Promo <span className="text-[#E87A5D]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="CONTOH: PROMO77"
                      className="w-full h-[36px] px-3 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs font-mono font-bold tracking-wider text-white outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Nama Promo <span className="text-[#E87A5D]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Diskon Akhir Tahun"
                      className="w-full h-[36px] px-3 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                    Tipe Diskon <span className="text-[#E87A5D]">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Percentage', 'Fixed Amount', 'Free Shipping'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDiscountType(type)}
                        className={`py-2 px-1 text-center rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                          discountType === type
                            ? 'bg-[#E87A5D]/10 border-[#E87A5D] text-white'
                            : 'bg-[#0A0A0A] border-[#2A2A2A] text-[#909090] hover:text-white'
                        }`}
                      >
                        {type === 'Percentage' ? 'Persentase (%)' : 
                         type === 'Fixed Amount' ? 'Potongan (Rp)' : 'Gratis Ongkir'}
                      </button>
                    ))}
                  </div>
                </div>

                {discountType !== 'Free Shipping' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Nilai Potongan <span className="text-[#E87A5D]">*</span>
                    </label>
                    <div className="relative">
                      {discountType === 'Fixed Amount' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#606060]">Rp</span>
                      )}
                      <input
                        type="number"
                        required
                        min="1"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={discountType === 'Percentage' ? 'Contoh: 15' : 'Contoh: 50000'}
                        className={`w-full h-[36px] ${discountType === 'Fixed Amount' ? 'pl-8' : 'px-3'} pr-8 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs font-mono text-white outline-none text-right font-semibold`}
                      />
                      {discountType === 'Percentage' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#606060]">%</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Min. Belanja (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(e.target.value)}
                      placeholder="0"
                      className="w-full h-[36px] px-3 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs font-mono text-white text-right outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Maksimal Penggunaan
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={maxUsage}
                      onChange={(e) => setMaxUsage(e.target.value)}
                      placeholder="Tak Terbatas"
                      className="w-full h-[36px] px-3 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs font-mono text-white text-right outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Mulai Berlaku
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-[36px] px-3 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Berakhir Pada
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-[36px] px-3 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Target Produk
                    </label>
                    <select
                      value={applicableTo}
                      onChange={(e) => setApplicableTo(e.target.value)}
                      className="w-full h-[36px] px-2.5 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="All Products">Semua Produk</option>
                      <option value="Skincare">Kategori Skincare Only</option>
                      <option value="Makeup">Kategori Makeup Only</option>
                      <option value="Haircare">Kategori Haircare Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                      Status Awal
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Draft')}
                      className="w-full h-[36px] px-2.5 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E87A5D] rounded-lg text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="Active">Publish Langsung (Aktif)</option>
                      <option value="Draft">Simpan Draf (Nonaktif)</option>
                    </select>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A2A] mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 hover:bg-[#202022] border border-[#2A2A2A] rounded-lg text-xs font-semibold text-[#909090] hover:text-white transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-xs font-bold transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-md"
                  >
                    Simpan Promo
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
