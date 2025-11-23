const db = require('../config/database');

class Message {
  // Send a new message
  static async create({ sender_id, receiver_id, message }) {
    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, message, is_read) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [sender_id, receiver_id, message, false]
    );
    return result.rows[0];
  }

  // Get conversation between two users
  static async getConversation(user1_id, user2_id, limit = 50) {
    const result = await db.query(
      `SELECT m.*, 
              sender.full_name as sender_name, sender.email as sender_email,
              receiver.full_name as receiver_name, receiver.email as receiver_email
       FROM messages m
       LEFT JOIN users sender ON m.sender_id = sender.id
       LEFT JOIN users receiver ON m.receiver_id = receiver.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC
       LIMIT $3`,
      [user1_id, user2_id, limit]
    );
    return result.rows;
  }

  // Get all conversations for a user (list of people they've chatted with)
  static async getConversationsList(user_id) {
    const result = await db.query(
      `SELECT DISTINCT ON (other_user_id)
              other_user_id,
              other_user_name,
              other_user_email,
              last_message,
              last_message_time,
              unread_count
       FROM (
         SELECT 
           CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
           CASE WHEN m.sender_id = $1 THEN receiver.full_name ELSE sender.full_name END as other_user_name,
           CASE WHEN m.sender_id = $1 THEN receiver.email ELSE sender.email END as other_user_email,
           m.message as last_message,
           m.created_at as last_message_time,
           (SELECT COUNT(*) FROM messages 
            WHERE sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
            AND receiver_id = $1 
            AND is_read = false) as unread_count
         FROM messages m
         LEFT JOIN users sender ON m.sender_id = sender.id
         LEFT JOIN users receiver ON m.receiver_id = receiver.id
         WHERE m.sender_id = $1 OR m.receiver_id = $1
         ORDER BY m.created_at DESC
       ) conversations
       ORDER BY other_user_id, last_message_time DESC`,
      [user_id]
    );
    return result.rows;
  }

  // Mark messages as read
  static async markAsRead(receiver_id, sender_id) {
    await db.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`,
      [receiver_id, sender_id]
    );
  }

  // Get unread message count
  static async getUnreadCount(user_id) {
    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE receiver_id = $1 AND is_read = false`,
      [user_id]
    );
    return parseInt(result.rows[0].count);
  }

  // Delete a message
  static async delete(message_id, user_id) {
    await db.query(
      `DELETE FROM messages 
       WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)`,
      [message_id, user_id]
    );
  }
}

module.exports = Message;