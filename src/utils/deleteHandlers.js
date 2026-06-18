/**
 * Pure delete handler functions for Example Map data.
 * These operate on plain objects and return new state — no React dependencies.
 */

export function deleteRule(data, ri) {
  if (!data?.stories?.[0]) return data;
  const rules = data.stories[0].rules;
  if (!rules || ri < 0 || ri >= rules.length) return data;
  const clonedData = structuredClone(data);
  clonedData.stories[0].rules.splice(ri, 1);
  clonedData.stories[0].rules.forEach((rule, index) => { rule.order = index; });
  return clonedData;
}

export function deleteExample(data, ri, ei) {
  if (!data?.stories?.[0]?.rules?.[ri]) return data;
  const examples = data.stories[0].rules[ri].examples;
  if (!examples || ei < 0 || ei >= examples.length) return data;
  const clonedData = structuredClone(data);
  clonedData.stories[0].rules[ri].examples.splice(ei, 1);
  clonedData.stories[0].rules[ri].examples.forEach((ex, index) => { ex.order = index; });
  return clonedData;
}

export function deleteQuestion(data, qi) {
  if (!data?.stories?.[0]) return data;
  const questions = data.stories[0].questions;
  if (!questions || qi < 0 || qi >= questions.length) return data;
  const clonedData = structuredClone(data);
  clonedData.stories[0].questions.splice(qi, 1);
  clonedData.stories[0].questions.forEach((q, index) => { q.order = index; });
  return clonedData;
}
