import pool from '../config/db.js';
import * as otplib from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken, setTokenCookie, generateRefreshToken, getRefreshTokenExpiry } from '../config/auth.js';
import { createSession } from '../services/session.service.js';
import { logLoginAttempt } from '../services/login-history.service.js';

export const generateSecret = async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, email, two_factor_enabled FROM users WHERE id = $1',
      [req.user.id]
    );
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (user.rows[0].two_factor_enabled) return res.status(400).json({ error: '2FA is already enabled' });

    const secret = otplib.generateSecret();
    const serviceName = 'CRM Immobilier';
    const otpauthUrl = otplib.generateURI({ secret, key: user.rows[0].email, issuer: serviceName, type: 'totp' });

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Temporarily store secret in DB for verification step
    await pool.query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret, req.user.id]
    );

    res.status(200).json({ secret, qrCode, email: user.rows[0].email });
  } catch (error) {
    console.error('Generate 2FA secret error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyAndEnable = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification code is required' });

    const user = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (user.rows[0].two_factor_enabled) return res.status(400).json({ error: '2FA is already enabled' });

    const secret = user.rows[0].two_factor_secret;
    if (!secret) return res.status(400).json({ error: 'No secret generated. Start setup again.' });

    const { valid: isValid } = otplib.verifySync({ token, secret });
    if (!isValid) return res.status(400).json({ error: 'Invalid code. Please try again.' });

    // Generate backup codes
    const backupCodes = [];
    const hashedBackupCodes = [];
    for (let i = 0; i < 5; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase().match(/.{4}/g).join('-');
      backupCodes.push(code);
      const hashed = await bcrypt.hash(code, 6);
      hashedBackupCodes.push(hashed);
    }

    await pool.query(
      `UPDATE users SET
        two_factor_enabled = true,
        two_factor_setup_date = CURRENT_TIMESTAMP,
        backup_codes = $1,
        failed_2fa_attempts = 0,
        locked_until = NULL
      WHERE id = $2`,
      [hashedBackupCodes, req.user.id]
    );

    res.status(200).json({ backupCodes, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Verify and enable 2FA error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required to disable 2FA' });

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (!user.rows[0].two_factor_enabled) return res.status(400).json({ error: '2FA is not enabled' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(400).json({ error: 'Password is incorrect' });

    await pool.query(
      `UPDATE users SET
        two_factor_enabled = false,
        two_factor_secret = NULL,
        backup_codes = '{}',
        two_factor_setup_date = NULL,
        failed_2fa_attempts = 0,
        locked_until = NULL
      WHERE id = $1`,
      [req.user.id]
    );

    res.status(200).json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const generateBackupCodes = async (req, res) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (!user.rows[0].two_factor_enabled) return res.status(400).json({ error: '2FA is not enabled' });

    const backupCodes = [];
    const hashedBackupCodes = [];
    for (let i = 0; i < 5; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase().match(/.{4}/g).join('-');
      backupCodes.push(code);
      const hashed = await bcrypt.hash(code, 6);
      hashedBackupCodes.push(hashed);
    }

    await pool.query(
      'UPDATE users SET backup_codes = $1 WHERE id = $2',
      [hashedBackupCodes, req.user.id]
    );

    res.status(200).json({ backupCodes });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyLoginCode = async (req, res) => {
  try {
    const { userId, token, backupCode } = req.body;
    const code = token || backupCode;
    const clientInfo = req.body?.deviceInfo || null;
    if (!userId || !code) return res.status(400).json({ error: 'User ID and verification code are required' });

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Check if account is locked due to too many failed attempts
    if (user.rows[0].locked_until && new Date() < user.rows[0].locked_until) {
      await logLoginAttempt({ userId, email: user.rows[0].email, req, status: 'failure', failureReason: 'Compte verrouillé (trop de tentatives)', clientInfo });
      const minutes = Math.ceil((user.rows[0].locked_until - new Date()) / 60000);
      return res.status(429).json({ error: `Account locked. Try again in ${minutes} minutes.` });
    }

    // Try TOTP code
    const secret = user.rows[0].two_factor_secret;
    if (secret && otplib.verifySync({ token: code, secret }).valid) {
      await pool.query(
        'UPDATE users SET failed_2fa_attempts = 0 WHERE id = $1',
        [userId]
      );
      const jwtToken = generateToken({ id: userId, role: user.rows[0].role });
      const refreshToken = generateRefreshToken();
      await pool.query(
        'UPDATE users SET refresh_token = $1, refresh_token_expires = $2 WHERE id = $3',
        [refreshToken, getRefreshTokenExpiry(), userId]
      );
      setTokenCookie(res, jwtToken);
      const totpSession = await createSession(userId, req, clientInfo);
      await logLoginAttempt({ userId, email: user.rows[0].email, req, status: 'success', clientInfo });
      return res.status(200).json({ token: jwtToken, refreshToken, sessionId: totpSession.sessionId, sessionToken: totpSession.sessionToken, method: 'totp' });
    }

    // Try backup codes
    const backupCodes = user.rows[0].backup_codes || [];
    for (let i = 0; i < backupCodes.length; i++) {
      const match = await bcrypt.compare(code, backupCodes[i]);
      if (match) {
        backupCodes.splice(i, 1);
        await pool.query(
          'UPDATE users SET backup_codes = $1, failed_2fa_attempts = 0 WHERE id = $2',
          [backupCodes, userId]
        );
        const jwtToken = generateToken({ id: userId, role: user.rows[0].role });
        const refreshToken = generateRefreshToken();
        await pool.query(
          'UPDATE users SET refresh_token = $1, refresh_token_expires = $2 WHERE id = $3',
          [refreshToken, getRefreshTokenExpiry(), userId]
        );
        setTokenCookie(res, jwtToken);
        const bcSession = await createSession(userId, req, clientInfo);
        await logLoginAttempt({ userId, email: user.rows[0].email, req, status: 'success', clientInfo });
        return res.status(200).json({ token: jwtToken, refreshToken, sessionId: bcSession.sessionId, sessionToken: bcSession.sessionToken, method: 'backup_code' });
      }
    }

    // Failed attempt - increment counter
    const failedAttempts = (user.rows[0].failed_2fa_attempts || 0) + 1;
    if (failedAttempts >= 5) {
      // Lock account for 15 minutes
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await pool.query(
        'UPDATE users SET failed_2fa_attempts = $1, locked_until = $2 WHERE id = $3',
        [failedAttempts, lockUntil, userId]
      );
      await logLoginAttempt({ userId, email: user.rows[0].email, req, status: 'failure', failureReason: 'Compte verrouillé après 5 tentatives 2FA échouées', clientInfo });
      return res.status(429).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
    }

    await pool.query(
      'UPDATE users SET failed_2fa_attempts = $1 WHERE id = $2',
      [failedAttempts, userId]
    );

    await logLoginAttempt({ userId, email: user.rows[0].email, req, status: 'failure', failureReason: 'Code 2FA invalide', clientInfo });
    res.status(400).json({ error: 'Invalid code. Please try again.' });
  } catch (error) {
    console.error('Verify login code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const get2FAStatus = async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT two_factor_enabled, two_factor_setup_date FROM users WHERE id = $1',
      [req.user.id]
    );
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.status(200).json(user.rows[0]);
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
