// /lib/prisma.js (or /src/lib/prisma.js) - ESM Version

import { PrismaClient } from '@prisma/client';

// Add prisma to the NodeJS global type in development to prevent
// multiple instances due to hot reloading.
// Use 'declare global { var prisma: PrismaClient | undefined }' in a .d.ts file if using TypeScript.
const globalForPrisma = globalThis;

// Check if a prisma instance already exists on the global object, otherwise create one.
// This ensures a single instance, especially during development with hot-reloading.
const prisma = globalForPrisma.prisma ?? new PrismaClient({
    // Optional: Configure Prisma Client logging based on environment
    // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

console.log(`PrismaClient instance ${globalForPrisma.prisma ? 'reused' : 'created'}.`);

// Cache the instance on the global object *only* in development environment.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export the single instance using ES Module syntax
export default prisma;

// Optional: You might want graceful shutdown logic depending on your server setup
// async function disconnectPrisma() {
//   await prisma.$disconnect();
//   console.log('PrismaClient disconnected on app shutdown.');
// }
// process.on('SIGINT', disconnectPrisma); // Example: Handle Ctrl+C
// process.on('SIGTERM', disconnectPrisma); // Example: Handle termination signals

