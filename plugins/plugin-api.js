
/**
 * @fileoverview JSDoc definitions for the Minimum Viable Plugin API contract.
 * A plugin module should export an object that adheres to the Plugin interface defined below.
 */

// --- Type Definitions for Complex Objects ---

/**
 * Represents the definition of a single setting field required by a plugin.
 * Used by the core application to render the settings form for the plugin.
 * @typedef {object} SettingField
 * @property {string} key - The unique key to identify this setting (used for storage and retrieval).
 * @property {string} label - The user-friendly label displayed next to the setting field.
 * @property {'text' | 'url' | 'password' | 'number'} type - The type of input field to render.
 * @property {boolean} required - Whether this setting field must have a value.
 * @property {string} [description] - Optional help text displayed with the setting field.
 * @property {any} [defaultValue] - Optional default value for the setting field.
 */

/**
 * Represents a single item returned from a plugin's search function.
 * Used to populate autocomplete suggestions.
 * @typedef {object} SearchResultItem
 * @property {string|number} id - The unique identifier of the external item (e.g., MyApp Requirement ID). This value might be passed back to `getExternalIdentifiersToStore`.
 * @property {string} name - The primary text displayed to the user in the suggestion list (e.g., "REQ-12: Fix login bug").
 * @property {string} [description] - Optional additional details displayed with the suggestion.
 */

/**
 * Represents the specific identifiers stored in the database for a MyApp link.
 * Tailored for the MyApp plugin's needs based on our MVA discussion.
 * @typedef {object} MyAppStoredIdentifiers
 * @property {number} requirementId - The numeric ID of the MyApp Requirement.
 * @property {number} productId - The numeric ID of the MyApp Product containing the Requirement.
 */

/**
 * Represents the information required by the core application to display a link.
 * Returned by the plugin's getDisplayInfo method.
 * @typedef {object} DisplayInfo
 * @property {string} name - The primary display name for the link (e.g., fetched Requirement Name).
 * @property {string} url - The full, clickable URL pointing to the item in the external system.
 * @property {string} [details] - Optional additional details to display alongside the link.
 */

/**
 * Represents the saved settings values for a plugin.
 * Provided by the core application to plugin methods.
 * Keys correspond to the 'key' defined in SettingField.
 * @typedef {{ [key: string]: any }} PluginSettings
 */


/**
 * Context object passed to getAvailableActions and executeAction.
 * Allows actions to be context-aware (e.g., available only for certain data types).
 * Initially, we only care about 'mapExport'.
 * @typedef {object} ActionContext
 * @property {'mapExport' | string} type - The context type where actions are requested.
 * @property {object} [mapData] - The data of the map, present if type is 'mapExport'.
 * // Add other context properties as needed later (e.g., itemId, selectedText)
 */

/**
 * Defines an action that a plugin can perform.
 * Returned by getAvailableActions.
 * @typedef {object} ActionDefinition
 * @property {string} id - A unique identifier for the action within the plugin (e.g., "exportMap").
 * @property {string} label - The user-facing text for the button or menu item (e.g., "Export Map to MyApp").
 * @property {string} [icon] - Optional identifier for an icon to display.
 * @property {string} [description] - Optional tooltip or longer description.
 */

/**
 * Represents the result of executing an action. (Define more clearly as needed)
 * @typedef {object} ActionResult
 * @property {boolean} success - Whether the action was successful.
 * @property {string} [message] - Optional message for the user.
 * @property {any} [data] - Optional data returned by the action.
 */



/**
 * Represents the API provided by the core application to plugins.
 * Passed during initialization or potentially to specific methods.
 * @typedef {object} CoreApi
 * @property {(key: string) => Promise<any>} getSetting - Asynchronously retrieves a saved setting value for the current plugin. Throws if setting not found? (Needs definition).
 * @property {(level: 'info' | 'warn' | 'error', message: string) => void} [log] - Optional logging function using the core app's logger.
 * // Add other core functions needed by plugins here later (e.g., access user info).
 */


// --- Plugin Interface Definition ---

/**
 * Defines the Minimum Viable API contract that a plugin module must implement/export.
 * NOW INCLUDES OPTIONAL ACTION METHODS.
 * @typedef {object} Plugin
 * @property {string} id - Unique, machine-readable plugin identifier (e.g., "MyApp").
 * @property {string} name - Human-readable plugin name (e.g., "MyApp Integration").
 * @property {string} version - Plugin version string (e.g., "0.1.0").
 *
 * @property {() => Promise<SettingField[]>} getSettingsSchema - Returns definitions for required settings fields. (Required)
 * @property {(query: string, settings: PluginSettings) => Promise<SearchResultItem[]>} searchExternalItems - Searches external system for linking. (Required for linking)
 * @property {(selectedItem: SearchResultItem | string | number, settings: PluginSettings) => Promise<object>} getExternalIdentifiersToStore - Validates selection/input and returns identifiers for storage. (Required for linking)
 * @property {(storedIdentifiers: object, settings: PluginSettings) => Promise<DisplayInfo>} getDisplayInfo - Retrieves current info (name, URL) for displaying a link. (Required for linking)
 *
 * @property {(context: ActionContext) => Promise<ActionDefinition[]>} [getAvailableActions]
 * OPTIONAL: Asynchronously returns a list of actions the plugin can perform in the given context.
 * Initially, the Core App will only look for actions when context.type is 'mapExport' and action.id is 'exportMap'.
 *
 * @property {(actionId: string, context: ActionContext) => Promise<ActionResult>} [executeAction]
 * OPTIONAL: Asynchronously executes a specific action identified by actionId, using the provided context.
 * Called by the Core App when the user triggers an action defined by this plugin.
 */


// --- Example Usage (Conceptual) ---
/*
 // In plugins/MyApp/index.js

 const MyAppPlugin = {
   id: "MyApp",
   name: "MyApp Integration",
   version: "0.1.0",

   async getSettingsSchema() {
     // ... implementation returning MyApp's SettingField definitions ...
   },

   async searchExternalItems(query, settings) {
     // ... implementation using settings.apiUrl, settings.apiKey to call MyApp API ...
   },

   async getExternalIdentifiersToStore(selectedItem, settings) {
     // ... implementation validating ID, finding productId, returning { requirementId, productId } ...
   },

   async getDisplayInfo(storedIdentifiers, settings) {
     // ... implementation using storedIdentifiers.requirementId, settings.apiUrl etc. to get name and build URL ...
   }
 };

 module.exports = MyAppPlugin;
 */

