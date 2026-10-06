import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Layers, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Wrench, 
  Tag, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { EquipmentUnit, EquipmentCategory, EquipmentOperationalStatus } from '../types/stp';
import { FACILITY_LOCATIONS } from '../data/locations';

interface MasterEquipmentViewProps {
  equipmentList: EquipmentUnit[];
  onAddEquipment: (unit: EquipmentUnit) => void;
  onUpdateEquipment: (unit: EquipmentUnit) => void;
  onDeleteEquipment: (id: string) => void;
  onCreateMaintenanceForUnit?: (unit: EquipmentUnit) => void;
}

export const MasterEquipmentView: React.FC<MasterEquipmentViewProps> = ({
  equipmentList,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onCreateMaintenanceForUnit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<EquipmentUnit | null>(null);

  // Filters
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [kategori, setKategori] = useState<EquipmentCategory>('HVAC & Pendingin');
  const [platform, setPlatform] = useState<string>('CINTA PAPA');
  const [lantai, setLantai] = useState<string>('Lantai 2');
  const [ruangan, setRuangan] = useState<string>('Room 04 (Kamar 04)');
  const [spesifikasi, setSpesifikasi] = useState('1.5 PK, R410A');
  const [statusOperasional, setStatusOperasional] = useState<EquipmentOperationalStatus>('Normal / Beroperasi');
  const [deskripsi, setDeskripsi] = useState('');

  // Dynamic floors based on selected platform in form
  const currentFacility = FACILITY_LOCATIONS.find((f) => f.name === platform) || FACILITY_LOCATIONS[1];
  const currentFloors = currentFacility.floors;
  const currentFloorObj = currentFloors.find((fl) => fl.floorName === lantai) || currentFloors[0];
  const currentRooms = currentFloorObj ? currentFloorObj.rooms : [];

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform);
    const facility = FACILITY_LOCATIONS.find((f) => f.name === newPlatform) || FACILITY_LOCATIONS[0];
    const firstFloor = facility.floors[0]?.floorName || 'Lantai 1';
    setLantai(firstFloor);
    setRuangan(facility.floors[0]?.rooms[0] || 'Ruangan 1');
  };

  const handleFloorChange = (newFloor: string) => {
    setLantai(newFloor);
    const floorObj = currentFloors.find((fl) => fl.floorName === newFloor);
    if (floorObj && floorObj.rooms.length > 0) {
      setRuangan(floorObj.rooms[0]);
    }
  };

  const openAddModal = () => {
    setEditingUnit(null);
    setNama('');
    setKode('');
    setKategori('HVAC & Pendingin');
    setPlatform('CINTA PAPA');
    setLantai('Lantai 2');
    setRuangan('Room 04 (Kamar 04)');
    setSpesifikasi('1.5 PK');
    setStatusOperasional('Normal / Beroperasi');
    setDeskripsi('');
    setIsModalOpen(true);
  };

  const openEditModal = (unit: EquipmentUnit) => {
    setEditingUnit(unit);
    setNama(unit.nama);
    setKode(unit.kode);
    setKategori(unit.kategori);
    setPlatform(unit.platform || 'CINTA PAPA');
    setLantai(unit.lantai || 'Lantai 1');
    setRuangan(unit.ruangan || 'Ruangan 1');
    setSpesifikasi(unit.spesifikasi || '');
    setStatusOperasional(unit.statusOperasional);
    setDeskripsi(unit.deskripsi || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const formattedLocation = `${platform}, ${lantai} ${ruangan}`;

    if (editingUnit) {
      const updated: EquipmentUnit = {
        ...editingUnit,
        nama: nama.trim(),
        kode: kode.trim() || editingUnit.kode,
        kategori,
        platform,
        lantai,
        ruangan,
        lokasi: formattedLocation,
        spesifikasi: spesifikasi.trim(),
        statusOperasional,
        deskripsi: deskripsi.trim(),
      };
      onUpdateEquipment(updated);
    } else {
      const generatedKode = kode.trim() || `EQ-${Date.now().toString().slice(-4)}`;
      const newUnit: EquipmentUnit = {
        id: `unit-${Date.now()}`,
        kode: generatedKode,
        nama: nama.trim(),
        kategori,
        platform,
        lantai,
        ruangan,
        lokasi: formattedLocation,
        spesifikasi: spesifikasi.trim(),
        statusOperasional,
        deskripsi: deskripsi.trim(),
        frekuensiInspeksi: 'Bulanan',
        isSTP: kategori === 'Water Treatment & Sanitasi',
        createdAt: new Date().toISOString(),
      };
      onAddEquipment(newUnit);
    }

    setIsModalOpen(false);
  };

  // Filtered equipment
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      if (selectedPlatformFilter !== 'all' && item.platform !== selectedPlatformFilter) return false;
      if (selectedCategoryFilter !== 'all' && item.kategori !== selectedCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${item.nama} ${item.kode} ${item.lokasi || ''} ${item.spesifikasi || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [equipmentList, selectedPlatformFilter, selectedCategoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-slate-900 text-white">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Master Data Peralatan & Fasilitas
                </h2>
                <p className="text-xs text-slate-500">
                  Form list lengkap pendaftaran peralatan di Cinta Charlie & Cinta Papa untuk pemeliharaan rutin
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#002855] hover:bg-[#001c3d] text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Peralatan Baru</span>
          </button>
        </div>

        {/* 3 Metric Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Peralatan</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{equipmentList.length} Unit</span>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-blue-700 block">Cinta Charlie (3 Lantai)</span>
            <span className="text-2xl font-black text-blue-900 mt-0.5 block">
              {equipmentList.filter((e) => e.platform === 'CINTA CHARLIE').length} Unit
            </span>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-indigo-700 block">Cinta Papa (4 Lantai)</span>
            <span className="text-2xl font-black text-indigo-900 mt-0.5 block">
              {equipmentList.filter((e) => e.platform === 'CINTA PAPA').length} Unit
            </span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-700 block">Status Normal Operasi</span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
              {equipmentList.filter((e) => e.statusOperasional?.includes('Normal')).length} Unit
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedPlatformFilter}
            onChange={(e) => setSelectedPlatformFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none"
          >
            <option value="all">Semua Lokasi Fasilitas</option>
            <option value="CINTA CHARLIE">CINTA CHARLIE</option>
            <option value="CINTA PAPA">CINTA PAPA</option>
          </select>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="HVAC & Pendingin">HVAC & Pendingin</option>
            <option value="Water Treatment & Sanitasi">Water Treatment & Sanitasi</option>
            <option value="Kitchen & Dapur Komersial">Kitchen & Dapur</option>
            <option value="Laundry & Dryer">Laundry & Dryer</option>
            <option value="Electrical & Genset">Electrical & Genset</option>
            <option value="Peralatan Umum">Peralatan Umum</option>
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kode, ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#002855] focus:bg-white"
          />
        </div>
      </div>

      {/* Equipment List */}
      <div className="space-y-3">
        {filteredEquipment.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Peralatan Terdaftar</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Daftar peralatan saat ini bersih. Silakan tambahkan peralatan Anda sendiri (AC, pompa, fasilitas dll) per ruangan.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#002855] hover:bg-[#001c3d] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Peralatan Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredEquipment.map((unit) => {
              return (
                <div
                  key={unit.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {unit.kode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {unit.statusOperasional}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {unit.nama}
                    </h4>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-[#ED1C24]" />
                        <span>{unit.platform}: {unit.lantai} - {unit.ruangan}</span>
                      </div>
                      {unit.spesifikasi && (
                        <div className="text-slate-500 pl-5 text-[11px]">
                          Spesifikasi: <strong className="text-slate-700">{unit.spesifikasi}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      {unit.kategori}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onCreateMaintenanceForUnit && (
                        <button
                          type="button"
                          onClick={() => onCreateMaintenanceForUnit(unit)}
                          className="px-2.5 py-1.5 bg-[#ED1C24] hover:bg-[#c9151c] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Buat Pekerjaan Servis untuk Unit Ini"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>+ Servis</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(unit)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit Peralatan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteEquipment(unit.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Hapus Peralatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Peralatan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#002855] border border-white/20 rounded-xl text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">
                    {editingUnit ? 'Edit Data Peralatan' : 'Tambah Peralatan Fasilitas Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-300">Form Lengkap Pendaftaran Peralatan Lokasi Kerja</p>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nama Peralatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AC Split 1.5 PK Daikin"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode / Tag Unit</label>
                  <input
                    type="text"
                    placeholder="Contoh: AC-CP-204"
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Peralatan</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as EquipmentCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="HVAC & Pendingin">HVAC & Pendingin</option>
                    <option value="Water Treatment & Sanitasi">Water Treatment & Sanitasi</option>
                    <option value="Kitchen & Dapur Komersial">Kitchen & Dapur</option>
                    <option value="Laundry & Dryer">Laundry & Dryer</option>
                    <option value="Electrical & Genset">Electrical & Genset</option>
                    <option value="Peralatan Umum">Peralatan Umum</option>
                  </select>
                </div>
              </div>

              {/* Lokasi Platform, Lantai, Ruangan */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#ED1C24]" />
                  <span>Lokasi Penempatan Peralatan:</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlatformChange('CINTA CHARLIE')}
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer ${
                      platform === 'CINTA CHARLIE'
                        ? 'bg-[#002855] text-white border-[#002855]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>CINTA CHARLIE</div>
                    <span className="text-[10px] font-normal opacity-80 block">3 Lantai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlatformChange('CINTA PAPA')}
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs cursor-pointer ${
                      platform === 'CINTA PAPA'
                        ? 'bg-[#005BAC] text-white border-[#005BAC]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>CINTA PAPA</div>
                    <span className="text-[10px] font-normal opacity-80 block">4 Lantai</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Lantai</label>
                    <select
                      value={lantai}
                      onChange={(e) => handleFloorChange(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold"
                    >
                      {currentFloors.map((fl) => (
                        <option key={fl.floorNumber} value={fl.floorName}>
                          {fl.floorName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Ruangan</label>
                    <select
                      value={ruangan}
                      onChange={(e) => setRuangan(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold"
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

              {/* Spesifikasi Teknis */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Spesifikasi Teknis
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1.5 PK, Freon R32, 220V 1 Phase"
                  value={spesifikasi}
                  onChange={(e) => setSpesifikasi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Status Operasional */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Status Operasional Saat Ini
                </label>
                <select
                  value={statusOperasional}
                  onChange={(e) => setStatusOperasional(e.target.value as EquipmentOperationalStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Normal / Beroperasi">Normal / Beroperasi</option>
                  <option value="Standby / Siaga">Standby / Siaga</option>
                  <option value="Perlu Perbaikan (Minor)">Perlu Perbaikan (Minor)</option>
                  <option value="Dalam Perbaikan (Breakdown)">Dalam Perbaikan (Breakdown)</option>
                  <option value="Temuan / Finding">Temuan / Finding</option>
                </select>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002855] hover:bg-[#001c3d] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUnit ? 'Simpan Perubahan' : 'Daftarkan Peralatan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
