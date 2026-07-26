

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

let isServerOnline = false;
let authToken: string | null = localStorage.getItem('spectragrid_jwt_token');

export function setAuthToken(token: string | null) {
    authToken = token;
    if (token) {
        localStorage.setItem('spectragrid_jwt_token', token);
    } else {
        localStorage.removeItem('spectragrid_jwt_token');
    }
}

export function getAuthToken(): string | null {
    return authToken || localStorage.getItem('spectragrid_jwt_token');
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...extraHeaders };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Async health check to see if local express server is running
async function checkServerHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(600) });
        const data = await res.json();
        isServerOnline = data.status === 'healthy';
    } catch (e) {
        isServerOnline = false;
    }
}

// Check initially
checkServerHealth();
setInterval(checkServerHealth, 10000);

export async function loginUser(username: string, password: string) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            setAuthToken(data.token);
        }
        return { ok: res.ok, status: res.status, data };
    } catch (e: any) {
        return { ok: false, status: 500, data: { error: e.message || 'Network error during authentication.' } };
    }
}

export async function logoutUser() {
    setAuthToken(null);
    try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
        // ignore
    }
}

export async function fetchCampuses() {
    if (!isServerOnline) return null;
    try {
        const res = await fetch(`${API_BASE}/api/campuses`, {
            headers: getAuthHeaders(),
            credentials: 'include'
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function fetchTelemetry() {
    if (!isServerOnline) return null;
    try {
        const res = await fetch(`${API_BASE}/api/telemetry`, {
            headers: getAuthHeaders(),
            credentials: 'include'
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function ingestTelemetry(data: any) {
    if (!isServerOnline) return null;
    try {
        const res = await fetch(`${API_BASE}/api/telemetry-ingest`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function fetchGhostGeneration(campusId: string, rooftopId: string, days: number) {
    if (!isServerOnline) return null;
    try {
        const res = await fetch(`${API_BASE}/api/ghost-generation?campusId=${encodeURIComponent(campusId)}&rooftopId=${encodeURIComponent(rooftopId)}&days=${days}`, {
            headers: getAuthHeaders(),
            credentials: 'include'
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function triggerSimulation(payload: any) {
    if (!isServerOnline) return null;
    try {
        const res = await fetch(`${API_BASE}/api/simulate`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function fetchRecommendations() {
    if (!isServerOnline) return null;
    try {
        const res = await fetch(`${API_BASE}/api/recommendations`, {
            headers: getAuthHeaders(),
            credentials: 'include'
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function updateAlertStatus(alertId: string, status: string) {
    if (!isServerOnline) return null;
    try {
        const res = await fetch(`${API_BASE}/api/alerts`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify({ alertId, status })
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

export function isBackendActive() {
    return isServerOnline;
}
