import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mapRoutes from './routes/mapRoutes.js'; // Import the map router
import userRoutes from './routes/userRoutes.js';
import passport from 'passport'; // Import passport
import authRoutes from './routes/authRoutes.js'; // Import auth routes
import externalApiRoutes from './routes/externalApiRoutes.js';
import pluginConfigRoutes from './routes/pluginConfigRoutes.js';
import './config/passport.js'; // Import passport configuration (we'll create this next)


// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Use port from env file or default to 5000

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust later for production)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Passport BEFORE mounting routes that use it
app.use(passport.initialize())

// ... graceful shutdown ...

// --- API Routes ---

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Mount Auth Routes
app.use('/api/auth', authRoutes); // Routes for /api/auth/register, /api/auth/login

// Mount the map routes
app.use('/api/maps', mapRoutes); // All routes defined in mapRoutes will be prefixed with /api/maps
// Mount the user routes
app.use('/api/me', userRoutes); // <-- (already protected internally)
// Mount external API routes
app.use('/api/external', externalApiRoutes);
// Mount Plugin Config Routes
app.use('/api/me/plugins', pluginConfigRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Basic error handling (optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default app; // Optional: export for potential testing
