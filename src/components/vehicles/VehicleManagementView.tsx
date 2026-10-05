import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Vehicle, VehicleStatus, VehicleType } from '../../types';
import {
  Car,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Truck,
  Wrench,
  Clock,
  ShieldCheck,
  Edit2
} from 'lucide-react';

export const VehicleManagementView: React.FC = () => {
  const { vehicles, drivers, addVehicle, updateVehicle } = useDatabase();
  const { canModifyRates } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [type, setType] = useState<VehicleType>('Tipper 6-Wheeler');
  const [capacity, setCapacity] = useState('2.5 Units (14 Tons)');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [permitExpiry, setPermitExpiry] = useState('');
  const [pollutionExpiry, setPollutionExpiry] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('Available');
  const [notes, setNotes] = useState('');

  const checkDocStatus = (dateStr: string) => {
    if (!dateStr) return { ok: true, text: '-' };
    const diff = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { expired: true, text: 'EXPIRED' };
    if (diff <= 30) return { warning: true, text: `${Math.round(diff)}d left` };
    return { ok: true, text: dateStr };
  };

  const filteredVehicles = vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchesSearch =
      v.vehicle_no.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q) ||
      (v.assigned_driver_name && v.assigned_driver_name.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingVehicleId(null);
    setVehicleNo('');
    setType('Tipper 6-Wheeler');
    setCapacity('2.5 Units (14 Tons)');
    setAssignedDriverId('');
    setInsuranceExpiry('2027-04-15');
    setFitnessExpiry('2027-06-20');
    setPermitExpiry('2027-08-10');
    setPollutionExpiry('2027-01-15');
    setStatus('Available');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (veh: Vehicle) => {
    setEditingVehicleId(veh.id);
    setVehicleNo(veh.vehicle_no);
    setType(veh.type);
    setCapacity(veh.capacity);
    setAssignedDriverId(veh.assigned_driver_id || '');
    setInsuranceExpiry(veh.insurance_expiry);
    setFitnessExpiry(veh.fitness_expiry);
    setPermitExpiry(veh.permit_expiry);
    setPollutionExpiry(veh.pollution_expiry);
    setStatus(veh.status);
    setNotes(veh.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo) return;

    if (editingVehicleId) {
      updateVehicle(editingVehicleId, {
        vehicle_no: vehicleNo.toUpperCase(),
        type,
        capacity,
        assigned_driver_id: assignedDriverId || undefined,
        insurance_expiry: insuranceExpiry,
        fitness_expiry: fitnessExpiry,
        permit_expiry: permitExpiry,
        pollution_expiry: pollutionExpiry,
        status,
        notes
      });
    } else {
      addVehicle({
        vehicle_no: vehicleNo.toUpperCase(),
        type,
        capacity,
        assigned_driver_id: assignedDriverId || undefined,
        insurance_expiry: insuranceExpiry,
        fitness_expiry: fitnessExpiry,
        permit_expiry: permitExpiry,
        pollution_expiry: pollutionExpiry,
        status,
        notes
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Fleet & Vehicle Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor Tipper trucks, capacity, driver assignment, completed loads, and document compliance (FC/Insurance/PUC)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + ADD VEHICLE
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vehicle number, type, driver..."
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['all', 'Assigned', 'Available', 'Under Maintenance', 'Inactive'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Vehicles' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(veh => {
          const fc = checkDocStatus(veh.fitness_expiry);
          const ins = checkDocStatus(veh.insurance_expiry);
          const puc = checkDocStatus(veh.pollution_expiry);
          const permit = checkDocStatus(veh.permit_expiry);

          const hasWarning = fc.warning || ins.warning || puc.warning || permit.warning || fc.expired || ins.expired;

          return (
            <div
              key={veh.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 font-mono font-bold text-xs flex items-center justify-center p-1 text-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 font-mono tracking-tight">
                        {veh.vehicle_no}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{veh.type}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      veh.status === 'Assigned'
                        ? 'bg-blue-100 text-blue-800'
                        : veh.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : veh.status === 'Under Maintenance'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {veh.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacity:</span>
                    <span className="font-semibold text-slate-800">{veh.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Driver:</span>
                    <span className="font-medium text-slate-900">
                      {veh.assigned_driver_name || 'Yard Pool'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Trips Completed:</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {veh.loads_completed} Loads
                    </span>
                  </div>
                </div>

                {/* Compliance Expiry Box */}
                <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                      Document Compliance
                    </span>
                    {hasWarning && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Action Due
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Fitness (FC):</span>
                      <span className={fc.warning || fc.expired ? 'text-red-600 font-bold' : 'text-slate-800'}>
                        {fc.text}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Insurance:</span>
                      <span className={ins.warning || ins.expired ? 'text-red-600 font-bold' : 'text-slate-800'}>
                        {ins.text}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Permit:</span>
                      <span className={permit.warning ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                        {permit.text}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">PUC:</span>
                      <span className={puc.warning || puc.expired ? 'text-red-600 font-bold' : 'text-slate-800'}>
                        {puc.text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit button */}
              <div className="pt-3 border-t border-slate-100 mt-3">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(veh)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Vehicle & Renewal Dates
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT VEHICLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4 my-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingVehicleId ? 'Edit Vehicle Profile' : 'Add Vehicle to Fleet'}
              </h3>
              <p className="text-xs text-slate-500">
                Track fitness certificate, commercial insurance, and permit renewal dates
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Reg Number *</label>
                  <input
                    type="text"
                    required
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value)}
                    placeholder="e.g. TN 05 AK 4589"
                    className="w-full border border-slate-300 rounded p-2 font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="Tipper 6-Wheeler">Tipper 6-Wheeler</option>
                    <option value="Tipper 10-Wheeler">Tipper 10-Wheeler</option>
                    <option value="Mini Truck">Mini Truck (Ashok Leyland Dost)</option>
                    <option value="Tractor">Tractor</option>
                    <option value="JCB / Excavator">JCB / Excavator</option>
                    <option value="Other">Other Heavy Commercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    placeholder="e.g. 2.5 Units (14 Tons)"
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Driver</label>
                  <select
                    value={assignedDriverId}
                    onChange={e => setAssignedDriverId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="">-- None / Yard Pool --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.driver_no})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fitness Certificate (FC) Expiry *</label>
                  <input
                    type="date"
                    required
                    value={fitnessExpiry}
                    onChange={e => setFitnessExpiry(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insurance Expiry *</label>
                  <input
                    type="date"
                    required
                    value={insuranceExpiry}
                    onChange={e => setInsuranceExpiry(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Permit Expiry</label>
                  <input
                    type="date"
                    value={permitExpiry}
                    onChange={e => setPermitExpiry(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pollution (PUC) Expiry</label>
                  <input
                    type="date"
                    value={pollutionExpiry}
                    onChange={e => setPollutionExpiry(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operating Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded p-2"
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
