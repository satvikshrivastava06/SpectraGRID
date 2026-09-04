import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        orgId: string;
        role: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required and must not have a default.');
}
const secret: string = JWT_SECRET;

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // 1. Check Authorization Header
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required. No valid JWT token found.' });
    }

    try {
        const decoded = jwt.verify(token, secret) as any;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired JWT authentication token.' });
    }
}

export function requireRole(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const userRole = req.user.role;
        // Normalize role matching (Admin role bypasses, Manager / Operator matching)
        if (userRole === 'Admin' || userRole === 'Administrator' || allowedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            error: `Access denied. Role '${userRole}' is not authorized for this endpoint. Required roles: ${allowedRoles.join(', ')}.`
        });
    };
}
