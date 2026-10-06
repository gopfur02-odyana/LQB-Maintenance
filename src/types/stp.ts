export type LogType = 'daily_stp' | 'service_all';

export type EquipmentCategory = 
  | 'Water Treatment & Sanitasi'
  | 'HVAC & Pendingin'
  | 'Kitchen & Dapur Komersial'
  | 'Laundry & Dryer'
  | 'Electrical & Genset'
  | 'Peralatan Umum';

export type EquipmentFrequency = 
  | 'Harian'
  | 'Mingguan'
  | 'Bulanan'
  | 'Per 3 Bulan'
  | 'Per 6 Bulan'
  | '1 Tahun'
  | 'Berkala / Saat Servis';

export type EquipmentOperationalStatus =
  | 'Normal / Beroperasi'
  | 'Standby / Siaga'
  | 'Perlu Perbaikan (Minor)'
  | 'Dalam Perbaikan (Breakdown)'
  | 'Temuan / Finding';

export interface EquipmentUnit {
  id: string;
  kode: string;
  nama: string;
  kategori: EquipmentCategory;
  lokasi: string;
  platform?: string; // CINTA CHARLIE atau CINTA PAPA
  lantai?: string;   // Lantai 1 s/d Lantai 4
  ruangan?: string;  // Nama Ruangan / Kamar
  spesifikasi?: string; // Misal: 1.5 PK, 2 PK, 3 Phase, dll
  frekuensiInspeksi: EquipmentFrequency;
  statusOperasional: EquipmentOperationalStatus;
  deskripsi: string;
  isSTP: boolean;
  createdAt: string;
}

export type EquipmentServiceType = 
  | 'Steam AC Split 1.5 PK'
  | 'Steam & Cuci AC'
  | 'Preventive Maintenance (PM Rutin)'
  | 'Perbaikan Kerusakan (Troubleshooting)'
  | 'Penggantian Sparepart'
  | 'Pembersihan / Cuci Unit'
  | 'Kalibrasi & Overhaul'
  | 'Inspeksi Temuan (Finding)';

export type ServiceStatus = 
  | 'Complete'
  | 'Completed / Selesai Normal'
  | 'FINDING (Belum Selesai / Open)'
  | 'Menunggu Sparepart'
  | 'In Progress / Running Test';

export type ServicePriority = 
  | 'Tinggi (Kritis / Urgent)'
  | 'Sedang (Normal)'
  | 'Rendah (Minor / Estetika)';

export type WorkCategory = 
  | 'Elektrikal'
  | 'Plumbing'
  | 'Sipil'
  | 'Housekeeping'
  | 'IT'
  | 'Carpenter'
  | 'HVAC & Pendingin'
  | 'Utility Gedung'
  | 'Lain-lain';

export const WORK_CATEGORIES: { id: WorkCategory; label: string; icon: string; color: string }[] = [
  { id: 'Elektrikal', label: 'Elektrikal', icon: 'Zap', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'Plumbing', label: 'Plumbing', icon: 'Droplets', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { id: 'Sipil', label: 'Sipil', icon: 'Building2', color: 'bg-stone-100 text-stone-800 border-stone-300' },
  { id: 'Housekeeping', label: 'Housekeeping', icon: 'Sparkles', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'IT', label: 'IT', icon: 'Cpu', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'Carpenter', label: 'Carpenter', icon: 'Hammer', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'HVAC & Pendingin', label: 'HVAC & Pendingin', icon: 'Snowflake', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { id: 'Utility Gedung', label: 'Utility Gedung', icon: 'Wrench', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'Lain-lain', label: 'Lain-lain', icon: 'FileText', color: 'bg-slate-100 text-slate-800 border-slate-300' },
];

// Unified record that can represent either Daily STP Reading or Service Record
export interface STPRecord {
  id: string;
  logType: LogType; // 'daily_stp' (Harian STP) vs 'service_all' (Service Semua Alat)
  unitId: string;
  unitNama: string;
  unitKategori?: string;
  kategoriPekerjaan?: WorkCategory | string; // Elektrikal, Plumbing, Sipil, Housekeeping, IT, Carpenter, dll.
  lokasi?: string;
  platform?: string; // CINTA CHARLIE atau CINTA PAPA
  lantai?: string;   // Lantai 1 s/d 4
  ruangan?: string;  // Room 04, Kitchen, dll
  pekerjaan?: string; // Deskripsi Pekerjaan
  
  // Parameter Teknis (Opsional / Legacy)
  pressure?: string;
  ampere?: string;
  suhuEvap?: string;
  keteranganTeknis?: string;

  timestamp: string;
  tanggal: string;
  jam: string;
  petugas: string; // Nama Operator / Teknisi / Vendor
  shift?: string;

  // Khusus Reading Harian STP (Fokus Flow Meter & pH)
  phAerasi?: number; // 6.5 - 8.5
  phEffluent?: number; // 6.0 - 9.0 (Baku Mutu)
  flowMeterInflow?: number; // m3
  flowMeterEffluent?: number; // m3
  debitHarian?: number; // m3/hari
  doAerasi?: number; // Opsional: mg/L

  // Khusus Record Service & Maintenance (Semua Peralatan)
  jenisService?: EquipmentServiceType | string;
  prioritas?: ServicePriority;
  statusPekerjaan?: ServiceStatus | string; // Complete, FINDING, Menunggu Sparepart
  targetPenyelesaian?: string; // Tanggal estimasi follow-up
  masalahKeluhan?: string; // Gejala kerusakan / uraian temuan (finding)
  tindakanPerbaikan?: string; // Pekerjaan yang dilakukan / rencana tindak lanjut
  sparepartDiganti?: string; // Komponen baru
  fotoServiceUrl?: string; // Image upload URL / Base64 preview
  
  fotoUrl?: string;
  catatan?: string;
  syncStatus: 'Tersinkron Online' | 'Mengirim...';
}

export interface STPColumn {
  id: string;
  header: string;
  label: string;
  sheetTarget: 'Reading_STP_Harian' | 'Service_Maintenance_Log';
  sheetType: string;
  appSheetType: string;
  required: boolean;
  standardValue?: string;
  description: string;
  example: string;
}

export interface OperatorPerformance {
  nama: string;
  totalLaporan: number;
  lastActive: string;
  avgPhLogged: number;
  avgDoLogged: number;
  status: 'Aktif Normal' | 'Siaga';
}

export interface FormulaSnippet {
  id: string;
  title: string;
  category: 'bulanan' | 'operator' | 'kualitas' | 'otomasi';
  formula: string;
  description: string;
  syntaxBreakdown: string[];
  expectedOutput: string;
}

export interface Personnel {
  id: string;
  nama: string;
  jabatan: string;
  kategoriDefault?: WorkCategory | string;
  kontak?: string;
  isAktif: boolean;
}

export interface COTPRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  cotp1TotalHours: number; // Input Total Jam Counter (misal: 104, besok 109)
  cotp1DailyHours: number; // Running berapa jam (selisih harian, misal: 5 jam)
  cotp2TotalHours: number; // Input Total Jam Counter (misal: 210)
  cotp2DailyHours: number; // Running berapa jam (selisih harian, misal: 0 jam)
  // Legacy / optional fallback
  cotp1Hours?: number | string;
  cotp2Hours?: number | string;
  cotp1Status?: string;
  cotp2Status?: string;
  jam?: string;
  shift?: string;
  petugas?: string;
  catatan?: string;
  timestamp: string;
}

export const DEFAULT_COTP_RECORDS: COTPRecord[] = [
  {
    id: 'COTP-20261005-01',
    tanggal: '2026-10-05',
    cotp1TotalHours: 104,
    cotp1DailyHours: 0,
    cotp2TotalHours: 210,
    cotp2DailyHours: 0,
    timestamp: '2026-10-05 00:00:00',
  },
  {
    id: 'COTP-20261006-01',
    tanggal: '2026-10-06',
    cotp1TotalHours: 109,
    cotp1DailyHours: 5,
    cotp2TotalHours: 210,
    cotp2DailyHours: 0,
    timestamp: '2026-10-06 00:00:00',
  },
];

export const DEFAULT_PERSONNEL: Personnel[] = [
  { id: 'p-1', nama: 'Budi Santoso', jabatan: 'Teknisi Elektrikal', kategoriDefault: 'Elektrikal', isAktif: true },
  { id: 'p-2', nama: 'Agus Pratama', jabatan: 'Teknisi Plumbing', kategoriDefault: 'Plumbing', isAktif: true },
  { id: 'p-3', nama: 'Dedi Kurniawan', jabatan: 'Teknisi Sipil', kategoriDefault: 'Sipil', isAktif: true },
  { id: 'p-4', nama: 'Hendra Saputra', jabatan: 'Teknisi HVAC & Pendingin', kategoriDefault: 'HVAC & Pendingin', isAktif: true },
  { id: 'p-5', nama: 'Rudi Hartono', jabatan: 'Carpenter / Tukang Kayu', kategoriDefault: 'Carpenter', isAktif: true },
  { id: 'p-6', nama: 'Iwan Setiawan', jabatan: 'Teknisi IT & Utility', kategoriDefault: 'IT', isAktif: true },
  { id: 'p-7', nama: 'Joko Susilo', jabatan: 'Staff Housekeeping', kategoriDefault: 'Housekeeping', isAktif: true },
  { id: 'p-8', nama: 'Ahmad Fauzi', jabatan: 'Operator STP', kategoriDefault: 'Utility Gedung', isAktif: true },
  { id: 'p-9', nama: 'Teknisi Utility', jabatan: 'Teknisi Umum', kategoriDefault: 'Utility Gedung', isAktif: true },
];
