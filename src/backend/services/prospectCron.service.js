import pool from '../config/db.js';

const PROSPECT_AUTO_LOST_DAYS = 30;

export async function checkOverdueProspects() {
  const results = { checked: 0, markedPerdu: 0, notified: 0, errors: 0 };

  try {
    // Check contacted prospects older than 30 days
    const overdue = await pool.query(
      `SELECT id, first_name, last_name, agent_id, contacted_at
       FROM prospects
       WHERE status NOT IN ('Perdu', 'Converti', 'Qualifié')
         AND contacted_at IS NOT NULL
         AND contacted_at <= NOW() - INTERVAL '1 day' * $1`,
      [PROSPECT_AUTO_LOST_DAYS]
    );

    results.checked = overdue.rows.length;

    for (const prospect of overdue.rows) {
      try {
        await pool.query(
          `UPDATE prospects SET status = 'Perdu', updated_at = NOW() WHERE id = $1`,
          [prospect.id]
        );
        results.markedPerdu++;
        console.log(`[PROSPECT-CRON] Auto-marked prospect ${prospect.id} (${prospect.first_name} ${prospect.last_name}) as Perdu — contacted ${PROSPECT_AUTO_LOST_DAYS}+ days ago`);

        if (prospect.agent_id) {
          const message = `Le prospect ${prospect.first_name} ${prospect.last_name} a été automatiquement marqué comme "Perdu" après ${PROSPECT_AUTO_LOST_DAYS} jours sans contact.`;
          await pool.query(
            `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [prospect.agent_id, 'Système', 'prospect_auto_perdu', message, '', `PROSPECT-${prospect.id}`]
          );
          results.notified++;
          console.log(`[PROSPECT-CRON] Notification sent to agent ${prospect.agent_id} for prospect ${prospect.id}`);
        }
      } catch (e) {
        console.error(`[PROSPECT-CRON] Failed to process prospect ${prospect.id}:`, e);
        results.errors++;
      }
    }

    // Check qualified prospects older than 30 days — unqualify and mark as Perdu
    const expiredQualified = await pool.query(
      `SELECT id, first_name, last_name, agent_id, qualified_at
       FROM prospects
       WHERE status = 'Qualifié'
         AND qualified_at IS NOT NULL
         AND qualified_at <= NOW() - INTERVAL '1 day' * $1`,
      [PROSPECT_AUTO_LOST_DAYS]
    );

    for (const prospect of expiredQualified.rows) {
      try {
        await pool.query(
          `UPDATE prospects SET status = 'Perdu', qualified_at = NULL, qualification_data = NULL, updated_at = NOW() WHERE id = $1`,
          [prospect.id]
        );
        results.markedPerdu++;
        console.log(`[PROSPECT-CRON] Auto-marked qualified prospect ${prospect.id} (${prospect.first_name} ${prospect.last_name}) as Perdu — qualified ${PROSPECT_AUTO_LOST_DAYS}+ days ago`);

        if (prospect.agent_id) {
          const message = `Le prospect qualifié ${prospect.first_name} ${prospect.last_name} a été automatiquement retiré de la qualification et marqué comme "Perdu" après ${PROSPECT_AUTO_LOST_DAYS} jours.`;
          await pool.query(
            `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [prospect.agent_id, 'Système', 'prospect_auto_perdu', message, '', `PROSPECT-${prospect.id}`]
          );
          results.notified++;
          console.log(`[PROSPECT-CRON] Notification sent to agent ${prospect.agent_id} for expired qualified prospect ${prospect.id}`);
        }
      } catch (e) {
        console.error(`[PROSPECT-CRON] Failed to process qualified prospect ${prospect.id}:`, e);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[PROSPECT-CRON] Overdue check error:', error);
    throw error;
  }

  return results;
}

export async function checkReminderNotifications() {
  const results = { checked: 0, notified: 0, errors: 0 };

  try {
    const due = await pool.query(
      `SELECT id, first_name, last_name, agent_id, reminder_date, reminder_note
       FROM prospects
       WHERE status = 'En attente'
         AND reminder_date IS NOT NULL
         AND reminder_date <= NOW()`
    );

    results.checked = due.rows.length;

    for (const prospect of due.rows) {
      if (!prospect.agent_id) continue;
      try {
        const message = prospect.reminder_note
          ? `Rappel prospect: ${prospect.first_name} ${prospect.last_name} — ${prospect.reminder_note}`
          : `Rappel prospect: ${prospect.first_name} ${prospect.last_name} — relance prévue`;

        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [prospect.agent_id, 'Système', 'prospect_reminder', message, '', `PROSPECT-${prospect.id}`]
        );
        // Clear reminder_date so the notification is not sent again
        await pool.query(
          `UPDATE prospects SET reminder_date = NULL WHERE id = $1`,
          [prospect.id]
        );
        results.notified++;
        console.log(`[PROSPECT-CRON] Notification sent for prospect ${prospect.id} reminder to agent ${prospect.agent_id}`);
      } catch (e) {
        console.error(`[PROSPECT-CRON] Failed to send notification for prospect ${prospect.id}:`, e);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[PROSPECT-CRON] Reminder check error:', error);
    throw error;
  }

  return results;
}
