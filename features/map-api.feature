Feature: Example Map API

  As a developer of DiscoInferno,
  I want the API to enforce authentication and ownership on all map operations,
  so that users can only access and modify their own maps.

  # --- Authentication ---

  Scenario: API rejects requests without authentication
    When I send a GET request to /api/maps without an auth token
    Then the API should respond with status 401

  Scenario: API rejects requests with an invalid token
    When I send a GET request to /api/maps with an invalid auth token
    Then the API should respond with status 401

  # --- Map CRUD ---

  Scenario: Creating a map via the API
    Given I am authenticated as "user@example.com"
    When I send a POST request to /api/maps with a valid map payload
    Then the API should respond with status 201
    And the response should contain the created map with an id

  Scenario: Listing maps returns only the authenticated user's maps
    Given I am authenticated as "user@example.com"
    And "user@example.com" has 2 maps
    And "other@example.com" has 3 maps
    When I send a GET request to /api/maps
    Then the API should respond with status 200
    And the response should contain 2 maps

  Scenario: Getting a specific map by ID
    Given I am authenticated as "user@example.com"
    And I own a map with a known ID
    When I send a GET request to /api/maps/:mapId
    Then the API should respond with status 200
    And the response should contain the full map with stories, rules, examples, and questions

  Scenario: Getting a map owned by another user returns 404
    Given I am authenticated as "user@example.com"
    And "other@example.com" owns a map with a known ID
    When I send a GET request to /api/maps/:mapId for that map
    Then the API should respond with status 404

  Scenario: Updating a map via the API
    Given I am authenticated as "user@example.com"
    And I own a map with a known ID
    When I send a PUT request to /api/maps/:mapId with updated data
    Then the API should respond with status 200
    And the response should contain the updated map data

  Scenario: Updating a map owned by another user is forbidden
    Given I am authenticated as "user@example.com"
    And "other@example.com" owns a map with a known ID
    When I send a PUT request to /api/maps/:mapId for that map
    Then the API should respond with status 403

  Scenario: Deleting a map via the API
    Given I am authenticated as "user@example.com"
    And I own a map with a known ID
    When I send a DELETE request to /api/maps/:mapId
    Then the API should respond with status 204

  Scenario: Deleting a map owned by another user is forbidden
    Given I am authenticated as "user@example.com"
    And "other@example.com" owns a map with a known ID
    When I send a DELETE request to /api/maps/:mapId for that map
    Then the API should respond with status 403 or 404

  # --- Data Integrity ---

  Scenario: Creating a map with missing required fields
    Given I am authenticated as "user@example.com"
    When I send a POST request to /api/maps without a title
    Then the API should respond with status 400

  Scenario: Nested data is returned in correct order
    Given I am authenticated as "user@example.com"
    And I own a map with rules at order 2, 0, 1
    When I send a GET request to /api/maps/:mapId
    Then the rules in the response should be ordered by their order field ascending
