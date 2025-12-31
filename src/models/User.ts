import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id?: number;
  email: string;
  password_hash: string;
  name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  subscription_tier: 'free' | 'pro' | 'premium';
  tokens_used: number;
  tokens_limit: number;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

class User extends Model<UserAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare password_hash: string;
  declare name: string | null;
  declare avatar_url: string | null;
  declare role: 'user' | 'admin';
  declare subscription_tier: 'free' | 'pro' | 'premium';
  declare tokens_used: number;
  declare tokens_limit: number;
  declare is_active: boolean;
  declare email_verified: boolean;
  declare last_login_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;

  // Instance method to check password
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  // Remove sensitive data for JSON response
  toJSON() {
    const values = { ...this.get() };
    delete (values as any).password_hash;
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  subscription_tier: {
    type: DataTypes.ENUM('free', 'pro', 'premium'),
    defaultValue: 'free',
  },
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tokens_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 50000, // 50K free tokens
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'dood_users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
  },
});

export { User };
