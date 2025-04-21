// server/controllers/mapController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Import and instantiate Prisma Client

// --- Create Map ---
// (Associate with logged-in user)
export const createMap = async (req, res, next) => {
  console.log("\n--- Inside createMap Controller ---"); // Add newline for readability
  console.log("Authenticated User ID:", req.user?.id); // Use optional chaining just in case
  console.log("Received Request Body:", JSON.stringify(req.body, null, 2)); // Log the full body

  const { title, description, stories } = req.body;
  const userId = req.user.id; // <-- Get user ID from authenticated request (provided by 'protect' middleware)

  if (!title || !stories) {
    console.error(`Validation Failed! Title: '${title}', Stories:`, stories);
    return res.status(400).json({ message: 'Missing required fields: title and stories' });
  }
  if (!userId) { // Should not happen if 'protect' middleware is working
    console.error("Error in createMap: req.user.id is missing after 'protect' middleware.");
    return res.status(401).json({ message: 'Unauthorized: User ID missing.' });
  }


  try {
    const newMap = await prisma.exampleMap.create({
      data: {
        title: title,
        description: description,
        userId: userId, // <-- Associate with logged-in user
        // Ensure nested create includes necessary fields like 'order'
        stories: {
          create: stories.map((story, storyIndex) => ({ // Add index if needed for default order
            text: story.text,
            order: story.order ?? storyIndex, // Use provided order or default to index
            questions: {
              create: story.questions?.map((question, questionIndex) => ({
                text: question.text,
                order: question.order ?? questionIndex,
              })) || [],
            },
            rules: {
              create: story.rules?.map((rule, ruleIndex) => ({
                text: rule.text,
                order: rule.order ?? ruleIndex,
                examples: {
                  create: rule.examples?.map((example, exampleIndex) => ({
                    text: example.text,
                    order: example.order ?? exampleIndex,
                  })) || [],
                },
              })) || [],
            },
          })),
        }, // End stories create
      }, // End data
      include: { // Include everything needed by frontend
        stories: {
          orderBy: { order: 'asc' },
          include: {
            rules: {
              orderBy: { order: 'asc' },
              include: { examples: { orderBy: { order: 'asc' } }, },
            },
            questions: { orderBy: { order: 'asc' }, },
          },
        },
      }, // End include
    }); // End create
    res.status(201).json(newMap);
  } catch (error) {
    console.error(`Error creating map for user ${userId}:`, error);
    next(error);
  }
};

// --- Get Latest Map ---
// (Filtered for logged-in user)
export const getLatestMap = async (req, res, next) => {
  const userId = req.user.id; // <-- Get user ID
  console.log(`Attempting to fetch latest map for user ID: ${userId}`);

  try {
    const latestMap = await prisma.exampleMap.findFirst({
      where: {
        userId: userId, // <-- Filter by logged-in user
      },
      orderBy: { updatedAt: 'desc' },
      include: { // Include everything
        stories: {
          orderBy: { order: 'asc' },
          include: {
            rules: {
              orderBy: { order: 'asc' },
              include: { examples: { orderBy: { order: 'asc' } }, },
            },
            questions: { orderBy: { order: 'asc' }, },
          },
        },
      },
    });

    if (latestMap) {
      console.log(`Found latest map: ${latestMap.id} for user ${userId}`);
      res.status(200).json(latestMap);
    } else {
      console.log(`No maps found for user ${userId}`);
      res.status(404).json({ message: 'No maps found for this user' });
    }
  } catch (error) {
    console.error(`Error fetching latest map for user ${userId}:`, error);
    next(error);
  }
};

// --- Update Map ---
// (Authorize owner and update)
export const updateMap = async (req, res, next) => {
  const { mapId } = req.params;
  console.log("\n--- Inside updateMap Controller ---"); // Add newline
  console.log("Authenticated User ID:", req.user?.id);
  console.log("Target Map ID:", mapId);
  console.log("Received Request Body:", JSON.stringify(req.body, null, 2)); // Log the full body

  const { title, description, stories } = req.body;
  const userId = req.user.id; // <-- Get user ID

  console.log(`Attempting to update map ID: ${mapId} for user ID: ${userId}`);
  if (!title || !stories) {
    console.error(`Validation Failed! Title: '${title}', Stories:`, stories);
    return;
  }

  try {
    const updatedMap = await prisma.$transaction(async (tx) => {
      // --- Authorization Check ---
      // Find the map FIRST and check ownership
      const mapToUpdate = await tx.exampleMap.findUnique({
        where: { id: mapId }
      });
      if (!mapToUpdate) {
        throw new Error('MapNotFound'); // Custom error string
      }
      if (mapToUpdate.userId !== userId) {
        throw new Error('Forbidden'); // Custom error string
      }
      // --- End Auth Check ---

      // Delete existing children (using cascade defined in schema is simpler)
      // Prisma's cascade on Story should handle Rules/Examples/Questions deletion
      await tx.story.deleteMany({ where: { mapId: mapId } });

      // Update the ExampleMap and recreate nested items
      const map = await tx.exampleMap.update({
        where: { id: mapId }, // We know user owns it from check above
        data: {
          title: title,
          description: description,
          // userId doesn't change on update
          // Recreate stories using nested create
          stories: {
            create: stories.map((story, storyIndex) => ({
              text: story.text,
              order: story.order ?? storyIndex,
              questions: {
                create: story.questions?.map((question, questionIndex) => ({
                  text: question.text, order: question.order ?? questionIndex,
                })) || [],
              },
              rules: {
                create: story.rules?.map((rule, ruleIndex) => ({
                  text: rule.text, order: rule.order ?? ruleIndex,
                  examples: {
                    create: rule.examples?.map((example, exampleIndex) => ({
                      text: example.text, order: example.order ?? exampleIndex,
                    })) || [],
                  },
                })) || [],
              },
            })),
          }, // End stories create
        }, // End data
        include: { /* ... includes ... */ }, // Include everything again
      }); // End update
      return map; // Return result from transaction
    }); // End transaction

    console.log(`Map updated successfully: ${mapId} by user ${userId}`);
    res.status(200).json(updatedMap);

  } catch (error) {
    // Handle custom errors from transaction
    if (error.message === 'MapNotFound') {
      return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
    }
    if (error.message === 'Forbidden') {
      return res.status(403).json({ message: 'Forbidden: You do not own this map' });
    }
    console.error(`Error updating map ${mapId} for user ${userId}:`, error);
    next(error);
  }
};

// --- Delete Map ---
// (Authorize owner and delete)
export const deleteMap = async (req, res, next) => {
  const { mapId } = req.params;
  const userId = req.user.id; // <-- Get user ID

  console.log(`Attempting to delete map ID: ${mapId} for user ID: ${userId}`);

  try {
    // Use deleteMany with compound where clause for auth check & delete in one
    const deleteResult = await prisma.exampleMap.deleteMany({
      where: {
        id: mapId,
        userId: userId // <-- IMPORTANT: Only delete if ID and userId match
      },
    });

    // Check if any record was actually deleted
    if (deleteResult.count === 0) {
      // Check if map exists at all to differentiate 404 from 403
      const mapExists = await prisma.exampleMap.findUnique({ where: { id: mapId }, select: { id: true } }); // Select only id
      if (!mapExists) {
        return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
      } else {
        // Map exists but user doesn't own it
        return res.status(403).json({ message: 'Forbidden: You do not own this map' });
      }
    }

    console.log(`Map deleted successfully: ${mapId} by user ${userId}`);
    res.status(204).send(); // Success, no content to return

  } catch (error) {
    console.error(`Error deleting map ${mapId} for user ${userId}:`, error);
    next(error);
  }
};