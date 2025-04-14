// server/controllers/mapController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Import and instantiate Prisma Client

// Controller function to create a new Example Map
export const createMap = async (req, res, next) => {
  // Extract data from the request body sent by the frontend
  const { title, description, stories } = req.body; // Assuming frontend sends map title, description, and nested stories array

  // Basic validation (add more as needed)
  if (!title || !stories) {
    return res.status(400).json({ message: 'Missing required fields: title and stories' });
  }

  try {
    // --- Use Prisma to create the map and all nested items ---
    const newMap = await prisma.exampleMap.create({
      data: {
        title: title,
        description: description,
        // userId: req.user?.id, // Placeholder: Link to user when auth is ready
        stories: { // This is the magic: Nested writes!
          create: stories.map(story => ({ // Map over the stories array from req.body
            text: story.text,
            order: story.order,
            questions: { // Nested write for questions within a story
              create: story.questions?.map(question => ({
                text: question.text,
                order: question.order,
              })) || [], // Handle if questions array is missing/null
            },
            rules: { // Nested write for rules within a story
              create: story.rules?.map(rule => ({
                text: rule.text,
                order: rule.order,
                examples: { // Nested write for examples within a rule
                  create: rule.examples?.map(example => ({
                    text: example.text,
                    order: example.order,
                  })) || [], // Handle if examples array is missing/null
                },
              })) || [], // Handle if rules array is missing/null
            },
          })),
        },
      },
      // Include the nested data in the response (optional, but useful)
      include: {
        stories: {
          include: {
            rules: {
              include: {
                examples: true,
              },
            },
            questions: true,
          },
        },
      },
    });
    
    // Send the newly created map back as a response
    res.status(201).json(newMap);

  } catch (error) {
    console.error("Error creating map:", error);
    next(error); // Pass error to the global error handler in server.js
  }
};
// --- Get Latest Map ---
export const getLatestMap = async (req, res, next) => {
  console.log("Attempting to fetch the latest map..."); // Log entry

  try {
    // Find the first map when ordered by updatedAt descending
    const latestMap = await prisma.exampleMap.findFirst({
      // We'll add filtering by userId later when auth is implemented
      // where: {
      //   userId: req.user?.id // Placeholder
      // },
      orderBy: {
        updatedAt: 'desc', // Get the most recently updated one
      },
      // Include all nested data needed by the frontend editor
      include: {
        stories: {
          orderBy: { order: 'asc' }, // Ensure stories are ordered correctly
          include: {
            rules: {
              orderBy: { order: 'asc' }, // Ensure rules are ordered correctly
              include: {
                examples: {
                  orderBy: { order: 'asc' }, // Ensure examples are ordered correctly
                },
              },
            },
            questions: {
              orderBy: { order: 'asc' }, // Ensure questions are ordered correctly
            },
          },
        },
      },
    });

    if (latestMap) {
      console.log("Found latest map:", latestMap.id);
      res.status(200).json(latestMap); // Send the map data if found
    } else {
      // If no maps exist in the database yet
      console.log("No maps found in the database.");
      // Send 404 Not Found, or maybe an empty object/default structure
      // depending on how the frontend handles it. Let's send 404 for now.
      res.status(404).json({ message: 'No maps found' });
    }

  } catch (error) {
    console.error("Error fetching latest map:", error);
    next(error); // Pass error to the global error handler
  }
};
// Add other controller functions here later (getMaps, getMapById, updateMap, deleteMap)

// --- Update Map ---
export const updateMap = async (req, res, next) => {
  const { mapId } = req.params; // Get map ID from route parameter
  const { title, description, stories } = req.body; // Get updated data from request body

  console.log(`Attempting to update map ID: ${mapId}`);

  // Basic validation
  if (!title || !stories) {
    return res.status(400).json({ message: 'Missing required fields: title and stories' });
  }

  try {
    // --- Authorization Check Placeholder ---
    // TODO: Later, verify req.user has permission to edit this mapId
    // const map = await prisma.exampleMap.findUnique({ where: { id: mapId } });
    // if (!map || map.userId !== req.user.id) { // Check ownership
    //   return res.status(403).json({ message: 'Forbidden: You do not own this map' });
    // }
    // --- End Placeholder ---

    const updatedMap = await prisma.$transaction(async (tx) => {
      // 1. Delete existing nested children (bottom-up or rely on cascade)
      // Prisma schema uses onDelete: Cascade, so deleting stories should cascade.
      // Let's explicitly delete Questions first to be safe, then Stories.
      // Need to find stories belonging to the map to delete their questions first.
      const storiesToDelete = await tx.story.findMany({
        where: { mapId: mapId },
        select: { id: true } // Select only IDs
      });
      const storyIdsToDelete = storiesToDelete.map(s => s.id);

      if (storyIdsToDelete.length > 0) {
           // Delete Questions associated with these stories
           await tx.question.deleteMany({
                where: { storyId: { in: storyIdsToDelete } }
           });
           // Note: Examples are deleted via cascade when Rules are deleted
           // Note: Rules are deleted via cascade when Stories are deleted
           // Now delete the stories themselves
           await tx.story.deleteMany({
                where: { id: { in: storyIdsToDelete } }
           });
      }


      // 2. Update the ExampleMap and recreate nested items
      const map = await tx.exampleMap.update({
        where: { id: mapId },
        data: {
          title: title,
          description: description,
          stories: { // Use nested 'create' to add the new/updated stories
            create: stories.map(story => ({
              text: story.text,
              order: story.order,
              questions: {
                create: story.questions?.map(question => ({
                  text: question.text,
                  order: question.order,
                })) || [],
              },
              rules: {
                create: story.rules?.map(rule => ({
                  text: rule.text,
                  order: rule.order,
                  examples: {
                    create: rule.examples?.map(example => ({
                      text: example.text,
                      order: example.order,
                    })) || [],
                  },
                })) || [],
              },
            })),
          },
        },
        // 3. Include the newly created nested data in the result
        include: {
          stories: {
            orderBy: { order: 'asc' },
            include: {
              rules: {
                orderBy: { order: 'asc' },
                include: {
                  examples: { orderBy: { order: 'asc' } },
                },
              },
              questions: { orderBy: { order: 'asc' } },
            },
          },
        },
      }); // End exampleMap.update

      return map; // Return result of the update operation
    }); // End transaction

    console.log(`Map updated successfully: ${mapId}`);
    res.status(200).json(updatedMap); // Send back updated map data

  } catch (error) {
      // Handle potential errors, e.g., map not found for the given ID
     if (error.code === 'P2025') { // Prisma code for record not found on update/delete
        console.error(`Update failed: Map not found with ID: ${mapId}`);
         return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
     }
     console.error(`Error updating map ${mapId}:`, error);
     next(error); // Pass other errors to the global handler
  }
}; // End updateMap

// --- Delete Map ---
export const deleteMap = async (req, res, next) => {
  const { mapId } = req.params; // Get map ID from route parameter

  console.log(`Attempting to delete map ID: ${mapId}`);

  try {
    // --- Authorization Check Placeholder ---
    // TODO: Later, verify req.user owns this mapId before deleting
    // const map = await prisma.exampleMap.findUnique({ where: { id: mapId } });
    // if (!map || map.userId !== req.user.id) {
    //   return res.status(403).json({ message: 'Forbidden: You do not own this map' });
    // }
    // --- End Placeholder ---

    // Delete the map - cascading deletes should handle related records
    await prisma.exampleMap.delete({
      where: { id: mapId },
    });

    console.log(`Map deleted successfully: ${mapId}`);
    // Send a success response, 204 No Content is common for DELETE
    res.status(204).send();

  } catch (error) {
     // Handle potential errors, e.g., map not found
     if (error.code === 'P2025') { // Prisma code for record to delete not found
        console.error(`Delete failed: Map not found with ID: ${mapId}`);
         return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
     }
     console.error(`Error deleting map ${mapId}:`, error);
     next(error); // Pass other errors to the global handler
  }
}; // End deleteMap
