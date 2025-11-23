const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.dashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const transactions = await Transaction.getByUserId(req.user.id, 10);
    const stats = await Transaction.getStats(req.user.id);

    res.render('user/dashboard', {
      user,
      transactions,
      stats,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('user/dashboard', {
      user: req.user,
      transactions: [],
      stats: {},
      error: 'Failed to load dashboard',
      success: null
    });
  }
};

exports.transactionsPage = async (req, res) => {
  try {
    const transactions = await Transaction.getByUserId(req.user.id, 100);
    res.render('user/transactions', {
      user: req.user,
      transactions,
      error: null
    });
  } catch (error) {
    console.error('Transactions error:', error);
    res.render('user/transactions', {
      user: req.user,
      transactions: [],
      error: 'Failed to load transactions'
    });
  }
};

exports.sendMoneyPage = async (req, res) => {
  res.render('user/send-money', {
    user: req.user,
    error: null,
    success: null
  });
};

exports.searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || email.length < 3) {
      return res.json([]);
    }

    const users = await User.searchByEmail(email);
    const filteredUsers = users.filter(u => u.id !== req.user.id);
    res.json(filteredUsers);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};