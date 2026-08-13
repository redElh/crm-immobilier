import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js';
import { isAdminPanelRole } from '../config/roles.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

// Throttled per-user last activity tracking to avoid a DB write on every request.
const lastActivityUpdates = new Map();

function touchLastActivity(userId) {
  const now = Date.now();
  const last = lastActivityUpdates.get(userId) || 0;
  if (now - last < 120000) return;
  lastActivityUpdates.set(userId, now);
  pool.query(
    'UPDATE users SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  ).catch(() => {});
}

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    touchLastActivity(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!isAdminPanelRole(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};
