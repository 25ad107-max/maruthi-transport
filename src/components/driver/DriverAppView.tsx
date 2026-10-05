import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  DollarSign,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Package,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { Load } from '../../types';

export const DriverAppView: React.FC = () => {
  const { loads, drivers, updateLoadStatus, calculateMonthlySalary, settings } = useDatabase();
  const { currentUser, isDriver, activeDriverId, switchUser, logout, setIsMobileDriverView } = useAuth();

  // If currently not logged in as driver, allow choosing driver for preview
  const defaultDrvId = activeDriverId || (drivers.length > 0 ? drivers[0].id : '');
  const [selectedDriverId, setSelectedDriverId] = useState<string>(defaultDrvId);

  const activeDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date()).replace(/\//g, '-');

  // Filter loads for this driver
  const myLoads = loads.filter(l => l.driver_id === selectedDriverId);

  // Categorize loads
  const assignedLoads = myLoads.filter(
    l => l.status === 'Driver Assigned' || l.status === 'Confirmed'
  );
  const outForDeliveryLoads = myLoads.filter(l => l.status === 'Out for Delivery');
  const completedLoads = myLoads.filter(l => l.status === 'Delivered');

  // Month stats for driver
  const salaryData = calculateMonthlySalary(selectedDriverId, currentMonthStr);

  const handleAction = (load: Load, action: 'accept' | 'start' | 'deliver') => {
    if (action === 'accept') {
      updateLoadStatus(load.id, 'Driver Assigned', activeDriver?.name || 'Driver');
    } else if (action === 'start') {
      updateLoadStatus(load.id, 'Out for Delivery', activeDriver?.name || 'Driver');
    } else if (action === 'deliver') {
      const confirmDeliver = window.confirm(`Confirm delivery of ${load.material_name} at ${load.delivery_location}?`);
      if (confirmDeliver) {
        updateLoadStatus(load.id, 'Delivered', activeDriver?.name || 'Driver');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-2 rounded-xl text-xs border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
            MT
          </span>
          <span className="font-bold tracking-tight text-amber-400">DRIVER APP</span>
        </div>

        <div className="flex items-center gap-2">
          {!isDriver && (
            <button
              type="button"
              onClick={() => setIsMobileDriverView(false)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold flex items-center gap-1"
            >
              <LayoutDashboard className="w-3 h-3 text-amber-400" />
              <span>Office View</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => logout()}
            className="px-2 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 rounded text-[11px] font-semibold flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Driver Cockpit Header */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
              {activeDriver ? activeDriver.name.charAt(0) : 'D'}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{activeDriver?.name || 'Driver Portal'}</h2>
              <p className="text-xs text-amber-400 font-mono">
                {activeDriver?.driver_no} · {activeDriver?.licence_no}
              </p>
            </div>
          </div>

          {/* Test switcher for manager/admin */}
          {!isDriver && (
            <select
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg p-1.5 font-medium"
            >
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Month Earnings Card */}
        <div className="bg-slate-800/90 rounded-xl p-3 grid grid-cols-2 gap-3 text-center border border-slate-700/60">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Month Completed Loads</p>
            <p className="text-xl font-black font-mono text-white mt-0.5">
              {salaryData.completedLoads}
            </p>
            <p className="text-[10px] text-amber-400 mt-0.5">Rate: ₹{salaryData.ratePerLoad}/load</p>
          </div>
          <div className="border-l border-slate-700 pl-3">
            <p className="text-[11px] text-slate-400 font-medium">Est. Net Earnings</p>
            <p className="text-xl font-black font-mono text-emerald-400 mt-0.5">
              ₹{salaryData.netSalary.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Adv. Deducted: ₹{salaryData.advancesDeducted}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          <span>Vehicle: {activeDriver?.assigned_vehicle_id ? 'Assigned' : 'Yard Pool'}</span>
          <span>Today: {todayStr}</span>
        </div>
      </div>

      {/* ACTIVE LOAD IN PROGRESS */}
      {outForDeliveryLoads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Active Delivery in Progress
            </h3>
          </div>

          {outForDeliveryLoads.map(load => (
            <div
              key={load.id}
              className="bg-white rounded-xl p-4 border-2 border-emerald-500 shadow-md space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[10px] font-bold uppercase font-mono">
                    OUT FOR DELIVERY
                  </span>
                  <h4 className="font-black text-base text-slate-900 mt-1">
                    {load.material_name}
                  </h4>
                  <p className="text-xs font-mono font-bold text-amber-600">
                    Quantity: {load.quantity} {load.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-700">{load.load_no}</span>
                  <p className="text-[11px] font-mono text-slate-500">{load.vehicle_number}</p>
                </div>
              </div>

              {/* Destination */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800">{load.customer_name}</p>
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span>{load.delivery_location}</span>
                </div>
              </div>

              {/* Action Buttons: Call, Map, Mark Delivered */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {load.customer_phone && (
                  <a
                    href={`tel:${load.customer_phone}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Call Customer
                  </a>
                )}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(load.delivery_location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  Directions
                </a>
              </div>

              <button
                type="button"
                onClick={() => handleAction(load, 'deliver')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                MARK DELIVERED (CONFIRM UNLOAD)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGNED & UPCOMING LOADS */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Assigned Loads ({assignedLoads.length})
        </h3>

        {assignedLoads.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No pending assigned loads for this driver right now.
          </div>
        ) : (
          assignedLoads.map(load => (
            <div
              key={load.id}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{load.load_no}</span>
                    {load.urgent && (
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                        URGENT
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">
                    {load.material_name} · {load.quantity} {load.unit}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    ₹{load.driver_rate}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">Trip Fare</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-medium text-slate-900">Site: {load.customer_name}</p>
                <p className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{load.delivery_location}</span>
                </p>
                <p className="text-slate-500 font-mono">Vehicle: {load.vehicle_number}</p>
              </div>

              {/* Start Delivery Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAction(load, 'start')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-amber-400" />
                  START DELIVERY (DISPATCH TRIP)
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* COMPLETED DELIVERIES HISTORY */}
      <div className="space-y-2 pt-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Recent Completed Loads ({completedLoads.length})
        </h3>

        <div className="space-y-2">
          {completedLoads.slice(0, 5).map(load => (
            <div
              key={load.id}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-slate-900">{load.material_name} ({load.quantity} {load.unit})</p>
                <p className="text-slate-500 text-[11px]">{load.customer_name} · {load.date}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-700">
                  + ₹{load.driver_earnings}
                </span>
                <p className="text-[10px] text-emerald-600 font-semibold">Credited</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
