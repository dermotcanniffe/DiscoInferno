import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deleteRule, deleteExample, deleteQuestion } from '../utils/deleteHandlers.js';

/**
 * Generator for a valid map state with sequential order values.
 */
const arbitraryMapData = () =>
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 20 }),
    description: fc.string({ maxLength: 50 }),
    stories: fc.tuple(
      fc.record({
        text: fc.string({ minLength: 1, maxLength: 30 }),
        order: fc.constant(0),
        rules: fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 30 }),
            order: fc.nat(),
            examples: fc.array(
              fc.record({
                text: fc.string({ minLength: 1, maxLength: 30 }),
                order: fc.nat()
              }),
              { minLength: 0, maxLength: 4 }
            )
          }),
          { minLength: 1, maxLength: 5 }
        ),
        questions: fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 30 }),
            order: fc.nat()
          }),
          { minLength: 0, maxLength: 5 }
        )
      })
    ).map(([story]) => {
      // Fix order values to be sequential
      story.rules.forEach((rule, i) => {
        rule.order = i;
        rule.examples.forEach((ex, j) => { ex.order = j; });
      });
      story.questions.forEach((q, i) => { q.order = i; });
      return [story];
    })
  });

describe('Delete Handlers - Property-Based Tests', () => {
  /**
   * Property 1: deleteRule removes exactly one rule and all its child examples
   * **Validates: Requirements 2.3**
   */
  describe('Property 1: deleteRule removes exactly one rule and all its child examples', () => {
    it('result has exactly originalRules.length - 1 rules', () => {
      fc.assert(
        fc.property(arbitraryMapData(), (data) => {
          const rules = data.stories[0].rules;
          const ri = Math.floor(Math.random() * rules.length);
          const result = deleteRule(data, ri);
          expect(result.stories[0].rules.length).toBe(rules.length - 1);
        }),
        { numRuns: 100 }
      );
    });

    it('the deleted rule text is not in the result rules', () => {
      fc.assert(
        fc.property(arbitraryMapData(), (data) => {
          const rules = data.stories[0].rules;
          const ri = Math.floor(Math.random() * rules.length);
          const deletedText = rules[ri].text;
          const result = deleteRule(data, ri);
          const remainingTexts = result.stories[0].rules.map(r => r.text);
          // Only check absence if the deleted text was unique among rules
          const countBefore = rules.filter(r => r.text === deletedText).length;
          if (countBefore === 1) {
            expect(remainingTexts).not.toContain(deletedText);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('total example count is reduced by the deleted rule example count', () => {
      fc.assert(
        fc.property(arbitraryMapData(), (data) => {
          const rules = data.stories[0].rules;
          const ri = Math.floor(Math.random() * rules.length);
          const deletedExampleCount = rules[ri].examples.length;
          const totalExamplesBefore = rules.reduce((sum, r) => sum + r.examples.length, 0);
          const result = deleteRule(data, ri);
          const totalExamplesAfter = result.stories[0].rules.reduce((sum, r) => sum + r.examples.length, 0);
          expect(totalExamplesAfter).toBe(totalExamplesBefore - deletedExampleCount);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: deleteExample removes exactly the targeted example, siblings unchanged
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 2: deleteExample removes exactly the targeted example, siblings unchanged', () => {
    const arbitraryMapWithExamples = () =>
      arbitraryMapData().filter(data =>
        data.stories[0].rules.some(r => r.examples.length > 0)
      );

    it('targeted rule has exactly originalExamples.length - 1 examples after deletion', () => {
      fc.assert(
        fc.property(arbitraryMapWithExamples(), (data) => {
          const rules = data.stories[0].rules;
          const rulesWithExamples = rules
            .map((r, i) => ({ rule: r, index: i }))
            .filter(({ rule }) => rule.examples.length > 0);
          const { rule, index: ri } = rulesWithExamples[Math.floor(Math.random() * rulesWithExamples.length)];
          const ei = Math.floor(Math.random() * rule.examples.length);
          const originalExampleCount = rule.examples.length;
          const result = deleteExample(data, ri, ei);
          expect(result.stories[0].rules[ri].examples.length).toBe(originalExampleCount - 1);
        }),
        { numRuns: 100 }
      );
    });

    it('deleted example text is not in the remaining examples (when unique)', () => {
      fc.assert(
        fc.property(arbitraryMapWithExamples(), (data) => {
          const rules = data.stories[0].rules;
          const rulesWithExamples = rules
            .map((r, i) => ({ rule: r, index: i }))
            .filter(({ rule }) => rule.examples.length > 0);
          const { rule, index: ri } = rulesWithExamples[Math.floor(Math.random() * rulesWithExamples.length)];
          const ei = Math.floor(Math.random() * rule.examples.length);
          const deletedText = rule.examples[ei].text;
          const countBefore = rule.examples.filter(e => e.text === deletedText).length;
          const result = deleteExample(data, ri, ei);
          const remainingTexts = result.stories[0].rules[ri].examples.map(e => e.text);
          if (countBefore === 1) {
            expect(remainingTexts).not.toContain(deletedText);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('other rules examples are completely unchanged', () => {
      fc.assert(
        fc.property(arbitraryMapWithExamples(), (data) => {
          const rules = data.stories[0].rules;
          const rulesWithExamples = rules
            .map((r, i) => ({ rule: r, index: i }))
            .filter(({ rule }) => rule.examples.length > 0);
          const { index: ri } = rulesWithExamples[Math.floor(Math.random() * rulesWithExamples.length)];
          const ei = Math.floor(Math.random() * rules[ri].examples.length);
          const result = deleteExample(data, ri, ei);

          // Check all other rules are unchanged
          for (let i = 0; i < result.stories[0].rules.length; i++) {
            if (i < ri) {
              expect(result.stories[0].rules[i].examples.length).toBe(rules[i].examples.length);
              expect(result.stories[0].rules[i].examples.map(e => e.text)).toEqual(rules[i].examples.map(e => e.text));
            } else if (i >= ri) {
              // After the targeted rule index, compare to i (since no rules were removed)
              expect(result.stories[0].rules[i].examples.length).toBe(
                i === ri ? rules[i].examples.length - 1 : rules[i].examples.length
              );
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: deleteQuestion removes exactly the targeted question, siblings unchanged
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 3: deleteQuestion removes exactly the targeted question, siblings unchanged', () => {
    const arbitraryMapWithQuestions = () =>
      arbitraryMapData().filter(data => data.stories[0].questions.length > 0);

    it('result has exactly originalQuestions.length - 1 questions', () => {
      fc.assert(
        fc.property(arbitraryMapWithQuestions(), (data) => {
          const questions = data.stories[0].questions;
          const qi = Math.floor(Math.random() * questions.length);
          const result = deleteQuestion(data, qi);
          expect(result.stories[0].questions.length).toBe(questions.length - 1);
        }),
        { numRuns: 100 }
      );
    });

    it('deleted question text is not in the remaining questions (when unique)', () => {
      fc.assert(
        fc.property(arbitraryMapWithQuestions(), (data) => {
          const questions = data.stories[0].questions;
          const qi = Math.floor(Math.random() * questions.length);
          const deletedText = questions[qi].text;
          const countBefore = questions.filter(q => q.text === deletedText).length;
          const result = deleteQuestion(data, qi);
          const remainingTexts = result.stories[0].questions.map(q => q.text);
          if (countBefore === 1) {
            expect(remainingTexts).not.toContain(deletedText);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: After any deletion, remaining items have sequential order values 0..N-1
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  describe('Property 4: After any deletion, remaining items have sequential order values 0..N-1', () => {
    it('after deleteRule, all remaining rules have order === their index', () => {
      fc.assert(
        fc.property(arbitraryMapData(), (data) => {
          const rules = data.stories[0].rules;
          const ri = Math.floor(Math.random() * rules.length);
          const result = deleteRule(data, ri);
          result.stories[0].rules.forEach((rule, index) => {
            expect(rule.order).toBe(index);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('after deleteExample, all remaining examples in that rule have order === their index', () => {
      const arbitraryMapWithExamples = () =>
        arbitraryMapData().filter(data =>
          data.stories[0].rules.some(r => r.examples.length > 0)
        );

      fc.assert(
        fc.property(arbitraryMapWithExamples(), (data) => {
          const rules = data.stories[0].rules;
          const rulesWithExamples = rules
            .map((r, i) => ({ rule: r, index: i }))
            .filter(({ rule }) => rule.examples.length > 0);
          const { index: ri } = rulesWithExamples[Math.floor(Math.random() * rulesWithExamples.length)];
          const ei = Math.floor(Math.random() * rules[ri].examples.length);
          const result = deleteExample(data, ri, ei);
          result.stories[0].rules[ri].examples.forEach((ex, index) => {
            expect(ex.order).toBe(index);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('after deleteQuestion, all remaining questions have order === their index', () => {
      const arbitraryMapWithQuestions = () =>
        arbitraryMapData().filter(data => data.stories[0].questions.length > 0);

      fc.assert(
        fc.property(arbitraryMapWithQuestions(), (data) => {
          const questions = data.stories[0].questions;
          const qi = Math.floor(Math.random() * questions.length);
          const result = deleteQuestion(data, qi);
          result.stories[0].questions.forEach((q, index) => {
            expect(q.order).toBe(index);
          });
        }),
        { numRuns: 100 }
      );
    });
  });
});
