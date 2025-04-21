// server/middleware/apiKeyAuthMiddleware.js
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateApiKey = async (req, res, next) => {
    // 1. Get the API key from a custom header (e.g., X-API-Key)
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
        console.warn('API Key Auth Failed: Missing X-API-Key header');
        return res.status(401).json({ message: 'Unauthorized: API Key required.' });
    }

    // 2. Hash the provided API key using the same method used when storing it
    //    (We'll use SHA256 hex digest here)
    const hashedKeyProvided = crypto.createHash('sha256').update(apiKey).digest('hex');

    console.log(`API Key Auth Attempt: Received key starts with ${apiKey.substring(0, 4)}..., Hashed to ${hashedKeyProvided.substring(0, 8)}...`);

    try {
        // 3. Look for a user with a matching *hashed* API key
        //    We added a @unique constraint, so this should find 0 or 1 user
        const user = await prisma.user.findUnique({
            where: { apiKeyHash: hashedKeyProvided },
            // Select only necessary fields
            select: { id: true, email: true, name: true }
        });

        // 4. If no user found with that hashed key, deny access
        if (!user) {
            console.warn(`API Key Auth Failed: No user found for hash starting with ${hashedKeyProvided.substring(0, 8)}...`);
            return res.status(401).json({ message: 'Unauthorized: Invalid API Key.' });
        }

        // 5. If user found, attach user info to the request object and proceed
        console.log(`API Key Auth Success: User <span class="math-inline">\{user\.email\} \(</span>{user.id}) authenticated.`);
        req.user = user; // Attach the authenticated user info
        next(); // Continue to the next middleware or route handler

    } catch (error) {
        console.error('API Key Auth Error: Database error during key lookup:', error);
        return res.status(500).json({ message: 'Internal Server Error during authentication.' });
    }
};
