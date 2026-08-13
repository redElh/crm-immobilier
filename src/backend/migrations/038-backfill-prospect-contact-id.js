export async function up(client) {
  await client.query(`
    UPDATE prospects p
    SET contact_id = c.id::text
    FROM contacts c
    WHERE c.original_prospect_id = p.id::text
      AND p.status = 'Converti'
      AND p.contact_id IS NULL
  `);
}
