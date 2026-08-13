export async function up(client) {
  await client.query('ALTER TABLE prospects ADD COLUMN IF NOT EXISTS contact_id VARCHAR');
}
