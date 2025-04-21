// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // To redirect after login/logout

// 1. Create the Context
const AuthContext = createContext(null);

// Helper function to get initial state from localStorage
const getInitialAuthState = () => {
    try {
        const token = localStorage.getItem('authToken');
        const userJson = localStorage.getItem('authUser');
        const user = userJson ? JSON.parse(userJson) : null;
        // Basic check if token exists, doesn't validate expiry here
        return { token, user };
    } catch (error) {
        console.error("Error reading auth state from localStorage:", error);
        return { token: null, user: null };
    }
};


// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(getInitialAuthState);
    const [isLoading, setIsLoading] = useState(false); // To track login/register process
    const [authError, setAuthError] = useState(null); // To store login/register errors
    const navigate = useNavigate(); // Hook for navigation

    // Note: We removed the initial useEffect that checked localStorage
    // because getInitialAuthState now handles reading it directly on init.


    // Function to handle login success
    const login = (userData, authToken) => {
        try {
            localStorage.setItem('authToken', authToken); // Store token
            localStorage.setItem('authUser', JSON.stringify(userData)); // Store user info
            setAuthState({ token: authToken, user: userData }); // Update state
            setAuthError(null); // Clear any previous errors
            console.log("AuthContext: User logged in, token stored.");
            navigate('/'); // Redirect to home/map page after login
        } catch (error) {
            console.error("Error storing auth state in localStorage:", error);
            setAuthError("Failed to store login information.");
            // Clear potentially partial storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setAuthState({ token: null, user: null });
        }
    };

    // Function to handle logout
    const logout = () => {
        try {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setAuthState({ token: null, user: null }); // Reset state
            setAuthError(null);
            console.log("AuthContext: User logged out, token removed.");
             navigate('/login'); // Redirect to login page after logout
        } catch (error) {
            console.error("Error clearing auth state from localStorage:", error);
            // State is already reset, maybe show an error notification?
        }
    };

    // --- Add API Call Logic Inside Provider ---
    // This centralizes API calls and state updates

    const apiLogin = async (email, password) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            // Call internal login handler on success
            login(data.user, data.token);
            return true; // Indicate success
        } catch (err) {
            console.error('API Login failed:', err);
            setAuthError(err.message || 'Login failed. Please check credentials.');
            return false; // Indicate failure
        } finally {
            setIsLoading(false);
        }
    };

    const apiRegister = async (email, password, name) => {
        setIsLoading(true);
        setAuthError(null);
        try {
             const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
             });
             const data = await response.json();
             if (!response.ok) {
                 throw new Error(data.message || `HTTP error! status: ${response.status}`);
             }
             console.log('API Registration successful:', data);
             // Optionally auto-login or just return success message
             return { success: true, message: `Registration successful for ${data.email}! You can now log in.` };
        } catch (err) {
             console.error('API Registration failed:', err);
             setAuthError(err.message || 'Registration failed. Please try again.');
             return { success: false, message: err.message || 'Registration failed.'};
        } finally {
             setIsLoading(false);
        }
    };


    // 3. Create the value provided by the context
    const value = {
        token: authState.token,
        user: authState.user,
        isAuthenticated: !!authState.token, // Simple check if token exists
        isLoading, // Loading state during login/register API calls
        authError,  // Login/register API errors
        loginAction: apiLogin,    // Expose API login action
        registerAction: apiRegister, // Expose API register action
        logoutAction: logout,     // Expose logout action
    };

    // 4. Return the Provider wrapping the children
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 5. Create and export a custom hook to easily use the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
