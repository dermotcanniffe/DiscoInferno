// server/routes/mapRoutes.js
import express from 'express';
import { createMap } from '../controllers/mapController.js'; // Import controller function

const router = express.Router();

// Define routes
// POST /api/maps/
router.post('/', createMap);

// Add other routes later (GET /, GET /:id, PUT /:id, DELETE /:id)

export default router;
