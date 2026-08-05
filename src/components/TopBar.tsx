import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function TopBar({ searchQuery, setSearchQuery, activeTab, theme, onToggleTheme }: TopBarProps) {
  const [time, setTime] = useState(new Date());
  const [isPresent, setIsPresent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggle = () => {
    setIsPresent(!isPresent);
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = days[time.getDay()];
  const dateStr = `${time.getDate()} ${months[time.getMonth()]}`;
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="flex items-center gap-3 w-fit scale-90 origin-right">
      
      {/* Global Search Input */}
      {activeTab !== 'Product' && activeTab !== 'Inventory' && (
        <div className="relative mr-2 w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#909090]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`} 
            className="w-full bg-[#141517] border border-[#2A2A2A] rounded-lg pl-9 pr-14 py-2 text-[13px] text-white focus:outline-none focus:border-[#E87A5D] shadow-sm transition-colors placeholder-[#909090]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 bg-[#2A2A2A] text-[#909090] rounded text-[9px] font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#2A2A2A] text-[#909090] rounded text-[9px] font-mono">K</kbd>
          </div>
        </div>
      )}

      {/* Date */}
      <div className="flex flex-col justify-center leading-tight shrink-0">
        <span className="text-[12px] font-medium text-white">{dayName}</span>
        <span className="text-[11px] text-[#dbdbdb]">{dateStr}</span>
      </div>

      {/* Time */}
      <div className="text-[22px] font-light text-white tracking-tight leading-none px-1 shrink-0">
        {timeStr}
      </div>

      {/* Action Button */}
      <motion.button 
        onClick={handleToggle}
        initial={false}
        animate={{
          backgroundColor: isPresent ? '#EF4444' : '#EA580C',
        }}
        whileHover={{
          backgroundColor: isPresent ? '#DC2626' : '#D97706',
        }}
        className="text-white text-[13px] font-medium px-5 py-2 rounded-full cursor-pointer transition-all hover:shadow-lg hover:shadow-orange-500/20 shrink-0 flex items-center justify-center min-w-[90px] relative overflow-hidden active:scale-95"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isPresent ? 'check-out' : 'check-in'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {isPresent ? 'Check Out' : 'Check In'}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Theme Toggle Button */}
      <button 
        onClick={onToggleTheme}
        className="p-1.5 rounded-lg border border-[#2A2A2A] hover:bg-[#1A1A1A] text-[#909090] hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
      </button>

      {/* Divider */}
      <div className="w-[1px] h-6 bg-[#1C1C1C] shrink-0"></div>

      {/* User Status & Portal Link */}
      <div className="flex items-center gap-2 px-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full shadow-[0_0_4px_#4ADE8080]"></div>
          <span className="text-[12px] font-medium text-white">Moch Kall</span>
        </div>
      </div>

    </div>
  );
}
