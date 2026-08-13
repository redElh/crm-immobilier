import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.middleware.js';
import { isAdminPanelRole } from '../config/roles.js';
import { isPrivatePropertyDocument } from '../services/propertyDocs.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/files/property/:filename — authenticated serving of property files.
// Used by the in-app document viewer so previews carry the auth token and
// private documents stay locked to admins/gérants even outside the app UI.
router.get('/property/:filename', verifyToken, async (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  try {
    const isPrivate = await isPrivatePropertyDocument(filename);
    if (isPrivate && !isAdminPanelRole(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied. This document is private.' });
    }
  } catch (error) {
    console.error('Error checking private property document:', error);
  }
  const filePath = path.join(__dirname, '..', 'uploads', 'properties', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

export default router;
