// server/routes/pluginConfigRoutes.js
import express from 'express';
import {
    getPluginConfigs,
    getPluginConfig,
    upsertPluginConfig,
    deletePluginConfig
} from '../controllers/pluginConfigController.js'; // We'll create this next
import { protect } from '../middleware/authMiddleware.js'; // Use JWT protection

const router = express.Router();

// All routes require JWT authentication
router.use(protect);

// GET /api/me/plugins - List configs for the user
router.get('/', getPluginConfigs);

// GET /api/me/plugins/:pluginId - Get config for a specific plugin
router.get('/:pluginId', getPluginConfig);

// PUT /api/me/plugins/:pluginId - Create or Update config for a specific plugin
router.put('/:pluginId', upsertPluginConfig);

// DELETE /api/me/plugins/:pluginId - Delete config for a specific plugin
router.delete('/:pluginId', deletePluginConfig);


export default router;
