import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import {
  DollarSign,
  Search,
  Plus,
  Trash2,
  Filter,
  Fuel,
  Wrench,
  Users,
  Briefcase
} from 'lucide-react';

export const ExpenseManagementView: React.FC = () => {
  const { expenses, vehicles, drivers, addExpense, deleteExpense } = useDatabase();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Fuel');
  const [amount, setAmount] = useState<number>(3000);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [vehicleId, setVehicleId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [description, setDescription] = useState<string>('');
  const [receiptRef, setReceiptRef] = useState<string>('');

  const totalExpenseAmount = expenses.reduce((s, e) => s + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.expense_no.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.vehicle_number && e.vehicle_number.toLowerCase().includes(q)) ||
      (e.driver_name && e.driver_name.toLowerCase().includes(q));

    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setCategory('Fuel');
    setAmount(2500);
    setDate(new Date().toISOString().slice(0, 10));
    setVehicleId(vehicles[0]?.id || '');
    setDriverId(drivers[0]?.id || '');
    setPaymentMethod('Cash');
    setDescription('');
    setReceiptRef('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description) return;

    const parts = date.split('-');
    const dateStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : date;

    const v = vehicles.find(item => item.id === vehicleId);
    const d = drivers.find(item => item.id === driverId);

    addExpense({
      date: dateStr,
      category,
      vehicle_id: vehicleId || undefined,
      vehicle_number: v?.vehicle_no,
      driver_id: driverId || undefined,
      driver_name: d?.name,
      amount,
      payment_method: paymentMethod,
      description,
      receipt_ref: receiptRef,
      created_by: currentUser?.name || 'Staff'
    });

    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Expense Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log fuel, vehicle garage maintenance, driver advances, yard utilities and operational overheads
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + RECORD EXPENSE
        </button>
      </div>

      {/* Aggregate banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Recorded Expenses</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            ₹{totalExpenseAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{expenses.length} Expense Transactions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Fuel & Diesel</p>
          <p className="text-2xl font-black font-mono text-amber-700 mt-1 tabular-nums">
            ₹{expenses.filter(e => e.category === 'Fuel').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Fleet Fuel Bunk Bills</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Vehicle Maintenance</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            ₹{expenses.filter(e => e.category === 'Vehicle Maintenance' || e.category === 'Repairs').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Garage & Tyre Service</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search description, vehicle, driver..."
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          {(['all', 'Fuel', 'Vehicle Maintenance', 'Driver Advance', 'Salary', 'Repairs', 'Office Expenses', 'Other'] as const).map(
            cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Expenses' : cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Expense ID & Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Fleet / Driver</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{exp.expense_no}</p>
                      <p className="text-[11px] text-slate-500 font-sans">{exp.date}</p>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-800 max-w-xs">
                      {exp.description}
                      {exp.receipt_ref && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Ref: {exp.receipt_ref}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600">
                      {exp.vehicle_number ? <span className="font-mono font-bold text-slate-900">{exp.vehicle_number}</span> : '-'}
                      {exp.driver_name && <span className="block text-[11px] text-slate-500">{exp.driver_name}</span>}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-700">
                      {exp.payment_method}
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete expense ${exp.expense_no}?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4 my-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Operational Expense</h3>
              <p className="text-xs text-slate-500">Log cost against a vehicle or general yard operational category</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="Fuel">Fuel / Diesel</option>
                    <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                    <option value="Driver Advance">Driver Advance</option>
                    <option value="Salary">Salary Payout</option>
                    <option value="Repairs">Repairs & Spares</option>
                    <option value="Office Expenses">Yard Office Expenses</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded p-2 font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linked Vehicle (Optional)</label>
                  <select
                    value={vehicleId}
                    onChange={e => setVehicleId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="">-- General / No Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_no} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linked Driver (Optional)</label>
                  <select
                    value={driverId}
                    onChange={e => setDriverId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="">-- No Driver --</option>
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
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Bunk Name *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Diesel 35 Litres from Indian Oil Bunk Koyambedu"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bill / Voucher Ref Number</label>
                <input
                  type="text"
                  value={receiptRef}
                  onChange={e => setReceiptRef(e.target.value)}
                  placeholder="e.g. Bill #IOC-92812"
                  className="w-full border border-slate-300 rounded p-2 font-mono"
                />
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
