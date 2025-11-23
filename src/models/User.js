const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, full_name, phone, is_admin = false }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password, full_name, phone, is_admin, balance) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, full_name, phone, balance, is_admin, created_at`,
      [email, hashedPassword, full_name, phone, is_admin, 1000]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, email, full_name, phone, balance, is_admin, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateBalance(userId, amount, operation = 'add') {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    const newBalance = operation === 'add' 
      ? parseFloat(user.balance) + parseFloat(amount)
      : parseFloat(user.balance) - parseFloat(amount);

    if (newBalance < 0) throw new Error('Insufficient balance');

    const result = await db.query(
      'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING balance',
      [newBalance, userId]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await db.query(
      'SELECT id, email, full_name, phone, balance, is_admin, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async searchByEmail(email) {
    const result = await db.query(
      'SELECT id, email, full_name, balance FROM users WHERE email ILIKE $1 AND is_active = true LIMIT 10',
      [`%${email}%`]
    );
    return result.rows;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;