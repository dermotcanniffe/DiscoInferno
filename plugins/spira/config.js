// /plugins/spira/config.js
// Configuration specifics for interacting with the SpiraTest API

const spiraConfig = {
    // --- General ---
    appName: "SpiraTest", // Used for user-facing labels potentially

    // --- Authentication ---
    auth: {
        // Describes how to get credentials from settings object
        type: "basic_user_key", // Indicates username + key needed
        usernameSettingKey: 'username', // Plugin setting key for username
        keySettingKey: 'apiKey',        // Plugin setting key for API Key/RSS Token
    },

    // --- API Endpoint Patterns ---
    // Base URL is retrieved from settings via urlStructure.baseUrlSettingKey
    // Placeholders like {projectId}, {requirementId}, {query} will be replaced.
    // Note: These are conceptual patterns; actual Spira API calls might use different query params.
    endpoints: {
        searchRequirements: "/projects/{projectId}/requirements?search_string={query}", // Example: Needs project scope often
        getRequirementDetails: "/projects/{projectId}/requirements/{requirementId}",
        // Assume for now details includes ProjectID. If not, a separate lookup might be needed.
        exportMapAsRequirement: "/projects/{projectId}/requirements", // Typically a POST to create
    },

    // --- Identifier Mapping ---
    identifiers: {
        primaryItemName: "Requirement",    // User-facing name for linked items
        primaryIdKey: "requirementId",     // Key name used in our storedIdentifiers object
        secondaryIdKey: "productId",       // Key name used in our storedIdentifiers object

        // How to map fields from Spira API responses:
        searchResultIdField: "RequirementId", // Field in API search result containing the ID
        searchResultNameField: "Name",       // Field in API search result containing the display name
        detailsProjectIdField: "ProjectId",  // Field in API details result containing the Project ID
        detailsNameField: "Name",          // Field in API details result containing the Name
    },

    // --- Display URL Construction ---
    urlStructure: {
        // Template for user-clickable links
        displayUrlTemplate: "{baseUrl}/{productId}/Requirement/{requirementId}.aspx",
        // Setting key containing the base instance URL (e.g., https://myinstance.spiraservice.net)
        baseUrlSettingKey: 'apiUrl',
        // Does the setting value typically include API path (e.g., /services/...) that needs stripping?
        baseUrlIncludesApiPath: true,
    },

    // --- Export Configuration (Example) ---
    exportConfig: {
        defaultArtifactType: 'Requirement', // Default Spira artifact type to create
        // Could add details on how mapData fields map to Spira fields
    }
};

module.exports = spiraConfig;
