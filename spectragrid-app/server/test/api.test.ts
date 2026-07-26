import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AuthLoginSchema, SimulateScenarioSchema, TelemetryIngestSchema } from '../src/middleware/validation';

describe('Server Phase 9 Validation & Security Suite', () => {

    it('Zod AuthLoginSchema rejects empty credentials with validation error', () => {
        const invalid = AuthLoginSchema.safeParse({ username: '', password: '' });
        assert.strictEqual(invalid.success, false);
        if (!invalid.success) {
            assert.strictEqual(invalid.error.issues.length >= 1, true);
        }
    });

    it('Zod AuthLoginSchema accepts valid credentials', () => {
        const valid = AuthLoginSchema.safeParse({ username: 'operator', password: 'password123' });
        assert.strictEqual(valid.success, true);
    });

    it('Zod TelemetryIngestSchema validates numbers and optional fields', () => {
        const payload = {
            voltage: 230.5,
            current: 12.4,
            power: 2.85,
            irradiance: 840,
            temperature: 38.6
        };
        const res = TelemetryIngestSchema.safeParse(payload);
        assert.strictEqual(res.success, true);

        const invalidPayload = {
            voltage: 'invalid_string',
            current: 12.4
        };
        const invalidRes = TelemetryIngestSchema.safeParse(invalidPayload);
        assert.strictEqual(invalidRes.success, false);
    });

    it('Zod SimulateScenarioSchema handles scenario parameters correctly', () => {
        const scenario = {
            inverterFailure: true,
            dustAccumulation: 45,
            cloudCover: 20
        };
        const res = SimulateScenarioSchema.safeParse(scenario);
        assert.strictEqual(res.success, true);
    });

});
