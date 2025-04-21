// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate } from 'react-router-dom'; // Import routing components

// Import Components
import ExampleMapEditor from "./ExampleMapEditor";
import RegisterForm from "./components/Auth/RegisterForm";
import LoginForm from "./components/Auth/LoginForm";
import { useAuth } from './context/AuthContext'; // <-- Import useAuth

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
    console.log("App useEffect: Fetching initial map data from /api/maps...");

    // --- Add Authorization Header ---
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Authorization': `${token}` // Use the token from useAuth() - includes "Bearer " prefix already
        // Add other headers like Content-Type if needed (not for GET)
      }
    };
    // --- End Header ---

    fetch('/api/maps', fetchOptions) // GET request to load latest map
      .then(response => {
        if (response.status === 404) {
          console.log("App useEffect: No saved map found (404), initializing with default data.");
          return structuredClone(DEFAULT_DATA); // Use default if no map exists for user
        }
        // Handle other potential auth errors like 401/403 if token is invalid/missing
        if (response.status === 401 || response.status === 403) {
          console.error("App useEffect: Auth error fetching map", response.status);
          setError(`Authentication error (${response.status}). Please log out and log back in.`);
          setData(structuredClone(DEFAULT_DATA)); // Fallback
          return null; // Prevent further processing
          //throw new Error(`Authentication error (${response.status})`);
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(mapData => {
        console.log("App useEffect: Received map data:", mapData);
        // Merge fetched data with defaults to ensure basic structure
        if (mapData === null) return; // Exit if auth error occurred above

        const initialData = {
          ...structuredClone(DEFAULT_DATA),
          ...mapData
        };

        setData(initialData);
      })
      .catch(err => {
        console.error("App useEffect: Error fetching initial map data:", err);
        setError(err.message || "Failed to load map data.");
        setData(structuredClone(DEFAULT_DATA)); // Fallback to default data on error
      })
      .finally(() => {
        setLoading(false);
        console.log("App useEffect: Finished fetching initial map data.");
      });

    // TODO: Add 'isAuthenticated' to dependency array later when using real auth state
  }, [isAuthenticated, token]); // Re-run effect if auth state changes


  // --- handleSave  ---
  const handleSave = async () => {
    console.log("--- handleSave started ---");
    console.log("State 'data' at start of handleSave:", JSON.stringify(data, null, 2)); // <-- ADD THIS LOG

    if (!data) { 
      console.error("Cannot save, data is null or still loading.");
      return; }
    console.log("Saving map data to backend...", data);
    const mapPayload = {
      title: data.title || "My Example Map", // Use current state's title or a default
      description: data.description || "",   // Use current state's description or default
      // Use the stories array FROM THE CURRENT STATE 'data'
      // This relies on ExampleMapEditor correctly updating 'data' via onChange
      stories: data.stories || [],
    };
    // --- End Payload Creation ---
    console.log("Payload being constructed:", JSON.stringify(mapPayload, null, 2)); // Check this log

    console.log("Payload being sent:", JSON.stringify(mapPayload, null, 2));
    const isUpdating = !!data.id;
    const url = isUpdating ? `/api/maps/${data.id}` : '/api/maps';
    const method = isUpdating ? 'PUT' : 'POST';
    console.log(`Save method: ${method}, URL: ${url}`);
    try {
      // Use Auth header to fetch
      const fetchOptions = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}` // <-- Add Auth Header
        },
        body: JSON.stringify(mapPayload)
      };
      const response = await fetch(url, fetchOptions); // Use fetchOptions
      //const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mapPayload) });
      if (!response.ok) { /* ... error handling ... */ throw new Error(/* ... */); }
      const savedOrUpdatedMap = await response.json();
      const action = isUpdating ? "updated" : "saved";
      console.log(`Map ${action} successfully:`, savedOrUpdatedMap);
      alert(`Map ${action} successfully!`); // TODO: Replace with toast later
      const updatedData = { ...structuredClone(DEFAULT_DATA), ...savedOrUpdatedMap };
      setData(updatedData);
    } catch (error) { /* ... error handling ... */ }
  };

  // --- handleDelete (Needs Auth Header) ---
  const handleDelete = async () => {
    // ... (keep the existing handleDelete logic from response #68) ...
    // --- IMPORTANT ---
    // TODO: Modify the 'fetch' call inside handleDelete later to include
    // the Authorization header: headers: { ..., 'Authorization': `Bearer ${token}` }
    // --- End TODO ---
    if (!data?.id) { /* ... null check ... */ return; }
    if (!window.confirm(/* ... */)) { return; }
    console.log(`Attempting to delete map ID: ${data.id}`);
    const mapIdToDelete = data.id;
    try {
      const fetchOptions = {
        method: 'DELETE',
        headers: {
          'Authorization': `${token}` // <-- Add Auth Header
        }
      };
      const response = await fetch(`/api/maps/${mapIdToDelete}`, fetchOptions); // Use fetchOptions
      //const response = await fetch(`/api/maps/${mapIdToDelete}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) { /* ... error handling ... */ throw new Error(/* ... */); }
      console.log(`Map deleted successfully: ${mapIdToDelete}`);
      alert("Map deleted successfully!"); // TODO: Replace with toast later
      setData(structuredClone(DEFAULT_DATA));
    } catch (error) { /* ... error handling ... */ }
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    console.log("Calling logoutAction from context...");
    logoutAction();
    // Navigation to /login will happen automatically if '/' is protected
  };

  // --- Internal Component for Protected Route Element ---
  // Handles rendering the editor or redirecting based on auth & data state
  const MapEditorRoute = () => {
    // TODO: Replace mock 'isAuthenticated' with real one from useAuth()
    if (!isAuthenticated) {
      console.log("MapEditorRoute: Not authenticated, redirecting to login.");
      return <Navigate to="/login" replace />; // Redirect if not logged in
    }

    // Show loading/error specific to map data *after* auth check
    if (loading) return <div>Loading map data...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error loading map: {error}</div>;
    if (!data) return <div>No map data available.</div>; // Should ideally be default data here

    // Render editor if authenticated and data is ready
    return (
      <>
        <ExampleMapEditor data={data} onChange={setData} onSave={handleSave} />
        {data && data.id && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <button onClick={handleDelete} style={{ backgroundColor: '#dc3545', color: 'white', /* ... */ }}>
              Delete This Map
            </button>
          </div>
        )}
      </>
    );
  };

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