import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Invoice, Payment, PaymentMethod } from '../../types';
import { PrintModal } from '../print/PrintModal';
import {
  CreditCard,
  Search,
  Plus,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  ArrowDownRight
} from 'lucide-react';

interface PaymentsViewProps {
  onOpenRecordPayment?: () => void;
  targetInvoiceId?: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ targetInvoiceId }) => {
  const { invoices, payments, recordPayment, settings } = useDatabase();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Partially Paid' | 'Paid'>('all');

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');

  // Print modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | undefined>(undefined);

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  // Financial aggregates
  const totalBilled = invoices.reduce((s, i) => s + i.grand_total, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.paid_amount, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + i.pending_amount, 0);

  const filteredInvoices = invoices.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch =
      i.invoice_no.toLowerCase().includes(q) ||
      i.customer_name.toLowerCase().includes(q) ||
      i.customer_phone.includes(q);

    const matchesStatus = statusFilter === 'all' || i.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenRecordPayment = (inv?: Invoice) => {
    const defaultInv = inv || invoices.find(i => i.pending_amount > 0) || invoices[0];
    if (defaultInv) {
      setSelectedInvoiceId(defaultInv.id);
      setAmount(defaultInv.pending_amount || defaultInv.grand_total);
      setPaymentMethod('UPI');
      setRefNo('');
      setNotes('');
      setIsRecordModalOpen(true);
    }
  };

  const handleInvoiceSelectInModal = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      setAmount(inv.pending_amount);
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || amount <= 0) return;

    const todayStr = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date()).replace(/\//g, '-');

    recordPayment({
      invoice_id: selectedInvoiceId,
      amount,
      date: todayStr,
      payment_method: paymentMethod,
      reference_no: refNo,
      notes,
      created_by: currentUser?.name || 'Staff'
    });

    setIsRecordModalOpen(false);
    alert(`Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully!`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Customer Payments & Outstanding Dues
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track receivables, record partial/full settlement against invoices, and view receipts
          </p>
        </div>

        <button
          onClick={() => handleOpenRecordPayment()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + RECORD PAYMENT
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoiced</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            ₹{totalBilled.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{invoices.length} Invoices Generated</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Collected</p>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-1 tabular-nums">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{payments.length} Payments Received</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Total Outstanding Balance</p>
          <p className="text-2xl font-black font-mono text-red-600 mt-1 tabular-nums">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-red-600 font-semibold mt-1">Pending from Customers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice no, customer name..."
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['all', 'Pending', 'Partially Paid', 'Paid'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Outstanding Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-sm text-slate-900">Invoices & Settlement Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice No & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                <th className="py-3 px-4 text-right">Pending Due (₹)</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans">
                    No invoices match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{inv.invoice_no}</p>
                      <p className="text-[11px] text-slate-500 font-sans">{inv.date}</p>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-900">{inv.customer_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{inv.customer_phone}</p>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      ₹{inv.grand_total.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right text-emerald-700 font-bold tabular-nums">
                      ₹{inv.paid_amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums">
                      <span className={`font-bold ${inv.pending_amount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        ₹{inv.pending_amount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.payment_status === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.payment_status} ({inv.payment_method})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        {inv.pending_amount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenRecordPayment(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                          >
                            Pay Due
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceForPrint(inv);
                            setPrintModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Print Invoice / Receipt"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* RECORD PAYMENT MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase">Payment Collection</span>
              <h3 className="text-base font-bold text-slate-900">Record Customer Payment</h3>
              <p className="text-xs text-slate-500">
                Supports partial and full settlements against pending invoices
              </p>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Invoice *</label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={e => handleInvoiceSelectInModal(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500 font-medium"
                >
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_no} · {inv.customer_name} (Pending: ₹{inv.pending_amount})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex justify-between font-mono text-xs">
                  <div>
                    <span className="font-sans text-slate-500">Bill Total:</span>
                    <p className="font-bold text-slate-800">₹{selectedInvoice.grand_total}</p>
                  </div>
                  <div>
                    <span className="font-sans text-slate-500">Already Paid:</span>
                    <p className="font-bold text-emerald-700">₹{selectedInvoice.paid_amount}</p>
                  </div>
                  <div>
                    <span className="font-sans text-slate-500">Balance Due:</span>
                    <p className="font-bold text-red-600">₹{selectedInvoice.pending_amount}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded p-2 font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                    <option value="Credit/Pending">Credit / Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={e => setRefNo(e.target.value)}
                    placeholder="e.g. UPI txn 49201"
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Cleared by site engineer Selvam"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT INVOICE / RECEIPT MODAL */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType="invoice_a4"
        invoice={selectedInvoiceForPrint}
        settings={settings}
      />
    </div>
  );
};
