export type UserRole = 'super_admin' | 'manager' | 'billing_staff' | 'staff' | 'driver';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone: string;
  pin: string;
  driver_id?: string;
  is_active: boolean;
  avatar?: string;
}

export type CustomerType = 'Contractor' | 'Individual' | 'Builder' | 'Infrastructure' | 'Other';

export interface Customer {
  id: string;
  customer_no: string;
  name: string;
  mobile: string;
  whatsapp?: string;
  address: string;
  delivery_location: string;
  customer_type: CustomerType;
  gst_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type MaterialUnit = 'Load' | 'Unit' | 'Ton' | 'Cubic Feet' | 'Cubic Meter' | 'Trip' | 'Job';
export type MaterialCategory = 'material' | 'service';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  selling_rate: number;
  cost_estimate: number;
  driver_default_rate: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Driver Assigned' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit/Pending';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending';

export interface Order {
  id: string;
  order_no: string;
  date: string; // DD-MM-YYYY
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  material_id: string;
  material_name: string;
  quantity: number;
  unit: MaterialUnit;
  rate: number;
  material_amount: number;
  delivery_charge: number;
  other_charges: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_location: string;
  delivery_date: string; // DD-MM-YYYY
  urgent_delivery: boolean;
  assigned_driver_id?: string;
  assigned_driver_name?: string;
  assigned_vehicle_id?: string;
  assigned_vehicle_number?: string;
  notes?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Load {
  id: string;
  load_no: string;
  order_id: string;
  order_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  material_id: string;
  material_name: string;
  quantity: number;
  unit: MaterialUnit;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_number: string;
  delivery_location: string;
  date: string; // DD-MM-YYYY
  driver_rate: number;
  driver_earnings: number;
  status: OrderStatus;
  urgent: boolean;
  notes?: string;
  accepted_at?: string;
  dispatched_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export type DriverSalaryType = 'Per Load' | 'Daily Wage' | 'Monthly Salary' | 'Custom';
export type DriverStatus = 'Active' | 'On Leave' | 'Inactive';

export interface Driver {
  id: string;
  driver_no: string;
  name: string;
  mobile: string;
  alt_mobile?: string;
  address: string;
  licence_no: string;
  licence_expiry: string; // YYYY-MM-DD
  joining_date: string; // YYYY-MM-DD
  assigned_vehicle_id?: string;
  salary_type: DriverSalaryType;
  rate_per_load: number;
  daily_wage?: number;
  monthly_salary?: number;
  bank_account?: string;
  bank_ifsc?: string;
  upi_id?: string;
  emergency_contact: string;
  status: DriverStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverAdvance {
  id: string;
  advance_no: string;
  driver_id: string;
  driver_name: string;
  date: string; // DD-MM-YYYY
  month: string; // YYYY-MM
  amount: number;
  reason: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface DriverSalaryRecord {
  id: string;
  month: string; // YYYY-MM
  driver_id: string;
  driver_name: string;
  completed_loads: number;
  rate_per_load: number;
  load_earnings: number;
  bonus: number;
  other_earnings: number;
  advances_deducted: number;
  other_deductions: number;
  net_salary: number;
  status: 'Draft' | 'Approved' | 'Paid';
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type VehicleStatus = 'Available' | 'Assigned' | 'Under Maintenance' | 'Inactive';
export type VehicleType = 'Tipper 6-Wheeler' | 'Tipper 10-Wheeler' | 'Mini Truck' | 'Tractor' | 'JCB / Excavator' | 'Other';

export interface Vehicle {
  id: string;
  vehicle_no: string; // e.g. TN 05 AK 4589
  type: VehicleType;
  capacity: string; // e.g. "2.5 Units / 12 Tons"
  assigned_driver_id?: string;
  assigned_driver_name?: string;
  insurance_expiry: string; // YYYY-MM-DD
  fitness_expiry: string; // YYYY-MM-DD (FC)
  permit_expiry: string; // YYYY-MM-DD
  pollution_expiry: string; // YYYY-MM-DD (PUC)
  status: VehicleStatus;
  loads_completed: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: MaterialUnit;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_no: string; // e.g. MT-2026-00001
  order_id: string;
  order_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_location: string;
  date: string; // DD-MM-YYYY
  items: InvoiceItem[];
  subtotal: number;
  delivery_charge: number;
  other_charges: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  driver_id?: string;
  driver_name?: string;
  vehicle_id?: string;
  vehicle_number?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface Payment {
  id: string;
  payment_no: string;
  invoice_id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  date: string; // DD-MM-YYYY
  amount: number;
  payment_method: PaymentMethod;
  reference_no?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export type ExpenseCategory = 'Fuel' | 'Vehicle Maintenance' | 'Driver Advance' | 'Salary' | 'Repairs' | 'Office Expenses' | 'Other';

export interface Expense {
  id: string;
  expense_no: string;
  date: string; // DD-MM-YYYY
  category: ExpenseCategory;
  vehicle_id?: string;
  vehicle_number?: string;
  driver_id?: string;
  driver_name?: string;
  amount: number;
  payment_method: PaymentMethod;
  description: string;
  receipt_ref?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'payment' | 'driver' | 'vehicle' | 'salary' | 'system';
  read: boolean;
  link_tab?: string;
  link_id?: string;
  created_at: string;
}

export interface DailyBackupSnapshot {
  id: string;
  date_key: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  file_name: string;
  size_kb: string;
  record_counts: {
    orders: number;
    loads: number;
    customers: number;
    invoices: number;
    drivers: number;
    vehicles: number;
  };
  json_content: string;
}

export interface AppSettings {
  business_name: string;
  tagline: string;
  address_line1: string;
  address_line2: string;
  city: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  invoice_prefix: string;
  current_invoice_seq: number;
  current_order_seq: number;
  current_load_seq: number;
  default_driver_load_rate: number;
  enable_gst: boolean;
  gstin: string;
  invoice_footer: string;
  bank_name: string;
  bank_account_no: string;
  bank_ifsc: string;
  upi_id: string;
  logo_url?: string;
  auto_backup_enabled?: boolean;
  auto_backup_mode?: 'local_storage' | 'prompt_download' | 'both';
  last_auto_backup_at?: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  details: string;
  timestamp: string;
}
