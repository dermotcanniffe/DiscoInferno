// server/controllers/authController.js
import bcrypt from 'bcryptjs'; // Use default import
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // Cost factor for hashing algorithm

// --- Register New User ---
export const register = async (req, res, next) => {
  const { email, password, name } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  // Add more validation as needed (password complexity, email format)

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }, // Store emails lowercase for consistency
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' }); // 409 Conflict
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: passwordHash,
        name: name, // Optional name
      },
      // Select only safe fields to return (exclude passwordHash)
      select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
      }
    });

    console.log(`User registered successfully: ${newUser.email}`);
    // Respond with created user info (excluding password)
    res.status(201).json(newUser);

  } catch (error) {
    console.error("Error during registration:", error);
    next(error); // Pass to global error handler
  }
};


// --- Login User ---
// This function runs ONLY if passport.authenticate('local') succeeds
export const login = (req, res) => {
    // req.user is populated by the passport 'local' strategy's success callback (done(null, user))
    const user = req.user;
    console.log(`User logged in successfully: ${user.email}`);

    // Create JWT Payload
    const payload = {
        id: user.id,
        email: user.email,
        // Add other non-sensitive info if needed (e.g., name, roles)
    };

    // Sign the token
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }; // Default to 7 days if not set

    if (!secret) {
        console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
        return res.status(500).json({ message: "Internal server error (JWT configuration missing)." });
    }

    jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
            console.error("Error signing JWT:", err);
            return res.status(500).json({ message: "Error generating authentication token." });
        }
        // Send the token back to the client
        res.json({
            message: "Login successful!",
            token: 'Bearer ' + token, // Standard bearer token format
            user: { // Send back some user info
                 id: user.id,
                 email: user.email,
                 name: user.name
            }
        });
    });
};
