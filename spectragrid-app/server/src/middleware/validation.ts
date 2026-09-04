import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.issues.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        req.body = result.data;
        next();
    };
}

export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                error: 'Query validation failed',
                details: result.error.issues.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        req.query = result.data as any;
        next();
    };
}

// ─── Shared Zod Schemas ──────────────────────────────────────────────────────
export const TelemetryIngestSchema = z.object({
    voltage: z.number(),
    current: z.number(),
    power: z.number(),
    irradiance: z.number(),
    temperature: z.number(),
    mqttRate: z.number().optional(),
    mqttLag: z.number().optional(),
    throughput: z.number().optional(),
    inferenceCost: z.number().optional()
});

export const SimulateScenarioSchema = z.object({
    inverterFailure: z.boolean().optional(),
    dustAccumulation: z.number().optional(),
    batteryDegradation: z.number().optional(),
    delayedMaintenance: z.string().optional(),
    monsoonEvent: z.boolean().optional(),
    cloudCover: z.number().optional()
});

export const UpdateAlertSchema = z.object({
    alertId: z.string().min(1),
    status: z.enum(['active', 'mitigating', 'resolved'])
});

export const AuthLoginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
});

export const AuthRegisterSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['Operator', 'Administrator', 'Manager', 'Auditor']).optional()
});
