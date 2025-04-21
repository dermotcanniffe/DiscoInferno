// src/App.jsx
import React, { useState, useEffect } from "react"; // Removed useEffect from App itself initially
// Import router components
import { Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom';
// Import Auth Hook
import { useAuth } from './context/AuthContext'; // Adjust path if needed
// Import Components
import ExampleMapEditor from "./ExampleMapEditor"; // Adjust path if needed
import RegisterForm from "./components/Auth/RegisterForm"; // Adjust path if needed
import LoginForm from "./components/Auth/LoginForm";       // Adjust path if needed
import DashboardPage from "./pages/DashboardPage";

// --- Helper Function (Define outside App component) ---
// Creates fetch options, adding Auth header if token exists
const getAuthFetchOptions = (token, method = 'GET', body = null) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        // Assumes token from context includes "Bearer " prefix
        headers['Authorization'] = `${token}`;
    }
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return options;
};
// --- End Helper Function ---

// --- ENSURE THIS INLINE DEFINITION EXISTS ---
export const DEFAULT_DATA = {
  title: "My New Map", // Or your preferred default title
  description: "",
  stories: [ // Start with one empty story object in the array
    {
      text: "Initial Story...",
      order: 0,
      rules: [],
      questions: []
    }
  ]
};
// --- END OF DEFAULT_DATA DEFINITION ---


// --- App Component (Main Layout, Routing, Auth Context) ---
export default function App() {
    // Get Authentication state from context
    const { token, user, isAuthenticated, isLoading: isAuthLoading, authError, logoutAction } = useAuth();

    // NOTE: Map data state (data, loading, error) and handlers (handleSave, handleDelete)
    // have been MOVED INTO the ProtectedMapEditor component below.

    // Logout handler using context action
    const handleLogout = () => {
        console.log("Calling logoutAction from context...");
        logoutAction();
    };

    // --- Protected Route Element Definition ---
    // This component now fetches and manages the state for ONE map
    const ProtectedMapEditor = () => {
        const { isAuthenticated: isAuthNow, token: currentToken, logoutAction: contextLogout } = useAuth(); // Get needed context here
        const { mapId } = useParams(); // Get mapId from URL (:mapId)
        const navigate = useNavigate(); // For navigation after save/delete

        // State for map data within this component
        const [data, setData] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        // Effect to load data based on mapId and auth state
        useEffect(() => {
            setData(null); // Reset data when mapId changes
            setLoading(true);
            setError(null);

            if (!isAuthNow) {
                setLoading(false);
                return; // Auth check handled by routing, but safe to have here
            }

            let isNew = mapId === 'new';
            let fetchUrl = '';

            if (isNew) {
                console.log("ProtectedMapEditor: Setting up new map.");
                setData(structuredClone(DEFAULT_DATA)); // Start with default structure
                setLoading(false);
                return; // Don't fetch
            } else if (mapId) {
                // Fetch specific map by ID
                console.log(`ProtectedMapEditor: Fetching map ${mapId}...`);
                fetchUrl = `/api/maps/${mapId}`;
            } else {
                // Fallback if no ID provided (e.g., navigated directly to '/map')
                // We could redirect to list, or load latest as before
                 console.log("ProtectedMapEditor: No mapId provided, fetching latest...");
                 fetchUrl = `/api/maps/latest`;
            }

            fetch(fetchUrl, getAuthFetchOptions(currentToken))
                .then(response => {
                    if (response.status === 404) {
                        const msg = mapId ? `Map with ID ${mapId} not found or not owned.` : 'No maps found for user.';
                        console.log(`ProtectedMapEditor: ${msg}`);
                        throw new Error(msg); // Throw error to be caught below
                    }
                    if (response.status === 401 || response.status === 403) {
                        console.error("ProtectedMapEditor: Auth error fetching map", response.status);
                        contextLogout(); // Use logout action from context
                        throw new Error(`Authentication error (${response.status}).`);
                    }
                    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                    return response.json();
                })
                .then(mapData => {
                    console.log("ProtectedMapEditor: Received map data:", mapData);
                    // Use default as base, override with loaded data
                    const initialData = { ...structuredClone(DEFAULT_DATA), ...mapData };
                     // Ensure stories array exists if map was somehow saved without it
                    if (!initialData.stories) initialData.stories = [];
                    setData(initialData);
                })
                .catch(err => {
                    console.error("ProtectedMapEditor: Error fetching map data:", err);
                    setError(err.message || "Failed to load map data.");
                    // Don't set default data on error, just show the error message
                })
                .finally(() => { setLoading(false); });

        // Dependencies: run when mapId or auth state changes
        }, [mapId, isAuthNow, currentToken, contextLogout]);


        // --- Handlers defined inside ProtectedMapEditor ---
         const handleSave = async () => {
             if (!isAuthNow || !data) return;
             console.log("ProtectedMapEditor handleSave:", data);
             const mapPayload = { title: data.title || "My Map", description: data.description || "", stories: data.stories || [] };
             const isUpdating = !!data.id; // Check if loaded map has an ID
             const url = isUpdating ? `/api/maps/${data.id}` : '/api/maps';
             const method = isUpdating ? 'PUT' : 'POST';
             try {
                 const fetchOptions = getAuthFetchOptions(currentToken, method, mapPayload);
                 const response = await fetch(url, fetchOptions);
                 if (!response.ok) {
                     const errorData = await response.json().catch(() => ({ message: `Save failed with status ${response.status}` })); // Catch JSON parse errors
                     throw new Error(errorData.message || `Save failed with status ${response.status}`);
                 }
                 const savedOrUpdatedMap = await response.json();
                 alert(`Map ${isUpdating ? 'updated' : 'saved'}!`);
                 // Update state with response (includes ID if new)
                 setData({ ...structuredClone(DEFAULT_DATA), ...savedOrUpdatedMap });
                 // Navigate to the correct URL if it was a new map
                 if (!isUpdating && savedOrUpdatedMap.id) {
                      navigate(`/map/${savedOrUpdatedMap.id}`, { replace: true });
                 }
             } catch (err) {
                 console.error("Error saving map:", err);
                 alert(`Error saving map: ${err.message}`);
             }
         };

        const handleDelete = async () => {
            if (!isAuthNow || !data?.id) return;
            const mapTitle = data.title || 'this map';
            if (!window.confirm(`Delete map "${mapTitle}"?`)) return;
            const mapIdToDelete = data.id;
            try {
                const fetchOptions = getAuthFetchOptions(currentToken, 'DELETE');
                const response = await fetch(`/api/maps/${mapIdToDelete}`, fetchOptions);
                 if (!response.ok && response.status !== 204) {
                     const errorData = await response.json().catch(() => ({ message: `Delete failed with status ${response.status}` }));
                     throw new Error(errorData.message || `Delete failed with status ${response.status}`);
                 }
                alert("Map deleted!");
                navigate('/', { replace: true }); // Navigate to map list after delete
            } catch (err) {
                console.error(`Error deleting map ${mapIdToDelete}:`, err);
                alert(`Error deleting map: ${err.message}`);
            }
        };
        // --- End Handlers ---

        // --- Render Logic for this component ---
        if (loading) return <div>Loading Editor...</div>;
        if (error) return <div style={{ padding: '20px', color: 'red' }}>Error Loading Map: {error}</div>;
        if (!data) return <div>Could not load map data.</div>; // Should ideally not happen if !loading && !error

        // Render editor if data is ready
        return (
            <>
                {/* Pass this component's state and handlers down */}
                <ExampleMapEditor data={data} onChange={setData} onSave={handleSave} />
                {/* Delete Button (conditional on data having an ID) */}
                {data && data.id && (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <button onClick={handleDelete} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Delete This Map
                        </button>
                    </div>
                )}
            </>
        );
    }; // --- End ProtectedMapEditor ---


    // --- App Return (Layout + Routes) ---
    return (
        <div> {/* Main App Container */}
            <nav style={{ background: '#eee', padding: '10px', marginBottom: '10px' }}>
                {/* Link to root now conceptually means "Map List" */}
                {isAuthenticated && <Link to="/" style={{ marginRight: '10px' }}>My Example Maps</Link>}
                {!isAuthenticated && <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>}
                {!isAuthenticated && <Link to="/register" style={{ marginRight: '10px' }}>Register</Link>}
                {isAuthenticated && <button onClick={handleLogout}>Logout</button>}
                {isAuthenticated && user && <span style={{float: 'right'}}>Logged in as: {user.name || user.email}</span>}
            </nav>

            {/* Display global Authentication errors */}
            {authError && (
                <div style={{ padding: '10px 20px', color: 'red', border: '1px solid red', margin: '10px 20px' }}>
                    Authentication Error: {authError}
                </div>
            )}

            <Routes>
                 {/* Login/Register only accessible when logged out */}
                <Route path="/login" element={ !isAuthenticated ? <LoginForm /> : <Navigate to="/" replace /> } />
                <Route path="/register" element={ !isAuthenticated ? <RegisterForm /> : <Navigate to="/" replace /> } />

                {/* Map Editor Route (handles new/specific/latest) */}
                {/* The element uses the component defined above */}
                {/* Protect this route wrapper - redirect if not logged in */}
                 <Route path="/map/:mapId" element={ isAuthenticated ? <ProtectedMapEditor /> : <Navigate to="/login" replace /> } />
                 {/* Optional: Route for /map without ID, could load latest or redirect */}
                 <Route path="/map" element={ isAuthenticated ? <ProtectedMapEditor /> : <Navigate to="/login" replace /> } />


                 {/* Root path - shows Map List or redirects to login */}
                 <Route path="/" element={
                      isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
                 } />

                 {/* Fallback for unknown routes */}
                 <Route path="*" element={<div>Page Not Found</div>} />

            </Routes>
        </div> // End Main App Container
    );
} // End of App component