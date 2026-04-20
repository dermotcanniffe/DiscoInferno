Feature: Editing an Example Map

  As a user of DiscoInferno,
  I want to create and edit Example Maps with stories, rules, examples, and questions,
  so that I can capture discovery session outcomes.

  # --- Map Title and Description ---

  Scenario: Setting a map title
    Given the editor is rendered with a new map
    When I enter "Login Feature" into the map title field
    And the map title field loses focus
    Then the map data title should be "Login Feature"

  Scenario: Setting a map description
    Given the editor is rendered with a new map
    When I enter "Covers all login scenarios" into the map description field
    And the map description field loses focus
    Then the map data description should be "Covers all login scenarios"

  # --- Story Editing ---

  Scenario: Editing a story's text
    Given the editor is rendered with a map containing one story "Initial Story..."
    When I change the story text to "As a user I want to log in"
    And the story field loses focus
    Then the story text in the map data should be "As a user I want to log in"

  # --- Adding Rules ---

  Scenario: Adding a rule to a story
    Given the editor is rendered with a map containing one story and no rules
    When I click the "Add Rule" button
    Then the map should have 1 rule
    And the new rule should have empty text

  Scenario: Adding multiple rules
    Given the editor is rendered with a map containing one story and no rules
    When I click the "Add Rule" button
    And I click the "Add Rule" button
    Then the map should have 2 rules
    And the rules should have sequential order values starting from 0

  # --- Editing Rules ---

  Scenario: Editing a rule's text
    Given the editor is rendered with a map containing one rule with text "Old rule"
    When I change the rule text to "Must provide valid email"
    And the rule field loses focus
    Then the rule text in the map data should be "Must provide valid email"

  # --- Adding Examples ---

  Scenario: Adding an example to a rule
    Given the editor is rendered with a map containing one rule and no examples
    When I click the "+ Example" button on the first rule
    Then the first rule should have 1 example
    And the new example should have empty text

  Scenario: Adding multiple examples to a rule
    Given the editor is rendered with a map containing one rule and no examples
    When I click the "+ Example" button on the first rule
    And I click the "+ Example" button on the first rule
    Then the first rule should have 2 examples
    And the examples should have sequential order values starting from 0

  # --- Editing Examples ---

  Scenario: Editing an example's text
    Given the editor is rendered with a map containing one example with text "Old example"
    When I change the example text to "User enters correct password"
    And the example field loses focus
    Then the example text in the map data should be "User enters correct password"

  # --- Adding Questions ---

  Scenario: Adding a question to a story
    Given the editor is rendered with a map containing one story and no questions
    When I click the "Add Question" button
    Then the map should have 1 question
    And the new question should have empty text

  Scenario: Adding multiple questions
    Given the editor is rendered with a map containing one story and no questions
    When I click the "Add Question" button
    And I click the "Add Question" button
    Then the map should have 2 questions
    And the questions should have sequential order values starting from 0

  # --- Editing Questions ---

  Scenario: Editing a question's text
    Given the editor is rendered with a map containing one question with text "Old question"
    When I change the question text to "What about 2FA?"
    And the question field loses focus
    Then the question text in the map data should be "What about 2FA?"

  # --- Save Button ---

  Scenario: Save button is visible in the editor
    Given the editor is rendered with a new map
    Then a "Save" button should be visible
