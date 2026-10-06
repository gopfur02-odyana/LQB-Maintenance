import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data file path
const DATA_DIR = path.resolve(__dirname, 'data_store');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Default initial state (clean slate: user will input their own equipment)
const DEFAULT_EQUIPMENT: any[] = [];
const DEFAULT_RECORDS: any[] = [];
const DEFAULT_COTP: any[] = [
  {
    id: 'COTP-INIT-01',
    tanggal: new Date().toISOString().split('T')[0],
    cotp1TotalHours: 104,
    cotp1DailyHours: 0,
    cotp2TotalHours: 210,
    cotp2DailyHours: 0,
    timestamp: `${new Date().toISOString().split('T')[0]} 00:00:00`,
  },
];
const DEFAULT_PERSONNEL: any[] = [
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

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        records: parsed.records || DEFAULT_RECORDS,
        equipmentList: parsed.equipmentList || DEFAULT_EQUIPMENT,
        personnelList: parsed.personnelList || DEFAULT_PERSONNEL,
        cotpRecords: parsed.cotpRecords || DEFAULT_COTP,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Error loading DB from file, using defaults:', err);
  }

  // Create initial file
  const initial = {
    records: DEFAULT_RECORDS,
    equipmentList: DEFAULT_EQUIPMENT,
    personnelList: DEFAULT_PERSONNEL,
    cotpRecords: DEFAULT_COTP,
    lastUpdated: new Date().toISOString(),
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: { records: any[]; equipmentList: any[]; personnelList?: any[]; cotpRecords?: any[]; lastUpdated: string }) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB to file:', err);
  }
}

// In-memory state backed by file
let db = loadDatabase();

// Connected clients for real-time updates (Server-Sent Events)
const sseClients = new Set<express.Response>();

function broadcastUpdate() {
  const payload = JSON.stringify({
    type: 'sync',
    records: db.records,
    equipmentList: db.equipmentList,
    personnelList: db.personnelList,
    cotpRecords: db.cotpRecords,
    lastUpdated: db.lastUpdated,
    serverTime: new Date().toISOString(),
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Direct APK File Download Handler (Immediately downloads the .apk file)
  const handleDirectApkDownload = (_req: express.Request, res: express.Response) => {
    const candidatePaths = [
      path.resolve(__dirname, 'public', 'downloads', 'LQB_Maintenance.apk'),
      path.resolve(__dirname, 'public', 'LQB_Maintenance.apk'),
    ];

    for (const apkPath of candidatePaths) {
      if (fs.existsSync(apkPath)) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="LQB_Maintenance.apk"');
        return res.sendFile(apkPath);
      }
    }

    return res.status(404).json({ error: 'File APK tidak ditemukan di server' });
  };

  // Direct APK file endpoints
  app.get([
    '/LQB_Maintenance.apk',
    '/downloads/LQB_Maintenance.apk',
    '/download/LQB_Maintenance.apk',
    '/download/apk',
    '/download',
    '/unduh-apk',
    '/apk',
    '/api/download/apk',
    '/api/download',
    '/download/PHE_OSES_STP_v1.0.apk',
    '/download/lqb-maintenance.apk',
  ], handleDirectApkDownload);

  // SSE Stream for Real-time Multi-User Sync
  app.get('/api/sync/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    const initialPayload = JSON.stringify({
      type: 'initial',
      records: db.records,
      equipmentList: db.equipmentList,
      lastUpdated: db.lastUpdated,
      serverTime: new Date().toISOString(),
    });
    res.write(`data: ${initialPayload}\n\n`);

    sseClients.add(res);

    // Heartbeat ping every 25 seconds to keep SSE connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // API 1: Sync All Records & Equipment & Personnel & COTP (Polling / Initial Fetch)
  app.get('/api/sync', (req, res) => {
    res.json({
      success: true,
      records: db.records,
      equipmentList: db.equipmentList,
      personnelList: db.personnelList || DEFAULT_PERSONNEL,
      cotpRecords: db.cotpRecords || DEFAULT_COTP,
      lastUpdated: db.lastUpdated,
      serverTime: new Date().toISOString(),
    });
  });

  // API 2: Add New Record (Daily STP or Service)
  app.post('/api/records', (req, res) => {
    const newRecord = req.body;
    if (!newRecord || !newRecord.id) {
      return res.status(400).json({ error: 'Data laporan tidak lengkap' });
    }

    // Add to front of array
    db.records = [newRecord, ...db.records.filter((r: any) => r.id !== newRecord.id)];
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      record: newRecord,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 3: Update Record Status
  app.put('/api/records/:id/status', (req, res) => {
    const { id } = req.params;
    const { statusPekerjaan } = req.body;

    const record = db.records.find((r: any) => r.id === id);
    if (!record) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    record.statusPekerjaan = statusPekerjaan;
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      record,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 4: Add New Equipment
  app.post('/api/equipment', (req, res) => {
    const newUnit = req.body;
    if (!newUnit || !newUnit.id || !newUnit.nama) {
      return res.status(400).json({ error: 'Data unit tidak lengkap' });
    }

    db.equipmentList = [...db.equipmentList, newUnit];
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      equipment: newUnit,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 5: Update Existing Equipment
  app.put('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    const updatedUnit = req.body;

    let found = false;
    db.equipmentList = db.equipmentList.map((unit: any) => {
      if (unit.id === id) {
        found = true;
        return { ...unit, ...updatedUnit, id };
      }
      return unit;
    });

    if (!found) {
      return res.status(404).json({ error: 'Peralatan tidak ditemukan' });
    }

    // Also update unitNama on existing records
    db.records = db.records.map((rec: any) => {
      if (rec.unitId === id) {
        return {
          ...rec,
          unitNama: updatedUnit.nama || rec.unitNama,
          unitKategori: updatedUnit.kategori || rec.unitKategori,
          lokasi: updatedUnit.lokasi || rec.lokasi,
        };
      }
      return rec;
    });

    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      equipment: updatedUnit,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 6: Delete Equipment
  app.delete('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    db.equipmentList = db.equipmentList.filter((u: any) => u.id !== id);
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 7: Add New Personnel
  app.post('/api/personnel', (req, res) => {
    const newPerson = req.body;
    if (!newPerson || !newPerson.id || !newPerson.nama) {
      return res.status(400).json({ error: 'Data personil tidak lengkap' });
    }

    if (!db.personnelList) db.personnelList = [...DEFAULT_PERSONNEL];
    db.personnelList = [...db.personnelList, newPerson];
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      personnel: newPerson,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 8: Update Personnel
  app.put('/api/personnel/:id', (req, res) => {
    const { id } = req.params;
    const updatedPerson = req.body;

    if (!db.personnelList) db.personnelList = [...DEFAULT_PERSONNEL];
    let found = false;
    db.personnelList = db.personnelList.map((p: any) => {
      if (p.id === id) {
        found = true;
        return { ...p, ...updatedPerson, id };
      }
      return p;
    });

    if (!found) {
      return res.status(404).json({ error: 'Personil tidak ditemukan' });
    }

    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      personnel: updatedPerson,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 9: Delete Personnel
  app.delete('/api/personnel/:id', (req, res) => {
    const { id } = req.params;
    if (!db.personnelList) db.personnelList = [...DEFAULT_PERSONNEL];
    db.personnelList = db.personnelList.filter((p: any) => p.id !== id);
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 10: Add New COTP Reading
  app.post('/api/cotp', (req, res) => {
    const newCotp = req.body;
    if (!newCotp || !newCotp.id) {
      return res.status(400).json({ error: 'Data COTP tidak lengkap' });
    }

    if (!db.cotpRecords) db.cotpRecords = [...DEFAULT_COTP];
    db.cotpRecords = [newCotp, ...db.cotpRecords.filter((c: any) => c.id !== newCotp.id)];
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      cotp: newCotp,
      lastUpdated: db.lastUpdated,
    });
  });

  // API 11: Delete COTP Reading
  app.delete('/api/cotp/:id', (req, res) => {
    const { id } = req.params;
    if (!db.cotpRecords) db.cotpRecords = [...DEFAULT_COTP];
    db.cotpRecords = db.cotpRecords.filter((c: any) => c.id !== id);
    db.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    broadcastUpdate();

    res.json({
      success: true,
      lastUpdated: db.lastUpdated,
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback to transform and serve index.html for non-API requests
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (!fs.existsSync(indexPath)) {
          return next();
        }
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err: any) {
        vite.ssrFixStacktrace?.(err);
        next(err);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PHE OSES STP & Facility Monitoring Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
