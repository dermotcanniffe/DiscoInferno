// ExampleMapEditor.jsx — rolled back to working drag-and-drop with visible layout

import React, { useState, useEffect, useRef } from "react";
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
import RuleCard from './components/RuleCard';
import ExampleCard from './components/ExampleCard';
import QuestionCard from './components/QuestionCard';
import StoryCard from './components/StoryCard';
import ConfirmDeleteRuleDialog from './components/ConfirmDeleteRuleDialog';

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

  // update local state when data prop changes from outside
  // e.g. after loading or maybe after saving if IDs change
  useEffect(() => {
    if (lastAddedExample.current) {
      const ref = exampleRefs.current[lastAddedExample.current];
      if (ref?.focus) ref.focus();
      lastAddedExample.current = null;
    }
  }, [data]);
  const [localTitle, setLocalTitle] = useState(data?.title ?? '');
  const [localDescription, setLocalDescription] = useState(data?.description ?? '');
  const [pendingDeleteRuleIndex, setPendingDeleteRuleIndex] = useState(null);
  
  // Sync Effects for Title/Description
  useEffect(() => {
      setLocalTitle(data?.title ?? '');
  }, [data?.title]);
  
  useEffect(() => {
      setLocalDescription(data?.description ?? '');
  }, [data?.description]);
  
  // Handler for Title Update (onBlur)
  const handleTitleBlur = () => {
      if (localTitle !== (data?.title ?? '')) {
           console.log("Title input blurred, updating parent state.");
           updateField('title', localTitle);
      }
  };
  // Handler for Description Update (onBlur)
  const handleDescriptionBlur = () => {
      if (localDescription !== (data?.description ?? '')) {
           console.log("Description input blurred, updating parent state.");
           updateField('description', localDescription);
      }
  };
  
  // Handler for Story Text Update (needed if we use StoryCard component)
  const handleStoryTextUpdate = (storyIndex, newText) => {
      const path = `stories.${storyIndex}.text`;
      console.log(`handleStoryTextUpdate: Calling updateField for path: ${path}`);
      updateField(path, newText);
  };
  
  // Add local state for Story text ---
  const [localStoryText, setLocalStoryText] = useState(data.stories?.[0]?.text ?? '');

  // --- ADD the NEW useEffect for syncing localStoryText ---
  useEffect(() => {
    // Sync local state if the text prop changes from parent
    setLocalStoryText(data.stories?.[0]?.text ?? '');
  }, [data.stories?.[0]?.text]); // Depend only on the relevant text prop
  // --- End NEW useEffect ---

  // REPLACE your current updateField with this complete version:
  const updateField = (path, value) => {
    console.log(`--- updateField ---`); // Mark start
    console.log(`Path received: ${path}`);
    console.log(`Value received: ${value}`);

    // Check if data exists before cloning
    if (!data) {
      console.error("updateField Error: 'data' is null or undefined at the start.");
      return;
    }

    const clone = structuredClone(data);
    // console.log("Cloned data (before update):", JSON.stringify(clone, null, 2)); // Uncomment to log initial state if needed

    try {
      const keys = path.split(".");
      let current = clone; // Start traversal from the cloned root
      let traversalLog = 'clone'; // For debugging paths

      // Navigate down the path to the second-to-last key
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        traversalLog += `.${key}`;
        // console.log(`Traversing to key: ${key}`); // Optional log

        // Check if current level is valid before accessing the key
        if (typeof current !== 'object' || current === null) {
          console.error(`Error: Cannot access key '${key}' because parent path '${traversalLog.substring(0, traversalLog.lastIndexOf('.')) || 'clone'}' is not an object/array:`, current);
          return;
        }

        // Handle array index vs object property
        if (/^\d+$/.test(key) && Array.isArray(current)) {
          const index = parseInt(key, 10);
          // console.log(`  Accessing array index: ${index}`); // Optional log
          current = current[index];
        } else {
          // console.log(`  Accessing object property: ${key}`); // Optional log
          current = current[key];
        }

        // Check if the result of accessing the key is undefined/null
        if (current === undefined || current === null) {
          console.error(`  Error: Path segment '${key}' in '${path}' resulted in undefined/null value.`);
          console.error(`  Traversal path so far: ${traversalLog}`);
          console.error(`  Parent object/array was:`, (i > 0 && keys[i - 1]) ? keys[i - 1] : 'clone root'); // Log parent context
          return; // Stop execution
        }
        // console.log(`  Current object/value at this level:`, current); // Optional log
      }

      // 'current' should now hold the object/array we want to modify

      const finalKey = keys[keys.length - 1];
      console.log(`Attempting to set final key '${finalKey}' on target object/array:`, current);

      // Safety check before final assignment
      if (typeof current !== 'object' || current === null) {
        console.error(`Error: Cannot set property '${finalKey}'. Target is not a valid object/array:`, current);
        console.error(`  Check the data structure and the path: ${path}`);
        console.error(`  Full traversal path was: ${traversalLog}`);
        return; // Stop execution
      }

      console.log(`Setting key '${finalKey}' to value:`, value);
      // Set the value on the final key
      current[finalKey] = value;


      console.log("Cloned data (AFTER update):", JSON.stringify(clone, null, 2)); // Log final clone
      console.log("Calling onChange prop with updated clone...");
      onChange(clone); // Call parent's state update function
      console.log("--- updateField finished ---");

    } catch (error) {
      console.error("!!! Critical Error in updateField !!!", error);
      console.error("Path:", path, "Value:", value);
    }
  };

  const updateStoryText = (text) => updateField("story.text", text);
  // --- Add Handler for Rule Text Update ---
  const handleRuleTextUpdate = (storyIndex, ruleIndex, newText) => {
    const path = `stories.${storyIndex}.rules.${ruleIndex}.text`;
    console.log(`handleRuleTextUpdate: Calling updateField for path: ${path}`);
    updateField(path, newText);
  };
  // --- End Handler ---

  // --- Add Handler for Example Text Update ---
  const handleExampleTextUpdate = (storyIndex, ruleIndex, exampleIndex, newText) => {
    const path = `stories.${storyIndex}.rules.${ruleIndex}.examples.${exampleIndex}.text`; 
    console.log(`handleExampleTextUpdate: Calling updateField for path: ${path}`);
    updateField(path, newText);
  };
  // --- End Handler ---
  const registerExampleRef = (id, element) => {
    // Store or remove the reference to the textarea element
    // using the unique ID (e.g., "ex-0-0-1")
    if (element) {
      exampleRefs.current[id] = element; // Add/update ref in the store
    } else {
      // Remove ref if element is null (e.g., component unmounted)
      delete exampleRefs.current[id];
    }
    // Optional: log the refs for debugging
    // console.log("Updated exampleRefs:", exampleRefs.current);
  };
  // --- END FUNCTION DEFINITION ---

  // --- Add Handler for Question Text Update ---
  const handleQuestionTextUpdate = (storyIndex, questionIndex, newText) => {
    const path = `stories.${storyIndex}.questions.${questionIndex}.text`;
    console.log(`handleQuestionTextUpdate: Calling updateField for path: ${path}`);
    updateField(path, newText);
  };
  // --- End Handler ---

  // REPLACE your existing addRule function with this:
  const addRule = () => {
    // Ensure data and stories[0] exist before proceeding
    if (!data?.stories?.[0]) {
      console.error("Cannot add rule: No story found at stories[0].");
      return;
    }
    const storyIndex = 0; // Target the first story
    const clonedData = structuredClone(data); // Clone the entire data object

    // Make sure the rules array exists on the target story
    if (!clonedData.stories[storyIndex].rules) {
      clonedData.stories[storyIndex].rules = [];
    }

    // Create the new rule with an order property
    const newRule = {
      text: "", // Default text
      order: clonedData.stories[storyIndex].rules.length, // Set order based on current length
      examples: [] // Start with empty examples
    };
    // --- Add Function to Register Refs from Child ---
    const registerExampleRef = (id, element) => {
      if (element) {
        exampleRefs.current[id] = element;
      } else {
        // Remove ref when component unmounts if needed
        delete exampleRefs.current[id];
      }
      // console.log("Updated exampleRefs:", exampleRefs.current); // For debugging refs
    };
    // --- End Ref Registration ---
    // Add the new rule to the cloned story's rules array
    clonedData.stories[storyIndex].rules.push(newRule);

    console.log("addRule: Updated data to be sent via onChange:", clonedData);
    onChange(clonedData); // Pass the entire modified data object back to App
  };

  // REPLACE your existing addExample function with this:
  const addExample = (ri) => { // ri is the rule index
    if (!data?.stories?.[0]?.rules?.[ri]) {
      console.error(`Cannot add example: No rule found at stories[0].rules[${ri}].`);
      return;
    }
    const storyIndex = 0;
    const clonedData = structuredClone(data);

    // Ensure the examples array exists on the target rule
    if (!clonedData.stories[storyIndex].rules[ri].examples) {
      clonedData.stories[storyIndex].rules[ri].examples = [];
    }
    const exampleIndex = clonedData.stories[storyIndex].rules[ri].examples.length; // Index is the new order
    const newExample = { text: "", order: exampleIndex };
    // Create the new example with an order property
    // const newExample = { text: "", order: clonedData.stories[storyIndex].rules[ri].examples.length };

    // Add the new example
    clonedData.stories[storyIndex].rules[ri].examples.push(newExample);

    // Construct the ID used in refs and track it
    const newExampleId = `ex-<span class="math-inline">\{storyIndex\}\-</span>{ri}-${exampleIndex}`;
    console.log("Adding example, setting lastAddedExample to:", newExampleId);
    lastAddedExample.current = newExampleId; // Track the ID of the item to focus

    console.log("addExample: Updated data to be sent via onChange:", clonedData);
    onChange(clonedData); // Pass the entire modified data object back to App
    // NOTE: Focus useEffect runs AFTER this render cycle completes
  };

  // REPLACE your existing addQuestion function with this:
  const addQuestion = () => {
    if (!data?.stories?.[0]) {
      console.error("Cannot add question: No story found at stories[0].");
      return;
    }
    const storyIndex = 0;
    const clonedData = structuredClone(data);

    // Ensure the questions array exists on the target story
    if (!clonedData.stories[storyIndex].questions) {
      clonedData.stories[storyIndex].questions = [];
    }

    // Create the new question with an order property
    const newQuestion = {
      text: "", // Default text
      order: clonedData.stories[storyIndex].questions.length // Set order
    };

    // Add the new question
    clonedData.stories[storyIndex].questions.push(newQuestion);

    console.log("addQuestion: Updated data to be sent via onChange:", clonedData);
    onChange(clonedData); // Pass the entire modified data object back to App
  };

  // --- Delete Handlers ---
  const deleteRule = (ri) => {
    if (!data?.stories?.[0]) return;
    const rules = data.stories[0].rules;
    if (!rules || ri < 0 || ri >= rules.length) return;
    const clonedData = structuredClone(data);
    clonedData.stories[0].rules.splice(ri, 1);
    clonedData.stories[0].rules.forEach((rule, index) => {
      rule.order = index;
    });
    onChange(clonedData);
  };

  const deleteExample = (ri, ei) => {
    if (!data?.stories?.[0]?.rules?.[ri]) return;
    const examples = data.stories[0].rules[ri].examples;
    if (!examples || ei < 0 || ei >= examples.length) return;
    const clonedData = structuredClone(data);
    clonedData.stories[0].rules[ri].examples.splice(ei, 1);
    clonedData.stories[0].rules[ri].examples.forEach((ex, index) => {
      ex.order = index;
    });
    onChange(clonedData);
  };

  const deleteQuestion = (qi) => {
    if (!data?.stories?.[0]) return;
    const questions = data.stories[0].questions;
    if (!questions || qi < 0 || qi >= questions.length) return;
    const clonedData = structuredClone(data);
    clonedData.stories[0].questions.splice(qi, 1);
    clonedData.stories[0].questions.forEach((q, index) => {
      q.order = index;
    });
    onChange(clonedData);
  };

  // --- Confirmation dialog state management ---
  const requestDeleteRule = (ri) => {
    setPendingDeleteRuleIndex(ri);
  };

  const confirmDeleteRule = () => {
    deleteRule(pendingDeleteRuleIndex);
    setPendingDeleteRuleIndex(null);
  };

  const cancelDeleteRule = () => {
    setPendingDeleteRuleIndex(null);
  };
  // --- End Delete Handlers ---

  // REPLACE your existing handleDragEnd function with this:
  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Exit if no drop target or item dropped on itself, or if no story exists
    if (!over || active.id === over.id || !data?.stories?.[0]) {
      console.log("Drag end condition not met or no story exists.");
      return;
    }

    console.log(`handleDragEnd: Active ID: ${active.id}, Over ID: ${over.id}`);

    const storyIndex = 0; // We are targeting the first story
    // Use a fresh clone for modification
    const clonedData = structuredClone(data);
    // Get a direct reference to the story object we will modify inside the clone
    const targetStory = clonedData.stories[storyIndex];

    // --- Reorder Rules ---
    const currentRules = targetStory.rules || []; // Use current rules from clone
    // Generate IDs based on current order for comparison
    const ruleIds = currentRules.map((_, i) => `rule-${i}`); // Match ID format used in DragWrapper

    if (ruleIds.includes(active.id) && ruleIds.includes(over.id)) {
      const oldIndex = ruleIds.indexOf(active.id);
      const newIndex = ruleIds.indexOf(over.id);

      if (oldIndex !== newIndex) {
        console.log(`Reordering rules from index ${oldIndex} to ${newIndex}`);
        // Perform reorder on the cloned story's rules
        targetStory.rules = arrayMove(currentRules, oldIndex, newIndex);
        // Update the 'order' property for each rule
        targetStory.rules.forEach((rule, index) => {
          rule.order = index;
        });
        console.log("Rule reorder complete. Calling onChange...");
        onChange(clonedData); // Update state
      }
      return; // Done handling rule drag
    }

    // --- Reorder Examples (within a specific Rule) ---
    // Need to check across all rules
    let exampleReordered = false;
    targetStory.rules?.forEach((rule, ri) => {
      // Skip if already reordered or if this rule has no examples
      if (exampleReordered || !rule.examples) return;

      const currentExamples = rule.examples;
      // Generate IDs based on current order for comparison
      const exampleIds = currentExamples.map((_, ei) => `ex-${ri}-${ei}`); // Match ID format

      if (exampleIds.includes(active.id) && exampleIds.includes(over.id)) {
        const oldIndex = exampleIds.indexOf(active.id);
        const newIndex = exampleIds.indexOf(over.id);

        if (oldIndex !== newIndex) {
          console.log(`Reordering examples in rule ${ri} from index ${oldIndex} to ${newIndex}`);
          // Perform reorder directly on the examples array within the cloned rule
          const reorderedExamples = arrayMove(currentExamples, oldIndex, newIndex);
          // Update the 'order' property for each example
          reorderedExamples.forEach((ex, index) => {
            ex.order = index;
          });
          // Assign the reordered array back to the cloned rule
          targetStory.rules[ri].examples = reorderedExamples;

          console.log("Example reorder complete. Calling onChange...");
          onChange(clonedData); // Update state
          exampleReordered = true; // Flag that we are done
        }
      }
    });
    if (exampleReordered) return; // Done handling example drag


    // --- Reorder Questions (within the Story) ---
    const currentQuestions = targetStory.questions || []; // Use current questions from clone
    // Generate IDs based on current order for comparison
    const questionIds = currentQuestions.map((_, i) => `q-${storyIndex}-${i}`); // Match ID format

    if (questionIds.includes(active.id) && questionIds.includes(over.id)) {
      const oldIndex = questionIds.indexOf(active.id);
      const newIndex = questionIds.indexOf(over.id);

      if (oldIndex !== newIndex) {
        console.log(`Reordering questions from index ${oldIndex} to ${newIndex}`);
        // Perform reorder on the cloned story's questions
        targetStory.questions = arrayMove(currentQuestions, oldIndex, newIndex);
        // Update the 'order' property for each question
        targetStory.questions.forEach((q, index) => {
          q.order = index;
        });
        console.log("Question reorder complete. Calling onChange...");
        onChange(clonedData); // Update state
      }
      return; // Done handling question drag
    }

    console.log("handleDragEnd: No draggable type matched or indices were the same.");
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="p-6 space-y-6 bg-neutral-50 min-h-screen">

             {/* === Title and Description Card === */}
             <div className="flex justify-center mb-4"> {/* Added mb-4 */}
                 <Card className="bg-white shadow-lg w-full max-w-2xl">
                     <CardContent className="p-4 space-y-2">
                         <div>
                             <label htmlFor="map-title" className="font-bold block mb-1 text-sm text-gray-700">Map Title</label>
                             <input
                                 id="map-title"
                                 type="text"
                                 placeholder="Enter map title..."
                                 className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                 value={localTitle} // Use local state
                                 onChange={(e) => setLocalTitle(e.target.value)} // Update local state
                                 onBlur={handleTitleBlur} // Update parent on blur
                             />
                         </div>
                         <div>
                             <label htmlFor="map-description" className="font-bold block mb-1 text-sm text-gray-700">Description</label>
                             <Textarea
                                 id="map-description"
                                 placeholder="Enter optional description..."
                                 className="bg-transparent"
                                 value={localDescription} // Use local state
                                 onChange={(e) => setLocalDescription(e.target.value)} // Update local state
                                 onBlur={handleDescriptionBlur} // Update parent on blur
                                 rows={2}
                             />
                         </div>
                     </CardContent>
                 </Card>
             </div>
             {/* === End Title/Description Card === */}


             {/* === Story Section (Render first story using StoryCard) === */}
             {/* Check if stories exist before trying to render */}
             {data?.stories && data.stories.length > 0 && (
                 <StoryCard
                     storyData={data.stories[0]} // Pass first story data
                     storyIndex={0}             // Pass index 0
                     onUpdateText={handleStoryTextUpdate} // Pass handler
                 />
             )}
             {/* === End Story Section === */}



        <div className="flex justify-center">
          <div className="flex gap-6">
            <SortableContext
              items={(data.stories?.[0]?.rules ?? []).map((_, i) => `rule-${i}`)}
              strategy={rectSortingStrategy}
            >
              {/* --- 3. Modify Rule Rendering Loop --- */}
              {(data.stories?.[0]?.rules ?? []).map((rule, ri) => (
                <div key={`rule-group-${ri}`} className="flex flex-col gap-4">
                  <DragWrapper id={`rule-${ri}`} color="blue">
                    {/* Render RuleCard instead of Textarea directly */}
                    <RuleCard
                      ruleData={rule}
                      ruleIndex={ri}
                      storyIndex={0} // Assuming first story for now
                      onUpdateText={handleRuleTextUpdate}
                      onAddExample={addExample} // Pass addExample handler
                      onDeleteRule={requestDeleteRule}
                    />
                    {/* Remove the old Rule Label, Textarea, Button from here */}
                  </DragWrapper>

                  {/* --- Examples Rendering Loop --- */}
                  <div className="pl-4 flex flex-col gap-3">
                    <SortableContext
                      items={(rule.examples ?? []).map((_, ei) => `ex-${ri}-${ei}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {(rule.examples ?? []).map((ex, ei) => (
                        <DragWrapper key={`ex-${ri}-${ei}`} id={`ex-${ri}-${ei}`} color="green">
                          <ExampleCard
                            exampleData={ex}
                            exampleIndex={ei}
                            ruleIndex={ri}
                            storyIndex={0} // Assuming first story
                            onUpdateText={handleExampleTextUpdate}
                            registerRef={registerExampleRef} // Pass ref registration function
                            onDeleteExample={deleteExample}
                          />
                        </DragWrapper>
                      ))}
                    </SortableContext>
                  </div>
                  {/* --- End Examples Rendering --- */}

                </div>
              ))}
              {/* --- End Rule Rendering Loop --- */}
            </SortableContext>
          </div>
          <div className="flex items-start">
            <Button onClick={addRule}>+ Add Rule</Button>
          </div>
        </div>


        <div className="pt-6">
          <label className="font-bold block mb-2">Questions</label>
          <div className="flex gap-4 flex-wrap items-start">
            <SortableContext
              // Replace: items={data.questions.map((_, i) => `q-${i}`)}
              // With: Safely access questions from the first story
              items={(data.stories?.[0]?.questions ?? []).map((_, i) => `q-0-${i}`)} // Note: Adjusted ID format q-storyIndex-questionIndex
              strategy={rectSortingStrategy}
            >
              {/* Replace: data.questions.map((q, i) => ( */}
              {/* With: Safely access questions from the first story */}
              {(data.stories?.[0]?.questions ?? []).map((q, i) => (
                <DragWrapper key={`q-0-${i}`} id={`q-0-${i}`} color="red"> {/* Adjusted key/id */}
                  <QuestionCard
                    questionData={q}
                    questionIndex={i}
                    storyIndex={0} // Assuming first story
                    onUpdateText={handleQuestionTextUpdate}
                    onDeleteQuestion={deleteQuestion}
                  />
                </DragWrapper>
              ))}
            </SortableContext>
            <div className="flex items-start">
              <Button onClick={addQuestion}>+ Add Question</Button>
            </div>


            {/* --- Add New Story Button (For later) --- */}
            {/* <div className="pt-6 text-center"> ... </div> */}

            {/* --- Save Button --- */}
            <div className="pt-6">
              <Button onClick={onSave} className="w-full">
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDeleteRuleDialog
        open={pendingDeleteRuleIndex !== null}
        onConfirm={confirmDeleteRule}
        onCancel={cancelDeleteRule}
        ruleText={pendingDeleteRuleIndex !== null ? (data?.stories?.[0]?.rules?.[pendingDeleteRuleIndex]?.text || '') : ''}
      />
    </DndContext>
  );
}
