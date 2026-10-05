import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { FastBillingView } from './components/pos/FastBillingView';
import { OrderManagementView } from './components/orders/OrderManagementView';
import { LoadManagementView } from './components/loads/LoadManagementView';
import { CustomerManagementView } from './components/customers/CustomerManagementView';
import { MaterialManagementView } from './components/materials/MaterialManagementView';
import { DriverManagementView } from './components/drivers/DriverManagementView';
import { SalaryCalculationView } from './components/salary/SalaryCalculationView';
import { VehicleManagementView } from './components/vehicles/VehicleManagementView';
import { PaymentsView } from './components/payments/PaymentsView';
import { ExpenseManagementView } from './components/expenses/ExpenseManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { DriverAppView } from './components/driver/DriverAppView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { LoginView } from './components/auth/LoginView';
import { Menu, X, Smartphone, Truck, ShieldCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, isAuthenticated, canAccess, isMobileDriverView, setIsMobileDriverView } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Target item for navigation
  const [targetId, setTargetId] = useState<string | undefined>(undefined);

  // If unauthenticated or no current user, display the Login screen
  if (!isAuthenticated || !currentUser) {
    return <LoginView />;
  }

  // If driver user, default to driver_portal
  useEffect(() => {
    if (currentUser?.role === 'driver') {
      setActiveTab('driver_portal');
      setIsMobileDriverView(true);
    }
  }, [currentUser]);

  // Global keyboard shortcut '/' for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const handleNavigateWithTarget = (tab: string, id?: string) => {
    setActiveTab(tab);
    setTargetId(id);
    setMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    if (currentUser?.role === 'driver' || isMobileDriverView || activeTab === 'driver_portal') {
      return <DriverAppView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={handleNavigateWithTarget}
            onOpenQuickBill={() => setActiveTab('billing')}
            onOpenQuickOrder={() => setActiveTab('orders')}
            onOpenAddCustomer={() => setActiveTab('customers')}
            onOpenAddDriver={() => setActiveTab('drivers')}
            onOpenAddLoad={() => setActiveTab('loads')}
            onOpenRecordPayment={() => setActiveTab('payments')}
          />
        );
      case 'billing':
        return <FastBillingView />;
      case 'orders':
        return (
          <OrderManagementView
            onOpenQuickOrder={() => setActiveTab('billing')}
            targetOrderId={targetId}
          />
        );
      case 'loads':
        return <LoadManagementView targetLoadId={targetId} />;
      case 'customers':
        return (
          <CustomerManagementView
            onOpenQuickBillForCustomer={() => setActiveTab('billing')}
            targetCustomerId={targetId}
          />
        );
      case 'materials':
        return <MaterialManagementView />;
      case 'drivers':
        return (
          <DriverManagementView
            onOpenSalarySlip={() => setActiveTab('salary')}
            targetDriverId={targetId}
          />
        );
      case 'salary':
        return <SalaryCalculationView />;
      case 'vehicles':
        return <VehicleManagementView />;
      case 'payments':
        return <PaymentsView targetInvoiceId={targetId} />;
      case 'expenses':
        return <ExpenseManagementView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigate={handleNavigateWithTarget}
            onOpenQuickBill={() => setActiveTab('billing')}
            onOpenQuickOrder={() => setActiveTab('orders')}
            onOpenAddCustomer={() => setActiveTab('customers')}
            onOpenAddDriver={() => setActiveTab('drivers')}
            onOpenAddLoad={() => setActiveTab('loads')}
            onOpenRecordPayment={() => setActiveTab('payments')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onQuickBill={() => setActiveTab('billing')}
        onQuickOrder={() => setActiveTab('orders')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Mobile Top Bar Toggles */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-900 text-white border-b border-slate-800 no-print">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-xs font-bold text-slate-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span>Menu</span>
        </button>

        <span className="text-xs font-bold font-mono text-amber-400 capitalize">
          {activeTab.replace('_', ' ')}
        </span>

        <button
          onClick={() => setIsMobileDriverView(!isMobileDriverView)}
          className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-300 font-semibold flex items-center gap-1"
        >
          <Smartphone className="w-3.5 h-3.5" />
          {isMobileDriverView ? 'Office View' : 'Driver App'}
        </button>
      </div>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobileDriverView && currentUser.role !== 'driver' && (
          <div className="hidden md:block">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenQuickBill={() => setActiveTab('billing')}
              onOpenQuickOrder={() => setActiveTab('orders')}
              onOpenAddCustomer={() => setActiveTab('customers')}
              onOpenAddDriver={() => setActiveTab('drivers')}
              onOpenAddLoad={() => setActiveTab('loads')}
              onOpenRecordPayment={() => setActiveTab('payments')}
            />
          </div>
        )}

        {/* Mobile Slide-over Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex">
            <div className="w-72 bg-slate-900 h-full flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white">
                <span className="font-bold text-sm">Navigation Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={tab => {
                    setActiveTab(tab);
                    setMobileMenuOpen(false);
                  }}
                  onOpenQuickBill={() => {
                    setActiveTab('billing');
                    setMobileMenuOpen(false);
                  }}
                  onOpenQuickOrder={() => {
                    setActiveTab('orders');
                    setMobileMenuOpen(false);
                  }}
                  onOpenAddCustomer={() => {
                    setActiveTab('customers');
                    setMobileMenuOpen(false);
                  }}
                  onOpenAddDriver={() => {
                    setActiveTab('drivers');
                    setMobileMenuOpen(false);
                  }}
                  onOpenAddLoad={() => {
                    setActiveTab('loads');
                    setMobileMenuOpen(false);
                  }}
                  onOpenRecordPayment={() => {
                    setActiveTab('payments');
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-slate-50">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigateWithTarget}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigateWithTarget}
      />
    </div>
  );
};

export default function App() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </DatabaseProvider>
  );
}
