/**
 * @fileoverview JSDoc definitions for the Plugin API contract.
 * Defines the expected interface for plugin modules.
 */

// --- Type Definitions ---

/**
 * Defines a setting field required by a plugin.
 * @typedef {object} SettingField
 * @property {string} key - Unique key for the setting.
 * @property {string} label - User-friendly label.
 * @property {'text' | 'url' | 'password' | 'number' | 'boolean' | 'textarea'} type - Input type.
 * @property {boolean} required - If the setting is required.
 * @property {string} [description] - Optional help text.
 * @property {any} [defaultValue] - Optional default value.
 */

/**
 * Represents an item returned from plugin search results.
 * @typedef {object} SearchResultItem
 * @property {string|number} id - Unique ID of the external item.
 * @property {string} name - Display name for the search result.
 * @property {string} [description] - Optional additional details.
 */

/**
 * Represents the identifiers stored in the DB for an external link.
 * The structure is specific to the plugin (defined by its config).
 * Example for Spira: { requirementId: number, productId: number }
 * @typedef {object} StoredIdentifiers
 */

/**
 * Information needed by the Core App to display a link.
 * @typedef {object} DisplayInfo
 * @property {string} name - Primary display name (e.g., "REQ-123: Fix Bug").
 * @property {string} url - Clickable URL to the external item.
 * @property {string} [details] - Optional extra details (e.g., status).
 */

/**
 * Represents the saved settings values for a plugin (retrieved for a user).
 * Keys correspond to 'key' defined in SettingField.
 * @typedef {{ [key: string]: any }} PluginSettings
 */

/**
 * Defines an action a plugin can perform in a specific context.
 * @typedef {object} ActionDefinition
 * @property {string} id - Unique ID for the action (e.g., "exportMap", "viewDetails").
 * @property {string} label - User-facing text for the button/menu item (e.g., "Export Map to Spira").
 * @property {string} [icon] - Optional icon identifier.
 * @property {string} [description] - Optional tooltip.
 */

/**
 * Context object passed to plugin methods, providing information
 * about the item or situation where the plugin is being invoked.
 * @typedef {object} LinkActionContext
 * @property {'link' | 'display' | 'action' | 'mapExport' | string} type - The type of operation or context.
 * @property {string} itemType - The type of item in DiscoInferno (e.g., 'exampleMap', 'story').
 * @property {string} itemId - The ID of the DiscoInferno item being interacted with.
 * @property {object} [itemData] - Optional: The full data of the item, potentially including associated config like a target Spira Product ID (e.g., `{ spiraProductId: 101 }`). How this is populated depends on the Core App.
 * @property {string} [actionId] - Identifier of the specific action being executed (required for `executeAction`).
 */

/**
 * Represents the result of executing a plugin action.
 * @typedef {object} ActionResult
 * @property {boolean} success - Whether the action succeeded.
 * @property {string} [message] - Optional message for the user.
 * @property {any} [data] - Optional data returned by the action.
 */

/**
 * API provided by the Core App to plugins (passed during init or to methods).
 * @typedef {object} CoreApi
 * @property {(key: string) => Promise<any>} getSetting - Retrieves a saved *plugin* setting value for the *current user*.
 * @property {(level: 'info' | 'warn' | 'error', message: string) => void} [log] - Logging function.
 * // Add other core functions here later (e.g., getUserInfo(), getMapData(mapId))
 */


// --- Plugin Interface Definition ---

/**
 * Defines the API contract that a plugin module's default export must implement.
 * @typedef {object} Plugin
 * @property {string} id - Unique, machine-readable plugin identifier.
 * @property {string} name - Human-readable plugin name.
 * @property {string} version - Plugin version string.
 * @property {string} [description] - Optional description.
 *
 * @property {() => Promise<SettingField[]>} getSettingsSchema
 * Returns definitions for required settings fields. Required.
 *
 * @property {(query: string, context: LinkActionContext, settings: PluginSettings) => Promise<SearchResultItem[]>} [searchExternalItems]
 * OPTIONAL: Searches external system based on query within the given context.
 *
 * @property {(selectedItem: SearchResultItem | string | number, context: LinkActionContext, settings: PluginSettings) => Promise<StoredIdentifiers>} [getExternalIdentifiersToStore]
 * OPTIONAL: Validates selection/input and returns identifiers object for storage, based on context. Needed for linking.
 *
 * @property {(storedIdentifiers: StoredIdentifiers, context: LinkActionContext, settings: PluginSettings) => Promise<DisplayInfo>} [getDisplayInfo]
 * OPTIONAL: Retrieves current display information for a stored link, based on context. Needed for displaying links.
 *
 * @property {(context: LinkActionContext, settings: PluginSettings) => Promise<ActionDefinition[]>} [getAvailableActions]
 * OPTIONAL: Returns a list of actions the plugin can perform in the given context.
 *
 * @property {(context: LinkActionContext, settings: PluginSettings) => Promise<ActionResult>} [executeAction]
 * OPTIONAL: Executes an action defined by context.actionId, using data from context and settings.
 */

// --- Example Usage in a Plugin File ---
/*
import myConfig from './config.js';
import { getCoreSetting } from '../services/SettingsService.js'; // Example if service needed directly (less ideal)

/** @type {Plugin} * /
const myPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',

  async getSettingsSchema() {
    // ... return schema ...
  },

  async searchExternalItems(query, context, settings) {
    // Use query, context.itemId, context.itemData, settings (which contains user config like API keys)
    // ... fetch from external API ...
    return [ { id: 1, name: 'Result 1'} ];
  },

  // ... other methods ...

   async executeAction(context, settings) {
     if (context.actionId === 'doSomething') {
       // Use context.itemId, context.itemData, settings
       // ... perform action ...
       return { success: true };
     }
     return { success: false, message: 'Action not supported' };
   }
};

export default myPlugin;
*/