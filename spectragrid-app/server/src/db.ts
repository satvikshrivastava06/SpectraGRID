import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, 'data', 'db.json');
const MAX_TELEMETRY_LOG = 500;

export interface DBStructure {
    users: any[];
    organizations: any[];
    campuses: any[];
    buildings: any[];
    rooftops: any[];
    arrays: any[];
    strings: any[];
    panels: any[];
    inverters: any[];
    batteries: any[];
    telemetry: any;
    telemetryLog: any[];
    alerts: any[];
    recommendations: any[];
    auditLogs: any[];
    activeContext?: any;
}

let cachedDb: DBStructure | null = null;

export function getDb(): DBStructure {
    if (cachedDb) return cachedDb;
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        cachedDb = JSON.parse(raw);
        if (!cachedDb!.telemetryLog) {
            cachedDb!.telemetryLog = [];
        }
        return cachedDb!;
    } catch (err) {
        console.error('Error reading JSON DB, using empty baseline', err);
        cachedDb = {
            users: [], organizations: [], campuses: [], buildings: [], rooftops: [],
            arrays: [], strings: [], panels: [], inverters: [], batteries: [],
            telemetry: {}, telemetryLog: [], alerts: [], recommendations: [], auditLogs: []
        };
        return cachedDb;
    }
}

export function saveDb(data: DBStructure): void {
    cachedDb = data;
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error saving JSON DB', err);
    }
}

// ─── Users ───────────────────────────────────────────────────────────────
export async function findUserByUsername(username: string): Promise<any | null> {
    const db = getDb();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function createUser(user: { id: string; username: string; password: string; orgId: string; role: string }): Promise<any> {
    const db = getDb();
    db.users.push(user);
    saveDb(db);
    return user;
}

// ─── Asset hierarchy ─────────────────────────────────────────────────────
export async function getOrganization(): Promise<any> {
    return getDb().organizations[0];
}

export async function getFullHierarchy(): Promise<any[]> {
    const db = getDb();
    return (db.campuses || []).map(camp => {
        const campusBatteries = (db.batteries || []).filter(b => b.campusId === camp.id || b.buildingId === undefined);
        const buildings = (db.buildings || [])
            .filter(bld => bld.campusId === camp.id)
            .map(bld => {
                const inverters = (db.inverters || []).filter(inv => inv.buildingId === bld.id);
                const rooftops = (db.rooftops || [])
                    .filter(r => r.buildingId === bld.id)
                    .map(roof => {
                        const arrays = (db.arrays || [])
                            .filter(arr => arr.rooftopId === roof.id || arr.buildingId === bld.id)
                            .map(arr => {
                                const strings = (db.strings || [])
                                    .filter(s => s.arrayId === arr.id)
                                    .map(strItem => {
                                        const panels = (db.panels || []).filter(p => p.stringId === strItem.id || p.inverterId === inverters[0]?.id);
                                        return { ...strItem, panels };
                                    });
                                return { ...arr, strings };
                            });
                        return { ...roof, arrays };
                    });
                return { ...bld, rooftops, inverters, batteries: (db.batteries || []).filter(b => b.buildingId === bld.id) };
            });
        return { ...camp, batteries: campusBatteries, buildings };
    });
}

export async function findCampusById(campusId?: string): Promise<any> {
    const db = getDb();
    return db.campuses.find(c => c.id === campusId || c.name === campusId) || db.campuses[0];
}

export async function findBuildingById(buildingId?: string): Promise<any> {
    const db = getDb();
    return db.buildings.find(b => b.id === buildingId || b.name === buildingId) || db.buildings[0];
}

// ─── Telemetry ───────────────────────────────────────────────────────────
export async function getLatestTelemetry(): Promise<any> {
    return getDb().telemetry;
}

export async function getTelemetryLog(): Promise<any[]> {
    return getDb().telemetryLog || [];
}

export async function appendTelemetry(record: any): Promise<void> {
    const db = getDb();
    db.telemetry = record;
    if (!db.telemetryLog) db.telemetryLog = [];
    db.telemetryLog.push(record);
    if (db.telemetryLog.length > MAX_TELEMETRY_LOG) {
        db.telemetryLog = db.telemetryLog.slice(-MAX_TELEMETRY_LOG);
    }
    saveDb(db);
}

// ─── Alerts ──────────────────────────────────────────────────────────────
export async function createAlert(alert: any): Promise<any> {
    const db = getDb();
    db.alerts.unshift(alert);
    saveDb(db);
    return alert;
}

export async function updateAlertStatus(alertId: string, status: string): Promise<any | null> {
    const db = getDb();
    const idx = db.alerts.findIndex(a => a.id === alertId);
    if (idx === -1) return null;
    db.alerts[idx].status = status;
    saveDb(db);
    return db.alerts[idx];
}

// ─── Recommendations ─────────────────────────────────────────────────────
export async function getRecommendations(): Promise<any[]> {
    return getDb().recommendations;
}

export async function createRecommendation(rec: any): Promise<any> {
    const db = getDb();
    db.recommendations.unshift(rec);
    saveDb(db);
    return rec;
}

// ─── Active decision context ─────────────────────────────────────────────
export async function setActiveContext(context: any): Promise<void> {
    const db = getDb();
    db.activeContext = context;
    saveDb(db);
}

export async function getActiveContext(): Promise<any> {
    return getDb().activeContext;
}

// ─── Audit log ───────────────────────────────────────────────────────────
export async function writeAuditLog(userId: string, action: string, details: string): Promise<void> {
    const db = getDb();
    db.auditLogs.unshift({ timestamp: new Date().toISOString(), userId, action, details });
    saveDb(db);
}
