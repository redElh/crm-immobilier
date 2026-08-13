import pool from '../config/db.js';

/**
 * Checks for activities whose date/time has been reached but alarm hasn't been sent yet.
 * Sends a notification to the author (agent/admin) reminding them it's time for this activity.
 *
 * Direction logic:
 * - 'sortant' (agent → client): "Il est temps de contacter le client [name]"
 * - 'entrant' (client → agent): "Le client [name] devrait vous contacter"
 * - '' (note/alerte): "C'est l'heure de l'activite [subject]"
 */
export async function checkActivityAlarms() {
  const results = { checked: 0, notified: 0, errors: 0 };

  try {
    const now = new Date();
    console.log(`[ACTIVITY-CRON] Checking alarms at ${now.toISOString()}`);

    const due = await pool.query(
      `SELECT ca.id, ca.client_id, ca.type, ca.direction, ca.subject, ca.activity_date,
              ca.author_id, ca.author_name, ca.author_role,
              TRIM(COALESCE(oc.first_name, '') || ' ' || COALESCE(oc.last_name, '')) AS client_name
       FROM client_activities ca
       LEFT JOIN owner_clients oc ON oc.id = ca.client_id
       WHERE ca.alarm_sent = FALSE
         AND ca.activity_date IS NOT NULL
         AND ca.activity_date <= NOW()
         AND ca.status NOT IN ('annule', 'termine')`
    );

    results.checked = due.rows.length;
    console.log(`[ACTIVITY-CRON] Found ${due.rows.length} activities due for alarm`);

    for (const activity of due.rows) {
      try {
        if (!activity.author_id) {
          await pool.query(
            `UPDATE client_activities SET alarm_sent = TRUE WHERE id = $1`,
            [activity.id]
          );
          continue;
        }

        const clientName = activity.client_name || 'Ce client';
        const typeLabel = formatType(activity.type);
        let message = '';

        if (activity.direction === 'sortant') {
          message = `Il est temps de contacter ${clientName} — ${typeLabel} : "${activity.subject}" est prevu maintenant.`;
        } else if (activity.direction === 'entrant') {
          message = `${clientName} devrait vous contacter — ${typeLabel} : "${activity.subject}" est prevu maintenant.`;
        } else {
          message = `C'est l'heure de l'activite pour ${clientName} — ${typeLabel} : "${activity.subject}".`;
        }

        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [String(activity.author_id), 'Systeme', 'activity_alarm', message, String(activity.client_id), `ACTIVITY-${activity.id}`]
        );

        await pool.query(
          `UPDATE client_activities SET alarm_sent = TRUE WHERE id = $1`,
          [activity.id]
        );

        results.notified++;
        console.log(`[ACTIVITY-CRON] Alarm notification sent to user ${activity.author_id} for activity ${activity.id}`);
      } catch (e) {
        console.error(`[ACTIVITY-CRON] Failed to process activity ${activity.id}:`, e);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[ACTIVITY-CRON] Activity alarm check error:', error);
    throw error;
  }

  return results;
}

/**
 * Checks for activities with reminders whose reminder_date has been reached but reminder hasn't been sent.
 * Sends a notification to the author reminding them about the upcoming activity.
 */
export async function checkActivityReminders() {
  const results = { checked: 0, notified: 0, errors: 0 };

  try {
    const now = new Date();
    console.log(`[ACTIVITY-CRON] Checking reminders at ${now.toISOString()}`);

    const due = await pool.query(
      `SELECT ca.id, ca.client_id, ca.type, ca.direction, ca.subject, ca.activity_date,
              ca.reminder_date, ca.author_id, ca.author_name, ca.author_role,
              TRIM(COALESCE(oc.first_name, '') || ' ' || COALESCE(oc.last_name, '')) AS client_name
       FROM client_activities ca
       LEFT JOIN owner_clients oc ON oc.id = ca.client_id
       WHERE ca.has_reminder = TRUE
         AND ca.reminder_sent = FALSE
         AND ca.reminder_date IS NOT NULL
         AND ca.reminder_date <= NOW()
         AND ca.status NOT IN ('annule', 'termine')`
    );

    results.checked = due.rows.length;
    console.log(`[ACTIVITY-CRON] Found ${due.rows.length} activities due for reminder`);

    for (const activity of due.rows) {
      try {
        if (!activity.author_id) {
          await pool.query(
            `UPDATE client_activities SET reminder_sent = TRUE WHERE id = $1`,
            [activity.id]
          );
          continue;
        }

        const clientName = activity.client_name || 'Ce client';
        const typeLabel = formatType(activity.type);
        const activityDate = formatDateTimeFr(activity.activity_date);

        const message = `Rappel : N'oubliez pas l'activite prevue pour ${clientName} — ${typeLabel} : "${activity.subject}" le ${activityDate}. Ne pas oublier !`;

        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [String(activity.author_id), 'Systeme', 'activity_reminder', message, String(activity.client_id), `ACTIVITY-${activity.id}`]
        );

        await pool.query(
          `UPDATE client_activities SET reminder_sent = TRUE WHERE id = $1`,
          [activity.id]
        );

        results.notified++;
        console.log(`[ACTIVITY-CRON] Reminder notification sent to user ${activity.author_id} for activity ${activity.id}`);
      } catch (e) {
        console.error(`[ACTIVITY-CRON] Failed to send reminder for activity ${activity.id}:`, e);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[ACTIVITY-CRON] Activity reminder check error:', error);
    throw error;
  }

  return results;
}

/**
 * Auto-cancels rendez-vous that are still 'en_attente' after their activity_date has passed.
 */
export async function autoCancelUnconfirmedRendezVous() {
  const results = { checked: 0, cancelled: 0, errors: 0 };

  try {
    const now = new Date();
    console.log(`[ACTIVITY-CRON] Checking unconfirmed rendez-vous at ${now.toISOString()}`);

    const due = await pool.query(
      `SELECT ca.id, ca.client_id, ca.subject, ca.activity_date,
              ca.author_id, TRIM(COALESCE(oc.first_name, '') || ' ' || COALESCE(oc.last_name, '')) AS client_name
       FROM client_activities ca
       LEFT JOIN owner_clients oc ON oc.id = ca.client_id
       WHERE ca.type = 'rendez_vous'
         AND ca.status = 'en_attente'
         AND ca.activity_date IS NOT NULL
         AND ca.activity_date < NOW()
       LIMIT 100`
    );

    results.checked = due.rows.length;

    for (const activity of due.rows) {
      try {
        await pool.query(
          `UPDATE client_activities SET status = 'annule', alarm_sent = TRUE, reminder_sent = TRUE, updated_at = NOW() WHERE id = $1`,
          [activity.id]
        );

        if (activity.author_id) {
          const clientName = activity.client_name || 'Ce client';
          const message = `Rendez-vous annule automatiquement : "${activity.subject}" avec ${clientName} n'a pas ete confirme a temps.`;
          await pool.query(
            `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [String(activity.author_id), 'Systeme', 'activity_reminder', message, String(activity.client_id), `ACTIVITY-${activity.id}`]
          );
        }

        results.cancelled++;
        console.log(`[ACTIVITY-CRON] Auto-cancelled unconfirmed rendez-vous ${activity.id}`);
      } catch (e) {
        console.error(`[ACTIVITY-CRON] Failed to auto-cancel rendez-vous ${activity.id}:`, e);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[ACTIVITY-CRON] Auto-cancel rendez-vous error:', error);
    throw error;
  }

  return results;
}

/**
 * Sends a reminder notification 24h before a rendez-vous to confirm it,
 * warning that it will be auto-cancelled if not confirmed.
 */
export async function remindRendezVousConfirmation() {
  const results = { checked: 0, notified: 0, errors: 0 };

  try {
    const now = new Date();
    console.log(`[ACTIVITY-CRON] Checking rendez-vous confirmation reminders at ${now.toISOString()}`);

    // Find rendez-vous where now is at or past the 24h-before mark.
    // activity_date >= NOW() ensures the notification fires at exactly 24h before
    // (the first 1-minute tick when activity_date is >= NOW()).
    const due = await pool.query(
      `SELECT ca.id, ca.client_id, ca.subject, ca.activity_date,
              ca.author_id, TRIM(COALESCE(oc.first_name, '') || ' ' || COALESCE(oc.last_name, '')) AS client_name
       FROM client_activities ca
       LEFT JOIN owner_clients oc ON oc.id = ca.client_id
       WHERE ca.type = 'rendez_vous'
         AND ca.status = 'en_attente'
         AND ca.cancellation_notified = FALSE
         AND ca.activity_date IS NOT NULL
         AND ca.activity_date >= NOW()
         AND ca.activity_date <= NOW() + INTERVAL '24 hours'
       LIMIT 100`
    );

    results.checked = due.rows.length;

    for (const activity of due.rows) {
      try {
        if (!activity.author_id) {
          await pool.query(
            `UPDATE client_activities SET cancellation_notified = TRUE WHERE id = $1`,
            [activity.id]
          );
          continue;
        }

        const clientName = activity.client_name || 'Ce client';
        const dateStr = formatDateTimeFr(activity.activity_date);
        const message = `CONFIRMATION REQUISE : Le rendez-vous "${activity.subject}" avec ${clientName} prevu le ${dateStr} doit etre confirme, sinon il sera automatiquement annule.`;

        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [String(activity.author_id), 'Systeme', 'activity_reminder', message, String(activity.client_id), `ACTIVITY-${activity.id}`]
        );

        await pool.query(
          `UPDATE client_activities SET cancellation_notified = TRUE WHERE id = $1`,
          [activity.id]
        );

        results.notified++;
        console.log(`[ACTIVITY-CRON] Confirmation reminder sent for rendez-vous ${activity.id}`);
      } catch (e) {
        console.error(`[ACTIVITY-CRON] Failed to send confirmation reminder for rendez-vous ${activity.id}:`, e);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[ACTIVITY-CRON] Confirmation reminder error:', error);
    throw error;
  }

  return results;
}

function formatType(type) {
  const map = {
    appel: 'Appel',
    email: 'Email',
    visite: 'Visite',
    rendez_vous: 'Rendez-vous',
    note: 'Note',
    alerte: 'Alerte',
    autre: 'Activite',
  };
  return map[type] || 'Activite';
}

function formatDateTimeFr(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' a ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
