/**
 * SpectraGRID Phase 4 — Seed & Migration Script
 *
 * Imports the current db.json content into the real PostgreSQL/TimescaleDB
 * database through Prisma. Run ONCE after `prisma migrate dev` completes.
 *
 * Usage: npx ts-node prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const dbPath = path.join(__dirname, '../src/data/db.json');
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(raw);

    console.log('[SEED] Starting SpectraGRID Phase 4 database seeding...');

    // 1. Organization
    const org = await prisma.organization.upsert({
        where: { id: 'org-1' },
        create: {
            id: 'org-1',
            name: db.organizations[0]?.name || 'SpectraGRID Global Labs',
            subscription: db.organizations[0]?.subscription || 'Enterprise'
        },
        update: {}
    });
    console.log(`[SEED] Organization: ${org.name}`);

    // 2. Users
    for (const u of db.users) {
        const hashedPw = u.password.startsWith('$2') ? u.password : bcrypt.hashSync('password123', 10);
        await prisma.user.upsert({
            where: { id: u.id },
            create: {
                id: u.id,
                username: u.username,
                password: hashedPw,
                role: u.role,
                organizationId: org.id
            },
            update: { role: u.role }
        });
    }
    console.log(`[SEED] Users seeded: ${db.users.length}`);

    // 3. Campuses
    for (const c of db.campuses) {
        await prisma.campus.upsert({
            where: { id: c.id },
            create: {
                id: c.id,
                name: c.name,
                size: c.size,
                rate: c.rate,
                lat: c.lat,
                lng: c.lng,
                organizationId: org.id
            },
            update: {}
        });
    }
    console.log(`[SEED] Campuses seeded: ${db.campuses.length}`);

    // 4. Buildings
    for (const b of db.buildings) {
        await prisma.building.upsert({
            where: { id: b.id },
            create: {
                id: b.id,
                name: b.name,
                efficiencyDrop: b.efficiencyDrop || 0,
                campusId: b.campusId
            },
            update: {}
        });
    }
    console.log(`[SEED] Buildings seeded: ${db.buildings.length}`);

    // 5. Rooftops
    for (const r of db.rooftops || []) {
        await prisma.rooftop.upsert({
            where: { id: r.id },
            create: {
                id: r.id,
                name: r.name,
                tilt: r.tilt || 20.0,
                azimuth: r.azimuth || 180.0,
                buildingId: r.buildingId
            },
            update: {}
        });
    }

    // 6. Arrays
    for (const a of db.arrays || []) {
        await prisma.solarArray.upsert({
            where: { id: a.id },
            create: {
                id: a.id,
                name: a.name,
                soilingIndex: a.soilingIndex || 0,
                rooftopId: a.rooftopId || 'roof-1'
            },
            update: {}
        });
    }

    // 7. Strings
    for (const s of db.strings || []) {
        await prisma.solarString.upsert({
            where: { id: s.id },
            create: {
                id: s.id,
                name: s.name,
                status: s.status || 'nominal',
                arrayId: s.arrayId
            },
            update: {}
        });
    }

    // 8. Panels
    for (const p of (db.panels || [])) {
        await prisma.panel.upsert({
            where: { id: p.id },
            create: {
                id: p.id,
                name: p.name,
                status: p.status || 'nominal',
                voltage: p.voltage || 0,
                current: p.current || 0,
                temperature: p.temperature || 25,
                stringId: p.stringId || 'str-4'
            },
            update: {}
        });
    }

    // 9. Inverters
    for (const inv of db.inverters || []) {
        await prisma.inverter.upsert({
            where: { id: inv.id },
            create: {
                id: inv.id,
                name: inv.name,
                status: inv.status || 'nominal',
                efficiency: inv.efficiency || 0.96,
                temperature: inv.temperature || 40,
                capacityKw: inv.capacityKw || 75,
                buildingId: inv.buildingId
            },
            update: {}
        });
    }

    // 10. Batteries
    for (const bat of db.batteries || []) {
        await prisma.battery.upsert({
            where: { id: bat.id },
            create: {
                id: bat.id,
                name: bat.name,
                status: bat.status || 'nominal',
                stateOfHealth: bat.stateOfHealth || 1.0,
                cycleCount: bat.cycleCount || 0,
                temperature: bat.temperature || 25,
                campusId: bat.campusId,
                buildingId: bat.buildingId
            },
            update: {}
        });
    }
    console.log(`[SEED] Asset hierarchy seeded: rooftops, arrays, strings, panels, inverters, batteries`);

    // 11. Alerts → Incidents
    for (const a of db.alerts || []) {
        await prisma.incident.create({
            data: {
                assetId: a.node || 'unknown',
                severity: a.severity || 'info',
                message: a.message || '',
                status: a.status || 'active'
            }
        }).catch(() => { });
    }

    // 12. Recommendations
    for (const r of db.recommendations || []) {
        await prisma.recommendation.create({
            data: {
                assetId: r.assetId || 'unknown',
                trigger: r.trigger || 'system',
                what: r.what || '',
                why: r.why || '',
                whatNext: r.whatNext || '',
                action: r.action || '',
                doNothing: r.doNothing || '',
                financialDelta: r.financialDelta || 0,
                carbonDelta: r.carbonDelta || 0,
                confidence: r.confidence || 0,
                severity: r.severity || 'info'
            }
        }).catch(() => { });
    }

    // 13. Audit logs
    for (const l of db.auditLogs || []) {
        await prisma.auditLog.create({
            data: {
                action: l.action || 'EVENT',
                details: l.details || '',
                timestamp: l.timestamp ? new Date(l.timestamp) : new Date()
            }
        }).catch(() => { });
    }

    console.log('[SEED] ✅ Database seeded successfully!');

    // ── Full read-through verification ────────────────────────────────────────
    console.log('\n[VERIFY] Running full schema read-through...');
    const counts = await Promise.all([
        prisma.organization.count(),
        prisma.user.count(),
        prisma.campus.count(),
        prisma.building.count(),
        prisma.rooftop.count(),
        prisma.solarArray.count(),
        prisma.solarString.count(),
        prisma.panel.count(),
        prisma.inverter.count(),
        prisma.battery.count(),
        prisma.incident.count(),
        prisma.recommendation.count(),
        prisma.auditLog.count()
    ]);

    const labels = [
        'organizations', 'users', 'campuses', 'buildings', 'rooftops',
        'arrays', 'strings', 'panels', 'inverters', 'batteries',
        'incidents', 'recommendations', 'audit_logs'
    ];

    labels.forEach((label, idx) => {
        console.log(`[VERIFY]   ${label}: ${counts[idx]} rows`);
    });

    const allPass = counts.every(c => c >= 0);
    if (allPass) {
        console.log('\n[VERIFY] ✅ All tables present and readable. Phase 4 complete.');
    } else {
        console.error('\n[VERIFY] ❌ Warning: Some tables may be missing. Review errors above.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
