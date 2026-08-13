import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getConversations,
  getConversation,
  getMessages,
  createConversation,
  sendMessage,
  markConversationRead,
  deleteConversation,
  clearConversation,
  toggleReaction,
  uploadVoice,
  uploadAttachment,
  deleteMessages,
  listMessageUsers,
  addGroupMembers,
  removeGroupMembers,
  getMessagingSettingsController,
  updateMessagingSettingsController,
} from '../controllers/message.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const voiceStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'voice'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `voice-${req.user.id}-${Date.now()}${ext}`);
  }
});
const uploadVoiceFile = multer({ storage: voiceStorage, limits: { fileSize: 25 * 1024 * 1024 } });

const attachmentStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'attachments'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `att-${req.user.id}-${Date.now()}${ext}`);
  }
});
const uploadAttachmentFile = multer({ storage: attachmentStorage, limits: { fileSize: 1024 * 1024 * 1024 } });

const router = express.Router();

router.get('/settings', verifyToken, getMessagingSettingsController);
router.put('/settings', verifyToken, updateMessagingSettingsController);
router.get('/users', verifyToken, listMessageUsers);
router.post('/voice/upload', verifyToken, uploadVoiceFile.single('audio'), uploadVoice);
router.post('/attachments/upload', verifyToken, uploadAttachmentFile.single('file'), uploadAttachment);
router.get('/conversations', verifyToken, getConversations);
router.post('/conversations', verifyToken, createConversation);
router.get('/conversations/:id', verifyToken, getConversation);
router.get('/conversations/:id/messages', verifyToken, getMessages);
router.post('/conversations/:id/messages', verifyToken, sendMessage);
router.post('/conversations/:id/members', verifyToken, addGroupMembers);
router.post('/conversations/:id/members/remove', verifyToken, removeGroupMembers);
router.post('/conversations/:id/messages/batch-delete', verifyToken, deleteMessages);
router.post('/conversations/:id/messages/:messageId/reactions', verifyToken, toggleReaction);
router.post('/conversations/:id/clear', verifyToken, clearConversation);
router.patch('/conversations/:id/read', verifyToken, markConversationRead);
router.delete('/conversations/:id', verifyToken, deleteConversation);

export default router;
