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

// Add other controller functions here later (getMaps, getMapById, updateMap, deleteMap)
