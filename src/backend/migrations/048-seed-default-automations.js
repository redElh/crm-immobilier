export async function up(pg) {
  // — Mandat expiré —
  const mandatExists = await pg.query("SELECT id FROM automators WHERE event_id = 'vendeur_mandat_expire'");
  if (mandatExists.rows.length === 0) {
    const result = await pg.query(
      `INSERT INTO automators (id, modele_id, event_id, niveau, niveau_label, created_by, actif, frequence)
       VALUES (104, 8, 'vendeur_mandat_expire', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING *`
    );

    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'email', true, 'fr', 'Mandat expir\u00e9 - {{bien.titre}}', 'Le mandat pour {{bien.titre}} est expir\u00e9.\n\nClient : {{client.prenom}} {{client.nom}}\nType de mandat : {{mandat.type}}\nDate d''expiration : {{mandat.date_expiration}}\nStatut : Expir\u00e9\n\nMerci de prendre les dispositions n\u00e9cessaires.', ARRAY['agent'])`,
      [result.rows[0].id]
    );

    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Mandat expir\u00e9 - {{bien.titre}}', ARRAY['agent'])`,
      [result.rows[0].id]
    );
  }

  // — Agent inactif 30j —
  const agent30Exists = await pg.query("SELECT id FROM automators WHERE event_id = 'admin_agent_inactif_30j'");
  if (agent30Exists.rows.length === 0) {
    const result = await pg.query(
      `INSERT INTO automators (id, modele_id, event_id, niveau, niveau_label, created_by, actif, frequence)
       VALUES (105, 9, 'admin_agent_inactif_30j', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING *`
    );

    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'email', true, 'fr', 'Agent inactif 30j - {{agent.prenom}} {{agent.nom}}', 'L''agent {{agent.prenom}} {{agent.nom}} ne s''est pas connect\u00e9 depuis 30 jours.\n\nEmail : {{agent.email}}\nDerni\u00e8re connexion : {{agent.derniere_connexion}}', ARRAY['agent'])`,
      [result.rows[0].id]
    );

    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Agent inactif 30j - {{agent.prenom}} {{agent.nom}}', ARRAY['agent'])`,
      [result.rows[0].id]
    );
  }

  // — Agent inactif 60j —
  const agent60Exists = await pg.query("SELECT id FROM automators WHERE event_id = 'admin_agent_inactif_60j'");
  if (agent60Exists.rows.length === 0) {
    const result = await pg.query(
      `INSERT INTO automators (id, modele_id, event_id, niveau, niveau_label, created_by, actif, frequence)
       VALUES (106, 10, 'admin_agent_inactif_60j', 'entreprise', 'Entreprise', 'system', true, 'Quotidienne') RETURNING *`
    );

    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'email', true, 'fr', 'Agent inactif 60j - {{agent.prenom}} {{agent.nom}}', 'L''agent {{agent.prenom}} {{agent.nom}} ne s''est pas connect\u00e9 depuis 60 jours.\n\nEmail : {{agent.email}}\nDerni\u00e8re connexion : {{agent.derniere_connexion}}\n\nDes mesures doivent \u00eatre envisag\u00e9es.', ARRAY['agent'])`,
      [result.rows[0].id]
    );

    await pg.query(
      `INSERT INTO automator_notifications (automator_id, canal, actif, langue, objet_template, message_template, destinataires)
       VALUES ($1, 'application_mobile', true, 'fr', NULL, 'Agent inactif 60j - {{agent.prenom}} {{agent.nom}}', ARRAY['agent'])`,
      [result.rows[0].id]
    );
  }
}

export async function down(pg) {
  await pg.query("DELETE FROM automator_notifications WHERE automator_id IN (104, 105, 106)");
  await pg.query("DELETE FROM automators WHERE id IN (104, 105, 106)");
}
