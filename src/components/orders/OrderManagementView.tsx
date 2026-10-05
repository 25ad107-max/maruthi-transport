import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus, Invoice, Load } from '../../types';
import { PrintModal, PrintDocumentType } from '../print/PrintModal';
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Printer,
  Truck,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';

interface OrderManagementViewProps {
  onOpenQuickOrder: () => void;
  targetOrderId?: string;
}

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({
  onOpenQuickOrder,
  targetOrderId
}) => {
  const {
    orders,
    loads,
    invoices,
    drivers,
    vehicles,
    updateOrderStatus,
    addAdditionalLoad,
    settings
  } = useDatabase();
  const { canAccess, currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Additional Load modal
  const [showAddLoadModal, setShowAddLoadModal] = useState(false);
  const [addLoadDriverId, setAddLoadDriverId] = useState('');
  const [addLoadVehicleId, setAddLoadVehicleId] = useState('');
  const [addLoadQuantity, setAddLoadQuantity] = useState(1);
  const [addLoadDate, setAddLoadDate] = useState(new Date().toISOString().slice(0, 10));

  // Print modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<PrintDocumentType>('invoice_a4');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | undefined>(undefined);
  const [activeLoad, setActiveLoad] = useState<Load | undefined>(undefined);

  // Auto-select target order if provided
  React.useEffect(() => {
    if (targetOrderId) {
      const found = orders.find(o => o.id === targetOrderId);
      if (found) setSelectedOrder(found);
    }
  }, [targetOrderId, orders]);

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.order_no.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q) ||
      o.material_name.toLowerCase().includes(q) ||
      o.delivery_location.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'Out for Delivery':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Out for Delivery</span>;
      case 'Driver Assigned':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Driver Assigned</span>;
      case 'Confirmed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Confirmed</span>;
      case 'Pending':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">Pending</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Cancelled</span>;
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const inv = invoices.find(i => i.order_id === order.id);
    if (inv) {
      setActiveInvoice(inv);
      setPrintDocType('invoice_a4');
      setPrintModalOpen(true);
    } else {
      alert('Invoice not found for this order.');
    }
  };

  const handlePrintChallan = (order: Order) => {
    const ld = loads.find(l => l.order_id === order.id);
    if (ld) {
      setActiveLoad(ld);
      setPrintDocType('delivery_challan');
      setPrintModalOpen(true);
    } else {
      alert('No load record linked to this order.');
    }
  };

  const handleSaveAdditionalLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !addLoadDriverId || !addLoadVehicleId) return;

    addAdditionalLoad(selectedOrder.id, {
      driver_id: addLoadDriverId,
      vehicle_id: addLoadVehicleId,
      quantity: addLoadQuantity,
      date: addLoadDate,
      notes: `Additional trip for ${selectedOrder.order_no}`
    });

    setShowAddLoadModal(false);
    alert('Additional load trip added successfully!');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage material dispatches, loads, trip allocations, and fulfillment statuses
          </p>
        </div>

        <button
          onClick={onOpenQuickOrder}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + NEW ORDER
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order no, customer, material, site..."
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['all', 'Pending', 'Confirmed', 'Driver Assigned', 'Out for Delivery', 'Delivered', 'Cancelled'] as const).map(
            st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All Orders' : st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Material & Qty</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Delivery Site</th>
                <th className="py-3 px-4">Assigned Fleet</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-sans">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{order.order_no}</p>
                      <p className="text-[11px] text-slate-500 font-sans">{order.date}</p>
                      {order.urgent_delivery && (
                        <span className="text-[10px] font-bold text-red-600 uppercase bg-red-50 px-1.5 py-0.2 rounded font-sans">
                          Urgent
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-900">{order.customer_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{order.customer_phone}</p>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <p className="font-medium text-slate-800">{order.material_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {order.quantity} {order.unit} @ ₹{order.rate}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <p className="font-bold text-slate-900 tabular-nums">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </p>
                      <span
                        className={`text-[10px] font-semibold font-sans px-1.5 py-0.2 rounded ${
                          order.payment_status === 'Paid'
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600 max-w-[180px] truncate">
                      {order.delivery_location}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-700">
                      <p className="font-medium">{order.assigned_driver_name || 'Unassigned'}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {order.assigned_vehicle_number || '-'}
                      </p>
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>

                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Print A4 Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintChallan(order)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Print Trip Challan"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS & LOAD PROGRESSION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-5 my-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-amber-600">Order Information</span>
                <h3 className="text-lg font-black text-slate-900">{selectedOrder.order_no}</h3>
                <p className="text-xs text-slate-500">Created {selectedOrder.date} by {selectedOrder.created_by}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedOrder.status)}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Updater */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Change Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {(['Pending', 'Confirmed', 'Driver Assigned', 'Out for Delivery', 'Delivered', 'Cancelled'] as OrderStatus[]).map(
                  st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, st, currentUser?.name || 'Staff');
                        setSelectedOrder({ ...selectedOrder, status: st });
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                        selectedOrder.status === st
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <p className="font-bold text-slate-700 uppercase">Customer & Destination</p>
                <p className="font-bold text-slate-900 text-sm">{selectedOrder.customer_name}</p>
                <p className="text-slate-600 font-mono">Mobile: {selectedOrder.customer_phone}</p>
                <p className="text-slate-600 mt-1">Site: {selectedOrder.delivery_location}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <p className="font-bold text-slate-700 uppercase">Financial Summary</p>
                <div className="flex justify-between font-mono">
                  <span>Material ({selectedOrder.quantity} {selectedOrder.unit}):</span>
                  <span>₹{selectedOrder.material_amount}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Delivery Charge:</span>
                  <span>+ ₹{selectedOrder.delivery_charge}</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Grand Total:</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>
                <p className="text-slate-500 text-[10px]">Payment: {selectedOrder.payment_method} ({selectedOrder.payment_status})</p>
              </div>
            </div>

            {/* Linked Loads for this order */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Linked Loads & Trips ({loads.filter(l => l.order_id === selectedOrder.id).length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setAddLoadDriverId(drivers[0]?.id || '');
                    setAddLoadVehicleId(vehicles[0]?.id || '');
                    setShowAddLoadModal(true);
                  }}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Additional Trip
                </button>
              </div>

              <div className="space-y-2">
                {loads.filter(l => l.order_id === selectedOrder.id).map(l => (
                  <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-mono">
                    <div>
                      <p className="font-bold text-slate-900">{l.load_no} · {l.driver_name}</p>
                      <p className="text-[11px] text-slate-600 font-sans">
                        Vehicle: {l.vehicle_number} · Rate: ₹{l.driver_rate}
                      </p>
                    </div>
                    <div className="text-right font-sans">
                      {getStatusBadge(l.status)}
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{l.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Print Invoice
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintChallan(selectedOrder)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Print Challan
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADDITIONAL LOAD MODAL */}
      {showAddLoadModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Add Extra Trip / Load</h3>
            <p className="text-xs text-slate-500">
              For partial order deliveries or multiple tipper runs on {selectedOrder.order_no}
            </p>

            <form onSubmit={handleSaveAdditionalLoad} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Driver *</label>
                <select
                  required
                  value={addLoadDriverId}
                  onChange={e => setAddLoadDriverId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.driver_no}) · ₹{d.rate_per_load}/load
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Vehicle *</label>
                <select
                  required
                  value={addLoadVehicleId}
                  onChange={e => setAddLoadVehicleId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_no} - {v.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity ({selectedOrder.unit})</label>
                  <input
                    type="number"
                    min="1"
                    value={addLoadQuantity}
                    onChange={e => setAddLoadQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trip Date</label>
                  <input
                    type="date"
                    value={addLoadDate}
                    onChange={e => setAddLoadDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddLoadModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MODAL */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType={printDocType}
        invoice={activeInvoice}
        load={activeLoad}
        settings={settings}
      />
    </div>
  );
};
