// /plugins/spira/index.js - Refactored to use config.js (Conceptual)

// Import the Spira-specific configuration
const spiraConfig = require('./config.js');

// Placeholder for a more generic HTTP client or Spira-specific one
// const apiClient = require('./apiClient');

/**
 * @type {import('../plugin-api').Plugin}
 */
const spiraPlugin = {
    id: "spira", // Keep this hardcoded, it identifies THIS plugin
    name: spiraConfig.appName + " Integration", // Use appName from config
    version: "0.1.1", // Increment version for refactor

    // --- Settings ---
    async getSettingsSchema() {
        // Schema still needs specific descriptions, but keys are defined in config.auth
        console.log("Spira Plugin: getSettingsSchema called");
        return [
            { key: spiraConfig.urlStructure.baseUrlSettingKey, label: 'Spira API URL', type: 'url', required: true, description: '...' },
            { key: spiraConfig.auth.usernameSettingKey, label: 'Spira Username', type: 'text', required: true, description: '...' },
            { key: spiraConfig.auth.keySettingKey, label: 'API Key (RSS Token)', type: 'password', required: true, description: '...' },
        ];
    },

    // --- Linking ---
    async searchExternalItems(query, settings) {
        console.log(`Spira Plugin: searchExternalItems using config for ${spiraConfig.appName}`);
        const apiUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];
        const username = settings[spiraConfig.auth.usernameSettingKey];
        const apiKey = settings[spiraConfig.auth.keySettingKey];

        if (!apiUrl || !username || !apiKey || !query || query.trim().length < 2) {
            return [];
        }

        try {
            // *** Challenge 1: Contextual Data ***
            // Where does {projectId} come from for the search endpoint? Needs context or config.
            // Assuming a default/configured project for now, or API supports global search.
            const projectId = 1; // Placeholder - MUST BE RESOLVED
            const endpoint = spiraConfig.endpoints.searchRequirements
                .replace('{projectId}', projectId)
                .replace('{query}', encodeURIComponent(query));

            console.log("Spira Plugin: TODO - Call generic API helper for endpoint:", endpoint);
            // const results = await apiClient.get(apiUrl, endpoint, { username, apiKey });

            // Map results using config (dummy example)
            const dummyApiResults = [ { RequirementId: 123, Name: `Dummy ${query}` }, { RequirementId: 456, Name: `Test ${query}`} ];
            return dummyApiResults.map(item => ({
                id: item[spiraConfig.identifiers.searchResultIdField],
                name: item[spiraConfig.identifiers.searchResultNameField]
            }));
        } catch (error) { /* ... error handling ... */ return []; }
    },

    async getExternalIdentifiersToStore(selectedItem, settings) {
        console.log(`Spira Plugin: getExternalIdentifiersToStore using config for ${spiraConfig.appName}`);
        const apiUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];
        const username = settings[spiraConfig.auth.usernameSettingKey];
        const apiKey = settings[spiraConfig.auth.keySettingKey];

        if (!apiUrl || !username || !apiKey) { throw new Error(`${spiraConfig.appName} settings incomplete.`); }

        let requirementId;
        // Parse ID (same logic as before)
        // ... (parsing logic) ...
        if (isNaN(requirementId)) { throw new Error("Invalid ID format."); }

        try {
            // *** Challenge 2: API Client Logic ***
            // Still need logic specific to Spira for fetching details, even if endpoint is config.
            // Assume ProjectID comes from details endpoint for now.

            // We need the ProjectID first to get details usually... this highlights config limitation.
            // Let's assume we *can* get details with just Requirement ID OR need Project ID context.
            // Assuming Project ID needed. Where from? Let's use a placeholder again.
            const placeholderProjectId = 101; // Needs context!
            const endpoint = spiraConfig.endpoints.getRequirementDetails
                 .replace('{projectId}', placeholderProjectId) // Problematic if project unknown
                 .replace('{requirementId}', requirementId);

             console.log("Spira Plugin: TODO - Call generic API helper for endpoint:", endpoint);
             // const details = await apiClient.get(apiUrl, endpoint, { username, apiKey });

            // Extract project ID using config (dummy example)
             const dummyDetails = { ProjectId: 101, Name: "Dummy Name" };
             const productId = dummyDetails[spiraConfig.identifiers.detailsProjectIdField];

            if (!productId) { throw new Error(`Could not find ${spiraConfig.identifiers.secondaryIdKey} for item.`); }

            // Return using keys from config
            return {
                [spiraConfig.identifiers.primaryIdKey]: requirementId,
                [spiraConfig.identifiers.secondaryIdKey]: productId
            };
        } catch (error) { /* ... error handling ... */ throw error; }
    },

    async getDisplayInfo(storedIdentifiers, settings) {
        console.log(`Spira Plugin: getDisplayInfo using config for ${spiraConfig.appName}`);
        const requirementId = storedIdentifiers[spiraConfig.identifiers.primaryIdKey];
        const productId = storedIdentifiers[spiraConfig.identifiers.secondaryIdKey];
        const configBaseUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];

        if (!requirementId || !productId || !configBaseUrl) { return { name: `(Error: Invalid Data/Settings)`, url: "#" }; }

        let itemName = `${spiraConfig.identifiers.primaryItemName} ${requirementId}`; // Default name
        try {
            // Optional: Fetch current name using config
            // ... (similar API call logic as before, using config for endpoint/fields) ...
        } catch (error) { /* ... warning ... */ }

        // Construct URL using template and config
        try {
            let displayBaseUrl = configBaseUrl;
            if (spiraConfig.urlStructure.baseUrlIncludesApiPath) {
                 // Simple removal, might need more robust parsing
                 displayBaseUrl = displayBaseUrl.replace(/\/services\/.*$/i, '');
            }
            const url = spiraConfig.urlStructure.displayUrlTemplate
                .replace('{baseUrl}', displayBaseUrl)
                .replace('{productId}', productId)
                .replace('{requirementId}', requirementId);
            return { name: itemName, url: url };
        } catch(urlError) { /* ... error handling ... */ return { name: itemName, url: "#" }; }
    },

    // --- Actions ---
    async getAvailableActions(context, settings) {
        console.log(`Spira Plugin: getAvailableActions using config for ${spiraConfig.appName}`);
        const username = settings[spiraConfig.auth.usernameSettingKey];
        // ... (rest of settings check logic) ...
        if (context?.type === 'mapExport' && settingsAreValid) {
             return [{ id: 'exportMap', label: `Export Map to ${spiraConfig.appName}`, icon: '...' }];
        }
        return [];
    },

    async executeAction(actionId, context, settings) {
         console.log(`Spira Plugin: executeAction using config for ${spiraConfig.appName}`);
         const apiUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];
         // ... (get username/apiKey, check actionId/context) ...

         if (actionId === 'exportMap') {
             try {
                 // *** Challenge 1 again: Contextual Data ***
                 // Where does {projectId} come from for the export endpoint?
                 const placeholderProjectId = 101; // Needs context or config!
                 const endpoint = spiraConfig.endpoints.exportMapAsRequirement.replace('{projectId}', placeholderProjectId);
                 const mapData = context.mapData;

                 console.log("Spira Plugin: TODO - Call generic API helper for POST/PUT:", endpoint);
                 // Transform mapData based on spiraConfig.exportConfig?
                 // const result = await apiClient.post(apiUrl, endpoint, { username, apiKey }, transformedData);
                 // return { success: true, ... };
                 return { success: true, message: `Map exported to ${spiraConfig.appName} (Dummy).`};

             } catch (error) { /* ... error handling ... */ return { success: false,  }; }
         }
         return { success: false, message: "Action not supported." };
    }
};

module.exports = spiraPlugin;