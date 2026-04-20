// server/routes/linkRoutes.js

import express from 'express';
import { protect } from '../middleware/authMiddleware.js'; // Adjust path if needed
import { searchExternalItemsControl } from '../controllers/linkController.js'; // Adjust path if needed

const router = express.Router();

// Apply protect middleware to all routes defined in this file
// Ensures only authenticated users can access linking features
router.use(protect);

/**
 * @route   POST /api/link/search/:pluginId
 * @desc    Search external items using a specific plugin based on query and context.
 * @access  Protected
 * @body    { "query": "search term", "context": { "itemType": "exampleMap", "itemId": "...", "itemData": { "spiraProductId": 101, ... } } }
 */
router.post('/search/:pluginId', searchExternalItemsControl);


// --- Placeholder for other linking routes ---
/*
 * @route   POST /api/link/create/:pluginId
 * @desc    Create an ExternalLink record after selecting an item from search results.
 * @access  Protected
 * @body    { "selectedItem": { "id": 123, "name": "..." }, "context": { ... } }
 */
// router.post('/create/:pluginId', createExternalLinkControl); // To be implemented later

/*
 * @route   DELETE /api/link/:linkId
 * @desc    Delete an existing ExternalLink record.
 * @access  Protected
 */
// router.delete('/:linkId', deleteExternalLinkControl); // To be implemented later
// --- End Placeholders ---


export default router;
