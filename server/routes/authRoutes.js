// server/routes/authRoutes.js
import express from 'express';
import { register, login } from '../controllers/authController.js'; // We'll create this controller next
import passport from 'passport'; // Import passport here

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
// Use passport.authenticate to trigger the 'local' strategy (which we'll configure)
// { session: false } because we are using tokens (JWT), not sessions
router.post('/login', passport.authenticate('local', { session: false }), login);

// Add /me route later to get current user from token

export default router;
