export async function up(pg) {
  await pg.query(`
    UPDATE owner_clients c
    SET
      first_name = ct.first_name,
      last_name = ct.last_name,
      data = jsonb_set(
        COALESCE(c.data, '{}'::jsonb),
        '{name}',
        to_jsonb(TRIM(BOTH ' ' FROM ct.civility || ' ' || ct.first_name || ' ' || ct.last_name))
      )
    FROM contacts ct
    WHERE CAST(ct.id AS TEXT) = c.data->>'contactId'
      AND c.data->>'name' IN ('Nouveau client', '', 'Nouveau Acheteur', 'Nouveau Vendeur', 'Nouveau Bailleur', 'Nouveau Locataire', 'Nouveau Voyageur')
  `);
}

export async function down(pg) {
}
