import React, { useState, useEffect } from "react";
import ExampleMapEditor from "./ExampleMapEditor";

const DEFAULT_DATA = {
  story: { text: "", rules: [] },
  questions: []
};

/* export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const handleSave = () => {
    window?.electronAPI?.saveData?.(JSON.stringify(data));
  };

  return <ExampleMapEditor data={data} onChange={setData} onSave={handleSave} />;
} */

  export default function App() {
    // --- Existing State ---
    const [data, setData] = useState(DEFAULT_DATA);
  
// --- Updated Save Handler ---
const handleSave = async () => { // Make the handler async
  console.log("Saving map data to backend...", data);

  // TODO: Extract title and description properly if they exist in your 'data' state
  // For now, let's assume 'data' directly contains the stories array and we hardcode title
  const mapPayload = {
      title: data.title || "My Example Map", // Get title from state or use default
      description: data.description || "", // Get description from state
      stories: data.stories || [], // Assuming data state has a 'stories' array structured correctly
      // Ensure the structure matches what the backend expects (stories contain rules/examples/questions)
  };


  try {
    const response = await fetch('/api/maps', { // Send POST request to the backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapPayload), // Send the map data as JSON string
    });

    if (!response.ok) {
      // Handle HTTP errors (e.g., 400, 500)
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
    }

    const savedMap = await response.json(); // Parse the response JSON (the created map)
    console.log("Map saved successfully:", savedMap);
    alert("Map saved successfully!"); // Simple feedback

    // Optional: Update frontend state if needed (e.g., maybe the backend assigns IDs)
    // setData(savedMap); // Be careful, ensure backend response matches state structure

  } catch (error) {
    console.error("Error saving map:", error);
    alert(`Error saving map: ${error.message}`); // Show error feedback
  }
};
  
    // --- Add the useEffect hook for testing the backend proxy ---
    useEffect(() => {
      console.log("App component mounted. Testing backend connection...");
      fetch('/api/test') // Use the relative path
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Data from backend:', data); // Should show { message: 'Backend server is running!' }
        })
        .catch(error => {
          console.error('Error fetching test data:', error);
        });
    }, []); // Empty array ensures this runs only once on mount
  
    // --- Existing Return Statement ---
    // This doesn't need to change for the test
    return <ExampleMapEditor data={data} onChange={setData} onSave={handleSave} />;
  }