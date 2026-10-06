import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Calendar, 
  CheckCircle2, 
  Save, 
  Gauge, 
  Share2, 
  Copy, 
  Check, 
  Trash2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { COTPRecord, STPRecord } from '../types/stp';

interface COTPReadingViewProps {
  cotpRecords: COTPRecord[];
  allRecords: STPRecord[];
  onSaveCOTPRecord: (record: COTPRecord) => void;
  onDeleteCOTPRecord?: (id: string) => void;
  isOnlineSheetsConfigured?: boolean;
}

export const COTPReadingView: React.FC<COTPReadingViewProps> = ({
  cotpRecords,
  allRecords,
  onSaveCOTPRecord,
  onDeleteCOTPRecord,
  isOnlineSheetsConfigured = false,
}) => {
  // Sort records descending by date
  const sortedRecords = useMemo(() => {
    return [...cotpRecords].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [cotpRecords]);

  // Previous reading (terakhir sebelum hari ini atau data terakhir)
  const previousRecord = sortedRecords[0];
  const prevC1Total = previousRecord?.cotp1TotalHours ?? (previousRecord?.cotp1Hours ? Number(previousRecord.cotp1Hours) : 104);
  const prevC2Total = previousRecord?.cotp2TotalHours ?? (previousRecord?.cotp2Hours ? Number(previousRecord.cotp2Hours) : 210);

  // Form states - ONLY Tanggal, Total Jam COTP 1, Total Jam COTP 2
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [cotp1Total, setCotp1Total] = useState<number | string>(prevC1Total);
  const [cotp2Total, setCotp2Total] = useState<number | string>(prevC2Total);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [waCopied, setWaCopied] = useState(false);

  // Auto calculate daily running hours
  const calculatedC1Daily = useMemo(() => {
    const val = Number(cotp1Total);
    if (isNaN(val)) return 0;
    // Jika ada previous record di tanggal yang berbeda
    if (previousRecord && previousRecord.tanggal !== tanggal) {
      return Math.max(0, Number((val - prevC1Total).toFixed(1)));
    }
    return Math.max(0, Number(val));
  }, [cotp1Total, previousRecord, prevC1Total, tanggal]);

  const calculatedC2Daily = useMemo(() => {
    const val = Number(cotp2Total);
    if (isNaN(val)) return 0;
    if (previousRecord && previousRecord.tanggal !== tanggal) {
      return Math.max(0, Number((val - prevC2Total).toFixed(1)));
    }
    return Math.max(0, Number(val));
  }, [cotp2Total, previousRecord, prevC2Total, tanggal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const c1TotalNum = Number(cotp1Total) || 0;
    const c2TotalNum = Number(cotp2Total) || 0;

    const diff1 = previousRecord && previousRecord.tanggal !== tanggal 
      ? Math.max(0, Number((c1TotalNum - prevC1Total).toFixed(1)))
      : (previousRecord ? Math.max(0, Number((c1TotalNum - (previousRecord.cotp1TotalHours || 0)).toFixed(1))) : c1TotalNum);

    const diff2 = previousRecord && previousRecord.tanggal !== tanggal
      ? Math.max(0, Number((c2TotalNum - prevC2Total).toFixed(1)))
      : (previousRecord ? Math.max(0, Number((c2TotalNum - (previousRecord.cotp2TotalHours || 0)).toFixed(1))) : c2TotalNum);

    const newRecord: COTPRecord = {
      id: `COTP-${tanggal.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      tanggal,
      cotp1TotalHours: c1TotalNum,
      cotp1DailyHours: diff1,
      cotp2TotalHours: c2TotalNum,
      cotp2DailyHours: diff2,
      cotp1Hours: diff1,
      cotp2Hours: diff2,
      cotp1Status: diff1 > 0 ? 'Running' : 'Standby',
      cotp2Status: diff2 > 0 ? 'Running' : 'Standby',
      timestamp: `${tanggal} 00:00:00`,
    };

    onSaveCOTPRecord(newRecord);
    setToastMsg(`✅ Reading COTP berhasil disimpan! (COTP 1: ${diff1} Jam, COTP 2: ${diff2} Jam)`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper date format: 06 okt 2026
  const formatIndoDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Generated WhatsApp Text - Exactly as user requested:
  // *LAPORAN HARIAN LQB*
  // COTP 1 : 5 Jam (Running) / 5 Jam
  // COTP 2 : 0 Jam (Standby)
  // Tanggal: 06 okt 2026
  // Total Pekerjaan: 5 
  // 1. jenis Pekerjaan:   Lokasi: 
  //         Deskripsi Pekerjaan:
  //         Status: 
  const generatedWhatsAppText = useMemo(() => {
    const formattedDate = formatIndoDate(tanggal);

    // Ambil data COTP hari ini jika ada di records
    const todayCotp = sortedRecords.find((c) => c.tanggal === tanggal);
    const c1Hours = todayCotp ? todayCotp.cotp1DailyHours : calculatedC1Daily;
    const c2Hours = todayCotp ? todayCotp.cotp2DailyHours : calculatedC2Daily;

    const c1Text = `${c1Hours} Jam${c1Hours > 0 ? ' (Running)' : ' (Standby)'}`;
    const c2Text = `${c2Hours} Jam${c2Hours > 0 ? ' (Running)' : ' (Standby)'}`;

    // Ambil pekerjaan maintenance tanggal ini
    const todayWork = allRecords.filter((r) => {
      const isMaint = r.logType === 'service_all' || !!r.pekerjaan;
      return isMaint && r.tanggal === tanggal;
    });

    const workItems = todayWork.length > 0 ? todayWork : allRecords.filter((r) => r.logType === 'service_all' || !!r.pekerjaan).slice(0, 5);

    let msg = `*LAPORAN HARIAN LQB*\n`;
    msg += `COTP 1 : ${c1Text}\n`;
    msg += `COTP 2 : ${c2Text}\n`;
    msg += `Tanggal: ${formattedDate}\n`;
    msg += `Total Pekerjaan: ${workItems.length} \n`;

    if (workItems.length === 0) {
      msg += `1. jenis Pekerjaan: Utility Gedung   Lokasi: Cinta Complex\n`;
      msg += `        Deskripsi Pekerjaan: Rutin pemantauan fasilitas & inspeksi harian\n`;
      msg += `        Status: Complete\n`;
    } else {
      workItems.forEach((w, idx) => {
        const jenis = w.kategoriPekerjaan || w.unitKategori || 'Utility Gedung';
        const loc = w.lokasi || `${w.platform || 'Cinta Complex'}, ${w.lantai || ''} ${w.ruangan || ''}`.trim();
        const desc = w.pekerjaan || w.unitNama || 'Perawatan Fasilitas';
        const status = w.statusPekerjaan || 'Complete';

        msg += `${idx + 1}. jenis Pekerjaan: ${jenis}   Lokasi: ${loc}\n`;
        msg += `        Deskripsi Pekerjaan: ${desc}\n`;
        msg += `        Status: ${status}\n`;
      });
    }

    return msg;
  }, [tanggal, calculatedC1Daily, calculatedC2Daily, sortedRecords, allRecords]);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generatedWhatsAppText);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(generatedWhatsAppText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002855] to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-[#FF6F00] rounded-xl text-white shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Reading Harian COTP</h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#ED1C24] text-white">
              LQB RUNNING HOURS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Cukup masukkan <strong>Total Jam</strong> pompa (register meter), sistem otomatis menghitung <strong>lama running per hari</strong> (selisih reading).
          </p>
        </div>

        {/* Current Total Register Pill */}
        {previousRecord && (
          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 flex items-center gap-4 text-xs shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Terakhir Dicatat ({previousRecord.tanggal})</span>
              <div className="flex items-center gap-3 mt-0.5">
                <div>
                  <span className="text-slate-300 text-[11px]">COTP 1: </span>
                  <span className="font-extrabold text-amber-400">{previousRecord.cotp1TotalHours ?? previousRecord.cotp1Hours} Jam</span>
                </div>
                <div className="border-l border-white/20 pl-3">
                  <span className="text-slate-300 text-[11px]">COTP 2: </span>
                  <span className="font-extrabold text-sky-400">{previousRecord.cotp2TotalHours ?? previousRecord.cotp2Hours} Jam</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Grid: Form Sederhana (Left) & WhatsApp Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input Form Total Jam Saja */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-[#FF6F00]" />
                Input Total Jam COTP
              </h2>
              <p className="text-xs text-slate-500">
                Masukkan angka meteran total jam saat ini.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Tanggal */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tanggal Reading</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#002855]"
              />
            </div>

            {/* COTP 1 Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border-2 border-amber-300 rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#FF6F00] text-white flex items-center justify-center font-black text-xs">1</span>
                  COTP 1
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Kemarin: <strong className="text-slate-800">{prevC1Total} Jam</strong>
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Jam COTP 1 *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={cotp1Total}
                    onChange={(e) => setCotp1Total(e.target.value)}
                    placeholder="Contoh: 109"
                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl font-mono text-lg font-black text-amber-950 outline-none focus:ring-2 focus:ring-[#FF6F00]"
                  />
                  <span className="absolute right-4 top-3 font-bold text-slate-500 text-xs">Jam</span>
                </div>
              </div>

              {/* Automatic Running Hours Calculation Callout */}
              <div className="p-2.5 bg-amber-100/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <span className="font-semibold text-amber-900 text-xs">Running Hari Ini (Selisih):</span>
                <span className="font-black text-amber-950 text-sm">
                  {calculatedC1Daily} Jam {calculatedC1Daily > 0 ? '🟢 (Running)' : '⚪ (Standby)'}
                </span>
              </div>
            </div>

            {/* COTP 2 Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border-2 border-blue-300 rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#005BAC] text-white flex items-center justify-center font-black text-xs">2</span>
                  COTP 2
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Kemarin: <strong className="text-slate-800">{prevC2Total} Jam</strong>
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Jam COTP 2 *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={cotp2Total}
                    onChange={(e) => setCotp2Total(e.target.value)}
                    placeholder="Contoh: 210"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl font-mono text-lg font-black text-blue-950 outline-none focus:ring-2 focus:ring-[#005BAC]"
                  />
                  <span className="absolute right-4 top-3 font-bold text-slate-500 text-xs">Jam</span>
                </div>
              </div>

              {/* Automatic Running Hours Calculation Callout */}
              <div className="p-2.5 bg-blue-100/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <span className="font-semibold text-blue-900 text-xs">Running Hari Ini (Selisih):</span>
                <span className="font-black text-blue-950 text-sm">
                  {calculatedC2Daily} Jam {calculatedC2Daily > 0 ? '🟢 (Running)' : '⚪ (Standby)'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {isOnlineSheetsConfigured ? '🟢 Tersambung ke Google Sheets' : '⚪ Mode Offline'}
              </span>

              <button
                type="submit"
                className="px-7 py-3.5 bg-[#002855] hover:bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Simpan Reading COTP</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: WhatsApp Live Format */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  Format Laporan WhatsApp LQB
                </h3>
                <p className="text-[11px] text-slate-500">Otomatis menampilkan jam running COTP 1 & COTP 2 hari ini.</p>
              </div>
            </div>

            <div className="mt-3 bg-[#EFEAE2] p-4.5 rounded-2xl border border-slate-300 shadow-inner">
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto shadow-xs">
                {generatedWhatsAppText}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className={`flex-1 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                waCopied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              {waCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{waCopied ? 'Teks Tersalin!' : 'Salin Teks WA'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim ke WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Riwayat Reading COTP Sederhana */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-900">Riwayat Reading Jam Jalan COTP ({sortedRecords.length})</h3>

        {sortedRecords.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">Belum ada data reading tersimpan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Total Jam COTP 1</th>
                  <th className="py-3 px-4">Running COTP 1</th>
                  <th className="py-3 px-4">Total Jam COTP 2</th>
                  <th className="py-3 px-4">Running COTP 2</th>
                  {onDeleteCOTPRecord && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {sortedRecords.map((r) => {
                  const c1Tot = r.cotp1TotalHours ?? r.cotp1Hours ?? 0;
                  const c1Day = r.cotp1DailyHours ?? (r.cotp1Hours || 0);
                  const c2Tot = r.cotp2TotalHours ?? r.cotp2Hours ?? 0;
                  const c2Day = r.cotp2DailyHours ?? (r.cotp2Hours || 0);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.tanggal}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{c1Tot} Jam</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full font-black text-[11px] bg-amber-100 text-amber-900">
                          {c1Day} Jam {Number(c1Day) > 0 ? '(Running)' : '(Standby)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{c2Tot} Jam</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full font-black text-[11px] bg-blue-100 text-blue-900">
                          {c2Day} Jam {Number(c2Day) > 0 ? '(Running)' : '(Standby)'}
                        </span>
                      </td>
                      {onDeleteCOTPRecord && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteCOTPRecord(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Reading"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
