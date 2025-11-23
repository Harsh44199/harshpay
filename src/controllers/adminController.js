const User = require('../models/User');
const Transaction = require('../models/Transaction');
const db = require('../config/database');

exports.dashboard = async (req, res) => {
  try {
    const users = await User.getAll();
    const transactions = await Transaction.getAll(20);
    
    const totalUsers = users.length;
    const totalBalance = users.reduce((sum, user) => sum + parseFloat(user.balance), 0);
    
    res.render('admin/dashboard', {
      user: req.user,
      users,
      transactions,
      stats: {
        totalUsers,
        totalBalance
      },
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('admin/dashboard', {
      user: req.user,
      users: [],
      transactions: [],
      stats: {},
      error: 'Failed to load dashboard',
      success: null
    });
  }
};

exports.addMoneyPage = async (req, res) => {
  try {
    const users = await User.getAll();
    res.render('admin/add-money', {
      user: req.user,
      users,
      error: null,
      success: null
    });
  } catch (error) {
    res.render('admin/add-money', {
      user: req.user,
      users: [],
      error: 'Failed to load page',
      success: null
    });
  }
};

exports.addMoney = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { user_id, amount, description } = req.body;

    if (!user_id || !amount || amount <= 0) {
      const users = await User.getAll();
      return res.render('admin/add-money', {
        user: req.user,
        users,
        error: 'Invalid details',
        success: null
      });
    }

    await client.query('BEGIN');

    await User.updateBalance(user_id, amount, 'add');

    await Transaction.create({
      sender_id: null,
      receiver_id: user_id,
      amount,
      transaction_type: 'admin_credit',
      description: description || 'Money added by admin'
    });

    await client.query('COMMIT');

    const users = await User.getAll();
    const updatedUser = await User.findById(user_id);

    res.render('admin/add-money', {
      user: req.user,
      users,
      error: null,
      success: `Successfully added ₹${amount} to ${updatedUser.full_name}'s account`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add money error:', error);
    const users = await User.getAll();
    res.render('admin/add-money', {
      user: req.user,
      users,
      error: 'Failed to add money. Please try again.',
      success: null
    });
  } finally {
    client.release();
  }
};