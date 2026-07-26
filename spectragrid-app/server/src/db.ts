import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, 'data', 'db.json');

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

// Global cache
let cachedDb: DBStructure | null = null;

// Read JSON db
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
        return {
            users: [],
            organizations: [],
            campuses: [],
            buildings: [],
            rooftops: [],
            arrays: [],
            strings: [],
            panels: [],
            inverters: [],
            batteries: [],
            telemetry: {},
            telemetryLog: [],
            alerts: [],
            recommendations: [],
            auditLogs: []
        };
    }
}

// Write JSON db
export function saveDb(data: DBStructure): void {
    cachedDb = data;
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error saving JSON DB', err);
    }
}

// Helper to log action
export function writeAuditLog(userId: string, action: string, details: string) {
    const db = getDb();
    db.auditLogs.unshift({
        timestamp: new Date().toISOString(),
        userId,
        action,
        details
    });
    saveDb(db);
}
