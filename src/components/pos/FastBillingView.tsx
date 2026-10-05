import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Customer, Material, PaymentMethod, Invoice, Load } from '../../types';
import { PrintModal, PrintDocumentType } from '../print/PrintModal';
import {
  Zap,
  Printer,
  FileText,
  UserPlus,
  Truck,
  CreditCard,
  MessageSquare,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const FastBillingView: React.FC = () => {
  const {
    customers,
    materials,
    drivers,
    vehicles,
    settings,
    createOrder,
    invoices,
    loads,
    addCustomer
  } = useDatabase();
  const { currentUser } = useAuth();

  // Selected state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customRate, setCustomRate] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(800);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidNow, setPaidNow] = useState<number>(0);
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [urgentDelivery, setUrgentDelivery] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Quick Customer Inline Drawer
  const [showQuickCustModal, setShowQuickCustModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustLocation, setNewCustLocation] = useState<string>('');
  const [newCustType, setNewCustType] = useState<Customer['customer_type']>('Individual');

  // Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<PrintDocumentType>('invoice_a4');
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | undefined>(undefined);
  const [activeLoadForPrint, setActiveLoadForPrint] = useState<Load | undefined>(undefined);

  // Success Flash
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize defaults on mount
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
      setDeliveryLocation(customers[0].delivery_location || '');
    }
    if (materials.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(materials[0].id);
      setCustomRate(materials[0].selling_rate);
    }
    if (drivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(drivers[0].id);
      if (drivers[0].assigned_vehicle_id) {
        setSelectedVehicleId(drivers[0].assigned_vehicle_id);
      }
    }
  }, [customers, materials, drivers]);

  // Update customer location when customer selection changes
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const c = customers.find(item => item.id === custId);
    if (c) {
      setDeliveryLocation(c.delivery_location || '');
    }
  };

  // Update material and auto-show rate
  const handleMaterialSelect = (matId: string) => {
    setSelectedMaterialId(matId);
    const m = materials.find(item => item.id === matId);
    if (m) {
      setCustomRate(m.selling_rate);
    }
  };

  // Auto assign vehicle when driver changes
  const handleDriverChange = (drvId: string) => {
    setSelectedDriverId(drvId);
    const d = drivers.find(drv => drv.id === drvId);
    if (d && d.assigned_vehicle_id) {
      setSelectedVehicleId(d.assigned_vehicle_id);
    }
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Fast Calculations
  const materialAmount = (customRate || 0) * (quantity || 0);
  const grandTotal = Math.max(0, materialAmount + (deliveryCharge || 0) + (otherCharges || 0) - (discount || 0));

  // Auto-set paid amount when method or grand total changes
  useEffect(() => {
    if (paymentMethod === 'Credit/Pending') {
      setPaidNow(0);
    } else {
      setPaidNow(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  const handleGenerateBill = (docTypeToOpen: PrintDocumentType = 'invoice_a4') => {
    if (!selectedCustomerId) {
      alert('Please select or add a customer.');
      return;
    }
    if (!selectedMaterialId) {
      alert('Please select a construction material or service.');
      return;
    }
    if (quantity <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    const { order, load, invoice } = createOrder({
      customer_id: selectedCustomerId,
      material_id: selectedMaterialId,
      quantity,
      rate: customRate,
      delivery_charge: deliveryCharge,
      other_charges: otherCharges,
      discount,
      payment_method: paymentMethod,
      paid_now_amount: paidNow,
      delivery_location: deliveryLocation,
      urgent_delivery: urgentDelivery,
      assigned_driver_id: selectedDriverId || undefined,
      assigned_vehicle_id: selectedVehicleId || undefined,
      notes,
      created_by: currentUser?.name || 'Billing Desk'
    });

    setActiveInvoiceForPrint(invoice);
    setActiveLoadForPrint(load);
    setPrintDocType(docTypeToOpen);
    setPrintModalOpen(true);

    setSuccessMessage(`Bill generated successfully! Invoice #${invoice.invoice_no} (${order.order_no})`);
    setTimeout(() => setSuccessMessage(null), 6000);

    // Reset some fields for the next quick bill
    setQuantity(1);
    setDiscount(0);
    setNotes('');
  };

  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newC = addCustomer({
      name: newCustName,
      mobile: newCustPhone,
      whatsapp: newCustPhone,
      address: newCustLocation || 'Chennai',
      delivery_location: newCustLocation || 'Chennai',
      customer_type: newCustType,
      notes: 'Added via Fast POS counter'
    });

    setSelectedCustomerId(newC.id);
    setDeliveryLocation(newC.delivery_location);
    setShowQuickCustModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustLocation('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Fast Billing Counter / POS
            </h1>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md font-mono">
              NEXT: {settings.invoice_prefix}-{new Date().getFullYear()}-{String(settings.current_invoice_seq + 1).padStart(5, '0')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department-store style high-speed dispatch. Select material, customer, and hit Generate.
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* POS Grid: Fast Selection on Left, Invoice Calculation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Panels (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* STEP 1: Quick Material Buttons */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Select Construction Material or Service</span>
              </label>
              <span className="text-xs text-slate-400">Click to select & load price</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {materials.filter(m => m.is_active).map(mat => {
                const isSelected = selectedMaterialId === mat.id;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => handleMaterialSelect(mat.id)}
                    className={`p-3 text-left rounded-lg border transition-all relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-950' : 'text-slate-800'}`}>
                      {mat.name}
                    </p>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xs font-black font-mono text-slate-900 tabular-nums">
                        ₹{mat.selling_rate.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        / {mat.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Customer Selection & Quick Inline Add */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Customer & Delivery Site
              </label>
              <button
                type="button"
                onClick={() => setShowQuickCustModal(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Quick Add New Customer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.mobile} ({c.customer_type})
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Phone: {selectedCustomer.mobile} {selectedCustomer.whatsapp && `| WA: ${selectedCustomer.whatsapp}`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Site / Unload Location (Chennai)
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={e => setDeliveryLocation(e.target.value)}
                  placeholder="e.g. Porur Bypass site, Anna Nagar West..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-hidden font-medium"
                />
                <div className="flex gap-1.5 mt-1 overflow-x-auto">
                  {['Porur', 'Anna Nagar', 'Guindy', 'Velachery', 'Tambaram', 'OMR'].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDeliveryLocation(loc + ' Site, Chennai')}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium whitespace-nowrap"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Fleet & Dispatch Assignment */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              3. Vehicle & Driver Assignment
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Driver</label>
                <select
                  value={selectedDriverId}
                  onChange={e => handleDriverChange(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.filter(d => d.status === 'Active').map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.driver_no}) · ₹{d.rate_per_load}/load
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vehicle / Tipper Truck</label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 focus:border-amber-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.filter(v => v.status !== 'Inactive').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_no} - {v.type} ({v.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={urgentDelivery}
                  onChange={e => setUrgentDelivery(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-bold text-red-600">Urgent / Priority Delivery (Fast Dispatch)</span>
              </label>

              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional delivery notes (e.g. unload before 8 AM)..."
                className="text-xs border border-slate-200 rounded px-2.5 py-1 w-64 text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: POS Register Calculator (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-xl shadow-xl p-5 border border-slate-800 space-y-5 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <p className="text-xs uppercase font-bold text-amber-400 tracking-wider">Bill Calculation</p>
              <p className="text-[11px] text-slate-400 font-mono">MT-2026-POS</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{new Date().toLocaleDateString('en-GB')}</span>
          </div>

          {/* Selected Item Summary */}
          {selectedMaterial ? (
            <div className="bg-slate-800/80 rounded-lg p-3.5 border border-slate-700/60 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedMaterial.name}</h4>
                  <p className="text-[11px] text-slate-400">Unit: {selectedMaterial.unit}</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ₹{customRate.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-xs font-medium text-slate-300">Quantity:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-14 text-center font-mono font-bold bg-slate-950 text-white rounded py-1 text-sm border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Editable Rate */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Selling Rate (₹):</span>
                <input
                  type="number"
                  value={customRate}
                  onChange={e => setCustomRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 text-right font-mono font-bold bg-slate-950 text-white rounded py-1 px-2 border border-slate-700 text-xs"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Please select a material first.</p>
          )}

          {/* Charges & Discount Inputs */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Material Subtotal:</span>
              <span className="font-mono font-bold text-white tabular-nums">
                ₹{materialAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Delivery Charge (₹):</span>
              <input
                type="number"
                value={deliveryCharge}
                onChange={e => setDeliveryCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-right font-mono font-semibold bg-slate-800 text-white rounded py-1 px-2 border border-slate-700 text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Other Charges (₹):</span>
              <input
                type="number"
                value={otherCharges}
                onChange={e => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-right font-mono font-semibold bg-slate-800 text-white rounded py-1 px-2 border border-slate-700 text-xs"
              />
            </div>

            <div className="flex items-center justify-between text-emerald-400">
              <span>Discount (₹):</span>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-right font-mono font-semibold bg-slate-800 text-emerald-400 rounded py-1 px-2 border border-slate-700 text-xs"
              />
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t-2 border-slate-700 flex items-baseline justify-between">
              <div>
                <p className="text-xs font-black uppercase text-amber-400">Grand Total</p>
                <p className="text-[10px] text-slate-400">Net Payable</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-white tabular-nums tracking-tight">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & Paid Now */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Payment Method</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(['Cash', 'UPI', 'Bank Transfer', 'Credit/Pending'] as PaymentMethod[]).map(pm => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-2 rounded text-xs font-semibold text-center transition-colors border ${
                    paymentMethod === pm
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-300">Paid Now (₹):</span>
              <input
                type="number"
                value={paidNow}
                onChange={e => setPaidNow(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-28 text-right font-mono font-bold bg-slate-950 text-emerald-400 rounded py-1 px-2 border border-slate-700 text-xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Balance Pending:</span>
              <span className="font-bold text-amber-400">
                ₹{Math.max(0, grandTotal - paidNow).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Trigger Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => handleGenerateBill('invoice_a4')}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              GENERATE & PRINT A4 INVOICE
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenerateBill('thermal_receipt')}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Thermal Slip
              </button>

              <button
                type="button"
                onClick={() => handleGenerateBill('delivery_challan')}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                Trip Challan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT INVOICES LEDGER TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Counter Bills</h3>
            <p className="text-xs text-slate-500">Instant reprint, trip sheet or WhatsApp dispatch</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Invoice No</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Material</th>
                <th className="py-2.5 px-4 text-right">Total (₹)</th>
                <th className="py-2.5 px-4">Driver & Vehicle</th>
                <th className="py-2.5 px-4">Payment</th>
                <th className="py-2.5 px-4 text-center">Print / Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {invoices.slice(0, 6).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{inv.invoice_no}</td>
                  <td className="py-3 px-4 text-slate-600">{inv.date}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">
                    {inv.customer_name}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700">
                    {inv.items.map(i => `${i.material_name} (${i.quantity} ${i.unit})`).join(', ')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                    ₹{inv.grand_total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600">
                    {inv.driver_name || 'Pending'} {inv.vehicle_number && `(${inv.vehicle_number})`}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.payment_status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.payment_status === 'Partially Paid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-sans">
                      <button
                        onClick={() => {
                          setActiveInvoiceForPrint(inv);
                          setPrintDocType('invoice_a4');
                          setPrintModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Print A4 Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveInvoiceForPrint(inv);
                          setPrintDocType('thermal_receipt');
                          setPrintModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Print Thermal Slip"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      {showQuickCustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Quick Add Customer</h3>
            <p className="text-xs text-slate-500 mb-4">Add new buyer directly from the billing desk</p>

            <form onSubmit={handleCreateQuickCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Constructions"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 98401 23456"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:border-amber-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Location (Chennai)</label>
                <input
                  type="text"
                  value={newCustLocation}
                  onChange={e => setNewCustLocation(e.target.value)}
                  placeholder="e.g. Velachery, Guindy, Porur..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Category</label>
                <select
                  value={newCustType}
                  onChange={e => setNewCustType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="Contractor">Contractor</option>
                  <option value="Builder">Builder</option>
                  <option value="Individual">Individual Owner</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickCustModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PRINT MODAL */}
      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType={printDocType}
        invoice={activeInvoiceForPrint}
        load={activeLoadForPrint}
        settings={settings}
      />
    </div>
  );
};
