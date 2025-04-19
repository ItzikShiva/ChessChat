const bcrypt = require('bcrypt');
const { query } = require('../../db/config');
const winston = require('winston');

class User {
  static async create({ username, password, theme = 'light', darkMode = false }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        'INSERT INTO users (username, password, theme, dark_mode) VALUES ($1, $2, $3, $4) RETURNING id, username, theme, dark_mode',
        [username, hashedPassword, theme, darkMode]
      );
      return result.rows[0];
    } catch (error) {
      winston.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0];
    } catch (error) {
      winston.error('Error finding user:', error);
      throw error;
    }
  }

  static async updatePreferences(userId, { theme, darkMode }) {
    try {
      const result = await query(
        'UPDATE users SET theme = $1, dark_mode = $2 WHERE id = $3 RETURNING id, username, theme, dark_mode',
        [theme, darkMode, userId]
      );
      return result.rows[0];
    } catch (error) {
      winston.error('Error updating user preferences:', error);
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User; 