// src/pages/SettingsPage.jsx - Updated to fetch plugin list

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import { GeneralSettingsSection } from '../components/settings/GeneralSettingsSection'; // Adjust path
import { PluginSettingsForm } from '../components/settings/PluginSettingsForm';
import { ExternalItemSearch } from '../components/linking/ExternalItemSearch'; // Adjust path
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SettingsPage() {
  console.log("Rendering Settings Page");
  const { token } = useAuth(); // Get auth token

  // --- State for Plugin List ---
  const [plugins, setPlugins] = useState([]); // Stores the array [{id, name, version, settingsSchema}, ...]
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(true);
  const [pluginError, setPluginError] = useState(null);
  // --- End State ---

  // --- Fetch Plugin List Function (memoized with useCallback) ---
  const fetchPlugins = useCallback(async () => {
    console.log("Attempting to fetch available plugins...");
    setIsLoadingPlugins(true);
    setPluginError(null); // Clear previous errors
    setPlugins([]);     // Clear previous plugins

    if (!token) {
      console.log("Cannot fetch plugins: No auth token provided.");
      setPluginError("You need to be logged in to manage plugin settings.");
      setIsLoadingPlugins(false);
      return;
    }

    try {
      // Define fetch options, including the Authorization header
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}` // Assuming token includes 'Bearer ' if needed
        }
      };

      // Make the API call to the endpoint we created
      const response = await fetch('/api/settings/plugins', fetchOptions);

      if (!response.ok) {
        // Handle specific auth errors
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized: Could not fetch plugin list.");
        }
        // Handle other HTTP errors
        throw new Error(`HTTP error ${response.status} while fetching plugins.`);
      }

      const data = await response.json();
      console.log("Received plugins:", data);
      // Ensure data is an array before setting state
      setPlugins(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Failed to fetch plugins:", error);
      setPluginError(error.message || "Failed to load plugin list.");
      setPlugins([]); // Ensure plugins array is empty on error
    } finally {
      setIsLoadingPlugins(false);
    }
  }, [token]); // Re-fetch if the token changes

  // --- useEffect hook to call fetchPlugins on mount and when token changes ---
  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]); // fetchPlugins is memoized and includes token dependency

  // --- Render Logic ---
  return (
    // Using simple div and gap for layout example
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div> {/* Wrapper for title/description */}
        <h1>Application Settings</h1>
        <p style={{ marginBottom: '20px' }}>
          Manage core application settings and plugin configurations.
        </p>
      </div>

      {/* --- General Settings Section (Stays the same) --- */}
      <GeneralSettingsSection />

      {/* --- Plugin Settings Section --- */}
      <div>
        <h2>Plugin Settings</h2>
        {isLoadingPlugins && (<div>Loading available plugins...</div>)}
        {/* Display error message if fetching failed */}
        {pluginError && !isLoadingPlugins && (
          <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginTop: '10px' }}>
            Error loading plugin list: {pluginError}
          </div>
        )}

        {!isLoadingPlugins && !pluginError && (
          plugins.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              {plugins.map((plugin) => (
                // *** REPLACE previous field rendering with this component ***
                <PluginSettingsForm
                  key={plugin.id}
                  pluginId={plugin.id}
                  schema={plugin.settingsSchema}
                />
                // *** END REPLACEMENT ***
              ))}
            </div>
          ) : (<p style={{ marginTop: '10px' }}>No plugins available or loaded.</p>)
        )}
      </div> {/* End Plugin Settings Section */}
      {/* --- Temporary Test Area for Linking Search --- */}
      <div>
        <h2>Test Linking Search (Spira)</h2>
        <ExternalItemSearch
          pluginId="spira" // Test with Spira plugin
          itemType="exampleMap" // Linking from a map
          itemId="test-map-123" // Dummy map ID
          itemData={{ spiraProductId: 1 }} // <<< USE A REAL SPIRA PRODUCT ID FROM YOUR INSTANCE FOR TESTING
        />
      </div>
      {/* --- End Temporary Test Area --- */}
    </div> // End Page Container
  );
}

export default SettingsPage;