// /plugins/spira/index.js - Refactored to use config.js (Conceptual)

// Import the Spira-specific configuration
import spiraConfig from './config.js'; // Assumes config.js uses export default

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
    // Inside /plugins/spira/index.js

    /**
     * Searches for Spira Requirements based on user query within a specific Product context.
     * Conforms to Plugin.searchExternalItems definition.
     * @param {string} query - User's search input.
     * @param {import('../../plugins/plugin-api').LinkActionContext} context - Context containing item details (needs to include spiraProductId).
     * @param {import('../../plugins/plugin-api').PluginSettings} settings - Current plugin settings for the user.
     * @returns {Promise<import('../../plugins/plugin-api').SearchResultItem[]>}
     */
    async searchExternalItems(query, context, settings) {
        console.log(`Spira Plugin: searchExternalItems for context item ${context?.itemId}, query: "${query}"`);
        const apiUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];
        const username = settings[spiraConfig.auth.usernameSettingKey];
        const apiKey = settings[spiraConfig.auth.keySettingKey];
        const productId = context?.itemData?.spiraProductId; // Assumes productId is passed via context

        // Validate necessary inputs
        if (!apiUrl || !username || !apiKey || !productId || !query || query.trim().length < 2) {
            console.warn("Spira Plugin: Cannot search - missing required settings, productId from context, or query invalid.", {
                hasApiUrl: !!apiUrl, hasUsername: !!username, hasApiKey: !!apiKey, productId, query
            });
            return [];
        }
        console.log(`Spira Plugin: Searching in Product ID: ${productId}`);

        try {
            // Construct Spira REST API endpoint with search parameters (as corrected before)
            const startingRow = 1;
            const numberOfRows = 15; // Limit results
            const searchString = encodeURIComponent(query);
            const queryParams = `starting_row=${startingRow}&number_of_rows=${numberOfRows}&search_string=${searchString}`;
            let endpoint = spiraConfig.endpoints.searchRequirements
                .replace('{productId}', productId);
            endpoint = `${endpoint}?${queryParams}`;
    
            console.log(`Spira Plugin: Attempting to GET (REST): ${apiUrl}${endpoint}`);
    
            // Prepare Basic Authentication header (as before)
            const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');
            const headers = {
                'Authorization': `Basic ${credentials}`,
                'accept': 'application/json'
            };
    
            // ---*** Make the actual fetch call ***---
            const response = await fetch(apiUrl + endpoint, { method: 'GET', headers: headers });
    
            if (!response.ok) {
                // Attempt to get detailed error message from Spira response
                let errorBody = `Spira API request failed: ${response.status} ${response.statusText}`; // Default message
                try {
                    const errorJson = await response.json();
                    errorBody = errorJson.Message || JSON.stringify(errorJson); // Spira often uses 'Message'
                } catch (e) {
                    try { errorBody = await response.text(); } catch (e2) {} // Fallback to text if not JSON
                }
                console.error(`Spira API Error ${response.status}: ${errorBody}`);
                throw new Error(`Spira API Error: ${errorBody}`); // Throw error to be caught below
            }
    
            // Parse the successful JSON response
            const results = await response.json();
            // ---*** End fetch call and initial processing ***---
    
            // Validate and map results (as before)
            if (!Array.isArray(results)) {
                 console.warn("Spira API Warning: Response was not an array as expected.", results);
                 return [];
            }
    
            const idField = spiraConfig.identifiers.searchResultIdField;
            const nameField = spiraConfig.identifiers.searchResultNameField;
    
            const mappedResults = results.map(item => {
                 if (typeof item?.[idField] === 'undefined' || typeof item?.[nameField] === 'undefined') {
                     console.warn('Spira Plugin: Skipping search result item with missing fields:', item);
                     return null;
                 }
                 return {
                     id: item[idField],
                     name: item[nameField] || `Item ${item[idField]}`
                 };
            }).filter(item => item !== null);
    
            console.log(`Spira Plugin: Found ${mappedResults.length} valid results for query "${query}"`);
            return mappedResults;
    
        } catch (error) {
            console.error(`Spira Plugin: Failed during searchExternalItems for query "${query}" in product ${productId}:`, error);
            // Optionally, communicate specific errors back if the API allows
            // For now, return empty array to indicate search failure/no results
            return [];
        }
    }, // End of searchExternalItems
    /**
         * Validates selection/input and returns the object { requirementId, productId } to be stored.
         * @param {import('../../plugins/plugin-api').SearchResultItem | string | number} selectedItem - Item selected or ID entered.
         * @param {import('../../plugins/plugin-api').LinkActionContext} context - Context including details about the item being linked.
         * @param {import('../../plugins/plugin-api').PluginSettings} settings - Current plugin settings for the user.
         * @returns {Promise<import('../../plugins/plugin-api').StoredIdentifiers>} - Should return { requirementId: number, productId: number } for Spira.
         */
    /**
     * Validates user-provided Requirement ID against Spira API for a specific project context
     * and returns the validated identifiers object for storage.
     * @param {string | number} userInputId - The ID entered by the user (e.g., "5", "RQ:5").
     * @param {import('../../plugins/plugin-api').LinkActionContext} context - Context including itemType, itemId, itemData { spiraProjectId }.
     * @param {import('../../plugins/plugin-api').PluginSettings} settings - Current plugin settings for the user.
     * @returns {Promise<import('../../plugins/plugin-api').StoredIdentifiers>} - Returns { requirementId: number, productId: number } if valid.
     * @throws {Error} If validation fails (not found, auth error, config error, API error, project mismatch).
     */
    async getExternalIdentifiersToStore(userInputId, context, settings) {
        console.log(`Spira Plugin: getExternalIdentifiersToStore called for context item ${context?.itemId}, input ID: "${userInputId}"`);

        // --- Get Settings & Context ---
        const apiUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];
        const username = settings[spiraConfig.auth.usernameSettingKey];
        const apiKey = settings[spiraConfig.auth.keySettingKey];
        // Use projectId based on API spec provided by user
        const projectId = context?.itemData?.spiraProjectId;

        // --- Validate Inputs ---
        if (!apiUrl || !username || !apiKey) {
            // Throw error if essential settings are missing
            throw new Error(`${spiraConfig.appName} settings (API URL, Username, API Key) are required.`);
        }
        if (!projectId) {
            // We absolutely need the project ID from context for this validation call
            throw new Error(`Context must provide the target Spira Project ID (context.itemData.spiraProjectId)`);
        }
        if (typeof userInputId === 'undefined' || userInputId === null || String(userInputId).trim() === '') {
             throw new Error("Requirement ID input cannot be empty.");
        }

        // --- Parse Requirement ID ---
        let requirementId;
        try {
             // Attempt to extract digits only from user input
             const parsed = parseInt(String(userInputId).replace(/[^0-9]/g,''), 10);
             if (isNaN(parsed) || parsed <= 0) {
                throw new Error(); // Throw generic to be caught below
             }
             requirementId = parsed;
        } catch (e) {
             throw new Error(`Invalid Requirement ID format: "${userInputId}". Please enter a valid numeric ID (e.g., 5).`);
        }
        console.log(`Spira Plugin: Parsed Requirement ID: ${requirementId}, Target Project ID: ${projectId}`);

        // --- Call Spira API to Validate Requirement Existence in Project ---
        try {
            // Construct endpoint URL using config and extracted IDs
            const endpoint = spiraConfig.endpoints.getRequirementDetails // Should be "/projects/{projectId}/requirements/{requirementId}"
                 .replace('{projectId}', projectId)
                 .replace('{requirementId}', requirementId);

            console.log(`Spira Plugin: Attempting to GET (validate): ${apiUrl}${endpoint}`);

            // Prepare Basic Authentication header
            const credentials = Buffer.from(`${username}:${apiKey}`).toString('base64');
            const headers = {
                'Authorization': `Basic ${credentials}`,
                'accept': 'application/json'
            };

            // --- Make the actual fetch call ---
            const response = await fetch(apiUrl + endpoint, { method: 'GET', headers: headers });

            // --- Handle Response Status for Validation ---
            if (response.status === 404) {
                 console.warn(`Spira Validation Failed: Requirement ${requirementId} not found in Project ${projectId}.`);
                 // Provide a user-friendly error message
                 throw new Error(`Requirement RQ:${requirementId} was not found in Spira Project ${projectId}. Please check the ID and the project associated with this Example Map.`);
            }
            if (response.status === 401 || response.status === 403) {
                console.error("Spira Validation Failed: Authentication/Authorization error.");
                throw new Error("Authentication failed accessing Spira. Please check your API credentials in settings.");
            }
            if (!response.ok) {
                // Handle other potential API errors
                let errorBody = `Spira API request failed: ${response.status} ${response.statusText}`;
                try {
                    const errorJson = await response.json();
                    errorBody = errorJson.Message || JSON.stringify(errorJson);
                } catch (e) { try { errorBody = await response.text(); } catch (e2) {} }
                console.error(`Spira API Error ${response.status}: ${errorBody}`);
                throw new Error(`Spira API Error: ${errorBody}`);
            }

            // --- If response.ok (e.g., 200), the Requirement exists in the Project ---
            console.log(`Spira Validation: Successfully verified Req ${requirementId} exists in Project ${projectId}.`);

            // Optional but recommended: Double-check the returned Project ID matches context
            try {
                 const details = await response.json();
                 const projectIdField = spiraConfig.identifiers.detailsProjectIdField; // e.g., "ProjectId"
                 const confirmedProjectId = details?.[projectIdField];

                 if (typeof confirmedProjectId !== 'undefined' && confirmedProjectId !== projectId) {
                     console.error(`Spira Validation: Project ID mismatch! Context expected ${projectId}, Requirement ${requirementId} actually belongs to ${confirmedProjectId}.`);
                     throw new Error(`Requirement RQ:${requirementId} exists but belongs to a different Spira Project (Expected: ${projectId}, Found: ${confirmedProjectId}) than the one associated with this Example Map.`);
                 } else if (typeof confirmedProjectId !== 'undefined') {
                    console.log(`Spira Validation: Confirmed requirement belongs to Project ${confirmedProjectId}.`);
                 } else {
                    console.warn(`Spira Validation: API response for Req ${requirementId} did not contain expected Project ID field '${projectIdField}'. Assuming validity based on 200 OK.`);
                 }
            } catch (parseError) {
                 console.warn(`Spira Validation: Could not parse details response to confirm Project ID for Req ${requirementId}. Assuming validity based on 200 OK.`, parseError);
            }


            // --- Return validated identifiers using keys from config ---
            // We use the projectId from the context, now that we've validated the requirement belongs to it.
             return {
                [spiraConfig.identifiers.primaryIdKey]: requirementId,   // e.g., requirementId
                [spiraConfig.identifiers.secondaryIdKey]: projectId     // e.g., productId
            };

        } catch (error) {
            console.error(`Spira Plugin: Failed during getExternalIdentifiersToStore for Req ${requirementId}, Proj ${projectId}:`, error);
            // Rethrow the error so the calling controller/API route can catch it and inform the user
            throw error;
        }
    }, // End of getExternalIdentifiersToStore

    /**
         * Gets display info (current name, URL) for a linked Spira item.
         * @param {import('../../plugins/plugin-api').StoredIdentifiers} storedIdentifiers - Stored { requirementId, productId }.
         * @param {import('../../plugins/plugin-api').LinkActionContext} context - Context about where the link is displayed.
         * @param {import('../../plugins/plugin-api').PluginSettings} settings - Current plugin settings for the user.
         * @returns {Promise<import('../../plugins/plugin-api').DisplayInfo>}
         */
    async getDisplayInfo(storedIdentifiers, context, settings) { // <<< Added context parameter
        console.log(`Spira Plugin: getDisplayInfo for context item ${context?.itemId}, identifiers:`, storedIdentifiers);
        const requirementId = storedIdentifiers[spiraConfig.identifiers.primaryIdKey];
        const productId = storedIdentifiers[spiraConfig.identifiers.secondaryIdKey];
        const configBaseUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];

        if (!requirementId || !productId || !configBaseUrl) {
            console.error("Spira Plugin: Invalid storedIdentifiers or missing API URL for getDisplayInfo.");
            return { name: `(Error: Invalid Link/Settings)`, url: "#" };
        }

        let itemName = `${spiraConfig.identifiers.primaryItemName} ${requirementId}`; // Default name
        try {
            // TODO: Optional: Call Spira API (using settings, productId, requirementId)
            // to get the *current* name/status of the requirement for fresher display.
            // const details = await apiClient.getRequirementDetails(settings, productId, requirementId);
            // if (details?.Name) itemName = `REQ-${requirementId}: ${details.Name}`;
            console.warn("Spira Plugin: TODO - Optionally call Spira API to get current name in getDisplayInfo");
        } catch (error) {
            console.warn(`Spira Plugin: Failed to fetch current name for ${requirementId}, using default. Error:`, error);
        }

        // Construct the display URL using template and config
        let displayUrl = "#"; // Default URL on error
        try {
            let displayBaseUrl = configBaseUrl;
            if (spiraConfig.urlStructure.baseUrlIncludesApiPath) {
                displayBaseUrl = displayBaseUrl.replace(/\/services\/.*$/i, ''); // Remove API path if needed
            }
            displayUrl = spiraConfig.urlStructure.displayUrlTemplate
                .replace('{baseUrl}', displayBaseUrl)
                .replace('{productId}', productId)
                .replace('{requirementId}', requirementId);
        } catch (urlError) {
            console.error("Spira Plugin: Failed to construct display URL from apiUrl setting:", configBaseUrl, urlError);
        }

        return {
            name: itemName,
            url: displayUrl
        };
    },

    // --- Actions ---
    /**
         * Declares available actions for a given context.
         * @param {import('../../plugins/plugin-api').LinkActionContext} context - Context where actions are requested.
         * @param {import('../../plugins/plugin-api').PluginSettings} settings - Current plugin settings for the user.
         * @returns {Promise<import('../../plugins/plugin-api').ActionDefinition[]>}
         */
    async getAvailableActions(context, settings) { // <<< Added settings parameter
        console.log("Spira Plugin: getAvailableActions called for context type:", context?.type);
        const username = settings[spiraConfig.auth.usernameSettingKey];
        const apiKey = settings[spiraConfig.auth.keySettingKey];
        const apiUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];
        const settingsAreValid = !!(username && apiKey && apiUrl);

        // Only offer exportMap action in the correct context and if settings are valid
        if (context?.type === 'mapExport' && settingsAreValid) {
            return [{
                id: 'exportMap', // Standardized action ID
                label: `Export Map to ${spiraConfig.appName}`,
                icon: 'upload' // Example icon name
            }];
        }
        return []; // No other actions defined for now
    },

    /**
         * Executes a requested action.
         * @param {import('../../plugins/plugin-api').LinkActionContext} context - Context including actionId and necessary data (e.g., itemData.mapData, itemData.spiraProductId).
         * @param {import('../../plugins/plugin-api').PluginSettings} settings - Current plugin settings for the user.
         * @returns {Promise<import('../../plugins/plugin-api').ActionResult>}
         */
    async executeAction(context, settings) { // <<< Updated signature
        const actionId = context?.actionId;
        console.log(`Spira Plugin: executeAction called for actionId: ${actionId}, context type: ${context?.type}`);

        if (actionId === 'exportMap' && context?.type === 'mapExport') {
            const apiUrl = settings[spiraConfig.urlStructure.baseUrlSettingKey];
            const username = settings[spiraConfig.auth.usernameSettingKey];
            const apiKey = settings[spiraConfig.auth.keySettingKey];
            // Get Product ID from context for the export target
            const productId = context?.itemData?.spiraProductId; // <<< Assumes productId passed via context
            const mapData = context?.itemData?.mapData; // <<< Assumes mapData passed via context

            // Check prerequisites
            if (!apiUrl || !username || !apiKey || !productId || !mapData) {
                console.error("Spira Plugin: Cannot execute exportMap - missing settings, productId, or mapData.");
                return { success: false, message: 'Cannot export: Missing settings, target product ID, or map data.' };
            }

            try {
                console.log(`Spira Plugin: Executing exportMap to Product ${productId}...`);

                // Construct endpoint using config and context productId
                const endpoint = spiraConfig.endpoints.exportMapAsRequirement.replace('{projectId}', productId); // Corrected placeholder

                // TODO: Implement actual Spira Export Logic
                // 1. Transform mapData into the required Spira API format (e.g., JSON for creating a Requirement).
                // 2. Prepare authentication headers (Basic Auth).
                // 3. Make the POST request using fetch or apiClient.
                console.warn(`Spira Plugin: TODO - Call Spira API (POST ${apiUrl}${endpoint}) to export map data`);
                // await apiClient.post(apiUrl, endpoint, { username, apiKey }, transformedData);

                // ----- Dummy Success for Development -----
                await new Promise(resolve => setTimeout(resolve, 500));
                // ----- End Dummy Success -----

                return { success: true, message: `Map exported to ${spiraConfig.appName} (Product ${productId}) successfully!` };

            } catch (error) {
                console.error(`Spira Plugin: Export action failed for product ${productId}:`, error);
                return { success: false, message: `Spira export failed: ${error.message || 'Unknown error'}` };
            }
        }

        console.warn(`Spira Plugin: Action ${actionId} not supported or invalid context.`);
        return { success: false, message: `Action ${actionId} not supported in this context.` };
    }
};
// Use ES Module default export
export default spiraPlugin;