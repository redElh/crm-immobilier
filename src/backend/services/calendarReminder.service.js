import pool from '../config/db.js';

const REMINDER_OFFSETS = {
  '15 minutes avant': 15 * 60 * 1000,
  '30 minutes avant': 30 * 60 * 1000,
  '1 heure avant': 60 * 60 * 1000,
  '2 heures avant': 2 * 60 * 60 * 1000,
  '1 jour avant': 24 * 60 * 60 * 1000,
  '2 jours avant': 2 * 24 * 60 * 60 * 1000,
  '1 semaine avant': 7 * 24 * 60 * 60 * 1000,
};

const LEAD_PHRASES = {
  '15 minutes avant': 'dans 15 minutes',
  '30 minutes avant': 'dans 30 minutes',
  '1 heure avant': 'dans 1 heure',
  '2 heures avant': 'dans 2 heures',
  '1 jour avant': 'demain',
  '2 jours avant': 'dans 2 jours',
  '1 semaine avant': 'dans 1 semaine',
};

function buildMessage(title, label, startAt) {
  const d = new Date(startAt);
  const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const lead = LEAD_PHRASES[label] || label;
  return `Rappel : "${title || 'Événement'}" commence ${lead}, le ${dateStr} a ${timeStr}.`;
}

/**
 * Checks calendar events for reminders whose trigger time has been reached
 * and creates a notification in the notifications bar for the event owner.
 * Marks each fired reminder as sent so it is not fired again.
 */
export async function checkCalendarReminders() {
  const results = { checked: 0, notified: 0, errors: 0 };

  try {
    const now = Date.now();

    const events = await pool.query(
      `SELECT id, title, start_at, agent_id, reminders
       FROM calendar_events
       WHERE reminders IS NOT NULL AND reminders <> '[]'::jsonb`
    );

    for (const event of events.rows) {
      const reminders = event.reminders || [];
      const pending = reminders.filter(r => r && r.label && !r.sent);
      if (pending.length === 0) continue;

      results.checked++;
      const startAt = new Date(event.start_at).getTime();
      const updated = [...reminders];
      let changed = false;

      if (startAt <= now) {
        for (const r of pending) {
          const idx = updated.indexOf(r);
          if (idx >= 0) updated[idx] = { ...r, sent: true };
        }
        changed = true;
      } else {
        for (const r of pending) {
          const offset = REMINDER_OFFSETS[r.label];

          if (offset === undefined) {
            const idx = updated.indexOf(r);
            if (idx >= 0) updated[idx] = { ...r, sent: true };
            changed = true;
            continue;
          }

          const triggerAt = startAt - offset;
          if (triggerAt > now) continue;

          try {
            if (event.agent_id) {
              const message = buildMessage(event.title, r.label, event.start_at);
              await pool.query(
                `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [String(event.agent_id), 'Rappel agenda', 'event_reminder', message, String(event.id), `EVENT-${event.id}`]
              );
              results.notified++;
            }

            const idx = updated.indexOf(r);
            if (idx >= 0) updated[idx] = { ...r, sent: true };
            changed = true;
          } catch (e) {
            console.error(`[CALENDAR-CRON] Failed to send reminder for event ${event.id}:`, e);
            results.errors++;
          }
        }
      }

      if (changed) {
        await pool.query(
          'UPDATE calendar_events SET reminders = $1 WHERE id = $2',
          [JSON.stringify(updated), event.id]
        );
      }
    }
  } catch (error) {
    console.error('[CALENDAR-CRON] Calendar reminder check error:', error);
    throw error;
  }

  return results;
}
