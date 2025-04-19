const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('purchase', 'tournament_entry', 'tournament_prize', 'refund'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
    },
    chess_coins: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
    },
    payment_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tournament_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Tournaments',
            key: 'id'
        }
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Transaction; 