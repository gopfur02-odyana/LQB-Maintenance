import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Check, 
  Wrench, 
  Gauge, 
  AlertCircle, 
  Clock4, 
  CheckCircle2, 
  X, 
  ImageIcon,
  Edit3,
  Share2
} from 'lucide-react';
import { STPRecord, EquipmentUnit, LogType, ServiceStatus } from '../types/stp';
import { STP_DAILY_COLUMNS, SERVICE_MAINTENANCE_COLUMNS } from '../data/initialData';
import { exportMaintenanceToExcel, exportSTPToExcel } from '../utils/excelExport';

interface DatabaseLogViewerProps {
  records: STPRecord[];
  equipmentList: EquipmentUnit[];
  onEditEquipment?: (unit: EquipmentUnit) => void;
  onUpdateRecordStatus?: (recordId: string, newStatus: ServiceStatus) => void;
  onOpenWhatsAppShare?: (record?: STPRecord) => void;
}

export const DatabaseLogViewer: React.FC<DatabaseLogViewerProps> = ({ 
  records, 
  equipmentList,
  onEditEquipment,
  onUpdateRecordStatus,
  onOpenWhatsAppShare,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<LogType>('daily_stp');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<STPRecord | null>(null);
  const [copiedDailyHeader, setCopiedDailyHeader] = useState(false);
  const [copiedServiceHeader, setCopiedServiceHeader] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  // Filter records based on Active View Tab
  const tabRecords = records.filter((r) => r.logType === activeViewTab);

  const filteredRecords = tabRecords.filter((rec) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      rec.id.toLowerCase().includes(q) ||
      rec.unitNama.toLowerCase().includes(q) ||
      rec.petugas.toLowerCase().includes(q) ||
      rec.tanggal.includes(q) ||
      (rec.catatan && rec.catatan.toLowerCase().includes(q)) ||
      (rec.masalahKeluhan && rec.masalahKeluhan.toLowerCase().includes(q)) ||
      (rec.tindakanPerbaikan && rec.tindakanPerbaikan.toLowerCase().includes(q));

    const matchesUnit = selectedUnitFilter === 'ALL' || rec.unitId === selectedUnitFilter;
    const matchesStatus = statusFilter === 'ALL' || rec.statusPekerjaan === statusFilter;

    return matchesSearch && matchesUnit && matchesStatus;
  });

  const handleCopyDailyHeader = () => {
    const headers = STP_DAILY_COLUMNS.map((c) => c.header).join('\t');
    navigator.clipboard.writeText(headers);
    setCopiedDailyHeader(true);
    setTimeout(() => setCopiedDailyHeader(false), 2500);
  };

  const handleCopyServiceHeader = () => {
    const headers = SERVICE_MAINTENANCE_COLUMNS.map((c) => c.header).join('\t');
    navigator.clipboard.writeText(headers);
    setCopiedServiceHeader(true);
    setTimeout(() => setCopiedServiceHeader(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (activeViewTab === 'daily_stp') {
      const headers = STP_DAILY_COLUMNS.map((c) => `"${c.header}"`).join(',');
      const rows = filteredRecords.map((r) => [
        `"${r.id}"`,
        `"${r.tanggal}"`,
        `"${r.jam}"`,
        `"${r.petugas}"`,
        `"${r.shift || 'Shift 1'}"`,
        r.flowMeterInflow || 0,
        r.flowMeterEffluent || 0,
        r.debitHarian || 0,
        r.phAerasi || 0,
        r.phEffluent || 0,
        `"${r.fotoUrl || 'foto.jpg'}"`,
        `"${(r.catatan || '').replace(/"/g, '""')}"`,
      ].join(','));

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Reading_STP_Harian_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = SERVICE_MAINTENANCE_COLUMNS.map((c) => `"${c.header}"`).join(',');
      const rows = filteredRecords.map((r) => [
        `"${r.id}"`,
        `"${r.unitNama}"`,
        `"${r.tanggal}"`,
        `"${r.jam}"`,
        `"${r.petugas}"`,
        `"${r.prioritas || 'Sedang'}"`,
        `"${r.statusPekerjaan || 'Completed'}"`,
        `"${r.targetPenyelesaian || ''}"`,
        `"${r.jenisService || 'PM'}"`,
        `"${(r.masalahKeluhan || '').replace(/"/g, '""')}"`,
        `"${(r.tindakanPerbaikan || '').replace(/"/g, '""')}"`,
        `"${(r.sparepartDiganti || '').replace(/"/g, '""')}"`,
        `"${r.fotoServiceUrl || r.fotoUrl || ''}"`,
        `"${(r.catatan || '').replace(/"/g, '""')}"`,
      ].join(','));

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Service_Maintenance_Log_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 overflow-hidden relative">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#ED1C24]"></div>
          <div className="flex-1 bg-[#005BAC]"></div>
          <div className="flex-1 bg-[#FF6F00]"></div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 text-white rounded-xl shadow-xs">
                <Database className="w-5 h-5 text-[#FF6F00]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Logbook Database Operasional & Maintenance
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#ED1C24] text-white">
                    PHE OSES
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Data tersinkronisasi otomatis: <strong>Reading Harian STP</strong> (Flow meter & pH) dan <strong>Record Service</strong> (semua unit, status FINDING, & foto bukti).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeViewTab === 'daily_stp' ? (
              <button
                onClick={handleCopyDailyHeader}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-[#005BAC] hover:bg-[#004b8f] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border-b-2 border-[#FF6F00]"
                title="Salin Header untuk Sheet: Reading_STP_Harian"
              >
                {copiedDailyHeader ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" /> Header STP Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#FF6F00]" /> Salin Header Sheet Reading_STP_Harian
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCopyServiceHeader}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-[#ED1C24] hover:bg-[#cb151b] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border-b-2 border-[#FF6F00]"
                title="Salin Header untuk Sheet: Service_Maintenance_Log"
              >
                {copiedServiceHeader ? (
                  <>
                    <Check className="w-4 h-4 text-white" /> Header Service Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" /> Salin Header Sheet Service_Maintenance_Log
                  </>
                )}
              </button>
            )}

            {onOpenWhatsAppShare && (
              <button
                type="button"
                onClick={() => onOpenWhatsAppShare()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                title="Bagikan rekap kegiatan harian ke WhatsApp"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>Share Rekap WA</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (activeViewTab === 'daily_stp') {
                  exportSTPToExcel(records);
                } else {
                  exportMaintenanceToExcel(records);
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Unduh file Excel (.xlsx) dengan kolom rapi dan wrap text"
            >
              <Download className="w-4 h-4 text-white" /> Unduh Excel (.xlsx) Rapih
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#FF6F00]" /> Ekspor CSV
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 pt-2 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveViewTab('daily_stp')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'daily_stp'
                ? 'border-[#005BAC] text-[#005BAC]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gauge className="w-4 h-4 text-[#005BAC]" />
            <span>1. Log Reading Harian STP ({records.filter((r) => r.logType === 'daily_stp').length})</span>
          </button>

          <button
            onClick={() => setActiveViewTab('service_all')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeViewTab === 'service_all'
                ? 'border-[#ED1C24] text-[#ED1C24]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4 text-[#ED1C24]" />
            <span>2. Log Record Service & Tracking Finding ({records.filter((r) => r.logType === 'service_all').length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeViewTab === 'daily_stp' ? "Cari tanggal, operator, ID..." : "Cari alat, masalah finding, teknisi..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {activeViewTab === 'service_all' && (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <span className="text-slate-500 font-semibold shrink-0">Filter Alat:</span>
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">Semua Peralatan ({equipmentList.length})</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nama}
                  </option>
                ))}
              </select>

              {/* Shortcut Tombol Edit Alat jika unit tertentu dipilih */}
              {selectedUnitFilter !== 'ALL' && onEditEquipment && (
                <button
                  type="button"
                  onClick={() => {
                    const unit = equipmentList.find((e) => e.id === selectedUnitFilter);
                    if (unit) onEditEquipment(unit);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Edit data peralatan yang sedang difilter ini"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Edit Alat Ini</span>
                </button>
              )}

              <span className="text-slate-500 font-semibold shrink-0 ml-2">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">Semua Status</option>
                <option value="FINDING (Belum Selesai / Open)">🔴 FINDING (Open)</option>
                <option value="Menunggu Sparepart">🟡 Menunggu Sparepart</option>
                <option value="Completed / Selesai Normal">🟢 Selesai</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TABLE 1: READING HARIAN STP */}
      {activeViewTab === 'daily_stp' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">ID Reading</th>
                  <th className="py-3.5 px-4">Tanggal & Jam</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Shift</th>
                  <th className="py-3.5 px-4">Inlet (m³)</th>
                  <th className="py-3.5 px-4">Outlet (m³)</th>
                  <th className="py-3.5 px-3 text-center bg-blue-950">Debit (m³/hari)</th>
                  <th className="py-3.5 px-3 text-center">pH Aerasi</th>
                  <th className="py-3.5 px-3 text-center bg-blue-950">pH Effluent (Baku Mutu)</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((rec) => {
                  const isPhSafe = rec.phEffluent && rec.phEffluent >= 6.0 && rec.phEffluent <= 9.0;
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{rec.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{rec.tanggal} {rec.jam}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{rec.petugas}</td>
                      <td className="py-3 px-4 text-slate-600">{rec.shift}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{rec.flowMeterInflow?.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{rec.flowMeterEffluent?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/30">
                        {rec.debitHarian || 46} m³
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{rec.phAerasi}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold bg-blue-50/30">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            isPhSafe
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800 font-black'
                          }`}
                        >
                          {rec.phEffluent}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {onOpenWhatsAppShare && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsAppShare(rec)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Bagikan reading ini ke WhatsApp"
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
      )}

      {/* TABLE 2: RECORD SERVICE SEMUA PERALATAN (FINDINGS & FOTO BUKTI) */}
      {activeViewTab === 'service_all' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">ID Service</th>
                  <th className="py-3.5 px-4">Unit / Lokasi</th>
                  <th className="py-3.5 px-4">Kategori Utility</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Uraian Pekerjaan / Keterangan</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Pelaksana</th>
                  <th className="py-3.5 px-3 text-center">Foto Bukti</th>
                  <th className="py-3.5 px-3 text-center">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((rec) => {
                  const isFindingOpen = rec.statusPekerjaan === 'FINDING (Belum Selesai / Open)';
                  const isWaitingPart = rec.statusPekerjaan === 'Menunggu Sparepart';

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isFindingOpen ? 'bg-rose-50/20' : isWaitingPart ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{rec.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.unitNama}</span>
                          {onEditEquipment && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const unit = equipmentList.find((u) => u.id === rec.unitId || u.nama === rec.unitNama);
                                if (unit) onEditEquipment(unit);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer transition-colors"
                              title={`Edit data unit ${rec.unitNama}`}
                            >
                              <Edit3 className="w-3 h-3 text-emerald-600" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{rec.tanggal}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {rec.kategoriPekerjaan || rec.unitKategori || 'Utility Gedung'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isFindingOpen
                              ? 'bg-rose-600 text-white'
                              : isWaitingPart
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rec.statusPekerjaan || 'Complete'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-900 font-bold line-clamp-1">
                          {rec.pekerjaan || rec.unitNama || 'Perawatan'}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {rec.catatan || rec.tindakanPerbaikan || rec.keteranganTeknis || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {rec.tanggal} {rec.jam && <span className="text-[10px] text-slate-400 block">{rec.jam}</span>}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {rec.petugas || '-'}
                      </td>

                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {rec.fotoServiceUrl || rec.fotoUrl ? (
                          <button
                            type="button"
                            onClick={() => setPhotoModalUrl(rec.fotoServiceUrl || rec.fotoUrl || null)}
                            className="w-9 h-9 rounded-lg overflow-hidden border border-slate-300 inline-block hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer shadow-xs"
                            title="Klik untuk perbesar foto"
                          >
                            <img
                              src={rec.fotoServiceUrl || rec.fotoUrl}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {onOpenWhatsAppShare && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsAppShare(rec)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Bagikan laporan servis ini ke WhatsApp"
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
      )}

      {/* Record Inspector Drawer */}
      {selectedRecord && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 font-mono font-bold rounded-lg text-xs ${
                selectedRecord.logType === 'daily_stp' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {selectedRecord.id}
              </span>
              <h3 className="font-bold text-base">
                {selectedRecord.logType === 'daily_stp' ? 'Reading Harian STP' : `Service: ${selectedRecord.unitNama}`}
              </h3>
              <span className="text-xs text-slate-400">
                {selectedRecord.tanggal} ({selectedRecord.jam})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenWhatsAppShare && (
                <button
                  type="button"
                  onClick={() => onOpenWhatsAppShare(selectedRecord)}
                  className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Bagikan rincian kegiatan ini ke WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share ke WhatsApp</span>
                </button>
              )}
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>

          {selectedRecord.logType === 'daily_stp' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Flow Meter:</span>
                <div>Inlet: <strong className="font-mono text-white">{selectedRecord.flowMeterInflow} m³</strong></div>
                <div>Outlet: <strong className="font-mono text-white">{selectedRecord.flowMeterEffluent} m³</strong></div>
                <div>Debit Hari Ini: <strong className="text-emerald-400 font-bold">{selectedRecord.debitHarian} m³</strong></div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Uji Parameter pH:</span>
                <div>pH Aerasi: <strong className="text-white">{selectedRecord.phAerasi}</strong></div>
                <div>pH Effluent: <strong className="text-emerald-400 font-bold">{selectedRecord.phEffluent}</strong></div>
                <div className="text-[10px] text-slate-400">Baku Mutu: 6.0 - 9.0</div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Operator & Shift:</span>
                <div className="text-white font-bold">{selectedRecord.petugas}</div>
                <div className="text-slate-300">{selectedRecord.shift}</div>
                <div className="text-slate-400 pt-1 text-[11px]">{selectedRecord.catatan}</div>
                {onEditEquipment && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const stpUnit = equipmentList.find((e) => e.isSTP) || equipmentList[0];
                        if (stpUnit) onEditEquipment(stpUnit);
                      }}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Info Unit STP</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-800/80 rounded-xl space-y-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Unit & Pelaksana:</span>
                  <div className="text-white font-bold text-sm flex items-center justify-between">
                    <span>{selectedRecord.unitNama}</span>
                    {onEditEquipment && (
                      <button
                        type="button"
                        onClick={() => {
                          const unit = equipmentList.find((u) => u.id === selectedRecord.unitId || u.nama === selectedRecord.unitNama);
                          if (unit) onEditEquipment(unit);
                        }}
                        className="px-2 py-0.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Edit data alat ini"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Edit Alat</span>
                      </button>
                    )}
                  </div>
                  <div className="text-emerald-400 font-medium">Teknisi: {selectedRecord.petugas}</div>
                  <div className="text-slate-300">Jenis: {selectedRecord.jenisService}</div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl space-y-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Status Pekerjaan:</span>
                  <div>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedRecord.statusPekerjaan || 'Normal Siap Operasi'}
                    </span>
                  </div>
                  {onUpdateRecordStatus && (
                    <div className="pt-1">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Ubah Status Laporan:</label>
                      <select
                        value={selectedRecord.statusPekerjaan}
                        onChange={(e) => {
                          const newStat = e.target.value as any;
                          onUpdateRecordStatus(selectedRecord.id, newStat);
                          setSelectedRecord((prev) => prev ? { ...prev, statusPekerjaan: newStat } : null);
                        }}
                        className="w-full text-xs bg-slate-700 border border-slate-600 rounded p-1 text-white font-medium cursor-pointer"
                      >
                        <option value="FINDING (Belum Selesai / Open)">🔴 FINDING (Belum Selesai / Open)</option>
                        <option value="Menunggu Sparepart">🟡 Menunggu Sparepart</option>
                        <option value="In Progress / Running Test">🔵 In Progress / Running Test</option>
                        <option value="Completed / Selesai Normal">🟢 Completed / Selesai Normal</option>
                      </select>
                    </div>
                  )}
                  <div className="text-slate-300 pt-0.5">Prioritas: <strong className="text-white">{selectedRecord.prioritas}</strong></div>
                  {selectedRecord.targetPenyelesaian && (
                    <div className="text-rose-400 font-mono">Target: {selectedRecord.targetPenyelesaian}</div>
                  )}
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Foto Dokumentasi:</span>
                  {selectedRecord.fotoServiceUrl || selectedRecord.fotoUrl ? (
                    <button
                      type="button"
                      onClick={() => setPhotoModalUrl(selectedRecord.fotoServiceUrl || selectedRecord.fotoUrl || null)}
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 cursor-pointer pt-1 font-semibold"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Lihat Foto Kerusakan</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 italic">Tidak ada foto</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl space-y-1.5 text-slate-300">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Temuan / Finding:</span>
                  <p className="text-white font-semibold leading-relaxed">{selectedRecord.masalahKeluhan}</p>
                </div>
                <div className="pt-1 border-t border-slate-700/60">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Tindakan Perbaikan:</span>
                  <p className="text-slate-200 leading-relaxed">{selectedRecord.tindakanPerbaikan}</p>
                </div>
                {selectedRecord.sparepartDiganti && (
                  <div className="pt-1 border-t border-slate-700/60 text-amber-300">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block text-slate-400">Sparepart:</span>
                    {selectedRecord.sparepartDiganti}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
