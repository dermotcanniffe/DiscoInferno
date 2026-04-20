Feature: Deleting individual items from an Example Map

  As a user of DiscoInferno,
  I want to delete individual rules, examples, and questions from my Example Map,
  so that I can refine my map without starting over.

  Background:
    Given I am logged in
    And I have an Example Map with the following structure:
      | Type     | Parent  | Text                  | Order |
      | Story    |         | User login story      | 0     |
      | Rule     | Story 0 | Valid credentials     | 0     |
      | Rule     | Story 0 | Invalid credentials   | 1     |
      | Rule     | Story 0 | Account locked        | 2     |
      | Example  | Rule 0  | Standard user login   | 0     |
      | Example  | Rule 0  | Admin user login      | 1     |
      | Example  | Rule 1  | Wrong password        | 0     |
      | Question | Story 0 | What about 2FA?       | 0     |
      | Question | Story 0 | Rate limiting needed? | 1     |
    And the editor is open for that map

  # --- Deleting Rules ---

  Scenario: Delete button is visible on each rule card
    Then each rule card should display a delete button

  Scenario: Deleting a rule shows a confirmation dialog
    When I click the delete button on rule "Valid credentials"
    Then a confirmation dialog should appear
    And the dialog should warn that deleting the rule will also delete its examples

  Scenario: Confirming rule deletion removes the rule and its examples
    When I click the delete button on rule "Invalid credentials"
    And I confirm the deletion
    Then rule "Invalid credentials" should no longer appear in the editor
    And example "Wrong password" should no longer appear in the editor
    And the map should have 2 rules

  Scenario: Cancelling rule deletion keeps the rule intact
    When I click the delete button on rule "Valid credentials"
    And I cancel the deletion
    Then rule "Valid credentials" should still appear in the editor
    And the map should have 3 rules

  Scenario: Remaining rules are reordered after deletion
    When I delete rule "Valid credentials" and confirm
    Then rule "Invalid credentials" should have order 0
    And rule "Account locked" should have order 1

  Scenario: Deleting the last remaining rule leaves an empty rules section
    Given the map has only one rule "Valid credentials" with no examples
    When I delete rule "Valid credentials" and confirm
    Then the rules section should be empty
    And the "Add Rule" button should still be visible

  # --- Deleting Examples ---

  Scenario: Delete button is visible on each example card
    Then each example card should display a delete button

  Scenario: Deleting an example removes it without confirmation
    When I click the delete button on example "Admin user login"
    Then example "Admin user login" should no longer appear in the editor
    And rule "Valid credentials" should still have example "Standard user login"

  Scenario: Remaining examples are reordered after deletion
    Given rule "Valid credentials" has examples "Standard user login" at order 0 and "Admin user login" at order 1
    When I delete example "Standard user login"
    Then example "Admin user login" should have order 0

  Scenario: Deleting the last example from a rule leaves the rule with no examples
    Given rule "Invalid credentials" has only one example "Wrong password"
    When I delete example "Wrong password"
    Then rule "Invalid credentials" should have 0 examples
    And the "+ Example" button on rule "Invalid credentials" should still be visible

  # --- Deleting Questions ---

  Scenario: Delete button is visible on each question card
    Then each question card should display a delete button

  Scenario: Deleting a question removes it without confirmation
    When I click the delete button on question "Rate limiting needed?"
    Then question "Rate limiting needed?" should no longer appear in the editor
    And the map should have 1 question

  Scenario: Remaining questions are reordered after deletion
    When I delete question "What about 2FA?"
    Then question "Rate limiting needed?" should have order 0

  Scenario: Deleting the last question leaves an empty questions section
    Given the map has only one question "What about 2FA?"
    When I delete question "What about 2FA?"
    Then the questions section should be empty
    And the "Add Question" button should still be visible

  # --- Persistence ---

  Scenario: Deleted rule is not present after saving and reloading
    When I delete rule "Invalid credentials" and confirm
    And I save the map
    And I reload the map from the server
    Then rule "Invalid credentials" should not be present in the loaded data
    And example "Wrong password" should not be present in the loaded data

  Scenario: Deleted example is not present after saving and reloading
    When I delete example "Admin user login"
    And I save the map
    And I reload the map from the server
    Then example "Admin user login" should not be present in the loaded data

  Scenario: Deleted question is not present after saving and reloading
    When I delete question "Rate limiting needed?"
    And I save the map
    And I reload the map from the server
    Then question "Rate limiting needed?" should not be present in the loaded data
