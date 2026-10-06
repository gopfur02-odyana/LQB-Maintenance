import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { MaintenanceView } from './components/MaintenanceView';
import { STPReadingView } from './components/STPReadingView';
import { COTPReadingView } from './components/COTPReadingView';
import { MasterEquipmentView } from './components/MasterEquipmentView';
import { SettingsView } from './components/SettingsView';
import { DatabaseLogViewer } from './components/DatabaseLogViewer';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { INITIAL_RECORDS, INITIAL_EQUIPMENT } from './data/initialData';
import { STPRecord, EquipmentUnit, ServiceStatus, Personnel, DEFAULT_PERSONNEL, COTPRecord, DEFAULT_COTP_RECORDS } from './types/stp';

const STORAGE_KEY_RECORDS = 'lqb_maintenance_records_v2';
const STORAGE_KEY_EQUIPMENT = 'lqb_maintenance_equipment_v2';
const STORAGE_KEY_PERSONNEL = 'lqb_maintenance_personnel_v2';
const STORAGE_KEY_COTP = 'lqb_cotp_records_v1';
const STORAGE_KEY_SHEETS_WEBHOOK = 'phe_oses_google_sheets_webhook_url';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('maintenance');

  // Load records from localStorage or initial empty
  const [records, setRecords] = useState<STPRecord[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_RECORDS;
  });

  // Load equipment list from localStorage or initial empty
  const [equipmentList, setEquipmentList] = useState<EquipmentUnit[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EQUIPMENT;
  });

  // Load personnel list from localStorage or default
  const [personnelList, setPersonnelList] = useState<Personnel[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_PERSONNEL);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PERSONNEL;
  });

  // Load COTP records from localStorage or default
  const [cotpRecords, setCotpRecords] = useState<COTPRecord[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_COTP);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_COTP_RECORDS;
  });

  // Webhook URL state
  const [sheetsWebhookUrl, setSheetsWebhookUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SHEETS_WEBHOOK) || '';
  });

  // WhatsApp share modal state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedShareRecord, setSelectedShareRecord] = useState<STPRecord | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const lastUpdatedRef = useRef<string>('');

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => {
      setSyncToast((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  // Sync with server database
  const fetchSyncData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.records && Array.isArray(data.records)) {
          setRecords(data.records);
          try {
            localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(data.records));
          } catch {}
        }
        if (data.equipmentList && Array.isArray(data.equipmentList)) {
          setEquipmentList(data.equipmentList);
          try {
            localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(data.equipmentList));
          } catch {}
        }
        if (data.personnelList && Array.isArray(data.personnelList)) {
          setPersonnelList(data.personnelList);
          try {
            localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(data.personnelList));
          } catch {}
        }
        if (data.cotpRecords && Array.isArray(data.cotpRecords)) {
          setCotpRecords(data.cotpRecords);
          try {
            localStorage.setItem(STORAGE_KEY_COTP, JSON.stringify(data.cotpRecords));
          } catch {}
        }
        if (data.lastUpdated) {
          lastUpdatedRef.current = data.lastUpdated;
        }
        if (!isSilent) {
          showToast('Data berhasil diperbarui');
        }
      }
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      if (!isSilent) {
        setTimeout(() => setIsSyncing(false), 400);
      }
    }
  }, []);

  // Multi-user SSE connection
  useEffect(() => {
    fetchSyncData(true);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.records && data.equipmentList) {
            setRecords(data.records);
            setEquipmentList(data.equipmentList);
            try {
              localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(data.records));
              localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(data.equipmentList));
            } catch {}
          }
          if (data.personnelList && Array.isArray(data.personnelList)) {
            setPersonnelList(data.personnelList);
            try {
              localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(data.personnelList));
            } catch {}
          }
          if (data.cotpRecords && Array.isArray(data.cotpRecords)) {
            setCotpRecords(data.cotpRecords);
            try {
              localStorage.setItem(STORAGE_KEY_COTP, JSON.stringify(data.cotpRecords));
            } catch {}
          }
        } catch {}
      };
    } catch {}

    const pollInterval = setInterval(() => {
      fetchSyncData(true);
    }, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [fetchSyncData]);

  // Push new record & auto-forward to Google Sheets
  const handleRecordCreated = async (newRecord: STPRecord) => {
    setRecords((prev) => [newRecord, ...prev]);

    // Push directly to Google Sheets Online if configured
    const webhook = sheetsWebhookUrl.trim();
    if (webhook && webhook.startsWith('http')) {
      const isSTP = newRecord.logType === 'daily_stp';
      const payload = isSTP
        ? {
            action: 'add_record',
            type: 'stp',
            id: newRecord.id,
            tanggal: newRecord.tanggal,
            jam: newRecord.jam,
            shift: newRecord.shift || 'Shift 1',
            flowInlet: newRecord.flowMeterInflow || 0,
            flowOutlet: newRecord.flowMeterEffluent || 0,
            debitHarian: newRecord.debitHarian || 0,
            phAerasi: newRecord.phAerasi || 0,
            phEffluent: newRecord.phEffluent || 0,
            petugas: newRecord.petugas || 'Operator STP',
            catatan: newRecord.catatan || '-',
          }
        : {
            action: 'add_record',
            type: 'maintenance',
            id: newRecord.id,
            tanggal: newRecord.tanggal,
            jam: newRecord.jam,
            lokasi: newRecord.lokasi || `${newRecord.platform || ''}, ${newRecord.lantai || ''} ${newRecord.ruangan || ''}`,
            kategori: newRecord.kategoriPekerjaan || newRecord.unitKategori || 'Utility Gedung',
            pekerjaan: newRecord.pekerjaan || newRecord.unitNama || 'Perawatan',
            status: newRecord.statusPekerjaan || 'Complete',
            petugas: newRecord.petugas || 'Teknisi Utility',
            keterangan: newRecord.catatan || newRecord.keteranganTeknis || '-',
          };

      fetch(webhook, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      }).catch((err) => console.warn('Sheets push warning:', err));
    }

    // Persist to server
    try {
      setIsSyncing(true);
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      showToast('✅ Laporan tersimpan & terkirim ke Google Sheets');
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Save COTP Record
  const handleSaveCOTPRecord = async (newCotp: COTPRecord) => {
    const updated = [newCotp, ...cotpRecords.filter((c) => c.id !== newCotp.id)];
    setCotpRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY_COTP, JSON.stringify(updated));
    } catch {}

    // Auto-forward to Google Sheets
    const webhook = sheetsWebhookUrl.trim();
    if (webhook && webhook.startsWith('http')) {
      const payload = {
        action: 'add_record',
        type: 'cotp',
        id: newCotp.id,
        tanggal: newCotp.tanggal,
        cotp1TotalHours: newCotp.cotp1TotalHours,
        cotp1DailyHours: newCotp.cotp1DailyHours,
        cotp2TotalHours: newCotp.cotp2TotalHours,
        cotp2DailyHours: newCotp.cotp2DailyHours,
      };

      fetch(webhook, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      }).catch((err) => console.warn('Sheets push warning (COTP):', err));
    }

    // Persist to server
    try {
      setIsSyncing(true);
      await fetch('/api/cotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCotp),
      });
      showToast('✅ Reading COTP berhasil disimpan');
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Delete COTP Record
  const handleDeleteCOTPRecord = async (id: string) => {
    const updated = cotpRecords.filter((c) => c.id !== id);
    setCotpRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY_COTP, JSON.stringify(updated));
    } catch {}
    try {
      setIsSyncing(true);
      await fetch(`/api/cotp/${id}`, { method: 'DELETE' });
      showToast('Data COTP berhasil dihapus');
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Add Equipment
  const handleAddEquipment = async (newUnit: EquipmentUnit) => {
    setEquipmentList((prev) => [...prev, newUnit]);
    try {
      setIsSyncing(true);
      await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit),
      });
      showToast(`✅ Unit "${newUnit.nama}" berhasil didaftarkan`);
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Update Equipment
  const handleUpdateEquipment = async (updatedUnit: EquipmentUnit) => {
    setEquipmentList((prev) =>
      prev.map((item) => (item.id === updatedUnit.id ? updatedUnit : item))
    );
    try {
      setIsSyncing(true);
      await fetch(`/api/equipment/${updatedUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUnit),
      });
      showToast(`✅ Perubahan "${updatedUnit.nama}" berhasil disimpan`);
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Delete Equipment
  const handleDeleteEquipment = async (unitId: string) => {
    setEquipmentList((prev) => prev.filter((item) => item.id !== unitId));
    try {
      setIsSyncing(true);
      await fetch(`/api/equipment/${unitId}`, { method: 'DELETE' });
      showToast('Peralatan berhasil dihapus');
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Add Personnel
  const handleAddPersonnel = async (newPerson: Personnel) => {
    const updated = [...personnelList, newPerson];
    setPersonnelList(updated);
    try {
      localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(updated));
    } catch {}
    try {
      setIsSyncing(true);
      await fetch('/api/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerson),
      });
      showToast(`✅ Personil "${newPerson.nama}" berhasil didaftarkan`);
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Update Personnel
  const handleUpdatePersonnel = async (updatedPerson: Personnel) => {
    const updatedList = personnelList.map((p) => (p.id === updatedPerson.id ? updatedPerson : p));
    setPersonnelList(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(updatedList));
    } catch {}
    try {
      setIsSyncing(true);
      await fetch(`/api/personnel/${updatedPerson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPerson),
      });
      showToast(`✅ Data personil "${updatedPerson.nama}" disimpan`);
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Delete Personnel
  const handleDeletePersonnel = async (personId: string) => {
    const updatedList = personnelList.filter((p) => p.id !== personId);
    setPersonnelList(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY_PERSONNEL, JSON.stringify(updatedList));
    } catch {}
    try {
      setIsSyncing(true);
      await fetch(`/api/personnel/${personId}`, { method: 'DELETE' });
      showToast('Personil berhasil dihapus');
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Update Record Status
  const handleUpdateRecordStatus = async (recordId: string, newStatus: ServiceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, statusPekerjaan: newStatus } : r))
    );
    try {
      setIsSyncing(true);
      await fetch(`/api/records/${recordId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusPekerjaan: newStatus }),
      });
      showToast('Status pekerjaan diperbarui');
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  // Open WhatsApp share
  const handleOpenWhatsAppShare = (record?: STPRecord) => {
    setSelectedShareRecord(record || (records.length > 0 ? records[0] : null));
    setIsWhatsAppModalOpen(true);
  };

  const maintenanceCount = records.filter((r) => r.logType === 'service_all' || !!r.pekerjaan).length;
  const stpCount = records.filter((r) => r.logType === 'daily_stp' || (!r.pekerjaan && r.flowMeterEffluent !== undefined)).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Professional Navbar (Non-floating) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        maintenanceCount={maintenanceCount}
        stpCount={stpCount}
        cotpCount={cotpRecords.length}
        equipmentCount={equipmentList.length}
        isOnlineSheetsConfigured={Boolean(sheetsWebhookUrl)}
        onOpenWhatsAppShare={() => handleOpenWhatsAppShare()}
        onManualSync={() => fetchSyncData(false)}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'maintenance' && (
          <MaintenanceView
            records={records}
            equipmentList={equipmentList}
            personnelList={personnelList}
            onRecordCreated={handleRecordCreated}
            onUpdateRecordStatus={handleUpdateRecordStatus}
            onOpenWhatsAppShare={handleOpenWhatsAppShare}
            isOnlineSheetsConfigured={Boolean(sheetsWebhookUrl)}
          />
        )}

        {activeTab === 'stp' && (
          <STPReadingView
            records={records}
            personnelList={personnelList}
            onRecordCreated={handleRecordCreated}
            onOpenWhatsAppShare={handleOpenWhatsAppShare}
            isOnlineSheetsConfigured={Boolean(sheetsWebhookUrl)}
          />
        )}

        {activeTab === 'cotp' && (
          <COTPReadingView
            cotpRecords={cotpRecords}
            allRecords={records}
            personnelList={personnelList}
            onSaveCOTPRecord={handleSaveCOTPRecord}
            onDeleteCOTPRecord={handleDeleteCOTPRecord}
            isOnlineSheetsConfigured={Boolean(sheetsWebhookUrl)}
          />
        )}

        {activeTab === 'equipment' && (
          <MasterEquipmentView
            equipmentList={equipmentList}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onCreateMaintenanceForUnit={() => setActiveTab('maintenance')}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseLogViewer
            records={records}
            equipmentList={equipmentList}
            onUpdateRecordStatus={handleUpdateRecordStatus}
            onOpenWhatsAppShare={handleOpenWhatsAppShare}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            records={records}
            equipmentList={equipmentList}
            personnelList={personnelList}
            cotpRecords={cotpRecords}
            onAddEquipment={handleAddEquipment}
            onAddPersonnel={handleAddPersonnel}
            onUpdatePersonnel={handleUpdatePersonnel}
            onDeletePersonnel={handleDeletePersonnel}
            sheetsWebhookUrl={sheetsWebhookUrl}
            onSaveSheetsWebhookUrl={(url) => {
              setSheetsWebhookUrl(url);
              localStorage.setItem(STORAGE_KEY_SHEETS_WEBHOOK, url);
            }}
          />
        )}
      </main>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setSelectedShareRecord(null);
        }}
        record={selectedShareRecord}
        allRecords={records}
        equipmentList={equipmentList}
        cotpRecords={cotpRecords}
      />

      {/* Floating Status Toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-fadeIn">
            <span>{syncToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

