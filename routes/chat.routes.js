const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middleware/auth');

// Get all chat sessions for the authenticated user
router.get('/chats', auth, chatController.getUserChats);

// Get chat history for a specific chat
router.get('/chats/:chatId/messages', auth, chatController.getChatHistory);

module.exports = router;
