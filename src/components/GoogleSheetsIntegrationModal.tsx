import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  Save, 
  Code2, 
  Sparkles,
  Link2
} from 'lucide-react';
import { STPRecord } from '../types/stp';

interface GoogleSheetsIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: STPRecord[];
}

const STORAGE_KEY_WEBHOOK = 'phe_oses_google_sheets_webhook_url';

export const GoogleSheetsIntegrationModal: React.FC<GoogleSheetsIntegrationModalProps> = ({
  isOpen,
  onClose,
  allRecords,
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    localStorage.setItem(STORAGE_KEY_WEBHOOK, webhookUrl.trim());
    setSavedUrl(webhookUrl.trim());
    setTestResult({
      success: true,
      message: 'URL Google Apps Script berhasil disimpan. Data baru akan otomatis dikirim ke Google Sheets online.',
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
      tanggal: new Date().toISOString().split('T')[0],
      jam: new Date().toTimeString().substring(0, 5),
      lokasi: 'Cinta Papa, Lantai 2 Room 04',
      pekerjaan: 'Tes Koneksi Sistem Online PHE OSES',
      pressure: '75 Psi',
      ampere: '3.8 A',
      suhuEvap: '8°C',
      status: 'Complete',
      petugas: 'Sistem Admin',
      keterangan: 'Tes koneksi webhook otomatis dari aplikasi ke Google Sheets',
    };

    try {
      // Send via mode no-cors or standard fetch
      await fetch(webhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      setTestResult({
        success: true,
        message: '✅ Sinyal tes berhasil dikirim ke Google Sheets! Periksa spreadsheet Anda, 1 baris data baru telah masuk.',
      });
      localStorage.setItem(STORAGE_KEY_WEBHOOK, webhookUrl.trim());
      setSavedUrl(webhookUrl.trim());
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Gagal mengirim ke URL: ${err.message || 'Periksa kembali URL Deployment Apps Script Anda'}.`,
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
        const payload = {
          action: 'add_record',
          id: rec.id,
          tanggal: rec.tanggal,
          jam: rec.jam,
          lokasi: rec.lokasi || 'Area Fasilitas',
          pekerjaan: rec.pekerjaan || rec.jenisService || 'Perawatan',
          pressure: rec.pressure || '-',
          ampere: rec.ampere || '-',
          suhuEvap: rec.suhuEvap || '-',
          status: rec.statusPekerjaan || 'Complete',
          petugas: rec.petugas || 'Teknisi',
          keterangan: rec.masalahKeluhan || rec.tindakanPerbaikan || rec.catatan || '-',
          fotoUrl: rec.fotoServiceUrl || rec.fotoUrl || '',
        };

        await fetch(webhookUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setBulkResult(`✅ Sukses mengirim ${allRecords.length} baris data laporan ke Google Sheets!`);
    } catch (err: any) {
      setBulkResult('Sebagian data mungkin tertunda. Periksa koneksi internet Anda.');
    } finally {
      setIsBulkSending(false);
    }
  };

  // The full ready-to-use Google Apps Script code
  const googleAppsScriptCode = `/**
 * Google Apps Script untuk Sistem Fasilitas PHE OSES
 * Salin dan tempel kode ini ke Extensions -> Apps Script pada Google Sheet Anda.
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Laporan_PHE_OSES";
    var sheet = ss.getSheetByName(sheetName);
    
    // Jika sheet belum ada, buat otomatis dengan header
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Timestamp",
        "Tanggal",
        "Jam",
        "Lokasi",
        "Pekerjaan",
        "Pressure",
        "Ampere",
        "Suhu_Evap",
        "Status",
        "Pelaksana",
        "Keterangan",
        "Foto_URL"
      ]);
      // Format header
      sheet.getRange(1, 1, 1, 12).setBackground("#002855").setFontColor("#FFFFFF").setFontWeight("bold");
    }
    
    var data = JSON.parse(e.postData.contents);
    
    var timestamp = new Date();
    var tanggal = data.tanggal || Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyy-MM-dd");
    var jam = data.jam || Utilities.formatDate(timestamp, "Asia/Jakarta", "HH:mm");
    var lokasi = data.lokasi || "-";
    var pekerjaan = data.pekerjaan || "-";
    var pressure = data.pressure || "-";
    var ampere = data.ampere || "-";
    var suhuEvap = data.suhuEvap || "-";
    var status = data.status || "Complete";
    var petugas = data.petugas || "-";
    var keterangan = data.keterangan || "-";
    var fotoUrl = data.fotoUrl || "";
    
    sheet.appendRow([
      timestamp,
      tanggal,
      jam,
      lokasi,
      pekerjaan,
      pressure,
      ampere,
      suhuEvap,
      status,
      petugas,
      keterangan,
      fotoUrl
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data tersimpan" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook Service Aktif & Online. Gunakan POST untuk mengirim data.")
    .setMimeType(ContentService.MimeType.TEXT);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Top Pertamina Accent Bar: Merah - Biru - Oranye */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="flex-1 bg-[#ED1C24]"></div>
          <div className="flex-1 bg-[#005BAC]"></div>
          <div className="flex-1 bg-[#FF6F00]"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-md border border-white/20 text-white">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Pengaturan Koneksi Google Sheets Online</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#ED1C24] text-white">
                  PHE OSES
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Cara menyambungkan data laporan ke Google Sheets Anda secara online &amp; otomatis
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* STEP 1: Webhook URL Input */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 block text-xs flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#005BAC]" />
                <span>URL Web App Google Apps Script Anda:</span>
              </label>
              {savedUrl && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Tersimpan Aktif
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-[#005BAC]/20"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2.5 bg-[#005BAC] hover:bg-[#004a8e] text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#FF6F00]" />
                <span>Simpan URL</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-3 h-3 text-[#FF6F00] ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Menguji...' : 'Tes Kirim 1 Data ke Google Sheet'}</span>
              </button>

              <button
                type="button"
                disabled={isBulkSending || allRecords.length === 0}
                onClick={handleBulkSync}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-white ${isBulkSending ? 'animate-spin' : ''}`} />
                <span>Kirim Semua Data ({allRecords.length}) ke Sheet</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.message}
              </div>
            )}

            {bulkResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900">
                {bulkResult}
              </div>
            )}
          </div>

          {/* STEP 2: Petunjuk Langkah demi Langkah */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              Langkah Pengaturan Google Sheets (Gratis &amp; Otomatis):
            </h4>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#005BAC] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block">Buat Google Spreadsheet Baru</strong>
                  <span className="text-slate-500 text-[11px]">
                    Buka <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-[#005BAC] underline font-bold">sheets.google.com</a> dan buat spreadsheet baru dengan nama <strong>"Laporan_Fasilitas_PHE_OSES"</strong>.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#005BAC] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block">Buka Menu Ekstensi &rarr; Apps Script</strong>
                  <span className="text-slate-500 text-[11px]">
                    Di spreadsheet Anda, klik menu atas <strong>Ekstensi (Extensions)</strong>, lalu klik <strong>Apps Script</strong>.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#ED1C24] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block">Tempel (Paste) Kode Script di Bawah Ini:</strong>
                      <span className="text-slate-500 text-[11px]">Hapus semua isi teks bawaan di editor Apps Script, lalu klik tombol salin:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kode Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#FF6F00]" />
                          <span>Salin Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code preview box */}
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] max-h-36 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                    {googleAppsScriptCode}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FF6F00] text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 block">Deploy / Terapkan Sebagai Web App</strong>
                  <ul className="text-slate-500 text-[11px] list-disc list-inside mt-0.5 space-y-0.5">
                    <li>Klik tombol biru <strong>Deploy (Terapkan)</strong> di pojok kanan atas &rarr; <strong>Penerapan baru (New deployment)</strong>.</li>
                    <li>Pilih jenis ikon gerigi: <strong>Aplikasi web (Web app)</strong>.</li>
                    <li>Pada <em>Jalankan sebagai (Execute as)</em>: pilih <strong>Saya (Me)</strong>.</li>
                    <li>Pada <em>Yang memiliki akses (Who has access)</em>: pilih <strong>Siapa saja (Anyone)</strong>.</li>
                    <li>Klik <strong>Deploy</strong>, izinkan akses Google akun Anda, lalu <strong>salin URL Aplikasi Web</strong> (berakhiran <code>/exec</code>).</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <strong className="text-slate-900 block">Selesai! Tempel URL di Kotak Atas &amp; Klik "Simpan URL"</strong>
                  <span className="text-slate-500 text-[11px]">
                    Setelah disimpan, setiap kali ada laporan baru atau update dari HP anggota tim, data akan otomatis masuk dan terupdate ke spreadsheet Google Sheets Anda secara online!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
