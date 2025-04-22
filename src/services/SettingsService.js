// src/services/SettingsService.js
const { PrismaClient } = require('@prisma/client'); // Adjust if your client path is different
const prisma = new PrismaClient(); // Or import your shared instance: const prisma = require('../lib/prisma');
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
module.exports = {
    getCoreSetting,
    getAllCoreSettings,
    saveCoreSetting,
    // We will add getPluginSettings and savePluginSettings later
};
