import pool from '../config/db.js';
import crypto from 'crypto';

const SESSION_EXPIRY_DAYS = 30;
const IDLE_TIMEOUT_MINUTES = 30;

function parseUserAgent(ua) {
  const result = { browser: 'Inconnu', os: 'Inconnu' };
  if (!ua) return result;

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) result.browser = 'Chrome';
  else if (ua.includes('Firefox')) result.browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) result.browser = 'Safari';
  else if (ua.includes('Edg')) result.browser = 'Edge';
  else if (ua.includes('OPR') || ua.includes('Opera')) result.browser = 'Opera';

  // Add version
  const versionMatch = ua.match(/(Chrome|Firefox|Safari|Edg|OPR)\/([\d.]+)/);
  if (versionMatch) result.browser = `${result.browser} ${versionMatch[2]}`;

  // OS detection
  if (ua.includes('Windows NT 10')) result.os = 'Windows 10';
  else if (ua.includes('Windows NT 11')) result.os = 'Windows 11';
  else if (ua.includes('Mac OS X')) result.os = 'macOS';
  else if (ua.includes('Android')) result.os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) result.os = 'iOS';
  else if (ua.includes('Linux')) result.os = 'Linux';

  return result;
}

export async function createSession(userId, req, clientInfo) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const ua = clientInfo ? { browser: clientInfo.browser, os: clientInfo.os } : parseUserAgent(req.headers['user-agent'] || '');
  const ipAddress = clientInfo?.ip || req.ip || req.connection?.remoteAddress || 'Inconnue';
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Check if session already exists for same device/browser
  const existing = await pool.query(
    `SELECT id FROM sessions
     WHERE user_id = $1 AND device_browser = $2 AND device_os = $3 AND is_active = true`,
    [userId, ua.browser, ua.os]
  );

  if (existing.rows.length > 0) {
    // Refresh existing session
    await pool.query(
      `UPDATE sessions SET session_token = $1, ip_address = $2, last_activity = CURRENT_TIMESTAMP,
       expires_at = $3, login_time = CURRENT_TIMESTAMP WHERE id = $4`,
      [sessionToken, ipAddress, expiresAt, existing.rows[0].id]
    );
    return { sessionId: existing.rows[0].id, sessionToken };
  }

  const result = await pool.query(
    `INSERT INTO sessions (user_id, session_token, device_browser, device_os, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [userId, sessionToken, ua.browser, ua.os, ipAddress, expiresAt]
  );

  return { sessionId: result.rows[0].id, sessionToken };
}

export async function updateLastActivity(sessionId) {
  if (!sessionId) return;
  await pool.query(
    'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
    [sessionId]
  );
}

export async function getSessions(userId) {
  const result = await pool.query(
    `SELECT id, device_browser, device_os, ip_address, login_time, last_activity, is_active, expires_at
     FROM sessions WHERE user_id = $1 AND is_active = true
     ORDER BY last_activity DESC`,
    [userId]
  );
  return result.rows;
}

export async function terminateSession(sessionId, userId) {
  const result = await pool.query(
    `UPDATE sessions SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id`,
    [sessionId, userId]
  );
  return result.rows.length > 0;
}

export async function terminateOtherSessions(currentSessionId, userId) {
  await pool.query(
    `UPDATE sessions SET is_active = false WHERE user_id = $1 AND id != $2`,
    [userId, currentSessionId]
  );
}

export async function terminateAllSessions(userId) {
  await pool.query(
    `UPDATE sessions SET is_active = false WHERE user_id = $1`,
    [userId]
  );
}

export async function cleanupExpiredSessions() {
  await pool.query(
    `UPDATE sessions SET is_active = false
     WHERE is_active = true AND (
       expires_at < CURRENT_TIMESTAMP OR
       last_activity < CURRENT_TIMESTAMP - INTERVAL '30 minutes'
     )`
  );
}
