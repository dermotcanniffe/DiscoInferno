// server/controllers/linkController.js

import pluginManager from '../../src/services/PluginManager.js';
import { getPluginConfiguration } from '../../src/services/SettingsService.js';
import prisma from '../../src/lib/prisma.js'; // Import shared Prisma client


/**
 * @desc    Search for items in an external plugin system based on query and context.
 * @route   POST /api/link/search/:pluginId
 * @access  Protected
 */
const searchExternalItemsControl = async (req, res) => {
    const { pluginId } = req.params;
    const userId = req.user?.id; // From protect middleware
    const { query, context } = req.body; // Expect query string and context object in body

    // --- Input Validation ---
    if (!userId) {
        return res.status(401).json({ message: 'Not authorized, user ID missing.' });
    }
    if (!pluginId) {
        return res.status(400).json({ message: 'Plugin ID parameter is required.' });
    }
    if (typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query (string) is required in body.' });
    }
    if (typeof context !== 'object' || context === null || !context.itemType || !context.itemId) {
         return res.status(400).json({ message: 'Invalid or missing context object in body (must include itemType and itemId).' });
    }
    // We also need context.itemData.spiraProductId for Spira search
     if (pluginId === 'spira' && !context.itemData?.spiraProductId) {
         console.warn(`Controller: Missing spiraProductId in context.itemData for Spira search.`);
         // Return specific error or let plugin handle it? For now, let plugin handle potentially.
         // return res.status(400).json({ message: 'Context for Spira search must include itemData.spiraProductId.' });
     }

    console.log(`Controller: [User:${userId}] Search request for plugin '${pluginId}', query '${query}', context item ${context.itemId}`);

    try {
        // 1. Get User's Configuration for this Plugin
        const userPluginConfig = await getPluginConfiguration(pluginId, userId);

        // 2. Check if plugin is configured and enabled by the user
        if (!userPluginConfig || !userPluginConfig.isEnabled) {
            console.log(`Controller: Plugin '${pluginId}' is not configured or not enabled for user ${userId}.`);
            // Return empty array as if no results found, or specific error? Empty array is common.
            return res.status(200).json([]);
        }
        // Ensure configuration object exists, even if empty
        const settings = userPluginConfig.configuration || {};

        // 3. Get the loaded plugin instance
        const plugin = pluginManager.getPlugin(pluginId);

        // 4. Check if plugin exists and supports search
        if (!plugin) {
            console.warn(`Controller: Plugin '${pluginId}' not found or not loaded.`);
            return res.status(404).json({ message: `Plugin '${pluginId}' not found.` });
        }
        if (typeof plugin.searchExternalItems !== 'function') {
            console.warn(`Controller: Plugin '${pluginId}' does not support searchExternalItems.`);
            return res.status(501).json({ message: `Plugin '${pluginId}' does not support search.` });
        }

        // 5. Call the plugin's search function
        console.log(`Controller: Calling ${pluginId}.searchExternalItems...`);
        const results = await plugin.searchExternalItems(query, context, settings);

        // 6. Return results
        res.status(200).json(results); // Send back the array from the plugin

    } catch (error) {
        console.error(`Controller Error: Failed during external item search for plugin '${pluginId}', query '${query}', user '${userId}':`, error);
        res.status(500).json({ message: 'Server error during external item search.' });
    }
};

/**
 * @desc    Validate a user-provided external ID via a plugin and create an ExternalLink record if valid.
 * @route   POST /api/link/create/:pluginId
 * @access  Protected
 * @body    { "inputId": "RQ:5" | "5", "context": { "itemType": "exampleMap", "itemId": "map123", "itemData": { "spiraProjectId": 101 } } }
 */
const createLinkControl = async (req, res) => {
    const { pluginId } = req.params;
    const userId = req.user?.id; // From protect middleware
    // inputId is the raw value from the user (e.g., "RQ:5")
    const { inputId, context } = req.body;

    // --- 1. Input Validation ---
    if (!userId) {
        return res.status(401).json({ message: 'Not authorized, user ID missing.' });
    }
    if (!pluginId) {
        return res.status(400).json({ message: 'Plugin ID parameter is required.' });
    }
    if (typeof inputId !== 'string' && typeof inputId !== 'number' || String(inputId).trim() === '') {
        return res.status(400).json({ message: 'Input ID (string or number) is required in request body.' });
    }
    if (typeof context !== 'object' || context === null || !context.itemType || !context.itemId || !context.itemData) {
        return res.status(400).json({ message: 'Invalid or missing context object in request body (must include itemType, itemId, itemData).' });
    }
    if (context.itemType !== 'exampleMap') { // Currently only support linking maps
        return res.status(400).json({ message: `Linking itemType '${context.itemType}' not currently supported.` });
    }
    // Spira-specific context check
    if (pluginId === 'spira' && !context.itemData?.spiraProjectId) {
        return res.status(400).json({ message: 'Context for Spira link must include itemData.spiraProjectId.' });
    }

    console.log(`Controller: [User:${userId}] Create Link request for plugin '${pluginId}', item '${context.itemId}', input ID '${inputId}'`);

    try {
        // --- 2. Get User Plugin Configuration & Check Enablement ---
        const userPluginConfig = await getPluginConfiguration(pluginId, userId);
        if (!userPluginConfig || !userPluginConfig.isEnabled) {
            console.log(`Controller: Plugin '${pluginId}' is not configured or not enabled for user ${userId}.`);
            return res.status(403).json({ message: `Plugin '${pluginId}' is not configured or enabled for your account.` });
        }
        const settings = userPluginConfig.configuration || {};

        // --- 3. Get Plugin Instance ---
        const plugin = pluginManager.getPlugin(pluginId);
        if (!plugin) {
            return res.status(404).json({ message: `Plugin '${pluginId}' not found.` });
        }
        if (typeof plugin.getExternalIdentifiersToStore !== 'function') {
            return res.status(501).json({ message: `Plugin '${pluginId}' does not support linking.` });
        }

        // --- 4. Call Plugin to Validate Input ID and Get Stored Identifiers ---
        let storedIdentifiers; // Should be { requirementId: number, productId: number } for Spira
        try {
            console.log(`Controller: Calling ${pluginId}.getExternalIdentifiersToStore for validation...`);
            // Pass the raw inputId, context, and user's settings to the plugin
            storedIdentifiers = await plugin.getExternalIdentifiersToStore(inputId, context, settings);

            // Basic check on returned data from plugin
            if (typeof storedIdentifiers !== 'object' || storedIdentifiers === null) {
                 throw new Error("Plugin validation function returned invalid data type.");
            }
             console.log(`Controller: Plugin validation successful, received identifiers:`, storedIdentifiers);

        } catch (validationError) {
             // Handle errors thrown by getExternalIdentifiersToStore (e.g., Not Found, Auth, Mismatch)
             console.warn(`Controller: Plugin validation failed for plugin '${pluginId}', input '${inputId}':`, validationError.message);
             // Determine appropriate status code based on error message
             let statusCode = 400; // Bad request (e.g., invalid format, project mismatch)
             if (validationError.message.toLowerCase().includes("not found")) statusCode = 404;
             if (validationError.message.toLowerCase().includes("authentication failed")) statusCode = 401;
             // Return the error message from the plugin to the frontend
             return res.status(statusCode).json({ message: validationError.message || "Failed to validate external item ID." });
        }

        // --- 5. Create ExternalLink Record in Database ---
        console.log(`Controller: Creating ExternalLink record in DB for mapId ${context.itemId}...`);
        const newLink = await prisma.externalLink.create({
             data: {
                 pluginId: plugin.id, // Use the validated plugin ID
                 externalIdentifiers: storedIdentifiers, // Store the validated object { reqId, projId } as JSON
                 map: { // Connect relation to ExampleMap
                     connect: { id: context.itemId }
                 },
                 user: { // Connect relation to User
                     connect: { id: userId }
                 }
                 // Optionally add externalSystemUrl if constructible/needed
             },
             // Optionally include related data in the response if needed by frontend
             // include: { map: true }
         });
         console.log(`Controller: ExternalLink created with ID: ${newLink.id}`);

        // --- 6. Send Success Response ---
        res.status(201).json({ message: 'Link created successfully!', link: newLink }); // Send 201 Created status

    } catch (error) {
         // Catch unexpected server errors from service calls or Prisma
         console.error(`Controller Error: Failed during link creation process for plugin '${pluginId}', item '${context?.itemId}', user '${userId}':`, error);
         res.status(500).json({ message: 'Server error while creating link.' });
     }
};


// Export the controller function(s)
export {
    searchExternalItemsControl,
    createLinkControl,
    // Add other link-related controllers here later (e.g., createLinkControl)
};

