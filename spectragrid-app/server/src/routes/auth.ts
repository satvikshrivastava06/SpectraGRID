import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { findUserByUsername, createUser, writeAuditLog } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, AuthLoginSchema, AuthRegisterSchema } from '../middleware/validation';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required and must not have a default.');
}

router.post('/login', validateBody(AuthLoginSchema), async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const payload = { id: user.id, username: user.username, orgId: user.orgId || 'org-1', role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });

    await writeAuditLog(user.id, 'USER_LOGIN', `User ${user.username} logged in successfully with role ${user.role}.`);

    return res.json({
        message: 'Login successful.',
        user: { id: user.id, username: user.username, orgId: user.orgId, role: user.role }
    });
});

router.post('/register', validateBody(AuthRegisterSchema), async (req: Request, res: Response) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const existing = await findUserByUsername(username);
    if (existing) {
        return res.status(400).json({ error: 'Username already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await createUser({
        id: `u-${crypto.randomUUID()}`,
        username,
        password: hashedPassword,
        orgId: 'org-1',
        role: role || 'Operator'
    });

    const payload = { id: newUser.id, username: newUser.username, orgId: newUser.orgId, role: newUser.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });

    await writeAuditLog(newUser.id, 'USER_REGISTER', `New user ${newUser.username} registered with role ${newUser.role}.`);

    return res.status(201).json({
        message: 'Registration successful.',
        user: { id: newUser.id, username: newUser.username, orgId: newUser.orgId, role: newUser.role }
    });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    return res.json({ user: req.user });
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    return res.json({ message: 'Logout successful.' });
});

export default router;
