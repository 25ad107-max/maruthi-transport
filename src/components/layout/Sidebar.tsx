import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  Layers,
  Truck,
  FileSpreadsheet,
  Car,
  CreditCard,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  Smartphone,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickBill: () => void;
  onOpenQuickOrder: () => void;
  onOpenAddCustomer: () => void;
  onOpenAddDriver: () => void;
  onOpenAddLoad: () => void;
  onOpenRecordPayment: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickBill,
  onOpenQuickOrder,
  onOpenAddCustomer,
  onOpenAddDriver,
  onOpenAddLoad,
  onOpenRecordPayment
}) => {
  const { canAccess, currentUser } = useAuth();
  const { orders, loads, vehicles, invoices } = useDatabase();

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;
  const activeLoadsCount = loads.filter(l => l.status === 'Driver Assigned' || l.status === 'Out for Delivery').length;
  const pendingPaymentsCount = invoices.filter(i => i.payment_status === 'Pending' || i.payment_status === 'Partially Paid').length;

  // Check vehicle document expiry alerts (within 30 days)
  const expiringVehiclesCount = vehicles.filter(v => {
    const checkDate = (dStr: string) => {
      const target = new Date(dStr).getTime();
      const now = new Date().getTime();
      const diffDays = (target - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    };
    return (
      checkDate(v.insurance_expiry) ||
      checkDate(v.fitness_expiry) ||
      checkDate(v.permit_expiry) ||
      checkDate(v.pollution_expiry)
    );
  }).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null, permission: 'dashboard' },
    { id: 'billing', label: 'Billing / POS', icon: Receipt, badge: 'FAST', badgeColor: 'bg-amber-500 text-white', permission: 'billing' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null, badgeColor: 'bg-blue-100 text-blue-700', permission: 'orders' },
    { id: 'loads', label: 'Loads & Trips', icon: Truck, badge: activeLoadsCount > 0 ? activeLoadsCount : null, badgeColor: 'bg-amber-100 text-amber-800', permission: 'loads' },
    { id: 'customers', label: 'Customers', icon: Users, badge: null, permission: 'customers' },
    { id: 'materials', label: 'Materials & Services', icon: Layers, badge: null, permission: 'materials' },
    { id: 'drivers', label: 'Drivers & Advances', icon: Users, badge: null, permission: 'drivers' },
    { id: 'salary', label: 'Driver Salary', icon: DollarSign, badge: null, permission: 'salary' },
    { id: 'vehicles', label: 'Vehicles & Fleet', icon: Car, badge: expiringVehiclesCount > 0 ? expiringVehiclesCount : null, badgeColor: 'bg-red-100 text-red-700', permission: 'vehicles' },
    { id: 'payments', label: 'Payments & Due', icon: CreditCard, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : null, badgeColor: 'bg-emerald-100 text-emerald-800', permission: 'payments' },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, badge: null, permission: 'expenses' },
    { id: 'reports', label: 'Reports & Profit', icon: TrendingUp, badge: null, permission: 'reports' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null, permission: 'settings' }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-57px)] border-r border-slate-800 no-print">
      {/* Primary Action Buttons */}
      <div className="p-4 space-y-2 border-b border-slate-800">
        <button
          onClick={onOpenQuickBill}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg transition-colors shadow-xs"
        >
          <Receipt className="w-4 h-4" />
          <span>+ NEW BILL / POS</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={onOpenQuickOrder}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[11px] font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            New Order
          </button>
          <button
            onClick={onOpenAddLoad}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[11px] font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Add Load
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[11px] font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Customer
          </button>
          <button
            onClick={onOpenRecordPayment}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[11px] font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Payment
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {currentUser?.role === 'driver' && (
          <button
            onClick={() => setActiveTab('driver_portal')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'driver_portal'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4" />
              <span>Driver Cockpit Portal</span>
            </span>
            <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300">
              Active
            </span>
          </button>
        )}

        {navItems.map(item => {
          if (!canAccess(item.permission)) return null;
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left ${
                isActive
                  ? 'bg-slate-800 text-white font-bold border-l-3 border-amber-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </span>

              {item.badge !== null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Business Footprint */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400">
        <p className="font-bold text-slate-200 uppercase tracking-tight">Maruthi Transport</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Poonamallee High Rd, Koyambedu</p>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
          <span>₹ INR Billing</span>
          <span>·</span>
          <span>Asia/Kolkata</span>
        </div>
      </div>
    </aside>
  );
};
