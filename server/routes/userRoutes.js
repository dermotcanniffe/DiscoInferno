// server/routes/userRoutes.js
import express from 'express';
import { generateApiKey } from '../controllers/userController.js'; // We'll create this next
import { protect } from '../middleware/authMiddleware.js'; // Use JWT protection

const router = express.Router();

// All routes in this file require JWT authentication
router.use(protect);

// POST /api/me/apikey - Generate/Reset API Key for current user
router.post('/apikey', generateApiKey);

// DELETE /api/me/apikey - (Optional: Add later for revoking/deleting)
// router.delete('/apikey', revokeApiKey);

// GET /api/me/apikey/status - (Optional: Add later)
// router.get('/apikey/status', checkApiKeyStatus);


export default router;
