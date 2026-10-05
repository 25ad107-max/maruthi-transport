import React, { useState, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { AppSettings, DailyBackupSnapshot } from '../../types';
import {
  Settings,
  Building,
  FileText,
  Phone,
  CreditCard,
  RotateCcw,
  CheckCircle,
  Shield,
  Save,
  Download,
  Upload,
  Database,
  AlertTriangle,
  FileJson,
  Copy,
  Check,
  Server,
  HardDrive,
  X,
  History,
  Info,
  Clock,
  Calendar,
  Sparkles,
  Trash2,
  Play,
  RefreshCw,
  FolderArchive
} from 'lucide-react';

interface PendingRestorePayload {
  fileName: string;
  fileSizeKb: string;
  rawText: string;
  app?: string;
  version?: string;
  exportedAt?: string;
  counts: {
    customers: number;
    materials: number;
    drivers: number;
    vehicles: number;
    orders: number;
    loads: number;
    invoices: number;
    payments: number;
    advances: number;
    expenses: number;
  };
  sampleCustomer?: string;
  sampleOrder?: string;
}

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetDatabaseToDefault,
    dailySnapshots,
    createDailyBackupSnapshot,
    restoreDailySnapshot,
    deleteDailySnapshot,
    clearAllDailySnapshots,
    orders,
    loads,
    customers,
    materials,
    invoices,
    drivers,
    vehicles,
    payments,
    driverAdvances,
    expenses,
    auditLogs
  } = useDatabase();
  const { canModifyFinancialSettings, currentUser } = useAuth();

  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup & Restore State
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<PendingRestorePayload | null>(null);
  const [pendingDailySnapshot, setPendingDailySnapshot] = useState<DailyBackupSnapshot | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof AppSettings, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModifyFinancialSettings()) {
      alert('Only Super Admin is authorized to change core financial and business settings.');
      return;
    }

    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  // Immediate toggle of automated backup settings
  const handleToggleAutoBackup = (enabled: boolean) => {
    handleChange('auto_backup_enabled', enabled);
    updateSettings({ auto_backup_enabled: enabled });
    if (enabled) {
      const todayDateKey = new Date().toISOString().slice(0, 10);
      const existingToday = dailySnapshots.find(s => s.date_key === todayDateKey);
      if (!existingToday) {
        createDailyBackupSnapshot(false);
      }
    }
    setBackupMessage({
      type: 'success',
      text: enabled
        ? 'Daily Database Snapshot enabled. A serialized copy of the database has been saved to browser localStorage.'
        : 'Daily Database Snapshot disabled.'
    });
    setTimeout(() => setBackupMessage(null), 4000);
  };

  const lastBackupTimestamp =
    settings.last_auto_backup_at ||
    (dailySnapshots.length > 0 ? dailySnapshots[0].timestamp : null);
  const latestSnapshot = dailySnapshots.length > 0 ? dailySnapshots[0] : null;

  const getRelativeTime = (isoString?: string | null): string => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      if (diffMs < 0) return 'Just now';
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } catch {
      return '';
    }
  };

  const handleChangeAutoBackupMode = (mode: 'local_storage' | 'prompt_download' | 'both') => {
    handleChange('auto_backup_mode', mode);
    updateSettings({ auto_backup_mode: mode });
  };

  // Trigger manual snapshot creation
  const handleCreateDailySnapshotNow = (downloadFile = false) => {
    try {
      const snap = createDailyBackupSnapshot(downloadFile);
      setBackupMessage({
        type: 'success',
        text: `Daily snapshot captured! Preserved in browser storage (${snap.size_kb} KB, ${snap.record_counts.orders} orders).`
      });
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err: any) {
      setBackupMessage({
        type: 'error',
        text: `Failed to create daily snapshot: ${err?.message || 'Unknown error'}`
      });
    }
  };

  // Download a stored daily snapshot
  const handleDownloadSnapshot = (snap: DailyBackupSnapshot) => {
    try {
      const blob = new Blob([snap.json_content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = snap.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setBackupMessage({
        type: 'error',
        text: 'Download failed: ' + (err?.message || 'Unknown error')
      });
    }
  };

  // Execute restore from a daily snapshot
  const handleConfirmDailyRestore = async () => {
    if (!pendingDailySnapshot) return;
    setIsRestoring(true);
    setBackupMessage(null);

    try {
      const result = await restoreDailySnapshot(pendingDailySnapshot.id);
      if (result.success) {
        setPendingDailySnapshot(null);
        setBackupMessage({
          type: 'success',
          text: `Database successfully restored from daily snapshot dated ${pendingDailySnapshot.date_key}! Restored ${pendingDailySnapshot.record_counts.orders} orders.`
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setBackupMessage({
          type: 'error',
          text: `Restore failed: ${result.error || 'Invalid backup structure'}`
        });
      }
    } catch (err: any) {
      setBackupMessage({
        type: 'error',
        text: `Restore error: ${err?.message || 'Failed to restore snapshot'}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Export JSON Backup (Client State)
  const handleExportBackup = () => {
    try {
      const jsonContent = exportDatabaseJSON();
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `maruthi_transport_backup_${dateStr}_${timeStr}.json`;

      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupMessage({
        type: 'success',
        text: `Backup exported successfully as "${fileName}" (${(blob.size / 1024).toFixed(1)} KB)`
      });
      setTimeout(() => setBackupMessage(null), 6000);
    } catch (err: any) {
      setBackupMessage({
        type: 'error',
        text: `Export failed: ${err?.message || 'Unknown error'}`
      });
    }
  };

  // Copy JSON Backup to Clipboard
  const handleCopyJSON = async () => {
    try {
      const jsonContent = exportDatabaseJSON();
      await navigator.clipboard.writeText(jsonContent);
      setCopiedJSON(true);
      setTimeout(() => setCopiedJSON(false), 3000);
      setBackupMessage({
        type: 'success',
        text: 'Database JSON copied to clipboard successfully!'
      });
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err: any) {
      setBackupMessage({
        type: 'error',
        text: 'Could not copy to clipboard: ' + (err?.message || 'Browser permission denied')
      });
    }
  };

  // Server Backup Direct Download
  const handleServerBackupDownload = () => {
    const link = document.createElement('a');
    link.href = '/api/database/backup';
    link.download = `maruthi_server_db_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger file selection for restore
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Process file upload and prepare preview modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File content is empty');

        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Selected file does not contain valid JSON data.');
        }

        if (!parsed.orders && !parsed.customers && !parsed.loads && !parsed.settings) {
          throw new Error('Unrecognized schema: Missing Maruthi Transport database collections.');
        }

        const counts = {
          customers: Array.isArray(parsed.customers) ? parsed.customers.length : 0,
          materials: Array.isArray(parsed.materials) ? parsed.materials.length : 0,
          drivers: Array.isArray(parsed.drivers) ? parsed.drivers.length : 0,
          vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles.length : 0,
          orders: Array.isArray(parsed.orders) ? parsed.orders.length : 0,
          loads: Array.isArray(parsed.loads) ? parsed.loads.length : 0,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices.length : 0,
          payments: Array.isArray(parsed.payments) ? parsed.payments.length : 0,
          advances: Array.isArray(parsed.advances) ? parsed.advances.length : 0,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses.length : 0
        };

        const sampleCustomer = parsed.customers?.[0]?.name;
        const sampleOrder = parsed.orders?.[0]?.order_no;

        setPendingRestore({
          fileName: file.name,
          fileSizeKb: (file.size / 1024).toFixed(1),
          rawText: text,
          app: parsed.app || 'MARUTHI_TRANSPORT_CMS',
          version: parsed.version || '2.0',
          exportedAt: parsed.exported_at,
          counts,
          sampleCustomer,
          sampleOrder
        });
      } catch (err: any) {
        setBackupMessage({
          type: 'error',
          text: `Invalid backup file: ${err?.message || 'Could not parse JSON'}`
        });
      }
    };

    reader.onerror = () => {
      setBackupMessage({ type: 'error', text: 'Error reading selected file from disk.' });
    };

    reader.readAsText(file);
  };

  // Confirm and execute the restore from manual file upload
  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setIsRestoring(true);
    setBackupMessage(null);

    try {
      const result = await importDatabaseJSON(pendingRestore.rawText);

      if (result.success) {
        setPendingRestore(null);
        setBackupMessage({
          type: 'success',
          text: `Database successfully restored from "${pendingRestore.fileName}"! Restored ${pendingRestore.counts.orders} orders and ${pendingRestore.counts.customers} customers.`
        });

        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setBackupMessage({
          type: 'error',
          text: `Restore failed: ${result.error || 'Invalid backup structure'}`
        });
      }
    } catch (err: any) {
      setBackupMessage({
        type: 'error',
        text: `Restore process encountered an error: ${err?.message || 'Unknown error'}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      'WARNING: This will reset all orders, loads, customers and fleet data back to the original Chennai demonstration dataset. Continue?'
    );
    if (confirmReset) {
      resetDatabaseToDefault();
      alert('Database restored to default demo state.');
      window.location.reload();
    }
  };

  // Filter audit logs relevant to database maintenance
  const dbAuditLogs = auditLogs
    .filter(log =>
      ['RESTORE_DATABASE', 'RESTORE_DAILY_SNAPSHOT', 'AUTO_DAILY_BACKUP', 'RESET_DATABASE', 'BACKUP_EXPORT', 'UPDATE_SETTINGS'].includes(
        log.action
      )
    )
    .slice(0, 5);

  const autoBackupEnabled = formData.auto_backup_enabled ?? true;
  const autoBackupMode = formData.auto_backup_mode ?? 'local_storage';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            System & Business Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Maruthi Transport company details, automated daily backups, rates, and banking
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Settings saved successfully!
          </span>
        )}
      </div>

      {backupMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 transition-all shadow-xs ${
            backupMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {backupMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{backupMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DAILY AUTOMATED DATABASE BACKUP FEATURE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/15 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Daily Automated Database Backup</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    autoBackupEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {autoBackupEnabled ? '● Active' : '○ Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically saves a serialized JSON snapshot of all database records to browser localStorage on daily session.
              </p>
            </div>
          </div>

          {/* Toggle with EXACT label: "Enable Daily Database Snapshot" */}
          <div className="flex items-center gap-3 self-start sm:self-center bg-slate-50 hover:bg-slate-100/90 border border-slate-300 p-2.5 rounded-xl transition-all shadow-2xs">
            <span className="text-xs font-bold text-slate-900 select-none">
              Enable Daily Database Snapshot
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                aria-label="Enable Daily Database Snapshot"
                checked={autoBackupEnabled}
                onChange={e => handleToggleAutoBackup(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* UI Indicator Showing Timestamp of Last Successful Automatic Backup */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            autoBackupEnabled
              ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white border-emerald-200 shadow-2xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  autoBackupEnabled
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 tracking-tight">
                    Last Successful Automatic Backup
                  </span>
                  {autoBackupEnabled ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Auto Snapshot Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Snapshot Paused
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {lastBackupTimestamp ? (
                    <>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-sm bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {new Date(lastBackupTimestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      {getRelativeTime(lastBackupTimestamp) && (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                          {getRelativeTime(lastBackupTimestamp)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-500 italic text-xs">
                      No automated backup snapshot recorded yet. Click "Capture Today's Snapshot Now" below.
                    </span>
                  )}
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                    <HardDrive className="w-3 h-3 text-slate-400" />
                    Storage Target: localStorage
                  </span>
                  {latestSnapshot && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                      Serialized: {latestSnapshot.size_kb} KB
                    </span>
                  )}
                  {latestSnapshot && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                      Orders: {latestSnapshot.record_counts.orders} | Customers: {latestSnapshot.record_counts.customers}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <button
                type="button"
                onClick={() => handleCreateDailySnapshotNow(false)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Backup Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Automated Daily Destination
            </label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                <input
                  type="radio"
                  name="auto_backup_mode"
                  value="local_storage"
                  checked={autoBackupMode === 'local_storage'}
                  onChange={() => handleChangeAutoBackupMode('local_storage')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>Save to Browser Storage (Silent)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                <input
                  type="radio"
                  name="auto_backup_mode"
                  value="prompt_download"
                  checked={autoBackupMode === 'prompt_download'}
                  onChange={() => handleChangeAutoBackupMode('prompt_download')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>Trigger File Download (.json)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                <input
                  type="radio"
                  name="auto_backup_mode"
                  value="both"
                  checked={autoBackupMode === 'both'}
                  onChange={() => handleChangeAutoBackupMode('both')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>Both (Local Storage + File Download)</span>
              </label>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-700 mb-1">Backup Protection Schedule</span>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <div className="flex items-center justify-between">
                <span>Frequency:</span>
                <span className="font-semibold text-slate-800">Once Daily (on login)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Retention:</span>
                <span className="font-semibold text-slate-800">Last 14 Daily Snapshots</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Auto Run:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {settings.last_auto_backup_at
                    ? new Date(settings.last_auto_backup_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Initial seed'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2">
            <button
              type="button"
              onClick={() => handleCreateDailySnapshotNow(false)}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>CAPTURE TODAY'S SNAPSHOT NOW</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateDailySnapshotNow(true)}
              className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Snapshot & Download (.json)</span>
            </button>
          </div>
        </div>

        {/* Saved Snapshots Archive Gallery */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FolderArchive className="w-4 h-4 text-slate-500" />
              <h4 className="font-bold text-xs text-slate-800">
                Preserved Daily Snapshots in Browser Storage ({dailySnapshots.length})
              </h4>
            </div>

            {dailySnapshots.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all archived daily snapshots from browser storage?')) {
                    clearAllDailySnapshots();
                  }
                }}
                className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
              >
                Clear Archive
              </button>
            )}
          </div>

          {dailySnapshots.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No daily automated snapshots saved yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                The system will automatically record a snapshot on your next session, or you can capture today's database snapshot immediately.
              </p>
              <button
                type="button"
                onClick={() => handleCreateDailySnapshotNow(false)}
                className="mt-1 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Today's Snapshot Now</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-60 overflow-y-auto">
              {dailySnapshots.map(snap => (
                <div
                  key={snap.id}
                  className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                        {snap.date_key}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {snap.size_kb} KB
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span className="font-mono">{snap.file_name}</span>
                      <span className="text-slate-300">•</span>
                      <span>
                        <strong className="text-slate-800 font-mono">{snap.record_counts.orders}</strong> orders,{' '}
                        <strong className="text-slate-800 font-mono">{snap.record_counts.customers}</strong> customers,{' '}
                        <strong className="text-slate-800 font-mono">{snap.record_counts.invoices}</strong> invoices
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* RESTORE BUTTON */}
                    <button
                      type="button"
                      onClick={() => setPendingDailySnapshot(snap)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESTORE</span>
                    </button>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={() => handleDownloadSnapshot(snap)}
                      title="Download this snapshot file (.json)"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete snapshot for ${snap.date_key}?`)) {
                          deleteDailySnapshot(snap.id);
                        }
                      }}
                      title="Delete this snapshot"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ON-DEMAND DATABASE EXPORT & RESTORE UTILITY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-amber-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Manual JSON Export & File Restore</h3>
              <p className="text-xs text-slate-500">
                Export full database state as a portable JSON file or upload external backups
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              Active Sync
            </span>
            <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              v2.0 Schema
            </span>
          </div>
        </div>

        {/* Live Database Inventory Metrics */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Current Database State in Memory & Local Storage
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Orders</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{orders.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Loads / Trips</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{loads.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Invoices</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{invoices.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Customers</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{customers.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Drivers</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{drivers.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Vehicles</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{vehicles.length}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Action Card */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Download className="w-4 h-4 text-amber-600" />
                <span>Export Database as JSON</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Download a self-contained, complete snapshot containing all customers, orders, loads, invoices, fleet vehicles, rates, payments, and expenses.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>DOWNLOAD CLIENT BACKUP (.JSON)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedJSON ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>{copiedJSON ? 'Copied!' : 'Copy Raw JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleServerBackupDownload}
                  title="Download server-side persistent database copy"
                  className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Server className="w-3 h-3 text-amber-500" />
                  <span>Server Backup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Import Action Card */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Restore Database From JSON File</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload a previously saved JSON backup file. The system will inspect and validate the record counts before restoring.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              disabled={isRestoring}
              onClick={handleTriggerFileInput}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FileJson className="w-3.5 h-3.5 text-white" />
              <span>{isRestoring ? 'Restoring Database...' : 'SELECT & RESTORE BACKUP FILE'}</span>
            </button>
          </div>
        </div>

        {/* Audit Trail for Maintenance & Backups */}
        {dbAuditLogs.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-2">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Recent Database Actions & Audit Log</span>
            </div>
            <div className="space-y-1.5">
              {dbAuditLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-[10px] bg-slate-200 px-1 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-600">{log.details}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. RESTORE CONFIRMATION PREVIEW MODAL (DAILY SNAPSHOT) */}
      {/* ========================================================================= */}
      {pendingDailySnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 text-white rounded-lg">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Restore Daily Database Snapshot</h3>
                  <p className="text-[11px] text-emerald-100">Revert system database to this saved state</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDailySnapshot(null)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span className="font-mono">Date: {pendingDailySnapshot.date_key}</span>
                  <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono">
                    {pendingDailySnapshot.size_kb} KB
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Captured at:{' '}
                  <span className="font-mono">{new Date(pendingDailySnapshot.timestamp).toLocaleString()}</span>
                </p>
                <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Current orders and changes since this snapshot will be replaced with this archive.</span>
                </p>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-2">Record Counts in this Snapshot:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Orders:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pendingDailySnapshot.record_counts.orders}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Loads:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pendingDailySnapshot.record_counts.loads}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Customers:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pendingDailySnapshot.record_counts.customers}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Invoices:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pendingDailySnapshot.record_counts.invoices}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Drivers:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pendingDailySnapshot.record_counts.drivers}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Vehicles:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pendingDailySnapshot.record_counts.vehicles}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDailySnapshot(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmDailyRestore}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isRestoring ? 'Restoring Snapshot...' : 'CONFIRM & RESTORE DATABASE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RESTORE CONFIRMATION PREVIEW MODAL (FILE UPLOAD) */}
      {/* ========================================================================= */}
      {pendingRestore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Confirm File Database Restore</h3>
                  <p className="text-[11px] text-slate-400">Review backup contents before overwriting active database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span className="font-mono">{pendingRestore.fileName}</span>
                  <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono">
                    {pendingRestore.fileSizeKb} KB
                  </span>
                </div>
                {pendingRestore.exportedAt && (
                  <p className="text-[11px] text-amber-800">
                    Exported timestamp: <span className="font-mono">{new Date(pendingRestore.exportedAt).toLocaleString()}</span>
                  </p>
                )}
                <p className="text-[11px] text-amber-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Restoring will update all active tables in memory, browser storage, and server database.</span>
                </p>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-2">Record Counts in Backup File:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Orders:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.orders}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Loads / Trips:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.loads}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Customers:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.customers}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Invoices:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.invoices}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Drivers:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.drivers}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Vehicles:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.vehicles}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Payments:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.payments}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <span className="text-slate-600">Expenses:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingRestore.counts.expenses}</span>
                  </div>
                </div>
              </div>

              {pendingRestore.sampleCustomer && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">Sample verified record: </span>
                  {pendingRestore.sampleCustomer} {pendingRestore.sampleOrder ? `(${pendingRestore.sampleOrder})` : ''}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isRestoring ? 'Applying Backup...' : 'CONFIRM & RESTORE NOW'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MAIN BUSINESS & COMPANY SETTINGS FORM */}
      {/* ========================================================================= */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Identity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900">Company Identity & Location</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Business Name *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={e => handleChange('business_name', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Office Address Line 1</label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={e => handleChange('address_line1', e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Line 2 / Landmark</label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={e => handleChange('address_line2', e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={e => handleChange('pincode', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Office Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Dispatch Number</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => handleChange('whatsapp', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Dispatch Parameters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900">Billing, Invoices & Default Rates</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={e => handleChange('invoice_prefix', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono font-bold uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format: {formData.invoice_prefix}-2026-00001
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Driver Rate per Load (₹)</label>
              <input
                type="number"
                value={formData.default_driver_load_rate}
                onChange={e => handleChange('default_driver_load_rate', parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded p-2 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default trip fare awarded to driver upon delivery
              </span>
            </div>
          </div>

          {/* GST Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={formData.enable_gst}
                onChange={e => handleChange('enable_gst', e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span>Enable GST Billing (Optional - Defaults to Non-GST)</span>
            </label>
            <p className="text-[11px] text-slate-500">
              The business currently operates on standard commercial challan billing. Toggle only if GST registration is active.
            </p>

            {formData.enable_gst && (
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => handleChange('gstin', e.target.value)}
                  placeholder="33AABCM1234F1Z8"
                  className="w-full max-w-xs border border-slate-300 rounded p-2 font-mono uppercase"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Invoice Footer Note & Terms</label>
            <textarea
              rows={2}
              value={formData.invoice_footer}
              onChange={e => handleChange('invoice_footer', e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>
        </div>

        {/* Banking & UPI Settlement */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Bank & UPI Settlement (Printed on Bills)</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={e => handleChange('bank_name', e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">UPI ID (Google Pay / PhonePe)</label>
              <input
                type="text"
                value={formData.upi_id}
                onChange={e => handleChange('upi_id', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={formData.bank_account_no}
                onChange={e => handleChange('bank_account_no', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.bank_ifsc}
                onChange={e => handleChange('bank_ifsc', e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Sample Chennai Data
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            SAVE SETTINGS
          </button>
        </div>
      </form>
    </div>
  );
};
