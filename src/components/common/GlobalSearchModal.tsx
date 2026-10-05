import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Search, X, FileText, Truck, Users, Package, AlertCircle } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, id?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const { orders, invoices, customers, drivers, vehicles, materials } = useDatabase();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchedOrders = cleanQuery
    ? orders.filter(
        o =>
          o.order_no.toLowerCase().includes(cleanQuery) ||
          o.customer_name.toLowerCase().includes(cleanQuery) ||
          o.customer_phone.includes(cleanQuery) ||
          o.material_name.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedInvoices = cleanQuery
    ? invoices.filter(
        i =>
          i.invoice_no.toLowerCase().includes(cleanQuery) ||
          i.customer_name.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedCustomers = cleanQuery
    ? customers.filter(
        c =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.mobile.includes(cleanQuery) ||
          c.delivery_location.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedDrivers = cleanQuery
    ? drivers.filter(
        d =>
          d.name.toLowerCase().includes(cleanQuery) ||
          d.mobile.includes(cleanQuery) ||
          d.driver_no.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedVehicles = cleanQuery
    ? vehicles.filter(
        v =>
          v.vehicle_no.toLowerCase().includes(cleanQuery) ||
          v.type.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults =
    matchedOrders.length +
    matchedInvoices.length +
    matchedCustomers.length +
    matchedDrivers.length +
    matchedVehicles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by Order ID, Invoice #, Customer name, Phone, Driver, Vehicle..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
          {!query && (
            <div className="text-center py-10 text-xs text-slate-500">
              Type to instantly search orders, bills, customers, vehicles & drivers...
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6 text-slate-400" />
              <p>No matching records found for "{query}"</p>
            </div>
          )}

          {/* Orders */}
          {matchedOrders.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Orders ({matchedOrders.length})
              </p>
              <div className="space-y-1.5">
                {matchedOrders.slice(0, 4).map(o => (
                  <button
                    key={o.id}
                    onClick={() => {
                      onNavigate('orders', o.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{o.order_no} · {o.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {o.material_name} ({o.quantity} {o.unit}) · ₹{o.total_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      {o.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {matchedInvoices.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Invoices ({matchedInvoices.length})
              </p>
              <div className="space-y-1.5">
                {matchedInvoices.slice(0, 4).map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      onNavigate('billing', inv.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{inv.invoice_no} · {inv.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Grand Total: ₹{inv.grand_total.toLocaleString('en-IN')} · Pending: ₹{inv.pending_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      {inv.payment_status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {matchedCustomers.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Customers ({matchedCustomers.length})
              </p>
              <div className="space-y-1.5">
                {matchedCustomers.slice(0, 3).map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers', c.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {c.mobile} · {c.delivery_location}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {c.customer_type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Drivers & Vehicles */}
          {(matchedDrivers.length > 0 || matchedVehicles.length > 0) && (
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Drivers & Fleet
              </p>
              <div className="space-y-1.5">
                {matchedDrivers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      onNavigate('drivers', d.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-purple-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{d.name} ({d.driver_no})</p>
                        <p className="text-[11px] text-slate-500 font-mono">{d.mobile} · Rate: ₹{d.rate_per_load}/load</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                      {d.status}
                    </span>
                  </button>
                ))}
                {matchedVehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onNavigate('vehicles', v.id);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 font-mono">{v.vehicle_no}</p>
                        <p className="text-[11px] text-slate-500">{v.type} · Driver: {v.assigned_driver_name || 'Unassigned'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {v.loads_completed} Loads
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
