import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Share2, 
  Smartphone, 
  Calendar, 
  Wrench, 
  MapPin, 
  Activity, 
  FileText,
  Users
} from 'lucide-react';
import { STPRecord, EquipmentUnit, COTPRecord } from '../types/stp';
import { PertaminaPheOsesLogo } from './PertaminaPheOsesLogo';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: STPRecord | null;
  allRecords?: STPRecord[];
  equipmentList: EquipmentUnit[];
  cotpRecords?: COTPRecord[];
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  record,
  allRecords = [],
  equipmentList,
  cotpRecords = [],
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mode, setMode] = useState<'grup_singkat' | 'single' | 'daily_recap'>('grup_singkat');
  const [copied, setCopied] = useState(false);

  // Helper to find location of a unit
  const getLocation = (unitId?: string, unitNama?: string, defaultLoc?: string) => {
    if (defaultLoc) return defaultLoc;
    const found = equipmentList.find((e) => e.id === unitId || e.nama === unitNama);
    return found?.lokasi || 'Area Gedung & Fasilitas';
  };

  // Helper to format date in Indonesian style (e.g., 06 okt 2026)
  const formatIndoDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('id-ID');
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

  // 1. FORMAT PESAN RINGKAS WHATSAPP (GLOBAL UTILITY GEDUNG):
  const generateGrupSingkatMessage = (rec: STPRecord) => {
    const isSTP = rec.logType === 'daily_stp';
    const formattedTanggal = formatIndoDate(rec.tanggal);
    
    // Format lokasi (Cinta Papa, lantai 2 room 04)
    let lokasi = rec.lokasi || getLocation(rec.unitId, rec.unitNama, rec.lokasi);
    if (rec.platform) {
      const p = rec.platform.toLowerCase().includes('papa') ? 'Cinta Papa' : 'Cinta Charlie';
      const l = rec.lantai ? rec.lantai.toLowerCase() : '';
      const r = rec.ruangan ? rec.ruangan.toLowerCase() : '';
      lokasi = `${p}, ${l} ${r}`.trim();
    }

    const kategori = rec.kategoriPekerjaan || rec.unitKategori || 'Utility Gedung';
    const pekerjaan = isSTP 
      ? 'Daily Reading Flowmeter & pH STP' 
      : rec.pekerjaan || rec.unitNama || 'Perawatan Fasilitas';

    let keterangan = isSTP
      ? `flow inlet ${rec.flowMeterInflow || 0} m3, outlet ${rec.flowMeterEffluent || 0} m3, pH ${rec.phEffluent || 7.0}`
      : rec.catatan || rec.tindakanPerbaikan || rec.keteranganTeknis || 'Pekerjaan selesai dengan baik';

    const status = rec.statusPekerjaan?.includes('FINDING')
      ? 'FINDING'
      : rec.statusPekerjaan?.includes('Menunggu')
      ? 'Menunggu Sparepart'
      : rec.statusPekerjaan?.includes('Complete') || rec.statusPekerjaan?.includes('Selesai')
      ? 'Complete'
      : rec.statusPekerjaan || 'Complete';

    return isSTP
      ? `Tanggal ${formattedTanggal}.lokasi STP, readingan ${pekerjaan}, keterangan ${keterangan}, status ${status}`
      : `Tanggal ${formattedTanggal}.lokasi ${lokasi},kategori ${kategori},pekerjaannya ${pekerjaan}, keterangan ${keterangan}, status ${status}`;
  };

  // Helper to get formatted single activity message (Formal multi-line)
  const generateSingleMessage = (rec: STPRecord) => {
    const isSTP = rec.logType === 'daily_stp';
    const formattedTanggal = formatIndoDate(rec.tanggal);
    const lokasi = rec.lokasi || getLocation(rec.unitId, rec.unitNama, rec.lokasi);
    const kategori = rec.kategoriPekerjaan || rec.unitKategori || 'Utility Gedung';
    const pekerjaan = isSTP 
      ? 'Daily Reading Flowmeter & pH STP' 
      : rec.pekerjaan || rec.unitNama || 'Perawatan Fasilitas';
    
    let keterangan = '';
    if (isSTP) {
      keterangan = `Flowmeter Inflow: ${rec.flowMeterInflow || 0} m³, Effluent: ${rec.flowMeterEffluent || 0} m³, Debit: ${rec.debitHarian || 0} m³/hari, pH Effluent: ${rec.phEffluent || 7.0}`;
    } else {
      keterangan = rec.catatan || rec.tindakanPerbaikan || rec.keteranganTeknis || 'Pekerjaan selesai dengan baik.';
    }

    const status = rec.statusPekerjaan?.includes('FINDING')
      ? 'FINDING (Open)'
      : rec.statusPekerjaan?.includes('Menunggu')
      ? 'Menunggu Sparepart'
      : rec.statusPekerjaan || 'Complete';

    let msg = `*LAPORAN PEKERJAAN UTILITY - PHE OSES*\n`;
    msg += `Tanggal: ${formattedTanggal}\n`;
    msg += `Lokasi: ${lokasi}\n`;
    if (!isSTP) msg += `Kategori: ${kategori}\n`;
    msg += `Pekerjaan: ${pekerjaan}\n`;
    msg += `Keterangan: ${keterangan}\n`;
    msg += `Status: ${status}\n`;
    if (rec.petugas) {
      msg += `Pelaksana: ${rec.petugas}\n`;
    }
    return msg;
  };

  // Helper to get formatted daily recap (Format Standar LQB)
  const generateDailyRecapMessage = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = allRecords.filter((r) => {
      const isMaint = r.logType === 'service_all' || !!r.pekerjaan;
      return isMaint && r.tanggal === today;
    });
    const logsToFormat = todayLogs.length > 0 
      ? todayLogs 
      : allRecords.filter((r) => r.logType === 'service_all' || !!r.pekerjaan).slice(0, 5);

    const formattedDate = formatIndoDate(todayLogs.length > 0 ? today : logsToFormat[0]?.tanggal || today);

    // Ambil data COTP terbaru atau hari ini
    const cotpToday = cotpRecords.find((c) => c.tanggal === today) || cotpRecords[0];
    const cotp1Display = cotpToday
      ? `${cotpToday.cotp1Hours} Jam${cotpToday.cotp1Status ? ` (${cotpToday.cotp1Status})` : ''}`
      : '24 Jam (Running)';
    const cotp2Display = cotpToday
      ? `${cotpToday.cotp2Hours} Jam${cotpToday.cotp2Status ? ` (${cotpToday.cotp2Status})` : ''}`
      : '0 Jam (Standby)';

    let msg = `*LAPORAN HARIAN LQB*\n`;
    msg += `COTP 1 : ${cotp1Display}\n`;
    msg += `COTP 2 : ${cotp2Display}\n`;
    msg += `Tanggal: ${formattedDate}\n`;
    msg += `Total Pekerjaan: ${logsToFormat.length} \n`;

    if (logsToFormat.length === 0) {
      msg += `1. jenis Pekerjaan: Utility Gedung   Lokasi: Cinta Complex\n`;
      msg += `        Deskripsi Pekerjaan: Rutin pemantauan fasilitas & inspeksi harian\n`;
      msg += `        Status: Complete\n`;
    } else {
      logsToFormat.forEach((item, idx) => {
        const jenis = item.kategoriPekerjaan || item.unitKategori || 'Utility Gedung';
        const lokasi = item.lokasi || `${item.platform || 'Cinta Complex'}, ${item.lantai || ''} ${item.ruangan || ''}`.trim();
        const deskripsi = item.pekerjaan || item.unitNama || 'Perawatan Fasilitas';
        const status = item.statusPekerjaan || 'Complete';

        msg += `${idx + 1}. jenis Pekerjaan: ${jenis}   Lokasi: ${lokasi}\n`;
        msg += `        Deskripsi Pekerjaan: ${deskripsi}\n`;
        msg += `        Status: ${status}\n`;
      });
    }

    return msg;
  };

  const activeRec = record || (allRecords.length > 0 ? allRecords[0] : null);

  const messageText = useMemo(() => {
    if (mode === 'daily_recap') {
      return generateDailyRecapMessage();
    }
    if (mode === 'grup_singkat') {
      if (activeRec) return generateGrupSingkatMessage(activeRec);
      return 'Tanggal 06 okt 2026.lokasi Cinta Papa, lantai 2 room 04,pekerjaannya steam AC split 1.5 PK, keterangan preasure 75 Psi ,Ampere 3.8 A,dan suhu evap 8°C, status Complete';
    }
    if (activeRec) {
      return generateSingleMessage(activeRec);
    }
    return '*LAPORAN HARIAN FASILITAS*\nTidak ada kegiatan terpilih.';
  }, [mode, activeRec, allRecords, equipmentList]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    const encoded = encodeURIComponent(messageText);
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Top Pertamina Accent Bar: Merah - Biru - Oranye */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="flex-1 bg-[#ED1C24]"></div>
          <div className="flex-1 bg-[#005BAC]"></div>
          <div className="flex-1 bg-[#FF6F00]"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-md border border-white/20">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Bagikan Laporan Singkat WhatsApp</h3>
                <PertaminaPheOsesLogo variant="badge" size="sm" />
              </div>
              <p className="text-xs text-slate-300">
                Format ringkas: Jenis Pekerjaan, Nama Peralatan, Lokasi, dan Status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex flex-wrap gap-2 sm:gap-4 text-xs font-bold bg-slate-50">
          <button
            type="button"
            onClick={() => setMode('grup_singkat')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'grup_singkat'
                ? 'border-[#005BAC] text-[#005BAC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Format Singkat Grup WA (Contoh)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('single')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'single'
                ? 'border-[#005BAC] text-[#005BAC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Format Rapi Berbaris</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('daily_recap')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'daily_recap'
                ? 'border-[#005BAC] text-[#005BAC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#FF6F00]" />
            <span>Rekap Semua Hari Ini ({allRecords.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* WhatsApp Text Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Pesan WhatsApp:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Siap dikirim</span>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap select-all max-h-64 overflow-y-auto shadow-inner">
              {messageText}
            </div>
          </div>

          {/* Optional Direct Number */}
          <div className="p-3.5 bg-slate-100 rounded-2xl space-y-2">
            <label className="font-bold text-slate-800 block text-xs">
              Nomor WhatsApp Tujuan (Opsional):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Contoh: 08123456789 atau 628123456789 (kosongkan untuk pilih kontak di WA)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              💡 Jika dikosongkan, Anda dapat memilih kontak atau grup WhatsApp secara bebas saat WhatsApp terbuka.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Teks Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Salin Teks WhatsApp</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer w-full sm:w-auto text-center"
            >
              Tutup
            </button>
            {(() => {
              let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
              if (cleanPhone.startsWith('0')) {
                cleanPhone = '62' + cleanPhone.substring(1);
              }
              const encoded = encodeURIComponent(messageText);
              const waUrl = cleanPhone 
                ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
                : `https://api.whatsapp.com/send?text=${encoded}`;
              return (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>Buka & Kirim ke WhatsApp</span>
                </a>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
