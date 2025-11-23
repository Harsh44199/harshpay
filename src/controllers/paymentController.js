const User = require('../models/User');
const Transaction = require('../models/Transaction');
const db = require('../config/database');

exports.sendMoney = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { receiver_email, amount, description } = req.body;
    const senderId = req.user.id;

    if (!receiver_email || !amount || amount <= 0) {
      return res.render('user/send-money', {
        user: req.user,
        error: 'Invalid payment details',
        success: null
      });
    }

    const receiver = await User.findByEmail(receiver_email);
    if (!receiver) {
      return res.render('user/send-money', {
        user: req.user,
        error: 'Receiver not found',
        success: null
      });
    }

    if (receiver.id === senderId) {
      return res.render('user/send-money', {
        user: req.user,
        error: 'Cannot send money to yourself',
        success: null
      });
    }

    const sender = await User.findById(senderId);
    if (parseFloat(sender.balance) < parseFloat(amount)) {
      return res.render('user/send-money', {
        user: req.user,
        error: 'Insufficient balance',
        success: null
      });
    }

    await client.query('BEGIN');

    await User.updateBalance(senderId, amount, 'subtract');
    await User.updateBalance(receiver.id, amount, 'add');

    await Transaction.create({
      sender_id: senderId,
      receiver_id: receiver.id,
      amount,
      transaction_type: 'transfer',
      description: description || 'Money transfer'
    });

    await client.query('COMMIT');

    res.render('user/send-money', {
      user: await User.findById(senderId),
      error: null,
      success: `Successfully sent ₹${amount} to ${receiver.full_name}`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment error:', error);
    res.render('user/send-money', {
      user: req.user,
      error: error.message || 'Payment failed. Please try again.',
      success: null
    });
  } finally {
    client.release();
  }
};