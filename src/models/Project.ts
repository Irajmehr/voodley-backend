import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface ProjectAttributes {
  id?: number;
  user_id: number;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  project_data: object;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  views_count: number;
  tokens_used: number;
  duration_seconds: number | null;
  created_at?: Date;
  updated_at?: Date;
}

class Project extends Model<ProjectAttributes> implements ProjectAttributes {
  declare id: number;
  declare user_id: number;
  declare name: string;
  declare description: string | null;
  declare thumbnail_url: string | null;
  declare project_data: object;
  declare status: 'draft' | 'published' | 'archived';
  declare is_public: boolean;
  declare views_count: number;
  declare tokens_used: number;
  declare duration_seconds: number | null;
  declare created_at: Date;
  declare updated_at: Date;
}

Project.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dood_users',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Untitled Project',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  project_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'dood_projects',
  timestamps: true,
  underscored: true,
});

export { Project };
