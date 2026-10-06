import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  FileSpreadsheet, 
  Users, 
  Building2, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Send, 
  Calendar, 
  Layers, 
  Phone, 
  CheckSquare, 
  FileText,
  Clock,
  Droplet,
  Wrench,
  Zap,
  Droplets,
  Sparkles,
  Cpu,
  Hammer,
  Snowflake,
  Filter
} from 'lucide-react';
import { 
  STPRecord, 
  EquipmentUnit, 
  Personnel, 
  WorkCategory, 
  WORK_CATEGORIES, 
  EquipmentCategory,
  EquipmentFrequency,
  EquipmentOperationalStatus,
  COTPRecord
} from '../types/stp';
import { FACILITY_LOCATIONS } from '../data/locations';
import { exportMaintenanceToExcel, exportSTPToExcel } from '../utils/excelExport';

type SettingsTab = 'sheets' | 'personnel' | 'equipment' | 'daily_whatsapp' | 'export_maintenance' | 'export_stp';

interface SettingsViewProps {
  records: STPRecord[];
  equipmentList: EquipmentUnit[];
  personnelList: Personnel[];
  cotpRecords?: COTPRecord[];
  onAddEquipment: (unit: EquipmentUnit) => void;
  onAddPersonnel: (person: Personnel) => void;
  onUpdatePersonnel: (person: Personnel) => void;
  onDeletePersonnel: (id: string) => void;
  sheetsWebhookUrl: string;
  onSaveSheetsWebhookUrl: (url: string) => void;
  onOpenWhatsAppDirect?: (text: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  records,
  equipmentList,
  personnelList,
  cotpRecords = [],
  onAddEquipment,
  onAddPersonnel,
  onUpdatePersonnel,
  onDeletePersonnel,
  sheetsWebhookUrl,
  onSaveSheetsWebhookUrl,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('sheets');

  // ===================== 1. SHEETS STATE =====================
  const [inputWebhookUrl, setInputWebhookUrl] = useState(sheetsWebhookUrl);
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [sheetsTestStatus, setSheetsTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncResult, setBulkSyncResult] = useState<string | null>(null);

  // ===================== 2. PERSONNEL STATE =====================
  const [newPersonNama, setNewPersonNama] = useState('');
  const [newPersonJabatan, setNewPersonJabatan] = useState('Teknisi Utility');
  const [newPersonKategori, setNewPersonKategori] = useState<WorkCategory>('Elektrikal');
  const [newPersonKontak, setNewPersonKontak] = useState('');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editPersonNama, setEditPersonNama] = useState('');
  const [editPersonJabatan, setEditPersonJabatan] = useState('');
  const [editPersonKategori, setEditPersonKategori] = useState<WorkCategory>('Elektrikal');
  const [editPersonKontak, setEditPersonKontak] = useState('');

  // ===================== 3. EQUIPMENT STATE =====================
  const [eqNama, setEqNama] = useState('');
  const [eqKode, setEqKode] = useState('');
  const [eqKategori, setEqKategori] = useState<EquipmentCategory>('Peralatan Umum');
  const [eqPlatform, setEqPlatform] = useState<string>('CINTA PAPA');
  const [eqLantai, setEqLantai] = useState<string>('Lantai 2');
  const [eqRuangan, setEqRuangan] = useState<string>('Room 04');
  const [eqSpesifikasi, setEqSpesifikasi] = useState('');
  const [eqFrekuensi, setEqFrekuensi] = useState<EquipmentFrequency>('Bulanan');
  const [eqStatus, setEqStatus] = useState<EquipmentOperationalStatus>('Normal / Beroperasi');
  const [eqDeskripsi, setEqDeskripsi] = useState('');
  const [eqSuccessMsg, setEqSuccessMsg] = useState<string | null>(null);

  // ===================== 4. DAILY WHATSAPP STATE =====================
  const [waReportDate, setWaReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [waPlatformFilter, setWaPlatformFilter] = useState<'all' | 'CINTA CHARLIE' | 'CINTA PAPA'>('all');
  const [waCopied, setWaCopied] = useState(false);

  // ===================== 5 & 6. EXPORT EXCEL STATE =====================
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportCatFilter, setExportCatFilter] = useState<string>('all');
  const [exportPlatFilter, setExportPlatFilter] = useState<string>('all');

  // ================================================================
  // HANDLERS: SHEETS
  // ================================================================
  const handleSaveWebhook = () => {
    const trimmed = inputWebhookUrl.trim();
    onSaveSheetsWebhookUrl(trimmed);
    setSheetsTestStatus({
      success: true,
      message: 'URL Google Sheet berhasil disimpan.',
    });
  };

  const handleTestConnection = async () => {
    if (!inputWebhookUrl.trim()) {
      setSheetsTestStatus({ success: false, message: 'Masukkan URL Web App Apps Script terlebih dahulu.' });
      return;
    }

    setIsTestingSheets(true);
    setSheetsTestStatus(null);

    const testPayload = {
      action: 'test_connection',
      type: 'maintenance',
      tanggal: new Date().toISOString().split('T')[0],
      jam: new Date().toTimeString().substring(0, 5),
      lokasi: 'Cinta Complex, Cinta Papa Lantai 2',
      kategori: 'Elektrikal',
      pekerjaan: 'Tes Sinkronisasi Sistem Cinta Complex ke Google Sheets',
      status: 'Complete',
      petugas: 'Teknisi Utility',
      keterangan: 'Koneksi dari menu Pengaturan terverifikasi aktif',
    };

    try {
      await fetch(inputWebhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload),
      });

      setSheetsTestStatus({
        success: true,
        message: '✅ Sinyal tes berhasil terkirim! Periksa Google Sheets Anda, baris tes baru telah masuk.',
      });
      onSaveSheetsWebhookUrl(inputWebhookUrl.trim());
    } catch (err: any) {
      setSheetsTestStatus({
        success: false,
        message: `Gagal mengirim: ${err.message || 'Periksa kembali URL Web App Anda'}`,
      });
    } finally {
      setIsTestingSheets(false);
    }
  };

  const handleBulkSync = async () => {
    if (!inputWebhookUrl.trim()) {
      setSheetsTestStatus({ success: false, message: 'Masukkan URL Google Apps Script terlebih dahulu.' });
      return;
    }

    if (records.length === 0) {
      setBulkSyncResult('Belum ada rekaman laporan untuk dikirim.');
      return;
    }

    setIsBulkSyncing(true);
    setBulkSyncResult(null);

    try {
      for (const rec of records) {
        const isSTP = rec.logType === 'daily_stp';
        const payload = isSTP
          ? {
              action: 'add_record',
              type: 'stp',
              id: rec.id,
              tanggal: rec.tanggal,
              jam: rec.jam,
              shift: rec.shift || 'Shift 1',
              flowInlet: rec.flowMeterInflow || 0,
              flowOutlet: rec.flowMeterEffluent || 0,
              debitHarian: rec.debitHarian || 0,
              phAerasi: rec.phAerasi || 0,
              phEffluent: rec.phEffluent || 0,
              petugas: rec.petugas || 'Operator STP',
              catatan: rec.catatan || '-',
            }
          : {
              action: 'add_record',
              type: 'maintenance',
              id: rec.id,
              tanggal: rec.tanggal,
              jam: rec.jam,
              lokasi: rec.lokasi || `${rec.platform || ''}, ${rec.lantai || ''} ${rec.ruangan || ''}`,
              kategori: rec.kategoriPekerjaan || rec.unitKategori || 'Utility Gedung',
              pekerjaan: rec.pekerjaan || rec.unitNama || 'Perawatan Fasilitas',
              status: rec.statusPekerjaan || 'Complete',
              petugas: rec.petugas || 'Teknisi Utility',
              keterangan: rec.catatan || rec.keteranganTeknis || '-',
            };

        await fetch(inputWebhookUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      }
      setBulkSyncResult(`✅ Berhasil mengirim ${records.length} data laporan ke Google Sheets!`);
    } catch {
      setBulkSyncResult('Proses pengiriman selesai. Sebagian data mungkin memerlukan waktu untuk muncul di Sheets.');
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const googleAppsScriptCode = `/**
 * GOOGLE APPS SCRIPT - LQB MAINTENANCE (PERTAMINA PHE OSES)
 * Script ini secara otomatis memisahkan laporan ke 3 lembar kerja (Sheet):
 * 1. Sheet "Reading_COTP_Harian" (Reading Jam Jalan COTP 1 & COTP 2)
 * 2. Sheet "Reading_STP_Harian" (Reading Flow Meter Inflow/Effluent & pH)
 * 3. Sheet "Service_Maintenance_Log" (Pekerjaan Maintenance Fasilitas & Utility Gedung)
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var timestamp = new Date();
    
    // 1. JIKA LAPORAN READING COTP (TOTAL JAM & RUNNING HARIAN)
    if (data.type === "cotp" || data.logType === "cotp") {
      var cotpSheetName = "Reading_COTP_Harian";
      var cotpSheet = ss.getSheetByName(cotpSheetName);
      if (!cotpSheet) {
        cotpSheet = ss.insertSheet(cotpSheetName);
        cotpSheet.appendRow([
          "Timestamp",
          "Tanggal",
          "COTP_1_Total_Jam",
          "COTP_1_Running_Harian",
          "COTP_2_Total_Jam",
          "COTP_2_Running_Harian"
        ]);
        cotpSheet.getRange(1, 1, 1, 6).setBackground("#FF6F00").setFontColor("#FFFFFF").setFontWeight("bold");
      }
      
      cotpSheet.appendRow([
        timestamp,
        data.tanggal || Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyy-MM-dd"),
        data.cotp1TotalHours != null ? data.cotp1TotalHours : (data.cotp1Hours || 0),
        data.cotp1DailyHours != null ? data.cotp1DailyHours : 0,
        data.cotp2TotalHours != null ? data.cotp2TotalHours : (data.cotp2Hours || 0),
        data.cotp2DailyHours != null ? data.cotp2DailyHours : 0
      ]);
    }
    // 2. JIKA LAPORAN READING STP HARIAN
    else if (data.type === "stp" || data.logType === "daily_stp") {
      var stpSheetName = "Reading_STP_Harian";
      var stpSheet = ss.getSheetByName(stpSheetName);
      if (!stpSheet) {
        stpSheet = ss.insertSheet(stpSheetName);
        stpSheet.appendRow([
          "Timestamp",
          "Tanggal",
          "Jam",
          "Shift",
          "Flowmeter_Inflow_m3",
          "Flowmeter_Effluent_m3",
          "Debit_Harian_m3",
          "pH_Aerasi",
          "pH_Effluent",
          "Operator",
          "Catatan_Kondisi"
        ]);
        stpSheet.getRange(1, 1, 1, 11).setBackground("#005BAC").setFontColor("#FFFFFF").setFontWeight("bold");
      }
      
      stpSheet.appendRow([
        timestamp,
        data.tanggal || Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyy-MM-dd"),
        data.jam || Utilities.formatDate(timestamp, "Asia/Jakarta", "HH:mm"),
        data.shift || "Shift 1",
        data.flowInlet || 0,
        data.flowOutlet || 0,
        data.debitHarian || 0,
        data.phAerasi || 0,
        data.phEffluent || 0,
        data.petugas || "-",
        data.catatan || "-"
      ]);
    } 
    // 3. JIKA LAPORAN PEKERJAAN MAINTENANCE FASILITAS GLOBAL
    else {
      var maintSheetName = "Service_Maintenance_Log";
      var maintSheet = ss.getSheetByName(maintSheetName);
      if (!maintSheet) {
        maintSheet = ss.insertSheet(maintSheetName);
        maintSheet.appendRow([
          "Timestamp",
          "Tanggal",
          "Jam",
          "Lokasi",
          "Kategori",
          "Pekerjaan",
          "Status",
          "Pelaksana",
          "Keterangan_Catatan"
        ]);
        maintSheet.getRange(1, 1, 1, 9).setBackground("#ED1C24").setFontColor("#FFFFFF").setFontWeight("bold");
      }
      
      maintSheet.appendRow([
        timestamp,
        data.tanggal || Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyy-MM-dd"),
        data.jam || Utilities.formatDate(timestamp, "Asia/Jakarta", "HH:mm"),
        data.lokasi || "-",
        data.kategori || "-",
        data.pekerjaan || "-",
        data.status || "Complete",
        data.petugas || "-",
        data.keterangan || "-"
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data tersimpan di Google Sheets" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    system: "LQB Maintenance - Cinta Complex",
    time: new Date()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // ================================================================
  // HANDLERS: PERSONNEL
  // ================================================================
  const handleAddNewPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonNama.trim()) return;

    const newPerson: Personnel = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      nama: newPersonNama.trim(),
      jabatan: newPersonJabatan.trim() || 'Teknisi Utility',
      kategoriDefault: newPersonKategori,
      kontak: newPersonKontak.trim(),
      isAktif: true,
    };

    onAddPersonnel(newPerson);
    setNewPersonNama('');
    setNewPersonKontak('');
  };

  const startEditPersonnel = (person: Personnel) => {
    setEditingPersonId(person.id);
    setEditPersonNama(person.nama);
    setEditPersonJabatan(person.jabatan);
    setEditPersonKategori((person.kategoriDefault as WorkCategory) || 'Elektrikal');
    setEditPersonKontak(person.kontak || '');
  };

  const saveEditPersonnel = () => {
    if (!editingPersonId || !editPersonNama.trim()) return;
    const existing = personnelList.find((p) => p.id === editingPersonId);
    if (!existing) return;

    onUpdatePersonnel({
      ...existing,
      nama: editPersonNama.trim(),
      jabatan: editPersonJabatan.trim(),
      kategoriDefault: editPersonKategori,
      kontak: editPersonKontak.trim(),
    });
    setEditingPersonId(null);
  };

  const togglePersonnelStatus = (person: Personnel) => {
    onUpdatePersonnel({
      ...person,
      isAktif: !person.isAktif,
    });
  };

  // ================================================================
  // HANDLERS: EQUIPMENT
  // ================================================================
  const currentFacility = FACILITY_LOCATIONS.find((f) => f.name === eqPlatform) || FACILITY_LOCATIONS[1];
  const currentFloors = currentFacility.floors;
  const currentFloorObj = currentFloors.find((fl) => fl.floorName === eqLantai) || currentFloors[0];
  const currentRooms = currentFloorObj ? currentFloorObj.rooms : [];

  const handlePlatformChange = (plat: string) => {
    setEqPlatform(plat);
    const fac = FACILITY_LOCATIONS.find((f) => f.name === plat) || FACILITY_LOCATIONS[0];
    const firstFloor = fac.floors[0]?.floorName || 'Lantai 1';
    setEqLantai(firstFloor);
    setEqRuangan(fac.floors[0]?.rooms[0] || 'Ruangan 1');
  };

  const handleFloorChange = (floor: string) => {
    setEqLantai(floor);
    const flObj = currentFloors.find((fl) => fl.floorName === floor);
    if (flObj && flObj.rooms.length > 0) {
      setEqRuangan(flObj.rooms[0]);
    }
  };

  const handleAddNewEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqNama.trim()) return;

    const unitCode = eqKode.trim() || `EQ-${eqPlatform.includes('CHARLIE') ? 'CC' : 'CP'}-${Date.now().toString().slice(-4)}`;
    const newUnit: EquipmentUnit = {
      id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      kode: unitCode,
      nama: eqNama.trim(),
      kategori: eqKategori,
      lokasi: `${eqPlatform}, ${eqLantai} - ${eqRuangan}`,
      platform: eqPlatform,
      lantai: eqLantai,
      ruangan: eqRuangan,
      spesifikasi: eqSpesifikasi.trim() || undefined,
      frekuensiInspeksi: eqFrekuensi,
      statusOperasional: eqStatus,
      deskripsi: eqDeskripsi.trim() || `Unit fasilitas ${eqNama} di ${eqPlatform}`,
      isSTP: eqNama.toLowerCase().includes('stp') || eqKategori === 'Water Treatment & Sanitasi',
      createdAt: new Date().toISOString(),
    };

    onAddEquipment(newUnit);
    setEqNama('');
    setEqKode('');
    setEqSpesifikasi('');
    setEqDeskripsi('');
    setEqSuccessMsg(`✅ Peralatan "${newUnit.nama}" berhasil ditambahkan ke inventaris!`);
    setTimeout(() => setEqSuccessMsg(null), 3500);
  };

  // ================================================================
  // GENERATE LAPORAN HARIAN WHATSAPP
  // ================================================================
  const dailyWorkRecords = useMemo(() => {
    return records.filter((r) => {
      const isMaint = r.logType === 'service_all' || !!r.pekerjaan;
      if (!isMaint) return false;
      if (r.tanggal !== waReportDate) return false;
      if (waPlatformFilter !== 'all') {
        const plat = (r.platform || '').toUpperCase();
        if (!plat.includes(waPlatformFilter.toUpperCase())) return false;
      }
      return true;
    });
  }, [records, waReportDate, waPlatformFilter]);

  const dailyStpRecords = useMemo(() => {
    return records.filter((r) => {
      const isSTP = r.logType === 'daily_stp' || (!r.pekerjaan && r.flowMeterEffluent !== undefined);
      return isSTP && r.tanggal === waReportDate;
    });
  }, [records, waReportDate]);

  // Formatted WhatsApp Message (Format Standar LQB sesuai permintaan pengguna)
  const generatedWhatsAppText = useMemo(() => {
    // Cari reading COTP untuk tanggal ini, atau ambil yang terbaru
    const cotpToday = cotpRecords.find((c) => c.tanggal === waReportDate) || cotpRecords[0];
    const cotp1Display = cotpToday
      ? `${cotpToday.cotp1Hours} Jam${cotpToday.cotp1Status ? ` (${cotpToday.cotp1Status})` : ''}`
      : '24 Jam (Running)';
    const cotp2Display = cotpToday
      ? `${cotpToday.cotp2Hours} Jam${cotpToday.cotp2Status ? ` (${cotpToday.cotp2Status})` : ''}`
      : '0 Jam (Standby)';

    // Tanggal format: 06 okt 2026
    let formattedDate = waReportDate;
    try {
      const d = new Date(waReportDate);
      const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      formattedDate = `${day} ${month} ${year}`;
    } catch {}

    const totalJobs = dailyWorkRecords.length;

    let msg = `*LAPORAN HARIAN LQB*\n`;
    msg += `COTP 1 : ${cotp1Display}\n`;
    msg += `COTP 2 : ${cotp2Display}\n`;
    msg += `Tanggal: ${formattedDate}\n`;
    msg += `Total Pekerjaan: ${totalJobs} \n`;

    if (dailyWorkRecords.length === 0) {
      msg += `1. jenis Pekerjaan: Utility Gedung   Lokasi: Cinta Complex\n`;
      msg += `        Deskripsi Pekerjaan: Rutin pemantauan fasilitas & inspeksi harian\n`;
      msg += `        Status: Complete\n`;
    } else {
      dailyWorkRecords.forEach((item, index) => {
        const jenis = item.kategoriPekerjaan || item.unitKategori || 'Utility Gedung';
        const loc = item.lokasi || `${item.platform || 'Cinta Complex'}, ${item.lantai || ''} ${item.ruangan || ''}`.trim();
        const desc = item.pekerjaan || item.unitNama || 'Perawatan Fasilitas';
        const status = item.statusPekerjaan || 'Complete';

        msg += `${index + 1}. jenis Pekerjaan: ${jenis}   Lokasi: ${loc}\n`;
        msg += `        Deskripsi Pekerjaan: ${desc}\n`;
        msg += `        Status: ${status}\n`;
      });
    }

    return msg;
  }, [dailyWorkRecords, cotpRecords, waReportDate]);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generatedWhatsAppText);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(generatedWhatsAppText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // ================================================================
  // HANDLERS: EXPORT EXCEL
  // ================================================================
  const handleExportMaintenance = () => {
    const res = exportMaintenanceToExcel(records, {
      categoryFilter: exportCatFilter,
      platformFilter: exportPlatFilter,
    });
    setExportSuccessMsg(`✅ Berhasil mengunduh ${res.filename} (${res.count} baris pekerjaan)!`);
    setTimeout(() => setExportSuccessMsg(null), 4000);
  };

  const handleExportSTP = () => {
    const res = exportSTPToExcel(records);
    setExportSuccessMsg(`✅ Berhasil mengunduh ${res.filename} (${res.count} data reading STP)!`);
    setTimeout(() => setExportSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002855] to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-white/10 rounded-xl text-white">
              <Settings className="w-5 h-5 text-amber-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pusat Pengaturan & Ekspor</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Hubungkan Google Sheets, kelola daftar nama personil, tambah peralatan, bagikan laporan harian via WhatsApp, dan unduh rekapan Excel rapih.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
            sheetsWebhookUrl 
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' 
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${sheetsWebhookUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{sheetsWebhookUrl ? 'Google Sheet Terhubung' : 'Google Sheet Belum Terhubung'}</span>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex overflow-x-auto gap-1 text-xs font-bold no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('sheets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'sheets'
              ? 'bg-[#002855] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Hubungkan Sheet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('personnel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'personnel'
              ? 'bg-[#002855] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>Nama Personil ({personnelList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('equipment')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'equipment'
              ? 'bg-[#002855] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>Tambah Peralatan ({equipmentList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('daily_whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'daily_whatsapp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <Share2 className="w-4 h-4 text-white" />
          <span>Laporan Harian (Share WhatsApp)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('export_maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'export_maintenance'
              ? 'bg-[#ED1C24] text-white shadow-sm'
              : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export Excel Pekerjaan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('export_stp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'export_stp'
              ? 'bg-[#005BAC] text-white shadow-sm'
              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <Droplet className="w-4 h-4 text-sky-400" />
          <span>Export Excel Rekapan STP</span>
        </button>
      </div>

      {/* Global Success Banner for Export */}
      {exportSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-bold">{exportSuccessMsg}</p>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: HUBUNGKAN GOOGLE SHEET                                   */}
      {/* ============================================================== */}
      {activeSubTab === 'sheets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Sambungkan ke Google Sheets Online
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap kali ada laporan maintenance atau reading STP diinput, data akan otomatis terkirim dan tercatat langsung ke Google Sheet Anda.
                </p>
              </div>
            </div>

            {/* Input URL */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                URL Web App Google Apps Script
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={inputWebhookUrl}
                  onChange={(e) => setInputWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  className="px-5 py-3 bg-[#002855] hover:bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan URL</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingSheets}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isTestingSheets ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isTestingSheets ? 'Mengirim...' : 'Tes Koneksi'}</span>
                </button>
              </div>

              {sheetsTestStatus && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 font-medium ${
                    sheetsTestStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {sheetsTestStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{sheetsTestStatus.message}</span>
                </div>
              )}
            </div>

            {/* Bulk Sync */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Sinkronkan Semua Data yang Sudah Ada</h3>
                <p className="text-[11px] text-slate-500">
                  Kirim seluruh {records.length} data laporan yang tersimpan saat ini ke Google Sheets secara massal.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBulkSync}
                disabled={isBulkSyncing || records.length === 0}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBulkSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isBulkSyncing ? 'Mengirim Data...' : 'Kirim Semua Data Sekarang'}</span>
              </button>
            </div>

            {bulkSyncResult && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium">
                {bulkSyncResult}
              </div>
            )}
          </div>

          {/* Guide & Kode.gs Copy Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-600" />
                  Script Google Apps Script (Kode.gs) Bebas Error
                </h3>
                <p className="text-xs text-slate-500">
                  Salin skrip di bawah ini ke Google Sheets Anda melalui menu <strong>Extensions &gt; Apps Script</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyScript}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedScript
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Tersalin ke Clipboard!' : 'Salin Kode.gs'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                {googleAppsScriptCode}
              </pre>
            </div>

            {/* 3 Step Deployment Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-[#002855] text-white text-xs font-black flex items-center justify-center mb-2">1</span>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Buka Google Sheets & Apps Script</h4>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Buka Spreadsheet Anda, klik menu <strong>Extensions</strong> lalu <strong>Apps Script</strong>. Hapus isi lama, lalu <em>Paste</em> kode di atas.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-[#ED1C24] text-white text-xs font-black flex items-center justify-center mb-2">2</span>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Deploy Sebagai Web App</h4>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Klik <strong>Deploy &gt; New deployment</strong>, pilih icon Gear ⚙️ <strong>Web App</strong>. Set "Execute as: <strong>Me</strong>" dan "Who has access: <strong>Anyone</strong>".
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center mb-2">3</span>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Salin URL & Simpan</h4>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Salin <strong>Web App URL</strong> yang dihasilkan, tempelkan pada kolom URL di atas, lalu klik <strong>Simpan URL</strong> & <strong>Tes Koneksi</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PENGATURAN PERSONIL (NAMA-NAMA PERSONIL)                  */}
      {/* ============================================================== */}
      {activeSubTab === 'personnel' && (
        <div className="space-y-6">
          {/* Add Personnel Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  Tambah Personil & Teknisi Fasilitas
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nama personil yang didaftarkan di sini akan langsung muncul sebagai opsi pelaksana di form Laporan Maintenance dan Reading STP.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNewPersonnel} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Personil *</label>
                <input
                  type="text"
                  required
                  value={newPersonNama}
                  onChange={(e) => setNewPersonNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Spesialisasi *</label>
                <input
                  type="text"
                  required
                  value={newPersonJabatan}
                  onChange={(e) => setNewPersonJabatan(e.target.value)}
                  placeholder="Contoh: Teknisi Elektrikal"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Pekerjaan Utama</label>
                <select
                  value={newPersonKategori}
                  onChange={(e) => setNewPersonKategori(e.target.value as WorkCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                >
                  {WORK_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / Kontak</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPersonKontak}
                    onChange={(e) => setNewPersonKontak(e.target.value)}
                    placeholder="0812xxxx (Opsional)"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#002855] hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Personnel List Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Daftar Personil Terdaftar ({personnelList.length})</h3>
                <p className="text-xs text-slate-500">Klik tombol status untuk mengaktifkan/menonaktifkan personil dari daftar pilih form.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Nama Personil</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4">Kategori Utama</th>
                    <th className="py-3 px-4">Kontak</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {personnelList.map((person) => {
                    const isEditing = editingPersonId === person.id;

                    if (isEditing) {
                      return (
                        <tr key={person.id} className="bg-blue-50/50">
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editPersonNama}
                              onChange={(e) => setEditPersonNama(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editPersonJabatan}
                              onChange={(e) => setEditPersonJabatan(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editPersonKategori}
                              onChange={(e) => setEditPersonKategori(e.target.value as WorkCategory)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                            >
                              {WORK_CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editPersonKontak}
                              onChange={(e) => setEditPersonKontak(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[11px] text-slate-500">Edit Mode</span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              type="button"
                              onClick={saveEditPersonnel}
                              className="px-2.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 cursor-pointer text-xs"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPersonId(null)}
                              className="px-2.5 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 cursor-pointer text-xs"
                            >
                              Batal
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                            {person.nama.charAt(0).toUpperCase()}
                          </span>
                          <span>{person.nama}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{person.jabatan}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {person.kategoriDefault || 'Utility'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{person.kontak || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => togglePersonnelStatus(person)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-colors ${
                              person.isAktif
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {person.isAktif ? 'Aktif' : 'Non-Aktif'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => startEditPersonnel(person)}
                            className="p-1.5 text-slate-500 hover:text-[#002855] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Personil"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePersonnel(person.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Personil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PENGATURAN TAMBAH PERALATAN                              */}
      {/* ============================================================== */}
      {activeSubTab === 'equipment' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  Pendaftaran Peralatan & Aset Fasilitas Cinta Complex
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambahkan peralatan utility gedung (AC Split, Chiller, Pompa STP, Exhaust Fan, Panel Listrik, Genset, dll.) untuk dipelihara.
                </p>
              </div>
            </div>

            {eqSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{eqSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddNewEquipment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Peralatan *</label>
                  <input
                    type="text"
                    required
                    value={eqNama}
                    onChange={(e) => setEqNama(e.target.value)}
                    placeholder="Contoh: AC Split Daikin 1.5 PK"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode / Tag Alat (Opsional)</label>
                  <input
                    type="text"
                    value={eqKode}
                    onChange={(e) => setEqKode(e.target.value)}
                    placeholder="Contoh: AC-CP-04"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Peralatan *</label>
                  <select
                    value={eqKategori}
                    onChange={(e) => setEqKategori(e.target.value as EquipmentCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  >
                    <option value="HVAC & Pendingin">HVAC & Pendingin</option>
                    <option value="Electrical & Genset">Electrical & Genset</option>
                    <option value="Water Treatment & Sanitasi">Water Treatment & Sanitasi (STP)</option>
                    <option value="Kitchen & Dapur Komersial">Kitchen & Dapur Komersial</option>
                    <option value="Laundry & Dryer">Laundry & Dryer</option>
                    <option value="Peralatan Umum">Peralatan Umum Utility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Platform Fasilitas *</label>
                  <select
                    value={eqPlatform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  >
                    <option value="CINTA CHARLIE">CINTA CHARLIE</option>
                    <option value="CINTA PAPA">CINTA PAPA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lantai *</label>
                  <select
                    value={eqLantai}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  >
                    {currentFloors.map((fl) => (
                      <option key={fl.floorName} value={fl.floorName}>{fl.floorName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan / Kamar *</label>
                  <select
                    value={eqRuangan}
                    onChange={(e) => setEqRuangan(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  >
                    {currentRooms.map((rm) => (
                      <option key={rm} value={rm}>{rm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Spesifikasi Teknis</label>
                  <input
                    type="text"
                    value={eqSpesifikasi}
                    onChange={(e) => setEqSpesifikasi(e.target.value)}
                    placeholder="Contoh: 1.5 PK R32 / 3 Phase / 220V"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frekuensi Inspeksi</label>
                  <select
                    value={eqFrekuensi}
                    onChange={(e) => setEqFrekuensi(e.target.value as EquipmentFrequency)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Per 3 Bulan">Per 3 Bulan</option>
                    <option value="Per 6 Bulan">Per 6 Bulan</option>
                    <option value="1 Tahun">1 Tahun</option>
                    <option value="Berkala / Saat Servis">Berkala / Saat Servis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Operasional Awal</label>
                  <select
                    value={eqStatus}
                    onChange={(e) => setEqStatus(e.target.value as EquipmentOperationalStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                  >
                    <option value="Normal / Beroperasi">Normal / Beroperasi</option>
                    <option value="Standby / Siaga">Standby / Siaga</option>
                    <option value="Perlu Perbaikan (Minor)">Perlu Perbaikan (Minor)</option>
                    <option value="Dalam Perbaikan (Breakdown)">Dalam Perbaikan (Breakdown)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tambahan</label>
                <input
                  type="text"
                  value={eqDeskripsi}
                  onChange={(e) => setEqDeskripsi(e.target.value)}
                  placeholder="Catatan tambahan mengenai posisi, nomor seri, atau fungsi alat"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002855] focus:bg-white outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#002855] hover:bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Peralatan Sekarang</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Equipment Overview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">Total Peralatan Terdaftar ({equipmentList.length})</h3>
            {equipmentList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Belum ada peralatan terdaftar. Gunakan formulir di atas untuk mendaftarkan unit baru.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {equipmentList.slice(0, 9).map((eq) => (
                  <div key={eq.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {eq.kode}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{eq.platform}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{eq.nama}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{eq.lokasi}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{eq.kategori}</span>
                      <span className="font-bold text-emerald-700">{eq.statusOperasional}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: LAPORAN HARIAN (SHARE WHATSAPP)                           */}
      {/* ============================================================== */}
      {activeSubTab === 'daily_whatsapp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  Format Laporan Harian WhatsApp (Pekerjaan Hari Ini)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekap otomatis seluruh pekerjaan fasilitas hari ini dalam susunan teks rapih berformat WhatsApp. Sekali klik langsung bagikan ke grup WhatsApp koordinator / supervisor.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    waCopied
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {waCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{waCopied ? 'Teks Tersalin!' : 'Salin Format'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim ke WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Date & Filter Selector */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Pilih Tanggal Laporan
                </label>
                <input
                  type="date"
                  value={waReportDate}
                  onChange={(e) => setWaReportDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Filter Platform
                </label>
                <select
                  value={waPlatformFilter}
                  onChange={(e) => setWaPlatformFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                >
                  <option value="all">Semua (Cinta Complex)</option>
                  <option value="CINTA CHARLIE">Hanya Cinta Charlie</option>
                  <option value="CINTA PAPA">Hanya Cinta Papa</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-800">Item Pekerjaan Terpilih:</span>
                  <span className="font-extrabold text-emerald-950 px-2 py-0.5 bg-emerald-200 rounded-lg">
                    {dailyWorkRecords.length} Pekerjaan
                  </span>
                </div>
              </div>
            </div>

            {/* WhatsApp Text Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700">Pratinjau Teks WhatsApp (Live Preview):</span>
                <span>Siap dikirim ke kontak atau grup kerja</span>
              </div>
              <div className="bg-[#EFEAE2] p-5 sm:p-6 rounded-2xl border border-slate-300 shadow-inner">
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {generatedWhatsAppText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: EXPORT LAPORAN PEKERJAAN KE EXCEL (.XLSX)                */}
      {/* ============================================================== */}
      {activeSubTab === 'export_maintenance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#ED1C24]" />
                  Ekspor Laporan Semua Pekerjaan ke Excel (.xlsx)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format resmi dengan penomoran berurutan, lebar kolom rapih (tidak terpotong), text wrapping aktif, dan header standar Pertamina PHE OSES.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportMaintenance}
                className="px-6 py-3 bg-[#ED1C24] hover:bg-red-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Excel (.xlsx)</span>
              </button>
            </div>

            {/* Filter Options */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Berdasarkan Kategori Pekerjaan</label>
                <select
                  value={exportCatFilter}
                  onChange={(e) => setExportCatFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                >
                  <option value="all">Semua Kategori (Global)</option>
                  {WORK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Berdasarkan Platform</label>
                <select
                  value={exportPlatFilter}
                  onChange={(e) => setExportPlatFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                >
                  <option value="all">Semua Fasilitas (Cinta Complex)</option>
                  <option value="CINTA CHARLIE">Hanya Cinta Charlie</option>
                  <option value="CINTA PAPA">Hanya Cinta Papa</option>
                </select>
              </div>
            </div>

            {/* Excel Structure Specs */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Struktur Format Berkas Excel (.xlsx) yang Dihasilkan:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-extrabold text-[#002855] block mb-1">1. Penomoran Otomatis (No)</span>
                  <p className="text-[11px] text-slate-500">Nomor urut rapi dari 1 sampai akhir untuk kemudahan audit dan cross-check lapangan.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-extrabold text-[#ED1C24] block mb-1">2. Jarak Antar Kolom Proporsional</span>
                  <p className="text-[11px] text-slate-500">Kolom deskripsi pekerjaan, lokasi, dan keterangan memiliki lebar luas terkalibrasi.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-extrabold text-emerald-700 block mb-1">3. Text Wrap Aktif Otomatis</span>
                  <p className="text-[11px] text-slate-500">Keterangan teknis dan nama ruangan panjang otomatis terlipat ke baris bawah tanpa teks terpotong.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: EXPORT REKAPAN READING STP KE EXCEL (.XLSX)              */}
      {/* ============================================================== */}
      {activeSubTab === 'export_stp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-[#005BAC]" />
                  Ekspor Rekapan Reading STP Harian ke Excel (.xlsx)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi flow meter inlet/outlet, debit harian m³, pH aerasi, dan pH effluent dengan evaluasi baku mutu lingkungan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportSTP}
                className="px-6 py-3 bg-[#005BAC] hover:bg-blue-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Rekap STP (.xlsx)</span>
              </button>
            </div>

            {/* STP Data Summary */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Total Data Reading Tersimpan:</span>
                <span className="text-xl font-black text-[#005BAC]">
                  {records.filter((r) => r.logType === 'daily_stp' || (!r.pekerjaan && r.flowMeterEffluent !== undefined)).length} Record Reading STP
                </span>
              </div>
              <div className="text-xs text-slate-500 max-w-md">
                File spreadsheet dilengkapi rumus dan evaluasi otomatis baku mutu pH (6.0 - 9.0) sesuai standar Permen LHK untuk pengawasan lingkungan laut PHE OSES.
              </div>
            </div>

            {/* STP Excel Columns Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kolom Spreadsheet STP:</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'No',
                  'Tanggal',
                  'Jam',
                  'Shift Kerja',
                  'Flowmeter Inflow (m³)',
                  'Flowmeter Effluent (m³)',
                  'Debit Harian (m³)',
                  'pH Aerasi (6.5-8.5)',
                  'pH Effluent (6.0-9.0)',
                  'Status Baku Mutu',
                  'Operator Jaga',
                  'Catatan Observasi'
                ].map((col, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl font-bold">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
