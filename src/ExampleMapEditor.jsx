// core-ui/ExampleMapEditor.jsx
// Pure UI logic — no Spira dependencies
// Accepts props: `data`, `onChange`, `onSave`

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ExampleMapEditor({ data, onChange, onSave }) {
  const updateField = (path, value) => {
    const clone = structuredClone(data);
    const keys = path.split(".");
    let obj = clone;
    keys.slice(0, -1).forEach((key) => (obj = obj[key]));
    obj[keys[keys.length - 1]] = value;
    onChange(clone);
  };

  const updateStoryText = (text) => updateField("story.text", text);
  const addRule = () => {
    const rules = [...data.story.rules, { text: "", examples: [] }];
    onChange({ ...data, story: { ...data.story, rules } });
  };
  const addExample = (ri) => {
    const rules = [...data.story.rules];
    rules[ri].examples.push({ text: "" });
    onChange({ ...data, story: { ...data.story, rules } });
  };
  const addQuestion = () => {
    const questions = [...data.questions, { text: "" }];
    onChange({ ...data, questions });
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="bg-yellow-100">
        <CardContent>
          <label className="font-bold">Story (Yellow)</label>
          <Textarea
            value={data.story.text}
            onChange={(e) => updateStoryText(e.target.value)}
          />
        </CardContent>
      </Card>

      {data.story.rules.map((rule, ri) => (
        <div key={ri} className="space-y-2">
          <Card className="bg-blue-100">
            <CardContent>
              <label className="font-bold">Rule (Blue)</label>
              <Textarea
                value={rule.text}
                onChange={(e) => updateField(`story.rules.${ri}.text`, e.target.value)}
              />
              <Button onClick={() => addExample(ri)} className="mt-2">
                + Add Example
              </Button>
            </CardContent>
          </Card>
          {rule.examples.map((ex, ei) => (
            <Card key={ei} className="ml-4 bg-green-100">
              <CardContent>
                <label className="font-bold">Example (Green)</label>
                <Textarea
                  value={ex.text}
                  onChange={(e) =>
                    updateField(`story.rules.${ri}.examples.${ei}.text`, e.target.value)
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <Button onClick={addRule}>+ Add Rule</Button>

      <div className="pt-4">
        <label className="font-bold">Questions (Red)</label>
        {data.questions.map((q, i) => (
          <Card key={i} className="bg-red-100 mt-2">
            <CardContent>
              <Textarea
                value={q.text}
                onChange={(e) => updateField(`questions.${i}.text`, e.target.value)}
              />
            </CardContent>
          </Card>
        ))}
        <Button onClick={addQuestion} className="mt-2">
          + Add Question
        </Button>
      </div>

      <div className="pt-4">
        <Button onClick={onSave} className="w-full">
          Save
        </Button>
      </div>
    </div>
  );
}

