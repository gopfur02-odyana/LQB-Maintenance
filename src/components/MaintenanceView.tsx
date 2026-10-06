import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Clock4, 
  Share2, 
  Building2, 
  Layers, 
  MapPin, 
  User, 
  Activity, 
  X, 
  Send, 
  FileSpreadsheet, 
  Check, 
  Zap, 
  Droplets,
  Sparkles,
  Cpu,
  Hammer,
  Snowflake,
  FileText,
  ChevronDown
} from 'lucide-react';
import { STPRecord, EquipmentUnit, ServiceStatus, WorkCategory, WORK_CATEGORIES, Personnel } from '../types/stp';
import { FACILITY_LOCATIONS } from '../data/locations';

interface MaintenanceViewProps {
  records: STPRecord[];
  equipmentList: EquipmentUnit[];
  personnelList?: Personnel[];
  onRecordCreated: (newRecord: STPRecord) => void;
  onUpdateRecordStatus: (id: string, newStatus: ServiceStatus) => void;
  onOpenWhatsAppShare: (record: STPRecord) => void;
  isOnlineSheetsConfigured?: boolean;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  records,
  equipmentList,
  personnelList = [],
  onRecordCreated,
  onUpdateRecordStatus,
  onOpenWhatsAppShare,
  isOnlineSheetsConfigured = false,
}) => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [locationFilter, setLocationFilter] = useState<'all' | 'CINTA CHARLIE' | 'CINTA PAPA'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for new maintenance work
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jam, setJam] = useState(new Date().toTimeString().substring(0, 5));
  const [selectedPlatform, setSelectedPlatform] = useState<string>('CINTA PAPA');
  const [selectedFloor, setSelectedFloor] = useState<string>('Lantai 2');
  const [selectedRoom, setSelectedRoom] = useState<string>('Room 04 (Kamar 04)');
  const [kategoriPekerjaan, setKategoriPekerjaan] = useState<WorkCategory>('Elektrikal');
  const [pekerjaan, setPekerjaan] = useState('Perbaikan instalasi lampu & saklar');
  const [keteranganTambahan, setKeteranganTambahan] = useState('');
  
  const [statusPekerjaan, setStatusPekerjaan] = useState<ServiceStatus>('Complete');
  const [teknisi, setTeknisi] = useState('Teknisi Utility Fasilitas');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter maintenance records (logType === 'service_all' or has pekerjaan)
  const maintenanceRecords = useMemo(() => {
    return records.filter((r) => r.logType === 'service_all' || !!r.pekerjaan);
  }, [records]);

  // Dynamic floors based on selected platform
  const currentFacility = FACILITY_LOCATIONS.find((f) => f.name === selectedPlatform) || FACILITY_LOCATIONS[1];
  const currentFloors = currentFacility.floors;
  const currentFloorObj = currentFloors.find((fl) => fl.floorName === selectedFloor) || currentFloors[0];
  const currentRooms = currentFloorObj ? currentFloorObj.rooms : [];

  // Update floors & rooms when platform changes
  const handlePlatformChange = (platformName: string) => {
    setSelectedPlatform(platformName);
    const facility = FACILITY_LOCATIONS.find((f) => f.name === platformName) || FACILITY_LOCATIONS[0];
    const firstFloor = facility.floors[0]?.floorName || 'Lantai 1';
    setSelectedFloor(firstFloor);
    setSelectedRoom(facility.floors[0]?.rooms[0] || 'Ruangan 1');
  };

  const handleFloorChange = (floorName: string) => {
    setSelectedFloor(floorName);
    const floorObj = currentFloors.find((fl) => fl.floorName === floorName);
    if (floorObj && floorObj.rooms.length > 0) {
      setSelectedRoom(floorObj.rooms[0]);
    }
  };

  // Helper to render icon & badge for category
  const renderCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'Elektrikal':
        return <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'Plumbing':
        return <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case 'Sipil':
        return <Building2 className="w-3.5 h-3.5 text-stone-600 shrink-0" />;
      case 'Housekeeping':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'IT':
        return <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case 'Carpenter':
        return <Hammer className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      case 'HVAC & Pendingin':
        return <Snowflake className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
      case 'Utility Gedung':
        return <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'Elektrikal':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Plumbing':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Sipil':
        return 'bg-stone-50 text-stone-800 border-stone-200';
      case 'Housekeeping':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'IT':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Carpenter':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'HVAC & Pendingin':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'Utility Gedung':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  // Filtered display records
  const filteredRecords = useMemo(() => {
    return maintenanceRecords.filter((rec) => {
      // Platform filter
      if (locationFilter !== 'all') {
        const matchesPlatform = rec.platform?.toLowerCase().includes(locationFilter.toLowerCase()) ||
          rec.lokasi?.toLowerCase().includes(locationFilter.toLowerCase());
        if (!matchesPlatform) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = rec.kategoriPekerjaan || rec.unitKategori || '';
        if (cat.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Complete' && !rec.statusPekerjaan?.includes('Complete')) return false;
        if (statusFilter === 'Finding' && !rec.statusPekerjaan?.includes('FINDING') && !rec.statusPekerjaan?.includes('Finding')) return false;
        if (statusFilter === 'InProgress' && !rec.statusPekerjaan?.includes('In Progress')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${rec.pekerjaan || ''} ${rec.kategoriPekerjaan || ''} ${rec.lokasi || ''} ${rec.ruangan || ''} ${rec.petugas || ''} ${rec.catatan || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [maintenanceRecords, locationFilter, categoryFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = maintenanceRecords.length;
    const complete = maintenanceRecords.filter((r) => r.statusPekerjaan?.includes('Complete')).length;
    const pending = maintenanceRecords.filter((r) => r.statusPekerjaan?.includes('FINDING') || r.statusPekerjaan?.includes('Menunggu')).length;
    const inProgress = total - complete - pending;
    return { total, complete, pending, inProgress: Math.max(0, inProgress) };
  }, [maintenanceRecords]);

  // Submit new maintenance
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date();
    const formattedLocation = `${selectedPlatform}, ${selectedFloor} ${selectedRoom}`;

    const newRecord: STPRecord = {
      id: `WO-${Date.now().toString().slice(-6)}`,
      logType: 'service_all',
      unitId: `utility-${Date.now()}`,
      unitNama: pekerjaan,
      unitKategori: kategoriPekerjaan,
      kategoriPekerjaan: kategoriPekerjaan,
      platform: selectedPlatform,
      lantai: selectedFloor,
      ruangan: selectedRoom,
      lokasi: formattedLocation,
      pekerjaan: pekerjaan.trim(),
      keteranganTeknis: `Kategori: ${kategoriPekerjaan}`,
      statusPekerjaan: statusPekerjaan,
      petugas: teknisi.trim() || 'Teknisi Utility',
      timestamp: now.toISOString(),
      tanggal: tanggal,
      jam: jam,
      catatan: keteranganTambahan.trim() || 'Pekerjaan pemeliharaan fasilitas selesai.',
      syncStatus: isOnlineSheetsConfigured ? 'Tersinkron Online' : 'Mengirim...',
    };

    onRecordCreated(newRecord);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setKeteranganTambahan('');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#002855] text-white">
                <Wrench className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Laporan Maintenance Utility Gedung
                </h2>
                <p className="text-xs text-slate-500">
                  Elektrikal, Plumbing, Sipil, Housekeeping, IT, Carpenter & Fasilitas Cinta Charlie / Cinta Papa
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ED1C24] hover:bg-[#c9151c] text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Pekerjaan Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Pekerjaan</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{stats.total}</span>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-700">Status Complete</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-emerald-800 mt-0.5 block">{stats.complete}</span>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-700">In Progress</span>
              <Clock4 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-blue-800 mt-0.5 block">{stats.inProgress}</span>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700">Pending / Finding</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-black text-amber-800 mt-0.5 block">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Location Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setLocationFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  locationFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Lokasi
              </button>
              <button
                type="button"
                onClick={() => setLocationFilter('CINTA CHARLIE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  locationFilter === 'CINTA CHARLIE'
                    ? 'bg-[#002855] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cinta Charlie
              </button>
              <button
                type="button"
                onClick={() => setLocationFilter('CINTA PAPA')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  locationFilter === 'CINTA PAPA'
                    ? 'bg-[#005BAC] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cinta Papa
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-[#002855]"
            >
              <option value="all">Semua Status</option>
              <option value="Complete">Complete (Selesai)</option>
              <option value="InProgress">In Progress</option>
              <option value="Finding">Finding / Pending</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pekerjaan, ruangan, teknisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#002855] focus:bg-white"
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Kategori:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({maintenanceRecords.length})
          </button>
          {WORK_CATEGORIES.map((cat) => {
            const count = maintenanceRecords.filter((r) => (r.kategoriPekerjaan || r.unitKategori) === cat.id).length;
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#002855] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {renderCategoryIcon(cat.id)}
                <span>{cat.label}</span>
                {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Maintenance Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Pekerjaan Maintenance</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Silakan input pekerjaan pemeliharaan peralatan pertama Anda dengan menekan tombol di bawah.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ED1C24] hover:bg-[#c9151c] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Input Pekerjaan Pertama</span>
            </button>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const isComplete = rec.statusPekerjaan?.includes('Complete');
            const isFinding = rec.statusPekerjaan?.includes('FINDING') || rec.statusPekerjaan?.includes('Finding');
            const categoryName = rec.kategoriPekerjaan || rec.unitKategori || 'Utility Gedung';

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info Pekerjaan & Lokasi */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isFinding
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {rec.statusPekerjaan || 'Complete'}
                    </span>

                    {/* Kategori Badge */}
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${getCategoryColor(categoryName)}`}>
                      {renderCategoryIcon(categoryName)}
                      <span>{categoryName}</span>
                    </span>

                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {rec.tanggal}
                    </span>

                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {rec.jam}
                    </span>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#ED1C24]" />
                      {rec.lokasi || `${rec.platform}, ${rec.lantai} ${rec.ruangan}`}
                    </span>
                  </div>

                  {/* Nama Pekerjaan */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {rec.pekerjaan || rec.unitNama || 'Perawatan Peralatan'}
                    </h3>
                  </div>

                  {/* Deskripsi Tindakan & Keterangan */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex-1 text-slate-700">
                      <span className="font-semibold text-slate-500">Tindakan / Keterangan: </span>
                      <span>{rec.catatan || rec.tindakanPerbaikan || 'Pekerjaan selesai dengan baik.'}</span>
                    </div>

                    {rec.petugas && (
                      <div className="flex items-center gap-1 text-slate-500 font-sans text-[11px] ml-auto">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Pelaksana: <strong className="text-slate-800">{rec.petugas}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {/* WhatsApp Share Button */}
                  <button
                    type="button"
                    onClick={() => onOpenWhatsAppShare(rec)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Kirim format laporan ke WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share WA</span>
                  </button>

                  {/* Quick Toggle Status */}
                  <button
                    type="button"
                    onClick={() => onUpdateRecordStatus(rec.id, isComplete ? 'FINDING (Belum Selesai / Open)' : 'Complete')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isComplete
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {isComplete ? 'Set Finding' : 'Set Complete'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL INPUT PEKERJAAN MAINTENANCE BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 text-white p-5 flex items-center justify-between border-b-2 border-[#ED1C24]">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-[#ED1C24] text-white rounded-2xl shadow-md">
                  <Wrench className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-white">Input Pekerjaan Maintenance</h3>
                  <p className="text-xs text-slate-300">Utility Gedung Cinta Charlie & Cinta Papa</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Tanggal & Jam */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam Kerja</label>
                  <input
                    type="time"
                    required
                    value={jam}
                    onChange={(e) => setJam(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Lokasi Penugasan */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#ED1C24]" />
                  <span>Lokasi Penugasan:</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlatformChange('CINTA CHARLIE')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      selectedPlatform === 'CINTA CHARLIE'
                        ? 'bg-[#002855] text-white border-[#002855] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs">CINTA CHARLIE</span>
                    <span className="block text-[10px] opacity-75 font-normal">3 Lantai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlatformChange('CINTA PAPA')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      selectedPlatform === 'CINTA PAPA'
                        ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs">CINTA PAPA</span>
                    <span className="block text-[10px] opacity-75 font-normal">4 Lantai</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Pilih Lantai</label>
                    <select
                      value={selectedFloor}
                      onChange={(e) => handleFloorChange(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      {currentFloors.map((fl) => (
                        <option key={fl.floorNumber} value={fl.floorName}>
                          {fl.floorName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Pilih Ruangan</label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      {currentRooms.map((rm) => (
                        <option key={rm} value={rm}>
                          {rm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Kategori Pekerjaan (Utility Gedung) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                  <span>Kategori Pekerjaan <span className="text-red-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">Utility Gedung</span>
                </label>

                <div className="grid grid-cols-3 gap-1.5">
                  {WORK_CATEGORIES.map((cat) => {
                    const isSelected = kategoriPekerjaan === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setKategoriPekerjaan(cat.id)}
                        className={`p-2 rounded-xl border text-left font-bold transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
                          isSelected
                            ? 'bg-[#002855] text-white border-[#002855] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {renderCategoryIcon(cat.id)}
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Uraian Pekerjaan */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nama Pekerjaan / Uraian Tugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perbaikan instalasi lampu koridor / Perbaikan kran air"
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* Status Pekerjaan & Teknisi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Pekerjaan</label>
                  <select
                    value={statusPekerjaan}
                    onChange={(e) => setStatusPekerjaan(e.target.value as ServiceStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Complete">Complete (Selesai)</option>
                    <option value="In Progress / Running Test">In Progress</option>
                    <option value="FINDING (Belum Selesai / Open)">FINDING (Temuan / Open)</option>
                    <option value="Menunggu Sparepart">Menunggu Sparepart</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Teknisi / Pelaksana</label>
                  <input
                    type="text"
                    list="personnel-maint-suggestions"
                    required
                    placeholder="Pilih atau ketik nama teknisi"
                    value={teknisi}
                    onChange={(e) => setTeknisi(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                  <datalist id="personnel-maint-suggestions">
                    {personnelList.filter((p) => p.isAktif).map((p) => (
                      <option key={p.id} value={p.nama}>{p.jabatan}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Keterangan / Tindakan Perbaikan */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Rincian Pekerjaan / Material yang Digunakan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Penggantian lampu LED 18W, instalasi kabel dan testing normal..."
                  value={keteranganTambahan}
                  onChange={(e) => setKeteranganTambahan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{isOnlineSheetsConfigured ? 'Auto-update Google Sheets aktif' : 'Tersimpan lokal & siap sync'}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#ED1C24] hover:bg-[#c9151c] text-white rounded-xl font-extrabold shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}</span>
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
