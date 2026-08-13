import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { isAdminPanelRole } from '../config/roles.js';
import { isPrivatePropertyDocument } from '../services/propertyDocs.service.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

// Mounted before the public /uploads static handler on /uploads/properties.
// Any file referenced by a private node in a property's fileTree can only be
// served to an authenticated admin/gérant; everything else (photos, videos,
// public documents) passes through untouched.
export async function protectPrivatePropertyDocuments(req, res, next) {
  const filename = decodeURIComponent((req.path || '').replace(/^\/+/, ''));
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(404).json({ error: 'Not found' });
  }
  let isPrivate = false;
  try {
    isPrivate = await isPrivatePropertyDocument(filename);
  } catch (error) {
    return next();
  }
  if (!isPrivate) return next();

  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(403).json({ error: 'Access denied. This document is private.' });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (isAdminPanelRole(decoded.role)) return next();
  } catch (error) {
    // invalid token falls through to denial
  }
  return res.status(403).json({ error: 'Access denied. This document is private.' });
}
