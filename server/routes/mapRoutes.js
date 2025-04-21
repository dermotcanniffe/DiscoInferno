// server/routes/mapRoutes.js
import express from 'express';
import { createMap, 
    getMaps,
    getLatestMap,
    getMapById, 
    updateMap, 
    deleteMap 
} from '../controllers/mapController.js'; // Import map controller functions
import { createExternalLink, getExternalLinksForMap, deleteExternalLink } from '../controllers/externalLinkController.js'; // import External Link Controllers
import { protect } from '../middleware/authMiddleware.js'; // Import protect middleware


const router = express.Router();

// Apply 'protect' middleware to all map routes
router.use(protect);  // Apply protect to all routes below defined on this router

// Define routes
// POST /api/maps/
router.post('/', createMap);

// GET /api/maps/latest  (Get LATEST Full Map) - Define specific before general
router.get('/latest', getLatestMap);

// GET /api/maps/:mapId  (Get ONE specific Full Map by ID) - Add this route
router.get('/:mapId', getMapById);

// GET /api/maps/        (Get ALL Map Summaries)
router.get('/', getMaps);

// PUT /api/maps/:mapId  (Update) - Add this route
router.put('/:mapId', updateMap);

// DELETE /api/maps/:mapId (Delete) - Add this route
router.delete('/:mapId', deleteMap);


// --- Link Routes ---
// POST /api/maps/:mapId/links - Create a link for this map
router.post('/:mapId/links', createExternalLink);

// GET /api/maps/:mapId/links - List links for this map
router.get('/:mapId/links', getExternalLinksForMap);

// DELETE /api/maps/:mapId/links/:linkId - Delete a specific link associated with this map
router.delete('/:mapId/links/:linkId', deleteExternalLink);
// --- End Link Routes ---

export default router;
