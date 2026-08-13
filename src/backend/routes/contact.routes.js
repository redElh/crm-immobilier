import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  duplicateContact,
} from '../controllers/contact.controller.js';

const router = express.Router();

router.get('/', verifyToken, getContacts);
router.get('/:id', verifyToken, getContactById);
router.post('/', verifyToken, createContact);
router.post('/:id/duplicate', verifyToken, duplicateContact);
router.put('/:id', verifyToken, updateContact);
router.delete('/:id', verifyToken, deleteContact);

export default router;
