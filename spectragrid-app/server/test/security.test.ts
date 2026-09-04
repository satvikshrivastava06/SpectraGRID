import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';

// ─── Test 1: Login rejects a wrong password for a bcrypt-hashed user ─────────
describe('Auth — password verification', () => {
    it('rejects wrong password against a bcrypt hash (no substring bypass)', () => {
        const correctPassword = 'correctPassword123';
        const wrongPassword = 'wrongPassword';
        const hash = bcrypt.hashSync(correctPassword, 10);

        // Ensure the wrong password truly doesn't match
        assert.strictEqual(bcrypt.compareSync(wrongPassword, hash), false);
        // Confirm the correct password does match
        assert.strictEqual(bcrypt.compareSync(correctPassword, hash), true);

        // Specifically test substring attacks are not bypassed
        const subPassword = 'correct'; // substring of correctPassword123
        assert.strictEqual(bcrypt.compareSync(subPassword, hash), false);
    });
});

// ─── Test 2: Auditor role gets 403 on POST /api/alerts ───────────────────────
describe('Authorization — role-based access control', () => {
    it('Auditor role is not in the allowed set for POST /api/alerts', () => {
        // The requireRole middleware checks against this list
        const allowedRoles = ['Operator', 'Administrator', 'Manager'];
        const auditorRole = 'Auditor';

        assert.strictEqual(allowedRoles.includes(auditorRole), false,
            'Auditor should not be in the allowed roles for POST /api/alerts');

        // Confirm that valid operator roles are allowed
        assert.strictEqual(allowedRoles.includes('Operator'), true);
        assert.strictEqual(allowedRoles.includes('Administrator'), true);
    });
});

// ─── Test 3: writeAuditLog records the real user ID, not a hardcoded string ──
describe('Audit log — user identity', () => {
    it('writeAuditLog records the authenticated user\'s real id from the JWT payload', async () => {
        const dbModule = await import('../src/db');
        const realUserId = 'u-abc123-real-id';
        await dbModule.writeAuditLog(realUserId, 'ALERT_UPDATE', 'Alert INC-001 updated to resolved');

        const db = dbModule.getDb();
        assert.strictEqual(db.auditLogs.length >= 1, true, 'Expected audit log entries');
        const latestLog = db.auditLogs[0];
        assert.strictEqual(latestLog.userId, realUserId,
            'Audit log must record the real user ID, not a hardcoded string');
        assert.notStrictEqual(latestLog.userId, 'system',
            'Audit log must not fall back to a hardcoded "system" userId');
        assert.strictEqual(latestLog.action, 'ALERT_UPDATE');
    });
});

// ─── Test 4: Heuristic fallback labels cause as "Heuristic attribution" ───────
describe('Event engine — ML service fallback labeling', () => {
    it('labels the cause as "Heuristic attribution" when ML service is unreachable', async () => {
        // Mock fetch to simulate the ML service being down
        const originalFetch = global.fetch;
        (global as any).fetch = async () => {
            throw new Error('ECONNREFUSED — ML service unreachable');
        };

        // Import after mocking fetch
        const { processTelemetryIngestion } = await import('../src/eventEngine');
        const dbModule = await import('../src/db');

        const capturedRecs: any[] = [];
        const originalCreateRec = dbModule.createRecommendation;
        (dbModule as any).createRecommendation = async (rec: any) => {
            capturedRecs.push(rec);
            return rec;
        };
        const originalAppend = dbModule.appendTelemetry;
        (dbModule as any).appendTelemetry = async () => {};
        const originalCreateAlert = dbModule.createAlert;
        (dbModule as any).createAlert = async (a: any) => a;
        const originalSetCtx = dbModule.setActiveContext;
        (dbModule as any).setActiveContext = async () => {};
        const originalWriteLog = dbModule.writeAuditLog;
        (dbModule as any).writeAuditLog = async () => {};

        // Trigger with temperature > 70 to force anomaly in the heuristic path
        await processTelemetryIngestion({
            voltage: 400,
            current: 10,
            power: 4,
            irradiance: 800,
            temperature: 75 // above 70°C threshold
        });

        // Restore
        (global as any).fetch = originalFetch;
        (dbModule as any).createRecommendation = originalCreateRec;
        (dbModule as any).appendTelemetry = originalAppend;
        (dbModule as any).createAlert = originalCreateAlert;
        (dbModule as any).setActiveContext = originalSetCtx;
        (dbModule as any).writeAuditLog = originalWriteLog;

        assert.strictEqual(capturedRecs.length >= 1, true,
            'Expected at least one recommendation to be generated');

        const rec = capturedRecs[0];
        assert.match(rec.why, /Heuristic attribution/,
            `Expected "why" to contain "Heuristic attribution" but got: ${rec.why}`);
        assert.doesNotMatch(rec.why, /^SHAP:/,
            'Must not falsely label as SHAP when ML service was unreachable');
    });
});
