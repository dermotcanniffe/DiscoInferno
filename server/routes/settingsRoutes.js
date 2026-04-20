// server/routes/settingsRoutes.js - Updated to use Controller

import express from 'express';

// --- Remove direct service import ---
// import settingsService from '../services/SettingsService.js';

// +++ Import CONTROLLER functions +++
import {
    getCoreSettingControl,
    getAllCoreSettingsControl,
    saveCoreSettingControl,
    getAvailablePluginsControl,
    getPluginConfigurationControl,
    savePluginConfigurationControl
} from '../controllers/settingsController.js'; // Adjust path if needed

// Import middleware
import { protect } from '../middleware/authMiddleware.js';
// Optional: import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// --- Apply Middleware ---
// Ensures user is logged in for all settings routes
router.use(protect);
// Optional: Add admin check if required for all settings
// router.use(requireAdmin);

// --- Core Settings Routes ---
// Routes now directly call the imported controller functions

// GET /api/settings/core/:key
router.get('/core/:key', getCoreSettingControl);

// GET /api/settings/core
router.get('/core', getAllCoreSettingsControl);

// POST /api/settings/core
router.post('/core', saveCoreSettingControl);

// --- Plugin Listing Route ---
/**
 * @route   GET /api/settings/plugins
 * @desc    Get list of available plugins and their setting schemas
 * @access  Protected
 */
router.get('/plugins', getAvailablePluginsControl); // <<< ADD THIS ROUTE DEFINITION

// --- Plugin Settings Routes ---
router.get('/plugin/:pluginId', getPluginConfigurationControl);
router.post('/plugin/:pluginId', savePluginConfigurationControl);

// ... export default router; ...


export default router;
