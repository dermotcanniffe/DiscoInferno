import React, { useState, useEffect } from "react";
import ExampleMapEditor from "./ExampleMapEditor"; // Assuming path is correct

// 1. Correct DEFAULT_DATA structure
export const DEFAULT_DATA = {
  title: "My New Map", // Default title
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

export default function App() {
  // 2. State Initialization (data starts as null, add loading/error)
  // Corrected lines:
  const [data, setData] = useState(null); // Remove <any | null>
  const [loading, setLoading] = useState(true); // Remove <boolean>
  const [error, setError] = useState(null); // Remove <string | null>
  // 3. Data Loading useEffect (Replaces the old /api/test useEffect)
  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log("Fetching initial map data from /api/maps...");

    fetch('/api/maps') // GET request to load latest map
      .then(response => {
        if (response.status === 404) {
          console.log("No saved map found (404), initializing with default data.");
          return DEFAULT_DATA; // Use default if no map exists yet
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse map data if found
      })
      .then(mapData => {
        console.log("Received map data:", mapData);
        // Start with default structure to ensure all base keys exist
        let initialData = structuredClone(DEFAULT_DATA);
        // Override with loaded data IF mapData is not the default structure (i.e., not from 404)
        if (mapData !== DEFAULT_DATA) {
             initialData = { ...initialData, ...mapData };
        }
    
        // Defensive check: Ensure stories is an array and has at least one item
        if (!initialData.stories || !Array.isArray(initialData.stories) || initialData.stories.length === 0) {
            console.warn("Loaded/Default map data has empty/invalid stories array, resetting to default story.");
            // Reset stories to the default if it's missing or empty
            initialData.stories = structuredClone(DEFAULT_DATA.stories);
        }
    
        setData(initialData); // Set the potentially corrected state
    })
      .catch(err => {
        console.error("Error fetching initial map data:", err);
        setError(err.message || "Failed to load map data.");
        setData(DEFAULT_DATA); // Fallback to default data on error
      })
      .finally(() => {
        setLoading(false); // Set loading to false once fetch completes
        console.log("Finished fetching initial map data.");
      });
  }, []); // Empty dependency array = run once on mount


  // 4. Updated Save Handler (Includes setData after successful save)

const handleSave = async () => {
  if (!data) {
      console.error("Cannot save, data is null or still loading.");
      alert("Cannot save map, data is not ready yet.");
      return;
  }
 console.log("Saving map data to backend...", data);

 const mapPayload = {
   title: data.title || "My Example Map",
   description: data.description || "",
   stories: data.stories || [],
 };
 console.log("Payload being sent:", JSON.stringify(mapPayload, null, 2));

 // --- Determine URL and Method ---
 const isUpdating = !!data.id; // Check if the map already has an ID
 const url = isUpdating ? `/api/maps/${data.id}` : '/api/maps'; // Use ID in URL if updating
 const method = isUpdating ? 'PUT' : 'POST'; // Use PUT for update, POST for create

 console.log(`Save method: ${method}, URL: ${url}`);
 // --- End Determine ---

 try {
   const response = await fetch(url, { // Use dynamic URL and Method
     method: method,                 // Use dynamic Method
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify(mapPayload),
   });

   if (!response.ok) {
     const errorData = await response.json();
      // Provide more context in error message
     throw new Error(`HTTP error! ${method} ${url} failed with status: ${response.status} - ${errorData.message}`);
   }

   const savedOrUpdatedMap = await response.json();
   const action = isUpdating ? "updated" : "saved";
   console.log(`Map ${action} successfully:`, savedOrUpdatedMap);
   alert(`Map ${action} successfully!`);

   // Update state with the response from backend (important for consistency)
   const updatedData = {
       ...DEFAULT_DATA, // Ensure defaults like title/desc are present
       ...savedOrUpdatedMap
   };
   setData(updatedData);

 } catch (error) {
   console.error(`Error ${isUpdating ? 'updating' : 'saving'} map:`, error);
   alert(`Error ${isUpdating ? 'updating' : 'saving'} map: ${error.message}`);
 }
};

  // HandleDelete

  const handleDelete = async () => {
    // Check if there is a map loaded with an ID
    if (!data?.id) {
      alert("No map loaded or map hasn't been saved yet.");
      return;
    }
  
    // Confirm with the user
    if (!window.confirm(`Are you sure you want to delete map "${data.title || 'this map'}"? This cannot be undone.`)) {
      return; // User cancelled
    }
  
    console.log(`Attempting to delete map ID: ${data.id}`);
    const mapIdToDelete = data.id; // Store ID in case state changes mid-request
  
    try {
      const response = await fetch(`/api/maps/${mapIdToDelete}`, {
        method: 'DELETE',
      });
  
      // Check for HTTP errors (like 404 Not Found, 403 Forbidden)
      if (!response.ok && response.status !== 204) { // 204 is success but no body
         let errorData;
         try { // Try to parse error JSON, might fail if no body
              errorData = await response.json();
         } catch(e) {
              errorData = { message: `Request failed with status ${response.status}`};
         }
        throw new Error(`HTTP error! DELETE /api/maps/${mapIdToDelete} failed with status: ${response.status} - ${errorData.message}`);
      }
  
      console.log(`Map deleted successfully: ${mapIdToDelete}`);
      alert("Map deleted successfully!");
  
      // Reset the state to default after successful deletion
      setData(structuredClone(DEFAULT_DATA)); // Use structuredClone for a clean copy
      // Or potentially trigger a re-fetch if you had a map list view
  
    } catch (error) {
      console.error(`Error deleting map ${mapIdToDelete}:`, error);
      alert(`Error deleting map: ${error.message}`);
    }
  };

  // --- Add these logs before the return ---
  console.log("--- App component rendering ---");
  console.log("Current 'data' state:", data);
  // Explicitly check for the id property
  if (data) {
    console.log("Value of data.id:", data.id);
    console.log("Type of data.id:", typeof data.id);
  } else {
    console.log("Data is null or undefined.");
  }
  console.log("Condition for delete button (data && data.id):", !!(data && data.id));
  // --- End of diagnostic logs ---

  // 5. Conditional Rendering
  if (loading) {
    return <div style={{ padding: '20px' }}>Loading map...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  if (!data) {
    // Should ideally not be reached if loading/error handles state correctly
    return <div style={{ padding: '20px' }}>Map data could not be loaded.</div>;
  }

  // 6. Render Editor with loaded data
  return (
    <> {/* Use Fragment to return multiple elements */}
      <ExampleMapEditor data={data} onChange={setData} onSave={handleSave} />

      {/* Add a Delete button (only if map has an ID) */}
      {data && data.id && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545', // Red color
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete This Map
          </button>
        </div>
      )}
    </>
  );
} // End of App component