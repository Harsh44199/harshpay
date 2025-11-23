const db = require('../config/database');

class Transaction {
  static async create({ sender_id, receiver_id, amount, transaction_type, description }) {
    const result = await db.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount, transaction_type, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [sender_id, receiver_id, amount, transaction_type, description, 'completed']
    );
    return result.rows[0];
  }

  static async getByUserId(userId, limit = 50) {
    const result = await db.query(
      `SELECT t.*, 
              sender.full_name as sender_name, sender.email as sender_email,
              receiver.full_name as receiver_name, receiver.email as receiver_email
       FROM transactions t
       LEFT JOIN users sender ON t.sender_id = sender.id
       LEFT JOIN users receiver ON t.receiver_id = receiver.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async getAll(limit = 100) {
    const result = await db.query(
      `SELECT t.*, 
              sender.full_name as sender_name, sender.email as sender_email,
              receiver.full_name as receiver_name, receiver.email as receiver_email
       FROM transactions t
       LEFT JOIN users sender ON t.sender_id = sender.id
       LEFT JOIN users receiver ON t.receiver_id = receiver.id
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(
      `SELECT t.*, 
              sender.full_name as sender_name, sender.email as sender_email,
              receiver.full_name as receiver_name, receiver.email as receiver_email
       FROM transactions t
       LEFT JOIN users sender ON t.sender_id = sender.id
       LEFT JOIN users receiver ON t.receiver_id = receiver.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getStats(userId) {
    const result = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN sender_id = $1 THEN amount ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(CASE WHEN receiver_id = $1 THEN amount ELSE 0 END), 0) as total_received,
        COUNT(CASE WHEN sender_id = $1 THEN 1 END) as sent_count,
        COUNT(CASE WHEN receiver_id = $1 THEN 1 END) as received_count
       FROM transactions
       WHERE sender_id = $1 OR receiver_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = Transaction;