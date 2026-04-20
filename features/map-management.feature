Feature: Managing Example Maps

  As a user of DiscoInferno,
  I want to create, view, and delete Example Maps,
  so that I can manage my collection of discovery sessions.

  # --- Map List ---

  Scenario: Viewing the map list when no maps exist
    Given I am logged in
    And I have no Example Maps
    When I visit the dashboard
    Then I should see a message "You haven't created any maps yet."
    And a "Create New Map" button should be visible

  Scenario: Viewing the map list with existing maps
    Given I am logged in
    And I have the following Example Maps:
      | Title           |
      | Login Feature   |
      | Payment Flow    |
    When I visit the dashboard
    Then I should see "Login Feature" in the map list
    And I should see "Payment Flow" in the map list

  # --- Creating Maps ---

  Scenario: Creating a new map from the dashboard
    Given I am logged in
    When I visit the dashboard
    And I click the "Create New Map" button
    Then I should be navigated to the new map editor

  Scenario: Saving a new map persists it to the server
    Given I am logged in
    And I am editing a new map with title "Sprint 5 Discovery"
    When I save the map
    Then the map should be persisted with title "Sprint 5 Discovery"
    And I should be navigated to the saved map's URL

  # --- Opening Maps ---

  Scenario: Opening an existing map loads its full data
    Given I am logged in
    And I have an Example Map "Login Feature" with rules and examples
    When I open the map "Login Feature"
    Then the editor should display the map title "Login Feature"
    And the editor should display all rules and examples for that map

  # --- Deleting Maps ---

  Scenario: Deleting a map from the dashboard
    Given I am logged in
    And I have an Example Map "Old Discovery"
    When I click the delete button for "Old Discovery"
    And I confirm the deletion
    Then "Old Discovery" should no longer appear in the map list

  Scenario: Cancelling map deletion keeps the map
    Given I am logged in
    And I have an Example Map "Important Map"
    When I click the delete button for "Important Map"
    And I cancel the deletion
    Then "Important Map" should still appear in the map list

  Scenario: Deleting a map from within the editor
    Given I am logged in
    And I am editing an existing map "Throwaway Map"
    When I click the delete button in the editor
    And I confirm the deletion
    Then I should be navigated to the dashboard
    And "Throwaway Map" should no longer appear in the map list
