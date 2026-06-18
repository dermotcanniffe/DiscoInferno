# Implementation Plan

## Overview
Implement the ability to delete individual rules, examples, and questions from the Example Map editor. This involves installing dependencies, creating delete handlers, building a confirmation dialog component, adding delete buttons to card components, wiring everything together, and writing property-based tests.

## Tasks

- [ ] 1. Install dependencies and configure test infrastructure
  Install `@radix-ui/react-alert-dialog` as a production dependency. Install `vitest`, `fast-check`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` as dev dependencies. Add a vitest config file (vitest.config.js) that uses jsdom as the environment. Add a `"test"` script to package.json that runs vitest. Verify the frontend builds without errors (`npm run build`).

- [ ] 2. Implement delete handlers in ExampleMapEditor
  Add three new delete handler functions to `src/ExampleMapEditor.jsx` following the existing clone-mutate-onChange pattern (matching `addRule`, `addExample`, `addQuestion`): `deleteRule(ri)` clones data, splices rule at index ri from stories[0].rules, reindexes remaining rules' order, calls onChange with guard clause for missing data or out-of-bounds index. `deleteExample(ri, ei)` clones data, splices example at index ei from stories[0].rules[ri].examples, reindexes remaining examples' order, calls onChange with same guards. `deleteQuestion(qi)` clones data, splices question at index qi from stories[0].questions, reindexes remaining questions' order, calls onChange with same guards. Also add `pendingDeleteRuleIndex` state (useState default null), `requestDeleteRule(ri)` that sets it, `confirmDeleteRule()` that calls deleteRule and resets to null, and `cancelDeleteRule()` that resets to null.

- [ ] 3. Create ConfirmDeleteRuleDialog component
  Create `src/components/ConfirmDeleteRuleDialog.jsx` using `@radix-ui/react-alert-dialog`. Props: `open` (boolean), `onConfirm` (function), `onCancel` (function), `ruleText` (string). Display title "Delete Rule" and description warning about cascade deletion of examples. Include Cancel and Delete (destructive styled) buttons. Use Tailwind classes matching existing design system. Ensure accessibility: focus trap, keyboard navigation, prevent background interaction while open.

- [ ] 4. Add delete buttons to RuleCard, ExampleCard, and QuestionCard
  Modify `src/components/RuleCard.jsx` to accept `onDeleteRule` prop and add a Trash2 icon button (from lucide-react) that calls `onDeleteRule(ruleIndex)` with ghost variant, red text/hover styling, and aria-label. Modify `src/components/ExampleCard.jsx` to accept `onDeleteExample` prop and add a Trash2 icon button that calls `onDeleteExample(ruleIndex, exampleIndex)` with same styling. Modify `src/components/QuestionCard.jsx` to accept `onDeleteQuestion` prop and add a Trash2 icon button that calls `onDeleteQuestion(questionIndex)` with same styling.

- [ ] 5. Wire everything together in ExampleMapEditor render
  Import ConfirmDeleteRuleDialog into ExampleMapEditor. Pass `onDeleteRule={requestDeleteRule}` to each RuleCard, `onDeleteExample={deleteExample}` to each ExampleCard, `onDeleteQuestion={deleteQuestion}` to each QuestionCard. Render ConfirmDeleteRuleDialog at the bottom with `open={pendingDeleteRuleIndex !== null}`, `onConfirm={confirmDeleteRule}`, `onCancel={cancelDeleteRule}`, and `ruleText` from the pending rule's data. Verify the frontend builds without errors.

- [ ] 6. Write property-based tests for delete handlers
  Extract the delete handler logic into a testable pure function module `src/utils/deleteHandlers.js` so it can be tested independently of React state. Create `src/__tests__/delete-handlers.property.test.js` using vitest and fast-check. Write properties: (1) deleteRule removes exactly one rule and all its child examples, (2) deleteExample removes exactly the targeted example with siblings unchanged, (3) deleteQuestion removes exactly the targeted question with siblings unchanged, (4) after any deletion remaining items have sequential order values 0..N-1. Use a custom arbitraryMapData generator producing map states with 1-5 rules (each with 0-4 examples) and 0-5 questions. All tests must pass with `npm test`.

## Task Dependency Graph
```json
{
  "waves": [
    {"tasks": [1]},
    {"tasks": [2, 3, 4]},
    {"tasks": [5, 6]}
  ]
}
```

## Notes
- No new API endpoints are needed. The existing PUT /api/maps/:mapId delete-all-recreate flow handles persistence.
- The delete handlers follow the same structuredClone pattern as existing addRule/addExample/addQuestion.
- Rule deletion uses a confirmation dialog because it cascade-deletes child examples.
- Example and question deletion are immediate (no confirmation) since they are leaf items.
