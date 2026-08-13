// Backfill location_saisonnière contracts and linked registre entries
// for voyageur clients so the contract detail / registre pages show
// property, amount, dates and agent info for already-created reservations.
export async function up(pg) {
  // Link contracts missing a property to the client's latest reservation
  await pg.query(`
    UPDATE contracts c
    SET property_id = r.property_id,
        property_title = COALESCE(NULLIF(c.property_title, ''), p.title, c.property_title),
        property_ref = COALESCE(NULLIF(c.property_ref, ''), p.reference, c.property_ref),
        amount = COALESCE(c.amount, r.grand_total),
        start_date = COALESCE(c.start_date, r.start_date),
        end_date = COALESCE(c.end_date, r.end_date),
        updated_at = NOW()
    FROM reservations r
    LEFT JOIN properties p ON p.id = r.property_id
    WHERE c.contract_type = 'location_saisonniere'
      AND c.property_id IS NULL
      AND r.client_id = c.client_id
      AND r.id = (
        SELECT r2.id FROM reservations r2
        WHERE r2.client_id = c.client_id
        ORDER BY r2.created_at DESC, r2.id DESC
        LIMIT 1
      )
  `);

  // Fill registre entries for voyageurs from their linked contract
  await pg.query(`
    UPDATE registre re
    SET property_id = COALESCE(re.property_id, c.property_id),
        property_title = COALESCE(NULLIF(re.property_title, ''), c.property_title, re.property_title),
        property_ref = COALESCE(NULLIF(re.property_ref, ''), c.property_ref, re.property_ref),
        montant = COALESCE(NULLIF(re.montant, ''), c.amount::text, re.montant),
        date_contrat = COALESCE(re.date_contrat, DATE(c.created_at)),
        agent_id = COALESCE(NULLIF(re.agent_id, ''), c.agent_id, re.agent_id),
        agent_name = COALESCE(NULLIF(re.agent_name, ''), c.agent_name, re.agent_name),
        updated_at = NOW()
    FROM contracts c
    WHERE re.client_id = c.client_id
      AND re.type = 'location_saisonniere'
      AND c.contract_type = 'location_saisonniere'
      AND re.id = (
        SELECT re2.id FROM registre re2
        WHERE re2.client_id = c.client_id
        ORDER BY re2.created_at DESC, re2.id DESC
        LIMIT 1
      )
      AND (re.montant IS NULL OR re.montant = '' OR re.date_contrat IS NULL
        OR re.property_id IS NULL OR re.agent_id IS NULL OR re.agent_id = '')
  `);

  // Align registre agent names with the users table (matches the register filters)
  await pg.query(`
    UPDATE registre re
    SET agent_name = TRIM(u.first_name || ' ' || u.last_name), updated_at = NOW()
    FROM users u
    WHERE re.agent_id IS NOT NULL AND re.agent_id <> '' AND re.agent_id ~ '^[0-9]+$'
      AND u.id = re.agent_id::int
      AND TRIM(u.first_name || ' ' || u.last_name) IS DISTINCT FROM re.agent_name
  `);
}

export async function down(pg) {
  // No-op: backfill is idempotent and only repairs data.
}
