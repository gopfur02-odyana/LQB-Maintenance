import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Wrench, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Activity,
  AlertTriangle,
  Building2,
  Layers,
  DoorOpen
} from 'lucide-react';
import { EquipmentUnit, EquipmentCategory, EquipmentFrequency, EquipmentOperationalStatus } from '../types/stp';
import { FACILITY_LOCATIONS } from '../data/locations';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: EquipmentUnit[];
  onAddEquipment: (newUnit: EquipmentUnit) => void;
  onUpdateEquipment: (updatedUnit: EquipmentUnit) => void;
  onDeleteEquipment?: (unitId: string) => void;
  initialUnitToEdit?: EquipmentUnit | null;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  initialUnitToEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'daftar' | 'form'>('daftar');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // Form State
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [kategori, setKategori] = useState<EquipmentCategory>('HVAC & Pendingin');
  const [platform, setPlatform] = useState<string>('CINTA PAPA');
  const [lantai, setLantai] = useState<string>('Lantai 2');
  const [ruangan, setRuangan] = useState<string>('Room 04');
  const [customRuangan, setCustomRuangan] = useState<string>('');
  const [isCustomRuangan, setIsCustomRuangan] = useState<boolean>(false);
  const [spesifikasi, setSpesifikasi] = useState<string>('1.5 PK');
  const [frekuensi, setFrekuensi] = useState<EquipmentFrequency>('Bulanan');
  const [statusAlat, setStatusAlat] = useState<EquipmentOperationalStatus>('Normal / Beroperasi');
  const [deskripsi, setDeskripsi] = useState('');

  // Filter list by platform
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');

  // Compute available floors based on chosen platform
  const currentFacility = FACILITY_LOCATIONS.find((f) => f.name === platform) || FACILITY_LOCATIONS[1];
  const availableFloors = currentFacility.floors;

  // Compute available rooms based on chosen floor
  const currentFloor = availableFloors.find((f) => f.floorName === lantai) || availableFloors[0];
  const availableRooms = currentFloor ? currentFloor.rooms : [];

  // When platform changes, reset lantai to first available floor and first room
  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform);
    const facility = FACILITY_LOCATIONS.find((f) => f.name === newPlatform) || FACILITY_LOCATIONS[0];
    const firstFloor = facility.floors[0];
    setLantai(firstFloor.floorName);
    setRuangan(firstFloor.rooms[0] || '');
    setIsCustomRuangan(false);
  };

  // When floor changes, reset room
  const handleFloorChange = (newFloor: string) => {
    setLantai(newFloor);
    const floorObj = availableFloors.find((f) => f.floorName === newFloor);
    if (floorObj && floorObj.rooms.length > 0) {
      setRuangan(floorObj.rooms[0]);
      setIsCustomRuangan(false);
    }
  };

  // Sync when modal opens or initialUnitToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (initialUnitToEdit) {
        setEditingUnitId(initialUnitToEdit.id);
        setNama(initialUnitToEdit.nama);
        setKode(initialUnitToEdit.kode);
        setKategori(initialUnitToEdit.kategori);
        setPlatform(initialUnitToEdit.platform || 'CINTA PAPA');
        setLantai(initialUnitToEdit.lantai || 'Lantai 2');
        setRuangan(initialUnitToEdit.ruangan || 'Room 04');
        setSpesifikasi(initialUnitToEdit.spesifikasi || '');
        setFrekuensi(initialUnitToEdit.frekuensiInspeksi || 'Bulanan');
        setStatusAlat(initialUnitToEdit.statusOperasional || 'Normal / Beroperasi');
        setDeskripsi(initialUnitToEdit.deskripsi);
        setActiveTab('form');
      } else {
        setEditingUnitId(null);
        if (equipmentList.length === 0) {
          setActiveTab('form'); // Auto-open form if no equipment exists yet
        } else {
          setActiveTab('daftar');
        }
      }
    }
  }, [isOpen, initialUnitToEdit, equipmentList.length]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingUnitId(null);
    setNama('');
    setKode('');
    setKategori('HVAC & Pendingin');
    setPlatform('CINTA PAPA');
    setLantai('Lantai 2');
    setRuangan('Room 04');
    setCustomRuangan('');
    setIsCustomRuangan(false);
    setSpesifikasi('1.5 PK');
    setFrekuensi('Bulanan');
    setStatusAlat('Normal / Beroperasi');
    setDeskripsi('');
    setActiveTab('form');
  };

  const handleStartEdit = (unit: EquipmentUnit) => {
    setEditingUnitId(unit.id);
    setNama(unit.nama);
    setKode(unit.kode);
    setKategori(unit.kategori);
    setPlatform(unit.platform || 'CINTA PAPA');
    setLantai(unit.lantai || 'Lantai 2');
    setRuangan(unit.ruangan || 'Room 04');
    setSpesifikasi(unit.spesifikasi || '');
    setFrekuensi(unit.frekuensiInspeksi);
    setStatusAlat(unit.statusOperasional || 'Normal / Beroperasi');
    setDeskripsi(unit.deskripsi);
    setActiveTab('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const finalRuangan = isCustomRuangan && customRuangan.trim() ? customRuangan.trim() : ruangan;
    const finalLokasi = `${platform}, ${lantai} ${finalRuangan}`.trim();

    if (editingUnitId) {
      // Update existing
      const existing = equipmentList.find((u) => u.id === editingUnitId);
      const updatedUnit: EquipmentUnit = {
        id: editingUnitId,
        kode: kode.trim() || (existing ? existing.kode : `EQ-${platform === 'CINTA CHARLIE' ? 'CC' : 'CP'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`),
        nama: nama.trim(),
        kategori,
        lokasi: finalLokasi,
        platform,
        lantai,
        ruangan: finalRuangan,
        spesifikasi: spesifikasi.trim(),
        frekuensiInspeksi: frekuensi,
        statusOperasional: statusAlat,
        deskripsi: deskripsi.trim() || `Unit operasional di ${finalLokasi}.`,
        isSTP: existing ? existing.isSTP : nama.toLowerCase().includes('stp'),
        createdAt: existing ? existing.createdAt : new Date().toISOString().split('T')[0],
      };

      onUpdateEquipment(updatedUnit);
    } else {
      // Add new
      const newUnit: EquipmentUnit = {
        id: 'eq_' + Math.random().toString(36).substring(2, 8),
        kode: kode.trim() || `EQ-${platform === 'CINTA CHARLIE' ? 'CC' : 'CP'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        nama: nama.trim(),
        kategori,
        lokasi: finalLokasi,
        platform,
        lantai,
        ruangan: finalRuangan,
        spesifikasi: spesifikasi.trim(),
        frekuensiInspeksi: frekuensi,
        statusOperasional: statusAlat,
        deskripsi: deskripsi.trim() || `Unit operasional di ${finalLokasi}.`,
        isSTP: nama.toLowerCase().includes('stp'),
        createdAt: new Date().toISOString().split('T')[0],
      };

      onAddEquipment(newUnit);
    }

    // Reset Form
    setEditingUnitId(null);
    setNama('');
    setKode('');
    setDeskripsi('');
    setActiveTab('daftar');
  };

  const filteredEquipment = equipmentList.filter((unit) => {
    if (filterPlatform === 'ALL') return true;
    return unit.platform === filterPlatform || unit.lokasi?.includes(filterPlatform);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Pertamina Accent Bar: Merah - Biru - Oranye */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="flex-1 bg-[#ED1C24]"></div>
          <div className="flex-1 bg-[#005BAC]"></div>
          <div className="flex-1 bg-[#FF6F00]"></div>
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-[#002855] to-slate-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#005BAC] rounded-xl text-white shadow-md border border-white/20">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Form & Daftar Peralatan Fasilitas</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#ED1C24] text-white">
                  PHE OSES
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Lokasi CINTA CHARLIE (Lantai 1-3) &amp; CINTA PAPA (Lantai 1-4)
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

        {/* Tab Selector */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'daftar'
                ? 'border-[#005BAC] text-[#005BAC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar Peralatan Terdaftar ({equipmentList.length})
          </button>
          <button
            onClick={handleStartAdd}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'form' && !editingUnitId
                ? 'border-[#005BAC] text-[#005BAC]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#FF6F00]" />
            <span>+ Form Tambah Peralatan Baru</span>
          </button>
          {editingUnitId && activeTab === 'form' && (
            <span className="pb-3 border-b-2 border-[#FF6F00] text-[#FF6F00] flex items-center gap-1 font-bold">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit: {nama || 'Peralatan'}</span>
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'daftar' ? (
            <div className="space-y-4">
              {/* Filter Platform */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold text-xs">Lokasi Platform:</span>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setFilterPlatform('ALL')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        filterPlatform === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Semua ({equipmentList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPlatform('CINTA CHARLIE')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        filterPlatform === 'CINTA CHARLIE' ? 'bg-[#005BAC] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Cinta Charlie
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPlatform('CINTA PAPA')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        filterPlatform === 'CINTA PAPA' ? 'bg-[#ED1C24] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Cinta Papa
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleStartAdd}
                  className="px-3.5 py-1.5 bg-[#005BAC] hover:bg-[#004a8e] text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FF6F00]" />
                  <span>+ Tambah Alat Baru</span>
                </button>
              </div>

              {/* Equipment Grid or Clean Empty State */}
              {filteredEquipment.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#005BAC] flex items-center justify-center mx-auto shadow-xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">
                      Belum Ada Peralatan Terdaftar
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                      Daftar peralatan contoh telah dikosongkan. Silakan input peralatan fasilitas Anda untuk lokasi <strong>CINTA CHARLIE</strong> (Lantai 1-3) dan <strong>CINTA PAPA</strong> (Lantai 1-4).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="px-5 py-2.5 bg-[#005BAC] hover:bg-[#004a8e] text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2 border-b-2 border-[#FF6F00]"
                  >
                    <Plus className="w-4 h-4 text-[#FF6F00]" />
                    <span>Mulai Input Peralatan Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredEquipment.map((unit) => (
                    <div
                      key={unit.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-blue-400 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {unit.kode}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                unit.statusOperasional?.includes('Breakdown')
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : unit.statusOperasional?.includes('Perlu Perbaikan')
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {unit.statusOperasional || 'Normal'}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {unit.frekuensiInspeksi || 'Bulanan'}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm mt-1.5 flex items-center gap-1.5">
                          <span>{unit.nama}</span>
                          {unit.spesifikasi && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                              {unit.spesifikasi}
                            </span>
                          )}
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                          {unit.deskripsi}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-[#ED1C24] shrink-0" />
                          <span className="truncate font-semibold text-slate-800">{unit.lokasi}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(unit)}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                            title="Edit rincian peralatan ini"
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          {onDeleteEquipment && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus unit "${unit.nama}"?`)) {
                                  onDeleteEquipment(unit.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Hapus unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* FORM INPUT / EDIT PERALATAN LENGKAP */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-700 leading-relaxed text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#005BAC] block">
                    {editingUnitId ? 'Mode Edit Peralatan' : 'Form List Lengkap Penambahan Peralatan'}
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    Silakan tentukan Lokasi Platform, Lantai, Ruangan, Nama Alat, dan Jadwal Pekerjaan.
                  </span>
                </div>
                {editingUnitId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    ID: {editingUnitId}
                  </span>
                )}
              </div>

              {/* SECTION 1: LOKASI FASILITAS (CINTA CHARLIE / CINTA PAPA) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs pb-1 border-b border-slate-200">
                  <Building2 className="w-4 h-4 text-[#ED1C24]" />
                  <span>Struktur Lokasi Fasilitas Offshore PHE OSES</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Platform Selection */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      1. Platform / Lokasi *
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => handlePlatformChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                    >
                      <option value="CINTA PAPA">🏢 CINTA PAPA (4 Lantai)</option>
                      <option value="CINTA CHARLIE">🏢 CINTA CHARLIE (3 Lantai)</option>
                    </select>
                  </div>

                  {/* Floor Selection */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      2. Lantai *
                    </label>
                    <select
                      value={lantai}
                      onChange={(e) => handleFloorChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                    >
                      {availableFloors.map((fl) => (
                        <option key={fl.floorNumber} value={fl.floorName}>
                          {fl.floorName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Selection */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      3. Ruangan / Kamar *
                    </label>
                    {!isCustomRuangan ? (
                      <select
                        value={ruangan}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomRuangan(true);
                          } else {
                            setRuangan(e.target.value);
                          }
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                      >
                        {availableRooms.map((rm) => (
                          <option key={rm} value={rm}>
                            {rm}
                          </option>
                        ))}
                        <option value="__custom__">+ Tulis Ruangan Lain...</option>
                      </select>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nama ruangan..."
                          value={customRuangan}
                          onChange={(e) => setCustomRuangan(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCustomRuangan(false)}
                          className="p-2 bg-slate-200 rounded-xl text-slate-600 text-xs"
                          title="Pilih dari daftar"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#ED1C24]" />
                  <span>Preview Lokasi Terpilih:</span>
                  <strong className="text-slate-900 font-bold">
                    {platform}, {lantai} {isCustomRuangan && customRuangan ? customRuangan : ruangan}
                  </strong>
                </div>
              </div>

              {/* SECTION 2: IDENTITAS PERALATAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Nama Alat / Mesin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AC Split 1.5 PK, Exhaust Fan, Chiller, Dryer..."
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['AC Split 1.5 PK', 'AC Split 2 PK', 'Chiller Sayur', 'Commercial Dryer', 'Electric Stove'].map((chip) => (
                      <button
                        type="button"
                        key={chip}
                        onClick={() => setNama(chip)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Spesifikasi / Kapasitas (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1.5 PK, R410A, 50 Kg, 3 Phase..."
                    value={spesifikasi}
                    onChange={(e) => setSpesifikasi(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Kode Register / Tag Unit (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: EQ-CP-AC-04, EQ-CC-01..."
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Kategori Fasilitas *
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                  >
                    <option value="HVAC & Pendingin">HVAC &amp; AC Split (AC, Chiller, Cold Room)</option>
                    <option value="Kitchen & Dapur Komersial">Kitchen &amp; Dapur Komersial (Stove, Hood, Oven)</option>
                    <option value="Laundry & Dryer">Laundry &amp; Dryer (Dryer, Washer)</option>
                    <option value="Water Treatment & Sanitasi">Water Treatment &amp; Sanitasi (STP, WTP, Pompa)</option>
                    <option value="Electrical & Genset">Electrical &amp; Genset</option>
                    <option value="Peralatan Umum">Peralatan Umum / Fasilitas Gedung</option>
                  </select>
                </div>
              </div>

              {/* SECTION 3: JADWAL & STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Pilihan Jadwal / Frekuensi Pekerjaan *
                  </label>
                  <select
                    value={frekuensi}
                    onChange={(e) => setFrekuensi(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                  >
                    <option value="Harian">📅 Harian (Daily Routine)</option>
                    <option value="Mingguan">📅 Mingguan (Weekly Checklist)</option>
                    <option value="Bulanan">📅 Bulanan (Monthly PM)</option>
                    <option value="Per 3 Bulan">📅 Per 3 Bulan (Triwulan)</option>
                    <option value="Per 6 Bulan">📅 Per 6 Bulan (Semester)</option>
                    <option value="1 Tahun">📅 1 Tahun (Tahunan / Overhaul)</option>
                    <option value="Berkala / Saat Servis">📅 Berkala / Saat Ada Servis</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Status Operasional Unit *
                  </label>
                  <select
                    value={statusAlat}
                    onChange={(e) => setStatusAlat(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                  >
                    <option value="Normal / Beroperasi">🟢 Normal / Beroperasi</option>
                    <option value="Standby / Siaga">🟡 Standby / Siaga</option>
                    <option value="Perlu Perbaikan (Minor)">🟠 Perlu Perbaikan (Minor)</option>
                    <option value="Dalam Perbaikan (Breakdown)">🔴 Dalam Perbaikan (Breakdown)</option>
                    <option value="Temuan / Finding">⚠️ Temuan / Finding (Perlu Tindak Lanjut)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Deskripsi / Hal yang Diperiksa (Pressure, Ampere, Suhu, dll)
                </label>
                <textarea
                  rows={2}
                  placeholder="Standar parameter: Pressure psi, Ampere beban kompresor, Suhu evaporator, kebersihan filter..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#005BAC]/20 text-xs"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUnitId(null);
                    setActiveTab('daftar');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#005BAC] hover:bg-[#00488a] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 border-b-2 border-[#FF6F00]"
                >
                  <Save className="w-4 h-4 text-[#FF6F00]" />
                  <span>{editingUnitId ? 'Simpan Perubahan Unit' : 'Simpan & Daftarkan Peralatan'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
