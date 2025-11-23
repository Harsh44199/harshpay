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
// Show delete account page
exports.deleteAccountPage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.render('user/delete-account', {
      user,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Delete account page error:', error);
    res.redirect('/dashboard');
  }
};

// Process account deletion
exports.deleteAccount = async (req, res) => {
  const db = require('../config/database');
  const client = await db.pool.connect();
  
  try {
    const { password, confirmation } = req.body;
    const userId = req.user.id;

    // Check confirmation text
    if (confirmation !== 'DELETE') {
      const user = await User.findById(userId);
      return res.render('user/delete-account', {
        user,
        error: 'Please type DELETE to confirm',
        success: null
      });
    }

    // Verify password
    const user = await User.findByEmail(req.user.email);
    const isPasswordValid = await User.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.render('user/delete-account', {
        user: req.user,
        error: 'Invalid password',
        success: null
      });
    }

    // Check if user has balance
    if (parseFloat(user.balance) > 0) {
      return res.render('user/delete-account', {
        user,
        error: `Cannot delete account with balance ₹${user.balance}. Please transfer or withdraw all funds first.`,
        success: null
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Delete user's messages
    await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);

    // Soft delete transactions (keep for records, remove user reference)
    await client.query(
      'UPDATE transactions SET sender_id = NULL WHERE sender_id = $1',
      [userId]
    );
    await client.query(
      'UPDATE transactions SET receiver_id = NULL WHERE receiver_id = $1',
      [userId]
    );

    // Delete user account
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    // Clear cookie
    res.clearCookie('token');

    // Redirect to homepage with message
    res.redirect('/?deleted=true');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete account error:', error);
    
    const user = await User.findById(req.user.id);
    res.render('user/delete-account', {
      user,
      error: 'Failed to delete account. Please try again.',
      success: null
    });
  } finally {
    client.release();
  }
};