// server/controllers/externalApiController.js
//import { PrismaClient } from '@prisma/client'; // using Singleton Prisma Client
import prisma from '../../src/lib/prisma.js'; 

// --- Create Map via API Key ---
export const externalCreateMap = async (req, res, next) => {
    // User info comes from authenticateApiKey middleware attaching it to req.user
    const userId = req.user?.id;
    const userEmail = req.user?.email; // For logging
    const { title, description, stories } = req.body; // Get payload from request body

    console.log(`--- externalCreateMap ---`);
    console.log(`Authenticated via API Key for User: <span class="math-inline">\{userEmail\} \(</span>{userId})`);
    console.log(`Received Request Body:`, JSON.stringify(req.body, null, 2));

    // Validation
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User could not be identified from API Key.' });
    }
    if (!title || !stories) {
        return res.status(400).json({ message: 'Bad Request: Missing required fields title or stories.' });
    }

    try {
        const newMap = await prisma.exampleMap.create({
            data: {
                title: title,
                description: description,
                userId: userId, // Associate with API key's user
                stories: { // Use nested create with order handling
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
                },
            },
            include: { // Include details needed by external consumer
                stories: {
                    orderBy: { order: 'asc' },
                    include: {
                        rules: {
                            orderBy: { order: 'asc' },
                            include: { examples: { orderBy: { order: 'asc' } } }
                        },
                        questions: { orderBy: { order: 'asc' } }
                    }
                }
            }
        });

        console.log(`External API: Map created successfully ${newMap.id} for user ${userId}`);
        res.status(201).json(newMap);

    } catch (error) {
        console.error(`External API: Error creating map for user ${userId}:`, error);
        next(error);
    }
};

// --- Get Specific Map by ID via API Key ---
export const externalGetMapById = async (req, res, next) => {
    const { mapId } = req.params;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    console.log(`--- externalGetMapById ---`);
    console.log(`Authenticated via API Key for User: <span class="math-inline">\{userEmail\} \(</span>{userId})`);
    console.log(`Requesting Map ID: ${mapId}`);

     if (!userId) {
         return res.status(401).json({ message: 'Unauthorized: User could not be identified from API Key.' });
     }

    try {
        const map = await prisma.exampleMap.findUniqueOrThrow({
            where: { id: mapId },
            include: { /* ... full includes ... */ } // Add same includes as above
        });

        // Authorization: Check ownership
        if (map.userId !== userId) {
            console.warn(`External API Forbidden: User ${userId} tried to access map ${mapId} owned by ${map.userId}`);
            return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
        }

        console.log(`External API: Successfully fetched map ${mapId} for user ${userId}`);
        res.status(200).json(map);

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            console.log(`External API: Map not found with ID: ${mapId}`);
            return res.status(404).json({ message: `Map not found with ID: ${mapId}` });
        }
        console.error(`External API: Error fetching map ${mapId} for user ${userId}:`, error);
        next(error);
    }
};

