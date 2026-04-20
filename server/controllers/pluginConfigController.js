// server/controllers/pluginConfigController.js
//import { PrismaClient } from '@prisma/client'; // using Singleton Prisma Client
import prisma from '../../src/lib/prisma.js'; 

// GET / - List configurations for the logged-in user
export const getPluginConfigs = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const configs = await prisma.pluginConfiguration.findMany({
            where: { userId: userId },
            select: { // Return minimal info for list view
                id: true,
                pluginId: true,
                isEnabled: true,
                updatedAt: true
            },
            orderBy: { pluginId: 'asc' }
        });
        res.status(200).json(configs);
    } catch (error) {
        console.error(`Error fetching plugin configs for user ${userId}:`, error);
        next(error);
    }
};

// GET /:pluginId - Get specific configuration
export const getPluginConfig = async (req, res, next) => {
    const userId = req.user.id;
    const { pluginId } = req.params;
    try {
        const config = await prisma.pluginConfiguration.findUnique({
            where: {
                userId_pluginId: { // Use the @@unique constraint name
                    userId: userId,
                    pluginId: pluginId
                }
            }
            // Exclude ID maybe? Or keep it? Let's keep it for now.
            // select: { pluginId: true, configuration: true, isEnabled: true, updatedAt: true }
        });

        if (!config) {
            return res.status(404).json({ message: `Configuration for plugin '${pluginId}' not found.` });
        }
        res.status(200).json(config); // Return full config including JSON blob
    } catch (error) {
        console.error(`Error fetching plugin config '${pluginId}' for user ${userId}:`, error);
        next(error);
    }
};

// PUT /:pluginId - Create or Update configuration
export const upsertPluginConfig = async (req, res, next) => {
    const userId = req.user.id;
    const { pluginId } = req.params;
    // Get config JSON and isEnabled flag from request body
    const { configuration, isEnabled } = req.body;

    // Basic validation
    if (typeof configuration === 'undefined' || typeof isEnabled === 'undefined') {
         return res.status(400).json({ message: 'Bad Request: Missing configuration or isEnabled field in request body.' });
    }
     // Add deeper validation for 'configuration' object if needed for specific plugins later

    try {
        const result = await prisma.pluginConfiguration.upsert({
            where: {
                userId_pluginId: { // Use the @@unique constraint name
                    userId: userId,
                    pluginId: pluginId
                }
            },
            update: { // Data for update if record exists
                configuration: configuration,
                isEnabled: isEnabled,
            },
            create: { // Data for create if record doesn't exist
                userId: userId,
                pluginId: pluginId,
                configuration: configuration,
                isEnabled: isEnabled,
            },
        });
        console.log(`Plugin config '${pluginId}' upserted for user ${userId}`);
        res.status(200).json(result); // Return the created/updated record
    } catch (error) {
        console.error(`Error upserting plugin config '${pluginId}' for user ${userId}:`, error);
        // Handle potential JSON format errors from Prisma if req.body.configuration isn't valid JSON?
         if (error instanceof Prisma.PrismaClientValidationError) {
              return res.status(400).json({ message: `Bad Request: Invalid configuration data format. ${error.message}` });
         }
        next(error);
    }
};

// DELETE /:pluginId - Delete a specific configuration
export const deletePluginConfig = async (req, res, next) => {
    const userId = req.user.id;
    const { pluginId } = req.params;
    try {
        const deleteResult = await prisma.pluginConfiguration.deleteMany({
             where: {
                 userId: userId,
                 pluginId: pluginId
             }
        });

         if (deleteResult.count === 0) {
              return res.status(404).json({ message: `Configuration for plugin '${pluginId}' not found.` });
         }

        console.log(`Plugin config '${pluginId}' deleted for user ${userId}`);
        res.status(204).send(); // Success, no content

    } catch (error) {
        console.error(`Error deleting plugin config '${pluginId}' for user ${userId}:`, error);
         // Handle specific errors if needed (like P2025 although deleteMany doesn't throw it)
        next(error);
    }
};

