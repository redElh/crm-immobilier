import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { checkAgentInactivityAndNotify } from '../services/inactivity.service.js';

function rowToAutomator(row) {
  return {
    id: row.id,
    modeleId: row.modele_id,
    eventId: row.event_id,
    niveau: row.niveau,
    niveauLabel: row.niveau_label,
    nomPersonnalise: row.nom_personnalise,
    createdBy: row.created_by,
    delegatedBy: row.delegated_by,
    delegatedTo: row.delegated_to,
    delegationType: row.delegation_type,
    actif: row.actif,
    frequence: row.frequence,
    derniereExecution: row.derniere_execution ? row.derniere_execution.toISOString() : undefined,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    notifications: [],
  };
}

function rowToNotification(row) {
  return {
    id: row.id,
    automatorId: row.automator_id,
    canal: row.canal,
    actif: row.actif,
    langue: row.langue,
    objetTemplate: row.objet_template,
    messageTemplate: row.message_template,
    destinataires: row.destinataires || [],
  };
}

function rowToTriggeredNotification(row) {
  return {
    id: String(row.id),
    eventId: row.event_id,
    eventLabel: row.event_label,
    categorie: row.categorie,
    channel: row.canal,
    title: row.titre,
    message: row.message,
    emailHtml: row.email_html,
    crmHtml: row.crm_html,
    readAt: row.read_at ? row.read_at.toISOString() : undefined,
    agentNom: row.agent_nom,
    bienTitre: row.bien_titre,
    clientNom: row.client_nom,
    clientType: row.client_type,
    mandatType: row.mandat_type,
    dateExpiration: row.date_expiration,
    dateTriggered: row.date_triggered ? row.date_triggered.toISOString() : '',
    read: row.read,
    createurRole: row.createur_role || '',
    bienType: row.bien_type || '',
  };
}

function rowToLog(row) {
  return {
    id: row.id,
    automatorId: row.automator_id,
    evenement: row.evenement,
    destinataire: row.destinataire,
    statut: row.statut,
    messageErreur: row.message_erreur,
    executeLe: row.execute_le ? row.execute_le.toISOString() : '',
    contenu: row.contenu,
  };
}

export async function getAutomators(req, res) {
  try {
    const result = await pool.query('SELECT * FROM automators ORDER BY created_at DESC');
    const automators = [];
    for (const row of result.rows) {
      const a = rowToAutomator(row);
      const notifResult = await pool.query('SELECT * FROM automator_notifications WHERE automator_id = $1 ORDER BY id', [row.id]);
      a.notifications = notifResult.rows.map(rowToNotification);
      automators.push(a);
    }
    res.json(automators);
  } catch (error) {
    console.error('Error fetching automators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAutomatorById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM automators WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automator not found' });
    }
    const a = rowToAutomator(result.rows[0]);
    const notifResult = await pool.query('SELECT * FROM automator_notifications WHERE automator_id = $1 ORDER BY id', [id]);
    a.notifications = notifResult.rows.map(rowToNotification);
    res.json(a);
  } catch (error) {
    console.error('Error fetching automator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createAutomator(req, res) {
  try {
    const {
      modeleId, eventId, niveau, niveauLabel, nomPersonnalise,
      createdBy, delegatedBy, delegatedTo, delegationType,
      actif, frequence, notifications,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO automators (modele_id, event_id, niveau, niveau_label, nom_personnalise, created_by, delegated_by, delegated_to, delegation_type, actif, frequence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [modeleId || 0, eventId || null, niveau || 'utilisateur', niveauLabel || '', nomPersonnalise || null, createdBy || '', delegatedBy || '', delegatedTo || '', delegationType || '', actif !== false, frequence || '']
    );

    const automator = rowToAutomator(result.rows[0]);

    if (Array.isArray(notifications)) {
      for (const n of notifications) {
        const nResult = await pool.query(
          `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [automator.id, n.canal || 'email', n.actif !== false, n.langue || 'fr', n.objetTemplate || null, n.messageTemplate || '', n.destinataires || []]
        );
        automator.notifications.push(rowToNotification(nResult.rows[0]));
      }
    }

    res.status(201).json(automator);
  } catch (error) {
    console.error('Error creating automator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAutomator(req, res) {
  try {
    const { id } = req.params;
    const {
      modeleId, eventId, niveau, niveauLabel, nomPersonnalise,
      createdBy, delegatedBy, delegatedTo, delegationType,
      actif, frequence, notifications,
    } = req.body;

    const result = await pool.query(
      `UPDATE automators SET
        modele_id = COALESCE($1, modele_id),
        event_id = $2,
        niveau = COALESCE($3, niveau),
        niveau_label = COALESCE($4, niveau_label),
        nom_personnalise = $5,
        created_by = COALESCE($6, created_by),
        delegated_by = COALESCE($7, delegated_by),
        delegated_to = COALESCE($8, delegated_to),
        delegation_type = COALESCE($9, delegation_type),
        actif = COALESCE($10, actif),
        frequence = COALESCE($11, frequence)
       WHERE id = $12 RETURNING *`,
      [
        modeleId, eventId !== undefined ? eventId : null, niveau, niveauLabel,
        nomPersonnalise !== undefined ? nomPersonnalise : null,
        createdBy, delegatedBy || '', delegatedTo || '', delegationType || '',
        actif !== undefined ? actif : null, frequence, id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automator not found' });
    }

    const automator = rowToAutomator(result.rows[0]);

    if (Array.isArray(notifications)) {
      await pool.query('DELETE FROM automator_notifications WHERE automator_id = $1', [id]);
      for (const n of notifications) {
        const nResult = await pool.query(
          `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [id, n.canal || 'email', n.actif !== false, n.langue || 'fr', n.objetTemplate || null, n.messageTemplate || '', n.destinataires || []]
        );
        automator.notifications.push(rowToNotification(nResult.rows[0]));
      }
    } else {
      const notifResult = await pool.query('SELECT * FROM automator_notifications WHERE automator_id = $1 ORDER BY id', [id]);
      automator.notifications = notifResult.rows.map(rowToNotification);
    }

    res.json(automator);
  } catch (error) {
    console.error('Error updating automator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function toggleAutomator(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE automators SET actif = NOT actif WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automator not found' });
    }
    const automator = rowToAutomator(result.rows[0]);
    const notifResult = await pool.query('SELECT * FROM automator_notifications WHERE automator_id = $1 ORDER BY id', [id]);
    automator.notifications = notifResult.rows.map(rowToNotification);
    res.json(automator);
  } catch (error) {
    console.error('Error toggling automator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAutomator(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM automators WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automator not found' });
    }
    res.json({ message: 'Automator deleted', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting automator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAutomatorLogs(req, res) {
  try {
    const { automatorId } = req.params;
    let sql = 'SELECT * FROM automator_logs';
    const params = [];
    if (automatorId && automatorId !== 'all') {
      params.push(automatorId);
      sql += ` WHERE automator_id = $${params.length}`;
    }
    sql += ' ORDER BY execute_le DESC LIMIT 200';
    const result = await pool.query(sql, params);
    res.json(result.rows.map(rowToLog));
  } catch (error) {
    console.error('Error fetching automator logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createAutomatorLog(req, res) {
  try {
    const { automatorId, evenement, destinataire, statut, messageErreur, contenu } = req.body;
    const result = await pool.query(
      `INSERT INTO automator_logs (automator_id, evenement, destinataire, statut, message_erreur, contenu)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [automatorId || 0, evenement || '', destinataire || '', statut || 'en_attente', messageErreur || null, contenu || null]
    );

    if (automatorId && automatorId > 0) {
      await pool.query(
        `UPDATE automators SET derniere_execution = NOW() WHERE id = $1`,
        [automatorId]
      );
    }

    res.status(201).json(rowToLog(result.rows[0]));
  } catch (error) {
    console.error('Error creating automator log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTriggeredNotifications(req, res) {
  try {
    await pool.query(
      `DELETE FROM automator_triggered_notifications
       WHERE read = true AND (read_at IS NULL OR read_at < NOW() - INTERVAL '30 minutes')`
    );
    const result = await pool.query(
      `SELECT * FROM automator_triggered_notifications
       WHERE read = false OR read_at IS NULL OR read_at >= NOW() - INTERVAL '30 minutes'
       ORDER BY date_triggered DESC LIMIT 200`
    );
    res.json(result.rows.map(rowToTriggeredNotification));
  } catch (error) {
    console.error('Error fetching triggered notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTriggeredNotification(req, res) {
  try {
    const {
      eventId, eventLabel, categorie, channel, title, message,
      emailHtml, crmHtml, agentNom, bienTitre, clientNom,
      clientType, mandatType, dateExpiration,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO automator_triggered_notifications
       (event_id, event_label, categorie, canal, titre, message, email_html, crm_html,
        agent_nom, bien_titre, client_nom, client_type, mandat_type, date_expiration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        eventId || '', eventLabel || '', categorie || '', channel || 'crm', title || '', message || '',
        emailHtml || null, crmHtml || null,
        agentNom || '', bienTitre || '', clientNom || '',
        clientType || '', mandatType || '', dateExpiration || '',
      ]
    );

    await pool.query(
      `UPDATE automators SET derniere_execution = NOW() WHERE event_id = $1 AND actif = true`,
      [eventId || '']
    );

    res.status(201).json(rowToTriggeredNotification(result.rows[0]));
  } catch (error) {
    console.error('Error creating triggered notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE automator_triggered_notifications SET read = true, read_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(rowToTriggeredNotification(result.rows[0]));
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await pool.query(
      `UPDATE automator_triggered_notifications SET read = true, read_at = NOW() WHERE read = false`
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function triggerInactivityCheck(req, res) {
  try {
    const results = await checkAgentInactivityAndNotify();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error triggering inactivity check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function seedDefaultAutomations(req, res) {
  try {
    const seeded = [];

    // — Mandat expiré —
    const mandatExists = await pool.query("SELECT id FROM automators WHERE event_id = 'vendeur_mandat_expire'");
    if (mandatExists.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO automators (id, modele_id, event_id, niveau, niveau_label, created_by, actif, frequence)
         VALUES (104, 8, 'vendeur_mandat_expire', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING *`
      );

      await pool.query(
        `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
         VALUES ($1, 'email', true, 'fr', 'Mandat expir\u00e9 - {{bien.titre}}', 'Le mandat pour {{bien.titre}} est expir\u00e9.\n\nClient : {{client.prenom}} {{client.nom}}\nType de mandat : {{mandat.type}}\nDate d''expiration : {{mandat.date_expiration}}\nStatut : Expir\u00e9\n\nMerci de prendre les dispositions n\u00e9cessaires.', ARRAY['agent'])`,
        [result.rows[0].id]
      );

      await pool.query(
        `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
         VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Mandat expir\u00e9 - {{bien.titre}}', ARRAY['agent'])`,
        [result.rows[0].id]
      );
      seeded.push('vendeur_mandat_expire');
    }

    // — Agent inactif 30j —
    const agent30Exists = await pool.query("SELECT id FROM automators WHERE event_id = 'admin_agent_inactif_30j'");
    if (agent30Exists.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO automators (id, modele_id, event_id, niveau, niveau_label, created_by, actif, frequence)
         VALUES (105, 9, 'admin_agent_inactif_30j', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING *`
      );

      await pool.query(
        `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
         VALUES ($1, 'email', true, 'fr', 'Agent inactif 30j - {{agent.prenom}} {{agent.nom}}', 'L''agent {{agent.prenom}} {{agent.nom}} ne s''est pas connect\u00e9 depuis 30 jours.\n\nEmail : {{agent.email}}\nDerni\u00e8re connexion : {{agent.derniere_connexion}}', ARRAY['agent'])`,
        [result.rows[0].id]
      );

      await pool.query(
        `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
         VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Agent inactif 30j - {{agent.prenom}} {{agent.nom}}', ARRAY['agent'])`,
        [result.rows[0].id]
      );
      seeded.push('admin_agent_inactif_30j');
    }

    // — Agent inactif 60j —
    const agent60Exists = await pool.query("SELECT id FROM automators WHERE event_id = 'admin_agent_inactif_60j'");
    if (agent60Exists.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO automators (id, modele_id, event_id, niveau, niveau_label, created_by, actif, frequence)
         VALUES (106, 10, 'admin_agent_inactif_60j', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING *`
      );

      await pool.query(
        `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
         VALUES ($1, 'email', true, 'fr', 'Agent inactif 60j - {{agent.prenom}} {{agent.nom}}', 'L''agent {{agent.prenom}} {{agent.nom}} ne s''est pas connect\u00e9 depuis 60 jours.\n\nEmail : {{agent.email}}\nDerni\u00e8re connexion : {{agent.derniere_connexion}}\n\nDes mesures doivent \u00eatre envisag\u00e9es.', ARRAY['agent'])`,
        [result.rows[0].id]
      );

      await pool.query(
        `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
         VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Agent inactif 60j - {{agent.prenom}} {{agent.nom}}', ARRAY['agent'])`,
        [result.rows[0].id]
      );
      seeded.push('admin_agent_inactif_60j');
    }

    if (seeded.length === 0) {
      return res.json({ message: 'Default automations already seeded' });
    }

    const aResult = await pool.query('SELECT * FROM automators WHERE id = $1', [104]);
    const a = rowToAutomator(aResult.rows[0]);
    const notifResult = await pool.query('SELECT * FROM automator_notifications WHERE automator_id = $1 ORDER BY id', [a.id]);
    a.notifications = notifResult.rows.map(rowToNotification);

    res.status(201).json({ message: `Default automations seeded: ${seeded.join(', ')}`, automator: a });
  } catch (error) {
    console.error('Error seeding default automations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function seedInactiveAgent(req, res) {
  try {
    const email = `test.inactif.${Date.now()}@squaremeter.ma`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    const soixanteCinqJours = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000);
    const trenteCinqJours = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, role, status, is_active, last_login_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, first_name, last_name, email, role, status, last_login_at`,
      ['Test', `Inactif${Date.now()}`, email, hashedPassword, 'agent', 'actif', true, soixanteCinqJours, trenteCinqJours, trenteCinqJours]
    );

    const agent = result.rows[0];

    // Clear any previous triggered notifications for this agent name to allow re-testing
    const agentName = `${agent.first_name} ${agent.last_name}`;
    await pool.query(
      `DELETE FROM automator_triggered_notifications WHERE agent_nom = $1`,
      [agentName]
    );

    res.status(201).json({
      success: true,
      message: `Agent test créé : ${agent.first_name} ${agent.last_name} (${agent.email}) — dernière connexion il y a 65 jours`,
      agent: {
        id: agent.id,
        firstName: agent.first_name,
        lastName: agent.last_name,
        email: agent.email,
        lastLoginAt: agent.last_login_at,
      },
    });
  } catch (error) {
    console.error('Error seeding inactive agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
