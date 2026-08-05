import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { setHasUnsavedChanges } from '../lib/unsaved';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronRight,
  SlidersHorizontal, 
  HelpCircle, 
  FileText, 
  X,
  UserCheck,
  Building2,
  ArrowLeft,
  Info,
  User,
  Camera,
  CreditCard,
  Truck,
  Landmark,
  BookOpen
} from 'lucide-react';
import { getStoredPartners, savePartners, PartnerItem } from '../lib/state';

interface Partner {
  id: string;
  name: string;
  category: 'Customer' | 'Distributor';
  pic: string;
  email: string;
  phone: string;
  address: string;
  balance: string;
  status: 'Active' | 'Inactive';
}

export function Partner({ searchQuery: globalSearchQuery = '' }: { searchQuery?: string }) {
  const [view, setView] = useState<'list' | 'form'>('list');

  React.useEffect(() => {
    setHasUnsavedChanges(view === 'form');
  }, [view]);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<string>('');
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [showAddDropdown, setShowAddDropdown] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<{
    type: 'single' | 'batch';
    partner?: Partner;
    count?: number;
  } | null>(null);

  // Form states for Add/Edit matching Profil Kontak schema
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Customer' | 'Distributor'>('Customer');
  const [formPic, setFormPic] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBalance, setFormBalance] = useState('0');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Form dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showSalutationDropdown, setShowSalutationDropdown] = useState(false);
  const [showTaxTypeDropdown, setShowTaxTypeDropdown] = useState(false);

  // Extended form fields for Profil Kontak layout
  const [formGroup, setFormGroup] = useState('All Groups');
  const [formSalutation, setFormSalutation] = useState('Salutation');
  const [formNumber, setFormNumber] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSecondaryPhone, setFormSecondaryPhone] = useState('');
  const [formFax, setFormFax] = useState('');
  const [formSecondaryEmail, setFormSecondaryEmail] = useState('');
  const [showSecondaryEmail, setShowSecondaryEmail] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  // Collapsible accordion states
  const [isContactProfileOpen, setIsContactProfileOpen] = useState(true);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Billing Address
  const [formBillingAddress, setFormBillingAddress] = useState('');
  const [formBillingCity, setFormBillingCity] = useState('');
  const [formBillingZip, setFormBillingZip] = useState('');
  const [formBillingProvince, setFormBillingProvince] = useState('');

  // Tax & Legal
  const [formTaxType, setFormTaxType] = useState('NPWP');
  const [formTaxId, setFormTaxId] = useState('');
  const [formTaxName, setFormTaxName] = useState('');
  const [formTaxAddress, setFormTaxAddress] = useState('');

  // Shipping
  const [formSameShippingAddress, setFormSameShippingAddress] = useState(true);
  const [formShippingAddress, setFormShippingAddress] = useState('');
  const [formShippingCity, setFormShippingCity] = useState('');
  const [formShippingZip, setFormShippingZip] = useState('');

  // Bank Account
  const [formBankName, setFormBankName] = useState('');
  const [formBankBranch, setFormBankBranch] = useState('');
  const [formBankAccNo, setFormBankAccNo] = useState('');
  const [formBankAccName, setFormBankAccName] = useState('');

  // Account Mapping
  const [formAccountReceivable, setFormAccountReceivable] = useState('1100 - Piutang Usaha');
  const [formAccountPayable, setFormAccountPayable] = useState('2100 - Hutang Usaha');

  const [partners, setPartners] = useState<Partner[]>(() => {
    const stored = getStoredPartners();
    return stored.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category as 'Customer' | 'Distributor',
      pic: p.pic || '-',
      email: p.email || '-',
      phone: p.phone || '-',
      address: p.address || '-',
      balance: typeof p.balance === 'number' ? `Rp ${p.balance.toLocaleString('id-ID')}` : (p.balance || 'Rp 0'),
      status: (p.status || 'Active') as 'Active' | 'Inactive'
    }));
  });

  const syncPartnersToStorage = (updatedPartners: Partner[]) => {
    setPartners(updatedPartners);
    const toSave: PartnerItem[] = updatedPartners.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      pic: p.pic,
      email: p.email,
      phone: p.phone,
      address: p.address,
      balance: typeof p.balance === 'number' ? p.balance : Number(p.balance.replace(/[^0-9]/g, '')) || 0,
      status: p.status
    }));
    savePartners(toSave);
  };

  const effectiveSearch = searchQuery || globalSearchQuery;

  // Filter partners
  const filteredPartners = partners.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(effectiveSearch.toLowerCase()) || 
                          item.pic.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                          item.id.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                          item.email.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesTab = activeTab === 'All' || item.category === activeTab;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesTab && matchesStatus;
  }).sort((a, b) => {
    if (sortFilter === 'A-Z') return a.name.localeCompare(b.name);
    if (sortFilter === 'Z-A') return b.name.localeCompare(a.name);
    if (sortFilter === 'Highest') {
      const numA = Number(a.balance.replace(/[^0-9]/g, '')) || 0;
      const numB = Number(b.balance.replace(/[^0-9]/g, '')) || 0;
      return numB - numA;
    }
    if (sortFilter === 'Lowest') {
      const numA = Number(a.balance.replace(/[^0-9]/g, '')) || 0;
      const numB = Number(b.balance.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    }
    return 0;
  });

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDeleteModalTarget({ type: 'batch', count: selectedIds.length });
  };

  const handleDeleteOne = (partnerOrId: Partner | string) => {
    if (typeof partnerOrId === 'string') {
      const found = partners.find(p => p.id === partnerOrId);
      if (found) {
        setDeleteModalTarget({ type: 'single', partner: found });
      } else {
        setDeleteModalTarget({ type: 'single', partner: { id: partnerOrId, name: partnerOrId } as Partner });
      }
    } else {
      setDeleteModalTarget({ type: 'single', partner: partnerOrId });
    }
  };

  const confirmDelete = () => {
    if (!deleteModalTarget) return;

    if (deleteModalTarget.type === 'single' && deleteModalTarget.partner) {
      const targetId = deleteModalTarget.partner.id;
      const remaining = partners.filter(p => p.id !== targetId);
      syncPartnersToStorage(remaining);
      setSelectedIds(prev => prev.filter(id => id !== targetId));
      if (editingPartner && editingPartner.id === targetId) {
        setView('list');
        setEditingPartner(null);
      }
    } else if (deleteModalTarget.type === 'batch') {
      const remaining = partners.filter(p => !selectedIds.includes(p.id));
      syncPartnersToStorage(remaining);
      setSelectedIds([]);
      if (editingPartner && selectedIds.includes(editingPartner.id)) {
        setView('list');
        setEditingPartner(null);
      }
    }
    setDeleteModalTarget(null);
  };

  const openAddForm = (initialCategory: 'Customer' | 'Distributor' = 'Customer') => {
    setShowAddDropdown(false);
    setEditingPartner(null);
    setFormName('');
    setFormCategory(initialCategory);
    setFormPic('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormBalance('0');
    setFormStatus('Active');

    setFormGroup('All Groups');
    setFormSalutation('Salutation');
    const prefix = initialCategory === 'Customer' ? 'CST' : 'PRT';
    setFormNumber(`${prefix}-${String(partners.length + 1).padStart(3, '0')}`);
    setFormCompany('');
    setFormSecondaryPhone('');
    setFormFax('');
    setFormSecondaryEmail('');
    setShowSecondaryEmail(false);
    setShowPhoto(false);

    setIsContactProfileOpen(true);
    setIsBillingOpen(false);
    setIsTaxOpen(false);
    setIsShippingOpen(false);
    setIsBankOpen(false);
    setIsAccountOpen(false);

    setFormBillingAddress('');
    setFormBillingCity('');
    setFormBillingZip('');
    setFormBillingProvince('');

    setFormTaxType('NPWP');
    setFormTaxId('');
    setFormTaxName('');
    setFormTaxAddress('');

    setFormSameShippingAddress(true);
    setFormShippingAddress('');
    setFormShippingCity('');
    setFormShippingZip('');

    setFormBankName('');
    setFormBankBranch('');
    setFormBankAccNo('');
    setFormBankAccName('');

    setView('form');
  };

  const openEditForm = (p: Partner) => {
    setEditingPartner(p);
    setFormName(p.pic && p.pic !== '-' ? p.pic : p.name);
    setFormCategory(p.category);
    setFormPic(p.pic === '-' ? '' : p.pic);
    setFormEmail(p.email === '-' ? '' : p.email);
    setFormPhone(p.phone === '-' ? '' : p.phone);
    setFormAddress(p.address === '-' ? '' : p.address);
    const numericBalance = p.balance.replace(/[^0-9]/g, '');
    setFormBalance(numericBalance || '0');
    setFormStatus(p.status);

    setFormCompany(p.name);
    setFormNumber(p.id);
    setFormBillingAddress(p.address === '-' ? '' : p.address);

    setIsContactProfileOpen(true);
    setView('form');
  };

  const handleFormSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalDisplayName = formCompany.trim() || formName.trim();
    if (!finalDisplayName) return;

    const formattedBal = `Rp ${Number(formBalance || 0).toLocaleString('id-ID')}`;
    const salutationPrefix = formSalutation && formSalutation !== 'Sapaan' && formSalutation !== 'Salutation' ? `${formSalutation} ` : '';
    const finalPic = `${salutationPrefix}${formName}`.trim() || formPic.trim() || '-';

    if (editingPartner) {
      const updated = partners.map(p => {
        if (p.id === editingPartner.id) {
          return {
            ...p,
            name: finalDisplayName,
            category: formCategory,
            pic: finalPic,
            email: formEmail.trim() || '-',
            phone: formPhone.trim() || '-',
            address: formBillingAddress.trim() || formAddress.trim() || '-',
            balance: formattedBal,
            status: formStatus
          };
        }
        return p;
      });
      syncPartnersToStorage(updated);
    } else {
      const prefix = formCategory === 'Customer' ? 'CST' : 'PRT';
      const newId = formNumber.trim() || `${prefix}-${String(partners.length + 1).padStart(3, '0')}`;
      const newPartner: Partner = {
        id: newId,
        name: finalDisplayName,
        category: formCategory,
        pic: finalPic,
        email: formEmail.trim() || '-',
        phone: formPhone.trim() || '-',
        address: formBillingAddress.trim() || formAddress.trim() || '-',
        balance: formattedBal,
        status: formStatus
      };
      syncPartnersToStorage([newPartner, ...partners]);
    }
    setView('list');
  };

  // Tab Counts (Note: Suppliers tab is removed from table view per user request)
  const customerCount = partners.filter(p => p.category === 'Customer').length;
  const distributorCount = partners.filter(p => p.category === 'Distributor').length;

  return (
    <div className="flex-1 flex flex-col font-sans text-white bg-[#0A0A0A] px-6 pb-6 pt-[9px] lg:px-8 lg:pb-8 lg:pt-[9px] space-y-6 min-h-screen">
      
      {view === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="pb-0" style={{ marginBottom: '0px', paddingBottom: '0px' }}>
              <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0" style={{ marginBottom: 0 }}>
                <span>Partners</span>
              </h1>
              <p className="text-[13px] text-[#909090]">
                Manage details, contacts, and transactions for all customers and distributors.
              </p>
            </div>

            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-5 text-[12px] font-medium text-[#909090]">
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
                        type="button"
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="button" className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                  <HelpCircle size={14} /> Guide
                </button>
                <button type="button" className={`flex items-center gap-1.5 transition-colors cursor-pointer ${selectedIds.length > 0 ? 'text-white' : 'hover:text-white'}`}>
                  <FileText size={14} /> PDF
                </button>
              </div>
            </div>
          </div>

          {/* Filters / Add Action Row (Matches Purchase page positioning) */}
          <div className="flex items-center justify-between mb-6">
            <div></div>

            {/* Add Partner Button with Dropdown (Customer & Distributor) */}
            <div className="flex items-center gap-3 relative">
              <motion.button 
                type="button"
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                whileHover={{ backgroundColor: '#D97706' }}
                whileTap={{ scale: 0.95 }}
                title="Add New Partner"
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
                      {/* Option 1: Customer */}
                      <button
                        type="button"
                        onClick={() => openAddForm('Customer')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#25272D] group-hover:bg-[#EA580C]/20 flex items-center justify-center text-gray-300 group-hover:text-[#EA580C] transition-colors shrink-0">
                            <UserCheck size={17} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors leading-snug">Customer</p>
                            <p className="text-xs text-[#8E9099] leading-snug">Tambah pelanggan baru</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ C</span>
                      </button>

                      {/* Option 2: Distributor */}
                      <button
                        type="button"
                        onClick={() => openAddForm('Distributor')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#25272D] transition-colors group text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#25272D] group-hover:bg-[#EA580C]/20 flex items-center justify-center text-gray-300 group-hover:text-[#EA580C] transition-colors shrink-0">
                            <Building2 size={17} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-[#EA580C] transition-colors leading-snug">Distributor</p>
                            <p className="text-xs text-[#8E9099] leading-snug">Tambah distributor / mitra baru</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-medium text-[#71737C] group-hover:text-gray-300">⌘ D</span>
                      </button>

                      <div className="my-1 border-t border-[#2C2E35]" />

                      {/* Option 3: Cancel */}
                      <button
                        type="button"
                        onClick={() => setShowAddDropdown(false)}
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

          {/* Main Content Card Container */}
          <div className="bg-[#131417] border border-[#232427] rounded-2xl shadow-2xl relative z-10 overflow-hidden">
            
            {/* Category Tabs - SUPPLIERS TAB REMOVED AS REQUESTED */}
            <div className="flex items-center border-b border-[#232427] px-4 pt-1 bg-[#1A1B1F] rounded-t-2xl overflow-x-auto">
              {[
                { id: 'All', label: 'All', count: partners.length },
                { id: 'Customer', label: 'Customers', count: customerCount },
                { id: 'Distributor', label: 'Distributors', count: distributorCount }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedIds([]);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-[#EA580C] text-white' 
                      : 'border-transparent text-[#909299] hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[11px] px-2 py-0.2 rounded-full font-semibold ${
                    activeTab === tab.id ? 'bg-[#EA580C]/20 text-[#EA580C]' : 'bg-[#25272E] text-[#808289]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Partners Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#232427] bg-[#1A1B1F]">
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">Name</th>
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">Contact PIC</th>
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">Phone</th>
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px]">Mail</th>
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right w-36">In</th>
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-right w-36">Out</th>
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-center w-28">Status</th>
                    <th className="py-3.5 px-4 font-medium text-[#8E9097] text-[13px] text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202229]">
                  {filteredPartners.length > 0 ? (
                    filteredPartners.map((p) => {
                      return (
                        <tr 
                          key={p.id} 
                          className="hover:bg-[#1A1C22] transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="text-[13px] text-white font-semibold">{p.name}</span>
                              <span className="flex items-center gap-1 text-[11px] text-[#7E8088] mt-0.5">
                                <MapPin size={11} className="shrink-0" />
                                <span className="truncate max-w-[240px]">{p.address}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[13px] text-white font-medium">{p.pic}</td>
                          <td className="py-3.5 px-4 text-[12px] text-[#D5D7DF] font-mono">
                            <span className="flex items-center gap-1.5">
                              <Phone size={11} className="text-[#6E7079]" />
                              {p.phone}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[12px] text-[#D5D7DF]">
                            <span className="flex items-center gap-1.5">
                              <Mail size={11} className="text-[#6E7079]" />
                              {p.email}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[13px] text-right font-mono font-semibold text-[#10B981]">
                            {p.category === 'Distributor' ? 'Rp 0' : p.balance}
                          </td>
                          <td className="py-3.5 px-4 text-[13px] text-right font-mono font-semibold text-[#EF4444]">
                            {p.category === 'Distributor' ? p.balance : 'Rp 0'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              p.status === 'Active' 
                                ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]' 
                                : 'bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditForm(p)}
                                title="Edit Partner"
                                className="p-1.5 text-[#8E9099] hover:text-white hover:bg-[#252730] rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOne(p)}
                                title="Delete Partner"
                                className="p-1.5 text-[#8E9099] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[13px] text-[#6E7079]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users size={28} className="text-[#3A3D48]" />
                          <p>Tidak ada partner yang ditemukan.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* DEDICATED FULL-PAGE CREATE / EDIT PARTNER VIEW (NO POPUP) */
        <div className="w-full space-y-6 animate-fadeIn">
          {/* Top Navigation & Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1C1C1C]">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setView('list')}
                className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-colors cursor-pointer text-[#909090] hover:text-white flex-shrink-0"
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest block mb-0.5">
                  {editingPartner ? 'EDIT CONTACT' : 'NEW CONTACT'}
                </span>
                <h1 className="text-[18px] font-semibold tracking-tight text-white leading-tight">
                  {editingPartner 
                    ? `Edit Partner: ${editingPartner.name}` 
                    : formCategory === 'Distributor' 
                      ? 'Add New Distributor' 
                      : 'Add New Customer'}
                </h1>
              </div>
            </div>
          </div>

          {/* Action Buttons Row (Save / Cancel Pill) - Positioned below header like Purchase */}
          <div className="flex items-center justify-end mb-6">
            <div className="inline-flex items-center bg-[#18191E] border border-[#2B2E38] rounded-full p-1 shadow-lg">
              <button 
                type="button"
                onClick={() => handleFormSave()}
                disabled={!formName.trim() && !formCompany.trim()}
                className={`flex items-center gap-2 px-5 py-1.5 text-[13px] font-medium transition-all rounded-full ${
                  formName.trim() || formCompany.trim() 
                    ? 'text-[#EA580C] hover:text-[#70B0FF] hover:bg-[#232630] cursor-pointer active:scale-95' 
                    : 'text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle size={15} className={formName.trim() || formCompany.trim() ? "text-[#EA580C]" : "text-gray-500"} />
                <span>Save</span>
              </button>

              {editingPartner && (
                <>
                  <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />
                  <button 
                    type="button"
                    onClick={() => handleDeleteOne(editingPartner)}
                    className="flex items-center gap-2 px-5 py-1.5 text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 size={15} className="text-red-400" />
                    <span>Hapus</span>
                  </button>
                </>
              )}

              <div className="h-4 w-[1px] bg-[#2C2F3A] my-auto" />

              <button 
                type="button"
                onClick={() => setView('list')}
                className="flex items-center gap-2 px-5 py-1.5 text-[13px] font-medium text-[#EA580C] hover:text-[#70B0FF] hover:bg-[#232630] rounded-full transition-all cursor-pointer active:scale-95"
              >
                <XCircle size={15} className="text-[#EA580C]" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {/* Core Partner Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleFormSave(e);
            }} 
            className="space-y-4"
          >
            {/* SECTION 1: CONTACT PROFILE */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl transition-all">
              <button
                type="button"
                onClick={() => setIsContactProfileOpen(!isContactProfileOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#1A1C20] hover:bg-[#202228] transition-colors cursor-pointer text-left select-none border-b border-[#262830]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22242B] border border-[#2B2D36] flex items-center justify-center text-white">
                    <User size={18} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Contact Profile</span>
                </div>
                {isContactProfileOpen ? (
                  <ChevronDown size={18} className="text-[#8E9099]" />
                ) : (
                  <ChevronRight size={18} className="text-[#8E9099]" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isContactProfileOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 space-y-4 bg-[#141517]">
                      {/* Photo Toggle Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowPhoto(!showPhoto)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-gray-300 transition-colors cursor-pointer"
                        >
                          <Camera size={14} className="text-white" />
                          <span>{showPhoto ? "- Hide Photo" : "+ Show Photo"}</span>
                        </button>
                      </div>

                      {showPhoto && (
                        <div className="p-4 border border-dashed border-[#2B2D36] rounded-xl bg-[#1A1C22]/50 flex flex-col items-center justify-center text-center">
                          <User size={32} className="text-[#525562] mb-1" />
                          <p className="text-xs text-[#8E9099]">Click to upload contact profile photo</p>
                        </div>
                      )}

                      {/* Row 1: Contact Type & Group */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Contact Type <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                              className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between text-left focus:outline-none focus:border-[#3A3D4A] hover:border-[#3A3D4A] transition-colors cursor-pointer"
                            >
                              <span className="truncate">{formCategory}</span>
                              <ChevronDown size={14} className="text-[#8E9099] flex-shrink-0 ml-1" />
                            </button>
                            <AnimatePresence>
                              {showCategoryDropdown && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                                  >
                                    {(['Customer', 'Distributor'] as const).map((cat) => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                          setFormCategory(cat);
                                          setShowCategoryDropdown(false);
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                          formCategory === cat
                                            ? 'bg-[#222530] text-white font-semibold'
                                            : 'text-[#D5D5D5] hover:bg-[#202228] hover:text-white'
                                        }`}
                                      >
                                        <span>{cat}</span>
                                        {formCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Group
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                              className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between text-left focus:outline-none focus:border-[#3A3D4A] hover:border-[#3A3D4A] transition-colors cursor-pointer"
                            >
                              <span className="truncate">{formGroup}</span>
                              <ChevronDown size={14} className="text-[#8E9099] flex-shrink-0 ml-1" />
                            </button>
                            <AnimatePresence>
                              {showGroupDropdown && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowGroupDropdown(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                                  >
                                    {['All Groups', 'VIP', 'Regular', 'General'].map((grp) => (
                                      <button
                                        key={grp}
                                        type="button"
                                        onClick={() => {
                                          setFormGroup(grp);
                                          setShowGroupDropdown(false);
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                          formGroup === grp
                                            ? 'bg-[#222530] text-white font-semibold'
                                            : 'text-[#D5D5D5] hover:bg-[#202228] hover:text-white'
                                        }`}
                                      >
                                        <span>{grp}</span>
                                        {formGroup === grp && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Salutation, Name & Company (COMPANY MOVED NEXT TO NAME) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Salutation
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowSalutationDropdown(!showSalutationDropdown)}
                              className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between text-left focus:outline-none focus:border-[#3A3D4A] hover:border-[#3A3D4A] transition-colors cursor-pointer"
                            >
                              <span className="truncate">{formSalutation}</span>
                              <ChevronDown size={14} className="text-[#8E9099] flex-shrink-0 ml-1" />
                            </button>
                            <AnimatePresence>
                              {showSalutationDropdown && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowSalutationDropdown(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                                  >
                                    {['Salutation', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'].map((sal) => (
                                      <button
                                        key={sal}
                                        type="button"
                                        onClick={() => {
                                          setFormSalutation(sal);
                                          setShowSalutationDropdown(false);
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                          formSalutation === sal
                                            ? 'bg-[#222530] text-white font-semibold'
                                            : 'text-[#D5D5D5] hover:bg-[#202228] hover:text-white'
                                        }`}
                                      >
                                        <span>{sal}</span>
                                        {formSalutation === sal && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Contact / PIC Name"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Company
                          </label>
                          <input
                            type="text"
                            value={formCompany}
                            onChange={(e) => setFormCompany(e.target.value)}
                            placeholder="Company Name"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Row 3: Contact ID & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Contact ID
                          </label>
                          <input
                            type="text"
                            value={formNumber}
                            onChange={(e) => setFormNumber(e.target.value)}
                            placeholder="Partner ID Number"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Phone
                          </label>
                          <input
                            type="text"
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                            placeholder="Primary Phone / WhatsApp"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Row 4: Email */}
                      <div>
                        <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="Primary Email"
                          className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                        />
                      </div>

                      {/* Add Secondary Email link */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowSecondaryEmail(!showSecondaryEmail)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] hover:text-[#70B0FF] transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>{showSecondaryEmail ? "- Hide Secondary Email" : "+ Add Secondary Email"}</span>
                        </button>
                      </div>

                      {showSecondaryEmail && (
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Secondary Email
                          </label>
                          <input
                            type="email"
                            value={formSecondaryEmail}
                            onChange={(e) => setFormSecondaryEmail(e.target.value)}
                            placeholder="Secondary Email"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      )}

                      {/* Row 5: Secondary Phone & Fax */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Secondary Phone
                          </label>
                          <input
                            type="text"
                            value={formSecondaryPhone}
                            onChange={(e) => setFormSecondaryPhone(e.target.value)}
                            placeholder="Secondary Phone"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Fax
                          </label>
                          <input
                            type="text"
                            value={formFax}
                            onChange={(e) => setFormFax(e.target.value)}
                            placeholder="Fax"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 2: BILLING ADDRESS */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl transition-all">
              <button
                type="button"
                onClick={() => setIsBillingOpen(!isBillingOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#1A1C20] hover:bg-[#202228] transition-colors cursor-pointer text-left select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22242B] border border-[#2B2D36] flex items-center justify-center text-white">
                    <FileText size={18} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Billing Address</span>
                </div>
                {isBillingOpen ? (
                  <ChevronDown size={18} className="text-[#8E9099]" />
                ) : (
                  <ChevronRight size={18} className="text-[#8E9099]" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isBillingOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[#262830]"
                  >
                    <div className="p-5 space-y-4 bg-[#141517]">
                      <div>
                        <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                          Street Address
                        </label>
                        <textarea
                          rows={2}
                          value={formBillingAddress}
                          onChange={(e) => setFormBillingAddress(e.target.value)}
                          placeholder="Full billing address..."
                          className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            City / Regency
                          </label>
                          <input
                            type="text"
                            value={formBillingCity}
                            onChange={(e) => setFormBillingCity(e.target.value)}
                            placeholder="City / Regency"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={formBillingZip}
                            onChange={(e) => setFormBillingZip(e.target.value)}
                            placeholder="Postal Code"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 3: TAX & LEGAL IDENTITY */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl transition-all">
              <button
                type="button"
                onClick={() => setIsTaxOpen(!isTaxOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#1A1C20] hover:bg-[#202228] transition-colors cursor-pointer text-left select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22242B] border border-[#2B2D36] flex items-center justify-center text-white">
                    <CreditCard size={18} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Tax & Legal Identity</span>
                </div>
                {isTaxOpen ? (
                  <ChevronDown size={18} className="text-[#8E9099]" />
                ) : (
                  <ChevronRight size={18} className="text-[#8E9099]" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isTaxOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[#262830]"
                  >
                    <div className="p-5 space-y-4 bg-[#141517]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Identity Type
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowTaxTypeDropdown(!showTaxTypeDropdown)}
                              className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between text-left focus:outline-none focus:border-[#3A3D4A] hover:border-[#3A3D4A] transition-colors cursor-pointer"
                            >
                              <span className="truncate">
                                {formTaxType === 'NPWP' ? 'Tax ID (NPWP)' : formTaxType === 'KTP' ? 'National ID (KTP)' : formTaxType}
                              </span>
                              <ChevronDown size={14} className="text-[#8E9099] flex-shrink-0 ml-1" />
                            </button>
                            <AnimatePresence>
                              {showTaxTypeDropdown && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowTaxTypeDropdown(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute left-0 top-full mt-2 w-full bg-[#141518] border border-[#262830] rounded-[18px] shadow-2xl p-1.5 z-50 overflow-hidden"
                                  >
                                    {[
                                      { label: 'Tax ID (NPWP)', val: 'NPWP' },
                                      { label: 'National ID (KTP)', val: 'KTP' },
                                      { label: 'Passport', val: 'Passport' }
                                    ].map((tt) => (
                                      <button
                                        key={tt.val}
                                        type="button"
                                        onClick={() => {
                                          setFormTaxType(tt.val);
                                          setShowTaxTypeDropdown(false);
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                          formTaxType === tt.val
                                            ? 'bg-[#222530] text-white font-semibold'
                                            : 'text-[#D5D5D5] hover:bg-[#202228] hover:text-white'
                                        }`}
                                      >
                                        <span>{tt.label}</span>
                                        {formTaxType === tt.val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Identity Number (Tax ID / ID Card)
                          </label>
                          <input
                            type="text"
                            value={formTaxId}
                            onChange={(e) => setFormTaxId(e.target.value)}
                            placeholder="Tax ID or National ID Number"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                          Tax Registered Name
                        </label>
                        <input
                          type="text"
                          value={formTaxName}
                          onChange={(e) => setFormTaxName(e.target.value)}
                          placeholder="Full name registered for tax"
                          className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 4: SHIPPING ADDRESS */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl transition-all">
              <button
                type="button"
                onClick={() => setIsShippingOpen(!isShippingOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#1A1C20] hover:bg-[#202228] transition-colors cursor-pointer text-left select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22242B] border border-[#2B2D36] flex items-center justify-center text-white">
                    <Truck size={18} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Shipping Address</span>
                </div>
                {isShippingOpen ? (
                  <ChevronDown size={18} className="text-[#8E9099]" />
                ) : (
                  <ChevronRight size={18} className="text-[#8E9099]" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isShippingOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[#262830]"
                  >
                    <div className="p-5 space-y-4 bg-[#141517]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formSameShippingAddress}
                          onChange={(e) => setFormSameShippingAddress(e.target.checked)}
                          className="w-4 h-4 accent-white rounded border-[#2B2D36] bg-[#1A1C22] cursor-pointer"
                        />
                        <span className="text-xs text-[#D5D5D5] font-medium">Same as billing address</span>
                      </label>

                      {!formSameShippingAddress && (
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Shipping Street Address
                          </label>
                          <textarea
                            rows={2}
                            value={formShippingAddress}
                            onChange={(e) => setFormShippingAddress(e.target.value)}
                            placeholder="Full shipping address..."
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 5: BANK ACCOUNT */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl transition-all">
              <button
                type="button"
                onClick={() => setIsBankOpen(!isBankOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#1A1C20] hover:bg-[#202228] transition-colors cursor-pointer text-left select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22242B] border border-[#2B2D36] flex items-center justify-center text-white">
                    <Landmark size={18} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Bank Account</span>
                </div>
                {isBankOpen ? (
                  <ChevronDown size={18} className="text-[#8E9099]" />
                ) : (
                  <ChevronRight size={18} className="text-[#8E9099]" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isBankOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[#262830]"
                  >
                    <div className="p-5 space-y-4 bg-[#141517]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            value={formBankName}
                            onChange={(e) => setFormBankName(e.target.value)}
                            placeholder="BCA / Mandiri / BNI / BRI"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Branch Name
                          </label>
                          <input
                            type="text"
                            value={formBankBranch}
                            onChange={(e) => setFormBankBranch(e.target.value)}
                            placeholder="Bank branch name"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={formBankAccNo}
                            onChange={(e) => setFormBankAccNo(e.target.value)}
                            placeholder="Bank account number"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Account Holder
                          </label>
                          <input
                            type="text"
                            value={formBankAccName}
                            onChange={(e) => setFormBankAccName(e.target.value)}
                            placeholder="Account holder name"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 6: ACCOUNT MAPPING */}
            <div className="bg-[#141517] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl transition-all">
              <button
                type="button"
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#1A1C20] hover:bg-[#202228] transition-colors cursor-pointer text-left select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22242B] border border-[#2B2D36] flex items-center justify-center text-white">
                    <BookOpen size={18} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Account Mapping</span>
                </div>
                {isAccountOpen ? (
                  <ChevronDown size={18} className="text-[#8E9099]" />
                ) : (
                  <ChevronRight size={18} className="text-[#8E9099]" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isAccountOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[#262830]"
                  >
                    <div className="p-5 space-y-4 bg-[#141517]">
                      <div>
                        <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                          Opening Balance (Rp)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8E9099]">Rp</span>
                          <input
                            type="number"
                            value={formBalance}
                            onChange={(e) => setFormBalance(e.target.value)}
                            placeholder="0"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl pl-11 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Accounts Receivable
                          </label>
                          <input
                            type="text"
                            value={formAccountReceivable}
                            onChange={(e) => setFormAccountReceivable(e.target.value)}
                            placeholder="1100 - Accounts Receivable"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#8E9099] mb-1.5">
                            Accounts Payable
                          </label>
                          <input
                            type="text"
                            value={formAccountPayable}
                            onChange={(e) => setFormAccountPayable(e.target.value)}
                            placeholder="2100 - Accounts Payable"
                            className="w-full bg-[#1A1C22] border border-[#2B2D36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3A3D4A] placeholder:text-[#525562] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Validation note */}
            {(!formName.trim() && !formCompany.trim()) && (
              <div className="bg-[#1A1C22] border border-[#2B2D36] text-[12px] text-[#D5D5D5] px-4 py-3 rounded-xl flex items-center gap-2.5">
                <Info size={15} className="text-white flex-shrink-0" />
                <span>Name or Company is required before saving.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-[#18191E] border border-[#2C2F3A] rounded-2xl p-6 shadow-2xl text-white space-y-4 font-sans"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Hapus Partner</h2>
                  <p className="text-xs text-[#8E9099]">Konfirmasi tindakan penghapusan</p>
                </div>
              </div>

              <p className="text-sm text-[#A0A2AC] leading-relaxed">
                {deleteModalTarget.type === 'single' && deleteModalTarget.partner
                  ? `Apakah Anda yakin ingin menghapus partner "${deleteModalTarget.partner.name}"? Data yang dihapus tidak dapat dikembalikan.`
                  : `Apakah Anda yakin ingin menghapus ${deleteModalTarget.count} partner yang dipilih? Data yang dihapus tidak dapat dikembalikan.`}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#22242C] hover:bg-[#2B2D38] border border-[#3A3D4A] rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors cursor-pointer shadow-lg shadow-red-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
