import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Droplet, 
  Gauge, 
  Wrench, 
  Calendar, 
  Clock, 
  User, 
  Camera, 
  AlertTriangle, 
  Plus, 
  FileText, 
  RefreshCw, 
  Globe, 
  Upload, 
  X, 
  ImageIcon, 
  AlertCircle,
  Clock4,
  Flame,
  Check,
  Edit3,
  Share2,
  Activity
} from 'lucide-react';
import { STPRecord, EquipmentUnit, EquipmentServiceType, ServiceStatus, ServicePriority, LogType } from '../types/stp';

interface OnlineInputFormProps {
  onRecordCreated: (newRecord: STPRecord) => void;
  recentRecords: STPRecord[];
  equipmentList: EquipmentUnit[];
  onOpenEquipmentModal: () => void;
  onEditEquipment?: (unit: EquipmentUnit) => void;
  onOpenWhatsAppShare?: (record?: STPRecord) => void;
}

export const OnlineInputForm: React.FC<OnlineInputFormProps> = ({
  onRecordCreated,
  recentRecords,
  equipmentList,
  onOpenEquipmentModal,
  onEditEquipment,
  onOpenWhatsAppShare,
}) => {
  const [activeMode, setActiveMode] = useState<LogType>('daily_stp');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<{ id: string; targetSheet: string; summary: string; isFinding?: boolean; record?: STPRecord } | null>(null);

  // Common Fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jam, setJam] = useState(new Date().toTimeString().substring(0, 5));
  const [operator, setOperator] = useState('Operator 1');
  const [shift, setShift] = useState('Shift 1 (Pagi)');

  // 1. Daily STP Fields (Flow Meter & pH only)
  const [flowInlet, setFlowInlet] = useState<number>(14368);
  const [flowOutlet, setFlowOutlet] = useState<number>(13998);
  const [phAerasi, setPhAerasi] = useState<number>(7.2);
  const [phEffluent, setPhEffluent] = useState<number>(7.4);
  const [catatanDaily, setCatatanDaily] = useState('Reading flow meter & pH shift pagi normal.');
  const [dailyPhotoPreview, setDailyPhotoPreview] = useState<string | null>(null);

  // Calculate daily debit automatically
  const prevStp = recentRecords.find((r) => r.logType === 'daily_stp');
  const calculatedDebit = prevStp && prevStp.flowMeterEffluent 
    ? Math.max(0, flowOutlet - prevStp.flowMeterEffluent)
    : 48;

  // 2. Service & Maintenance Fields (All Equipment + FINDING TRACKING)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const selectedEquipment = equipmentList.find((e) => e.id === selectedEquipmentId) || equipmentList[0];
  
  const [teknisiService, setTeknisiService] = useState('Teknisi AC / Fasilitas');
  const [pekerjaan, setPekerjaan] = useState('Steam AC split 1.5 PK');
  const [jenisService, setJenisService] = useState<EquipmentServiceType>('Steam AC Split 1.5 PK');
  const [pressure, setPressure] = useState('75 Psi');
  const [ampere, setAmpere] = useState('3.8 A');
  const [suhuEvap, setSuhuEvap] = useState('8°C');
  const [prioritas, setPrioritas] = useState<ServicePriority>('Sedang (Normal)');
  const [statusPekerjaan, setStatusPekerjaan] = useState<ServiceStatus>('Complete');
  const [targetPenyelesaian, setTargetPenyelesaian] = useState(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
  const [masalahKeluhan, setMasalahKeluhan] = useState('Perawatan berkala steam & cuci unit indoor/outdoor.');
  const [tindakanPerbaikan, setTindakanPerbaikan] = useState('Steam evaporator & condenser, pembersihan drainase, pengetesan pressure & ampere.');
  const [sparepartDiganti, setSparepartDiganti] = useState('');
  const [catatanService, setCatatanService] = useState('Kondisi pendinginan optimal, hembusan angin normal.');
  
  // Real Image Upload State for Service Record
  const [servicePhotoPreview, setServicePhotoPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
  );

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'daily' | 'service') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'daily') {
          setDailyPhotoPreview(reader.result as string);
        } else {
          setServicePhotoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date();
    const dateFormatted = tanggal || now.toISOString().split('T')[0];
    const timeFormatted = jam || now.toTimeString().substring(0, 5);

    let newRecord: STPRecord;
    let targetSheetName = '';
    let summaryText = '';
    let isFinding = false;

    if (activeMode === 'daily_stp') {
      const generatedId = `RDG-STP-${dateFormatted.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      targetSheetName = 'Reading_STP_Harian';
      summaryText = `Reading STP: In=${flowInlet} m³, Out=${flowOutlet} m³, pH Effluent=${phEffluent}`;

      newRecord = {
        id: generatedId,
        logType: 'daily_stp',
        unitId: 'eq_stp',
        unitNama: 'Sewage Treatment Plant (STP)',
        unitKategori: 'Water Treatment & Sanitasi',
        timestamp: `${dateFormatted} ${timeFormatted}:00`,
        tanggal: dateFormatted,
        jam: timeFormatted,
        petugas: operator,
        shift,
        flowMeterInflow: Number(flowInlet),
        flowMeterEffluent: Number(flowOutlet),
        debitHarian: calculatedDebit > 0 ? calculatedDebit : 48,
        phAerasi: Number(phAerasi),
        phEffluent: Number(phEffluent),
        doAerasi: 2.8,
        fotoUrl: dailyPhotoPreview || `Storage/meter_${generatedId}.jpg`,
        catatan: catatanDaily,
        syncStatus: 'Tersinkron Online',
      };

      setFlowInlet((prev) => prev + Math.floor(Math.random() * 5) + 3);
      setFlowOutlet((prev) => prev + Math.floor(Math.random() * 5) + 3);

    } else {
      if (!selectedEquipment) {
        setIsSubmitting(false);
        onOpenEquipmentModal();
        return;
      }

      const generatedId = `SRV-${dateFormatted.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      targetSheetName = 'Service_Maintenance_Log';
      isFinding = statusPekerjaan === 'FINDING (Belum Selesai / Open)';
      const finalPekerjaan = pekerjaan.trim() || jenisService;
      summaryText = `Pekerjaan: ${finalPekerjaan} di ${selectedEquipment.lokasi} [Status: ${statusPekerjaan}]`;

      newRecord = {
        id: generatedId,
        logType: 'service_all',
        unitId: selectedEquipment.id,
        unitNama: selectedEquipment.nama,
        unitKategori: selectedEquipment.kategori,
        platform: selectedEquipment.platform,
        lantai: selectedEquipment.lantai,
        ruangan: selectedEquipment.ruangan,
        lokasi: selectedEquipment.lokasi,
        pekerjaan: finalPekerjaan,
        pressure: pressure.trim(),
        ampere: ampere.trim(),
        suhuEvap: suhuEvap.trim(),
        keteranganTeknis: `Pressure: ${pressure}, Ampere: ${ampere}, Suhu Evap: ${suhuEvap}`,
        timestamp: `${dateFormatted} ${timeFormatted}:00`,
        tanggal: dateFormatted,
        jam: timeFormatted,
        petugas: teknisiService,
        prioritas,
        statusPekerjaan,
        targetPenyelesaian: statusPekerjaan !== 'Complete' && statusPekerjaan !== 'Completed / Selesai Normal' ? targetPenyelesaian : undefined,
        jenisService,
        masalahKeluhan,
        tindakanPerbaikan,
        sparepartDiganti: sparepartDiganti.trim() || undefined,
        fotoServiceUrl: servicePhotoPreview || undefined,
        fotoUrl: servicePhotoPreview || undefined,
        catatan: catatanService,
        syncStatus: 'Tersinkron Online',
      };
    }

    setTimeout(() => {
      onRecordCreated(newRecord);
      setIsSubmitting(false);
      setSuccessToast({
        id: newRecord.id,
        targetSheet: targetSheetName,
        summary: summaryText,
        isFinding,
        record: newRecord,
      });

      setTimeout(() => setSuccessToast(null), 6000);
    }, 450);
  };

  const isPhEffluentCompliant = phEffluent >= 6.0 && phEffluent <= 9.0;

  return (
    <div className="space-y-6">
      {/* Mode Switcher Banner with Pertamina PHE OSES theme */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#ED1C24]"></div>
          <div className="flex-1 bg-[#005BAC]"></div>
          <div className="flex-1 bg-[#FF6F00]"></div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#ED1C24] px-2 py-0.5 rounded shadow-2xs">
                PERTAMINA PHE OSES
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#005BAC] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Formulir Lapangan Terintegrasi
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5">
              {activeMode === 'daily_stp' 
                ? '📊 Reading Harian STP (Flow Meter & pH)' 
                : '🛠️ Record Service & Maintenance (Semua Peralatan & Foto)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeMode === 'daily_stp'
                ? 'Pencatatan harian rutin operator STP: fokus flow meter inlet/outlet & pH effluent.'
                : 'Formulir servis fasilitas berkala (Chiller, Laundry Dryer, Stove, dll.) dengan upload foto & tracking status FINDING.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenEquipmentModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 hover:from-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border border-white/10"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF6F00]" />
              <span>+ Tambah Alat Baru</span>
            </button>
          </div>
        </div>

        {/* 2 Primary Mode Toggle Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <button
            type="button"
            onClick={() => setActiveMode('daily_stp')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
              activeMode === 'daily_stp'
                ? 'bg-blue-50/80 border-[#005BAC] ring-2 ring-[#005BAC]/20 shadow-md'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              activeMode === 'daily_stp' ? 'bg-[#005BAC] text-white shadow-sm' : 'bg-slate-200 text-slate-700'
            }`}>
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">1. Reading Harian STP</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#005BAC] text-white">
                  Wajib Harian
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pencatatan harian cepat: Register Flowmeter Inlet/Outlet (m³) dan nilai pH (Aerasi & Effluent Baku Mutu).
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('service_all')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
              activeMode === 'service_all'
                ? 'bg-red-50/80 border-[#ED1C24] ring-2 ring-[#ED1C24]/20 shadow-md'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              activeMode === 'service_all' ? 'bg-[#ED1C24] text-white shadow-sm' : 'bg-slate-200 text-slate-700'
            }`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">2. Record Service Peralatan</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6F00] text-slate-950 font-black">
                  Foto & Status Finding
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Berlaku untuk <strong>semua peralatan</strong> (Chiller, Machine Dryer, Stove, dll.) saat servis rutin atau ada temuan masalah.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successToast && (
        <div className={`p-5 rounded-2xl shadow-xl border flex items-start justify-between gap-4 animate-fadeIn text-white ${
          successToast.isFinding ? 'bg-amber-950 border-amber-600' : 'bg-emerald-950 border-emerald-600'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl mt-0.5 ${successToast.isFinding ? 'bg-amber-800' : 'bg-emerald-800'}`}>
              {successToast.isFinding ? (
                <AlertCircle className="w-5 h-5 text-amber-300" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {successToast.isFinding 
                  ? '⚠️ Laporan Tercatat sebagai Status: FINDING (Belum Selesai)!' 
                  : '✅ Laporan Berhasil Dikirim ke Google Sheets!'}
              </h3>
              <p className="text-xs text-slate-200 mt-0.5">
                ID Transaksi: <strong className="font-mono text-white">{successToast.id}</strong> di-update ke tab sheet <code>{successToast.targetSheet}</code>.
              </p>
              <div className="text-[11px] text-slate-300 mt-1">
                {successToast.summary}
              </div>

              {onOpenWhatsAppShare && successToast.record && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onOpenWhatsAppShare(successToast.record)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5 text-white" />
                    <span>Share ke WhatsApp (Pekerjaan, Alat, Lokasi, Status)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-slate-300 hover:text-white text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container (8 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          {/* MODE 1: DAILY STP (Flow Meter & pH Only) */}
          {activeMode === 'daily_stp' && (
            <>
              {/* Unit Info STP & Edit */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Sewage Treatment Plant (STP)</span>
                      <span className="font-mono text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold">
                        {equipmentList.find((e) => e.isSTP)?.kode || 'EQ-STP-01'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {equipmentList.find((e) => e.isSTP)?.lokasi || 'Basement 2 - Ruang Mesin STP'} • Daily Reading Rutin (Flow meter & pH)
                    </p>
                  </div>
                </div>

                {onEditEquipment && (
                  <button
                    type="button"
                    onClick={() => {
                      const stpUnit = equipmentList.find((e) => e.isSTP) || equipmentList[0];
                      if (stpUnit) onEditEquipment(stpUnit);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 hover:border-blue-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
                    title="Edit rincian data STP (Nama, kode, lokasi, deskripsi)"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Info STP</span>
                  </button>
                )}
              </div>

              {/* Petugas & Waktu */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">Jadwal Shift & Operator Jaga (STP)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jam Reading</label>
                    <input
                      type="time"
                      required
                      value={jam}
                      onChange={(e) => setJam(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Operator Jaga *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Operator"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Shift Kerja</label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Shift 1 (Pagi)">Shift 1 (Pagi)</option>
                      <option value="Shift 2 (Siang)">Shift 2 (Siang)</option>
                      <option value="Shift 3 (Malam)">Shift 3 (Malam)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 1. Register Flow Meter */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900">1. Reading Flow Meter Air Limbah</h3>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Estimasi Debit: ~{calculatedDebit} m³/hari
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      Angka Flow Meter Inlet Kumulatif (m³) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={flowInlet}
                      onChange={(e) => setFlowInlet(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">Air limbah yang masuk ke sistem STP</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      Angka Flow Meter Outlet Kumulatif (m³) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={flowOutlet}
                      onChange={(e) => setFlowOutlet(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">Air hasil olahan yang keluar instalasi</span>
                  </div>
                </div>
              </div>

              {/* 2. Reading Nilai pH */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">2. Reading Parameter pH</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Baku Mutu Permen LHK No. P.68/2016
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="font-semibold text-slate-700 block">pH Bak Aerasi</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      required
                      value={phAerasi}
                      onChange={(e) => setPhAerasi(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Optimal biologis: 6.5 - 8.5</span>
                  </div>

                  <div className={`p-3.5 border rounded-xl space-y-1 ${
                    isPhEffluentCompliant ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50 border-rose-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 block">pH Effluent (Air Olahan Keluar) *</label>
                      {isPhEffluentCompliant ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Memenuhi Baku Mutu
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          Di Luar Baku Mutu
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      required
                      value={phEffluent}
                      onChange={(e) => setPhEffluent(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Baku Mutu Legal: 6.0 – 9.0</span>
                  </div>
                </div>
              </div>

              {/* Foto & Catatan Harian */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Foto Meteran / Panel
                    </label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Foto Meteran</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, 'daily')}
                            className="hidden"
                          />
                        </label>
                        {dailyPhotoPreview && (
                          <button
                            type="button"
                            onClick={() => setDailyPhotoPreview(null)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {dailyPhotoPreview && (
                        <div className="mt-2 h-24 rounded-lg overflow-hidden border border-slate-200">
                          <img src={dailyPhotoPreview} alt="Preview Meteran" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Catatan Reading Harian</label>
                    <textarea
                      rows={3}
                      value={catatanDaily}
                      onChange={(e) => setCatatanDaily(e.target.value)}
                      placeholder="Kondisi busa, aroma, atau kejernihan air..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#005BAC] hover:bg-[#004a8e] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-b-4 border-[#FF6F00]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#FF6F00]" />
                        <span>Menyimpan & Mensinkronkan Data...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#FF6F00]" />
                        <span>Simpan Reading Harian STP & Sinkronkan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* MODE 2: SERVICE & MAINTENANCE + UPLOAD FOTO & STATUS FINDING */}
          {activeMode === 'service_all' && (
            <>
              {/* Unit yang diservis */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      1. Unit Peralatan & Penanggung Jawab Service
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Tersedia {equipmentList.length} Peralatan
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      Pilih Unit Peralatan yang Diservis / Diinspeksi:
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                      💡 Klik tombol <strong>"Edit"</strong> untuk mengubah data peralatan yang sudah terdaftar
                    </span>
                  </div>

                  {equipmentList.length === 0 ? (
                    <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#005BAC] flex items-center justify-center mx-auto">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">Belum Ada Peralatan Terdaftar</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Silakan daftarkan peralatan AC Split, Chiller, Dryer, Stove, dll di Cinta Charlie &amp; Cinta Papa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenEquipmentModal}
                        className="px-4 py-2 bg-[#005BAC] hover:bg-[#004a8e] text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 border-b-2 border-[#FF6F00]"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#FF6F00]" />
                        <span>+ Buka Form Penambahan Peralatan</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                      {equipmentList.map((unit) => {
                        const isSelected = unit.id === selectedEquipmentId || (!selectedEquipmentId && unit === equipmentList[0]);
                        return (
                          <div
                            key={unit.id}
                            onClick={() => setSelectedEquipmentId(unit.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 font-bold text-emerald-950 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[10px] text-slate-500 bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded">
                                {unit.kode}
                              </span>

                              {/* Tombol Edit Unit Terdaftar */}
                              {onEditEquipment && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditEquipment(unit);
                                  }}
                                  className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-400 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title={`Edit data peralatan ${unit.nama}`}
                                >
                                  <Edit3 className="w-2.5 h-2.5 text-emerald-700" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>

                            <div>
                              <div className="text-xs font-bold mt-0.5 line-clamp-1">{unit.nama}</div>
                              <div className="text-[10px] text-slate-500 font-normal line-clamp-1 mt-0.5">{unit.lokasi}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* KARTU RINCIAN UNIT TERPILIH & TOMBOL EDIT UTAMA */}
                  {selectedEquipment && (
                    <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-2 border border-slate-800 shadow-sm">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm">{selectedEquipment.nama}</span>
                          <span className="font-mono text-[10px] bg-slate-800 text-emerald-300 border border-slate-700 px-2 py-0.5 rounded font-bold">
                            {selectedEquipment.kode}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {selectedEquipment.kategori}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Lokasi: <span className="text-slate-200 font-semibold">{selectedEquipment.lokasi}</span> • Frekuensi: <span className="text-slate-200">{selectedEquipment.frekuensiInspeksi}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onEditEquipment && (
                          <button
                            type="button"
                            onClick={() => onEditEquipment(selectedEquipment)}
                            className="px-3 py-1.5 bg-[#005BAC] hover:bg-[#004a8e] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-white/20"
                            title="Edit nama, kode, lokasi, atau deskripsi peralatan ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Rincian Alat Ini</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onOpenEquipmentModal}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#FF6F00]" />
                          <span>+ Alat Baru</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Detail Pekerjaan & Parameter Teknis */}
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Tanggal Pengerjaan</label>
                      <input
                        type="date"
                        required
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#005BAC]/20"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Teknisi / Pelaksana *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Teknisi / Operator"
                        value={teknisiService}
                        onChange={(e) => setTeknisiService(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#005BAC]/20"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Uraian / Jenis Pekerjaan *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Steam AC split 1.5 PK, Cuci Indoor..."
                        value={pekerjaan}
                        onChange={(e) => setPekerjaan(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#005BAC]/20"
                      />
                    </div>
                  </div>

                  {/* Suggestion Chips Pekerjaan */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold">Pilih Cepat:</span>
                    {['Steam AC split 1.5 PK', 'Cuci & Steam AC Split 2 PK', 'Pembersihan Filter & Evaporator', 'Troubleshooting Kompresor', 'Preventive Maintenance Rutin'].map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPekerjaan(p)}
                        className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>

                  {/* PARAMETER TEKNIS (Pressure, Ampere, Suhu Evap) - Sesuai Format WA User */}
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#005BAC] flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#FF6F00]" />
                        Parameter Pengukuran Teknis (Untuk Laporan WhatsApp &amp; Database):
                      </span>
                      <span className="text-[10px] text-slate-500">Otomatis Masuk ke Ringkasan WhatsApp</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                          1. Pressure (Psi)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 75 Psi"
                          value={pressure}
                          onChange={(e) => setPressure(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#005BAC]/20"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                          2. Ampere Listrik (A)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 3.8 A"
                          value={ampere}
                          onChange={(e) => setAmpere(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#005BAC]/20"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                          3. Suhu Evaporator (°C)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 8°C"
                          value={suhuEvap}
                          onChange={(e) => setSuhuEvap(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-[#005BAC]/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Status Pekerjaan & Prioritas (FINDING TRACKING) */}
              <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      2. Status Pekerjaan &amp; Tingkat Prioritas
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                    Audit Tracking
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Status Selection */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Status Pekerjaan Saat Ini *
                    </label>
                    <select
                      value={statusPekerjaan}
                      onChange={(e) => setStatusPekerjaan(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl font-bold border ${
                        statusPekerjaan === 'FINDING (Belum Selesai / Open)'
                          ? 'bg-rose-50 border-rose-500 text-rose-700'
                          : statusPekerjaan === 'Menunggu Sparepart'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : statusPekerjaan === 'In Progress / Running Test'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      }`}
                    >
                      <option value="Complete">🟢 Complete (Selesai Normal)</option>
                      <option value="FINDING (Belum Selesai / Open)">🔴 FINDING (Belum Selesai / Open)</option>
                      <option value="Menunggu Sparepart">🟡 Menunggu Sparepart</option>
                      <option value="In Progress / Running Test">🔵 In Progress / Running Test</option>
                    </select>
                  </div>

                  {/* Prioritas */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Tingkat Prioritas *
                    </label>
                    <select
                      value={prioritas}
                      onChange={(e) => setPrioritas(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Tinggi (Kritis / Urgent)">🔴 Tinggi (Kritis / Urgent)</option>
                      <option value="Sedang (Normal)">🟡 Sedang (Normal)</option>
                      <option value="Rendah (Minor / Estetika)">🟢 Rendah (Minor / Estetika)</option>
                    </select>
                  </div>

                  {/* Target Penyelesaian (Jika Finding) */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Target / Estimasi Selesai
                    </label>
                    <input
                      type="date"
                      value={targetPenyelesaian}
                      onChange={(e) => setTargetPenyelesaian(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {statusPekerjaan === 'FINDING (Belum Selesai / Open)' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Perhatian: </span>
                      Pekerjaan ini akan otomatis dimasukkan ke dalam <strong>"Rangkuman Finding Terbuka"</strong> di Dashboard dan Google Sheets sampai statusnya diubah menjadi Completed.
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Deskripsi Masalah & Tindakan Perbaikan */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    3. Deskripsi Finding (Masalah) & Tindakan Perbaikan
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Keluhan / Temuan Kerusakan (Finding) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={masalahKeluhan}
                      onChange={(e) => setMasalahKeluhan(e.target.value)}
                      placeholder="Jelaskan temuan kerusakan, lokasi kebocoran, atau anomali mesin..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                    ></textarea>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Tindakan Perbaikan yang Dilakukan / Rencana Tindak Lanjut *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={tindakanPerbaikan}
                      onChange={(e) => setTindakanPerbaikan(e.target.value)}
                      placeholder="Uraikan pekerjaan mekanikal/elektrikal yang sudah atau akan dikerjakan..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Suku Cadang / Sparepart (Dibutuhkan atau Diganti):
                      </label>
                      <input
                        type="text"
                        value={sparepartDiganti}
                        onChange={(e) => setSparepartDiganti(e.target.value)}
                        placeholder="Contoh: Vanbelt type B-42, thermostat, relay 24V..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Catatan & Rekomendasi Teknisi:
                      </label>
                      <input
                        type="text"
                        value={catatanService}
                        onChange={(e) => setCatatanService(e.target.value)}
                        placeholder="Contoh: Pantau suhu setiap 2 jam, jadwal servis ulang..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Upload Foto Dokumentasi Servis / Finding */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      4. Upload Foto Dokumentasi (Kerusakan / Bukti Servis)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    PNG, JPG, JPEG (Kamera / Galeri HP)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:bg-slate-100 transition-colors">
                    <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Ambil Foto atau Pilih File Gambar
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Jepret komponen yang rusak, nota part, atau unit mesin
                      </span>
                    </div>

                    <label className="mt-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all inline-block">
                      <span>Pilih Foto dari HP / Komputer</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, 'service')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preview Container */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">Preview Foto Terlampir:</span>
                    {servicePhotoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-900 group">
                        <img
                          src={servicePhotoPreview}
                          alt="Preview Foto Servis"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setServicePhotoPreview(null)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md cursor-pointer"
                          title="Hapus foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-36 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs gap-1 bg-slate-50">
                        <ImageIcon className="w-6 h-6" />
                        <span>Belum ada foto yang dipilih</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#ED1C24] hover:bg-[#c9151c] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-b-4 border-[#FF6F00]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Menyimpan & Mensinkronkan Record...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>Simpan Record Service, Status & Foto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>

        {/* Right Sidebar Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Finding Quick Summary Widget */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Status Finding & Pekerjaan
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                AUDIT LOG
              </span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Finding Terbuka:</span>
                <span className="font-bold text-rose-400 font-mono">
                  {recentRecords.filter((r) => r.statusPekerjaan === 'FINDING (Belum Selesai / Open)').length} Item
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Menunggu Sparepart:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {recentRecords.filter((r) => r.statusPekerjaan === 'Menunggu Sparepart').length} Item
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pekerjaan Selesai:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {recentRecords.filter((r) => r.statusPekerjaan === 'Completed / Selesai Normal').length} Item
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Share Quick Card */}
          {onOpenWhatsAppShare && (
            <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700/60 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
                <span className="font-bold flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-300" />
                  Format WhatsApp Lapangan
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 text-[10px] font-bold">
                  WA Ready
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 leading-relaxed">
                Bagikan laporan kegiatan singkat harian langsung ke WhatsApp atasan atau grup teknisi. Format otomatis menyusun:
              </p>
              <div className="p-2.5 bg-emerald-950/70 rounded-xl font-mono text-[10px] text-emerald-200 space-y-0.5">
                <div>• Jenis Pekerjaan</div>
                <div>• Nama Peralatan</div>
                <div>• Lokasi Unit</div>
                <div>• Status Terakhir</div>
              </div>
              <button
                type="button"
                onClick={() => onOpenWhatsAppShare()}
                className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Buka Opsi Share WhatsApp</span>
              </button>
            </div>
          )}

          {/* Quick Equipment List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                Peralatan Terdaftar
              </h4>
              <button
                type="button"
                onClick={onOpenEquipmentModal}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            <div className="space-y-2">
              {equipmentList.map((eq) => (
                <div
                  key={eq.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block truncate max-w-[170px]">{eq.nama}</span>
                    <span className="text-[10px] text-slate-400">{eq.lokasi}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    eq.isSTP ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {eq.isSTP ? 'Harian' : 'Saat Servis'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
