import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken, setTokenCookie, generateRefreshToken, getRefreshTokenExpiry } from '../config/auth.js';
import { sendUserWelcomeEmail, sendPasswordResetEmail, sendAccountSuspensionNotificationEmail, sendAccountReactivatedEmail } from '../services/email.service.js';
import { createSession } from '../services/session.service.js';
import { logLoginAttempt } from '../services/login-history.service.js';
import { reactivateUser, checkAndUpdateInactivity, suspendUser, checkSecurityViolation, anonymizeAndDeleteUser, deleteExpiredUsers, getInactivityLevel, getDaysSinceLastLogin } from '../services/inactivity.service.js';
import { isAdminPanelRole, isValidUserRole, getLoginLink } from '../config/roles.js';
import { getNextAvailableUserColor } from '../config/userColors.js';

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientInfo = req.body?.deviceInfo || null;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role IN ($2, $3)',
      [email, 'admin', 'gerant']
    );

    if (user.rows.length === 0) {
      await logLoginAttempt({ userId: null, email, req, status: 'failure', failureReason: 'Email non trouvé', clientInfo });
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      await logLoginAttempt({ userId: user.rows[0].id, email, req, status: 'failure', failureReason: 'Mot de passe incorrect', clientInfo });
      // Check for security violation (too many failures)
      const secCheck = await checkSecurityViolation(user.rows[0].id);
      if (secCheck.suspended) {
        console.warn(`[SECURITY] User ${email} auto-suspended after ${secCheck.failedAttempts} failed login attempts.`);
        sendAccountSuspensionNotificationEmail({
          email: user.rows[0].email,
          firstName: user.rows[0].first_name,
          reason: 'tentatives de connexion suspectes',
          loginLink: getLoginLink(user.rows[0].role),
        }).catch(e => console.error(`Failed to send security suspension email:`, e));
      }
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    if (!user.rows[0].is_active) {
      await logLoginAttempt({ userId: user.rows[0].id, email, req, status: 'failure', failureReason: 'Compte désactivé', clientInfo });
      return res.status(403).json({ error: 'Account disabled. Contact super admin.' });
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

    setTokenCookie(res, token);

    // Create session
    const { sessionId, sessionToken } = await createSession(user.rows[0].id, req, clientInfo);

    await logLoginAttempt({ userId: user.rows[0].id, email, req, status: 'success', clientInfo });

    const { password: _, ...userData } = user.rows[0];

    res.status(200).json({
      ...userData,
      token,
      refreshToken,
      sessionId,
      sessionToken,
      message: 'Admin login successful'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const adminRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Un administrateur avec cet email existe déjà' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users
      (first_name, last_name, email, phone, password, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, first_name, last_name, email, phone, role, is_active`,
      [firstName, lastName, email, phone, hashedPassword, 'admin', true]
    );

    res.status(201).json({
      ...newUser.rows[0],
      message: 'Compte administrateur créé avec succès'
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role IN ($2, $3)',
      [email, 'admin', 'gerant']
    );

    if (user.rows.length === 0) {
      return res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.rows[0].id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetLink = isAdminPanelRole(user.rows[0].role)
      ? `${frontendUrl}/auth/admin/reset-password?token=${resetToken}`
      : `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        resetLink,
      });
    } catch (emailError) {
      console.error('Failed to send admin reset email:', emailError);
      return res.status(500).json({ error: 'L\'envoi de l\'email a échoué. Veuillez réessayer ou contacter l\'administrateur.' });
    }

    res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const adminResetPassword = async (req, res) => {
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
    console.error('Admin reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const totalAdmins = await pool.query("SELECT COUNT(*) FROM users WHERE role IN ('admin', 'gerant')");
    const totalAgents = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'agent'");

    res.status(200).json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeUsers: parseInt(activeUsers.rows[0].count),
      totalAdmins: parseInt(totalAdmins.rows[0].count),
      totalAgents: parseInt(totalAgents.rows[0].count),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, is_active, status, position, is_owner, color,
              last_login_at, last_activity_at, require_password_change,
              created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    const usersWithInactivity = result.rows.map(u => ({
      ...u,
      days_since_last_login: getDaysSinceLastLogin(u.last_login_at),
      inactivity_level: getInactivityLevel(u.last_login_at),
    }));
    res.status(200).json(usersWithInactivity);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role, is_active, status, position, is_owner, color,
              last_login_at, last_activity_at, require_password_change,
              created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.status(200).json({
      ...user,
      days_since_last_login: getDaysSinceLastLogin(user.last_login_at),
      inactivity_level: getInactivityLevel(user.last_login_at),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, is_active, position } = req.body;

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || 'agent';

    if (!isValidUserRole(userRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, gerant or agent' });
    }

    const color = await getNextAvailableUserColor(pool);

    const newUser = await pool.query(
      `INSERT INTO users 
      (first_name, last_name, email, phone, password, role, is_active, require_password_change, position, color) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, first_name, last_name, email, phone, role, is_active, position, require_password_change, created_at, color`,
      [firstName, lastName, email, phone, hashedPassword, userRole, is_active !== undefined ? is_active : true, true, position || 'Agent immobilier', color]
    );

    // Send welcome email with credentials
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const loginLink = isAdminPanelRole(userRole)
      ? `${frontendUrl}/auth/admin/login`
      : `${frontendUrl}/auth/login`;

    try {
      await sendUserWelcomeEmail({
        email,
        firstName,
        lastName,
        password,
        loginLink,
        role: userRole,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      ...newUser.rows[0],
      message: 'User created successfully. Notification email sent.'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, is_active, password, position } = req.body;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!isValidUserRole(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, gerant or agent' });
    }

    let query = 'UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4, role = $5, is_active = $6, position = $7, updated_at = CURRENT_TIMESTAMP';
    const params = [firstName, lastName, email, phone, role, is_active, position];
    let paramIndex = 8;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += `, password = $${paramIndex}`;
      params.push(hashedPassword);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, first_name, last_name, email, phone, role, is_active, position, updated_at`;
    params.push(id);

    const result = await pool.query(query, params);

    res.status(200).json({
      ...result.rows[0],
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (existing.rows[0].is_owner) {
      return res.status(403).json({ error: "Le compte administrateur d'origine ne peut pas être supprimé." });
    }

    if (existing.rows[0].role === 'admin') {
      return res.status(403).json({ error: "Les comptes administrateur ne peuvent pas être supprimés." });
    }

    if (req.user?.role === 'gerant' && String(req.user.id) === String(existing.rows[0].id)) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    // Anonymize and soft-delete instead of hard delete
    await anonymizeAndDeleteUser(id);

    res.status(200).json({ message: 'Utilisateur supprimé définitivement' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (String(req.user?.id) === String(existing.rows[0].id)) {
      return res.status(403).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' });
    }

    const newStatus = !existing.rows[0].is_active;
    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, first_name, last_name, email, role, is_active',
      [newStatus, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    await pool.query(
      'UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [imageUrl, req.user.id]
    );

    res.status(200).json({ profile_image: imageUrl });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const reactivateUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await reactivateUser(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé ou n\'est pas suspendu/inactif' });
    }
    res.status(200).json({ ...user, message: 'Compte réactivé avec succès' });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const suspendUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé ou déjà supprimé' });
    }

    if (existing.rows[0].is_owner) {
      return res.status(403).json({ error: "Le compte administrateur d'origine ne peut pas être suspendu." });
    }

    const user = await suspendUser(id, reason || undefined);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé ou déjà supprimé' });
    }
    // Send notification email (non-blocking)
    sendAccountSuspensionNotificationEmail({
      email: user.email,
      firstName: user.first_name,
      reason: reason || undefined,
      loginLink: getLoginLink(user.role),
    }).catch(e => console.error(`Failed to send suspension email to ${user.email}:`, e));

    res.status(200).json({ ...user, message: 'Compte suspendu avec succès' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const runInactivityCheck = async (req, res) => {
  try {
    const inactivityResults = await checkAndUpdateInactivity();
    const deletionResults = await deleteExpiredUsers();
    res.status(200).json({
      message: 'Vérification d\'inactivité terminée',
      results: { ...inactivityResults, deleted: deletionResults.deleted },
    });
  } catch (error) {
    console.error('Inactivity check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
