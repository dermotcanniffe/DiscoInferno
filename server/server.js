// server/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mapRoutes from './routes/mapRoutes.js'; // Import the map router


// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Use port from env file or default to 5000

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust later for production)
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies

// --- API Routes ---

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Mount the map routes
app.use('/api/maps', mapRoutes); // All routes defined in mapRoutes will be prefixed with /api/maps


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
