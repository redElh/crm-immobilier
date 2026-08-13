import pool from '../config/db.js';
import { generateToken, setTokenCookie, clearTokenCookie, generateRefreshToken, getRefreshTokenExpiry } from '../config/auth.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendAgentWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { createSession } from '../services/session.service.js';
import { logLoginAttempt } from '../services/login-history.service.js';
import { reactivateUser, checkSecurityViolation } from '../services/inactivity.service.js';
import { sendAccountSuspensionNotificationEmail } from '../services/email.service.js';

export const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { firstName, lastName, email, phone, password, role, is_active } = req.body;

    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await pool.query(
      `INSERT INTO users 
      (first_name, last_name, email, phone, password, role, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, first_name, last_name, email, role, is_active`,
      [firstName, lastName, email, phone, hashedPassword, role, is_active]
    );

    // Send welcome email with credentials
    try {
      await sendAgentWelcomeEmail({
        email,
        firstName,
        lastName,
        password, // Sending plain password only for initial setup
        loginLink: `${process.env.FRONTEND_URL}/auth/login`
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      ...newUser.rows[0],
      message: 'Agent account created successfully. Notification email sent.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

function getClientInfo(body) {
  return body?.deviceInfo || null;
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientInfo = getClientInfo(req.body);
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'agent']
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isMatch) {
      await logLoginAttempt({ userId: user.rows[0]?.id || null, email, req, status: 'failure', failureReason: 'Mot de passe incorrect', clientInfo });
      if (user.rows[0]?.id) {
        const secCheck = await checkSecurityViolation(user.rows[0].id);
        if (secCheck.suspended) {
          console.warn(`[SECURITY] Agent ${email} auto-suspended after ${secCheck.failedAttempts} failed login attempts.`);
          sendAccountSuspensionNotificationEmail({
            email: user.rows[0].email,
            firstName: user.rows[0].first_name,
            reason: 'tentatives de connexion suspectes',
            loginLink: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login`,
          }).catch(e => console.error(`Failed to send security suspension email:`, e));
        }
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if account is active
    if (!user.rows[0].is_active) {
      await logLoginAttempt({ userId: user.rows[0].id, email, req, status: 'failure', failureReason: 'Compte désactivé', clientInfo });
      return res.status(403).json({ 
        error: 'Account disabled. Please contact your administrator.' 
      });
    }
    
    // Clear any pending password reset tokens
    await pool.query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
      [user.rows[0].id]
    );

    // Generate JWT (needed even for password change flow)
    const token = generateToken({
      id: user.rows[0].id,
      role: user.rows[0].role
    });

    // Always update last_login_at so admin always sees a date in "Dernière connexion"
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.rows[0].id]
    );

    // Handle inactivity: reactivate if status is 'inactif'
    if (user.rows[0].status === 'inactif') {
      const lastLogin = user.rows[0].last_login_at ? new Date(user.rows[0].last_login_at).getTime() : 0;
      const recentlyLoggedOut = Date.now() - lastLogin < 7 * 24 * 60 * 60 * 1000;
      if (recentlyLoggedOut) {
        await pool.query(
          `UPDATE users SET status = 'actif', is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [user.rows[0].id]
        );
      } else {
        await reactivateUser(user.rows[0].id);
      }
    }

    // Check if account is suspended
    if (user.rows[0].status === 'suspendu') {
      await logLoginAttempt({ userId: user.rows[0].id, email, req, status: 'failure', failureReason: 'Compte suspendu', clientInfo });
      return res.status(403).json({
        error: 'Votre compte a été suspendu en raison d\'une inactivité prolongée. Veuillez contacter l\'administrateur.'
      });
    }

    // Check if password change is required (after last_login_at is already recorded)
    if (user.rows[0].require_password_change) {
      const { password: _, ...userData } = user.rows[0];
      setTokenCookie(res, token);
      return res.status(200).json({
        ...userData,
        token,
        requirePasswordChange: true,
        message: 'Vous devez changer votre mot de passe avant de continuer.'
      });
    }

    // Check if 2FA is enabled
    if (user.rows[0].two_factor_enabled) {
      const { password: _, ...userData } = user.rows[0];
      return res.status(200).json({
        ...userData,
        twoFactorRequired: true,
        message: '2FA verification required'
      });
    }

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    await pool.query(
      'UPDATE users SET refresh_token = $1, refresh_token_expires = $2 WHERE id = $3',
      [refreshToken, getRefreshTokenExpiry(), user.rows[0].id]
    );
    
    // Set the token in an HTTP-only cookie
    setTokenCookie(res, token);

    // Create session
    const { sessionId, sessionToken } = await createSession(user.rows[0].id, req, clientInfo);

    await logLoginAttempt({ userId: user.rows[0].id, email, req, status: 'success', clientInfo });
    
    // Don't return the password in the response
    const { password: _, ...userData } = user.rows[0];
    
    res.status(200).json({
      ...userData,
      token,
      refreshToken,
      sessionId,
      sessionToken,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    res.json({ exists: user.rows.length > 0 });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'agent']
    );

    if (user.rows.length === 0) {
      return res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.rows[0].id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        resetLink,
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    const user = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, position } = req.body;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email) {
      const emailExists = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id <> $2',
        [email, req.user.id]
      );
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
      }
    }

    const current = existing.rows[0];
    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4, position = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, first_name, last_name, email, phone, role, is_active, profile_image, position, updated_at`,
      [
        firstName ?? current.first_name,
        lastName ?? current.last_name,
        email ?? current.email,
        phone ?? current.phone,
        position ?? current.position,
        req.user.id,
      ]
    );

    res.status(200).json({
      ...result.rows[0],
      message: 'Profil mis à jour avec succès',
    });
  } catch (error) {
    console.error('Update current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, first_name, last_name, email, phone, role, is_active, profile_image, position, color FROM users WHERE id = $1',
      [req.user.id]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user.rows[0]);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ error: 'Refresh token is required' });

    const user = await pool.query(
      'SELECT * FROM users WHERE refresh_token = $1 AND refresh_token_expires > NOW()',
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const newToken = generateToken({ id: user.rows[0].id, role: user.rows[0].role });
    setTokenCookie(res, newToken);

    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = $1, require_password_change = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.id) {
        await pool.query(
          `UPDATE users SET status = 'inactif', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'actif'`,
          [decoded.id]
        );
      }
    }
    clearTokenCookie(res);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    clearTokenCookie(res);
    res.status(200).json({ message: 'Logged out successfully' });
  }
};