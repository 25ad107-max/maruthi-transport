import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Truck,
  Lock,
  User as UserIcon,
  Shield,
  KeyRound,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Phone
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithPin, allUsers } = useAuth();
  const { settings } = useDatabase();

  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await loginWithPin(username, pin);
      if (!success) {
        setError('Invalid username or PIN. Please check credentials or use 1-click demo login below.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (uname: string, upin: string) => {
    setUsername(uname);
    setPin(upin);
    setError(null);
    setLoading(true);
    try {
      const success = await loginWithPin(uname, upin);
      if (!success) {
        setError(`Unable to sign in as "${uname}". Please check credentials.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta: Record<string, { label: string; icon: string; desc: string; badge: string }> = {
    super_admin: { label: 'Super Admin', icon: '👑', desc: 'Full System Control & Settings', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
    manager: { label: 'Manager', icon: '👔', desc: 'Orders, Drivers, Reports, Payments', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
    billing_staff: { label: 'Billing Staff', icon: '🧾', desc: 'Fast POS, Invoices & Customer Dues', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    staff: { label: 'Operations Staff', icon: '👷', desc: 'Site Dispatch & Yard Orders', badge: 'bg-slate-100 text-slate-800 border-slate-300' },
    driver: { label: 'Truck Driver', icon: '🚚', desc: 'Mobile Cockpit, Loads & Trip Fares', badge: 'bg-purple-100 text-purple-900 border-purple-300' }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="relative w-full max-w-xl space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 mb-1">
            MT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            {settings.business_name || 'MARUTHI TRANSPORT'}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-amber-400">
            Construction Material Supply & Transport Management System
          </p>
          <p className="text-xs text-slate-400">
            In and Around Chennai · Koyambedu Dispatch Operations
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account Sign In</h2>
              <p className="text-xs text-slate-400">Enter your credentials or PIN to continue</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Secure Portal
            </span>
          </div>

          {/* Role Quick Switcher Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Fast Role Switch:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => { setUsername('driver'); setPin('5555'); setError(null); }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  username === 'driver' || username.startsWith('driver')
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span className="text-[11px] font-bold">Driver</span>
              </button>

              <button
                type="button"
                onClick={() => { setUsername('admin'); setPin('1234'); setError(null); }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  username === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => { setUsername('manager'); setPin('2222'); setError(null); }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  username === 'manager'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span className="text-[11px] font-bold">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => { setUsername('billing'); setPin('3333'); setError(null); }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  username === 'billing'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span className="text-[11px] font-bold">Billing</span>
              </button>

              <button
                type="button"
                onClick={() => { setUsername('staff'); setPin('4444'); setError(null); }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all col-span-2 sm:col-span-1 cursor-pointer ${
                  username === 'staff'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-[11px] font-bold">Staff</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Username / Account ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. admin / manager / driver / billing"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Drivers can log in with username <strong className="text-amber-400 font-mono">driver</strong>, mobile <span className="font-mono">9840123456</span>, or PIN <span className="font-mono text-emerald-400">5555</span>
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Security PIN / Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (e.g. 5555 for driver, 1234 for admin)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white font-mono text-sm tracking-widest focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'SIGN IN TO DISPATCH DESK'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 1-Click Fast Role Sign-in for Staff & Testing */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1-Click Demo Sign-in (All Roles)
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Instant Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {allUsers
              .filter(u => u.username !== 'driver-ravi') // keep primary 'driver' and 'driver-murugan'
              .map(user => {
                const meta = roleMeta[user.role] || { label: user.role, icon: '👤', desc: '', badge: '' };
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user.username, user.pin)}
                    className="p-2.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{meta.icon}</span>
                      <div>
                        <p className="font-bold text-white group-hover:text-amber-400 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {meta.label} · User: <strong className="text-amber-300 font-mono">{user.username}</strong> · PIN: {user.pin}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Login →
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Office: {settings.address_line1}, {settings.city} - {settings.pincode}</p>
          <p className="font-mono">Helpline: {settings.phone} · WhatsApp: {settings.whatsapp}</p>
        </div>
      </div>
    </div>
  );
};
