import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { DriverSalaryRecord } from '../../types';
import { PrintModal } from '../print/PrintModal';
import {
  DollarSign,
  Printer,
  Calendar,
  CheckCircle,
  Truck,
  Plus,
  FileSpreadsheet,
  Check,
  Edit3
} from 'lucide-react';

export const SalaryCalculationView: React.FC = () => {
  const {
    drivers,
    loads,
    driverAdvances,
    salaryRecords,
    calculateMonthlySalary,
    saveSalaryRecord,
    settings
  } = useDatabase();
  const { canModifyRates, currentUser } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');

  // Form inputs for bonus/deductions
  const [bonus, setBonus] = useState<number>(0);
  const [otherEarnings, setOtherEarnings] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [customRate, setCustomRate] = useState<number>(500);
  const [notes, setNotes] = useState<string>('');

  // Print modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [activeSalaryRecord, setActiveSalaryRecord] = useState<DriverSalaryRecord | undefined>(undefined);

  const activeDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  // Auto calculate based on database loads
  const calc = calculateMonthlySalary(selectedDriverId, selectedMonth);

  // Synchronize custom rate and existing bonus/deductions if a record already exists
  React.useEffect(() => {
    if (activeDriver) {
      setCustomRate(activeDriver.rate_per_load);
    }
    const existing = salaryRecords.find(
      r => r.driver_id === selectedDriverId && r.month === selectedMonth
    );
    if (existing) {
      setBonus(existing.bonus);
      setOtherEarnings(existing.other_earnings);
      setOtherDeductions(existing.other_deductions);
      setNotes(existing.notes || '');
    } else {
      setBonus(0);
      setOtherEarnings(0);
      setOtherDeductions(0);
      setNotes('');
    }
  }, [selectedDriverId, selectedMonth, activeDriver, salaryRecords]);

  // Dynamic net salary with admin adjustment overrides
  const effectiveLoadEarnings = calc.completedLoads * customRate;
  const effectiveNetSalary = Math.max(
    0,
    effectiveLoadEarnings + bonus + otherEarnings - calc.advancesDeducted - otherDeductions
  );

  const existingRecord = salaryRecords.find(
    r => r.driver_id === selectedDriverId && r.month === selectedMonth
  );

  const handleSaveDraft = () => {
    if (!activeDriver) return;
    const saved = saveSalaryRecord({
      month: selectedMonth,
      driver_id: activeDriver.id,
      driver_name: activeDriver.name,
      completed_loads: calc.completedLoads,
      rate_per_load: customRate,
      load_earnings: effectiveLoadEarnings,
      bonus,
      other_earnings: otherEarnings,
      advances_deducted: calc.advancesDeducted,
      other_deductions: otherDeductions,
      net_salary: effectiveNetSalary,
      status: 'Approved',
      notes
    });
    alert(`Salary statement for ${activeDriver.name} (${selectedMonth}) saved successfully!`);
  };

  const handlePaySalary = () => {
    if (!activeDriver) return;
    const confirmPay = window.confirm(
      `Disburse salary of ₹${effectiveNetSalary.toLocaleString('en-IN')} to ${activeDriver.name}? This will record a payment expense and mark salary cleared.`
    );
    if (!confirmPay) return;

    const saved = saveSalaryRecord({
      month: selectedMonth,
      driver_id: activeDriver.id,
      driver_name: activeDriver.name,
      completed_loads: calc.completedLoads,
      rate_per_load: customRate,
      load_earnings: effectiveLoadEarnings,
      bonus,
      other_earnings: otherEarnings,
      advances_deducted: calc.advancesDeducted,
      other_deductions: otherDeductions,
      net_salary: effectiveNetSalary,
      status: 'Paid',
      payment_date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()).replace(/\//g, '-'),
      payment_method: 'Bank Transfer',
      notes: notes || 'Monthly salary cleared via Bank Transfer'
    });

    setActiveSalaryRecord(saved);
    setPrintModalOpen(true);
  };

  const handlePrintSlip = () => {
    if (!activeDriver) return;
    const slipStatus = existingRecord ? existingRecord.status : 'Draft';
    const dummyRecord: DriverSalaryRecord = existingRecord || {
      id: `temp-${Date.now()}`,
      month: selectedMonth,
      driver_id: activeDriver.id,
      driver_name: activeDriver.name,
      completed_loads: calc.completedLoads,
      rate_per_load: customRate,
      load_earnings: effectiveLoadEarnings,
      bonus,
      other_earnings: otherEarnings,
      advances_deducted: calc.advancesDeducted,
      other_deductions: otherDeductions,
      net_salary: effectiveNetSalary,
      status: slipStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setActiveSalaryRecord(dummyRecord);
    setPrintModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Driver Automatic Salary Calculation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formula: Net Salary = Completed Loads × Rate + Bonus - Advances - Deductions
          </p>
        </div>

        <button
          onClick={handlePrintSlip}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          PRINT SALARY SLIP
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Salary Month
          </label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white font-mono"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Select Driver
          </label>
          <select
            value={selectedDriverId}
            onChange={e => setSelectedDriverId(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white"
          >
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.driver_no}) · Base: ₹{d.rate_per_load}/load
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calculation Ledger Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Calculation Ledger (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {activeDriver?.name} · Statement for {selectedMonth}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Driver ID: {activeDriver?.driver_no} · Mobile: {activeDriver?.mobile}
              </p>
            </div>
            {existingRecord && (
              <span
                className={`px-2.5 py-1 rounded text-xs font-bold uppercase font-mono ${
                  existingRecord.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Status: {existingRecord.status}
              </span>
            )}
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* EARNINGS */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                + Earnings (Trip Fares & Allowances)
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Delivered Loads:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {calc.completedLoads} Trips
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Rate per Load (₹):</span>
                  <input
                    type="number"
                    value={customRate}
                    onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                    disabled={!canModifyRates()}
                    className="w-24 text-right font-mono font-bold bg-white text-slate-900 rounded p-1 border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-900">Load Earnings:</span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    ₹{effectiveLoadEarnings.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-emerald-700 font-medium">Performance / Attendance Bonus (₹):</span>
                  <input
                    type="number"
                    value={bonus}
                    onChange={e => setBonus(parseFloat(e.target.value) || 0)}
                    disabled={!canModifyRates()}
                    className="w-24 text-right font-mono font-semibold bg-white text-emerald-700 rounded p-1 border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Other Earnings / Allowance (₹):</span>
                  <input
                    type="number"
                    value={otherEarnings}
                    onChange={e => setOtherEarnings(parseFloat(e.target.value) || 0)}
                    disabled={!canModifyRates()}
                    className="w-24 text-right font-mono font-semibold bg-white text-slate-900 rounded p-1 border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                - Deductions (Advances & Penalties)
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Month Advance Deductions:</span>
                  <span className="font-mono font-bold text-amber-800 tabular-nums">
                    - ₹{calc.advancesDeducted.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono italic">
                  Automatically fetched from Advance receipts
                </p>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-slate-600">Other Deductions / Penalties (₹):</span>
                  <input
                    type="number"
                    value={otherDeductions}
                    onChange={e => setOtherDeductions(parseFloat(e.target.value) || 0)}
                    disabled={!canModifyRates()}
                    className="w-24 text-right font-mono font-semibold bg-white text-amber-900 rounded p-1 border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 font-bold text-amber-900 border-t border-slate-200">
                  <span>Total Deductions:</span>
                  <span className="font-mono tabular-nums">
                    - ₹{(calc.advancesDeducted + otherDeductions).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NET SALARY HIGHLIGHT */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-amber-400">Net Salary Payable</p>
              <p className="text-[11px] text-slate-400">
                Formula: ({calc.completedLoads} × ₹{customRate}) + ₹{bonus + otherEarnings} - ₹{calc.advancesDeducted + otherDeductions}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-black text-white tabular-nums">
                ₹{effectiveNetSalary.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes for salary slip (e.g. Cleared via IMPS ref #123)..."
              className="text-xs border border-slate-300 rounded-lg p-2 flex-1 max-w-md"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Save Statement
              </button>

              <button
                type="button"
                onClick={handlePaySalary}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                DISBURSE & MARK PAID
              </button>
            </div>
          </div>
        </div>

        {/* Right: Delivered Loads Audit List for this driver (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Delivered Loads for {selectedMonth}
            </h4>
            <span className="text-xs font-mono font-bold text-amber-600">
              {calc.completedLoads} Delivered
            </span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {loads
              .filter(l => {
                if (l.driver_id !== selectedDriverId || l.status !== 'Delivered') return false;
                const parts = l.date.split('-');
                return parts.length === 3 && `${parts[2]}-${parts[1]}` === selectedMonth;
              })
              .map(l => (
                <div
                  key={l.id}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-slate-900">{l.load_no}</p>
                    <p className="text-[11px] font-sans text-slate-600">{l.material_name} ({l.quantity} {l.unit})</p>
                    <p className="text-[10px] text-slate-400 font-sans">{l.customer_name} · {l.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">
                      ₹{l.driver_earnings || l.driver_rate}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* PRINT SALARY SLIP MODAL */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType="salary_slip"
        salaryRecord={activeSalaryRecord}
        settings={settings}
      />
    </div>
  );
};
