import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mapRoutes from './routes/mapRoutes.js'; // Import the map router
import userRoutes from './routes/userRoutes.js';
import passport from 'passport'; // Import passport
import authRoutes from './routes/authRoutes.js'; // Import auth routes
import externalApiRoutes from './routes/externalApiRoutes.js';
import pluginConfigRoutes from './routes/pluginConfigRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js'; 
import linkRoutes from './routes/linkRoutes.js';
import './config/passport.js'; // Import passport configuration (we'll create this next)
// --- Import Plugin Manager ---
import pluginManager from '../src/services/PluginManager.js'; // Adjust path if needed!


// Load environment variables from .env file
dotenv.config();

// --- Main Async Function to Start Server ---
const startServer = async () => {
  try {
      // --- Load Plugins EARLY ---
      console.log('[Server] Loading plugins...');
      await pluginManager.loadPlugins(); // <<< CALL & AWAIT PLUGIN LOADING
      console.log('[Server] Plugin loading sequence complete.');

      // --- Initialize Express App ---
      const app = express();
      const PORT = process.env.PORT || 5000;

      // --- Middleware ---
      app.use(cors()); // Enable CORS
      app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
      app.use(express.urlencoded({ limit: '10mb', extended: true })); // Parse URL-encoded bodies
      app.use(passport.initialize()); // Initialize Passport

      // --- API Routes ---
      console.log('[Server] Mounting API routes...');
      app.get('/api/test', (req, res) => res.json({ message: 'Backend server is running!' }));
      app.use('/api/auth', authRoutes);
      app.use('/api/maps', mapRoutes);
      app.use('/api/me', userRoutes);
      app.use('/api/external', externalApiRoutes);
      app.use('/api/me/plugins', pluginConfigRoutes);
      app.use('/api/settings', settingsRoutes);
      app.use('/api/settings', settingsRoutes);
      app.use('/api/link', linkRoutes);
      console.log('[Server] API routes mounted.');

      // --- Basic Error Handling Middleware (Place after routes) ---
      app.use((err, req, res, next) => {
          console.error("[Server Error Middleware] Caught error:", err.stack);
          res.status(500).send('Something broke!');
      });

      // --- Start Listening ---
      app.listen(PORT, () => {
          console.log(`Server listening on port ${PORT}`); // Should appear AFTER plugin logs
      });

  } catch (error) {
      console.error("FATAL: Server failed to start:", error);
      process.exit(1); // Exit if critical startup error (like plugin loading fails badly)
  }
};

// --- Execute the startup function ---
startServer();

//export default app; // Optional: export for potential testing
