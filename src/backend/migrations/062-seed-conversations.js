export async function up(pg) {
  const admin = await pg.query(`SELECT id FROM users WHERE email = 'redaelhiri9@gmail.com'`);
  const agent = await pg.query(`SELECT id FROM users WHERE email = 'ridaelhiri6@gmail.com'`);
  if (!admin.rows[0] || !agent.rows[0]) return;

  const adminId = admin.rows[0].id;
  const agentId = agent.rows[0].id;

  const { rows } = await pg.query(`SELECT COUNT(*)::int AS count FROM conversations`);
  if (rows[0].count > 0) return;

  const hoursAgo = (h) => new Date(Date.now() - h * 3600000);

  async function seedConversation(participants, messages) {
    const lastTs = messages[messages.length - 1].ts;
    const { rows: [conv] } = await pg.query(
      `INSERT INTO conversations (type, created_by, last_message_at) VALUES ('direct', $1, $2) RETURNING id`,
      [participants[0].id, lastTs]
    );
    for (const p of participants) {
      await pg.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES ($1, $2, $3)`,
        [conv.id, p.id, p.readAt || lastTs]
      );
    }
    for (const m of messages) {
      await pg.query(
        `INSERT INTO messages (conversation_id, sender_id, body, kind, created_at) VALUES ($1, $2, $3, 'text', $4)`,
        [conv.id, m.sender, m.body, m.ts]
      );
    }
    return conv.id;
  }

  // Conversation 1 — déploiement des outils CRM (tout est lu)
  await seedConversation(
    [
      { id: adminId, readAt: hoursAgo(0) },
      { id: agentId, readAt: hoursAgo(0) },
    ],
    [
      { sender: adminId, body: 'Bonjour Rachid, comment se passe le déploiement des nouveaux outils CRM ? On se fait un point cette semaine.', ts: hoursAgo(72) },
      { sender: agentId, body: 'Bonjour Rida, tout avance bien. Je suis disponible pour un point jeudi matin.', ts: hoursAgo(48) },
      { sender: adminId, body: 'Parfait, je vous envoie l\'invitation pour jeudi à 10h.', ts: hoursAgo(24) },
    ]
  );

  // Conversation 2 — nouveau mandat (1 non lu pour l'agent)
  await seedConversation(
    [
      { id: adminId, readAt: hoursAgo(0) },
      { id: agentId, readAt: hoursAgo(6) },
    ],
    [
      { sender: agentId, body: 'Rida, j\'ai une nouvelle maison sous mandat à Casablanca. Voulez-vous que je la mette en avant sur le site ?', ts: hoursAgo(5) },
      { sender: adminId, body: 'Oui, excellente idée. Envoyez-moi les photos et je l\'ajoute au dossier marketing.', ts: hoursAgo(1) },
    ]
  );
}

export async function down(pg) {
  await pg.query(`DELETE FROM conversations`);
}
