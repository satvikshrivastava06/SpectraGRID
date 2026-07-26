import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, saveDb, writeAuditLog } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, AuthLoginSchema, AuthRegisterSchema } from '../middleware/validation';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'spectragrid_antigravity_secret_key_2026';

// POST /api/auth/login
router.post('/login', validateBody(AuthLoginSchema), (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const db = getDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    // Verify password: support bcrypt hash or demo seed baseline
    let isValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isValid = bcrypt.compareSync(password, user.password);
    } else {
        isValid = password === 'password123' || user.password.includes(password);
    }

    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const payload = {
        id: user.id,
        username: user.username,
        orgId: user.orgId || 'org-1',
        role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });

    writeAuditLog(user.id, 'USER_LOGIN', `User ${user.username} logged in successfully with role ${user.role}.`);

    return res.json({
        message: 'Login successful.',
        token,
        user: {
            id: user.id,
            username: user.username,
            orgId: user.orgId,
            role: user.role
        }
    });
});

// POST /api/auth/register
router.post('/register', validateBody(AuthRegisterSchema), (req: Request, res: Response) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const db = getDb();
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ error: 'Username already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: `u-${Date.now().toString().slice(-4)}`,
        username,
        password: hashedPassword,
        orgId: 'org-1',
        role: role || 'Operator'
    };

    db.users.push(newUser);
    saveDb(db);

    const payload = {
        id: newUser.id,
        username: newUser.username,
        orgId: newUser.orgId,
        role: newUser.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });

    writeAuditLog(newUser.id, 'USER_REGISTER', `New user ${newUser.username} registered with role ${newUser.role}.`);

    return res.status(201).json({
        message: 'Registration successful.',
        token,
        user: {
            id: newUser.id,
            username: newUser.username,
            orgId: newUser.orgId,
            role: newUser.role
        }
    });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    return res.json({
        user: req.user
    });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    return res.json({ message: 'Logout successful.' });
});

export default router;
