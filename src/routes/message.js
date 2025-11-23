const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// IMPORTANT: Specific routes BEFORE dynamic routes!
router.get('/messages/new', auth, messageController.newConversationPage);
router.get('/messages/poll/:userId', auth, messageController.getNewMessages);
router.get('/messages/:userId', auth, messageController.conversationPage);
router.get('/messages', auth, messageController.messagesPage);

// POST routes
router.post('/messages/send', auth, messageController.sendMessage);

module.exports = router;