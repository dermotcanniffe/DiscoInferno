// server/config/passport.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
//import { PrismaClient } from '@prisma/client'; // using Singleton Prisma Client
import prisma from '../../src/lib/prisma.js'; 


// --- Local Strategy for Email/Password Login ---
passport.use(new LocalStrategy(
    {
        usernameField: 'email', // We use email as the username field
        passwordField: 'password' // Expect 'password' field
    },
    async (email, password, done) => {
        console.log(`Passport Local Strategy attempting login for: ${email}`);
        try {
            // 1. Find the user by email (case-insensitive search)
            const user = await prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });

            // 2. If user not found, call done with error message
            if (!user) {
                console.log(`Login failed: User not found for email: ${email}`);
                // done(error, user, info) -> user is false if auth fails
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            // 3. If user found, compare the provided password with the stored hash
            const isMatch = await bcrypt.compare(password, user.passwordHash);

            // 4. If passwords match, call done with the user object
            if (isMatch) {
                console.log(`Login successful for user: ${email}`);
                // done(error, user) -> user object passed indicates success
                return done(null, user);
            } else {
                // 5. If passwords don't match, call done with error message
                console.log(`Login failed: Incorrect password for email: ${email}`);
                return done(null, false, { message: 'Incorrect email or password.' });
            }
        } catch (error) {
            // Handle potential database errors
            console.error("Error in Passport Local Strategy:", error);
            return done(error); // Pass DB errors to Passport
        }
    }
));
// --- JWT Strategy for Validating Tokens ---
// This strategy runs for requests authenticated with JWTs (most API calls after login)
const jwtOptions = {
    // Tells strategy how to extract the token from the request header
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // The same secret used to sign the tokens
    secretOrKey: process.env.JWT_SECRET
  };
  
  passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    // The 'payload' is the decoded JWT content (e.g., { id: '...', email: '...' })
    console.log(`Passport JWT Strategy processing payload for user ID: ${payload.id}`);
    try {
      // Find the user specified in the token payload
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });
  
      // If user is found, pass the user object to the request handler
      if (user) {
        console.log(`JWT valid: User found (${user.email})`);
        return done(null, user); // Attach user to req.user
      } else {
        // If user doesn't exist (e.g., deleted after token was issued)
        console.log(`JWT invalid: User not found for ID: ${payload.id}`);
        return done(null, false); // No error, but authentication fails
      }
    } catch (error) {
      console.error("Error in Passport JWT Strategy:", error);
      return done(error, false); // Pass DB errors
    }
  }));
  // --- End JWT Strategy ---
  

export default passport; // Export configured passport instance (optional)

