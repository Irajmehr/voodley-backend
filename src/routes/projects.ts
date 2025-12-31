import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User, Project } from '../models';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all user's projects
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.findAll({
      where: { user_id: req.userId },
      order: [['updated_at', 'DESC']],
    });
    res.json({ projects });
  } catch (error) {
    console.error('❌ [Projects] Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get public projects
router.get('/public', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.findAll({
      where: { is_public: true, status: 'published' },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['views_count', 'DESC']],
      limit: 20,
    });
    res.json({ projects });
  } catch (error) {
    console.error('❌ [Projects] Error fetching public projects:', error);
    res.status(500).json({ error: 'Failed to fetch public projects' });
  }
});

// Get single project
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    if (!project.is_public && project.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment views for public projects
    if (project.is_public && project.user_id !== req.userId) {
      await project.increment('views_count');
    }

    res.json({ project });
  } catch (error) {
    console.error('❌ [Projects] Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticate,
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('project_data').optional().isObject(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, project_data } = req.body;

      const project = await Project.create({
        user_id: req.userId!,
        name: name || 'Untitled Project',
        description: description || null,
        thumbnail_url: null,
        project_data: project_data || {},
        status: 'draft',
        is_public: false,
        views_count: 0,
        tokens_used: 0,
        duration_seconds: null,
      });

      console.log('✅ [Projects] Project created:', project.id);
      res.status(201).json({ project });
    } catch (error) {
      console.error('❌ [Projects] Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// Update project
router.patch('/:id', authenticate,
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('project_data').optional().isObject(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('is_public').optional().isBoolean(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const project = await Project.findByPk(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { name, description, project_data, status, is_public, thumbnail_url, duration_seconds } = req.body;
      const updates: any = {};

      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (project_data !== undefined) updates.project_data = project_data;
      if (status !== undefined) updates.status = status;
      if (is_public !== undefined) updates.is_public = is_public;
      if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
      if (duration_seconds !== undefined) updates.duration_seconds = duration_seconds;

      await project.update(updates);

      console.log('✅ [Projects] Project updated:', project.id);
      res.json({ project });
    } catch (error) {
      console.error('❌ [Projects] Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// Delete project
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await project.destroy();

    console.log('✅ [Projects] Project deleted:', id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ [Projects] Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
