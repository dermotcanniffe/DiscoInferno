// src/services/PluginManager.js

const fs = require('fs');
const path = require('path');

// --- Helper: Determine Project Root ---
// This assumes PluginManager.js is in /src/services/. Adjust if needed.
// Using a more robust method might be needed in complex setups (e.g., find-package-json).
const projectRoot = path.resolve(__dirname, '../../');
console.log(`PluginManager: Determined project root as: ${projectRoot}`); // Log for debugging path issues

class PluginManager {
    /**
     * Initializes the PluginManager.
     * Determines the directory to scan for plugins based on constructor arg,
     * environment variable, or a default path.
     * @param {string} [scanDir] - Optional explicit directory path to scan.
     */
    constructor(scanDir) {
        const defaultScanPath = path.join(projectRoot, 'plugins');
        const envScanPath = process.env.PLUGIN_SCAN_DIR;

        let targetScanDir = defaultScanPath; // Start with default

        if (envScanPath) {
            console.log(`PluginManager: Using environment variable PLUGIN_SCAN_DIR: ${envScanPath}`);
            targetScanDir = path.resolve(envScanPath); // Resolve env var path
        }

        if (scanDir) {
            console.log(`PluginManager: Using explicit scan directory provided: ${scanDir}`);
            targetScanDir = path.resolve(scanDir); // Override with explicit path
        }

        this.pluginScanDir = targetScanDir; // The final absolute path to scan
        this.loadedPlugins = {}; // Stores loaded plugins keyed by plugin.id

        console.log(`PluginManager initialized. Final scan directory: ${this.pluginScanDir}`);
    }

    /**
     * Checks if a loaded module conforms to the basic Plugin MVA structure.
     * @param {object} pluginModule - The loaded plugin module export.
     * @returns {boolean} True if the structure is valid, false otherwise.
     * @private
     */
    _isValidPlugin(pluginModule) {
        return typeof pluginModule === 'object' &&
               pluginModule !== null &&
               typeof pluginModule.id === 'string' && pluginModule.id.length > 0 &&
               typeof pluginModule.name === 'string' &&
               typeof pluginModule.version === 'string' &&
               typeof pluginModule.getSettingsSchema === 'function' &&
               typeof pluginModule.searchExternalItems === 'function' && // Adjust if this became optional in MVA
               typeof pluginModule.getExternalIdentifiersToStore === 'function' &&
               typeof pluginModule.getDisplayInfo === 'function';
    }

    /**
     * Loads all valid plugins found in the configured scan directory.
     * Assumes each subdirectory represents a plugin with an index.js entry point.
     * Uses synchronous operations for simplicity during typical app startup.
     */
    loadPlugins() {
        this.loadedPlugins = {}; // Clear previous state if re-loading
        console.log(`PluginManager: Starting plugin scan in ${this.pluginScanDir}...`);

        if (!fs.existsSync(this.pluginScanDir)) {
            console.warn(`Plugin directory not found: ${this.pluginScanDir}. No plugins will be loaded.`);
            return;
        }

        try {
            // Read all entries in the scan directory
            const pluginDirs = fs.readdirSync(this.pluginScanDir, { withFileTypes: true });

            for (const dirent of pluginDirs) {
                // Assume each directory is a potential plugin
                if (dirent.isDirectory()) {
                    const pluginName = dirent.name; // e.g., "spira"
                    const pluginDirFullPath = path.join(this.pluginScanDir, pluginName);
                    // Convention: Look for 'index.js' as the entry point
                    const entryPointPath = path.join(pluginDirFullPath, 'index.js');

                    if (fs.existsSync(entryPointPath)) {
                        console.log(`PluginManager: Found potential plugin entry point: ${entryPointPath}`);
                        try {
                            // Load the plugin code (using require for sync loading)
                            const pluginModule = require(entryPointPath);

                            // Validate the loaded module's structure
                            if (this._isValidPlugin(pluginModule)) {
                                // Check for duplicate plugin IDs
                                if (this.loadedPlugins[pluginModule.id]) {
                                    console.warn(`Duplicate plugin ID '${pluginModule.id}'. Plugin at '${entryPointPath}' is ignored. Existing plugin: ${this.loadedPlugins[pluginModule.id].name}`);
                                } else {
                                    // Optional: Check if plugin ID matches directory name
                                    if (pluginModule.id !== pluginName) {
                                         console.warn(`Plugin ID '${pluginModule.id}' in ${entryPointPath} does not match directory name '${pluginName}'.`);
                                    }
                                    // Store the valid plugin
                                    this.loadedPlugins[pluginModule.id] = pluginModule;
                                    console.log(`Successfully loaded plugin: ${pluginModule.name} (ID: ${pluginModule.id}, v${pluginModule.version})`);
                                }
                            } else {
                                console.error(`Plugin at '${entryPointPath}' has invalid structure or missing MVA methods. Skipped.`);
                            }
                        } catch (loadError) {
                            console.error(`Error loading plugin code from '${entryPointPath}':`, loadError);
                        }
                    } else {
                         // It's a directory, but no index.js found - maybe log this?
                         // console.log(`Directory found at ${pluginDirFullPath}, but no index.js entry point.`);
                    }
                }
            }
        } catch (readDirError) {
            console.error(`Error reading plugin directory '${this.pluginScanDir}':`, readDirError);
        }

        console.log(`Plugin loading complete. ${Object.keys(this.loadedPlugins).length} valid plugins loaded.`);
    }

    /**
     * Retrieves a loaded plugin by its unique ID.
     * @param {string} pluginId - The unique ID of the plugin.
     * @returns {object | null} The loaded plugin object adhering to the Plugin interface, or null if not found/loaded.
     */
    getPlugin(pluginId) {
        return this.loadedPlugins[pluginId] || null;
    }

    /**
     * Gets a map of all successfully loaded plugins.
     * @returns {{ [pluginId: string]: object }} A dictionary of loaded plugins.
     */
    getAllPlugins() {
        // Return a shallow copy to prevent modification of the internal store
        return { ...this.loadedPlugins };
    }
}

// --- Export Strategy ---
// Option 1: Export a singleton instance (often useful for managers)
const pluginManagerInstance = new PluginManager();
module.exports = pluginManagerInstance;

// Option 2: Export the class itself (if you need multiple instances or control instantiation elsewhere)
// module.exports = PluginManager;

