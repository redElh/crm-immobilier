export async function up(pg) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS message_reactions (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji VARCHAR(32) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (message_id, user_id, emoji)
    )
  `);

  await pg.query('CREATE INDEX idx_message_reactions_message ON message_reactions (message_id)');
}

export async function down(pg) {
  await pg.query('DROP TABLE IF EXISTS message_reactions');
}
