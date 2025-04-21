// server/routes/mapRoutes.js
import express from 'express';
import { createMap, 
    getLatestMap, 
    updateMap, 
    deleteMap 
} from '../controllers/mapController.js'; // Import controller function
import { protect } from '../middleware/authMiddleware.js'; // Import protect middleware


const router = express.Router();

// Define routes
// POST /api/maps/
router.post('/', protect, createMap);

// GET /api/maps/ - Add this route to get the latest map
router.get('/', protect, getLatestMap);
// Add other routes later (GET /, GET /:id, PUT /:id, DELETE /:id)

// PUT /api/maps/:mapId  (Update) - Add this route
router.put('/:mapId', protect, updateMap);

// DELETE /api/maps/:mapId (Delete) - Add this route
router.delete('/:mapId', protect, deleteMap);


export default router;
