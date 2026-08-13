export async function up(pg) {
  // Hard-delete all previously soft-deleted users
  await pg.query(
    `UPDATE login_history SET user_id = NULL, email = CONCAT('anonymized-', id, '@deleted.user')
     WHERE user_id IN (SELECT id FROM users WHERE status = 'supprimé')`
  );
  await pg.query("DELETE FROM users WHERE status = 'supprimé'");
}

export async function down(pg) {
  // No way to restore deleted users
}
