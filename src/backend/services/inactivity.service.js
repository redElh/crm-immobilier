import pool from '../config/db.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { terminateAllSessions } from './session.service.js';
import { getLoginLink, getResetLink } from '../config/roles.js';
import {
  sendAccountWarningEmail,
  sendAccountSuspendedEmail,
  sendAccountDeletionWarningEmail,
  sendAccountSuspensionNotificationEmail,
  sendAccountReactivatedEmail,
} from './email.service.js';

const DAYS_TO_INACTIVE = 30;
const DAYS_TO_SUSPENSION_WARNING = 60;
const DAYS_TO_SUSPENSION = 90;
const DAYS_TO_DELETION_WARNING = 150;
const DAYS_TO_DELETION = 180;
const FAILED_LOGIN_THRESHOLD = 5;
const FAILED_LOGIN_WINDOW_MINUTES = 15;

// A user whose last activity is older than this is considered logged out.
const ACTIVITY_TIMEOUT_MINUTES = 30;

const SUSPENSION_REASONS = {
  INACTIVITY: 'inactivité prolongée',
  SECURITY: 'tentatives de connexion suspectes',
  ADMIN: 'action manuelle de l\'administrateur',
  POLICY: 'non-respect des politiques',
};

export async function checkAndUpdateInactivity() {
  const now = new Date();
  const results = {
    checked: 0,
    markedInactive: 0,
    warned: 0,
    suspended: 0,
    scheduledDeletion: 0,
    deleted: 0,
    deletionWarned: 0,
  };

  try {
    const users = await pool.query(
      `SELECT id, first_name, last_name, email, role, last_login_at, created_at, status, is_active,
              inactivity_email_sent_at, suspension_email_sent_at,
              scheduled_deletion_at, deletion_email_sent_at
       FROM users WHERE role IN ('agent', 'admin', 'gerant') AND status != 'supprimé'
         AND is_owner = false`
    );

    results.checked = users.rows.length;

    for (const user of users.rows) {
      const lastActivity = user.last_login_at || user.created_at;
      if (!lastActivity) continue;

      const daysSinceLastLogin = Math.floor((now - new Date(lastActivity)) / (1000 * 60 * 60 * 24));

      // Step 1: Schedule deletion for users inactive 180+ days (7 days from now)
      if (daysSinceLastLogin >= DAYS_TO_DELETION && !user.scheduled_deletion_at) {
        await pool.query(
          `UPDATE users SET scheduled_deletion_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), user.id]
        );
        results.scheduledDeletion++;
      }

      // Step 2: Send deletion warning email (at 150+ days, before scheduling deletion)
      if (daysSinceLastLogin >= DAYS_TO_DELETION_WARNING && !user.deletion_email_sent_at && !user.scheduled_deletion_at) {
        try {
          const daysUntilDeletion = DAYS_TO_DELETION - daysSinceLastLogin;
          await sendAccountDeletionWarningEmail({
            email: user.email,
            firstName: user.first_name,
            daysUntilDeletion: Math.max(1, daysUntilDeletion),
            loginLink: getLoginLink(user.role),
          });
          await pool.query(
            `UPDATE users SET deletion_email_sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [user.id]
          );
          results.deletionWarned++;
        } catch (e) {
          console.error(`Failed to send deletion warning email to ${user.email}:`, e);
        }
      }

      // Step 3: Suspend users inactive 90+ days
      if (daysSinceLastLogin >= DAYS_TO_SUSPENSION && user.status !== 'suspendu') {
        await suspendUser(user.id, SUSPENSION_REASONS.INACTIVITY);
        if (!user.suspension_email_sent_at) {
          try {
            await sendAccountSuspendedEmail({
              email: user.email,
              firstName: user.first_name,
              loginLink: getLoginLink(user.role),
            });
            await pool.query(
              `UPDATE users SET suspension_email_sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [user.id]
            );
          } catch (e) {
            console.error(`Failed to send suspension email to ${user.email}:`, e);
          }
        }
        results.suspended++;
        continue;
      }

      // Step 4: Send inactivity warning at 60+ days (only if not already suspended)
      if (daysSinceLastLogin >= DAYS_TO_SUSPENSION_WARNING && !user.inactivity_email_sent_at && user.status !== 'suspendu') {
        try {
          await sendAccountWarningEmail({
            email: user.email,
            firstName: user.first_name,
            daysInactive: daysSinceLastLogin,
            loginLink: getLoginLink(user.role),
          });
          await pool.query(
            `UPDATE users SET inactivity_email_sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [user.id]
          );
        } catch (e) {
          console.error(`Failed to send warning email to ${user.email}:`, e);
        }
        results.warned++;
      }

      // Step 5: Mark as inactive at 30+ days
      if (daysSinceLastLogin >= DAYS_TO_INACTIVE && user.status === 'actif') {
        await pool.query(
          `UPDATE users SET status = 'inactif', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [user.id]
        );
        results.markedInactive++;
      }
    }
  } catch (error) {
    console.error('Inactivity check error:', error);
    throw error;
  }

  return results;
}

// Safety-net sweep: marks as 'inactif' any user who has no recent activity
// (no authenticated request / open WebSocket for ACTIVITY_TIMEOUT_MINUTES).
// Covers users whose browser was closed without an explicit logout, while
// explicit logout and WebSocket close update the status in real time.
export async function markInactiveUsers() {
  const result = await pool.query(
    `UPDATE users
     SET status = 'inactif', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'actif'
       AND role IN ('agent', 'admin', 'gerant')
       AND COALESCE(last_activity_at, last_login_at) IS NOT NULL
       AND COALESCE(last_activity_at, last_login_at) < CURRENT_TIMESTAMP - ($1::int * INTERVAL '1 minute')`,
    [ACTIVITY_TIMEOUT_MINUTES]
  );
  return { markedInactive: result.rowCount || 0 };
}

export async function deleteExpiredUsers() {
  const results = { checked: 0, deleted: 0, errors: 0 };

  try {
    const expired = await pool.query(
      `SELECT id, email, first_name, last_name FROM users
       WHERE scheduled_deletion_at IS NOT NULL
         AND scheduled_deletion_at <= CURRENT_TIMESTAMP
         AND status != 'supprimé'
         AND is_owner = false`
    );

    results.checked = expired.rows.length;

    for (const user of expired.rows) {
      try {
        await anonymizeAndDeleteUser(user.id);
        console.log(`[AUTO-DELETE] User ${user.email} (${user.id}) permanently deleted due to inactivity.`);
        results.deleted++;
      } catch (e) {
        console.error(`[AUTO-DELETE] Failed to delete user ${user.id}:`, e);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('Delete expired users error:', error);
    throw error;
  }

  return results;
}

export async function anonymizeAndDeleteUser(userId) {
  // 1. Terminate all active sessions
  await terminateAllSessions(userId);

  // 2. Anonymize login history (remove user reference, keep audit trail)
  await pool.query(
    `UPDATE login_history SET user_id = NULL, email = CONCAT('anonymized-', id, '@deleted.user')
     WHERE user_id = $1`,
    [userId]
  );

  // 3. Hard-delete the user from the database
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);

  return { deleted: true };
}

export async function suspendUser(userId, reason = SUSPENSION_REASONS.ADMIN) {
  // Check user exists
  const user = await pool.query(
    `SELECT id, first_name, last_name, email, role, status FROM users WHERE id = $1`,
    [userId]
  );
  if (user.rows.length === 0) return null;
  if (user.rows[0].status === 'supprimé') return null;

  // 1. Terminate all active sessions
  await terminateAllSessions(userId);

  // 2. Update user status
  const updated = await pool.query(
    `UPDATE users
     SET status = 'suspendu', is_active = false, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status != 'supprimé'
     RETURNING id, first_name, last_name, email, role, status, is_active`,
    [userId]
  );
  if (updated.rows.length === 0) return null;

  // 3. Log the suspension event (using login_history as audit trail)
  await pool.query(
    `INSERT INTO login_history (user_id, email, device_browser, device_os, ip_address, status, failure_reason)
     VALUES ($1, $2, 'System', 'System', '0.0.0.0', 'suspension', $3)`,
    [userId, user.rows[0].email, reason]
  );

  return updated.rows[0];
}

export async function checkSecurityViolation(userId) {
  // Check for multiple failed login attempts within the last 15 minutes
  const recentFailures = await pool.query(
    `SELECT COUNT(*) as count FROM login_history
     WHERE user_id = $1
       AND status = 'failure'
       AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 minute' * $2`,
    [userId, FAILED_LOGIN_WINDOW_MINUTES]
  );

  const failedCount = parseInt(recentFailures.rows[0].count, 10);

  if (failedCount >= FAILED_LOGIN_THRESHOLD) {
    const user = await pool.query(
      `SELECT id, status FROM users WHERE id = $1`,
      [userId]
    );
    if (user.rows.length > 0 && user.rows[0].status !== 'suspendu' && user.rows[0].status !== 'supprimé') {
      await suspendUser(userId, SUSPENSION_REASONS.SECURITY);
      return { suspended: true, reason: SUSPENSION_REASONS.SECURITY, failedAttempts: failedCount };
    }
  }

  return { suspended: false, failedAttempts: failedCount };
}

export async function reactivateUser(userId) {
  const result = await pool.query(
    `UPDATE users
     SET status = 'actif', is_active = true,
         inactivity_email_sent_at = NULL, suspension_email_sent_at = NULL,
         deletion_email_sent_at = NULL, scheduled_deletion_at = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status IN ('inactif', 'suspendu')
     RETURNING id, first_name, last_name, email, role, status, is_active`,
    [userId]
  );
  if (!result.rows[0]) return null;

  // Generate a reset token so user can set a new password if they forgot theirs
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
  await pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [resetToken, resetExpires, userId]
  );

  const resetLink = getResetLink(result.rows[0].role, resetToken);

  // Send reactivation email with login + reset links
  try {
    await sendAccountReactivatedEmail({
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      loginLink: getLoginLink(result.rows[0].role),
      resetLink,
    });
  } catch (e) {
    console.error(`Failed to send reactivation email to user ${userId}:`, e);
  }

  return result.rows[0];
}

export async function checkAgentInactivityAndNotify() {
  const results = { checked: 0, notified30j: 0, notified60j: 0, errors: 0 };

  try {
    const automators = await pool.query(`
      SELECT a.id as automator_id, a.event_id, an.id as notif_id, an.canal, an.message_template, an.objet_template, an.destinataires
      FROM automators a
      JOIN automator_notifications an ON an.automator_id = a.id
      WHERE a.event_id IN ('admin_agent_inactif_30j', 'admin_agent_inactif_60j')
        AND a.actif = true AND an.actif = true
    `);

    if (automators.rows.length === 0) return results;

    const byEvent = {};
    for (const row of automators.rows) {
      if (!byEvent[row.event_id]) byEvent[row.event_id] = [];
      byEvent[row.event_id].push(row);
    }

    const users = await pool.query(
      `SELECT id, first_name, last_name, email, role, last_login_at, created_at, status
       FROM users WHERE role = 'agent' AND status != 'supprimé'`
    );

    results.checked = users.rows.length;

    for (const user of users.rows) {
      const lastActivity = user.last_login_at || user.created_at;
      if (!lastActivity) continue;
      const daysSinceLastLogin = getDaysSinceLastLogin(lastActivity);

      if (daysSinceLastLogin >= DAYS_TO_INACTIVE) {
        await triggerInactivityNotifications(user, byEvent['admin_agent_inactif_30j'], 'admin_agent_inactif_30j', 'Agent inactif (30j)', daysSinceLastLogin, results, 'notified30j');
      }
      if (daysSinceLastLogin >= DAYS_TO_SUSPENSION_WARNING) {
        await triggerInactivityNotifications(user, byEvent['admin_agent_inactif_60j'], 'admin_agent_inactif_60j', 'Agent inactif (60j)', daysSinceLastLogin, results, 'notified60j');
      }
    }
  } catch (error) {
    console.error('Agent inactivity notification check error:', error);
    results.errors++;
  }

  return results;
}

async function triggerInactivityNotifications(user, notifRows, eventId, eventLabel, daysSinceLastLogin, results, resultKey) {
  if (!notifRows || notifRows.length === 0) return;

  const prenom = user.first_name || '';
  const nom = user.last_name || '';
  const agentFullName = `${prenom} ${nom}`.trim();
  const dateFormatter = { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const derniereConnexion = user.last_login_at
    ? new Date(user.last_login_at).toLocaleDateString('fr-FR', dateFormatter)
    : (user.created_at
        ? `Jamais connecté (créé le ${new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })})`
        : 'Jamais connecté');

  for (const n of notifRows) {
    try {
      const rawCanal = n.canal || 'application_mobile';
      const canal = rawCanal === 'application_mobile' ? 'crm' : rawCanal;

      const existing = await pool.query(
        `SELECT id FROM automator_triggered_notifications
         WHERE event_id = $1 AND agent_nom = $2 AND canal = $3`,
        [eventId, agentFullName, canal]
      );
      if (existing.rows.length > 0) continue;

      const message = (n.message_template || '')
        .replace(/\{\{agent\.prenom\}\}/g, prenom)
        .replace(/\{\{agent\.nom\}\}/g, nom)
        .replace(/\{\{agent\.email\}\}/g, user.email || '')
        .replace(/\{\{agent\.derniere_connexion\}\}/g, derniereConnexion);

      const objet = (n.objet_template || '')
        .replace(/\{\{agent\.prenom\}\}/g, prenom)
        .replace(/\{\{agent\.nom\}\}/g, nom)
        .replace(/\{\{agent\.email\}\}/g, user.email || '')
        .replace(/\{\{agent\.derniere_connexion\}\}/g, derniereConnexion);
      const aujourdhui = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

      let emailHtml = null;
      let crmHtml = null;

      if (canal === 'email') {
        emailHtml = buildInactivityEmailHtml(eventLabel, agentFullName, prenom, nom, user.email, derniereConnexion, daysSinceLastLogin, aujourdhui);
      } else {
        crmHtml = buildInactivityCrmHtml(eventLabel, agentFullName, prenom, nom, user.email, derniereConnexion, daysSinceLastLogin, aujourdhui);
      }

      const title = objet || `${eventLabel} - ${agentFullName}`;

      await pool.query(
        `INSERT INTO automator_triggered_notifications
         (event_id, event_label, categorie, canal, titre, message, email_html, crm_html, agent_nom, bien_titre, client_nom, client_type, mandat_type, date_expiration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [eventId, eventLabel, 'admin', canal, title, message, emailHtml, crmHtml, agentFullName, '', agentFullName, 'admin', '', '']
      );

      await pool.query(
        `INSERT INTO automator_logs (automator_id, evenement, destinataire, statut, contenu)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.automator_id, eventLabel, 'Administrateurs', 'succes', `Notification de ${eventLabel} déclenchée pour ${agentFullName} (${daysSinceLastLogin} jours d'inactivité)`]
      );

      await pool.query(
        `UPDATE automators SET derniere_execution = CURRENT_TIMESTAMP WHERE id = $1`,
        [n.automator_id]
      );

      // Create general CRM notification for all active admins (bell icon in Topbar)
      try {
        const admins = await pool.query(
          `SELECT id, email, first_name FROM users WHERE role IN ('admin', 'gerant') AND status = 'actif'`
        );
        for (const admin of admins.rows) {
          await pool.query(
            `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [admin.id, 'Square Meter', 'agent_inactivity', `${eventLabel} - ${agentFullName} : ${daysSinceLastLogin} jours d'inactivité`, '', eventId]
          );
        }
      } catch (notifErr) {
        console.error(`[AgentInactivity] Failed to create CRM notification for ${eventLabel}:`, notifErr);
      }

      if (canal === 'email') {
        try {
          const admins = await pool.query(
            `SELECT id, email, first_name FROM users WHERE role IN ('admin', 'gerant') AND status = 'actif'`
          );
          if (admins.rows.length === 0) {
            console.log(`[AgentInactivity] No active admins found to send email notification for ${eventLabel}`);
          } else {
            const transporter = nodemailer.createTransport({
              host: process.env.EMAIL_HOST,
              port: Number(process.env.EMAIL_PORT),
              secure: process.env.EMAIL_SECURE === 'true',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
              },
            });
            for (const admin of admins.rows) {
              await transporter.sendMail({
                from: `"Square Meter" <${process.env.EMAIL_FROM || 'noreply@squaremeter.ma'}>`,
                to: admin.email,
                subject: title,
                html: emailHtml,
              });
              console.log(`[AgentInactivity] Email sent to admin ${admin.email} for ${eventLabel} - ${agentFullName}`);
            }
          }
        } catch (emailErr) {
          console.error(`[AgentInactivity] Failed to send email for ${eventLabel}:`, emailErr);
        }
      }

      results[resultKey]++;
    } catch (e) {
      console.error(`Failed to trigger ${eventId} for ${user.email}:`, e);
      results.errors++;
    }
  }
}

function buildInactivityEmailHtml(eventLabel, agentFullName, prenom, nom, email, derniereConnexion, daysInactive, dateStr) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f4f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${eventLabel}</h1>
          <p style="margin:6px 0 0;color:#a8b2d1;font-size:13px;">Square Meter - Notification automator</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#333;font-size:14px;">Bonjour,</p>
          <p style="margin:0 0 20px;color:#555;font-size:13px;line-height:1.6;">L'agent ci-dessous ne s'est pas connecté depuis ${daysInactive} jours.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:8px;border:1px solid #e8ecf1;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#888;font-size:12px;width:140px;">Agent</td><td style="padding:6px 0;color:#1a1a2e;font-size:13px;font-weight:600;">${agentFullName}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Email</td><td style="padding:6px 0;color:#333;font-size:13px;">${email || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Dernière connexion</td><td style="padding:6px 0;color:#e74c3c;font-size:13px;font-weight:600;">${derniereConnexion}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Jours d'inactivité</td><td style="padding:6px 0;color:#e74c3c;font-size:13px;font-weight:600;">${daysInactive} jours</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #e8ecf1;">
          <p style="margin:0;color:#999;font-size:11px;text-align:center;">Email envoyé automatiquement par Square Meter le ${dateStr}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim();
}

function buildInactivityCrmHtml(eventLabel, agentFullName, prenom, nom, email, derniereConnexion, daysInactive, dateStr) {
  return `
<div style="font-family:'Segoe UI',Roboto,sans-serif;padding:24px;background:#f8f6ff;border-radius:12px;border:1px solid #e4d9ff;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e4d9ff;">
    <div style="width:36px;height:36px;border-radius:10px;background:#7c3aed;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;">&#x1F514;</div>
    <div>
      <div style="font-size:13px;font-weight:700;color:#1a1a2e;">${eventLabel}</div>
      <div style="font-size:11px;color:#7c3aed;">Notification CRM - Square Meter</div>
    </div>
  </div>
  <div style="background:#ffffff;border-radius:8px;border:1px solid #ede9fe;padding:16px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:5px 0;color:#888;font-size:11px;width:100px;">Agent</td><td style="padding:5px 0;color:#1a1a2e;font-size:12px;font-weight:600;">${agentFullName}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Email</td><td style="padding:5px 0;color:#333;font-size:12px;">${email || '—'}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Dernière connexion</td><td style="padding:5px 0;color:#dc2626;font-size:12px;font-weight:600;">${derniereConnexion}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Inactivité</td><td style="padding:5px 0;color:#dc2626;font-size:12px;font-weight:600;">${daysInactive} jours</td></tr>
    </table>
  </div>
  <div style="margin-top:16px;font-size:11px;color:#999;text-align:center;padding-top:12px;border-top:1px solid #e4d9ff;">
    Notification CRM générée par Square Meter le ${dateStr}
  </div>
</div>`.trim();
}

export function getDaysSinceLastLogin(lastLoginAt) {
  if (!lastLoginAt) return null;
  return Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
}

export function getInactivityLevel(lastLoginAt) {
  const days = getDaysSinceLastLogin(lastLoginAt);
  if (days === null) return { level: 'unknown', days: null };
  if (days >= DAYS_TO_DELETION) return { level: 'scheduled_deletion', days, threshold: DAYS_TO_DELETION };
  if (days >= DAYS_TO_SUSPENSION) return { level: 'suspendu', days, threshold: DAYS_TO_SUSPENSION };
  if (days >= DAYS_TO_SUSPENSION_WARNING) return { level: 'warning', days, threshold: DAYS_TO_SUSPENSION_WARNING };
  if (days >= DAYS_TO_INACTIVE) return { level: 'inactif', days, threshold: DAYS_TO_INACTIVE };
  return { level: 'actif', days, threshold: DAYS_TO_INACTIVE };
}
