import pool from '../config/db.js';

function parseUserAgent(ua) {
  const result = { browser: 'Inconnu', os: 'Inconnu' };
  if (!ua) return result;
  if (ua.includes('Chrome') && !ua.includes('Edg')) result.browser = 'Chrome';
  else if (ua.includes('Firefox')) result.browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) result.browser = 'Safari';
  else if (ua.includes('Edg')) result.browser = 'Edge';
  else if (ua.includes('OPR') || ua.includes('Opera')) result.browser = 'Opera';
  const versionMatch = ua.match(/(Chrome|Firefox|Safari|Edg|OPR)\/([\d.]+)/);
  if (versionMatch) result.browser = `${result.browser} ${versionMatch[2]}`;
  if (ua.includes('Windows NT 10')) result.os = 'Windows 10';
  else if (ua.includes('Windows NT 11')) result.os = 'Windows 11';
  else if (ua.includes('Mac OS X')) result.os = 'macOS';
  else if (ua.includes('Android')) result.os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) result.os = 'iOS';
  else if (ua.includes('Linux')) result.os = 'Linux';
  return result;
}

export async function logLoginAttempt({ userId, email, req, status, failureReason, clientInfo }) {
  try {
    const ua = clientInfo ? { browser: clientInfo.browser, os: clientInfo.os } : parseUserAgent(req?.headers?.['user-agent'] || '');
    const ipAddress = clientInfo?.ip || req?.ip || req?.connection?.remoteAddress || 'Inconnue';

    await pool.query(
      `INSERT INTO login_history (user_id, email, device_browser, device_os, ip_address, status, failure_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email, ua.browser, ua.os, ipAddress, status, failureReason]
    );
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
}

export async function getLoginHistory(userId, limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT id, email, device_browser, device_os, ip_address, location_city, location_country,
            status, failure_reason, created_at
     FROM login_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

export async function getLoginHistoryCount(userId) {
  const result = await pool.query(
    'SELECT COUNT(*) as total FROM login_history WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].total, 10);
}

export async function cleanupOldHistory(days = 90) {
  const result = await pool.query(
    'DELETE FROM login_history WHERE created_at < CURRENT_TIMESTAMP - INTERVAL \'1 day\' * $1',
    [days]
  );
  return result.rowCount;
}
