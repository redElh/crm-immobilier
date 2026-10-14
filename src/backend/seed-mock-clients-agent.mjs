/**
 * Seed mock clients from src/data/mockClients.ts into owner_clients,
 * attached to a given agent (agent_id + agent_designe).
 *
 * Usage (run from src/backend so `pg` resolves):
 *   node seed-mock-clients-agent.mjs 6
 *   node seed-mock-clients-agent.mjs 6 --force   (insert even if email exists)
 *
 * Single source of truth: ../data/mockClients.ts (TypeScript). This script
 * strips the TS-only syntax, loads the mockClients map, and inserts each
 * record the same way client.controller.createClient does (known columns +
 * everything else in data JSONB), forcing agent_id / agent_designe.
 */
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KNOWN = new Set([
  'clientType', 'type', 'firstName', 'lastName', 'name', 'email', 'phone',
  'address', 'profession', 'companyName', 'legalForm', 'siren',
  'notes', 'status', 'statutMetier', 'agentId', 'agentDesigne',
  'mandatStatus', 'statutMandat', 'mandatId',
  'mandatPdfUrl', 'mandatPdfName',
  'docIdentiteUrl', 'docIdentiteName', 'docDomicileUrl', 'docDomicileName',
  'docRevenusUrl', 'docRevenusName', 'docFinancementUrl', 'docFinancementName',
  'docBancaireUrl', 'docBancaireName',
  'createdAt', 'updatedAt', 'createdBy',
]);

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') };
}

async function loadMockClients() {
  const tsPath = path.resolve(__dirname, '../data/mockClients.ts');
  const raw = fs.readFileSync(tsPath, 'utf8');
  // Keep only the mockClients map; drop everything from mockClientsList onwards.
  const cutMarker = 'export const mockClientsList';
  const cutIdx = raw.indexOf(cutMarker);
  const head = cutIdx === -1 ? raw : raw.slice(0, cutIdx);
  let js = head
    .replace(/import type[^\n]*\n/, '')
    .replace('export const mockClients: Record<string, Client> = ', 'export const mockClients = ');
  const tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mockclients-')), 'mockClients.mjs');
  fs.writeFileSync(tmpFile, js, 'utf8');
  const mod = await import(pathToFileURL(tmpFile).href);
  fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true });
  return mod.mockClients;
}

async function main() {
  const agentId = String(process.argv[2] || '');
  const force = process.argv.includes('--force');
  if (!agentId) {
    console.error('Usage: node seed-mock-clients-agent.mjs <agentId> [--force]');
    process.exit(1);
  }
  const pool = new pg.Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? undefined : { rejectUnauthorized: false } }
      : { user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT || 5432) },
  );
  try {
    const userRes = await pool.query('SELECT id, first_name, last_name, email FROM users WHERE id = $1', [agentId]);
    if (userRes.rows.length === 0) {
      console.error(`Agent/user id=${agentId} not found.`);
      process.exit(1);
    }
    const agent = userRes.rows[0];
    const agentName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim();
    console.log(`Seeding clients for agent ${agentId} (${agentName} <${agent.email}>)`);

    const mockClients = await loadMockClients();
    const records = Object.values(mockClients);
    console.log(`Loaded ${records.length} mock records from mockClients.ts`);

    let created = 0, skipped = 0, failed = 0;
    for (const rec of records) {
      try {
        if (!force) {
          const exists = await pool.query('SELECT id FROM owner_clients WHERE email = $1', [rec.email || '']);
          if (exists.rows.length > 0) {
            console.log(`SKIP  ${rec.type} ${rec.email} (already exists)`);
            skipped += 1;
            continue;
          }
        }
        const { firstName, lastName } = splitName(rec.name);
        const clientType = rec.type || '';
        const status = rec.status || 'Actif';
        const statutMetier = rec.statutMetier || '';
        const mandatStatus = rec.statutMandat || rec.mandatStatus || '';
        const extraData = {};
        for (const [k, v] of Object.entries(rec)) {
          if (!KNOWN.has(k) && k !== 'id') extraData[k] = v;
        }
        if (rec.name) extraData.name = rec.name;

        await pool.query(
          `INSERT INTO owner_clients (client_type, first_name, last_name, email, phone, address, profession, company_name, legal_form, siren, notes, status, statut_metier, agent_id, agent_designe, mandat_status, mandat_id, mandat_pdf_url, mandat_pdf_name, doc_identite_url, doc_identite_name, doc_domicile_url, doc_domicile_name, doc_revenus_url, doc_revenus_name, doc_financement_url, doc_financement_name, doc_bancaire_url, doc_bancaire_name, data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)`,
          [
            clientType, firstName, lastName, rec.email || '', rec.phone || '',
            rec.localisation || rec.area || rec.address || '', rec.profession || '', rec.societe || rec.companyName || '', rec.legalForm || '', rec.siren || '',
            rec.notes || '', status, statutMetier, agentId, agentName, mandatStatus, rec.mandatId || null,
            rec.mandatPdfUrl || '', rec.mandatPdfName || '',
            rec.docIdentiteUrl || '', rec.docIdentiteName || '',
            rec.docDomicileUrl || '', rec.docDomicileName || '',
            rec.docRevenusUrl || '', rec.docRevenusName || '',
            rec.docFinancementUrl || '', rec.docFinancementName || '',
            rec.docBancaireUrl || '', rec.docBancaireName || '',
            JSON.stringify(extraData),
          ],
        );
        console.log(`OK    ${clientType} ${rec.email}`);
        created += 1;
      } catch (e) {
        console.error(`FAIL  ${rec.email}: ${e.message}`);
        failed += 1;
      }
    }
    console.log(`\nDone for agent ${agentId}: ${created} created, ${skipped} skipped, ${failed} failed.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
