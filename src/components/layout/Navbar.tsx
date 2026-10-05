import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search,
  Bell,
  UserCheck,
  Smartphone,
  PlusCircle,
  Truck,
  Check,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onQuickBill: () => void;
  onQuickOrder: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onQuickBill,
  onQuickOrder,
  activeTab,
  setActiveTab
}) => {
  const { currentUser, allUsers, switchUser, logout, isMobileDriverView, setIsMobileDriverView } = useAuth();
  const { notifications, settings } = useDatabase();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabelMap: Record<string, string> = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    billing_staff: 'Billing Staff',
    staff: 'Staff',
    driver: 'Driver'
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-2xs no-print">
      {/* Zone 1: Single Text Element Wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#dashboard"
          onClick={e => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2 hover:text-amber-600 transition-colors"
        >
          <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            MT
          </span>
          <span className="font-extrabold uppercase tracking-tight">MARUTHI TRANSPORT</span>
        </a>
        <span className="hidden lg:inline text-xs text-slate-400 font-medium border-l border-slate-200 pl-3">
          Chennai Construction Supply & Logistics
        </span>
      </div>

      {/* Zone 2: Navigation & Search Affordance */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs transition-colors w-72 justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search orders, customers, bills...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-400 rounded border border-slate-200">
            /
          </kbd>
        </button>

        {currentUser.role !== 'driver' && (
          <button
            onClick={onQuickBill}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            FAST BILL / POS
          </button>
        )}
      </div>

      {/* Zone 3: Notification, Driver App Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Driver App Mode Toggle */}
        <button
          onClick={() => {
            const nextState = !isMobileDriverView;
            setIsMobileDriverView(nextState);
            if (nextState) {
              setActiveTab('driver_portal');
            } else {
              setActiveTab('dashboard');
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isMobileDriverView
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Switch to driver mobile cockpit interface"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Driver Mobile View</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-amber-600 font-semibold">{roleLabelMap[currentUser.role]}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 divide-y divide-slate-100">
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role (Testing & Access)
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Change role to test Super Admin, Manager, Billing, or Driver portal.
                </p>
              </div>

              <div className="py-1">
                {allUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setIsRoleDropdownOpen(false);
                      if (user.role === 'driver') {
                        setActiveTab('driver_portal');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs ${
                      user.id === currentUser.id ? 'bg-amber-50/60 font-bold text-amber-900' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {roleLabelMap[user.role]} · PIN: {user.pin}
                      </p>
                    </div>
                    {user.id === currentUser.id && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors"
                >
                  <span>Sign Out / Lock Desk</span>
                  <span className="text-[10px] font-mono text-red-400">Logout →</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
