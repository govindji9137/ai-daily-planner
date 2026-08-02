/**
 * Centralised API client.
 * All requests go to /api (proxied by Vite dev server to Express on :3001).
 * Handles access token injection, 401 auto-refresh, and error normalisation.
 */

let accessToken = null;

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;

const BASE = 'https://ai-daily-planner-0r5a.onrender.com/api';

const request = async (method, path, body, retry = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include', // Send httpOnly refresh token cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401 TOKEN_EXPIRED
  if (res.status === 401 && retry) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'TOKEN_EXPIRED') {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return request(method, path, body, false); // retry once
      }
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Network error.' }));
    const err = new Error(data.message || 'Request failed.');
    err.status = res.status;
    err.errors = data.errors || null;
    throw err;
  }

  return res.json();
};

const tryRefreshToken = async () => {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.data.accessToken);
    return true;
  } catch {
    return false;
  }
};

// ─── Auth Endpoints ────────────────────────────────────────────────────────
export const apiSignup = (body) => request('POST', '/auth/signup', body);
export const apiVerifyEmail = (token) => request('POST', '/auth/verify-email', { token });
export const apiResendVerification = (email) => request('POST', '/auth/resend-verification', { email });
export const apiLogin = (body) => request('POST', '/auth/login', body);
export const apiRefresh = () => request('POST', '/auth/refresh', null);
export const apiLogout = () => request('POST', '/auth/logout', null);
export const apiMe = () => request('GET', '/auth/me');
export const apiForgotPassword = (email) => request('POST', '/auth/forgot-password', { email });
export const apiResetPassword = (token, password) => request('POST', '/auth/reset-password', { token, password });

// ─── Schedule Endpoints ────────────────────────────────────────────────────
export const apiGetSchedule = (date) => request('GET', `/schedule${date ? `?date=${date}` : ''}`);
export const apiSaveSchedule = (slots, date, promptUsed) => request('PUT', '/schedule', { slots, date, promptUsed });
export const apiGenerateSchedule = (prompt, wakeTime, sleepTime) => request('POST', '/schedule/generate', { prompt, wakeTime, sleepTime });
export const apiGetHistory = () => request('GET', '/schedule/history');
export const apiGetPlansForDate = (date) => request('GET', `/schedule/plans?date=${date}`);
export const apiSetDefaultPlan = (id, date) => request('PUT', `/schedule/plans/${id}/default`, { date });

// ─── Chat Endpoints ───────────────────────────────────────────────────────
export const apiChat = (message, history) => request('POST', '/chat', { message, history });

// ─── Focus Session Endpoints ───────────────────────────────────────────────
export const apiLogFocusSession = (taskId, duration, type, notes) => request('POST', '/focus', { taskId, duration, type, notes });
export const apiGetFocusSessions = (taskId) => request('GET', `/focus${taskId ? `?taskId=${taskId}` : ''}`);

// ─── Goal Endpoints ────────────────────────────────────────────────────────
export const apiGetGoals = () => request('GET', '/goals');
export const apiCreateGoal = (body) => request('POST', '/goals', body);
export const apiUpdateGoalProgress = (id, body) => request('PUT', `/goals/${id}`, body);

// ─── Profile Endpoints ─────────────────────────────────────────────────────
export const apiGetProfile = () => request('GET', '/profile');
export const apiUpdateProfile = (body) => request('PUT', '/profile', body);
