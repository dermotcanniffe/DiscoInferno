// server/controllers/userController.js
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Controller to generate/reset API key for the logged-in user
export const generateApiKey = async (req, res, next) => {
    const userId = req.user.id; // Get user ID from 'protect' middleware

    console.log(`User ${userId} requesting API key generation/reset.`);

    try {
        // 1. Generate a new random API key (raw)
        const rawApiKey = crypto.randomBytes(32).toString('hex');

        // 2. Hash the new key using SHA256
        const hashedApiKey = crypto.createHash('sha256').update(rawApiKey).digest('hex');

        // 3. Update the user record with the new hash
        await prisma.user.update({
            where: { id: userId },
            data: { apiKeyHash: hashedApiKey },
        });

        console.log(`API key hash updated for user ${userId}. Hash starts with ${hashedApiKey.substring(0, 8)}...`);

        // 4. Return the RAW key to the user **THIS ONE TIME ONLY**
        // It's crucial they copy it now; we won't store it unhashed.
        res.status(200).json({
            message: "API Key generated successfully. Store this key securely - you will not see it again!",
            apiKey: rawApiKey // Return the raw key
        });

    } catch (error) {
        console.error(`Error generating API key for user ${userId}:`, error);
        next(error); // Pass to global error handler
    }
};

// Add revokeApiKey, checkApiKeyStatus functions here later if needed
