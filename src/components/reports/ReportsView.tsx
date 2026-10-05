import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  FileSpreadsheet,
  CheckCircle,
  Truck,
  Users,
  Layers,
  Car
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { orders, invoices, payments, loads, drivers, vehicles, materials, customers, expenses, settings } = useDatabase();

  const [activeReportTab, setActiveReportTab] = useState<
    'sales' | 'profit' | 'material' | 'driver' | 'vehicle' | 'outstanding' | 'expenses'
  >('sales');

  const [dateRange, setDateRange] = useState<'today' | 'this_month' | 'all'>('this_month');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('all');

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date()).replace(/\//g, '-');

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Filtered Invoices
  const filteredInvoices = invoices.filter(i => {
    if (selectedCustomerId !== 'all' && i.customer_id !== selectedCustomerId) return false;
    if (selectedDriverId !== 'all' && i.driver_id !== selectedDriverId) return false;

    if (dateRange === 'today') {
      return i.date === todayStr;
    } else if (dateRange === 'this_month') {
      const parts = i.date.split('-');
      return parts.length === 3 && `${parts[2]}-${parts[1]}` === currentMonthStr;
    }
    return true;
  });

  // Profit Calculation Per Order / Invoice
  // Revenue = Grand Total
  // Order Costs = Driver Cost (driver_earnings or default rate) + Estimated Material Cost + Fuel/other
  const profitReportData = orders.map(ord => {
    const mat = materials.find(m => m.id === ord.material_id);
    const costPerUnit = mat ? mat.cost_estimate : ord.rate * 0.7;
    const materialCost = costPerUnit * ord.quantity;

    const linkedLoad = loads.find(l => l.order_id === ord.id);
    const driverCost = linkedLoad ? (linkedLoad.status === 'Cancelled' ? 0 : linkedLoad.driver_earnings || linkedLoad.driver_rate) : 500;
    const fuelCostEst = ord.delivery_charge * 0.4; // approximate fuel portion

    const totalCosts = materialCost + driverCost + fuelCostEst;
    const revenue = ord.total_amount;
    const profit = revenue - totalCosts;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      order_no: ord.order_no,
      date: ord.date,
      customer_name: ord.customer_name,
      material_name: ord.material_name,
      quantity: `${ord.quantity} ${ord.unit}`,
      revenue,
      materialCost,
      driverCost,
      fuelCostEst,
      totalCosts,
      profit,
      margin,
      status: ord.status,
      driver_name: ord.assigned_driver_name || 'Unassigned',
      vehicle_number: ord.assigned_vehicle_number || '-'
    };
  });

  const totalRevenue = filteredInvoices.reduce((s, i) => s + i.grand_total, 0);
  const totalPaid = filteredInvoices.reduce((s, i) => s + i.paid_amount, 0);
  const totalPending = filteredInvoices.reduce((s, i) => s + i.pending_amount, 0);

  // Material Sales Breakdown
  const materialAggregates: Record<string, { qty: number; unit: string; revenue: number; orders: number }> = {};
  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!materialAggregates[item.material_name]) {
        materialAggregates[item.material_name] = { qty: 0, unit: item.unit, revenue: 0, orders: 0 };
      }
      materialAggregates[item.material_name].qty += item.quantity;
      materialAggregates[item.material_name].revenue += item.amount;
      materialAggregates[item.material_name].orders += 1;
    });
  });

  // Driver Loads & Earnings Breakdown
  const driverAggregates: Record<string, { completedLoads: number; earnings: number; vehicle: string }> = {};
  loads.forEach(l => {
    if (l.driver_id !== 'unassigned') {
      if (!driverAggregates[l.driver_name]) {
        driverAggregates[l.driver_name] = { completedLoads: 0, earnings: 0, vehicle: l.vehicle_number };
      }
      if (l.status === 'Delivered') {
        driverAggregates[l.driver_name].completedLoads += 1;
        driverAggregates[l.driver_name].earnings += l.driver_earnings;
      }
    }
  });

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeReportTab === 'profit') {
      csvContent += 'Order ID,Date,Customer,Material,Qty,Revenue (INR),Material Cost,Driver Cost,Total Cost,Profit (INR),Margin %\n';
      profitReportData.forEach(row => {
        csvContent += `"${row.order_no}","${row.date}","${row.customer_name}","${row.material_name}","${row.quantity}",${row.revenue},${row.materialCost},${row.driverCost},${row.totalCosts},${row.profit},${row.margin}%\n`;
      });
    } else {
      csvContent += 'Invoice No,Date,Customer,Grand Total (INR),Paid Amount (INR),Pending Amount (INR),Payment Status\n';
      filteredInvoices.forEach(inv => {
        csvContent += `"${inv.invoice_no}","${inv.date}","${inv.customer_name}",${inv.grand_total},${inv.paid_amount},${inv.pending_amount},"${inv.payment_status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maruthi_transport_${activeReportTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4 no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Business Reports & Profit Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive sales statements, material profitability, driver earnings, and customer dues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV / Excel
          </button>
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filter Tabs & Date Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs no-print">
        {/* Report Category Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'sales', label: 'Sales Report', icon: TrendingUp },
            { id: 'profit', label: 'Order Profit & Loss', icon: DollarSign },
            { id: 'material', label: 'Material Breakdown', icon: Layers },
            { id: 'driver', label: 'Driver Trips & Pay', icon: Truck },
            { id: 'outstanding', label: 'Outstanding Aging', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-slate-500 font-medium">Period:</span>
          {(['today', 'this_month', 'all'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                dateRange === d ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d === 'today' ? 'Today' : d === 'this_month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Period Revenue</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{filteredInvoices.length} Invoices Filtered</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Cash / UPI Inflow</p>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-1 tabular-nums">
            ₹{totalPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Realized Payments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Pending Receivables</p>
          <p className="text-2xl font-black font-mono text-red-600 mt-1 tabular-nums">
            ₹{totalPending.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-red-600 font-semibold mt-1">Credit Outstanding</p>
        </div>
      </div>

      {/* REPORT CONTENT BY ACTIVE TAB */}

      {/* TAB 1: SALES REPORT */}
      {activeReportTab === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">Invoices & Sales Transactions</h3>
            <span className="text-xs font-mono text-slate-500">{filteredInvoices.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Material / Service</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Delivery Charge</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.invoice_no}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.date}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">{inv.customer_name}</td>
                    <td className="py-3 px-4 font-sans text-slate-700">
                      {inv.items.map(i => `${i.material_name} (${i.quantity} ${i.unit})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right tabular-nums">+ ₹{inv.delivery_charge.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      ₹{inv.grand_total.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER PROFIT & LOSS REPORT */}
      {activeReportTab === 'profit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Order-Level Profit & Margin Breakdown</h3>
              <p className="text-xs text-slate-500 font-sans">
                Profit = Revenue - (Estimated Procurement Cost + Driver Fare + Fuel Share)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Material & Qty</th>
                  <th className="py-3 px-4 text-right">Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Procurement Cost</th>
                  <th className="py-3 px-4 text-right">Driver Fare</th>
                  <th className="py-3 px-4 text-right">Est. Net Profit</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {profitReportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{row.order_no}</p>
                      <p className="text-[11px] text-slate-500 font-sans">{row.date}</p>
                    </td>

                    <td className="py-3 px-4 font-sans font-medium text-slate-900">{row.customer_name}</td>

                    <td className="py-3 px-4 font-sans text-slate-700">
                      {row.material_name} ({row.quantity})
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      ₹{row.revenue.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                      - ₹{row.materialCost.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-600 tabular-nums">
                      - ₹{row.driverCost.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      <span className={row.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                        ₹{row.profit.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        row.margin >= 25 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MATERIAL SALES BREAKDOWN */}
      {activeReportTab === 'material' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">Material & Earth Service Sales Share</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Material / Service</th>
                  <th className="py-3 px-4 text-center">Orders Count</th>
                  <th className="py-3 px-4 text-right">Total Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(materialAggregates).map(([matName, stats], idx) => {
                  const share = totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">{matName}</td>
                      <td className="py-3 px-4 text-center">{stats.orders}</td>
                      <td className="py-3 px-4 text-right">{stats.qty} {stats.unit}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        ₹{stats.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DRIVER TRIPS & EARNINGS */}
      {activeReportTab === 'driver' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">Driver Trip Summary & Payout Accruals</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4 text-center">Delivered Trips</th>
                  <th className="py-3 px-4 text-right">Accrued Load Earnings (₹)</th>
                  <th className="py-3 px-4 text-right">Avg Earnings per Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(driverAggregates).map(([dName, stats], idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">{dName}</td>
                    <td className="py-3 px-4 text-slate-600">{stats.vehicle || '-'}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{stats.completedLoads} Loads</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                      ₹{stats.earnings.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      ₹{stats.completedLoads > 0 ? Math.round(stats.earnings / stats.completedLoads) : 500}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: OUTSTANDING AGING */}
      {activeReportTab === 'outstanding' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">Customer Outstanding Aging & Pending Bills</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Invoice Total (₹)</th>
                  <th className="py-3 px-4 text-right">Pending Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoices.filter(i => i.pending_amount > 0).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.invoice_no}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.date}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{inv.customer_name}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.customer_phone}</td>
                    <td className="py-3 px-4 text-right tabular-nums">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-red-600 tabular-nums">
                      ₹{inv.pending_amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
