import React from 'react';
import { 
  Wrench, 
  Droplet, 
  Building2, 
  Database, 
  FileSpreadsheet, 
  Share2, 
  RefreshCw,
  CheckCircle2,
  Settings,
  Activity
} from 'lucide-react';
import { PertaminaPheOsesLogo } from './PertaminaPheOsesLogo';

export type ActiveTab = 'maintenance' | 'stp' | 'cotp' | 'equipment' | 'database' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  maintenanceCount: number;
  stpCount: number;
  cotpCount?: number;
  equipmentCount: number;
  isOnlineSheetsConfigured?: boolean;
  onOpenWhatsAppShare?: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  maintenanceCount,
  stpCount,
  cotpCount,
  equipmentCount,
  isOnlineSheetsConfigured = false,
  onOpenWhatsAppShare,
  onManualSync,
  isSyncing = false,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'maintenance',
      label: 'Laporan Maintenance',
      icon: <Wrench className="w-4 h-4" />,
      badge: maintenanceCount,
    },
    {
      id: 'stp',
      label: 'Reading STP Harian',
      icon: <Droplet className="w-4 h-4" />,
      badge: stpCount,
    },
    {
      id: 'cotp',
      label: 'Reading COTP',
      icon: <Activity className="w-4 h-4 text-[#FF6F00]" />,
      badge: cotpCount,
    },
    {
      id: 'equipment',
      label: 'Data Peralatan',
      icon: <Building2 className="w-4 h-4" />,
      badge: equipmentCount,
    },
    {
      id: 'database',
      label: 'Rekap Logbook',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    // Header non-floating (tidak mengambang), menyatu dengan alur halaman
    <header className="bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 border-b-2 border-[#ED1C24] text-white relative shadow-md">
      {/* Top Pertamina Line: Merah - Biru - Oranye */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#ED1C24]"></div>
        <div className="flex-1 bg-[#005BAC]"></div>
        <div className="flex-1 bg-[#FF6F00]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            {/* Official PERTAMINA PHE OSES Logo */}
            <PertaminaPheOsesLogo variant="badge" size="md" className="shrink-0 shadow-lg border border-white/20" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base md:text-lg tracking-wider text-white">
                  LQB MAINTENANCE
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#ED1C24] text-white shadow-xs">
                  OFFSHORE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold tracking-wide">
                Cinta Complex
              </p>
            </div>
          </div>

          {/* Right Header Status & Quick Actions */}
          <div className="flex items-center gap-2 text-xs">
            {/* Google Sheets Status Pill */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                isOnlineSheetsConfigured
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Status Integrasi Google Sheets & Pengaturan"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isOnlineSheetsConfigured ? 'Sheets Terhubung' : 'Sambungkan Sheets'}</span>
            </button>

            {/* WA Quick Share */}
            {onOpenWhatsAppShare && (
              <button
                type="button"
                onClick={onOpenWhatsAppShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                title="Kirim Laporan Cepat ke Grup WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WA</span>
              </button>
            )}

            {/* Refresh Sync Button */}
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Refresh / Sinkronkan Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#FF6F00]' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar text-xs font-bold">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#002855] text-white' : 'bg-white/20 text-slate-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
