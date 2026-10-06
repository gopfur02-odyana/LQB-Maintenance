import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  Plus, 
  Calendar, 
  Clock, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  Activity, 
  X, 
  User, 
  Check, 
  Filter,
  FileSpreadsheet,
  ArrowUpDown
} from 'lucide-react';
import { STPRecord, Personnel } from '../types/stp';

interface STPReadingViewProps {
  records: STPRecord[];
  personnelList?: Personnel[];
  onRecordCreated: (newRecord: STPRecord) => void;
  onOpenWhatsAppShare: (record: STPRecord) => void;
  isOnlineSheetsConfigured?: boolean;
}

export const STPReadingView: React.FC<STPReadingViewProps> = ({
  records,
  personnelList = [],
  onRecordCreated,
  onOpenWhatsAppShare,
  isOnlineSheetsConfigured = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter STP records
  const stpRecords = useMemo(() => {
    return records
      .filter((r) => r.logType === 'daily_stp' || (!r.pekerjaan && r.flowMeterEffluent !== undefined))
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [records]);

  // Latest reading summary
  const latestStp = stpRecords[0];

  // Form states
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jam, setJam] = useState(new Date().toTimeString().substring(0, 5));
  const [shift, setShift] = useState('Shift 1 (Pagi)');
  const [flowMeterInflow, setFlowMeterInflow] = useState<number>(14500);
  const [flowMeterEffluent, setFlowMeterEffluent] = useState<number>(14120);
  const [phAerasi, setPhAerasi] = useState<number>(7.2);
  const [phEffluent, setPhEffluent] = useState<number>(7.4);
  const [petugas, setPetugas] = useState('Operator STP');
  const [catatan, setCatatan] = useState('Reading flow meter & pH normal, air limbah effluent jernih tidak berbau.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto debit calculation
  const calculatedDebit = useMemo(() => {
    if (latestStp && latestStp.flowMeterEffluent && flowMeterEffluent > latestStp.flowMeterEffluent) {
      return flowMeterEffluent - latestStp.flowMeterEffluent;
    }
    return 45; // default reasonable estimate in m3/day
  }, [latestStp, flowMeterEffluent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date();
    const newRecord: STPRecord = {
      id: `STP-${Date.now().toString().slice(-6)}`,
      logType: 'daily_stp',
      unitId: 'eq_stp_facility',
      unitNama: 'Sewage Treatment Plant (STP)',
      platform: 'AREA STP FASILITAS',
      lokasi: 'Area STP Fasilitas',
      timestamp: now.toISOString(),
      tanggal: tanggal,
      jam: jam,
      shift: shift,
      flowMeterInflow: Number(flowMeterInflow),
      flowMeterEffluent: Number(flowMeterEffluent),
      debitHarian: Number(calculatedDebit),
      phAerasi: Number(phAerasi),
      phEffluent: Number(phEffluent),
      petugas: petugas.trim() || 'Operator STP',
      catatan: catatan.trim() || 'Reading harian flow meter & pH STP.',
      syncStatus: isOnlineSheetsConfigured ? 'Tersinkron Online' : 'Mengirim...',
      statusPekerjaan: 'Complete',
    };

    onRecordCreated(newRecord);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005BAC] text-white">
                <Droplet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Reading Harian STP (Sewage Treatment Plant)
                </h2>
                <p className="text-xs text-slate-500">
                  Laporan terpisah khusus pemantauan harian Flow Meter Inflow/Effluent dan pH Air Limbah
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005BAC] hover:bg-[#00488a] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Reading STP Hari Ini</span>
          </button>
        </div>

        {/* 4 STP Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Hari Tercatat</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{stpRecords.length} Hari</span>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-blue-700 block">Flowmeter Effluent Terakhir</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-blue-900">
                {latestStp?.flowMeterEffluent ? latestStp.flowMeterEffluent.toLocaleString('id-ID') : '-'}
              </span>
              <span className="text-xs font-bold text-blue-600">m³</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700">pH Effluent (Baku Mutu 6-9)</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded">
                Normal
              </span>
            </div>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
              {latestStp?.phEffluent ? latestStp.phEffluent : '-'}
            </span>
          </div>

          <div className="p-3.5 bg-purple-50 border border-purple-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-purple-700 block">pH Bak Aerasi</span>
            <span className="text-2xl font-black text-purple-900 mt-0.5 block">
              {latestStp?.phAerasi ? latestStp.phAerasi : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* STP Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#005BAC]" />
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Riwayat Reading Flow Meter & pH STP
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {stpRecords.length} Laporan Tersimpan
          </span>
        </div>

        {stpRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Droplet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Readingan STP</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Silakan catat readingan flow meter dan pH hari ini dengan tombol di bawah.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#005BAC] hover:bg-[#00488a] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Reading Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal & Jam</th>
                  <th className="p-3.5">Shift</th>
                  <th className="p-3.5 text-right">Flow Inflow (m³)</th>
                  <th className="p-3.5 text-right">Flow Effluent (m³)</th>
                  <th className="p-3.5 text-center">pH Aerasi</th>
                  <th className="p-3.5 text-center">pH Effluent</th>
                  <th className="p-3.5">Operator</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stpRecords.map((r) => {
                  const isPhNormal = (r.phEffluent || 7) >= 6.0 && (r.phEffluent || 7) <= 9.0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.tanggal}</span>
                          <span className="text-slate-400 font-mono text-[11px] ml-1">{r.jam}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">{r.shift || 'Shift 1'}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {r.flowMeterInflow ? r.flowMeterInflow.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-blue-900">
                        {r.flowMeterEffluent ? r.flowMeterEffluent.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-purple-700">
                        {r.phAerasi || '-'}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                          isPhNormal
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {r.phEffluent || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{r.petugas || 'Operator'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenWhatsAppShare(r)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Share WA</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Reading STP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-[#005BAC] to-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Catat Reading Harian STP</h3>
                  <p className="text-[11px] text-blue-200">Parameter Khusus Flow Meter & pH Air Limbah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Tanggal & Jam */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Reading</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam & Shift</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      required
                      value={jam}
                      onChange={(e) => setJam(e.target.value)}
                      className="w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                    />
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="Shift 1 (Pagi)">Shift 1</option>
                      <option value="Shift 2 (Malam)">Shift 2</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Flow Meter Section */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <span className="font-bold text-blue-900 block text-xs flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  <span>Angka Flow Meter (m³):</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-blue-800 block mb-1">Flow Meter Inflow (m³)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={flowMeterInflow}
                      onChange={(e) => setFlowMeterInflow(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl font-mono text-base font-bold text-slate-900 text-center"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-blue-800 block mb-1">Flow Meter Effluent (m³)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={flowMeterEffluent}
                      onChange={(e) => setFlowMeterEffluent(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl font-mono text-base font-bold text-blue-900 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* pH Section */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <span className="font-bold text-emerald-900 block text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kualitas pH (Standar Baku Mutu: 6.0 - 9.0):</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-emerald-800 block mb-1">pH Bak Aerasi</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      required
                      value={phAerasi}
                      onChange={(e) => setPhAerasi(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl font-mono text-base font-bold text-purple-800 text-center"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-emerald-800 block mb-1">pH Effluent (Air Keluar)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      required
                      value={phEffluent}
                      onChange={(e) => setPhEffluent(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl font-mono text-base font-bold text-emerald-900 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Petugas & Catatan */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Operator STP</label>
                <input
                  type="text"
                  list="stp-personnel-suggestions"
                  required
                  placeholder="Pilih atau ketik nama operator"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
                <datalist id="stp-personnel-suggestions">
                  {personnelList.filter((p) => p.isAktif).map((p) => (
                    <option key={p.id} value={p.nama}>{p.jabatan}</option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Kondisi Air / STP</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {isOnlineSheetsConfigured ? '🟢 Auto-kirim ke Sheet STP' : '⚠️ Google Sheets belum dihubungkan'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#005BAC] hover:bg-[#00488a] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Reading STP'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
