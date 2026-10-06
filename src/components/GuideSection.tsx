import React, { useState } from 'react';
import { 
  Database, 
  Globe, 
  Calculator, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Smartphone, 
  Wrench,
  Layers,
  Gauge,
  Sparkles
} from 'lucide-react';
import { STP_DAILY_COLUMNS, SERVICE_MAINTENANCE_COLUMNS, FORMULA_TEMPLATES } from '../data/initialData';

export const GuideSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'struktur' | 'skema_dua_tabel' | 'setup_online' | 'formula'>('skema_dua_tabel');
  const [copiedDailyId, setCopiedDailyId] = useState(false);
  const [copiedServiceId, setCopiedServiceId] = useState(false);
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormulaId(id);
    setTimeout(() => setCopiedFormulaId(null), 2500);
  };

  const handleCopyDailyHeader = () => {
    const headerStr = STP_DAILY_COLUMNS.map((c) => c.header).join('\t');
    navigator.clipboard.writeText(headerStr);
    setCopiedDailyId(true);
    setTimeout(() => setCopiedDailyId(false), 2500);
  };

  const handleCopyServiceHeader = () => {
    const headerStr = SERVICE_MAINTENANCE_COLUMNS.map((c) => c.header).join('\t');
    navigator.clipboard.writeText(headerStr);
    setCopiedServiceId(true);
    setTimeout(() => setCopiedServiceId(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('skema_dua_tabel')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'skema_dua_tabel'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Skema 2 Tab Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('struktur')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'struktur'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Susunan Kolom Kedua Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('setup_online')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'setup_online'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Panduan Setup AppSheet Online</span>
          </button>

          <button
            onClick={() => setActiveTab('formula')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'formula'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>4. Formula Agregasi Sheets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SKEMA DUA TABEL */}
      {activeTab === 'skema_dua_tabel' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-lg border border-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
              <Layers className="w-3.5 h-3.5" /> Skema Pemisahan Aktivitas
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Pemisahan Reading Harian STP vs Record Service Peralatan
            </h2>
            <p className="mt-2 text-slate-300 max-w-3xl text-sm leading-relaxed">
              Memisahkan aktivitas menjadi 2 tab di Google Sheets adalah solusi paling higienis dan praktis di lapangan:
              <strong> Reading STP diisi cepat setiap hari</strong>, sedangkan <strong>Record Service diisi berkala saat ada pekerjaan servis pada mesin apa pun</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sheet 1 Card */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                  <Gauge className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase">
                  Wajib Harian (Daily)
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Sheet 1: Reading_STP_Harian
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dikhususkan untuk operator shift yang berkeliling setiap hari memeriksa STP. Tidak perlu form panjang, cukup 2 parameter pokok:
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs space-y-1.5 text-blue-900">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Parameter yang Dicatat Setiap Hari:
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
                  <li><strong>Flowmeter Inlet ($m^3$)</strong> & <strong>Flowmeter Outlet ($m^3$)</strong></li>
                  <li><strong>Debit Harian ($m^3$)</strong> (Pengurangan otomatis)</li>
                  <li><strong>pH Effluent</strong> (Baku Mutu 6.0 – 9.0) & <strong>pH Aerasi</strong> (6.5 – 8.5)</li>
                  <li>Nama Operator Jaga & Shift Kerja</li>
                  <li>Foto register counter meteran & catatan singkat</li>
                </ul>
              </div>

              <button
                onClick={handleCopyDailyHeader}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedDailyId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" /> Header Sheet 1 Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Salin Header: Reading_STP_Harian
                  </>
                )}
              </button>
            </div>

            {/* Sheet 2 Card */}
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Wrench className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase">
                  Berkala / Saat Ada Servis
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Sheet 2: Service_Maintenance_Log
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Logbook riwayat servis dan perbaikan yang berlaku untuk <strong>SEMUA peralatan fasilitas</strong> (Chiller Sayur, Machine Dryer, Electric Stove Range, STP, dll):
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-xs space-y-1.5 text-emerald-900">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kapan & Apa yang Dicatat di Sini:
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
                  <li><strong>Tidak harus daily</strong> (hanya diisi saat ada jadwal PM atau servis).</li>
                  <li>Pilih unit mesin yang diservis (Chiller, Dryer, Stove, STP, atau alat baru).</li>
                  <li>Teknisi internal / Vendor eksternal yang mengerjakan.</li>
                  <li>Masalah / Keluhan & Tindakan Perbaikan yang dikerjakan.</li>
                  <li>Sparepart baru yang diganti & status mesin pasca servis.</li>
                </ul>
              </div>

              <button
                onClick={handleCopyServiceHeader}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedServiceId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" /> Header Sheet 2 Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Salin Header: Service_Maintenance_Log
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUSUNAN KOLOM KEDUA SHEET */}
      {activeTab === 'struktur' && (
        <div className="space-y-6">
          {/* Header 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  Header Sheet 1: <code>Reading_STP_Harian</code> (Khusus Harian STP)
                </h3>
                <p className="text-xs text-slate-500">Salin dan tempel di sel A1 sheet <code>Reading_STP_Harian</code>.</p>
              </div>
              <button
                onClick={handleCopyDailyHeader}
                className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                {copiedDailyId ? 'Tersalin!' : 'Salin Header'}
              </button>
            </div>
            <div className="bg-slate-950 text-blue-300 p-3 rounded-xl font-mono text-xs overflow-x-auto">
              <code>{STP_DAILY_COLUMNS.map((c) => c.header).join('\t')}</code>
            </div>
          </div>

          {/* Header 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  Header Sheet 2: <code>Service_Maintenance_Log</code> (Semua Peralatan)
                </h3>
                <p className="text-xs text-slate-500">Salin dan tempel di sel A1 sheet <code>Service_Maintenance_Log</code>.</p>
              </div>
              <button
                onClick={handleCopyServiceHeader}
                className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                {copiedServiceId ? 'Tersalin!' : 'Salin Header'}
              </button>
            </div>
            <div className="bg-slate-950 text-emerald-300 p-3 rounded-xl font-mono text-xs overflow-x-auto">
              <code>{SERVICE_MAINTENANCE_COLUMNS.map((c) => c.header).join('\t')}</code>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETUP APPSHEET ONLINE */}
      {activeTab === 'setup_online' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Menghubungkan 2 Sheet ke AppSheet (1 Aplikasi)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Di AppSheet, Anda dapat memasukkan kedua sheet tersebut dalam 1 aplikasi yang sama:
            </p>

            <ol className="list-decimal list-inside space-y-3 text-xs text-slate-700 pl-1">
              <li>
                <strong>Tambahkan Sheet 1:</strong> Buka <strong>Data &rarr; Tables</strong>, klik <em>Add Table</em> lalu pilih sheet <code>Reading_STP_Harian</code>.
              </li>
              <li>
                <strong>Tambahkan Sheet 2:</strong> Klik <em>Add Table</em> lagi, lalu pilih sheet <code>Service_Maintenance_Log</code>.
              </li>
              <li>
                <strong>Buat 2 Tombol di Menu HP:</strong> Buka <strong>UX &rarr; Views</strong>, buat 2 menu tampilan di bilah navigasi bawah smartphone teknisi:
                <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-slate-600">
                  <li>Tombol 1: <strong>"Reading STP"</strong> (tipe View: Form ke tabel Reading_STP_Harian).</li>
                  <li>Tombol 2: <strong>"Record Service"</strong> (tipe View: Form ke tabel Service_Maintenance_Log).</li>
                </ul>
              </li>
              <li>
                <strong>Selesai!</strong> Teknisi membuka aplikasi di HP: setiap hari mereka membuka tombol "Reading STP", dan bila ada servis mesin mereka membuka tombol "Record Service".
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 4: FORMULA */}
      {activeTab === 'formula' && (
        <div className="space-y-4">
          {FORMULA_TEMPLATES.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                </div>
                <button
                  onClick={() => handleCopy(item.formula, item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  {copiedFormulaId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Formula
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600">{item.description}</p>

              <div className="bg-slate-950 text-emerald-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
                <code>{item.formula}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
