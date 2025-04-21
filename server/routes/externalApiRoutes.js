// server/routes/externalApiRoutes.js
import express from 'express';
// Import the middleware that checks the X-API-Key header
import { authenticateApiKey } from '../middleware/apiKeyAuthMiddleware.js';
// Import controller functions we will create next
import { externalCreateMap, externalGetMapById } from '../controllers/externalApiController.js';

const router = express.Router();

// Apply API Key authentication middleware to ALL routes defined in this file
router.use(authenticateApiKey);

// Define routes for external API consumers

// POST /api/external/maps - Create a new map using API Key auth
router.post('/maps', externalCreateMap);

// GET /api/external/maps/:mapId - Get a specific map using API Key auth
router.get('/maps/:mapId', externalGetMapById);

export default router;
