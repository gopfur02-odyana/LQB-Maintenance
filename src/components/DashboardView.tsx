import React, { useState } from 'react';
import { 
  BarChart3, 
  Droplet, 
  Activity, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Calculator, 
  CheckCircle2, 
  ShieldCheck, 
  Wrench, 
  AlertTriangle,
  AlertCircle,
  Clock4,
  Flame,
  CheckCheck,
  ExternalLink,
  ImageIcon,
  Filter,
  Edit3,
  MapPin,
  Share2
} from 'lucide-react';
import { STPRecord, EquipmentUnit, ServiceStatus } from '../types/stp';
import { FORMULA_TEMPLATES } from '../data/initialData';

interface DashboardViewProps {
  records: STPRecord[];
  equipmentList: EquipmentUnit[];
  onEditEquipment?: (unit: EquipmentUnit) => void;
  onUpdateRecordStatus?: (recordId: string, newStatus: ServiceStatus) => void;
  onOpenWhatsAppShare?: (record?: STPRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  records, 
  equipmentList,
  onEditEquipment,
  onUpdateRecordStatus,
  onOpenWhatsAppShare,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);
  const [findingFilter, setFindingFilter] = useState<'ALL' | 'FINDING' | 'SPAREPART' | 'COMPLETED'>('ALL');
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  // Dynamic Formula Builder settings
  const [customSheetName, setCustomSheetName] = useState('Service_Maintenance_Log');

  // Filter records
  const monthlyRecords = records.filter((r) => r.tanggal.startsWith(selectedMonth));
  const stpDailyRecords = monthlyRecords.filter((r) => r.logType === 'daily_stp');
  const serviceRecords = monthlyRecords.filter((r) => r.logType === 'service_all');

  // Finding Stats across ALL service records
  const allServiceRecords = records.filter((r) => r.logType === 'service_all');
  const openFindings = allServiceRecords.filter((r) => r.statusPekerjaan === 'FINDING (Belum Selesai / Open)');
  const waitingSparepart = allServiceRecords.filter((r) => r.statusPekerjaan === 'Menunggu Sparepart');
  const inProgress = allServiceRecords.filter((r) => r.statusPekerjaan === 'In Progress / Running Test');
  const completedServices = allServiceRecords.filter((r) => r.statusPekerjaan === 'Completed / Selesai Normal');

  // STP Metrics
  const totalStp = stpDailyRecords.length;
  const avgPhEffluent = totalStp > 0
    ? (stpDailyRecords.reduce((acc, curr) => acc + (curr.phEffluent || 0), 0) / totalStp).toFixed(2)
    : '0.00';
  const totalDebit = stpDailyRecords.reduce((acc, curr) => acc + (curr.debitHarian || 46), 0);

  // Filtered Findings Table
  const filteredFindingRecords = allServiceRecords.filter((r) => {
    if (findingFilter === 'FINDING') return r.statusPekerjaan === 'FINDING (Belum Selesai / Open)';
    if (findingFilter === 'SPAREPART') return r.statusPekerjaan === 'Menunggu Sparepart';
    if (findingFilter === 'COMPLETED') return r.statusPekerjaan === 'Completed / Selesai Normal';
    return true;
  });

  const handleCopyFormula = (formulaStr: string, id: string) => {
    navigator.clipboard.writeText(formulaStr);
    setCopiedFormulaId(id);
    setTimeout(() => setCopiedFormulaId(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Month Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Executive Dashboard: Facility & Maintenance Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan ringkasan reading harian STP & monitoring status temuan servis (Finding Tracker).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenWhatsAppShare && (
            <button
              type="button"
              onClick={() => onOpenWhatsAppShare()}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Kirim laporan rekap kegiatan harian ke WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-white" />
              <span>Share Rekap WA</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards: FINDING FOCUS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Finding Card */}
        <div className="bg-white p-5 rounded-2xl border-2 border-rose-300 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
            <span>FINDING TERBUKA</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{openFindings.length}</span>
            <span className="text-xs text-rose-700 font-semibold">Pekerjaan</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-800 font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-600" /> Butuh tindak lanjut segera
          </div>
        </div>

        {/* Waiting Sparepart */}
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>MENUNGGU SPAREPART</span>
            <Clock4 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{waitingSparepart.length}</span>
            <span className="text-xs text-amber-700 font-semibold">Pekerjaan</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800 font-medium">
            Proses pengadaan / order part
          </div>
        </div>

        {/* Completed Service */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>PEKERJAAN SELESAI</span>
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{completedServices.length}</span>
            <span className="text-xs text-slate-400">Tuntas</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            Kondisi mesin normal beroperasi
          </div>
        </div>

        {/* Reading STP Harian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>READING STP HARIAN</span>
            <Droplet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-700">{totalStp}</span>
            <span className="text-xs text-slate-400">Hari</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            Avg pH: <strong className="text-emerald-700 font-mono">{avgPhEffluent}</strong> • Total: <strong className="font-mono">{totalDebit} m³</strong>
          </div>
        </div>
      </div>

      {/* SECTION KHUSUS: RANGKUMAN FINDING & STATUS PEKERJAAN */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Rangkuman Temuan Masalah & Outstanding Work (Finding Tracker)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh pekerjaan servis, status finding terbuka, dan foto kerusakan yang memerlukan perhatian manajemen.
            </p>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFindingFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                findingFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({allServiceRecords.length})
            </button>
            <button
              onClick={() => setFindingFilter('FINDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                findingFilter === 'FINDING'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Finding Terbuka ({openFindings.length})</span>
            </button>
            <button
              onClick={() => setFindingFilter('SPAREPART')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                findingFilter === 'SPAREPART'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Clock4 className="w-3.5 h-3.5" />
              <span>Menunggu Part ({waitingSparepart.length})</span>
            </button>
            <button
              onClick={() => setFindingFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                findingFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Selesai ({completedServices.length})
            </button>
          </div>
        </div>

        {/* Table of Findings */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 text-left">ID & Unit Peralatan</th>
                <th className="py-3 px-4 text-left">Prioritas</th>
                <th className="py-3 px-4 text-left">Status Pekerjaan</th>
                <th className="py-3 px-4 text-left">Deskripsi Finding / Masalah</th>
                <th className="py-3 px-4 text-left">Target / Selesai</th>
                <th className="py-3 px-4 text-left">Teknisi</th>
                <th className="py-3 px-3 text-center">Foto Bukti</th>
                <th className="py-3 px-3 text-center">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFindingRecords.map((item) => {
                const isFindingOpen = item.statusPekerjaan === 'FINDING (Belum Selesai / Open)';
                const isWaitingPart = item.statusPekerjaan === 'Menunggu Sparepart';

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isFindingOpen ? 'bg-rose-50/30' : isWaitingPart ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="font-mono text-[10px] text-blue-700">{item.id}</div>
                      <div className="text-xs font-bold mt-0.5 flex items-center gap-1.5">
                        <span>{item.unitNama}</span>
                        {onEditEquipment && (
                          <button
                            type="button"
                            onClick={() => {
                              const unit = equipmentList.find((e) => e.id === item.unitId || e.nama === item.unitNama);
                              if (unit) onEditEquipment(unit);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer transition-colors"
                            title={`Edit info unit ${item.unitNama}`}
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.tanggal}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.prioritas?.includes('Tinggi')
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : item.prioritas?.includes('Sedang')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.prioritas || 'Sedang (Normal)'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isFindingOpen
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isWaitingPart
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.statusPekerjaan || 'Completed'}
                        </span>

                        {onUpdateRecordStatus && (
                          <div className="pt-1">
                            <select
                              value={item.statusPekerjaan}
                              onChange={(e) => onUpdateRecordStatus(item.id, e.target.value as any)}
                              className="w-full text-[10px] bg-white border border-slate-200 rounded p-1 text-slate-700 font-semibold cursor-pointer hover:border-blue-400 transition-colors"
                              title="Ubah status pengerjaan secara langsung"
                            >
                              <option value="FINDING (Belum Selesai / Open)">🔴 FINDING (Open)</option>
                              <option value="Menunggu Sparepart">🟡 Menunggu Sparepart</option>
                              <option value="In Progress / Running Test">🔵 In Progress</option>
                              <option value="Completed / Selesai Normal">🟢 Completed / Selesai</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="text-slate-900 font-semibold leading-relaxed">
                        {item.masalahKeluhan}
                      </div>
                      {item.sparepartDiganti && (
                        <div className="text-amber-800 text-[10px] mt-1 font-medium bg-amber-50 p-1.5 rounded border border-amber-200">
                          📦 Part: {item.sparepartDiganti}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.targetPenyelesaian ? (
                        <span className="font-bold text-rose-700">{item.targetPenyelesaian}</span>
                      ) : (
                        <span>{item.tanggal}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {item.petugas}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {item.fotoServiceUrl || item.fotoUrl ? (
                        <button
                          type="button"
                          onClick={() => setPhotoModalUrl(item.fotoServiceUrl || item.fotoUrl || null)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 inline-block hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer shadow-xs"
                          title="Klik untuk perbesar foto"
                        >
                          <img
                            src={item.fotoServiceUrl || item.fotoUrl}
                            alt="Foto Bukti"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {onOpenWhatsAppShare && (
                        <button
                          type="button"
                          onClick={() => onOpenWhatsAppShare(item)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Share temuan ini ke WhatsApp"
                        >
                          <Share2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>WA</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: STATUS PERALATAN TERDAFTAR & TOMBOL EDIT */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              Daftar Peralatan Terdaftar & Manajemen Fasilitas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Status pemeliharaan tiap unit mesin gedung dan tombol edit cepat untuk mengubah nama, kode, atau lokasi.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            Total {equipmentList.length} Unit Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipmentList.map((unit) => {
            const unitRecords = records.filter((r) => r.unitId === unit.id || r.unitNama === unit.nama);
            const unitFindings = unitRecords.filter((r) => r.statusPekerjaan === 'FINDING (Belum Selesai / Open)');
            const latestRecord = unitRecords[0];

            return (
              <div
                key={unit.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  unitFindings.length > 0
                    ? 'bg-rose-50/40 border-rose-200 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {unit.kode}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        unit.isSTP
                          ? 'bg-blue-100 text-blue-800'
                          : unitFindings.length > 0
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {unit.isSTP ? 'STP Harian' : unitFindings.length > 0 ? `${unitFindings.length} Finding` : 'Normal'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{unit.nama}</h4>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{unit.lokasi}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {unit.deskripsi}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {unitRecords.length} Riwayat Laporan
                  </span>

                  {/* Tombol Edit Peralatan */}
                  {onEditEquipment && (
                    <button
                      type="button"
                      onClick={() => onEditEquipment(unit)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title={`Edit data unit ${unit.nama}`}
                    >
                      <Edit3 className="w-3 h-3 text-blue-600" />
                      <span>Edit Alat</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Formula Generator Section */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xl space-y-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Formula Google Sheets untuk Melacak Status "FINDING" Otomatis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gunakan formula di bawah ini untuk menarik semua pekerjaan yang masih berstatus Finding / Open ke sheet khusus.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* Formula 1: FILTER ONLY FINDINGS */}
          {(() => {
            const formula1 = `=FILTER(${customSheetName}!A2:N, ${customSheetName}!G2:G = "FINDING (Belum Selesai / Open)")`;
            return (
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    1. Formula Menarik Semua Baris Status "FINDING" (FILTER)
                  </span>
                  <button
                    onClick={() => handleCopyFormula(formula1, 'formula-filter-finding')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {copiedFormulaId === 'formula-filter-finding' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Salin Formula
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-xs text-purple-300 overflow-x-auto">
                  <code>{formula1}</code>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tempelkan di sheet terpisah bernama <code>Rekap_Finding_Terbuka</code>; daftar masalah yang belum beres langsung tersaring otomatis.
                </p>
              </div>
            );
          })()}

          {/* Formula 2: COUNTIF FINDINGS */}
          {(() => {
            const formula2 = `=COUNTIF(${customSheetName}!G2:G, "FINDING (Belum Selesai / Open)")`;
            return (
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    2. Formula Menghitung Jumlah Finding yang Belum Selesai (COUNTIF)
                  </span>
                  <button
                    onClick={() => handleCopyFormula(formula2, 'formula-count-finding')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {copiedFormulaId === 'formula-count-finding' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Salin Formula
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto">
                  <code>{formula2}</code>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal Zoom Foto Bukti */}
      {photoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="font-bold text-sm">Foto Dokumentasi Kerusakan / Servis</span>
              <button
                onClick={() => setPhotoModalUrl(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Tutup [X]
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center">
              <img
                src={photoModalUrl}
                alt="Foto Dokumentasi Full"
                className="max-h-96 w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
