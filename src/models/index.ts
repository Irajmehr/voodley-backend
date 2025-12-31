import { User } from './User';
import { Project } from './Project';

// Define associations
User.hasMany(Project, { foreignKey: 'user_id', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export { User, Project };
