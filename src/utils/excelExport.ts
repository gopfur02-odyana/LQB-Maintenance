import * as XLSX from 'xlsx';
import { STPRecord } from '../types/stp';

/**
 * Format tanggal Indonesia ramah pengguna: YYYY-MM-DD atau DD MMM YYYY
 */
function formatDateId(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Ekspor Laporan Semua Pekerjaan Pemeliharaan Fasilitas ke Excel (.xlsx) dengan Format Rapih
 * Memenuhi kriteria:
 * - Penomoran berurutan (No 1, 2, 3...)
 * - Jarak antar kolom proporsional (column width terukur)
 * - Wrap text aktif pada kolom deskripsi & lokasi
 * - Header styling dan judul laporan resmi Pertamina PHE OSES
 */
export function exportMaintenanceToExcel(
  records: STPRecord[],
  options?: {
    platformFilter?: string;
    categoryFilter?: string;
    customFilename?: string;
  }
) {
  // Filter maintenance records (logType === 'service_all' or has pekerjaan)
  const maintenanceRecords = records.filter(
    (r) => r.logType === 'service_all' || !!r.pekerjaan
  );

  const filtered = maintenanceRecords.filter((r) => {
    if (options?.platformFilter && options.platformFilter !== 'all') {
      const plat = (r.platform || '').toUpperCase();
      if (!plat.includes(options.platformFilter.toUpperCase())) return false;
    }
    if (options?.categoryFilter && options.categoryFilter !== 'all') {
      const cat = r.kategoriPekerjaan || r.unitKategori;
      if (cat !== options.categoryFilter) return false;
    }
    return true;
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Baris Judul & Metadata Laporan
  const sheetData: any[][] = [
    ['PT PERTAMINA HULU ENERGI OFFSHORE SOUTHEAST SUMATRA (PHE OSES)'],
    ['LAPORAN REKAP PEMELIHARAAN FASILITAS & UTILITY GEDUNG - CINTA COMPLEX'],
    [`Tanggal Cetak / Export: ${dateStr} - Pukul ${timeStr} WIB`],
    [`Total Pekerjaan: ${filtered.length} Item Pekerjaan`],
    [], // Baris kosong pemisah
    // Header Kolom Tabel
    [
      'NO',
      'TANGGAL',
      'JAM',
      'LOKASI FASILITAS',
      'KATEGORI PEKERJAAN',
      'URAIAN PEKERJAAN',
      'STATUS PEKERJAAN',
      'PERSONIL / PELAKSANA',
      'KETERANGAN / TINDAK LANJUT'
    ]
  ];

  // Baris Data
  filtered.forEach((rec, idx) => {
    // Format lokasi yang rapi
    const lokasiStr = rec.lokasi || [
      rec.platform || 'CINTA COMPLEX',
      rec.lantai || '',
      rec.ruangan || ''
    ].filter(Boolean).join(', ');

    const kategori = rec.kategoriPekerjaan || rec.unitKategori || 'Utility Gedung';
    const uraian = rec.pekerjaan || rec.unitNama || 'Perawatan Fasilitas';
    const status = rec.statusPekerjaan || 'Complete';
    const personil = rec.petugas || 'Teknisi Utility';
    const keterangan = rec.catatan || rec.keteranganTeknis || rec.tindakanPerbaikan || '-';

    sheetData.push([
      idx + 1,
      rec.tanggal || '-',
      rec.jam || '-',
      lokasiStr,
      kategori,
      uraian,
      status,
      personil,
      keterangan
    ]);
  });

  // Buat Sheet dari Array of Array
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Atur Jarak Antar Kolom (Widths) agar proporsional dan tidak terpotong
  ws['!cols'] = [
    { wch: 6 },   // Col A: NO
    { wch: 13 },  // Col B: TANGGAL
    { wch: 8 },   // Col C: JAM
    { wch: 32 },  // Col D: LOKASI FASILITAS (Lebar proporsional)
    { wch: 22 },  // Col E: KATEGORI PEKERJAAN
    { wch: 42 },  // Col F: URAIAN PEKERJAAN (Lebar cukup panjang untuk wrap text)
    { wch: 20 },  // Col G: STATUS PEKERJAAN
    { wch: 26 },  // Col H: PERSONIL / PELAKSANA
    { wch: 38 },  // Col I: KETERANGAN / TINDAK LANJUT
  ];

  // Atur Tinggi Baris (Row Heights)
  ws['!rows'] = [
    { hpt: 24 }, // Title 1
    { hpt: 22 }, // Title 2
    { hpt: 18 }, // Info Date
    { hpt: 18 }, // Info Total
    { hpt: 12 }, // Spacing
    { hpt: 26 }, // Header Row (NO, TANGGAL, ...)
  ];

  // Aktifkan Wrap Text dan Alignment untuk seluruh sel data
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:I1');
  for (let R = 5; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      if (!ws[cellAddress].s) ws[cellAddress].s = {};
      
      // Default wrap text aktif untuk semua sel tabel
      ws[cellAddress].s.alignment = {
        wrapText: true,
        vertical: 'top',
        horizontal: (C === 0 || C === 1 || C === 2 || C === 6) ? 'center' : 'left'
      };
    }
  }

  // Buat Workbook dan download file .xlsx
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Maintenance');

  const filename = options?.customFilename || `Laporan_Pekerjaan_Cinta_Complex_${now.toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { success: true, count: filtered.length, filename };
}

/**
 * Ekspor Rekapan Reading STP Harian ke Excel (.xlsx) dengan Format Rapih
 * Memenuhi kriteria:
 * - Penomoran berurutan
 * - Jarak kolom teratur
 * - Wrap text & format desimal meteran
 * - Parameter baku mutu jelas
 */
export function exportSTPToExcel(
  records: STPRecord[],
  options?: {
    customFilename?: string;
  }
) {
  // Filter STP reading records
  const stpRecords = records.filter(
    (r) => r.logType === 'daily_stp' || (!r.pekerjaan && r.flowMeterEffluent !== undefined)
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Baris Judul & Metadata Laporan
  const sheetData: any[][] = [
    ['PT PERTAMINA HULU ENERGI OFFSHORE SOUTHEAST SUMATRA (PHE OSES)'],
    ['REKAPITULASI PEMBACAAN HARIAN SEWAGE TREATMENT PLANT (STP) - CINTA COMPLEX'],
    [`Tanggal Cetak / Export: ${dateStr} - Pukul ${timeStr} WIB`],
    [`Total Data Reading: ${stpRecords.length} Record`],
    [], // Baris kosong
    // Header Kolom Tabel
    [
      'NO',
      'TANGGAL',
      'JAM',
      'SHIFT KERJA',
      'FLOW INFLOW (m³)',
      'FLOW EFFLUENT (m³)',
      'DEBIT HARIAN (m³)',
      'pH AERASI (6.5-8.5)',
      'pH EFFLUENT (6.0-9.0)',
      'STATUS MUTU',
      'OPERATOR JAGA',
      'CATATAN OBSERVASI'
    ]
  ];

  // Baris Data
  stpRecords.forEach((rec, idx) => {
    const phEff = rec.phEffluent || 0;
    const isPhNormal = phEff >= 6.0 && phEff <= 9.0;
    const statusMutu = phEff > 0 ? (isPhNormal ? 'NORMAL (Memenuhi)' : 'OUT OF SPEC') : '-';

    sheetData.push([
      idx + 1,
      rec.tanggal || '-',
      rec.jam || '-',
      rec.shift || 'Shift 1',
      rec.flowMeterInflow ?? 0,
      rec.flowMeterEffluent ?? 0,
      rec.debitHarian ?? 0,
      rec.phAerasi ?? 0,
      rec.phEffluent ?? 0,
      statusMutu,
      rec.petugas || 'Operator STP',
      rec.catatan || '-'
    ]);
  });

  // Buat Sheet dari Array of Array
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Atur Jarak Antar Kolom (Widths) agar proporsional dan tidak terpotong
  ws['!cols'] = [
    { wch: 6 },   // Col A: NO
    { wch: 13 },  // Col B: TANGGAL
    { wch: 8 },   // Col C: JAM
    { wch: 14 },  // Col D: SHIFT KERJA
    { wch: 18 },  // Col E: FLOW INFLOW (m³)
    { wch: 18 },  // Col F: FLOW EFFLUENT (m³)
    { wch: 16 },  // Col G: DEBIT HARIAN (m³)
    { wch: 18 },  // Col H: pH AERASI
    { wch: 18 },  // Col I: pH EFFLUENT
    { wch: 18 },  // Col J: STATUS MUTU
    { wch: 22 },  // Col K: OPERATOR JAGA
    { wch: 38 },  // Col L: CATATAN OBSERVASI (Wrap text)
  ];

  // Atur Tinggi Baris
  ws['!rows'] = [
    { hpt: 24 }, // Title 1
    { hpt: 22 }, // Title 2
    { hpt: 18 }, // Info Date
    { hpt: 18 }, // Info Total
    { hpt: 12 }, // Spacing
    { hpt: 26 }, // Header Row
  ];

  // Wrap Text dan Alignment untuk seluruh sel data
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:L1');
  for (let R = 5; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      if (!ws[cellAddress].s) ws[cellAddress].s = {};
      
      // Alignment
      const isCenterCol = (C === 0 || C === 1 || C === 2 || C === 3 || C === 9);
      const isNumberCol = (C >= 4 && C <= 8);
      
      ws[cellAddress].s.alignment = {
        wrapText: true,
        vertical: 'top',
        horizontal: isCenterCol ? 'center' : (isNumberCol ? 'right' : 'left')
      };
    }
  }

  // Buat Workbook dan download file .xlsx
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reading_STP_Harian');

  const filename = options?.customFilename || `Rekap_Reading_STP_Cinta_Complex_${now.toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { success: true, count: stpRecords.length, filename };
}
