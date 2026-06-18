Feature: Drag and drop reordering in the Example Map editor

  As a user of DiscoInferno,
  I want to reorder rules, examples, and questions by dragging them,
  so that I can organise my map to reflect the discussion flow.

  Background:
    Given the editor is rendered with a map containing:
      | Type     | Parent  | Text              | Order |
      | Story    |         | Login story       | 0     |
      | Rule     | Story 0 | Rule A            | 0     |
      | Rule     | Story 0 | Rule B            | 1     |
      | Rule     | Story 0 | Rule C            | 2     |
      | Example  | Rule 0  | Example A1        | 0     |
      | Example  | Rule 0  | Example A2        | 1     |
      | Question | Story 0 | Question 1        | 0     |
      | Question | Story 0 | Question 2        | 1     |

  # --- Reordering Rules ---

  Scenario: Reordering rules updates their order values
    When I drag Rule "Rule C" before Rule "Rule A"
    Then the rules should be ordered "Rule C", "Rule A", "Rule B"
    And each rule should have a sequential order value starting from 0

  # --- Reordering Examples ---

  Scenario: Reordering examples within a rule updates their order values
    When I drag Example "Example A2" before Example "Example A1"
    Then the examples in the first rule should be ordered "Example A2", "Example A1"
    And each example should have a sequential order value starting from 0

  # --- Reordering Questions ---

  Scenario: Reordering questions updates their order values
    When I drag Question "Question 2" before Question "Question 1"
    Then the questions should be ordered "Question 2", "Question 1"
    And each question should have a sequential order value starting from 0

  # --- No-op Drags ---

  Scenario: Dropping an item on itself does not change order
    When I drag Rule "Rule A" onto itself
    Then the rules should be ordered "Rule A", "Rule B", "Rule C"
