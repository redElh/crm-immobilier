import pool from '../config/db.js';

// Short-lived in-memory cache of which property-document filenames are private.
// Avoids scanning every property's fileTree on each static file request while
// keeping privacy toggles reflected quickly. Cleared on every documents save.
const privateCache = new Map();
const CACHE_TTL_MS = 30_000;

function findNode(nodes, url) {
  if (!Array.isArray(nodes)) return null;
  for (const n of nodes) {
    if (!n || typeof n !== 'object') continue;
    if (n.type === 'file' && n.url === url) return n;
    if (n.children) {
      const found = findNode(n.children, url);
      if (found) return found;
    }
  }
  return null;
}

export async function isPrivatePropertyDocument(filename) {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  const url = `/uploads/properties/${filename}`;
  const cached = privateCache.get(filename);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached.private;
  }
  let isPrivate = false;
  try {
    const { rows } = await pool.query('SELECT documents FROM properties WHERE documents IS NOT NULL');
    for (const row of rows) {
      const tree = row.documents && row.documents.fileTree;
      if (!Array.isArray(tree)) continue;
      const node = findNode(tree, url);
      if (node) {
        isPrivate = !!node.private;
        break;
      }
    }
  } catch (error) {
    console.error('Error checking private property document:', error);
  }
  privateCache.set(filename, { private: isPrivate, checkedAt: Date.now() });
  return isPrivate;
}

export function clearPropertyDocsCache() {
  privateCache.clear();
}
