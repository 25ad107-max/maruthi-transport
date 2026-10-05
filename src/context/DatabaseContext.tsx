import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppSettings,
  Customer,
  Material,
  Order,
  Load,
  Driver,
  DriverAdvance,
  DriverSalaryRecord,
  Vehicle,
  Invoice,
  Payment,
  Expense,
  NotificationItem,
  AuditLog,
  OrderStatus,
  PaymentMethod,
  DailyBackupSnapshot
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_MATERIALS,
  INITIAL_DRIVERS,
  INITIAL_VEHICLES,
  INITIAL_ORDERS,
  INITIAL_LOADS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_DRIVER_ADVANCES,
  INITIAL_SALARY_RECORDS,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS
} from '../data/mockData';

interface DatabaseContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'customer_no' | 'created_at' | 'updated_at' | 'is_active'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  materials: Material[];
  addMaterial: (mat: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => Material;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  orders: Order[];
  createOrder: (orderData: {
    customer_id: string;
    material_id: string;
    quantity: number;
    rate?: number;
    delivery_charge?: number;
    other_charges?: number;
    discount?: number;
    payment_method: PaymentMethod;
    paid_now_amount?: number;
    delivery_location?: string;
    delivery_date?: string;
    urgent_delivery?: boolean;
    assigned_driver_id?: string;
    assigned_vehicle_id?: string;
    notes?: string;
    created_by?: string;
  }) => { order: Order; load: Load; invoice: Invoice };
  updateOrderStatus: (orderId: string, status: OrderStatus, updatedBy?: string) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;

  loads: Load[];
  addAdditionalLoad: (orderId: string, loadData: {
    driver_id: string;
    vehicle_id: string;
    quantity: number;
    date: string;
    driver_rate?: number;
    notes?: string;
  }) => Load;
  updateLoadStatus: (loadId: string, status: OrderStatus, updatedBy?: string) => void;
  reassignLoad: (loadId: string, driverId: string, vehicleId: string, driverRate?: number) => void;

  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id' | 'driver_no' | 'created_at' | 'updated_at'>) => Driver;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  driverAdvances: DriverAdvance[];
  recordDriverAdvance: (advance: {
    driver_id: string;
    amount: number;
    date: string;
    month: string;
    reason: string;
    payment_method: string;
    notes?: string;
    created_by?: string;
  }) => DriverAdvance;

  salaryRecords: DriverSalaryRecord[];
  calculateMonthlySalary: (driverId: string, month: string) => {
    completedLoads: number;
    ratePerLoad: number;
    loadEarnings: number;
    bonus: number;
    otherEarnings: number;
    advancesDeducted: number;
    otherDeductions: number;
    netSalary: number;
  };
  saveSalaryRecord: (record: Omit<DriverSalaryRecord, 'id' | 'created_at' | 'updated_at'>) => DriverSalaryRecord;
  updateSalaryRecord: (id: string, updates: Partial<DriverSalaryRecord>) => void;

  vehicles: Vehicle[];
  addVehicle: (veh: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'loads_completed'>) => Vehicle;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  invoices: Invoice[];
  payments: Payment[];
  recordPayment: (paymentData: {
    invoice_id: string;
    amount: number;
    date: string;
    payment_method: PaymentMethod;
    reference_no?: string;
    notes?: string;
    created_by?: string;
  }) => Payment;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'expense_no' | 'created_at'>) => Expense;
  deleteExpense: (id: string) => void;

  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, userName?: string) => void;

  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
  resetDatabaseToDefault: () => void;

  dailySnapshots: DailyBackupSnapshot[];
  createDailyBackupSnapshot: (downloadFile?: boolean) => DailyBackupSnapshot;
  restoreDailySnapshot: (snapshotId: string) => Promise<{ success: boolean; error?: string }>;
  deleteDailySnapshot: (snapshotId: string) => void;
  clearAllDailySnapshots: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'maruthi_transport_v2_';

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return defaultValue;
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => loadStorage('settings', INITIAL_SETTINGS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStorage('customers', INITIAL_CUSTOMERS));
  const [materials, setMaterials] = useState<Material[]>(() => loadStorage('materials', INITIAL_MATERIALS));
  const [drivers, setDrivers] = useState<Driver[]>(() => loadStorage('drivers', INITIAL_DRIVERS));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadStorage('vehicles', INITIAL_VEHICLES));
  const [orders, setOrders] = useState<Order[]>(() => loadStorage('orders', INITIAL_ORDERS));
  const [loads, setLoads] = useState<Load[]>(() => loadStorage('loads', INITIAL_LOADS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadStorage('invoices', INITIAL_INVOICES));
  const [payments, setPayments] = useState<Payment[]>(() => loadStorage('payments', INITIAL_PAYMENTS));
  const [driverAdvances, setDriverAdvances] = useState<DriverAdvance[]>(() => loadStorage('advances', INITIAL_DRIVER_ADVANCES));
  const [salaryRecords, setSalaryRecords] = useState<DriverSalaryRecord[]>(() => loadStorage('salary_records', INITIAL_SALARY_RECORDS));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStorage('expenses', INITIAL_EXPENSES));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadStorage('notifications', INITIAL_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStorage('audit_logs', INITIAL_AUDIT_LOGS));
  const [dailySnapshots, setDailySnapshots] = useState<DailyBackupSnapshot[]>(() =>
    loadStorage<DailyBackupSnapshot[]>('daily_snapshots', [])
  );

  useEffect(() => saveStorage('settings', settings), [settings]);
  useEffect(() => saveStorage('customers', customers), [customers]);
  useEffect(() => saveStorage('materials', materials), [materials]);
  useEffect(() => saveStorage('drivers', drivers), [drivers]);
  useEffect(() => saveStorage('vehicles', vehicles), [vehicles]);
  useEffect(() => saveStorage('orders', orders), [orders]);
  useEffect(() => saveStorage('loads', loads), [loads]);
  useEffect(() => saveStorage('invoices', invoices), [invoices]);
  useEffect(() => saveStorage('payments', payments), [payments]);
  useEffect(() => saveStorage('advances', driverAdvances), [driverAdvances]);
  useEffect(() => saveStorage('salary_records', salaryRecords), [salaryRecords]);
  useEffect(() => saveStorage('expenses', expenses), [expenses]);
  useEffect(() => saveStorage('notifications', notifications), [notifications]);
  useEffect(() => saveStorage('audit_logs', auditLogs), [auditLogs]);
  useEffect(() => saveStorage('daily_snapshots', dailySnapshots), [dailySnapshots]);

  // Hydrate from Express backend database on startup
  useEffect(() => {
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then(data => {
        if (data && data.customers && data.orders) {
          if (data.settings) setSettings(data.settings);
          if (data.customers) setCustomers(data.customers);
          if (data.materials) setMaterials(data.materials);
          if (data.drivers) setDrivers(data.drivers);
          if (data.vehicles) setVehicles(data.vehicles);
          if (data.orders) setOrders(data.orders);
          if (data.loads) setLoads(data.loads);
          if (data.invoices) setInvoices(data.invoices);
          if (data.payments) setPayments(data.payments);
          if (data.advances) setDriverAdvances(data.advances);
          if (data.salary_records) setSalaryRecords(data.salary_records);
          if (data.expenses) setExpenses(data.expenses);
          if (data.notifications) setNotifications(data.notifications);
          if (data.audit_logs) setAuditLogs(data.audit_logs);
        }
      })
      .catch(err => {
        console.log('Using local client database state (backend syncing in progress):', err);
      });
  }, []);

  // Sync to Express backend storage in the background
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          customers,
          materials,
          drivers,
          vehicles,
          orders,
          loads,
          invoices,
          payments,
          advances: driverAdvances,
          salary_records: salaryRecords,
          expenses,
          notifications,
          audit_logs: auditLogs
        })
      }).catch(() => {
        // quiet error handling
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [settings, customers, materials, drivers, vehicles, orders, loads, invoices, payments, driverAdvances, salaryRecords, expenses, notifications, auditLogs]);

  const addAuditLog = (action: string, details: string, userName = 'Admin') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_name: userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      read: false,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog('SETTINGS_UPDATE', 'Updated business configurations & parameters');
  };

  // Customers
  const addCustomer = (custData: Omit<Customer, 'id' | 'customer_no' | 'created_at' | 'updated_at' | 'is_active'>): Customer => {
    const nextNum = customers.length + 1;
    const customerNo = `CUST-${String(nextNum).padStart(3, '0')}`;
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      customer_no: customerNo,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCustomers(prev => [newCust, ...prev]);
    addAuditLog('ADD_CUSTOMER', `Added customer ${newCust.name} (${customerNo})`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );
    addAuditLog('UPDATE_CUSTOMER', `Updated customer details for ID ${id}`);
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, is_active: false, updated_at: new Date().toISOString() } : c))
    );
    addAuditLog('DEACTIVATE_CUSTOMER', `Deactivated customer ID ${id}`);
  };

  // Materials
  const addMaterial = (matData: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Material => {
    const newMat: Material = {
      ...matData,
      id: `mat-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setMaterials(prev => [...prev, newMat]);
    addAuditLog('ADD_MATERIAL', `Added material/service: ${newMat.name}`);
    return newMat;
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m))
    );
    addAuditLog('UPDATE_MATERIAL', `Updated rates/details for material ID ${id}`);
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev =>
      prev.map(m => (m.id === id ? { ...m, is_active: false, updated_at: new Date().toISOString() } : m))
    );
    addAuditLog('DEACTIVATE_MATERIAL', `Deactivated material ID ${id}`);
  };

  // Drivers
  const addDriver = (driverData: Omit<Driver, 'id' | 'driver_no' | 'created_at' | 'updated_at'>): Driver => {
    const nextNum = drivers.length + 1;
    const driverNo = `DRV-${String(nextNum).padStart(2, '0')}`;
    const newDriver: Driver = {
      ...driverData,
      id: `drv-${Date.now()}`,
      driver_no: driverNo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setDrivers(prev => [...prev, newDriver]);
    addAuditLog('ADD_DRIVER', `Registered driver ${newDriver.name} (${driverNo})`);
    return newDriver;
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d))
    );
    addAuditLog('UPDATE_DRIVER', `Updated driver profile for ID ${id}`);
  };

  const deleteDriver = (id: string) => {
    setDrivers(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'Inactive', updated_at: new Date().toISOString() } : d))
    );
    addAuditLog('DEACTIVATE_DRIVER', `Set driver ID ${id} to Inactive`);
  };

  // Driver Advances
  const recordDriverAdvance = (advanceData: {
    driver_id: string;
    amount: number;
    date: string;
    month: string;
    reason: string;
    payment_method: string;
    notes?: string;
    created_by?: string;
  }): DriverAdvance => {
    const driver = drivers.find(d => d.id === advanceData.driver_id);
    const nextNum = driverAdvances.length + 1;
    const advanceNo = `ADV-${String(nextNum).padStart(4, '0')}`;

    const newAdvance: DriverAdvance = {
      ...advanceData,
      id: `adv-${Date.now()}`,
      advance_no: advanceNo,
      driver_name: driver ? driver.name : 'Unknown Driver',
      created_at: new Date().toISOString(),
      created_by: advanceData.created_by || 'Admin'
    };

    setDriverAdvances(prev => [newAdvance, ...prev]);

    // Also record an expense under 'Driver Advance'
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expense_no: `EXP-${Date.now().toString().slice(-5)}`,
      date: advanceData.date,
      category: 'Driver Advance',
      driver_id: advanceData.driver_id,
      driver_name: driver ? driver.name : undefined,
      amount: advanceData.amount,
      payment_method: (advanceData.payment_method as PaymentMethod) || 'Cash',
      description: `Advance to ${driver?.name || 'Driver'}: ${advanceData.reason}`,
      created_at: new Date().toISOString(),
      created_by: advanceData.created_by || 'Admin'
    };
    setExpenses(prev => [newExpense, ...prev]);

    addAuditLog('DRIVER_ADVANCE', `Recorded advance ₹${advanceData.amount} for ${driver?.name || 'Driver'}`);
    addNotification({
      title: 'Driver Advance Given',
      message: `Advance ₹${advanceData.amount} issued to ${driver?.name || 'Driver'}. Auto-deducting from month salary.`,
      type: 'salary',
      link_tab: 'salary'
    });

    return newAdvance;
  };

  // Vehicles
  const addVehicle = (vehData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'loads_completed'>): Vehicle => {
    const driver = vehData.assigned_driver_id ? drivers.find(d => d.id === vehData.assigned_driver_id) : undefined;
    const newVeh: Vehicle = {
      ...vehData,
      id: `veh-${Date.now()}`,
      assigned_driver_name: driver?.name,
      loads_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setVehicles(prev => [...prev, newVeh]);
    addAuditLog('ADD_VEHICLE', `Added vehicle ${newVeh.vehicle_no}`);
    return newVeh;
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev =>
      prev.map(v => {
        if (v.id !== id) return v;
        const driverName = updates.assigned_driver_id
          ? drivers.find(d => d.id === updates.assigned_driver_id)?.name
          : v.assigned_driver_name;
        return {
          ...v,
          ...updates,
          assigned_driver_name: driverName,
          updated_at: new Date().toISOString()
        };
      })
    );
    addAuditLog('UPDATE_VEHICLE', `Updated vehicle details for ID ${id}`);
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev =>
      prev.map(v => (v.id === id ? { ...v, status: 'Inactive', updated_at: new Date().toISOString() } : v))
    );
    addAuditLog('DEACTIVATE_VEHICLE', `Set vehicle ID ${id} to Inactive`);
  };

  // Orders, Loads & Fast Billing Engine
  const createOrder = (orderData: {
    customer_id: string;
    material_id: string;
    quantity: number;
    rate?: number;
    delivery_charge?: number;
    other_charges?: number;
    discount?: number;
    payment_method: PaymentMethod;
    paid_now_amount?: number;
    delivery_location?: string;
    delivery_date?: string;
    urgent_delivery?: boolean;
    assigned_driver_id?: string;
    assigned_vehicle_id?: string;
    notes?: string;
    created_by?: string;
  }) => {
    const customer = customers.find(c => c.id === orderData.customer_id);
    const material = materials.find(m => m.id === orderData.material_id);
    const driver = orderData.assigned_driver_id ? drivers.find(d => d.id === orderData.assigned_driver_id) : undefined;
    const vehicle = orderData.assigned_vehicle_id ? vehicles.find(v => v.id === orderData.assigned_vehicle_id) : undefined;

    const rate = orderData.rate !== undefined ? orderData.rate : (material ? material.selling_rate : 0);
    const quantity = orderData.quantity;
    const material_amount = rate * quantity;
    const delivery_charge = orderData.delivery_charge || 0;
    const other_charges = orderData.other_charges || 0;
    const discount = orderData.discount || 0;
    const total_amount = Math.max(0, material_amount + delivery_charge + other_charges - discount);

    const paid_now = orderData.paid_now_amount !== undefined ? orderData.paid_now_amount : (orderData.payment_method !== 'Credit/Pending' ? total_amount : 0);
    const pending_amount = Math.max(0, total_amount - paid_now);

    let payment_status: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (paid_now >= total_amount && total_amount > 0) {
      payment_status = 'Paid';
    } else if (paid_now > 0) {
      payment_status = 'Partially Paid';
    }

    const orderSeq = settings.current_order_seq + 1;
    const invoiceSeq = settings.current_invoice_seq + 1;
    const loadSeq = settings.current_load_seq + 1;

    const todayStr = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date()).replace(/\//g, '-');

    const order_no = `${settings.invoice_prefix}-ORD-${new Date().getFullYear()}-${String(orderSeq).padStart(5, '0')}`;
    const invoice_no = `${settings.invoice_prefix}-${new Date().getFullYear()}-${String(invoiceSeq).padStart(5, '0')}`;
    const load_no = `LD-${String(loadSeq).padStart(5, '0')}`;

    const orderStatus: OrderStatus = driver ? 'Driver Assigned' : 'Confirmed';

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_no,
      date: todayStr,
      customer_id: orderData.customer_id,
      customer_name: customer ? customer.name : 'Walk-in Customer',
      customer_phone: customer ? customer.mobile : '',
      material_id: orderData.material_id,
      material_name: material ? material.name : 'Construction Material',
      quantity,
      unit: material ? material.unit : 'Unit',
      rate,
      material_amount,
      delivery_charge,
      other_charges,
      discount,
      total_amount,
      payment_method: orderData.payment_method,
      payment_status,
      delivery_location: orderData.delivery_location || (customer ? customer.delivery_location : 'Chennai'),
      delivery_date: orderData.delivery_date || todayStr,
      urgent_delivery: !!orderData.urgent_delivery,
      assigned_driver_id: driver?.id,
      assigned_driver_name: driver?.name,
      assigned_vehicle_id: vehicle?.id,
      assigned_vehicle_number: vehicle?.vehicle_no,
      notes: orderData.notes,
      status: orderStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: orderData.created_by || 'Billing Desk'
    };

    const driverRate = driver?.rate_per_load || material?.driver_default_rate || settings.default_driver_load_rate;

    const newLoad: Load = {
      id: `ld-${Date.now()}`,
      load_no,
      order_id: newOrder.id,
      order_no: newOrder.order_no,
      customer_id: newOrder.customer_id,
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      material_id: newOrder.material_id,
      material_name: newOrder.material_name,
      quantity: newOrder.quantity,
      unit: newOrder.unit,
      driver_id: driver ? driver.id : 'unassigned',
      driver_name: driver ? driver.name : 'Unassigned',
      vehicle_id: vehicle ? vehicle.id : 'unassigned',
      vehicle_number: vehicle ? vehicle.vehicle_no : 'Unassigned',
      delivery_location: newOrder.delivery_location,
      date: newOrder.delivery_date,
      driver_rate: driverRate,
      driver_earnings: driver ? driverRate : 0,
      status: orderStatus,
      urgent: newOrder.urgent_delivery,
      notes: newOrder.notes,
      accepted_at: driver ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoice_no,
      order_id: newOrder.id,
      order_no: newOrder.order_no,
      customer_id: newOrder.customer_id,
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      customer_address: customer ? customer.address : '',
      delivery_location: newOrder.delivery_location,
      date: todayStr,
      items: [
        {
          material_id: newOrder.material_id,
          material_name: newOrder.material_name,
          quantity: newOrder.quantity,
          unit: newOrder.unit,
          rate: newOrder.rate,
          amount: newOrder.material_amount
        }
      ],
      subtotal: newOrder.material_amount,
      delivery_charge: newOrder.delivery_charge,
      other_charges: newOrder.other_charges,
      discount: newOrder.discount,
      grand_total: newOrder.total_amount,
      paid_amount: paid_now,
      pending_amount,
      payment_status,
      payment_method: newOrder.payment_method,
      driver_id: driver?.id,
      driver_name: driver?.name,
      vehicle_id: vehicle?.id,
      vehicle_number: vehicle?.vehicle_no,
      notes: newOrder.notes,
      created_at: new Date().toISOString(),
      created_by: orderData.created_by || 'Billing Desk'
    };

    // If paid now > 0, create a payment record
    if (paid_now > 0) {
      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        payment_no: `REC-${Date.now().toString().slice(-4)}`,
        invoice_id: newInvoice.id,
        invoice_no: newInvoice.invoice_no,
        customer_id: newInvoice.customer_id,
        customer_name: newInvoice.customer_name,
        date: todayStr,
        amount: paid_now,
        payment_method: newOrder.payment_method,
        notes: `Immediate payment at order generation`,
        created_at: new Date().toISOString(),
        created_by: orderData.created_by || 'Billing Desk'
      };
      setPayments(prev => [newPay, ...prev]);
    }

    setOrders(prev => [newOrder, ...prev]);
    setLoads(prev => [newLoad, ...prev]);
    setInvoices(prev => [newInvoice, ...prev]);

    // Update seqs
    setSettings(prev => ({
      ...prev,
      current_order_seq: orderSeq,
      current_invoice_seq: invoiceSeq,
      current_load_seq: loadSeq
    }));

    addAuditLog('CREATE_ORDER', `Generated Order ${order_no} / Invoice ${invoice_no} (₹${total_amount})`);

    addNotification({
      title: 'New Order & Load Generated',
      message: `${newOrder.material_name} (${quantity} ${newOrder.unit}) for ${newOrder.customer_name}. Total: ₹${total_amount.toLocaleString('en-IN')}`,
      type: 'order',
      link_tab: 'orders',
      link_id: newOrder.id
    });

    return { order: newOrder, load: newLoad, invoice: newInvoice };
  };

  const addAdditionalLoad = (orderId: string, loadData: {
    driver_id: string;
    vehicle_id: string;
    quantity: number;
    date: string;
    driver_rate?: number;
    notes?: string;
  }): Load => {
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const driver = drivers.find(d => d.id === loadData.driver_id);
    const vehicle = vehicles.find(v => v.id === loadData.vehicle_id);
    const loadSeq = settings.current_load_seq + 1;
    const load_no = `LD-${String(loadSeq).padStart(5, '0')}`;
    const rate = loadData.driver_rate || driver?.rate_per_load || settings.default_driver_load_rate;

    const newLoad: Load = {
      id: `ld-${Date.now()}`,
      load_no,
      order_id: order.id,
      order_no: order.order_no,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      material_id: order.material_id,
      material_name: order.material_name,
      quantity: loadData.quantity,
      unit: order.unit,
      driver_id: driver ? driver.id : 'unassigned',
      driver_name: driver ? driver.name : 'Unassigned',
      vehicle_id: vehicle ? vehicle.id : 'unassigned',
      vehicle_number: vehicle ? vehicle.vehicle_no : 'Unassigned',
      delivery_location: order.delivery_location,
      date: loadData.date,
      driver_rate: rate,
      driver_earnings: driver ? rate : 0,
      status: driver ? 'Driver Assigned' : 'Pending',
      urgent: order.urgent_delivery,
      notes: loadData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setLoads(prev => [newLoad, ...prev]);
    setSettings(prev => ({ ...prev, current_load_seq: loadSeq }));
    addAuditLog('ADD_LOAD', `Added additional load ${load_no} to Order ${order.order_no}`);
    return newLoad;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, updatedBy = 'Staff') => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o))
    );

    // Also update associated loads if needed
    setLoads(prev =>
      prev.map(l => (l.order_id === orderId && l.status !== 'Delivered' && l.status !== 'Cancelled'
        ? {
            ...l,
            status,
            delivered_at: status === 'Delivered' ? new Date().toISOString() : l.delivered_at,
            updated_at: new Date().toISOString()
          }
        : l))
    );

    addAuditLog('ORDER_STATUS', `Updated Order ${orderId} status to ${status}`, updatedBy);
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, ...updates, updated_at: new Date().toISOString() } : o))
    );
  };

  const updateLoadStatus = (loadId: string, status: OrderStatus, updatedBy = 'Driver') => {
    let affectedLoad: Load | undefined;

    setLoads(prev =>
      prev.map(l => {
        if (l.id !== loadId) return l;

        const updated: Load = {
          ...l,
          status,
          updated_at: new Date().toISOString()
        };

        if (status === 'Driver Assigned' && !l.accepted_at) {
          updated.accepted_at = new Date().toISOString();
        } else if (status === 'Out for Delivery' && !l.dispatched_at) {
          updated.dispatched_at = new Date().toISOString();
        } else if (status === 'Delivered') {
          updated.delivered_at = new Date().toISOString();
        } else if (status === 'Cancelled') {
          // Rule: Cancelled load must NOT receive salary
          updated.driver_earnings = 0;
        }

        affectedLoad = updated;
        return updated;
      })
    );

    if (affectedLoad) {
      const load = affectedLoad as Load;
      // If delivered, increment vehicle loads completed
      if (status === 'Delivered' && load.vehicle_id) {
        setVehicles(prev =>
          prev.map(v => (v.id === load.vehicle_id ? { ...v, loads_completed: v.loads_completed + 1 } : v))
        );

        // Check if all loads of this order are delivered
        const siblingLoads = loads.filter(l => l.order_id === load.order_id && l.id !== load.id);
        const allDelivered = siblingLoads.every(l => l.status === 'Delivered');
        if (allDelivered) {
          setOrders(prev =>
            prev.map(o => (o.id === load.order_id ? { ...o, status: 'Delivered', updated_at: new Date().toISOString() } : o))
          );
        }

        addNotification({
          title: 'Delivery Completed',
          message: `Load ${load.load_no} delivered by ${load.driver_name} at ${load.delivery_location}.`,
          type: 'delivery',
          link_tab: 'loads',
          link_id: load.id
        });
      }

      addAuditLog('LOAD_STATUS', `Load ${load.load_no} status changed to ${status} by ${updatedBy}`);
    }
  };

  const reassignLoad = (loadId: string, driverId: string, vehicleId: string, customDriverRate?: number) => {
    const driver = drivers.find(d => d.id === driverId);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!driver || !vehicle) return;

    const rate = customDriverRate !== undefined ? customDriverRate : driver.rate_per_load;

    setLoads(prev =>
      prev.map(l => {
        if (l.id !== loadId) return l;
        return {
          ...l,
          driver_id: driver.id,
          driver_name: driver.name,
          vehicle_id: vehicle.id,
          vehicle_number: vehicle.vehicle_no,
          driver_rate: rate,
          driver_earnings: l.status === 'Cancelled' ? 0 : rate,
          status: 'Driver Assigned',
          updated_at: new Date().toISOString()
        };
      })
    );

    addAuditLog('LOAD_REASSIGN', `Reassigned load ID ${loadId} to ${driver.name} (${vehicle.vehicle_no})`);
  };

  // Record payment against an invoice
  const recordPayment = (paymentData: {
    invoice_id: string;
    amount: number;
    date: string;
    payment_method: PaymentMethod;
    reference_no?: string;
    notes?: string;
    created_by?: string;
  }): Payment => {
    const invoice = invoices.find(inv => inv.id === paymentData.invoice_id);
    if (!invoice) throw new Error('Invoice not found');

    const nextNum = payments.length + 1;
    const paymentNo = `REC-${String(nextNum).padStart(4, '0')}`;

    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      payment_no: paymentNo,
      invoice_no: invoice.invoice_no,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer_name,
      created_at: new Date().toISOString(),
      created_by: paymentData.created_by || 'Staff'
    };

    setPayments(prev => [newPayment, ...prev]);

    // Update invoice paid amount and status
    const newPaidAmount = invoice.paid_amount + paymentData.amount;
    const newPendingAmount = Math.max(0, invoice.grand_total - newPaidAmount);
    let newStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (newPaidAmount >= invoice.grand_total) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partially Paid';
    }

    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoice.id
          ? {
              ...inv,
              paid_amount: newPaidAmount,
              pending_amount: newPendingAmount,
              payment_status: newStatus
            }
          : inv
      )
    );

    // Also update order payment status
    setOrders(prev =>
      prev.map(o => (o.id === invoice.order_id ? { ...o, payment_status: newStatus } : o))
    );

    addAuditLog('RECORD_PAYMENT', `Received ₹${paymentData.amount} for Invoice ${invoice.invoice_no} (${paymentData.payment_method})`);

    addNotification({
      title: 'Payment Recorded',
      message: `Received ₹${paymentData.amount.toLocaleString('en-IN')} for ${invoice.invoice_no} from ${invoice.customer_name}. Balance: ₹${newPendingAmount.toLocaleString('en-IN')}`,
      type: 'payment',
      link_tab: 'payments'
    });

    return newPayment;
  };

  // Expenses
  const addExpense = (expData: Omit<Expense, 'id' | 'expense_no' | 'created_at'>): Expense => {
    const nextNum = expenses.length + 1;
    const expenseNo = `EXP-${String(nextNum).padStart(5, '0')}`;
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      expense_no: expenseNo,
      created_at: new Date().toISOString()
    };
    setExpenses(prev => [newExp, ...prev]);
    addAuditLog('ADD_EXPENSE', `Logged ₹${expData.amount} under ${expData.category}: ${expData.description}`);
    return newExp;
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    addAuditLog('DELETE_EXPENSE', `Deleted expense ID ${id}`);
  };

  // Automatic Salary Calculation Formula
  // Completed loads * rate_per_load + bonus + other_earnings - advances - deductions = net_salary
  const calculateMonthlySalary = (driverId: string, month: string) => {
    const driver = drivers.find(d => d.id === driverId);
    const ratePerLoad = driver?.rate_per_load || settings.default_driver_load_rate;

    // Filter delivered loads for this driver in this month (DD-MM-YYYY -> month is YYYY-MM)
    const deliveredLoads = loads.filter(l => {
      if (l.driver_id !== driverId) return false;
      if (l.status !== 'Delivered') return false; // Rule: Must be DELIVERED, cancelled cannot count!

      // l.date is DD-MM-YYYY
      const parts = l.date.split('-');
      if (parts.length === 3) {
        const loadMonth = `${parts[2]}-${parts[1]}`;
        return loadMonth === month;
      }
      return false;
    });

    const completedLoads = deliveredLoads.length;
    let loadEarnings = 0;
    deliveredLoads.forEach(l => {
      loadEarnings += l.driver_earnings || l.driver_rate || ratePerLoad;
    });

    // Advances in this month
    const advances = driverAdvances.filter(a => {
      if (a.driver_id !== driverId) return false;
      if (a.month === month) return true;
      const parts = a.date.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}` === month;
      }
      return false;
    });

    const advancesDeducted = advances.reduce((sum, a) => sum + a.amount, 0);

    // Existing saved record for bonus / deductions if any
    const existing = salaryRecords.find(r => r.driver_id === driverId && r.month === month);
    const bonus = existing ? existing.bonus : 0;
    const otherEarnings = existing ? existing.other_earnings : 0;
    const otherDeductions = existing ? existing.other_deductions : 0;

    const netSalary = Math.max(0, loadEarnings + bonus + otherEarnings - advancesDeducted - otherDeductions);

    return {
      completedLoads,
      ratePerLoad,
      loadEarnings,
      bonus,
      otherEarnings,
      advancesDeducted,
      otherDeductions,
      netSalary
    };
  };

  const saveSalaryRecord = (recordData: Omit<DriverSalaryRecord, 'id' | 'created_at' | 'updated_at'>): DriverSalaryRecord => {
    const existingIndex = salaryRecords.findIndex(
      r => r.driver_id === recordData.driver_id && r.month === recordData.month
    );

    let savedRecord: DriverSalaryRecord;

    if (existingIndex >= 0) {
      savedRecord = {
        ...salaryRecords[existingIndex],
        ...recordData,
        updated_at: new Date().toISOString()
      };
      setSalaryRecords(prev => {
        const next = [...prev];
        next[existingIndex] = savedRecord;
        return next;
      });
    } else {
      savedRecord = {
        ...recordData,
        id: `sal-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSalaryRecords(prev => [savedRecord, ...prev]);
    }

    addAuditLog('SALARY_CALCULATION', `Calculated/Saved salary statement for ${recordData.driver_name} (${recordData.month}): ₹${recordData.net_salary}`);

    // If marked paid, also log as an Expense under 'Salary'
    if (recordData.status === 'Paid') {
      const todayStr = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date()).replace(/\//g, '-');

      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        expense_no: `EXP-${Date.now().toString().slice(-5)}`,
        date: todayStr,
        category: 'Salary',
        driver_id: recordData.driver_id,
        driver_name: recordData.driver_name,
        amount: recordData.net_salary,
        payment_method: (recordData.payment_method as PaymentMethod) || 'Bank Transfer',
        description: `Salary Payout for ${recordData.driver_name} (${recordData.month}): ${recordData.completed_loads} loads cleared`,
        created_at: new Date().toISOString(),
        created_by: 'Admin'
      };
      setExpenses(prev => [newExpense, ...prev]);
    }

    return savedRecord;
  };

  const updateSalaryRecord = (id: string, updates: Partial<DriverSalaryRecord>) => {
    setSalaryRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
  };

  const exportDatabaseJSON = (): string => {
    const payload = {
      app: 'MARUTHI_TRANSPORT_CMS',
      version: '2.0',
      exported_at: new Date().toISOString(),
      record_counts: {
        customers: customers.length,
        materials: materials.length,
        drivers: drivers.length,
        vehicles: vehicles.length,
        orders: orders.length,
        loads: loads.length,
        invoices: invoices.length,
        payments: payments.length,
        advances: driverAdvances.length,
        expenses: expenses.length
      },
      settings,
      customers,
      materials,
      drivers,
      vehicles,
      orders,
      loads,
      invoices,
      payments,
      advances: driverAdvances,
      salary_records: salaryRecords,
      expenses,
      notifications,
      audit_logs: auditLogs
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDatabaseJSON = async (jsonString: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON file format' };
      }

      // Validate critical structure
      if (!parsed.customers && !parsed.orders && !parsed.invoices) {
        return { success: false, error: 'Backup file does not contain valid Maruthi Transport tables' };
      }

      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (Array.isArray(parsed.materials)) setMaterials(parsed.materials);
      if (Array.isArray(parsed.drivers)) setDrivers(parsed.drivers);
      if (Array.isArray(parsed.vehicles)) setVehicles(parsed.vehicles);
      if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
      if (Array.isArray(parsed.loads)) setLoads(parsed.loads);
      if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
      if (Array.isArray(parsed.payments)) setPayments(parsed.payments);
      if (Array.isArray(parsed.advances)) setDriverAdvances(parsed.advances);
      if (Array.isArray(parsed.salary_records)) setSalaryRecords(parsed.salary_records);
      if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
      if (Array.isArray(parsed.audit_logs)) setAuditLogs(parsed.audit_logs);

      // Immediately sync to Express backend database
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: parsed.settings || settings,
          customers: parsed.customers || customers,
          materials: parsed.materials || materials,
          drivers: parsed.drivers || drivers,
          vehicles: parsed.vehicles || vehicles,
          orders: parsed.orders || orders,
          loads: parsed.loads || loads,
          invoices: parsed.invoices || invoices,
          payments: parsed.payments || payments,
          advances: parsed.advances || driverAdvances,
          salary_records: parsed.salary_records || salaryRecords,
          expenses: parsed.expenses || expenses,
          notifications: parsed.notifications || notifications,
          audit_logs: [
            {
              id: `log-${Date.now()}`,
              user_name: 'Admin',
              action: 'RESTORE_DATABASE',
              details: `Restored database backup (${parsed.orders?.length || 0} orders, ${parsed.customers?.length || 0} customers)`,
              timestamp: new Date().toISOString()
            },
            ...(parsed.audit_logs || auditLogs)
          ]
        })
      });

      addAuditLog('RESTORE_DATABASE', 'Restored database from external JSON backup file');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON backup' };
    }
  };

  const resetDatabaseToDefault = () => {
    localStorage.clear();
    setSettings(INITIAL_SETTINGS);
    setCustomers(INITIAL_CUSTOMERS);
    setMaterials(INITIAL_MATERIALS);
    setDrivers(INITIAL_DRIVERS);
    setVehicles(INITIAL_VEHICLES);
    setOrders(INITIAL_ORDERS);
    setLoads(INITIAL_LOADS);
    setInvoices(INITIAL_INVOICES);
    setPayments(INITIAL_PAYMENTS);
    setDriverAdvances(INITIAL_DRIVER_ADVANCES);
    setSalaryRecords(INITIAL_SALARY_RECORDS);
    setExpenses(INITIAL_EXPENSES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    addAuditLog('RESET_DATABASE', 'Reset database to pristine Chennai demonstration dataset');
  };

  const createDailyBackupSnapshot = (downloadFile = false): DailyBackupSnapshot => {
    const jsonContent = exportDatabaseJSON();
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `maruthi_auto_backup_${dateKey}_${timeStr}.json`;
    const sizeKb = (new Blob([jsonContent]).size / 1024).toFixed(1);

    const newSnapshot: DailyBackupSnapshot = {
      id: `snap-${Date.now()}`,
      date_key: dateKey,
      timestamp: now.toISOString(),
      file_name: fileName,
      size_kb: sizeKb,
      record_counts: {
        orders: orders.length,
        loads: loads.length,
        customers: customers.length,
        invoices: invoices.length,
        drivers: drivers.length,
        vehicles: vehicles.length
      },
      json_content: jsonContent
    };

    setDailySnapshots(prev => {
      const filtered = prev.filter(s => s.id !== newSnapshot.id);
      return [newSnapshot, ...filtered].slice(0, 14);
    });

    localStorage.setItem(STORAGE_KEY_PREFIX + 'last_daily_backup_date', dateKey);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'last_auto_backup_timestamp', now.toISOString());
    localStorage.setItem(STORAGE_KEY_PREFIX + 'daily_snapshot_serialized', jsonContent);

    setSettings(prev => ({
      ...prev,
      last_auto_backup_at: now.toISOString()
    }));

    addAuditLog(
      'AUTO_DAILY_BACKUP',
      `Automated daily snapshot preserved (${newSnapshot.record_counts.orders} orders, ${newSnapshot.record_counts.customers} customers)`
    );

    if (downloadFile) {
      try {
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to trigger automatic download:', err);
      }
    }

    return newSnapshot;
  };

  const restoreDailySnapshot = async (snapshotId: string): Promise<{ success: boolean; error?: string }> => {
    const snapshot = dailySnapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      return { success: false, error: 'Snapshot not found in local storage' };
    }
    const result = await importDatabaseJSON(snapshot.json_content);
    if (result.success) {
      addAuditLog(
        'RESTORE_DAILY_SNAPSHOT',
        `Restored database from daily snapshot [${snapshot.date_key}] (${snapshot.file_name})`
      );
    }
    return result;
  };

  const deleteDailySnapshot = (snapshotId: string) => {
    setDailySnapshots(prev => prev.filter(s => s.id !== snapshotId));
  };

  const clearAllDailySnapshots = () => {
    setDailySnapshots([]);
  };

  // Automated daily database backup trigger on system startup
  useEffect(() => {
    if (settings.auto_backup_enabled === false) return;

    const timer = setTimeout(() => {
      const todayDateKey = new Date().toISOString().slice(0, 10);
      const lastBackupDate = localStorage.getItem(STORAGE_KEY_PREFIX + 'last_daily_backup_date');

      if (lastBackupDate !== todayDateKey) {
        const shouldDownload =
          settings.auto_backup_mode === 'prompt_download' || settings.auto_backup_mode === 'both';
        createDailyBackupSnapshot(shouldDownload);

        addNotification({
          title: 'Daily Auto-Backup Preserved',
          message: `Automated daily snapshot for ${todayDateKey} has been safely saved to local storage.`,
          type: 'system',
          link_tab: 'settings'
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [settings.auto_backup_enabled, settings.auto_backup_mode]);

  return (
    <DatabaseContext.Provider
      value={{
        settings,
        updateSettings,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        orders,
        createOrder,
        updateOrderStatus,
        updateOrder,
        loads,
        addAdditionalLoad,
        updateLoadStatus,
        reassignLoad,
        drivers,
        addDriver,
        updateDriver,
        deleteDriver,
        driverAdvances,
        recordDriverAdvance,
        salaryRecords,
        calculateMonthlySalary,
        saveSalaryRecord,
        updateSalaryRecord,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        invoices,
        payments,
        recordPayment,
        expenses,
        addExpense,
        deleteExpense,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        auditLogs,
        addAuditLog,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetDatabaseToDefault,
        dailySnapshots,
        createDailyBackupSnapshot,
        restoreDailySnapshot,
        deleteDailySnapshot,
        clearAllDailySnapshots
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
