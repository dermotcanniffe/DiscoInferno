# Requirements Document

## Introduction

DiscoInferno's Example Map editor currently allows users to add rules, examples, and questions to a story, but provides no way to remove individual items once added. The only destructive action available is deleting an entire map. This feature adds the ability to delete individual rules, examples, and questions from within the editor, with appropriate confirmation for destructive actions and automatic reordering of remaining items.

## Glossary

- **Editor**: The ExampleMapEditor React component that renders and manages an Example Map's content
- **Rule_Card**: A blue-colored draggable card representing a single rule within a story, rendered by the RuleCard component
- **Example_Card**: A green-colored draggable card representing a single example within a rule, rendered by the ExampleCard component
- **Question_Card**: A red-colored draggable card representing a single question within a story, rendered by the QuestionCard component
- **Confirmation_Dialog**: A modal or inline prompt that requires the user to confirm a destructive action before it is executed
- **Delete_Button**: A clickable control on a card that initiates the deletion flow for that item
- **API**: The Express backend server exposing RESTful endpoints for map operations
- **Cascade_Delete**: The automatic deletion of child records when a parent record is deleted, as defined in the Prisma schema

## Gherkin Feature Specifications

The scenarios for this feature are defined in the following feature file, which serves as the primary executable specification:

- **`features/delete-individual-items.feature`** — 18 scenarios covering rule deletion with confirmation, example and question deletion without confirmation, reordering after deletion, empty state handling, and persistence through save/reload.

Additionally, the following regression feature files cover existing functionality and should pass before and after this feature is implemented:

- **`features/example-map.feature`** — Editing maps: title, description, stories, rules, examples, questions, and the save button.
- **`features/drag-and-drop.feature`** — Drag-and-drop reordering of rules, examples, and questions.
- **`features/map-management.feature`** — Creating, listing, opening, and deleting entire maps.
- **`features/authentication.feature`** — Registration, login, logout, and route protection.
- **`features/map-api.feature`** — API authentication, CRUD operations, ownership enforcement, and data integrity.

## Requirements

### Requirement 1: Delete Button on Item Cards

**User Story:** As a map editor user, I want to see a delete button on each rule, example, and question card, so that I can initiate deletion of any individual item.

#### Acceptance Criteria

1. THE Editor SHALL display a Delete_Button on each Rule_Card
2. THE Editor SHALL display a Delete_Button on each Example_Card
3. THE Editor SHALL display a Delete_Button on each Question_Card
4. THE Delete_Button SHALL be visually distinct and accessible with an appropriate aria-label

### Requirement 2: Confirmation Before Deleting a Rule

**User Story:** As a map editor user, I want to be warned before deleting a rule, so that I do not accidentally lose the rule and its child examples.

#### Acceptance Criteria

1. WHEN the user clicks the Delete_Button on a Rule_Card, THE Editor SHALL display a Confirmation_Dialog before performing the deletion
2. THE Confirmation_Dialog SHALL inform the user that deleting the rule will also delete all examples belonging to that rule
3. WHEN the user confirms the deletion in the Confirmation_Dialog, THE Editor SHALL remove the rule and all of its child examples from the map state
4. WHEN the user cancels the deletion in the Confirmation_Dialog, THE Editor SHALL leave the rule and its examples unchanged
5. WHILE the Confirmation_Dialog is open, THE Editor SHALL prevent interaction with the map content behind the dialog

### Requirement 3: Delete an Example Without Confirmation

**User Story:** As a map editor user, I want to delete an example directly without a confirmation step, so that I can quickly clean up lightweight items.

#### Acceptance Criteria

1. WHEN the user clicks the Delete_Button on an Example_Card, THE Editor SHALL immediately remove that example from the parent rule's examples list in the map state
2. THE Editor SHALL remove only the targeted example and leave sibling examples intact

### Requirement 4: Delete a Question Without Confirmation

**User Story:** As a map editor user, I want to delete a question directly without a confirmation step, so that I can quickly remove resolved or irrelevant questions.

#### Acceptance Criteria

1. WHEN the user clicks the Delete_Button on a Question_Card, THE Editor SHALL immediately remove that question from the story's questions list in the map state
2. THE Editor SHALL remove only the targeted question and leave sibling questions intact

### Requirement 5: Reorder Remaining Items After Deletion

**User Story:** As a map editor user, I want the remaining items to be automatically reordered after a deletion, so that the order values stay consistent and sequential.

#### Acceptance Criteria

1. WHEN a rule is deleted, THE Editor SHALL update the order property of all remaining rules in the story to be sequential starting from 0
2. WHEN an example is deleted, THE Editor SHALL update the order property of all remaining examples in the parent rule to be sequential starting from 0
3. WHEN a question is deleted, THE Editor SHALL update the order property of all remaining questions in the story to be sequential starting from 0

### Requirement 6: Empty State After Last Item Deletion

**User Story:** As a map editor user, I want the editor to remain usable after I delete the last item in a section, so that I can continue adding new items.

#### Acceptance Criteria

1. WHEN the user deletes the last rule in a story, THE Editor SHALL display an empty rules section with the "Add Rule" button still visible
2. WHEN the user deletes the last example from a rule, THE Editor SHALL display the rule with zero examples and the "+ Example" button still visible
3. WHEN the user deletes the last question in a story, THE Editor SHALL display an empty questions section with the "Add Question" button still visible

### Requirement 7: Persistence of Deletions

**User Story:** As a map editor user, I want my deletions to be saved to the server when I save the map, so that deleted items do not reappear on reload.

#### Acceptance Criteria

1. WHEN the user saves the map after deleting items, THE API SHALL persist the updated map state without the deleted items
2. WHEN the user reloads a map that had items deleted and saved, THE API SHALL return the map without the previously deleted items
3. THE API SHALL rely on the existing Cascade_Delete behavior in the Prisma schema to remove child records when parent records are deleted during the save operation

### Requirement 8: Authorization for Deletion Operations

**User Story:** As a system administrator, I want deletion operations to be protected by authentication and ownership checks, so that users cannot delete items from maps they do not own.

#### Acceptance Criteria

1. IF a deletion request is received without a valid authentication token, THEN THE API SHALL respond with HTTP status 401
2. IF a deletion request targets a map owned by a different user, THEN THE API SHALL respond with HTTP status 403 or 404
3. THE API SHALL verify map ownership before processing any deletion operation
