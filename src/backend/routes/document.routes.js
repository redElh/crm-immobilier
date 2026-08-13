import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getDocuments, deleteDocument, sendDocumentEmailHandler } from '../controllers/document.controller.js';

const router = express.Router();

router.get('/', verifyToken, getDocuments);
router.delete('/:id', verifyToken, deleteDocument);
router.post('/send-email', verifyToken, sendDocumentEmailHandler);

export default router;
