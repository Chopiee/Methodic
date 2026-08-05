import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import { 
  X, 
  Search, 
  User, 
  Bell, 
  Sliders, 
  PhoneCall, 
  Monitor, 
  SlidersHorizontal, 
  Users, 
  Layers,
  Hash, 
  CreditCard, 
  Code2, 
  Shield, 
  HelpCircle, 
  ArrowRightLeft, 
  Check, 
  Building2, 
  Receipt, 
  Tag, 
  Database, 
  Save, 
  RefreshCw, 
  Lock, 
  Laptop, 
  Smartphone, 
  Globe, 
  Key, 
  Mail, 
  Plus, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Radio,
  FileText
} from 'lucide-react';
import { 
  getIdPrefixSettings, 
  saveIdPrefixSettings, 
  defaultIdPrefixSettings, 
  IdPrefixSettings,
  getCompanySettings,
  saveCompanySettings,
  CompanySettings
} from '../lib/state';

export type SettingsTab = 
  | 'profile' 
  | 'company'
  | 'notifications' 
  | 'connections' 
  | 'call_intelligence' 
  | 'sessions' 
  | 'general' 
  | 'members' 
  | 'plans' 
  | 'billing' 
  | 'developers' 
  | 'security' 
  | 'support' 
  | 'migrate_crm';

type SegmentOption = 'Off' | 'Email' | 'In-app' | 'Both';

interface NotificationSettingRow {
  id: string;
  title: string;
  desc: string;
  value: SegmentOption;
}

export function Settings({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Smart Notifications State
  const [smartNotifications, setSmartNotifications] = useState(true);

  // Account & Security Notification Options
  const [accountNotificationSettings, setAccountNotificationSettings] = useState<NotificationSettingRow[]>([
    { id: 'security_alert', title: 'Security alert', desc: 'Unusual activity or important security updates.', value: 'Email' },
    { id: 'new_signin', title: 'New sign-in', desc: 'Your account is accessed from a new device.', value: 'Email' },
    { id: 'password_changed', title: 'Password changed', desc: 'Your password is updated.', value: 'Email' },
  ]);

  // Workspace Updates Notification Options
  const [workspaceNotificationSettings, setWorkspaceNotificationSettings] = useState<NotificationSettingRow[]>([
    { id: 'role_permission', title: 'Role or permission changed', desc: 'Your access level changes.', value: 'In-app' },
    { id: 'new_member', title: 'New team member joined', desc: 'Someone joins the workspace.', value: 'In-app' },
    { id: 'workspace_settings', title: 'Workspace settings changed', desc: 'Important workspace settings are updated.', value: 'In-app' },
    { id: 'member_removed', title: 'Member removed', desc: 'Someone is removed from the workspace.', value: 'In-app' },
  ]);

  // Messages & Notes Notification Options
  const [messagesNotificationSettings, setMessagesNotificationSettings] = useState<NotificationSettingRow[]>([
    { id: 'direct_messages', title: 'Direct messages', desc: 'When someone sends you a direct message.', value: 'Both' },
    { id: 'mentions', title: 'Mentions & replies', desc: 'When you are mentioned in a note or document.', value: 'In-app' },
  ]);

  // Existing App State - ID Prefixes & Company Profile
  const [idPrefixes, setIdPrefixes] = useState<IdPrefixSettings>(() => getIdPrefixSettings());
  const initialCompany = getCompanySettings();
  const [companyName, setCompanyName] = useState(initialCompany.companyName);
  const [companyEmail, setCompanyEmail] = useState(initialCompany.companyEmail);
  const [companyPhone, setCompanyPhone] = useState(initialCompany.companyPhone);
  const [companyAddress, setCompanyAddress] = useState(initialCompany.companyAddress);
  const [companyLogo, setCompanyLogo] = useState(initialCompany.companyLogo);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [taxId, setTaxId] = useState(initialCompany.taxId);
  const [currency, setCurrency] = useState('IDR');
  const [taxRate, setTaxRate] = useState('11');

  // Members State
  const [members, setMembers] = useState([
    { id: '1', name: 'Admin Methodic', email: 'admin@methodic.co.id', role: 'Owner', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { id: '2', name: 'Finance Lead', email: 'finance@methodic.co.id', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { id: '3', name: 'Warehouse Staff', email: 'gudang@methodic.co.id', role: 'Member', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  ]);

  const handleUpdateAccountSetting = (id: string, val: SegmentOption) => {
    setAccountNotificationSettings(prev => prev.map(s => s.id === id ? { ...s, value: val } : s));
    triggerSuccessToast();
  };

  const handleUpdateWorkspaceSetting = (id: string, val: SegmentOption) => {
    setWorkspaceNotificationSettings(prev => prev.map(s => s.id === id ? { ...s, value: val } : s));
    triggerSuccessToast();
  };

  const handleUpdateMessagesSetting = (id: string, val: SegmentOption) => {
    setMessagesNotificationSettings(prev => prev.map(s => s.id === id ? { ...s, value: val } : s));
    triggerSuccessToast();
  };

  const triggerSuccessToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveIdPrefixSettings(idPrefixes);
    saveCompanySettings({
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      companyLogo,
      taxId
    });
    triggerSuccessToast();
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropImage = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      setCompanyLogo(croppedImage);
      setCropImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPrefixes = () => {
    setIdPrefixes(defaultIdPrefixSettings);
    saveIdPrefixSettings(defaultIdPrefixSettings);
    triggerSuccessToast();
  };

  const personalTabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'connections' as const, label: 'Connections', icon: Sliders },
    { id: 'call_intelligence' as const, label: 'Call intelligence', icon: PhoneCall },
    { id: 'sessions' as const, label: 'Sessions', icon: Monitor },
  ];

  const workspaceTabs = [
    { id: 'general' as const, label: 'General', icon: SlidersHorizontal },
    { id: 'id_formats' as const, label: 'ID Formats', icon: Hash },
    { id: 'company' as const, label: 'Company Info', icon: Building2 },
    { id: 'members' as const, label: 'Members', icon: Users },
    { id: 'plans' as const, label: 'Plans', icon: Layers },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
    { id: 'developers' as const, label: 'Developers', icon: Code2 },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'support' as const, label: 'Support requests', icon: HelpCircle },
    { id: 'migrate_crm' as const, label: 'Migrate CRM', icon: ArrowRightLeft },
  ];

  const filterTab = (label: string) => {
    if (!searchQuery.trim()) return true;
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 font-sans text-white">
      {/* Backdrop overlay identical to discard modal */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" 
        onClick={onClose} 
      />

      {/* Outer Floating Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl bg-[#141416] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[88vh] max-h-[760px] min-h-[580px]"
      >
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 lg:w-72 bg-[#121214] border-r border-[#27272A] p-4 flex flex-col gap-4 flex-shrink-0">
          
          {/* Header Title with X close button */}
          <div className="flex items-center justify-between px-1 py-1 text-white font-semibold text-sm">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={onClose}
                className="p-1 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-md transition-colors cursor-pointer"
                title="Close settings"
              >
                <X size={16} />
              </button>
              <span>Settings</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#EA580C] transition-colors"
            />
          </div>

          {/* Navigation Groups */}
          <div className="flex flex-col gap-5 overflow-y-auto pr-1 flex-1">
            
            {/* PERSONAL GROUP */}
            <div>
              <div className="text-[10px] font-bold text-[#71717A] tracking-wider uppercase px-2 mb-1.5">
                PERSONAL
              </div>
              <div className="flex flex-col gap-0.5">
                {personalTabs.filter(t => filterTab(t.label)).map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'bg-[#27272A] text-white font-medium shadow-sm' 
                          : 'text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]'
                      }`}
                    >
                      <Icon size={15} className={isActive ? 'text-white' : 'text-[#85858E]'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* WORKSPACE GROUP */}
            <div>
              <div className="text-[10px] font-bold text-[#71717A] tracking-wider uppercase px-2 mb-1.5">
                WORKSPACE
              </div>
              <div className="flex flex-col gap-0.5">
                {workspaceTabs.filter(t => filterTab(t.label)).map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'bg-[#27272A] text-white font-medium shadow-sm' 
                          : 'text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]'
                      }`}
                    >
                      <Icon size={15} className={isActive ? 'text-white' : 'text-[#85858E]'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Toast Notification Banner inside sidebar if updated */}
          {savedSuccess && (
            <div className="flex items-center gap-2 bg-[#163820] border border-[#225830] text-[#4ADE80] text-[11px] px-3 py-2 rounded-lg animate-in fade-in">
              <Check size={14} />
              <span>Settings updated</span>
            </div>
          )}

        </div>

        {/* RIGHT MAIN CONTENT PANEL */}
        <div className="flex-1 bg-[#18181A] p-6 sm:p-8 overflow-y-auto space-y-8">
          
          {/* 1. NOTIFICATIONS TAB (EXACT REPLICA OF USER'S ATTACHED DESIGN) */}
          {activeTab === 'notifications' && (
            <div className="space-y-7 animate-in fade-in duration-200">
              
              {/* Main Title & Subtitle */}
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight">Notifications</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Choose which updates you want to receive and where they should appear.
                </p>
              </div>

              {/* Smart notifications */}
              <div className="flex items-center justify-between pb-6 border-b border-[#27272A]">
                <div>
                  <h3 className="text-sm font-medium text-white">Smart notifications</h3>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Pause mobile alerts while you're active on desktop.
                  </p>
                </div>
                {/* Orange Toggle Switch */}
                <button
                  type="button"
                  onClick={() => {
                    setSmartNotifications(!smartNotifications);
                    triggerSuccessToast();
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    smartNotifications ? 'bg-[#EA580C]' : 'bg-[#27272A]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      smartNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Account & security */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-white tracking-wide">Account & security</h3>
                <div className="space-y-3">
                  {accountNotificationSettings.map(row => (
                    <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-[#27272A]/50 last:border-0">
                      <div>
                        <div className="text-xs font-medium text-white">{row.title}</div>
                        <div className="text-[11px] text-[#71717A] mt-0.5">{row.desc}</div>
                      </div>
                      {/* Segmented Pill Buttons */}
                      <SegmentedControl 
                        value={row.value} 
                        onChange={(val) => handleUpdateAccountSetting(row.id, val)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Workspace updates */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold text-white tracking-wide">Workspace updates</h3>
                <div className="space-y-3">
                  {workspaceNotificationSettings.map(row => (
                    <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-[#27272A]/50 last:border-0">
                      <div>
                        <div className="text-xs font-medium text-white">{row.title}</div>
                        <div className="text-[11px] text-[#71717A] mt-0.5">{row.desc}</div>
                      </div>
                      <SegmentedControl 
                        value={row.value} 
                        onChange={(val) => handleUpdateWorkspaceSetting(row.id, val)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages & Notes */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-semibold text-white tracking-wide">Messages & Notes</h3>
                <div className="space-y-3">
                  {messagesNotificationSettings.map(row => (
                    <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-[#27272A]/50 last:border-0">
                      <div>
                        <div className="text-xs font-medium text-white">{row.title}</div>
                        <div className="text-[11px] text-[#71717A] mt-0.5">{row.desc}</div>
                      </div>
                      <SegmentedControl 
                        value={row.value} 
                        onChange={(val) => handleUpdateMessagesSetting(row.id, val)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 2. PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-semibold text-white">Personal Profile</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Manage your personal account details and public persona.</p>
              </div>

              <div className="flex items-center gap-5 p-4 bg-[#141416] border border-[#27272A] rounded-xl">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#EA580C]" 
                />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">Administrator</h3>
                  <p className="text-xs text-[#71717A]">admin@methodicserene.co.id</p>
                  <button className="text-[11px] text-[#EA580C] hover:underline font-medium">Change avatar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue="Moch Kall" 
                    className="w-full bg-[#141416] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Job Title</label>
                  <input 
                    type="text" 
                    defaultValue="Chief Financial Officer & Executive" 
                    className="w-full bg-[#141416] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue="moch.kall01@gmail.com" 
                    className="w-full bg-[#141416] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMPANY SETTINGS */}
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompanySettings} className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-semibold text-white">Company Information</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Configure company identity, address, and logo for documents.</p>
              </div>

              <div className="p-5 bg-[#141416] border border-[#27272A] rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Building2 size={16} className="text-[#EA580C]" /> Company Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Company Logo (URL or Base64)</label>
                    <div className="flex items-center gap-3">
                      {companyLogo && (
                        <div className="w-12 h-12 bg-white rounded flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <img src={companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) setCropImageSrc(event.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                        className="w-full text-xs text-[#A1A1AA] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#27272A] file:text-white hover:file:bg-[#3F3F46] cursor-pointer"
                      />
                      {companyLogo && (
                        <button type="button" onClick={() => setCompanyLogo('')} className="text-xs text-rose-500 hover:text-rose-400">Remove</button>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Company / Store Name</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Full Address</label>
                    <textarea 
                      rows={2}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Email</label>
                    <input 
                      type="email" 
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Phone / WhatsApp</label>
                    <input 
                      type="text" 
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Tax ID / NPWP</label>
                    <input 
                      type="text" 
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-[#27272A] pt-6">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#D97706] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={14} /> Save Company Settings
                </button>
              </div>
            </form>
          )}

          {/* 3. GENERAL / WORKSPACE SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-semibold text-white">General Settings</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Configure general workspace preferences.</p>
              </div>
              <div className="p-5 bg-[#141416] border border-[#27272A] rounded-xl space-y-4">
                <p className="text-sm text-[#A1A1AA]">More general settings will appear here.</p>
              </div>
            </div>
          )}

          {/* ID FORMATS TAB */}
          {activeTab === 'id_formats' && (
            <form onSubmit={(e) => {
              e.preventDefault();
              saveIdPrefixSettings(idPrefixes);
              triggerSuccessToast();
            }} className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-semibold text-white">ID Formats</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Configure automated document prefix formats.</p>
              </div>

              {/* ID Prefix Formats */}
              <div className="p-5 bg-[#141416] border border-[#27272A] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Tag size={16} className="text-[#EA580C]" /> Document Prefix Formats
                  </h3>
                  <button
                    type="button"
                    onClick={handleResetPrefixes}
                    className="text-[11px] text-[#A1A1AA] hover:text-white flex items-center gap-1 bg-[#1F1F22] px-2.5 py-1 rounded border border-[#27272A]"
                  >
                    <RefreshCw size={12} /> Reset Default
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Sales Invoice Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.salesInvoicePrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, salesInvoicePrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Purchase Invoice Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.purchaseInvoicePrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, purchaseInvoicePrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Sales Quotation Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.salesQuotationPrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, salesQuotationPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Purchase Quotation Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.purchaseQuotationPrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, purchaseQuotationPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Delivery Order Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.deliveryOrderPrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, deliveryOrderPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Return Sales Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.returnSalesPrefix || 'RTS-'}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, returnSalesPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Return Purchase Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.returnPurchasePrefix || 'RTP-'}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, returnPurchasePrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Inventory Doc Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.inventoryDocPrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, inventoryDocPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Product Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.productPrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, productPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Cost / Expense Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.costPrefix}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, costPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Customer Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.customerPrefix || 'CSTMR-'}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, customerPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1AA] mb-1">Distributor Prefix</label>
                    <input 
                      type="text"
                      value={idPrefixes.distributorPrefix || 'DIST-'}
                      onChange={(e) => setIdPrefixes({ ...idPrefixes, distributorPrefix: e.target.value })}
                      className="w-full bg-[#18181A] border border-[#27272A] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EA580C] hover:bg-[#D97706] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>
          )}

          {/* 4. MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Workspace Members</h2>
                  <p className="text-xs text-[#A1A1AA] mt-1">Manage team access and role permissions.</p>
                </div>
                <button 
                  onClick={() => alert('Invite member dialog opened')}
                  className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#D97706] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Invite Member
                </button>
              </div>

              <div className="border border-[#27272A] rounded-xl overflow-hidden bg-[#141416]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1C1C1F] text-[#71717A] font-semibold border-b border-[#27272A]">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-[#18181A] transition-colors">
                        <td className="p-3 flex items-center gap-3">
                          <img src={m.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <div className="font-medium text-white">{m.name}</div>
                            <div className="text-[10px] text-[#71717A]">{m.email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#27272A] text-[#A1A1AA] text-[10px] font-mono">
                            {m.role}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button className="text-[#71717A] hover:text-red-400 p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. DEVELOPERS / API KEYS TAB */}
          {activeTab === 'developers' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-semibold text-white">Developer API Keys</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Manage API integrations, webhooks, and access tokens.</p>
              </div>

              <div className="p-4 bg-[#141416] border border-[#27272A] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Live Production API Key</h3>
                    <p className="text-[11px] text-[#71717A]">Created on Aug 2026 for server-side ERP sync</p>
                  </div>
                  <button className="px-2.5 py-1 bg-[#1F1F22] border border-[#27272A] text-[11px] text-white rounded hover:bg-[#27272A]">
                    Copy Key
                  </button>
                </div>
                <div className="font-mono text-xs bg-[#0F0F11] p-2.5 rounded border border-[#27272A] text-[#EA580C]">
                  aistudio_live_sec_9938472918472093847298
                </div>
              </div>
            </div>
          )}

          {/* 6. CONNECTIONS / INTEGRATIONS TAB */}
          {activeTab === 'connections' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-semibold text-white">Connections & Integrations</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Connect your ERP with external payment gateways and software.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Bank BCA API', desc: 'Auto reconciliation for wire transfers', status: 'Connected' },
                  { name: 'WhatsApp Business', desc: 'Send automated invoice notifications', status: 'Connected' },
                  { name: 'Google Workspace', desc: 'Sync Drive reports and Calendar deadlines', status: 'Disconnected' },
                  { name: 'QuickBooks Sync', desc: 'Export ledger to external accounting', status: 'Disconnected' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#141416] border border-[#27272A] rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold text-white">{item.name}</h3>
                      <p className="text-[11px] text-[#71717A] mt-1">{item.desc}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.status === 'Connected' ? 'bg-[#163820] text-[#4ADE80]' : 'bg-[#27272A] text-[#71717A]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OTHER TABS PLACEHOLDERS (SESSIONS, PLANS, BILLING, SECURITY, SUPPORT, MIGRATE) */}
          {['call_intelligence', 'sessions', 'plans', 'billing', 'security', 'support', 'migrate_crm'].includes(activeTab) && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-semibold text-white capitalize">{activeTab.replace('_', ' ')}</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Configure {activeTab.replace('_', ' ')} preferences for Methodic ERP.</p>
              </div>

              <div className="p-6 bg-[#141416] border border-[#27272A] rounded-xl text-center space-y-3">
                <Zap size={24} className="mx-auto text-[#EA580C]" />
                <h3 className="text-sm font-semibold text-white">Active & Configured</h3>
                <p className="text-xs text-[#71717A] max-w-md mx-auto">
                  This section is synced with your active enterprise workspace settings. All preferences are automatically persisted in real-time.
                </p>
              </div>
            </div>
          )}

        </div>

      </motion.div>

      {/* Crop Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCropImageSrc(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#141416] border border-[#27272A] rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
          >
            <div className="p-4 border-b border-[#27272A] flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Crop Company Logo</h3>
              <button onClick={() => setCropImageSrc(null)} className="text-[#A1A1AA] hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <div className="relative w-full h-[300px] bg-[#0A0A0A]">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={false}
              />
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] text-[#A1A1AA] uppercase font-semibold tracking-wider mb-2 block">Aspect Ratio</label>
                <div className="flex gap-2 mb-4">
                  {[
                    { label: '1:1', value: 1 },
                    { label: '3:2', value: 3 / 2 },
                    { label: '16:9', value: 16 / 9 },
                    { label: '21:9', value: 21 / 9 },
                  ].map(ratio => (
                    <button
                      key={ratio.label}
                      type="button"
                      onClick={() => setCropAspect(ratio.value)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
                        cropAspect === ratio.value 
                          ? 'bg-[#EA580C] text-white' 
                          : 'bg-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#3F3F46]'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
                <label className="text-[10px] text-[#A1A1AA] uppercase font-semibold tracking-wider mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#EA580C]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCropImageSrc(null)}
                  className="px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropImage}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#D97706] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Check size={14} /> Apply Crop
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

{/* REUSABLE SEGMENTED CONTROL COMPONENT ([ Off | Email | In-app | Both ]) */}
function SegmentedControl({ 
  value, 
  onChange 
}: { 
  value: SegmentOption; 
  onChange: (val: SegmentOption) => void;
}) {
  const options: SegmentOption[] = ['Off', 'Email', 'In-app', 'Both'];

  return (
    <div className="inline-flex p-0.5 bg-[#121214] border border-[#27272A] rounded-lg text-xs self-start sm:self-auto">
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#EA580C] text-white shadow-sm font-semibold'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
