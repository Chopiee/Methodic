import React from 'react';
import { 
  PanelLeft, 
  BarChart3, 
  Inbox, 
  FileStack, 
  Sparkles, 
  LayoutDashboard, 
  Flag, 
  CreditCard, 
  Aperture, 
  CheckCircle2, 
  PieChart, 
  Folder, 
  LayoutTemplate, 
  FileText, 
  LifeBuoy, 
  Ticket, 
  Receipt,
  Package,
  TrendingDown,
  Warehouse,
  Calculator,
  Users,
  Percent,
  Settings as SettingsIcon
} from 'lucide-react';
import { getStoredInvoices, isInvoiceOverdueAndUnpaid } from '../lib/state';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  badge?: string;
  active?: boolean;
  alert?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, badge, active = false, alert = false, collapsed = false, onClick }: NavItemProps) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-2.5'} py-[6px] mx-2 rounded-md cursor-pointer transition-colors relative ${active ? 'bg-[#2A2B2A] text-white font-medium' : 'hover:bg-[#1A1A1A] text-[#909090] hover:text-white'} ${collapsed ? 'h-9' : ''}`}
      title={collapsed ? label : undefined}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
        <Icon size={15} className={active ? 'text-white' : 'text-[#909090]'} strokeWidth={2} />
        {!collapsed && <span className="text-[13px]">{label}</span>}
      </div>
      {!collapsed && (
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[11px] font-semibold text-[#EA580C] bg-[#EA580C]/15 px-2 py-0.5 rounded-full border border-[#EA580C]/20 leading-none">
              {badge}
            </span>
          )}
          {alert && <span className="text-xs font-bold text-[#909090]">!</span>}
        </div>
      )}
      {collapsed && badge && (
        <span className="absolute top-1 right-1 min-w-[15px] h-[15px] text-[9px] font-bold text-white bg-[#EA580C] rounded-full flex items-center justify-center px-0.5">
          {badge}
        </span>
      )}
    </div>
  );
};

interface SidebarProps {
  activeItem: string;
  onSelectItem: (item: string) => void;
}

export function Sidebar({ activeItem, onSelectItem }: SidebarProps) {
  const [width, setWidth] = React.useState(240);
  const [isResizing, setIsResizing] = React.useState(false);
  const [purchaseOverdueCount, setPurchaseOverdueCount] = React.useState(0);
  const [salesOverdueCount, setSalesOverdueCount] = React.useState(0);

  const calculateOverdueCounts = React.useCallback(() => {
    const invoices = getStoredInvoices();
    let pCount = 0;
    let sCount = 0;

    invoices.forEach((inv) => {
      if (isInvoiceOverdueAndUnpaid(inv)) {
        if (inv.isSales) {
          sCount++;
        } else {
          pCount++;
        }
      }
    });

    setPurchaseOverdueCount(pCount);
    setSalesOverdueCount(sCount);
  }, []);

  React.useEffect(() => {
    calculateOverdueCounts();
    window.addEventListener('invoices-updated', calculateOverdueCounts);
    window.addEventListener('storage', calculateOverdueCounts);
    return () => {
      window.removeEventListener('invoices-updated', calculateOverdueCounts);
      window.removeEventListener('storage', calculateOverdueCounts);
    };
  }, [calculateOverdueCounts]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 120) {
        newWidth = 64; // Snap to collapsed
      } else if (newWidth > 400) {
        newWidth = 400; // Max width
      }
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const collapsed = width === 64;

  const toggleCollapse = () => {
    setWidth(collapsed ? 240 : 64);
  };

  return (
    <div 
      className={`h-screen bg-[#0E0E0E] flex flex-col font-sans border-r border-[#1C1C1C] overflow-y-auto hide-scrollbar relative shrink-0 ${!isResizing ? 'transition-[width] duration-300 ease-in-out' : ''}`}
      style={{ width: `${width}px` }}
    >
      {/* Drag Handle */}
      <div 
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#E87A5D]/20 z-10"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />

      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-4'} py-4 mt-1 mb-8 transition-all`}>
        {!collapsed && <span className="text-[14px] font-semibold text-white tracking-tight overflow-hidden whitespace-nowrap">Methodic</span>}
        <button 
          onClick={toggleCollapse}
          className="text-[#909090] hover:text-white border border-[#2A2A2A] rounded-[4px] p-0.5 z-20 cursor-pointer bg-[#0E0E0E]"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <PanelLeft size={14} />
        </button>
      </div>

      {/* Group 1 */}
      <div className="flex flex-col gap-[2px] mb-6 overflow-hidden">
        <NavItem icon={BarChart3} label="Dashboard" active={activeItem === 'Dashboard'} collapsed={collapsed} onClick={() => onSelectItem('Dashboard')} />
        <NavItem icon={Inbox} label="Inbox" active={activeItem === 'Inbox'} collapsed={collapsed} onClick={() => onSelectItem('Inbox')} />
        <NavItem icon={Sparkles} label="Smart Planning" active={activeItem === 'Smart Planning'} collapsed={collapsed} onClick={() => onSelectItem('Smart Planning')} />
      </div>

      <div className="flex flex-col gap-[2px] mb-6 overflow-hidden">
        <NavItem 
          icon={Flag} 
          label="Purchase" 
          badge={purchaseOverdueCount > 0 ? String(purchaseOverdueCount) : undefined} 
          active={activeItem === 'Purchase'} 
          collapsed={collapsed} 
          onClick={() => onSelectItem('Purchase')} 
        />
        <NavItem 
          icon={CreditCard} 
          label="Sales" 
          badge={salesOverdueCount > 0 ? String(salesOverdueCount) : undefined} 
          active={activeItem === 'Sales'} 
          collapsed={collapsed} 
          onClick={() => onSelectItem('Sales')} 
        />
        <NavItem icon={TrendingDown} label="Cost" active={activeItem === 'Cost'} collapsed={collapsed} onClick={() => onSelectItem('Cost')} />
        <NavItem icon={Package} label="Product" active={activeItem === 'Product'} collapsed={collapsed} onClick={() => onSelectItem('Product')} />
        <NavItem icon={Warehouse} label="Warehouse" active={activeItem === 'Inventory'} collapsed={collapsed} onClick={() => onSelectItem('Inventory')} />
      </div>

      {/* Group 3: Teams */}
      <div className="border-t border-[#1C1C1C] mx-3 mb-3 shrink-0"></div>

      <div className="flex flex-col gap-[2px] mb-auto overflow-hidden">
        <NavItem icon={PieChart} label="Reports" active={activeItem === 'Reports'} collapsed={collapsed} onClick={() => onSelectItem('Reports')} />
        <NavItem icon={Calculator} label="Accounting" active={activeItem === 'Accounting'} collapsed={collapsed} onClick={() => onSelectItem('Accounting')} />
        <NavItem icon={Users} label="Partner" active={activeItem === 'Partner'} collapsed={collapsed} onClick={() => onSelectItem('Partner')} />
        <NavItem icon={FileText} label="Documents" active={activeItem === 'Documents'} collapsed={collapsed} onClick={() => onSelectItem('Documents')} />
        <NavItem icon={Percent} label="Discount" active={activeItem === 'Discount'} collapsed={collapsed} onClick={() => onSelectItem('Discount')} />
      </div>

      {/* Bottom Group */}
      <div className="flex flex-col gap-[2px] mt-8 pb-4 overflow-hidden">
        <NavItem icon={SettingsIcon} label="Settings" active={activeItem === 'Settings'} collapsed={collapsed} onClick={() => onSelectItem('Settings')} />
      </div>
    </div>
  );
}
