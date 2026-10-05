import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer, CustomerType } from '../../types';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  XCircle,
  CreditCard
} from 'lucide-react';

interface CustomerManagementViewProps {
  onOpenQuickBillForCustomer?: (custId: string) => void;
  targetCustomerId?: string;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  onOpenQuickBillForCustomer,
  targetCustomerId
}) => {
  const { customers, orders, invoices, payments, addCustomer, updateCustomer, deleteCustomer } = useDatabase();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustId, setEditingCustId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Contractor');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Target Customer Auto select
  React.useEffect(() => {
    if (targetCustomerId) {
      const found = customers.find(c => c.id === targetCustomerId);
      if (found) setSelectedCustomer(found);
    }
  }, [targetCustomerId, customers]);

  const filteredCustomers = customers.filter(c => {
    if (!c.is_active) return false;
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.whatsapp && c.whatsapp.includes(q)) ||
      c.customer_no.toLowerCase().includes(q) ||
      c.delivery_location.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getCustomerFinancials = (custId: string) => {
    const custInvoices = invoices.filter(i => i.customer_id === custId);
    const totalPurchases = custInvoices.reduce((s, i) => s + i.grand_total, 0);
    const totalPaid = custInvoices.reduce((s, i) => s + i.paid_amount, 0);
    const totalPending = custInvoices.reduce((s, i) => s + i.pending_amount, 0);
    const orderCount = orders.filter(o => o.customer_id === custId).length;
    return { totalPurchases, totalPaid, totalPending, orderCount };
  };

  const handleOpenAdd = () => {
    setEditingCustId(null);
    setName('');
    setMobile('');
    setWhatsapp('');
    setAddress('Chennai');
    setDeliveryLocation('Chennai Site');
    setCustomerType('Contractor');
    setGstNumber('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustId(c.id);
    setName(c.name);
    setMobile(c.mobile);
    setWhatsapp(c.whatsapp || '');
    setAddress(c.address);
    setDeliveryLocation(c.delivery_location);
    setCustomerType(c.customer_type);
    setGstNumber(c.gst_number || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;

    if (editingCustId) {
      updateCustomer(editingCustId, {
        name,
        mobile,
        whatsapp: whatsapp || mobile,
        address,
        delivery_location: deliveryLocation,
        customer_type: customerType,
        gst_number: gstNumber,
        notes
      });
    } else {
      addCustomer({
        name,
        mobile,
        whatsapp: whatsapp || mobile,
        address,
        delivery_location: deliveryLocation,
        customer_type: customerType,
        gst_number: gstNumber,
        notes
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (c: Customer) => {
    if (window.confirm(`Are you sure you want to deactivate customer ${c.name}?`)) {
      deleteCustomer(c.id);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const num = clean.length === 10 ? `91${clean}` : clean;
    const msg = `Hello ${name}, greetings from Maruthi Transport Chennai.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of builders, civil contractors, villa developers and individual owners across Chennai
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + ADD CUSTOMER
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
            placeholder="Search customer name, phone, site location..."
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium">Type:</span>
          {(['all', 'Contractor', 'Builder', 'Individual', 'Infrastructure'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Customer ID & Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Default Site Location</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Pending Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => {
                  const fin = getCustomerFinancials(cust.id);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 font-sans">{cust.name}</p>
                        <p className="text-[11px] text-slate-400">{cust.customer_no}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-semibold">{cust.mobile}</p>
                        <div className="flex items-center gap-2 mt-0.5 font-sans">
                          {cust.whatsapp && (
                            <button
                              onClick={() => openWhatsApp(cust.whatsapp!, cust.name)}
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-semibold"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {cust.customer_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-600 max-w-[200px] truncate">
                        {cust.delivery_location}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        ₹{fin.totalPurchases.toLocaleString('en-IN')}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          {fin.orderCount} Orders
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold tabular-nums">
                        <span className={fin.totalPending > 0 ? 'text-red-600' : 'text-emerald-600'}>
                          ₹{fin.totalPending.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] font-sans font-semibold">
                          {fin.totalPending > 0 ? 'Pending' : 'Cleared'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="View History & Orders"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                            title="Deactivate Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER PROFILE & ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-5 my-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-amber-600">Customer Account Ledger</span>
                <h3 className="text-lg font-black text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedCustomer.customer_no} · Mobile: {selectedCustomer.mobile} · {selectedCustomer.customer_type}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Highlights */}
            {(() => {
              const fin = getCustomerFinancials(selectedCustomer.id);
              return (
                <div className="grid grid-cols-3 gap-3 font-mono text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-sans font-bold text-slate-500 uppercase">Total Purchases</p>
                    <p className="text-base font-bold text-slate-900 mt-1">₹{fin.totalPurchases.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                    <p className="text-[10px] font-sans font-bold text-emerald-700 uppercase">Paid Amount</p>
                    <p className="text-base font-bold text-emerald-700 mt-1">₹{fin.totalPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-red-50/50 p-3 rounded-lg border border-red-200">
                    <p className="text-[10px] font-sans font-bold text-red-700 uppercase">Outstanding Due</p>
                    <p className="text-base font-bold text-red-700 mt-1">₹{fin.totalPending.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              );
            })()}

            {/* Past Orders for this Customer */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                Order & Dispatch History
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
                {orders.filter(o => o.customer_id === selectedCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center font-sans">No past orders found.</p>
                ) : (
                  orders
                    .filter(o => o.customer_id === selectedCustomer.id)
                    .map(o => (
                      <div
                        key={o.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{o.order_no} · {o.material_name}</p>
                          <p className="text-[11px] text-slate-500 font-sans">
                            {o.quantity} {o.unit} · Site: {o.delivery_location} · Date: {o.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₹{o.total_amount.toLocaleString('en-IN')}</p>
                          <span className="text-[10px] font-sans font-semibold text-emerald-700">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4 my-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingCustId ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <p className="text-xs text-slate-500">Record customer contact details and default delivery site</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sri Balaji Builders / Selvam Contractor"
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="e.g. 98401 23456"
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="e.g. 98401 23456"
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Category</label>
                  <select
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="Contractor">Contractor</option>
                    <option value="Builder">Builder / Promoter</option>
                    <option value="Individual">Individual House Owner</option>
                    <option value="Infrastructure">Infrastructure Project</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={e => setGstNumber(e.target.value)}
                    placeholder="e.g. 33AABCS8891P1ZK"
                    className="w-full border border-slate-300 rounded p-2 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Delivery Location (Site Address in Chennai) *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={e => setDeliveryLocation(e.target.value)}
                  placeholder="e.g. Porur Bypass site, Anna Nagar West..."
                  className="w-full border border-slate-300 rounded p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Office / Billing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Plot 12, Mount Poonamallee Road, Porur"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Credit limits, site contact person, unloading constraints..."
                  className="w-full border border-slate-300 rounded p-2"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
