// server/controllers/settingsController.js - Updated with Plugin Setting Controls

// Import all necessary service functions (ensure path is correct)
import {
    getCoreSetting,
    getAllCoreSettings,
    saveCoreSetting,
    getPluginConfiguration,  // <<< Added service import
    savePluginConfiguration // <<< Added service import
} from '../../src/services/SettingsService.js';
import pluginManager from '../../src/services/PluginManager.js';

// --- Core Setting Controllers (No Changes Here) ---

const getCoreSettingControl = async (req, res) => {
    try {
        const { key } = req.params;
        if (!key) {
            return res.status(400).json({ message: 'Setting key parameter is required.' });
        }
        const userIdForLog = req.user?.id || 'UnknownUser';
        console.log(`Controller: [User:${userIdForLog}] Getting core setting: ${key}`);
        const value = await getCoreSetting(key, null);
        if (value !== null) {
            res.status(200).json({ key: key, value: value });
        } else {
            console.log(`Controller: Core setting not found: ${key}`);
            res.status(404).json({ message: `Setting '${key}' not found.` });
        }
    } catch (error) {
        console.error(`Controller Error: Failed to get core setting '${req.params.key}':`, error);
        res.status(500).json({ message: 'Server error while retrieving setting.' });
    }
};

const getAllCoreSettingsControl = async (req, res) => {
    try {
        const userIdForLog = req.user?.id || 'UnknownUser';
        console.log(`Controller: [User:${userIdForLog}] Getting all core settings`);
        const allSettings = await getAllCoreSettings();
        res.status(200).json(allSettings);
    } catch (error) {
        console.error('Controller Error: Failed to get all core settings:', error);
        res.status(500).json({ message: 'Server error while retrieving all settings.' });
    }
};

const saveCoreSettingControl = async (req, res) => {
    try {
        const { key, value } = req.body;
        const userIdForLog = req.user?.id || 'UnknownUser';
        if (typeof key !== 'string' || key.trim() === '') {
            return res.status(400).json({ message: 'Invalid input: "key" must be a non-empty string.' });
        }
        if (typeof value === 'undefined') {
            return res.status(400).json({ message: 'Invalid input: "value" field is required.' });
        }
        console.log(`Controller: [User:${userIdForLog}] Saving core setting: ${key}`);
        await saveCoreSetting(key, value);
        res.status(200).json({ message: `Setting '${key}' saved successfully.` });
    } catch (error) {
        console.error(`Controller Error: Failed to save core setting '${req.body?.key}':`, error);
        res.status(500).json({ message: 'Server error while saving setting.' });
    }
};


// --- NEW: Plugin Setting Controllers ---

/**
 * @desc    Get configuration for a specific plugin for the logged-in user
 * @route   GET /api/settings/plugin/:pluginId
 * @access  Protected
 */
const getPluginConfigurationControl = async (req, res) => {
    try {
        const { pluginId } = req.params;
        // Get userId from the request object (added by 'protect' middleware)
        const userId = req.user?.id;

        // Validate inputs
        if (!userId) {
            console.warn(`Controller: Attempt to get plugin config without userId for plugin: ${pluginId}`);
            return res.status(401).json({ message: 'Not authorized, user ID missing.' });
        }
        if (!pluginId) {
            return res.status(400).json({ message: 'Plugin ID parameter is required.' });
        }

        console.log(`Controller: [User:${userId}] Getting plugin config for: ${pluginId}`);
        const result = await getPluginConfiguration(pluginId, userId);

        if (result !== null) {
            // Service returns { configuration: object, isEnabled: boolean }
            res.status(200).json(result);
        } else {
            // If no config exists yet for this user/plugin, return a default state.
            // This helps the frontend initialize forms consistently.
            console.log(`Controller: Plugin config not found for plugin ${pluginId}, user ${userId}. Returning default.`);
            res.status(200).json({ configuration: {}, isEnabled: false }); // Return default empty/disabled state
        }
    } catch (error) {
        const pluginId = req.params.pluginId;
        const userId = req.user?.id || 'UnknownUser';
        console.error(`Controller Error: Failed to get plugin config for plugin '${pluginId}', user '${userId}':`, error);
        res.status(500).json({ message: 'Server error retrieving plugin configuration.' });
    }
};

/**
 * @desc    Save configuration for a specific plugin for the logged-in user
 * @route   POST /api/settings/plugin/:pluginId
 * @access  Protected
 */
const savePluginConfigurationControl = async (req, res) => {
    try {
        const { pluginId } = req.params;
        const userId = req.user?.id;
        // Expect body to contain the settings object and the enabled status
        const { configuration, isEnabled } = req.body;

        // Validate inputs
        if (!userId) {
            console.warn(`Controller: Attempt to save plugin config without userId for plugin: ${pluginId}`);
            return res.status(401).json({ message: 'Not authorized, user ID missing.' });
        }
        if (!pluginId) {
            return res.status(400).json({ message: 'Plugin ID parameter is required.' });
        }
        if (typeof configuration === 'undefined' || typeof isEnabled === 'undefined') {
             return res.status(400).json({ message: 'Invalid input: "configuration" object and "isEnabled" boolean are required in request body.' });
        }
        if (typeof configuration !== 'object' || configuration === null) {
             // Allow empty object {}, but not null or non-objects
             return res.status(400).json({ message: 'Invalid input: "configuration" must be an object.' });
         }
         if (typeof isEnabled !== 'boolean') {
              return res.status(400).json({ message: 'Invalid input: "isEnabled" must be a boolean.' });
         }

        console.log(`Controller: [User:${userId}] Saving plugin config for: ${pluginId}`); // Avoid logging config data if sensitive
        await savePluginConfiguration(pluginId, userId, configuration, isEnabled);
        res.status(200).json({ message: `Configuration for plugin '${pluginId}' saved successfully.` });

    } catch (error) {
         const pluginId = req.params.pluginId;
         const userId = req.user?.id || 'UnknownUser';
        console.error(`Controller Error: Failed to save plugin config for plugin '${pluginId}', user '${userId}':`, error);
        res.status(500).json({ message: 'Server error saving plugin configuration.' });
    }
};

/**
 * @desc    Get list of available/loaded plugins and their setting schemas
 * @route   GET /api/settings/plugins (or maybe /api/plugins)
 * @access  Protected
 */
const getAvailablePluginsControl = async (req, res) => {
    const userIdForLog = req.user?.id || 'UnknownUser';
    console.log(`Controller: [User:${userIdForLog}] Getting available plugins list`);
    try {
        const loadedPluginsMap = pluginManager.getAllPlugins();
        const loadedPluginList = Object.values(loadedPluginsMap);

        // Asynchronously fetch schema for each plugin IF the method exists
        const pluginsInfo = await Promise.all(
            loadedPluginList.map(async (plugin) => {
                let settingsSchema = []; // Default to empty schema
                if (typeof plugin.getSettingsSchema === 'function') {
                    try {
                        settingsSchema = await plugin.getSettingsSchema() || []; // Ensure it's an array
                    } catch (schemaError) {
                        console.error(`Error fetching schema for plugin ${plugin.id}:`, schemaError);
                        // Keep default empty schema on error
                    }
                }
                return {
                    id: plugin.id,
                    name: plugin.name,
                    version: plugin.version,
                    // Always include settingsSchema for consistency on the frontend.
                    settingsSchema: settingsSchema,
                };
            })
        );

        res.status(200).json(pluginsInfo);

    } catch (error) {
        console.error('Controller Error: Failed to get available plugins:', error);
        res.status(500).json({ message: 'Server error retrieving available plugins.' });
    }
};

export {
    getCoreSettingControl,
    getAllCoreSettingsControl,
    saveCoreSettingControl,
    getPluginConfigurationControl,
    savePluginConfigurationControl,
    getAvailablePluginsControl, // <<< ADD THE NEW EXPORT
};