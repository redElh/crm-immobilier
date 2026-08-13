import pool from '../config/db.js';
import {
  getSessions,
  terminateSession,
  terminateOtherSessions,
  terminateAllSessions,
  cleanupExpiredSessions
} from '../services/session.service.js';

export const listSessions = async (req, res) => {
  try {
    const clientInfo = req.body?.deviceInfo || null;
    const ipAddress = clientInfo?.ip || req.ip || 'Inconnue';
    const browser = clientInfo?.browser || null;
    const os = clientInfo?.os || null;

    // Refresh and re-activate the current session if sessionId provided
    const { currentSessionId } = req.query;
    if (currentSessionId) {
      await pool.query(
        `UPDATE sessions SET ip_address = COALESCE($1, ip_address),
         device_browser = COALESCE($2, device_browser),
         device_os = COALESCE($3, device_os),
         last_activity = CURRENT_TIMESTAMP,
         is_active = true
         WHERE id = $4 AND user_id = $5`,
        [ipAddress, browser, os, Number(currentSessionId), req.user.id]
      );
    }

    await cleanupExpiredSessions();

    let sessions = await getSessions(req.user.id);

    // If no currentSessionId provided and no active sessions exist,
    // try to find the most recent inactive session and re-activate it
    if (!currentSessionId && sessions.length === 0) {
      const lastSession = await pool.query(
        `UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, is_active = true
         WHERE id = (
           SELECT id FROM sessions
           WHERE user_id = $1
           ORDER BY last_activity DESC NULLS LAST
           LIMIT 1
         )
         RETURNING id`,
        [req.user.id]
      );
      if (lastSession.rows.length > 0) {
        sessions = await getSessions(req.user.id);
      }
    }

    res.status(200).json({ sessions });
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await terminateSession(Number(id), req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Session not found' });
    res.status(200).json({ message: 'Session terminated' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const revokeOtherSessions = async (req, res) => {
  try {
    const { currentSessionId } = req.body;
    if (!currentSessionId) return res.status(400).json({ error: 'currentSessionId is required' });
    await terminateOtherSessions(currentSessionId, req.user.id);
    res.status(200).json({ message: 'All other sessions terminated' });
  } catch (error) {
    console.error('Revoke other sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const revokeAllSessions = async (req, res) => {
  try {
    await terminateAllSessions(req.user.id);
    res.status(200).json({ message: 'All sessions terminated. Please login again.' });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
