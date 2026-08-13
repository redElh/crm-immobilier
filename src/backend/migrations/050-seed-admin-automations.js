export async function up(pg) {
  // — Agent inactif 30j —
  const agent30 = await pg.query("SELECT id FROM automators WHERE event_id = 'admin_agent_inactif_30j'");
  let agent30Id;
  if (agent30.rows.length === 0) {
    const result = await pg.query(
      `INSERT INTO automators (event_id, niveau, niveau_label, created_by, actif, frequence)
       VALUES ('admin_agent_inactif_30j', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING id`
    );
    agent30Id = result.rows[0].id;
  } else {
    agent30Id = agent30.rows[0].id;
  }
  // Ensure notifications exist
  const notifs30 = await pg.query('SELECT id FROM automator_notifications WHERE automator_id = $1', [agent30Id]);
  if (notifs30.rows.length === 0) {
    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'email', true, 'fr', 'Agent inactif 30j - {{agent.prenom}} {{agent.nom}}', 'L''agent {{agent.prenom}} {{agent.nom}} ne s''est pas connect\u00e9 depuis 30 jours.\n\nEmail : {{agent.email}}\nDerni\u00e8re connexion : {{agent.derniere_connexion}}', ARRAY['agent'])`,
      [agent30Id]
    );
    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Agent inactif 30j - {{agent.prenom}} {{agent.nom}}', ARRAY['agent'])`,
      [agent30Id]
    );
  }

  // — Agent inactif 60j —
  const agent60 = await pg.query("SELECT id FROM automators WHERE event_id = 'admin_agent_inactif_60j'");
  let agent60Id;
  if (agent60.rows.length === 0) {
    const result = await pg.query(
      `INSERT INTO automators (event_id, niveau, niveau_label, created_by, actif, frequence)
       VALUES ('admin_agent_inactif_60j', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING id`
    );
    agent60Id = result.rows[0].id;
  } else {
    agent60Id = agent60.rows[0].id;
  }
  const notifs60 = await pg.query('SELECT id FROM automator_notifications WHERE automator_id = $1', [agent60Id]);
  if (notifs60.rows.length === 0) {
    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'email', true, 'fr', 'Agent inactif 60j - {{agent.prenom}} {{agent.nom}}', 'L''agent {{agent.prenom}} {{agent.nom}} ne s''est pas connect\u00e9 depuis 60 jours.\n\nEmail : {{agent.email}}\nDerni\u00e8re connexion : {{agent.derniere_connexion}}\n\nDes mesures doivent \u00eatre envisag\u00e9es.', ARRAY['agent'])`,
      [agent60Id]
    );
    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Agent inactif 60j - {{agent.prenom}} {{agent.nom}}', ARRAY['agent'])`,
      [agent60Id]
    );
  }
}

export async function down(pg) {
  await pg.query("DELETE FROM automator_notifications WHERE automator_id IN (SELECT id FROM automators WHERE event_id IN ('admin_agent_inactif_30j', 'admin_agent_inactif_60j'))");
  await pg.query("DELETE FROM automators WHERE event_id IN ('admin_agent_inactif_30j', 'admin_agent_inactif_60j')");
}
