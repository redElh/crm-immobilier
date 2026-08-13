export async function up(pg) {
  await pg.query(`
    CREATE TABLE conversations (
      id SERIAL PRIMARY KEY,
      type VARCHAR(10) NOT NULL DEFAULT 'direct',
      name VARCHAR(255),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query(`
    CREATE TABLE conversation_participants (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (conversation_id, user_id)
    )
  `);

  await pg.query(`
    CREATE TABLE messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      body TEXT NOT NULL DEFAULT '',
      kind VARCHAR(20) NOT NULL DEFAULT 'text',
      duration VARCHAR(10),
      attachment_name VARCHAR(255),
      attachment_size VARCHAR(20),
      is_internal_note BOOLEAN NOT NULL DEFAULT false,
      is_call BOOLEAN NOT NULL DEFAULT false,
      call_type VARCHAR(10),
      call_direction VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pg.query('CREATE INDEX idx_conversation_participants_user ON conversation_participants (user_id)');
  await pg.query('CREATE INDEX idx_messages_conversation ON messages (conversation_id)');
}

export async function down(pg) {
  await pg.query('DROP TABLE IF EXISTS messages');
  await pg.query('DROP TABLE IF EXISTS conversation_participants');
  await pg.query('DROP TABLE IF EXISTS conversations');
}
