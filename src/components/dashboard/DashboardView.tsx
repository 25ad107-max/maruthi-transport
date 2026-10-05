import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Truck,
  CreditCard,
  Users,
  Car,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string, id?: string) => void;
  onOpenQuickBill: () => void;
  onOpenQuickOrder: () => void;
  onOpenAddCustomer: () => void;
  onOpenAddDriver: () => void;
  onOpenAddLoad: () => void;
  onOpenRecordPayment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickBill,
  onOpenQuickOrder,
  onOpenAddCustomer,
  onOpenAddDriver,
  onOpenAddLoad,
  onOpenRecordPayment
}) => {
  const {
    orders,
    loads,
    invoices,
    customers,
    drivers,
    vehicles,
    expenses,
    salaryRecords,
    driverAdvances,
    settings
  } = useDatabase();

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date()).replace(/\//g, '-');

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // 1. Today's Metrics
  const todaysOrders = orders.filter(o => o.date === todayStr);
  const todaysRevenue = invoices
    .filter(i => i.date === todayStr)
    .reduce((sum, i) => sum + i.grand_total, 0);

  // 2. Pending Orders
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed');

  // 3. Completed Deliveries
  const completedDeliveries = loads.filter(l => l.status === 'Delivered').length;

  // 4. Pending Payments (Total Customer Due)
  const pendingPayments = invoices.reduce((sum, i) => sum + i.pending_amount, 0);

  // 5. Total Customers
  const totalCustomers = customers.filter(c => c.is_active).length;

  // 6. Active Drivers & Vehicles
  const activeDrivers = drivers.filter(d => d.status === 'Active').length;
  const activeVehicles = vehicles.filter(v => v.status === 'Assigned' || v.status === 'Available').length;

  // 7. Monthly Financials
  const monthlyInvoices = invoices.filter(i => {
    const parts = i.date.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}` === currentMonthStr;
    return false;
  });
  const monthlyRevenue = monthlyInvoices.reduce((sum, i) => sum + i.grand_total, 0);

  const monthlyExpensesList = expenses.filter(e => {
    const parts = e.date.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}` === currentMonthStr;
    return false;
  });
  const monthlyExpenses = monthlyExpensesList.reduce((sum, e) => sum + e.amount, 0);

  // Driver salary pending estimation
  let pendingDriverSalary = 0;
  drivers.forEach(d => {
    const deliveredLoads = loads.filter(l => {
      if (l.driver_id !== d.id || l.status !== 'Delivered') return false;
      const parts = l.date.split('-');
      return parts.length === 3 && `${parts[2]}-${parts[1]}` === currentMonthStr;
    });
    const loadEarnings = deliveredLoads.reduce((sum, l) => sum + (l.driver_earnings || l.driver_rate), 0);
    const advances = driverAdvances
      .filter(a => a.driver_id === d.id && a.month === currentMonthStr)
      .reduce((sum, a) => sum + a.amount, 0);
    pendingDriverSalary += Math.max(0, loadEarnings - advances);
  });

  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  // Urgent deliveries queue
  const urgentOrders = orders.filter(
    o => o.urgent_delivery && o.status !== 'Delivered' && o.status !== 'Cancelled'
  );

  // Document expiry alerts
  const expiringVehicles = vehicles.filter(v => {
    const checkDays = (d: string) => {
      const diff = (new Date(d).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    };
    return (
      checkDays(v.insurance_expiry) ||
      checkDays(v.fitness_expiry) ||
      checkDays(v.permit_expiry) ||
      checkDays(v.pollution_expiry)
    );
  });

  // Material Sales Breakdown Data
  const materialSalesMap: Record<string, number> = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      materialSalesMap[item.material_name] = (materialSalesMap[item.material_name] || 0) + item.amount;
    });
  });
  const topMaterials = Object.entries(materialSalesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxMatAmount = Math.max(...topMaterials.map(m => m[1]), 1);

  // Driver Loads Distribution Data
  const driverLoadsMap: Record<string, number> = {};
  loads.forEach(l => {
    if (l.status === 'Delivered') {
      driverLoadsMap[l.driver_name] = (driverLoadsMap[l.driver_name] || 0) + 1;
    }
  });
  const driverLoadsList = Object.entries(driverLoadsMap).sort((a, b) => b[1] - a[1]);
  const maxDriverLoads = Math.max(...driverLoadsList.map(d => d[1]), 1);

  // Expense Categories Breakdown
  const expenseCatMap: Record<string, number> = {};
  expenses.forEach(e => {
    expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
  });
  const totalExp = Object.values(expenseCatMap).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {settings.business_name} · Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chennai Corporation & Suburban Supply Dispatch Dashboard · Date: {todayStr}
          </p>
        </div>

        {/* Action Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenQuickBill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors"
          >
            <Receipt className="w-4 h-4" />
            + NEW BILL / POS
          </button>
          <button
            onClick={onOpenQuickOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            + New Order
          </button>
          <button
            onClick={onOpenAddLoad}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            + Add Load
          </button>
          <button
            onClick={onOpenRecordPayment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            + Record Payment
          </button>
        </div>
      </div>

      {/* 12 PRIMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Orders</span>
            <ShoppingCart className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {todaysOrders.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Pending: {pendingOrders.length}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Revenue</span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              ₹{todaysRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">Today</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed Deliveries</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {completedDeliveries}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Total Trips</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Payments</span>
            <CreditCard className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-red-600 font-mono tabular-nums">
              ₹{pendingPayments.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-red-600 font-semibold">Due from Clients</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monthly Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              ₹{monthlyRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">This Month</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monthly Expenses</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              ₹{monthlyExpenses.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Fuel & Ops</span>
          </div>
        </div>

        {/* Metric 7 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estimated Profit</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-black font-mono tabular-nums ${monthlyProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              ₹{monthlyProfit.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">Net P&L</span>
          </div>
        </div>

        {/* Metric 8 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Driver Salary Pending</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              ₹{pendingDriverSalary.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-purple-600 font-semibold">Accrued Trips</span>
          </div>
        </div>
      </div>

      {/* OPERATIONAL ALERTS: Urgent Deliveries & Vehicle Expiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Delivery Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <h3 className="font-bold text-sm text-slate-900">Priority & Urgent Deliveries</h3>
            </div>
            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              {urgentOrders.length} Active
            </span>
          </div>

          <div className="space-y-2">
            {urgentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No pending urgent deliveries</p>
            ) : (
              urgentOrders.map(ord => (
                <div
                  key={ord.id}
                  onClick={() => onNavigate('orders', ord.id)}
                  className="p-3 bg-red-50/40 hover:bg-red-50 border border-red-200 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{ord.order_no}</span>
                      <span className="text-[11px] font-semibold text-slate-700">· {ord.customer_name}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {ord.material_name} ({ord.quantity} {ord.unit}) · {ord.delivery_location}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-red-700 border border-red-200">
                      {ord.status}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      {ord.assigned_driver_name || 'Driver unassigned'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fleet Document Expiry Reminders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Vehicle Document Expiry Reminders</h3>
            </div>
            <span className="text-xs text-slate-500">Expiring in 30 Days</span>
          </div>

          <div className="space-y-2">
            {expiringVehicles.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">All vehicle documents up to date</p>
            ) : (
              expiringVehicles.map(veh => (
                <div
                  key={veh.id}
                  onClick={() => onNavigate('vehicles', veh.id)}
                  className="p-3 bg-amber-50/40 hover:bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-900">{veh.vehicle_no}</p>
                    <p className="text-xs text-slate-600">{veh.type} · Driver: {veh.assigned_driver_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      FC Due: {veh.fitness_expiry}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* VISUAL ANALYTICAL CHARTS (SVG) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: Material Sales Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Material Sales Share</h3>
            <span className="text-xs text-slate-400 font-mono">Revenue (₹)</span>
          </div>

          <div className="space-y-3">
            {topMaterials.map(([name, amount], idx) => {
              const pct = Math.round((amount / maxMatAmount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[180px]">{name}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      ₹{amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Driver Loads Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Driver Completed Loads</h3>
            <span className="text-xs text-slate-400 font-mono">Delivered Trips</span>
          </div>

          <div className="space-y-3">
            {driverLoadsList.map(([driverName, trips], idx) => {
              const pct = Math.round((trips / maxDriverLoads) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{driverName}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {trips} loads
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: Expense Category Split */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Expenses Breakdown</h3>
            <span className="text-xs text-slate-400 font-mono">Category %</span>
          </div>

          <div className="space-y-3">
            {Object.entries(expenseCatMap).map(([category, amt], idx) => {
              const pct = Math.round((amt / totalExp) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{category}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      ₹{amt.toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
