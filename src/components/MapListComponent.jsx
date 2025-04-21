// src/components/MapListComponent.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path

// Helper (define here, or import from shared util)
const getAuthFetchOptions = (token, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) { headers['Authorization'] = `${token}`; }
    const options = { method, headers };
    if (body) { options.body = JSON.stringify(body); }
    return options;
};

// This component fetches and displays maps for the CURRENTLY logged-in user
// TODO (Future): Could accept a userId prop for admin views, etc.
function MapListComponent() {
    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, logoutAction } = useAuth(); // Get token for API calls
    const navigate = useNavigate();

    const fetchMaps = useCallback(async () => {
        // ... (Keep the exact same fetchMaps logic as before) ...
        // It fetches '/api/maps' using the current user's token
        console.log("MapListComponent: Fetching map list...");
        setLoading(true);
        setError(null);
        if (!token) { /* ... handle no token ... */ return; }
        try {
            const response = await fetch('/api/maps', getAuthFetchOptions(token));
             if (response.status === 401 || response.status === 403) { /* ... handle auth error ... */ }
             if (!response.ok) { throw new Error(/* ... */); }
             const mapListData = await response.json();
             setMaps(mapListData);
        } catch (err) { /* ... handle fetch error ... */ }
        finally { setLoading(false); }

    }, [token, logoutAction]);

    useEffect(() => {
        fetchMaps();
    }, [fetchMaps]);

    const handleDeleteMap = async (mapId, mapTitle) => {
        // ... (Keep the exact same handleDeleteMap logic as before) ...
         if (!window.confirm(/* ... */)) return;
         try {
             const response = await fetch(`/api/maps/${mapId}`, getAuthFetchOptions(token, 'DELETE'));
             if (!response.ok && response.status !== 204) { throw new Error(/* ... */); }
             setMaps(currentMaps => currentMaps.filter(map => map.id !== mapId)); // Update local state
             alert("Map deleted.");
         } catch (err) { /* ... handle delete error ... */ }
    };

    const handleCreateNew = () => {
        navigate('/map/new');
    };

    // --- Render Logic ---
    if (loading) {
        return <div style={{ padding: '20px' }}>Loading map list...</div>;
    }

    // Basic list styling
     const listStyle = { listStyle: 'none', padding: 0 };
     const listItemStyle = { border: '1px solid #eee', padding: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
     const buttonStyle = { marginLeft: '10px', cursor: 'pointer', padding: '5px 10px' };
     const errorBoxStyle = { padding: '10px', color: 'red', border: '1px solid red', margin: '10px 0'};


    return (
        // Removed outer padding, page component will handle layout
        <>
            {error && <div style={errorBoxStyle}>Error loading list: {error}</div>}

            <button onClick={handleCreateNew} style={{ ...buttonStyle, marginBottom: '20px', background: '#28a745', color: 'white' }}>
                + Create New Map
            </button>

            {maps.length === 0 && !loading && !error && (
                <p>You haven't created any maps yet.</p>
            )}

            <ul style={listStyle}>
                {maps.map(map => (
                    <li key={map.id} style={listItemStyle}>
                        <div>
                            <Link to={`/map/${map.id}`} style={{ fontSize: '1.1em', textDecoration: 'none', color: '#007bff' }}>
                                {map.title || 'Untitled Map'}
                            </Link>
                            {/* ... other map details like date ... */}
                        </div>
                        <div>
                            <Link to={`/map/${map.id}`}>
                                <button style={{...buttonStyle, background: '#007bff', color: 'white'}}>Open</button>
                            </Link>
                            <button
                                onClick={() => handleDeleteMap(map.id, map.title || 'Untitled Map')}
                                style={{...buttonStyle, background: '#dc3545', color: 'white'}}
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

export default MapListComponent;
