import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Load, OrderStatus } from '../../types';
import { PrintModal } from '../print/PrintModal';
import {
  Truck,
  Search,
  Filter,
  Printer,
  UserCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface LoadManagementViewProps {
  targetLoadId?: string;
}

export const LoadManagementView: React.FC<LoadManagementViewProps> = ({ targetLoadId }) => {
  const { loads, drivers, vehicles, updateLoadStatus, reassignLoad, settings } = useDatabase();
  const { canModifyRates, currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');

  // Reassign Modal
  const [reassignLoadObj, setReassignLoadObj] = useState<Load | null>(null);
  const [newDriverId, setNewDriverId] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [customRate, setCustomRate] = useState(500);

  // Print modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedLoadForPrint, setSelectedLoadForPrint] = useState<Load | undefined>(undefined);

  const filteredLoads = loads.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.load_no.toLowerCase().includes(q) ||
      l.order_no.toLowerCase().includes(q) ||
      l.customer_name.toLowerCase().includes(q) ||
      l.driver_name.toLowerCase().includes(q) ||
      l.vehicle_number.toLowerCase().includes(q) ||
      l.delivery_location.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesDriver = driverFilter === 'all' || l.driver_id === driverFilter;
    return matchesSearch && matchesStatus && matchesDriver;
  });

  const handleOpenReassign = (load: Load) => {
    setReassignLoadObj(load);
    setNewDriverId(load.driver_id !== 'unassigned' ? load.driver_id : drivers[0]?.id || '');
    setNewVehicleId(load.vehicle_id !== 'unassigned' ? load.vehicle_id : vehicles[0]?.id || '');
    setCustomRate(load.driver_rate);
  };

  const handleConfirmReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignLoadObj || !newDriverId || !newVehicleId) return;

    reassignLoad(reassignLoadObj.id, newDriverId, newVehicleId, customRate);
    setReassignLoadObj(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Driver Loads & Trip Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every dispatch links Order, Customer, Material, Driver, Vehicle, and auto-calculates salary earnings upon completion
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search load #, order, driver, vehicle..."
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {/* Driver filter */}
          <select
            value={driverFilter}
            onChange={e => setDriverFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700 font-medium"
          >
            <option value="all">All Drivers</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status buttons */}
          {(['all', 'Driver Assigned', 'Out for Delivery', 'Delivered', 'Cancelled'] as const).map(
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
                {st === 'all' ? 'All Status' : st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Loads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Load / Trip No</th>
                <th className="py-3 px-4">Order & Customer</th>
                <th className="py-3 px-4">Material & Qty</th>
                <th className="py-3 px-4">Driver & Vehicle</th>
                <th className="py-3 px-4 text-right">Trip Fare (Salary)</th>
                <th className="py-3 px-4">Delivery Site</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLoads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-sans">
                    No loads found.
                  </td>
                </tr>
              ) : (
                filteredLoads.map(load => (
                  <tr key={load.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{load.load_no}</p>
                      <p className="text-[11px] text-slate-500 font-sans">{load.date}</p>
                      {load.urgent && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                          Priority
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-900">{load.customer_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{load.order_no}</p>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <p className="font-medium text-slate-800">{load.material_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {load.quantity} {load.unit}
                      </p>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <p className="font-bold text-slate-900">{load.driver_name}</p>
                      <p className="text-[11px] font-mono text-slate-500">{load.vehicle_number}</p>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <p className="font-bold text-emerald-700 tabular-nums">
                        ₹{load.status === 'Cancelled' ? 0 : load.driver_earnings}
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {load.status === 'Delivered' ? 'Added to Salary' : 'Rate: ₹' + load.driver_rate}
                      </p>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600 max-w-[180px] truncate">
                      {load.delivery_location}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            load.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : load.status === 'Out for Delivery'
                              ? 'bg-purple-100 text-purple-800'
                              : load.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {load.status}
                        </span>

                        {/* Quick Status Advance Buttons */}
                        {load.status === 'Driver Assigned' && (
                          <div>
                            <button
                              onClick={() => updateLoadStatus(load.id, 'Out for Delivery', currentUser?.name || 'Staff')}
                              className="text-[10px] text-purple-700 hover:underline font-bold block"
                            >
                              Dispatch →
                            </button>
                          </div>
                        )}
                        {load.status === 'Out for Delivery' && (
                          <div>
                            <button
                              onClick={() => updateLoadStatus(load.id, 'Delivered', currentUser?.name || 'Staff')}
                              className="text-[10px] text-emerald-700 hover:underline font-bold block"
                            >
                              Mark Delivered ✓
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLoadForPrint(load);
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Print Trip Challan"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenReassign(load)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Reassign Driver or Vehicle"
                        >
                          <RefreshCw className="w-4 h-4" />
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

      {/* REASSIGN DRIVER / VEHICLE MODAL */}
      {reassignLoadObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase">Trip Assignment</span>
              <h3 className="text-base font-bold text-slate-900">
                Reassign Load {reassignLoadObj.load_no}
              </h3>
              <p className="text-xs text-slate-500">
                Salary earnings will automatically transfer to the newly assigned driver upon delivery.
              </p>
            </div>

            <form onSubmit={handleConfirmReassign} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Driver *</label>
                <select
                  required
                  value={newDriverId}
                  onChange={e => {
                    setNewDriverId(e.target.value);
                    const d = drivers.find(drv => drv.id === e.target.value);
                    if (d) setCustomRate(d.rate_per_load);
                  }}
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500 font-medium"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.driver_no}) · Default: ₹{d.rate_per_load}/load
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Vehicle / Truck *</label>
                <select
                  required
                  value={newVehicleId}
                  onChange={e => setNewVehicleId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500 font-medium"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_no} - {v.type} ({v.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driver Rate for this Load (₹)</label>
                <input
                  type="number"
                  value={customRate}
                  onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded p-2 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReassignLoadObj(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT DELIVERY CHALLAN MODAL */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType="delivery_challan"
        load={selectedLoadForPrint}
        settings={settings}
      />
    </div>
  );
};
