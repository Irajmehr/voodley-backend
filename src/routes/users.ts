import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models';
import { authenticate, AuthRequest, isAdmin } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json({ users: users.map(u => u.toJSON()) });
  } catch (error) {
    console.error('❌ [Users] Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless admin
    if (req.user?.role !== 'admin' && req.userId !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('❌ [Users] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.patch('/me', authenticate,
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('avatar_url').optional().isURL(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, avatar_url } = req.body;
      const updates: any = {};

      if (name !== undefined) updates.name = name;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      await req.user?.update(updates);

      console.log('✅ [Users] Profile updated:', req.user?.email);
      res.json({ user: req.user?.toJSON() });
    } catch (error) {
      console.error('❌ [Users] Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Change password
router.post('/me/password', authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isValid = await req.user?.validatePassword(currentPassword);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Update password
      await req.user?.update({ password_hash: newPassword });

      console.log('✅ [Users] Password changed:', req.user?.email);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('❌ [Users] Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

export default router;
