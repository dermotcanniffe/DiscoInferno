Feature: Editing an Example Map

  Scenario: Adding a story
    Given the editor is rendered
    When I type "As a user I want to log in" into the story field
    Then the story field should contain "As a user I want to log in"
