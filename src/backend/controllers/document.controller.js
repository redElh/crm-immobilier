import pool from '../config/db.js';
import { stat, unlink, readFile } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { sendDocumentEmail } from '../services/email.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Maps the docKey used in composite IDs to DB column pairs in owner_clients
const CLIENT_DOC_COLUMNS = {
  identite:    { url: 'doc_identite_url',    name: 'doc_identite_name' },
  domicile:    { url: 'doc_domicile_url',    name: 'doc_domicile_name' },
  revenus:     { url: 'doc_revenus_url',     name: 'doc_revenus_name' },
  financement: { url: 'doc_financement_url', name: 'doc_financement_name' },
  bancaire:    { url: 'doc_bancaire_url',    name: 'doc_bancaire_name' },
  mandat:      { url: 'mandat_pdf_url',      name: 'mandat_pdf_name' },
};

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

async function getFileSize(url) {
  if (!url) return '';
  try {
    const filePath = join(__dirname, '..', url);
    const info = await stat(filePath);
    return formatFileSize(info.size);
  } catch {
    return '';
  }
}

function flattenFileTree(nodes, parentPath, propertyId, propertyName, createdBy) {
  const results = [];
  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.type === 'folder' && node.children) {
      results.push(...flattenFileTree(node.children, currentPath, propertyId, propertyName, createdBy));
    } else if (node.type === 'file') {
      results.push({
        id: `prop-${propertyId}-${node.id}`,
        name: node.name,
        type: 'file',
        category: guessCategory(node.name),
        entityType: 'property',
        entityId: String(propertyId),
        entityName: propertyName,
        folderPath: parentPath || '',
        date: node.createdAt || new Date().toISOString().slice(0, 10),
        size: node.size || undefined,
        url: node.url || undefined,
        createdBy: createdBy || '',
      });
    }
  }
  return results;
}

function guessCategory(filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.includes('dpe') || lower.includes('diagnostic') || lower.includes('constat')) return 'diagnostic';
  if (lower.includes('titre') || lower.includes('cadastr') || lower.includes('juridique') || lower.includes('notari')) return 'juridique';
  if (lower.includes('plan') || lower.includes('etude') || lower.includes('technique') || lower.includes('metre')) return 'technique';
  if (lower.includes('brochure') || lower.includes('photo') || lower.includes('visite') || lower.includes('marketing')) return 'marketing';
  if (lower.includes('video') || lower.includes('media')) return 'media';
  if (lower.includes('contrat') || lower.includes('mandat') || lower.includes('compromis') || lower.includes('acte')) return 'contrat';
  return 'autre';
}

function clientDocCategory(docType) {
  switch (docType) {
    case 'identite': return 'identite';
    case 'domicile': return 'identite';
    case 'revenus': return 'financier';
    case 'financement': return 'financier';
    case 'bancaire': return 'financier';
    case 'mandat': return 'mandat';
    default: return 'autre';
  }
}

function clientDocType(docType) {
  switch (docType) {
    case 'identite': return 'identity';
    case 'domicile': return 'proof_address';
    case 'revenus': return 'payslip';
    case 'financement': return 'financial';
    case 'bancaire': return 'bank_statement';
    case 'mandat': return 'mandate_sale';
    default: return 'other';
  }
}

export async function getDocuments(req, res) {
  try {
    const { agent_id } = req.query;

    const clientDocs = [];
    const propertyDocs = [];

    // Fetch client documents
    let clientSql = `SELECT id, first_name, last_name, client_type, agent_id,
      doc_identite_url, doc_identite_name,
      doc_domicile_url, doc_domicile_name,
      doc_revenus_url, doc_revenus_name,
      doc_financement_url, doc_financement_name,
      doc_bancaire_url, doc_bancaire_name,
      mandat_pdf_url, mandat_pdf_name
      FROM owner_clients`;
    const clientParams = [];
    if (agent_id) {
      clientSql += ' WHERE agent_id = $1';
      clientParams.push(agent_id);
    }
    const { rows: clients } = await pool.query(clientSql, clientParams);

    for (const row of clients) {
      const clientName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Nouveau client';
      const agentId = row.agent_id || '';

      const docPairs = [
        { url: row.doc_identite_url, name: row.doc_identite_name, key: 'identite' },
        { url: row.doc_domicile_url, name: row.doc_domicile_name, key: 'domicile' },
        { url: row.doc_revenus_url, name: row.doc_revenus_name, key: 'revenus' },
        { url: row.doc_financement_url, name: row.doc_financement_name, key: 'financement' },
        { url: row.doc_bancaire_url, name: row.doc_bancaire_name, key: 'bancaire' },
        { url: row.mandat_pdf_url, name: row.mandat_pdf_name, key: 'mandat' },
      ];

      for (const doc of docPairs) {
        if (doc.url && doc.name) {
          const size = await getFileSize(doc.url);
          clientDocs.push({
            id: `client-${row.id}-${doc.key}`,
            name: doc.name,
            type: clientDocType(doc.key),
            category: clientDocCategory(doc.key),
            entityType: 'client',
            entityId: String(row.id),
            entityName: clientName,
            date: new Date().toISOString().slice(0, 10),
            size: size || undefined,
            url: doc.url,
            createdBy: agentId,
          });
        }
      }
    }

    // Fetch property documents (fileTree)
    let propSql = `SELECT id, title, agent_id, documents FROM properties`;
    const propParams = [];
    if (agent_id) {
      propSql += ' WHERE agent_id = $1';
      propParams.push(agent_id);
    }
    const { rows: properties } = await pool.query(propSql, propParams);

    for (const row of properties) {
      const docs = row.documents;
      if (docs && typeof docs === 'object' && !Array.isArray(docs) && Array.isArray(docs.fileTree) && docs.fileTree.length > 0) {
        const flattened = flattenFileTree(
          docs.fileTree, '', row.id, row.title || 'Sans titre', row.agent_id || ''
        );
        for (const doc of flattened) {
          if (!doc.size && doc.url) {
            doc.size = await getFileSize(doc.url) || undefined;
          }
        }
        propertyDocs.push(...flattened);
      }
    }

    const allDocuments = [...clientDocs, ...propertyDocs];
    res.json(allDocuments);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
}

function removeNodeById(nodes, nodeId) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === nodeId) return nodes.splice(i, 1)[0];
    if (node.type === 'folder' && node.children) {
      const removed = removeNodeById(node.children, nodeId);
      if (removed) {
        if (node.children.length === 0) delete node.children;
        return removed;
      }
    }
  }
  return null;
}

async function unlinkIfExists(url) {
  if (!url) return;
  try {
    const filePath = join(__dirname, '..', url);
    await unlink(filePath);
  } catch { /* file may not exist on disk — ignore */ }
}

export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;

    // ── Client document: "client-{clientId}-{docKey}" ──
    if (id.startsWith('client-')) {
      const parts = id.split('-');
      const clientId = parts[1];
      const docKey = parts.slice(2).join('-'); // safe for keys like "financement"
      const cols = CLIENT_DOC_COLUMNS[docKey];
      if (!cols) return res.status(400).json({ error: 'Type de document client inconnu' });

      const { rows } = await pool.query(
        `SELECT ${cols.url}, ${cols.name} FROM owner_clients WHERE id = $1`,
        [clientId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Client introuvable' });

      const row = rows[0];
      const fileUrl = row[cols.url];
      if (fileUrl) await unlinkIfExists(fileUrl);

      await pool.query(
        `UPDATE owner_clients SET ${cols.url} = '', ${cols.name} = '' WHERE id = $1`,
        [clientId]
      );
      return res.json({ success: true });
    }

    // ── Property document: "prop-{propertyId}-{nodeId}" ──
    if (id.startsWith('prop-')) {
      const rest = id.slice(5); // after "prop-"
      const dashIdx = rest.indexOf('-');
      const propertyId = rest.slice(0, dashIdx);
      const nodeId = rest.slice(dashIdx + 1);

      const { rows } = await pool.query('SELECT documents FROM properties WHERE id = $1', [propertyId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Bien introuvable' });

      const docs = rows[0].documents;
      const fileTree = docs?.fileTree || [];
      const removed = removeNodeById(fileTree, nodeId);
      if (!removed) return res.status(404).json({ error: 'Document introuvable dans l\'arborescence' });

      if (removed.url) await unlinkIfExists(removed.url);

      await pool.query(
        'UPDATE properties SET documents = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify({ fileTree }), propertyId]
      );
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Format d\'identifiant de document invalide' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du document' });
  }
}

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain', '.csv': 'text/csv',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime',
  '.zip': 'application/zip',
};

function getMimeType(filename) {
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export async function sendDocumentEmailHandler(req, res) {
  try {
    const { to, subject, message, documents, senderName } = req.body;
    if (!to) return res.status(400).json({ error: 'Destinataire requis' });
    if (!documents || !documents.length) return res.status(400).json({ error: 'Aucun document sélectionné' });

    const attachments = [];
    for (const doc of documents) {
      if (!doc.url) continue;
      try {
        const filePath = join(__dirname, '..', doc.url);
        const buffer = await readFile(filePath);
        attachments.push({
          filename: doc.name,
          content: buffer,
          contentType: getMimeType(doc.name),
        });
      } catch {}
    }

    if (!attachments.length) return res.status(400).json({ error: 'Aucun fichier trouvé sur le serveur' });

    await sendDocumentEmail({ to, subject, message, senderName, attachments });
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending document email:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
}
