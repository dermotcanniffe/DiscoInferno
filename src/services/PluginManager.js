import fs from 'fs'; // ESM import for built-in modules
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // Utilities for ESM path handling

// --- Helper: Determine Project Root reliably in ESM ---
// __filename and __dirname are not available directly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Adjust relative path if PluginManager.js is not exactly in /src/services/
const projectRoot = path.resolve(__dirname, '../../');

class PluginManager {
    /**
     * Initializes the PluginManager.
     * @param {string} [scanDir] - Optional directory path to scan for plugins.
     */
    constructor(scanDir) {
        const defaultScanPath = path.join(projectRoot, 'plugins');
        const envScanPath = process.env.PLUGIN_SCAN_DIR;

        let targetScanDir = defaultScanPath;
        if (envScanPath) {
            targetScanDir = path.resolve(envScanPath);
        }
        if (scanDir) {
            targetScanDir = path.resolve(scanDir);
        }

        this.pluginScanDir = targetScanDir;
        this.loadedPlugins = {};

        console.log(`PluginManager initialized. Scanning directory: ${this.pluginScanDir}`);
    }

    /**
     * Checks if a loaded module conforms to the basic Plugin structure.
     * @param {object} pluginModule - The loaded plugin module export.
     * @returns {boolean}
     * @private
     */
    _isValidPlugin(pluginModule) {
        // Basic structural validation based on MVA + Actions
        return typeof pluginModule === 'object' &&
               pluginModule !== null &&
               typeof pluginModule.id === 'string' && pluginModule.id.length > 0 &&
               typeof pluginModule.name === 'string' &&
               typeof pluginModule.version === 'string' &&
               typeof pluginModule.getSettingsSchema === 'function' &&
            //   typeof pluginModule.searchExternalItems === 'function' && // Make optional if not all plugins link
               typeof pluginModule.getExternalIdentifiersToStore === 'function' && // Make optional
               typeof pluginModule.getDisplayInfo === 'function' && // Make optional
               // Action methods are optional per plugin
               (typeof pluginModule.getAvailableActions === 'undefined' || typeof pluginModule.getAvailableActions === 'function') &&
               (typeof pluginModule.executeAction === 'undefined' || typeof pluginModule.executeAction === 'function');
    }

    /**
     * Loads all valid plugins found in the configured scan directory.
     * Now uses async import() for ESM compatibility.
     */
    async loadPlugins() { // Needs to be async for dynamic imports
        this.loadedPlugins = {};
        console.log(`PluginManager: Starting plugin scan in ${this.pluginScanDir}...`);

        if (!fs.existsSync(this.pluginScanDir)) {
            console.warn(`Plugin directory not found: ${this.pluginScanDir}. No plugins will be loaded.`);
            return;
        }

        try {
            const pluginDirs = fs.readdirSync(this.pluginScanDir, { withFileTypes: true });

            for (const dirent of pluginDirs) {
                if (dirent.isDirectory()) {
                    const pluginName = dirent.name;
                    const pluginDirFullPath = path.join(this.pluginScanDir, pluginName);
                    const entryPointPath = path.join(pluginDirFullPath, 'index.js'); // Convention

                    if (fs.existsSync(entryPointPath)) {
                        console.log(`PluginManager: Found potential plugin entry point: ${entryPointPath}`);
                        try {
                            // --- Use dynamic import() for ESM plugin loading ---
                            // Convert file path to file URL, required for import()
                            const moduleUrl = pathToFileURL(entryPointPath).href;
                            const module = await import(moduleUrl);

                            // Assuming plugins use 'export default' for their main object
                            const pluginModule = module.default;
                            // ---

                            if (this._isValidPlugin(pluginModule)) {
                                if (this.loadedPlugins[pluginModule.id]) {
                                    console.warn(`Duplicate plugin ID '${pluginModule.id}'. Plugin at '${entryPointPath}' will be ignored.`);
                                } else {
                                    if (pluginModule.id !== pluginName) {
                                         console.warn(`Plugin ID '${pluginModule.id}' in ${entryPointPath} does not match directory name '${pluginName}'.`);
                                    }
                                    this.loadedPlugins[pluginModule.id] = pluginModule;
                                    console.log(`Successfully loaded plugin: ${pluginModule.name} (ID: ${pluginModule.id}, v${pluginModule.version})`);
                                }
                            } else {
                                console.error(`Plugin at '${entryPointPath}' has invalid structure or missing methods. Skipped.`);
                            }
                        } catch (loadError) {
                            console.error(`Error dynamically importing plugin from '${entryPointPath}':`, loadError);
                        }
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
     * @param {string} pluginId
     * @returns {import('../../plugins/plugin-api').Plugin | null} // Conceptual typing
     */
    getPlugin(pluginId) {
        return this.loadedPlugins[pluginId] || null;
    }

    /**
     * Gets a map of all successfully loaded plugins.
     * @returns {{ [pluginId: string]: import('../../plugins/plugin-api').Plugin }} // Conceptual typing
     */
    getAllPlugins() {
        return { ...this.loadedPlugins };
    }
}

// Create the singleton instance
const instance = new PluginManager();

// --- Corrected Export for ESM ---
export default instance;