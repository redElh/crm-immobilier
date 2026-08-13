export async function up(pg) {
  const OLD_NAME = 'Rachid Baassid';
  const NEW_NAME = 'Mohammed Hilal';

  await pg.query(
    `UPDATE automators SET delegated_to = $1 WHERE delegated_to = $2`,
    [NEW_NAME, OLD_NAME]
  );
  await pg.query(
    `UPDATE automators SET created_by = $1 WHERE created_by = $2`,
    [NEW_NAME, OLD_NAME]
  );
  await pg.query(
    `UPDATE automator_triggered_notifications SET agent_nom = $1 WHERE agent_nom = $2`,
    [NEW_NAME, OLD_NAME]
  );
}

export async function down(pg) {
  const OLD_NAME = 'Rachid Baassid';
  const NEW_NAME = 'Mohammed Hilal';

  await pg.query(
    `UPDATE automators SET delegated_to = $1 WHERE delegated_to = $2`,
    [OLD_NAME, NEW_NAME]
  );
  await pg.query(
    `UPDATE automators SET created_by = $1 WHERE created_by = $2`,
    [OLD_NAME, NEW_NAME]
  );
  await pg.query(
    `UPDATE automator_triggered_notifications SET agent_nom = $1 WHERE agent_nom = $2`,
    [OLD_NAME, NEW_NAME]
  );
}
