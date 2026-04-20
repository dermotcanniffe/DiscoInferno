// src/services/SettingsService.js
import prisma from '../lib/prisma.js';
async function getCoreSetting(key, defaultValue = null) {
    if (!key) return defaultValue; // Handle empty key case
    try {
        const setting = await prisma.coreSetting.findUnique({
            where: { setting_key: key },
        });
        // Return the value if found, otherwise the default value
        return setting ? setting.setting_value : defaultValue;
    } catch (error) {
        console.error(`Error fetching core setting '${key}':`, error);
        // Depending on requirements, you might want to throw, or just return default
        return defaultValue;
    }
}
async function getAllCoreSettings() {
    try {
        const settingsList = await prisma.coreSetting.findMany();
        // Transform the array into a key-value object
        const settingsMap = settingsList.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
        }, {});
        return settingsMap;
    } catch (error) {
        console.error('Error fetching all core settings:', error);
        return {}; // Return empty object on error
    }
}
async function saveCoreSetting(key, value) {
    if (!key) {
        console.error("Error saving core setting: Key cannot be empty.");
        throw new Error("Setting key cannot be empty."); // Or return an error status
    }
    // Ensure value is stringified if it's not already (Prisma expects String type)
    const valueToStore = (typeof value !== 'string') ? JSON.stringify(value) : value;

    try {
        await prisma.coreSetting.upsert({
            where: { setting_key: key },
            update: { setting_value: valueToStore },
            create: { setting_key: key, setting_value: valueToStore },
        });
        console.log(`Core setting '${key}' saved successfully.`);
        return true; // Indicate success
    } catch (error) {
        console.error(`Error saving core setting '${key}':`, error);
        throw error; // Rethrow for the caller to handle
    }
}
// 
/**
 * Retrieves the configuration and enabled status for a specific plugin for a given user.
 * @param {string} pluginId - The unique ID of the plugin (e.g., "spira").
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{ configuration: object, isEnabled: boolean } | null>} - The config object and status, or null if not found.
 */
async function getPluginConfiguration(pluginId, userId) {
    if (!pluginId || !userId) {
        console.error("getPluginConfiguration: pluginId and userId are required.");
        return null; // Or throw an error
    }
    try {
        const configRecord = await prisma.pluginConfiguration.findUnique({
            where: {
                // Use the default composite key identifier format: field1_field2
                userId_pluginId: {
                    userId: userId,
                    pluginId: pluginId,
                }
            },
            select: {
                configuration: true, // Select the JSON field
                isEnabled: true      // Select the boolean field
            }
        });

        if (configRecord) {
            // Prisma returns JSON as is, which should be an object already if stored correctly
             // Ensure configuration is an object, even if DB stores null/invalid JSON accidentally
            const configuration = typeof configRecord.configuration === 'object' && configRecord.configuration !== null
                                   ? configRecord.configuration
                                   : {}; // Default to empty object if null/invalid JSON
            return {
                 configuration: configuration, // Should be JS object
                 isEnabled: configRecord.isEnabled
             };
        } else {
            return null; // Configuration not found for this user/plugin
        }
    } catch (error) {
        console.error(`Error fetching plugin configuration for plugin '${pluginId}', user '${userId}':`, error);
        // Depending on desired behavior, could return null or re-throw
        return null;
    }
}

/**
 * Saves (creates or updates) the configuration JSON and enabled status for a specific plugin for a given user.
 * @param {string} pluginId - The unique ID of the plugin.
 * @param {string} userId - The ID of the user.
 * @param {object} configurationData - The JavaScript object containing the settings to save.
 * @param {boolean} isEnabled - The desired enabled status for the plugin for this user.
 * @returns {Promise<boolean>} - True on success, false on failure (or throws error).
 */
async function savePluginConfiguration(pluginId, userId, configurationData, isEnabled) {
     if (!pluginId || !userId || typeof configurationData === 'undefined' || typeof isEnabled === 'undefined') {
        console.error("savePluginConfiguration: pluginId, userId, configurationData, and isEnabled are required.");
        throw new Error("Missing required parameters for saving plugin configuration.");
    }
    // Ensure configurationData is at least an empty object if null/undefined passed
    const dataToSave = configurationData || {};
    // Ensure isEnabled is explicitly boolean
    const enabledStatus = !!isEnabled;

    try {
        await prisma.pluginConfiguration.upsert({
            where: {
                userId_pluginId: {
                    userId: userId,
                    pluginId: pluginId,
                }
            },
            create: {
                userId: userId,
                pluginId: pluginId,
                configuration: dataToSave, // Prisma handles JSON serialization
                isEnabled: enabledStatus,
            },
            update: {
                configuration: dataToSave,
                isEnabled: enabledStatus,
                updatedAt: new Date() // Explicitly set updatedAt on update
            },
        });
        console.log(`Plugin configuration saved successfully for plugin '${pluginId}', user '${userId}'.`);
        return true;
    } catch (error) {
        console.error(`Error saving plugin configuration for plugin '${pluginId}', user '${userId}':`, error);
        throw error; // Rethrow for the controller to handle
    }
}


// --- Update Exports ---
export {
    getCoreSetting,
    getAllCoreSettings,
    saveCoreSetting,
    // Add the new plugin methods
    getPluginConfiguration,
    savePluginConfiguration,
};

// Or if using a class structure, add these as methods to the class.
