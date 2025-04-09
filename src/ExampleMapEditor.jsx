// ExampleMapEditor.jsx — rolled back to working drag-and-drop with visible layout

import React, { useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function DragWrapper({ id, children, color, width = "w-48" }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const cardClass = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    red: "bg-red-100"
  }[color] || "bg-gray-100";

  const handleClass = {
    blue: "bg-blue-300 text-blue-900",
    green: "bg-green-300 text-green-900",
    red: "bg-red-300 text-red-900"
  }[color] || "bg-gray-300 text-gray-900";

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col items-center gap-2">
      <Card className={`shadow-lg ${width} ${cardClass}`}>
        <div
          className={`text-xs text-right rounded-t px-2 py-1 cursor-grab ${handleClass}`}
          {...attributes}
          {...listeners}
        >
          ⠿
        </div>
        <CardContent className={cardClass}>{children}</CardContent>
      </Card>
    </div>
  );
}

export default function ExampleMapEditor({ data, onChange, onSave }) {
  const sensors = useSensors(useSensor(PointerSensor));
  const exampleRefs = useRef({});
  const lastAddedExample = useRef(null);

  useEffect(() => {
    if (lastAddedExample.current) {
      const ref = exampleRefs.current[lastAddedExample.current];
      if (ref?.focus) ref.focus();
      lastAddedExample.current = null;
    }
  }, [data]);

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
    const newExampleIndex = rules[ri].examples.length;
    const newExampleId = `ex-${ri}-${newExampleIndex}`;
    rules[ri].examples.push({ text: "" });
    lastAddedExample.current = newExampleId;
    onChange({ ...data, story: { ...data.story, rules } });
  };

  const addQuestion = () => {
    const questions = [...data.questions, { text: "" }];
    onChange({ ...data, questions });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ruleIds = data.story.rules.map((_, i) => `rule-${i}`);
    if (ruleIds.includes(active.id) && ruleIds.includes(over.id)) {
      const oldIndex = ruleIds.indexOf(active.id);
      const newIndex = ruleIds.indexOf(over.id);
      const reordered = arrayMove(data.story.rules, oldIndex, newIndex);
      onChange({ ...data, story: { ...data.story, rules: reordered } });
      return;
    }

    data.story.rules.forEach((rule, ri) => {
      const exampleIds = rule.examples.map((_, ei) => `ex-${ri}-${ei}`);
      if (exampleIds.includes(active.id) && exampleIds.includes(over.id)) {
        const oldIndex = exampleIds.indexOf(active.id);
        const newIndex = exampleIds.indexOf(over.id);
        const reordered = arrayMove(rule.examples, oldIndex, newIndex);
        const updatedRules = [...data.story.rules];
        updatedRules[ri].examples = reordered;
        onChange({ ...data, story: { ...data.story, rules: updatedRules } });
      }
    });

    const questionIds = data.questions.map((_, i) => `q-${i}`);
    if (questionIds.includes(active.id) && questionIds.includes(over.id)) {
      const oldIndex = questionIds.indexOf(active.id);
      const newIndex = questionIds.indexOf(over.id);
      const reordered = arrayMove(data.questions, oldIndex, newIndex);
      onChange({ ...data, questions: reordered });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">
        <div className="flex justify-center">
          <Card className="bg-yellow-100 shadow-lg w-64">
            <CardContent>
              <label className="font-bold block mb-2">Story</label>
              <Textarea
                className="bg-transparent"
                value={data.story.text}
                onChange={(e) => updateStoryText(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <div className="flex gap-6">
            <SortableContext
              items={data.story.rules.map((_, i) => `rule-${i}`)}
              strategy={rectSortingStrategy}
            >
              {data.story.rules.map((rule, ri) => (
                <div key={`rule-group-${ri}`} className="flex flex-col gap-4">
                  <DragWrapper id={`rule-${ri}`} color="blue">
                    <CardContent>
                      <label className="font-bold block mb-2">Rule</label>
                      <Textarea
                        className="bg-transparent"
                        value={rule.text}
                        onChange={(e) => updateField(`story.rules.${ri}.text`, e.target.value)}
                      />
                      <Button onClick={() => addExample(ri)} className="w-full mt-2">
                        + Example
                      </Button>
                    </CardContent>
                  </DragWrapper>

                  <div className="pl-4 flex flex-col gap-3">
                    <SortableContext
                      items={rule.examples.map((_, ei) => `ex-${ri}-${ei}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {rule.examples.map((ex, ei) => (
                        <DragWrapper key={`ex-${ri}-${ei}`} id={`ex-${ri}-${ei}`} color="green">
                          <CardContent>
                            <label className="font-bold block mb-1 text-sm">Example</label>
                            <Textarea
                              className="bg-transparent"
                              value={ex.text}
                              onChange={(e) =>
                                updateField(`story.rules.${ri}.examples.${ei}.text`, e.target.value)
                              }
                              ref={(el) => (exampleRefs.current[`ex-${ri}-${ei}`] = el)}
                            />
                          </CardContent>
                        </DragWrapper>
                      ))}
                    </SortableContext>
                  </div>
                </div>
              ))}
            </SortableContext>

            <div className="flex items-start">
              <Button onClick={addRule}>+ Add Rule</Button>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <label className="font-bold block mb-2">Questions</label>
          <div className="flex gap-4 flex-wrap items-start">
            <SortableContext
              items={data.questions.map((_, i) => `q-${i}`)}
              strategy={rectSortingStrategy}
            >
              {data.questions.map((q, i) => (
                <DragWrapper key={`q-${i}`} id={`q-${i}`} color="red">
                  <CardContent>
                    <label className="font-bold block mb-1 text-sm">Question</label>
                    <Textarea
                      className="bg-transparent"
                      value={q.text}
                      onChange={(e) => updateField(`questions.${i}.text`, e.target.value)}
                    />
                  </CardContent>
                </DragWrapper>
              ))}
            </SortableContext>
            <div className="flex items-start">
              <Button onClick={addQuestion}>+ Add Question</Button>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <Button onClick={onSave} className="w-full">
            Save
          </Button>
        </div>
      </div>
    </DndContext>
  );
}
