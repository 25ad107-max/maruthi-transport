import React, { useRef } from 'react';
import { Invoice, Load, DriverSalaryRecord, Payment, AppSettings } from '../../types';
import { Printer, Download, MessageSquare, X, CheckCircle, Truck, FileText } from 'lucide-react';

export type PrintDocumentType = 'invoice_a4' | 'thermal_receipt' | 'delivery_challan' | 'payment_receipt' | 'salary_slip';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: PrintDocumentType;
  invoice?: Invoice;
  load?: Load;
  salaryRecord?: DriverSalaryRecord;
  payment?: Payment;
  settings: AppSettings;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  documentType,
  invoice,
  load,
  salaryRecord,
  payment,
  settings
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Document - ${settings.business_name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; color: #1e293b; }
              .font-mono { font-family: 'JetBrains Mono', monospace; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
              th { background-color: #f8fafc; font-weight: 600; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
              .footer { margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleShareWhatsApp = () => {
    let text = '';
    let phone = '';

    if (invoice) {
      phone = invoice.customer_phone?.replace(/[^0-9]/g, '') || '';
      text = `*${settings.business_name} - INVOICE*\n` +
        `Invoice No: ${invoice.invoice_no}\n` +
        `Date: ${invoice.date}\n` +
        `Customer: ${invoice.customer_name}\n` +
        `Material: ${invoice.items.map(i => `${i.material_name} (${i.quantity} ${i.unit})`).join(', ')}\n` +
        `Grand Total: ₹${invoice.grand_total.toLocaleString('en-IN')}\n` +
        `Paid: ₹${invoice.paid_amount.toLocaleString('en-IN')}\n` +
        `Balance: ₹${invoice.pending_amount.toLocaleString('en-IN')}\n` +
        `Driver: ${invoice.driver_name || 'Assigned'} | Vehicle: ${invoice.vehicle_number || '-'}\n` +
        `Thank you for choosing Maruthi Transport Chennai!`;
    } else if (load) {
      phone = load.customer_phone?.replace(/[^0-9]/g, '') || '';
      text = `*${settings.business_name} - DELIVERY CHALLAN*\n` +
        `Challan No: ${load.load_no}\n` +
        `Material: ${load.material_name} (${load.quantity} ${load.unit})\n` +
        `Location: ${load.delivery_location}\n` +
        `Driver: ${load.driver_name} | Vehicle: ${load.vehicle_number}\n` +
        `Status: ${load.status}`;
    }

    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              {documentType === 'invoice_a4' && <FileText className="w-5 h-5" />}
              {documentType === 'thermal_receipt' && <Printer className="w-5 h-5" />}
              {documentType === 'delivery_challan' && <Truck className="w-5 h-5" />}
              {documentType === 'payment_receipt' && <CheckCircle className="w-5 h-5" />}
              {documentType === 'salary_slip' && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {documentType.replace('_', ' ')}
              </h3>
              <p className="text-xs text-slate-500">Official document for printing and digital dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Download / Save
            </button>
            {(invoice?.customer_phone || load?.customer_phone) && (
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Canvas */}
        <div className="p-8 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className={`printable-area bg-white text-slate-900 shadow-sm border border-slate-300 p-8 ${
              documentType === 'thermal_receipt' ? 'w-[320px] text-xs' : 'w-full max-w-[800px]'
            }`}
          >
            {/* DOCUMENT 1: A4 INVOICE */}
            {documentType === 'invoice_a4' && invoice && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                  <div className="flex items-start gap-4">
                    {settings.logo_url && (
                      <img
                        src={settings.logo_url}
                        alt="Maruthi Transport Logo"
                        className="w-16 h-16 rounded-lg object-contain border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        {settings.business_name}
                      </h1>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                        Construction Material Supply & Transport
                      </p>
                      <p className="text-xs text-slate-600 mt-1">In and Around Chennai</p>
                      <p className="text-xs text-slate-500">
                        {settings.address_line1}, {settings.city} - {settings.pincode}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        Phone: {settings.phone} | WhatsApp: {settings.whatsapp}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase rounded-md tracking-wider">
                      Tax / Commercial Invoice
                    </span>
                    <div className="mt-2 text-xs space-y-0.5">
                      <p className="text-slate-500">Invoice No:</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{invoice.invoice_no}</p>
                      <p className="text-slate-500 mt-1">Date: <span className="text-slate-900 font-medium font-mono">{invoice.date}</span></p>
                      {settings.enable_gst && settings.gstin && (
                        <p className="text-slate-500 font-mono">GSTIN: {settings.gstin}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer & Delivery Block */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Billed To (Customer):</p>
                    <p className="font-bold text-slate-900 text-sm">{invoice.customer_name}</p>
                    <p className="text-slate-600">{invoice.customer_address || 'Chennai Site'}</p>
                    <p className="text-slate-600 font-mono mt-1">Phone: {invoice.customer_phone}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Delivery Details:</p>
                    <p className="text-slate-900 font-semibold">{invoice.delivery_location}</p>
                    <p className="text-slate-600 mt-1">
                      Assigned Driver: <span className="font-medium text-slate-900">{invoice.driver_name || 'Pending assignment'}</span>
                    </p>
                    <p className="text-slate-600">
                      Vehicle Number: <span className="font-mono font-bold text-slate-900">{invoice.vehicle_number || '-'}</span>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-bold border-b border-slate-200">S.No</th>
                      <th className="py-2.5 px-3 text-left font-bold border-b border-slate-200">Material / Service Description</th>
                      <th className="py-2.5 px-3 text-center font-bold border-b border-slate-200">Quantity</th>
                      <th className="py-2.5 px-3 text-right font-bold border-b border-slate-200">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right font-bold border-b border-slate-200">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-left text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-left font-sans font-medium text-slate-900">
                          {item.material_name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                          ₹{item.rate.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals & Payment Summary */}
                <div className="flex justify-between items-start pt-2">
                  <div className="text-xs space-y-2 max-w-sm">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Bank / UPI Settlement Details:</p>
                      <p className="text-slate-600 font-mono">Bank: {settings.bank_name}</p>
                      <p className="text-slate-600 font-mono">A/C: {settings.bank_account_no}</p>
                      <p className="text-slate-600 font-mono">IFSC: {settings.bank_ifsc}</p>
                      <p className="text-slate-800 font-mono font-semibold mt-1">UPI ID: {settings.upi_id}</p>
                    </div>
                    {invoice.notes && (
                      <p className="text-slate-500 italic">Notes: {invoice.notes}</p>
                    )}
                  </div>

                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Material Subtotal:</span>
                      <span className="font-mono font-semibold tabular-nums">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Delivery & Transport Charge:</span>
                      <span className="font-mono font-semibold tabular-nums">+ ₹{invoice.delivery_charge.toLocaleString('en-IN')}</span>
                    </div>
                    {invoice.other_charges > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Other Charges:</span>
                        <span className="font-mono font-semibold tabular-nums">+ ₹{invoice.other_charges.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {invoice.discount > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-mono font-semibold tabular-nums">- ₹{invoice.discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold">
                      <span className="text-slate-900">Grand Total:</span>
                      <span className="font-mono text-slate-900 tabular-nums">₹{invoice.grand_total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-700 font-mono">
                      <span>Paid Amount:</span>
                      <span className="tabular-nums font-semibold text-emerald-600">₹{invoice.paid_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-700 font-mono font-bold bg-amber-50 px-2 py-1 rounded">
                      <span className="text-amber-900">Balance Pending:</span>
                      <span className="tabular-nums text-amber-900">₹{invoice.pending_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                        invoice.payment_status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : invoice.payment_status === 'Partially Paid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        Status: {invoice.payment_status} ({invoice.payment_method})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-10 border-t border-slate-200 mt-8 flex justify-between items-end text-xs">
                  <div>
                    <p className="text-slate-500 italic max-w-sm">{settings.invoice_footer}</p>
                    <p className="text-slate-400 mt-2 text-[10px]">Generated electronically by Maruthi Transport Management System</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-400 mb-1"></div>
                    <p className="font-bold text-slate-800">For MARUTHI TRANSPORT</p>
                    <p className="text-slate-500 text-[10px]">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT 2: THERMAL RECEIPT (80mm) */}
            {documentType === 'thermal_receipt' && invoice && (
              <div className="font-mono text-[11px] leading-relaxed text-slate-900 space-y-2">
                <div className="text-center border-b border-dashed border-slate-400 pb-2">
                  <h2 className="font-black text-sm uppercase">{settings.business_name}</h2>
                  <p className="text-[10px]">Chennai & Suburbs</p>
                  <p className="text-[10px]">Tel: {settings.phone}</p>
                  <p className="text-[10px] mt-1">CASH / DELIVERY RECEIPT</p>
                </div>

                <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5">
                  <p>Bill: {invoice.invoice_no}</p>
                  <p>Date: {invoice.date}</p>
                  <p>Customer: {invoice.customer_name}</p>
                  <p>Phone: {invoice.customer_phone}</p>
                  <p>Vehicle: {invoice.vehicle_number || '-'}</p>
                </div>

                <div className="border-b border-dashed border-slate-400 pb-2">
                  {invoice.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between py-0.5">
                      <span>{i.material_name} ({i.quantity}{i.unit})</span>
                      <span className="font-bold">₹{i.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>Delivery Charge</span>
                    <span>₹{invoice.delivery_charge}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-0.5 text-slate-600">
                      <span>Discount</span>
                      <span>-₹{invoice.discount}</span>
                    </div>
                  )}
                </div>

                <div className="border-b border-dashed border-slate-400 pb-2 space-y-0.5">
                  <div className="flex justify-between font-bold text-xs">
                    <span>NET TOTAL:</span>
                    <span>₹{invoice.grand_total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PAID NOW:</span>
                    <span>₹{invoice.paid_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>BALANCE:</span>
                    <span>₹{invoice.pending_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[10px] text-right mt-1">Mode: {invoice.payment_method}</p>
                </div>

                <div className="text-center pt-2 text-[10px] text-slate-600">
                  <p>Thank you! Visit again.</p>
                  <p>Goods once unloaded cannot be returned.</p>
                </div>
              </div>
            )}

            {/* DOCUMENT 3: DELIVERY CHALLAN / TRIP SHEET */}
            {documentType === 'delivery_challan' && load && (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900">{settings.business_name}</h1>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                      Delivery Challan & Driver Trip Sheet
                    </p>
                    <p className="text-xs text-slate-500">Poonamallee High Road, Chennai · {settings.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-slate-900">Challan: {load.load_no}</p>
                    <p className="font-mono text-xs text-slate-600">Order: {load.order_no}</p>
                    <p className="font-mono text-xs text-slate-500">Date: {load.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-slate-500 uppercase font-bold">Delivery Site & Client:</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{load.customer_name}</p>
                    <p className="text-slate-700 font-medium mt-1">{load.delivery_location}</p>
                    <p className="text-slate-600 font-mono mt-1">Contact: {load.customer_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase font-bold">Vehicle & Driver Details:</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">Vehicle No: <span className="font-mono">{load.vehicle_number}</span></p>
                    <p className="text-slate-700 font-medium">Driver: {load.driver_name}</p>
                    <p className="text-slate-600 font-mono">Driver Trip Rate: ₹{load.driver_rate}</p>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-md overflow-hidden text-xs">
                  <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300 flex justify-between">
                    <span>Material Loaded</span>
                    <span>Quantity</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between font-mono text-sm font-semibold">
                    <span className="font-sans">{load.material_name}</span>
                    <span>{load.quantity} {load.unit}</span>
                  </div>
                </div>

                {load.notes && (
                  <p className="text-xs text-slate-600 italic">Special Instructions: {load.notes}</p>
                )}

                <div className="pt-16 grid grid-cols-3 gap-6 text-xs text-center border-t border-slate-200 mt-8">
                  <div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <p className="font-bold text-slate-800">Yard Dispatcher</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <p className="font-bold text-slate-800">Driver Signature</p>
                    <p className="text-[10px] text-slate-500">({load.driver_name})</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1"></div>
                    <p className="font-bold text-slate-800">Customer Site Receiver</p>
                    <p className="text-[10px] text-slate-500">(Sign & Stamp upon Unload)</p>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT 4: DRIVER SALARY SLIP */}
            {documentType === 'salary_slip' && salaryRecord && (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900">{settings.business_name}</h1>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                      Driver Monthly Salary Statement
                    </p>
                    <p className="text-xs text-slate-500">Chennai Fleet Operations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-slate-900">Month: {salaryRecord.month}</p>
                    <p className="text-xs text-slate-500">Generated: {new Date().toLocaleDateString('en-GB')}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded mt-1 ${
                      salaryRecord.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {salaryRecord.status}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                  <p className="font-bold text-slate-800 text-sm">Driver: {salaryRecord.driver_name}</p>
                  <p className="text-slate-600 mt-0.5">Pay Basis: Per Delivered Load (Rate: ₹{salaryRecord.rate_per_load}/load)</p>
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs">
                  {/* Earnings */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                    <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">Earnings</p>
                    <div className="flex justify-between font-mono">
                      <span>Completed Loads ({salaryRecord.completed_loads} × ₹{salaryRecord.rate_per_load}):</span>
                      <span className="font-bold">₹{salaryRecord.load_earnings.toLocaleString('en-IN')}</span>
                    </div>
                    {salaryRecord.bonus > 0 && (
                      <div className="flex justify-between font-mono text-emerald-700">
                        <span>Attendance / Performance Bonus:</span>
                        <span>+ ₹{salaryRecord.bonus.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {salaryRecord.other_earnings > 0 && (
                      <div className="flex justify-between font-mono">
                        <span>Other Allowances:</span>
                        <span>+ ₹{salaryRecord.other_earnings.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-mono font-bold pt-2 border-t border-slate-200">
                      <span>Total Gross Earnings:</span>
                      <span>₹{(salaryRecord.load_earnings + salaryRecord.bonus + salaryRecord.other_earnings).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                    <p className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">Deductions</p>
                    <div className="flex justify-between font-mono text-amber-800">
                      <span>Advance Deductions:</span>
                      <span>- ₹{salaryRecord.advances_deducted.toLocaleString('en-IN')}</span>
                    </div>
                    {salaryRecord.other_deductions > 0 && (
                      <div className="flex justify-between font-mono text-amber-800">
                        <span>Other Penalties / Deductions:</span>
                        <span>- ₹{salaryRecord.other_deductions.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-mono font-bold pt-2 border-t border-slate-200 text-amber-900">
                      <span>Total Deductions:</span>
                      <span>- ₹{(salaryRecord.advances_deducted + salaryRecord.other_deductions).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs uppercase font-medium text-slate-300">Net Salary Payable</p>
                    <p className="text-[11px] text-slate-400">Formula: Load Earnings + Bonus - Advances - Deductions</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-black text-amber-400">
                      ₹{salaryRecord.net_salary.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-12 flex justify-between items-end text-xs border-t border-slate-200">
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <p className="font-medium text-slate-700">Driver Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <p className="font-bold text-slate-900">Manager / Admin</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
