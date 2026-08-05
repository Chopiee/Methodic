/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { Inbox } from './components/Inbox';
import { Purchase } from './components/Purchase';
import { Cost } from './components/Cost';
import { Product } from './components/Product';
import { Inventory } from './components/Inventory';
import { SmartPlanning } from './components/SmartPlanning';
import { Accounting } from './components/Accounting';
import { Partner } from './components/Partner';
import { Reports } from './components/Reports';
import { Discount } from './components/Discount';
import { Settings } from './components/Settings';
import { TopBar } from './components/TopBar';
import { Menu, X, BarChart3, Receipt, Inbox as InboxIcon, Sparkles, Flag, CreditCard, TrendingDown, Package, Warehouse, Calculator, Users, PieChart, Percent, Settings as SettingsIcon, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getHasUnsavedChanges, setHasUnsavedChanges } from './lib/unsaved';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [previousTab, setPreviousTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('methodic_theme');
    return (stored as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('methodic_theme', nextTheme);
  };

  useEffect(() => {
    const handleUnsavedChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setHasUnsaved(customEvent.detail);
    };
    window.addEventListener('unsaved-status-change', handleUnsavedChange);
    return () => window.removeEventListener('unsaved-status-change', handleUnsavedChange);
  }, []);

  const handleNavigateRequest = (targetTab: string) => {
    if (targetTab === activeTab) return;
    if (hasUnsaved || getHasUnsavedChanges()) {
      setPendingTab(targetTab);
      setShowDiscardModal(true);
    } else {
      if (activeTab !== 'Settings') {
        setPreviousTab(activeTab);
      }
      setActiveTab(targetTab);
      setSearchQuery('');
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      handleNavigateRequest(customEvent.detail);
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, [activeTab, hasUnsaved]);

  const displayTab = activeTab === 'Settings' ? previousTab : activeTab;

  const handleSaveAsDraft = () => {
    setHasUnsavedChanges(false);
    setHasUnsaved(false);
    setShowDiscardModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setSearchQuery('');
      setSidebarOpen(false);
      setPendingTab(null);
    }
  };

  const handleConfirmDiscard = () => {
    setHasUnsavedChanges(false);
    setHasUnsaved(false);
    setShowDiscardModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setSearchQuery('');
      setSidebarOpen(false);
      setPendingTab(null);
    }
  };

  const getBreadcrumbItems = (tab: string): string[] => {
    switch (tab) {
      case 'Dashboard':
        return ['Home', 'Dashboard'];
      case 'Inbox':
        return ['Home', 'Communications', 'Inbox'];
      case 'Smart Planning':
        return ['Home', 'Analytics', 'Smart Planning'];
      case 'Purchase':
        return ['Home', 'Transactions', 'Purchase'];
      case 'Sales':
        return ['Home', 'Transactions', 'Sales'];
      case 'Cost':
        return ['Home', 'Finance', 'Cost'];
      case 'Product':
        return ['Home', 'Products', 'Product Catalog'];
      case 'Inventory':
        return ['Home', 'Products', 'Warehouse'];
      case 'Accounting':
        return ['Home', 'Finance', 'Accounting'];
      case 'Partner':
        return ['Home', 'Contacts', 'Partner'];
      case 'Reports':
        return ['Home', 'Analytics', 'Reports'];
      case 'Discount':
        return ['Home', 'Promotions', 'Discount'];
      case 'Settings':
        return ['Home', 'System', 'Settings'];
      default:
        return ['Home', tab];
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden relative ${theme === 'light' ? 'light-theme bg-[#F8FAFC]' : 'bg-[#0A0A0A] text-white'}`}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#1C1C1C] bg-[#0E0E0E] absolute top-0 left-0 right-0 z-20">
        <span className="text-[14px] font-semibold text-white tracking-tight">Methodic</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#909090] hover:text-white">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar container */}
      <div className={`
        fixed inset-y-0 left-0 z-10 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <Sidebar activeItem={activeTab} onSelectItem={(item) => {
           handleNavigateRequest(item);
         }} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden md:pt-0 pt-[60px]">
        {/* Global Persistent Header */}
        <div className="flex items-center justify-between px-8 py-3 mt-1 border-b border-[#1C1C1C] shrink-0">
          <div className="flex items-center gap-2 text-[13px] font-sans">
            {getBreadcrumbItems(activeTab).map((item, index, array) => {
              const isLast = index === array.length - 1;
              return (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight size={13} className="text-[#6B6D76] shrink-0" />
                  )}
                  <span
                    onClick={() => {
                      if (item === 'Home') handleNavigateRequest('Dashboard');
                    }}
                    className={`transition-colors ${
                      isLast
                        ? 'text-white font-semibold'
                        : 'text-[#9A9CA5] hover:text-white font-normal cursor-pointer'
                    }`}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>

          <TopBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            activeTab={activeTab} 
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Main page content */}
          {displayTab === 'Dashboard' ? (
            <Home />
          ) : displayTab === 'Inbox' ? (
            <Inbox searchQuery={searchQuery} />
          ) : displayTab === 'Smart Planning' ? (
            <SmartPlanning />
          ) : displayTab === 'Purchase' ? (
            <Purchase key="purchase" searchQuery={searchQuery} />
          ) : displayTab === 'Sales' ? (
            <Purchase isSales={true} key="sales" searchQuery={searchQuery} />
          ) : displayTab === 'Cost' ? (
            <Cost />
          ) : displayTab === 'Product' ? (
            <Product searchQuery={searchQuery} />
          ) : displayTab === 'Inventory' ? (
            <Inventory searchQuery={searchQuery} />
          ) : displayTab === 'Accounting' ? (
            <Accounting />
          ) : displayTab === 'Partner' ? (
            <Partner searchQuery={searchQuery} />
          ) : displayTab === 'Reports' ? (
            <Reports />
          ) : displayTab === 'Discount' ? (
            <Discount searchQuery={searchQuery} />
          ) : (
            <div className="flex flex-col w-full h-full font-sans">
              <div className="p-8">
                <h1 className="text-2xl font-semibold mb-0">{displayTab}</h1>
                <p className="text-[#909090]">This is the {displayTab} page content.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal Popup Overlay */}
      <AnimatePresence>
        {activeTab === 'Settings' && (
          <Settings onClose={() => setActiveTab(previousTab || 'Dashboard')} />
        )}
      </AnimatePresence>

      {/* Discard Unsaved Changes Modal */}
      <AnimatePresence>
        {showDiscardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDiscardModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#18181A] border border-[#27272A] rounded-[24px] shadow-2xl w-full max-w-md relative z-10 p-6 overflow-hidden text-left font-sans"
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
                Anda memiliki perubahan atau draf yang belum disimpan. Berpindah menu akan menghapus semua perubahan ini. Tindakan ini tidak dapat dibatalkan.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#27272A] hover:bg-[#3F3F46] rounded-full transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#F43F5E] rounded-full transition-colors cursor-pointer shadow-lg shadow-[#E11D48]/20"
                >
                  Discard Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
