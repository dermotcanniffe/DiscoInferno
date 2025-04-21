// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate } from 'react-router-dom'; // Import routing components

// Import Components
import ExampleMapEditor from "./ExampleMapEditor";
import RegisterForm from "./components/Auth/RegisterForm";
import LoginForm from "./components/Auth/LoginForm";
import { useAuth } from './context/AuthContext'; // <-- Import useAuth

const getAuthFetchOptions = (token, method = 'GET', body = null) => {
  // Define standard headers
  const headers = {
      'Content-Type': 'application/json',
  };
  // Add the Authorization header IF token exists
  if (token) {
      headers['Authorization'] = `${token}`; // Assumes token includes "Bearer " prefix from context/login
  }
  // Define base options object
  const options = { method, headers };
  // Add body IF it's provided (and stringify it)
  if (body) {
      options.body = JSON.stringify(body);
  }
  return options; // Return the complete options object for fetch
};
// ---> END HELPER FUNCTION DEFINITION <---


// Default Data
export const DEFAULT_DATA = {
  title: "My New Map", // Or your preferred default title
  description: "",
  stories: [ // Start with one empty story object in the array
    {
      // No ID needed here, backend will assign
      text: "Initial Story...",
      order: 0,
      rules: [],
      questions: []
    }
  ]
};
// ---> END OF DEFAULT_DATA DEFINITION <---

export default function App() {
  // --- State Variables ---
  const [data, setData] = useState(null); // Start null before loading
  const [loading, setLoading] = useState(true); // Start in loading state (for initial map load)
  const [error, setError] = useState(null); // To store map loading errors

  // Real Auth State from Context 
  const { token, user, isAuthenticated, isLoading: isAuthLoading, authError, logoutAction } = useAuth();

  // --- Mock Auth State (Temporary) ---
  // This simulates whether the user is logged in.
  // TODO: Replace this with 'isAuthenticated' from useAuth() later.
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // --- End Mock Auth State ---

  // --- Data Loading useEffect ---
  // Fetches the latest map IF the user is authenticated
  useEffect(() => {
    // Don't attempt to load maps if not authenticated
    // 'isAuthenticated' from useAuth()
    if (!isAuthenticated) {
      console.log("App useEffect: User not authenticated, skipping map load, setting default data.");
      setData(structuredClone(DEFAULT_DATA)); // Show default map if logged out
      setLoading(false); // Not loading anymore
      setError(null); // Clear any previous errors
      return; // Exit effect early
    }

    // Proceed with fetching if authenticated
    setLoading(true);
    setError(null);
    console.log("App useEffect: Fetching initial map data with token...");
        // Use helper to add token (define getAuthFetchOptions outside component)
        fetch('/api/maps', getAuthFetchOptions(token)) // Pass token to helper
            .then(response => {
                if (response.status === 404) {
                    console.log("App useEffect: No saved map found (404), using default.");
                    return structuredClone(DEFAULT_DATA);
                }
                // Handle auth errors explicitly (e.g., invalid/expired token)
                if (response.status === 401 || response.status === 403) {
                     console.error("App useEffect: Auth error fetching map", response.status);
                     setError(`Authentication error (${response.status}). Please log in again.`);
                     logoutAction(); // Force logout immediately if token is bad
                     return null; // Signal error to prevent further processing
                }
                if (!response.ok) {
                    // Handle other non-auth HTTP errors
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json(); // Parse data if response is OK
            })
            .then(mapData => {
                 if (mapData === null) return; // Exit if auth error occurred above

                 console.log("App useEffect: Received map data:", mapData);
                 // Merge fetched data with defaults
                 const initialData = { ...structuredClone(DEFAULT_DATA), ...mapData };
                 // Ensure stories array exists
                 if (!initialData.stories || initialData.stories.length === 0) {
                     initialData.stories = structuredClone(DEFAULT_DATA.stories);
                 }
                 setData(initialData); // Set the final state
            })
            .catch(err => {
                 console.error("App useEffect: Error during fetch/processing:", err);
                  // Avoid setting error again if it was an auth error already handled
                 if (!String(err.message).includes('Authentication error')) {
                     setError(err.message || "Failed to load map data.");
                 }
                 // Ensure data is reset to default on error
                 setData(structuredClone(DEFAULT_DATA));
            })
            .finally(() => {
                 setLoading(false); // Ensure loading is always set to false
                 console.log("App useEffect: Finished fetch attempt.");
            });

    // Re-run this effect if the user logs in/out (isAuthenticated changes)
    // or if the token itself changes (e.g., refresh token mechanism later)
    }, [isAuthenticated, token, logoutAction]); // Updated dependencies



  // --- handleSave  ---
  const handleSave = async () => {
    // --- 1. Add Authentication Check ---
    if (!isAuthenticated) {
         alert("Please log in to save.");
         return; // Don't proceed if not logged in
    }
    // --- End Auth Check ---

    if (!data) {
        console.error("Cannot save, data is null or still loading.");
        alert("Cannot save map, data is not ready yet.");
        return;
    }
   console.log("Saving map data to backend...", data);

   // Payload creation (ensure this uses your current data state correctly)
   const mapPayload = {
     title: data.title || "My Example Map",
     description: data.description || "",
     stories: data.stories || [],
   };
   console.log("Payload being constructed:", JSON.stringify(mapPayload, null, 2));

   const isUpdating = !!data.id;
   const url = isUpdating ? `/api/maps/${data.id}` : '/api/maps';
   const method = isUpdating ? 'PUT' : 'POST';
   console.log(`Save method: ${method}, URL: ${url}`);

   try {
       // --- 2. Use Helper for Fetch Options (includes token) ---
       const fetchOptions = getAuthFetchOptions(token, method, mapPayload);
       // --- End Helper Use ---

       console.log("Fetch options being used:", fetchOptions); // Log options (excluding body potentially)

       const response = await fetch(url, fetchOptions); // Use the generated options

       if (!response.ok) {
         // Try to parse error json, but handle cases where it might not be json
         let errorMsg = `HTTP error! status: ${response.status}`;
         try {
             const errorData = await response.json();
             errorMsg = errorData.message || errorMsg;
         } catch (parseError) {
             // If parsing fails, stick with the status code message
             console.warn("Could not parse error response as JSON.");
         }
         throw new Error(errorMsg);
       }

       const savedOrUpdatedMap = await response.json();
       const action = isUpdating ? "updated" : "saved";
       console.log(`Map ${action} successfully:`, savedOrUpdatedMap);
       alert(`Map ${action} successfully!`); // TODO: Replace with toast later

       // Update state with the response from backend
       const updatedData = { ...structuredClone(DEFAULT_DATA), ...savedOrUpdatedMap };
       setData(updatedData);

   } catch (error) {
     console.error(`Error ${isUpdating ? 'updating' : 'saving'} map:`, error);
     alert(`Error ${isUpdating ? 'updating' : 'saving'} map: ${error.message}`);
   }
};

  // --- handleDelete  (Auth Header) ---
const handleDelete = async () => {
  // --- 1. Add Authentication Check ---
  if (!isAuthenticated) {
       alert("Please log in to delete.");
       return; // Don't proceed if not logged in
  }
  // --- End Auth Check ---

  // Check if there is a map loaded with an ID
  if (!data?.id) {
      alert("No map loaded or map hasn't been saved yet.");
      return;
  }

  // Confirm with the user
  const mapTitle = data.title || 'this map'; // Get title for confirmation message
  if (!window.confirm(`Are you sure you want to delete map "${mapTitle}"? This cannot be undone.`)) {
      return; // User cancelled
  }

  const mapIdToDelete = data.id;
  console.log(`Attempting to delete map ID: ${mapIdToDelete}`);

  try {
      // --- 2. Use Helper for Fetch Options (includes token) ---
      const fetchOptions = getAuthFetchOptions(token, 'DELETE');
      // --- End Helper Use ---

      console.log("Fetch options being used:", fetchOptions); // Log options

      const response = await fetch(`/api/maps/${mapIdToDelete}`, fetchOptions); // Use the generated options

      // Check for HTTP errors (like 404 Not Found, 403 Forbidden)
      // Note: Successful DELETE often returns 204 No Content, which response.ok handles.
      if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
              // Try to get more specific message from backend if possible
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
              console.warn("Could not parse error response as JSON for DELETE.");
          }
          throw new Error(errorMsg);
      }

      console.log(`Map deleted successfully: ${mapIdToDelete}`);
      alert("Map deleted successfully!"); // TODO: Replace with toast later

      // Reset the state to default after successful deletion
      setData(structuredClone(DEFAULT_DATA));

  } catch (error) {
      console.error(`Error deleting map ${mapIdToDelete}:`, error);
      alert(`Error deleting map: ${error.message}`);
  }
};

  // --- Logout Handler ---
  const handleLogout = () => {
    console.log("Calling logoutAction from context to log out...");
    logoutAction(); // Call the function provided by useAuth()
    // No need to call setIsAuthenticated or navigate here,
    // AuthContext's logoutAction and the component reacting to
    // the change in 'isAuthenticated' state will handle it.
};

  // --- Internal Component for Protected Route Element ---
  // Handles rendering the editor or redirecting based on auth & data state
  const MapEditorRoute = () => {
    // Get AUTH state needed for this component's logic
    // Note: We get it here again, though App also has it, to ensure this
    // component reacts correctly if used in different contexts later.
    const { isAuthenticated: isAuthNow } = useAuth();

    // Check authentication status FIRST
    if (!isAuthNow) {
        // If user is not authenticated, redirect them to the login page.
        // 'replace' prevents the current route from being added to history.
         console.log("ProtectedMapEditor: Not authenticated, redirecting to /login.");
        return <Navigate to="/login" replace />;
    }

    // If authenticated, THEN check map data loading/error states
    // These states (loading, error, data) come from the parent App component's state
    if (loading) {
        // Display loading message while map data is being fetched
        return <div>Loading map data...</div>;
    }
    if (error) {
        // Display error if map data failed to load (after login)
        return <div style={{ padding: '20px', color: 'red' }}>Map Loading Error: {error}</div>;
    }
    if (!data) {
        // Fallback if data is somehow null after loading finishes without error
        // (Could happen if default data setting failed, though unlikely now)
        return <div>No map data available.</div>;
    }

    // If authenticated AND map data is loaded without errors, render the editor
    console.log("ProtectedMapEditor: Rendering Editor for authenticated user.");
    return (
        <>
            <ExampleMapEditor data={data} onChange={setData} onSave={handleSave} />
            {/* Conditional Delete Button */}
            {data && data.id && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <button onClick={handleDelete} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Delete This Map
                    </button>
                </div>
            )}
        </>
    );
}; //
  // --- Main Return: Layout + Router Outlet ---
  return (
    <div> {/* Main App Container */}
      {/* --- Navigation (Always Rendered) --- */}
      <nav style={{ background: '#eee', padding: '10px', marginBottom: '10px' }}>
        {/* TODO: Use NavLink for active styling later */}
        <Link to="/" style={{ marginRight: '10px' }}>Home (Map)</Link>

        {/* Show Login/Register or Logout based on mock auth state */}
        {!isAuthenticated && (
          <>
            <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
            <Link to="/register" style={{ marginRight: '10px' }}>Register</Link>
          </>
        )}
        {isAuthenticated && (
          <button onClick={handleLogout}>Logout</button>
        )}
      </nav>
      {/* --- End Navigation --- */}

      {/* No top-level error/loading here anymore - handled in MapEditorRoute */}
      {/* {error && <div style={{...}}>Data Loading Error: {error}</div>} */}

      {/* --- Router Outlet (Always Rendered) --- */}
      <Routes>
        {/* Redirect logged-in users away from login/register */}
        <Route path="/login" element={
          !isAuthenticated ? <LoginForm /> : <Navigate to="/" replace />
        } />
        <Route path="/register" element={
          !isAuthenticated ? <RegisterForm /> : <Navigate to="/" replace />
        } />

        {/* Main Map Route - Element uses the protected wrapper component */}
        <Route path="/" element={<MapEditorRoute />} />

        {/* Add other routes here later */}

      </Routes>
      {/* --- End Routes --- */}

    </div> // End Main App Container
  );
} // End of App component