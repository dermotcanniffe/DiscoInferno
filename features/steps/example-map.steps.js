const { Given, When, Then } = require('@cucumber/cucumber');
const { render, screen, fireEvent } = require('@testing-library/react');
const React = require('react');
const ExampleMapEditor = require('../../src/ExampleMapEditor').default;

let state;
let setState;

Given('the editor is rendered', () => {
  state = { story: { text: '', rules: [] }, questions: [] };
  setState = (newState) => { state = newState };
  render(React.createElement(ExampleMapEditor, {
    data: state,
    onChange: setState,
    onSave: () => {}
  }));
});

When('I type {string} into the story field', (text) => {
  fireEvent.change(screen.getByLabelText('Story (Yellow)'), {
    target: { value: text }
  });
});

Then('the story field should contain {string}', (text) => {
  const field = screen.getByLabelText('Story (Yellow)');
  if (field.value !== text) {
    throw new Error(`Expected "${text}", got "${field.value}"`);
  }
});
