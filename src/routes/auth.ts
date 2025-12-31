import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  async (req, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create user
      const user = await User.create({
        email,
        password_hash: password, // Will be hashed by hook
        name: name || null,
        avatar_url: null,
        role: 'user',
        subscription_tier: 'free',
        tokens_used: 0,
        tokens_limit: 50000,
        is_active: true,
        email_verified: false,
        last_login_at: new Date(),
      });

      // Generate token
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log('✅ [Auth] User registered:', email);
      res.status(201).json({ user: user.toJSON(), token });
    } catch (error) {
      console.error('❌ [Auth] Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if active
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is disabled' });
      }

      // Update last login
      await user.update({ last_login_at: new Date() });

      // Generate token
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log('✅ [Auth] User logged in:', email);
      res.json({ user: user.toJSON(), token });
    } catch (error) {
      console.error('❌ [Auth] Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Logout
router.post('/logout', (req, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user?.toJSON() });
});

export default router;
