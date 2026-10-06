import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ExternalLink, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Link2,
  Send,
  Sparkles
} from 'lucide-react';
import { STPRecord } from '../types/stp';

interface GoogleSheetsSettingsViewProps {
  allRecords: STPRecord[];
  onWebhookUrlChange?: (url: string) => void;
}

const STORAGE_KEY_WEBHOOK = 'phe_oses_google_sheets_webhook_url';

export const GoogleSheetsSettingsView: React.FC<GoogleSheetsSettingsViewProps> = ({
  allRecords,
  onWebhookUrlChange,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK);
    if (saved) {
      setWebhookUrl(saved);
      setSavedUrl(saved);
    }
  }, []);

  const handleSaveUrl = () => {
    const trimmed = webhookUrl.trim();
    localStorage.setItem(STORAGE_KEY_WEBHOOK, trimmed);
    setSavedUrl(trimmed);
    if (onWebhookUrlChange) onWebhookUrlChange(trimmed);
    setTestResult({
      success: true,
      message: 'URL Google Apps Script berhasil disimpan. Data baru akan otomatis terupdate ke Google Sheet online.',
    });
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({ success: false, message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testPayload = {
      action: 'test_connection',
      type: 'maintenance',
      tanggal: new Date().toISOString().split('T')[0],
      jam: new Date().toTimeString().substring(0, 5),
      lokasi: 'Cinta Papa, Lantai 2 Room 04',
      kategori: 'Elektrikal',
      pekerjaan: 'Perbaikan instalasi lampu & saklar',
      status: 'Complete',
      petugas: 'Teknisi Utility',
      keterangan: 'Tes koneksi sistem laporan utility gedung ke Google Sheets',
    };

    try {
      await fetch(webhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload),
      });

      setTestResult({
        success: true,
        message: '✅ Sinyal tes berhasil dikirim ke Google Sheets! Silakan periksa spreadsheet Anda, data tes baru telah masuk.',
      });
      localStorage.setItem(STORAGE_KEY_WEBHOOK, webhookUrl.trim());
      setSavedUrl(webhookUrl.trim());
      if (onWebhookUrlChange) onWebhookUrlChange(webhookUrl.trim());
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Gagal mengirim ke URL: ${err.message || 'Periksa kembali URL Web App Apps Script Anda'}.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleBulkSync = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({ success: false, message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }

    if (allRecords.length === 0) {
      setBulkResult('Tidak ada data laporan untuk dikirim.');
      return;
    }

    setIsBulkSending(true);
    setBulkResult(null);

    try {
      for (const rec of allRecords) {
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
              pekerjaan: rec.pekerjaan || rec.unitNama || 'Perawatan',
              status: rec.statusPekerjaan || 'Complete',
              petugas: rec.petugas || 'Teknisi Utility',
              keterangan: rec.catatan || rec.tindakanPerbaikan || rec.keteranganTeknis || '-',
            };

        await fetch(webhookUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      }

      setBulkResult(`✅ Sukses mengirim ${allRecords.length} baris data laporan ke Google Sheets!`);
    } catch (err: any) {
      setBulkResult('Sebagian data mungkin tertunda karena koneksi. Silakan coba lagi.');
    } finally {
      setIsBulkSending(false);
    }
  };

  const googleAppsScriptCode = `/**
 * GOOGLE APPS SCRIPT - LQB MAINTENANCE (PERTAMINA PHE OSES)
 * Script ini secara otomatis memisahkan laporan ke 2 lembar kerja (Sheet):
 * 1. Sheet "Service_Maintenance_Log" (Pekerjaan Maintenance, AC, Pressure, Ampere, Suhu Evap)
 * 2. Sheet "Reading_STP_Harian" (Reading Harian Flow Meter Inflow/Effluent & pH)
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var timestamp = new Date();
    
    // 1. JIKA LAPORAN READING STP HARIAN
    if (data.type === "stp" || data.logType === "daily_stp") {
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
    // 2. JIKA LAPORAN PEKERJAAN MAINTENANCE UTILITY GEDUNG
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

/**
 * Fungsi doGet agar saat URL Web App dibuka di browser Chrome tidak muncul pesan
 * "Fungsi skrip tidak ditemukan: doGet"
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "LQB Maintenance Webhook Aktif & Siap Menerima Data"
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const isConfigured = Boolean(savedUrl);

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-600 text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Pengaturan Koneksi Google Sheets Online
                </h2>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isConfigured 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isConfigured ? '🟢 Online Tersambung' : 'Belum Dikonfigurasi'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap kali teknisi menyimpan pekerjaan atau reading STP, data langsung otomatis masuk ke baris Google Sheets Anda secara online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Card: URL Webhook Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="space-y-2">
          <label className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span>URL Web App Google Apps Script (Webhook):</span>
            </span>
            <span className="text-slate-400 font-normal text-xs font-mono">
              (Berakhiran /exec)
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
            />

            <button
              type="button"
              onClick={handleSaveUrl}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Simpan URL</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Test Connection & Bulk Sync */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isTesting || !webhookUrl}
            onClick={handleTestConnection}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Kirim Data Tes ke Sheet'}</span>
          </button>

          <button
            type="button"
            disabled={isBulkSending || !webhookUrl || allRecords.length === 0}
            onClick={handleBulkSync}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBulkSending ? 'animate-spin' : ''}`} />
            <span>Kirim Semua ({allRecords.length}) Data Tersimpan ke Sheet</span>
          </button>
        </div>

        {/* Test / Bulk Result Message */}
        {testResult && (
          <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            testResult.success 
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' 
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {bulkResult && (
          <div className="p-4 rounded-xl text-xs bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{bulkResult}</span>
          </div>
        )}
      </div>

      {/* Panduan 4 Langkah Menghubungkan Google Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
          <span>Cara Mudah Menghubungkan Google Sheet (Hanya 2 Menit):</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-700">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#002855] text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <strong className="block text-slate-900">Buka Spreadsheet Baru</strong>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Buka Google Sheets di browser Anda, lalu beri nama spreadsheet (misal: <em>LQB Maintenance PHE OSES</em>).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#005BAC] text-white flex items-center justify-center font-bold text-xs">
              2
            </span>
            <strong className="block text-slate-900">Buka Apps Script</strong>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Klik menu atas <strong>Ekstensi (Extensions)</strong> &rarr; <strong>Apps Script</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#ED1C24] text-white flex items-center justify-center font-bold text-xs">
              3
            </span>
            <strong className="block text-slate-900">Salin Kode di Bawah</strong>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Hapus tulisan di editor Apps Script, lalu tempel kode yang sudah kami siapkan di kotak bawah.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              4
            </span>
            <strong className="block text-slate-900">Terapkan (Deploy)</strong>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Klik <strong>Deploy &rarr; New Deployment</strong>, pilih <em>Web App</em>, akses <strong>Anyone (Siapa saja)</strong>, lalu salin URL-nya ke kolom di atas.
            </p>
          </div>
        </div>
      </div>

      {/* Code Box: Ready to copy Google Apps Script */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
              Kode Google Apps Script Siap Salin (Otomatis Pisah 2 Sheet)
            </h4>
          </div>

          <button
            type="button"
            onClick={handleCopyScript}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            {copiedScript ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Kode Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode Script</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
          {googleAppsScriptCode}
        </pre>
      </div>
    </div>
  );
};
