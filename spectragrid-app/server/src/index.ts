import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import { getDb } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

// Phase 8 Security Hardening: Helmet Security Headers
app.use(helmet({
    contentSecurityPolicy: false // Disabled for local dev rendering flexibility
}));

// Phase 8 Security Hardening: CORS Allowlist
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy restriction'));
        }
    },
    credentials: true
}));

// Phase 8 Security Hardening: Express Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api', apiLimiter);

app.use(express.json());
app.use(cookieParser());

// Initialize Database connection check
console.log('[DATABASE] Initializing JSON store...');
const db = getDb();
console.log(`[DATABASE] Success. Loaded ${db.users.length} users, ${db.campuses.length} campuses and ${db.alerts.length} historical logs.`);

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`[SERVER] Express Server running on http://localhost:${PORT}`);
});

