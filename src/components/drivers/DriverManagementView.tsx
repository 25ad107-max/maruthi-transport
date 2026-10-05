import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Driver, DriverAdvance, DriverSalaryType } from '../../types';
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Phone,
  Calendar,
  CheckCircle,
  Truck,
  Edit2
} from 'lucide-react';

interface DriverManagementViewProps {
  onOpenSalarySlip?: (driverId: string) => void;
  targetDriverId?: string;
}

export const DriverManagementView: React.FC<DriverManagementViewProps> = ({
  onOpenSalarySlip,
  targetDriverId
}) => {
  const {
    drivers,
    vehicles,
    driverAdvances,
    loads,
    addDriver,
    updateDriver,
    recordDriverAdvance,
    calculateMonthlySalary
  } = useDatabase();
  const { canModifyRates, currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Add / Edit Driver Modal
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [address, setAddress] = useState('');
  const [licenceNo, setLicenceNo] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [salaryType, setSalaryType] = useState<DriverSalaryType>('Per Load');
  const [ratePerLoad, setRatePerLoad] = useState(500);
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  // Record Advance Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceDriverId, setAdvanceDriverId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(2000);
  const [advanceReason, setAdvanceReason] = useState('');
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('Cash');

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const filteredDrivers = drivers.filter(d => {
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.mobile.includes(q) ||
      d.driver_no.toLowerCase().includes(q) ||
      d.licence_no.toLowerCase().includes(q)
    );
  });

  const checkLicenceExpiry = (expiryDate: string) => {
    const target = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const diffDays = (target - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return { expired: true, text: 'Expired' };
    if (diffDays <= 30) return { warning: true, text: `${Math.round(diffDays)}d left` };
    return { ok: true, text: expiryDate };
  };

  const handleOpenAdd = () => {
    setEditingDriverId(null);
    setName('');
    setMobile('');
    setAltMobile('');
    setAddress('Chennai');
    setLicenceNo('');
    setLicenceExpiry('2028-12-31');
    setAssignedVehicleId('');
    setSalaryType('Per Load');
    setRatePerLoad(500);
    setUpiId('');
    setBankAccount('');
    setEmergencyContact('');
    setNotes('');
    setIsDriverModalOpen(true);
  };

  const handleOpenEdit = (drv: Driver) => {
    setEditingDriverId(drv.id);
    setName(drv.name);
    setMobile(drv.mobile);
    setAltMobile(drv.alt_mobile || '');
    setAddress(drv.address);
    setLicenceNo(drv.licence_no);
    setLicenceExpiry(drv.licence_expiry);
    setAssignedVehicleId(drv.assigned_vehicle_id || '');
    setSalaryType(drv.salary_type);
    setRatePerLoad(drv.rate_per_load);
    setUpiId(drv.upi_id || '');
    setBankAccount(drv.bank_account || '');
    setEmergencyContact(drv.emergency_contact);
    setNotes(drv.notes || '');
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !licenceNo) return;

    if (editingDriverId) {
      updateDriver(editingDriverId, {
        name,
        mobile,
        alt_mobile: altMobile,
        address,
        licence_no: licenceNo,
        licence_expiry: licenceExpiry,
        assigned_vehicle_id: assignedVehicleId || undefined,
        salary_type: salaryType,
        rate_per_load: ratePerLoad,
        upi_id: upiId,
        bank_account: bankAccount,
        emergency_contact: emergencyContact,
        notes
      });
    } else {
      addDriver({
        name,
        mobile,
        alt_mobile: altMobile,
        address,
        licence_no: licenceNo,
        licence_expiry: licenceExpiry,
        joining_date: new Date().toISOString().slice(0, 10),
        assigned_vehicle_id: assignedVehicleId || undefined,
        salary_type: salaryType,
        rate_per_load: ratePerLoad,
        upi_id: upiId,
        bank_account: bankAccount,
        emergency_contact: emergencyContact || `${name} Family`,
        status: 'Active',
        notes
      });
    }

    setIsDriverModalOpen(false);
  };

  const handleOpenAdvance = (driverId: string) => {
    setAdvanceDriverId(driverId);
    setAdvanceAmount(2000);
    setAdvanceReason('Festival advance / Family requirement');
    setAdvancePaymentMethod('Cash');
    setIsAdvanceModalOpen(true);
  };

  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceDriverId || advanceAmount <= 0) return;

    const todayStr = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date()).replace(/\//g, '-');

    recordDriverAdvance({
      driver_id: advanceDriverId,
      amount: advanceAmount,
      date: todayStr,
      month: currentMonthStr,
      reason: advanceReason,
      payment_method: advancePaymentMethod,
      created_by: currentUser?.name || 'Admin'
    });

    setIsAdvanceModalOpen(false);
    alert(`Advance of ₹${advanceAmount.toLocaleString('en-IN')} issued and recorded!`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Driver Fleet & Advances Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage driver profiles, licence compliance, trip rates, and advance salary tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (drivers.length > 0) handleOpenAdvance(drivers[0].id);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-500" />
            + Record Advance
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + ADD DRIVER
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search driver name, phone, licence no..."
          className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
        />
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map(drv => {
          const stats = calculateMonthlySalary(drv.id, currentMonthStr);
          const licenceStatus = checkLicenceExpiry(drv.licence_expiry);
          const vehicle = vehicles.find(v => v.id === drv.assigned_vehicle_id);

          return (
            <div
              key={drv.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 font-black text-sm flex items-center justify-center">
                      {drv.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{drv.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{drv.driver_no} · {drv.mobile}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      drv.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {drv.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Salary Model:</span>
                    <span className="font-semibold text-slate-900">
                      {drv.salary_type} (₹{drv.rate_per_load}/load)
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Vehicle:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {vehicle ? vehicle.vehicle_no : 'Pool Vehicle'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Licence No:</span>
                    <div className="text-right">
                      <p className="font-mono text-slate-800">{drv.licence_no}</p>
                      {licenceStatus.warning ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1 rounded">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Expiring: {licenceStatus.text}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Exp: {drv.licence_expiry}
                        </span>
                      )}
                    </div>
                  </div>

                  {drv.upi_id && (
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400 font-sans">UPI ID:</span>
                      <span className="text-slate-800">{drv.upi_id}</span>
                    </div>
                  )}
                </div>

                {/* Month Earnings & Advance Ledger Box */}
                <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
                  <p className="font-sans font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                    October 2026 Salary Status
                  </p>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-600">Completed Loads:</span>
                    <span className="font-bold text-slate-900">{stats.completedLoads} Trips</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-600">Load Earnings:</span>
                    <span className="font-bold text-slate-900">₹{stats.loadEarnings.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span className="font-sans">Total Advance:</span>
                    <span>- ₹{stats.advancesDeducted.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-emerald-800 font-sans">
                    <span>Balance Payable:</span>
                    <span className="font-mono">₹{stats.netSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => handleOpenAdvance(drv.id)}
                  className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold text-center transition-colors"
                >
                  Give Advance
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(drv)}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECORD DRIVER ADVANCE MODAL */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase">Driver Advance</span>
              <h3 className="text-base font-bold text-slate-900">Record Advance Payment</h3>
              <p className="text-xs text-slate-500">
                Advances are automatically deducted from the monthly load salary ledger.
              </p>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Driver *</label>
                <select
                  required
                  value={advanceDriverId}
                  onChange={e => setAdvanceDriverId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500 font-medium"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.driver_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded p-2 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={advancePaymentMethod}
                  onChange={e => setAdvancePaymentMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  required
                  value={advanceReason}
                  onChange={e => setAdvanceReason(e.target.value)}
                  placeholder="e.g. Festival advance, emergency medical..."
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded"
                >
                  Record Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT DRIVER MODAL */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200 space-y-4 my-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingDriverId ? 'Edit Driver Profile' : 'Register New Driver'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure salary method, licence compliance and fleet assignment
              </p>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Licence Number *</label>
                  <input
                    type="text"
                    required
                    value={licenceNo}
                    onChange={e => setLicenceNo(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Licence Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={licenceExpiry}
                    onChange={e => setLicenceExpiry(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salary Type</label>
                  <select
                    value={salaryType}
                    onChange={e => setSalaryType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="Per Load">Per Load (Standard)</option>
                    <option value="Daily Wage">Daily Wage</option>
                    <option value="Monthly Salary">Monthly Salary</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate Per Load (₹) *</label>
                  <input
                    type="number"
                    required
                    value={ratePerLoad}
                    onChange={e => setRatePerLoad(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Vehicle</label>
                  <select
                    value={assignedVehicleId}
                    onChange={e => setAssignedVehicleId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="">-- None / Yard Pool --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_no} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI ID (for payments)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g. driver@upi"
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address (Chennai)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
