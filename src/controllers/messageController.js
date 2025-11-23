const Message = require('../models/message');
const User = require('../models/User');

// Show messages page with conversations list
exports.messagesPage = async (req, res) => {
  try {
    const conversations = await Message.getConversationsList(req.user.id);
    const unreadCount = await Message.getUnreadCount(req.user.id);

    res.render('user/messages', {
      user: req.user,
      conversations,
      unreadCount,
      selectedUser: null,
      messages: [],
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Messages page error:', error);
    res.render('user/messages', {
      user: req.user,
      conversations: [],
      unreadCount: 0,
      selectedUser: null,
      messages: [],
      error: 'Failed to load messages',
      success: null
    });
  }
};

// Show conversation with specific user
exports.conversationPage = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId
    if (!userId || userId === 'new') {
      return res.redirect('/messages');
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.redirect('/messages');
    }

    // Mark messages as read
    await Message.markAsRead(req.user.id, userId);

    const messages = await Message.getConversation(req.user.id, userId);
    const conversations = await Message.getConversationsList(req.user.id);
    const unreadCount = await Message.getUnreadCount(req.user.id);

    res.render('user/messages', {
      user: req.user,
      conversations,
      unreadCount,
      selectedUser: otherUser,
      messages,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Conversation error:', error);
    res.redirect('/messages');
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, message } = req.body;

    if (!receiver_id || !message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid message' 
      });
    }

    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const newMessage = await Message.create({
      sender_id: req.user.id,
      receiver_id: receiver_id,
      message: message.trim()
    });

    res.json({ 
      success: true, 
      message: newMessage 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message' 
    });
  }
};

// Get new messages (for AJAX polling)
exports.getNewMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { lastMessageId } = req.query;

    const messages = await Message.getConversation(req.user.id, userId, 50);
    
    // Filter messages newer than lastMessageId
    const newMessages = lastMessageId 
      ? messages.filter(m => m.id > parseInt(lastMessageId))
      : messages;

    // Mark as read
    await Message.markAsRead(req.user.id, userId);

    const unreadCount = await Message.getUnreadCount(req.user.id);

    res.json({ 
      success: true, 
      messages: newMessages,
      unreadCount 
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.json({ 
      success: false, 
      error: 'Failed to get messages',
      messages: []
    });
  }
};

// Start new conversation
exports.newConversationPage = async (req, res) => {
  try {
    const allUsers = await User.getAll();
    const conversations = await Message.getConversationsList(req.user.id);
    const unreadCount = await Message.getUnreadCount(req.user.id);

    // Filter out current user and admins
    const users = allUsers.filter(u => u.id !== req.user.id && !u.is_admin);

    res.render('user/new-conversation', {
      user: req.user,
      users: users,
      conversations,
      unreadCount,
      error: null
    });
  } catch (error) {
    console.error('New conversation error:', error);
    res.render('user/new-conversation', {
      user: req.user,
      users: [],
      conversations: [],
      unreadCount: 0,
      error: 'Failed to load users'
    });
  }
};