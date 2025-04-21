// server/controllers/externalLinkController.js
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to check map ownership (optional, can do inline)
async function checkMapOwnership(userId, mapId) {
    const map = await prisma.exampleMap.findFirst({
        where: { id: mapId, userId: userId },
        select: { id: true } // Only need to know if it exists and is owned
    });
    return !!map; // Returns true if map exists and is owned by user, false otherwise
}


// POST /api/maps/:mapId/links - Create a link for a map
export const createExternalLink = async (req, res, next) => {
    const { mapId } = req.params;
    const userId = req.user.id; // From protect middleware
    const { pluginId, externalIdentifiers, externalSystemUrl } = req.body;

    console.log(`Attempting to create external link for map ${mapId}, plugin ${pluginId}, user ${userId}`);

    // Validation
    if (!pluginId || !externalIdentifiers) {
        return res.status(400).json({ message: 'Bad Request: Missing pluginId or externalIdentifiers in request body.' });
    }
    if (typeof externalIdentifiers !== 'object' || externalIdentifiers === null) {
         return res.status(400).json({ message: 'Bad Request: externalIdentifiers must be a valid JSON object.' });
    }

    try {
        // 1. Authorization: Check if user owns the map
        const isOwner = await checkMapOwnership(userId, mapId);
        if (!isOwner) {
             console.warn(`Forbidden: User ${userId} does not own map ${mapId}`);
            return res.status(404).json({ message: `Map not found with ID: ${mapId}` }); // Treat as not found
        }

        // 2. Create the link
        const newLink = await prisma.externalLink.create({
            data: {
                mapId: mapId,
                userId: userId, // Link to the user creating it
                pluginId: pluginId,
                externalIdentifiers: externalIdentifiers, // Store the JSON object
                externalSystemUrl: externalSystemUrl, // Optional URL
            }
        });

        console.log(`External link created successfully: ${newLink.id}`);
        res.status(201).json(newLink);

    } catch (error) {
        console.error(`Error creating external link for map ${mapId}:`, error);
         // Handle potential errors, e.g., foreign key constraint if mapId doesn't exist
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003'){
             // Foreign key constraint failed - likely mapId doesn't exist
              return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
         }
        next(error);
    }
};


// GET /api/maps/:mapId/links - List links for a map
export const getExternalLinksForMap = async (req, res, next) => {
    const { mapId } = req.params;
    const userId = req.user.id; // From protect middleware
    console.log(`Attempting to list external links for map ${mapId}, user ${userId}`);

    try {
        // 1. Authorization: Check if user owns the map
        const isOwner = await checkMapOwnership(userId, mapId);
        if (!isOwner) {
            return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
        }

        // 2. Fetch links for this map
        const links = await prisma.externalLink.findMany({
            where: {
                mapId: mapId
                // Optional: could also filter by userId here, but ownership check is primary
                // userId: userId
            },
            orderBy: { createdAt: 'asc' } // Or pluginId, etc.
        });

        res.status(200).json(links);

    } catch (error) {
        console.error(`Error fetching external links for map ${mapId}:`, error);
        next(error);
    }
};


// DELETE /api/maps/:mapId/links/:linkId - Delete a specific link
export const deleteExternalLink = async (req, res, next) => {
    const { mapId, linkId } = req.params; // Get both IDs
    const userId = req.user.id; // From protect middleware
    console.log(`Attempting to delete external link ${linkId} for map ${mapId}, user ${userId}`);

    try {
        // Delete using the link's ID, but ensure it belongs to the correct user
        // Optionally also check mapId matches the path for extra safety
        const deleteResult = await prisma.externalLink.deleteMany({
            where: {
                id: linkId,
                userId: userId, // IMPORTANT: User can only delete their own links
                // mapId: mapId // Optional: Ensure link belongs to the map in the URL path
            }
        });

        if (deleteResult.count === 0) {
             // Could be linkId doesn't exist, or user doesn't own it
             console.warn(`Delete failed: Link not found with ID ${linkId} owned by user ${userId}`);
             return res.status(404).json({ message: `External link not found with ID: ${linkId}` });
        }

        console.log(`External link deleted successfully: ${linkId}`);
        res.status(204).send(); // Success, no content

    } catch (error) {
        console.error(`Error deleting external link ${linkId}:`, error);
        next(error);
    }
};
