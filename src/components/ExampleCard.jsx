// src/components/ExampleCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Props:
// - exampleData: The specific example object { text, order, ... }
// - exampleIndex: The index 'ei' of this example
// - ruleIndex: The index 'ri' of the parent rule
// - storyIndex: The index of the parent story (currently 0)
// - onUpdateText: Function to call to update main state
// - registerRef: Function to pass the textarea ref up for focusing (optional)
function ExampleCard({ exampleData, exampleIndex, ruleIndex, storyIndex, onUpdateText, registerRef, onDeleteExample }) {
    const [localText, setLocalText] = useState(exampleData?.text ?? '');
    const textareaRef = useRef(null); // Ref for the textarea element

    useEffect(() => {
        setLocalText(exampleData?.text ?? '');
    }, [exampleData?.text]);

    // Register the ref with the parent component if registerRef is provided
     useEffect(() => {
        if (registerRef && textareaRef.current) {
             // Construct the unique ID used in the parent's exampleRefs
            const exampleId = `ex-<span class="math-inline">\{storyIndex\}\-</span>{ruleIndex}-${exampleIndex}`;
            registerRef(exampleId, textareaRef.current);
        }
        // Optional: Cleanup ref registration when component unmounts
         return () => {
             if (registerRef) {
                  const exampleId = `ex-<span class="math-inline">\{storyIndex\}\-</span>{ruleIndex}-${exampleIndex}`;
                  registerRef(exampleId, null); // De-register
             }
         };
    }, [registerRef, storyIndex, ruleIndex, exampleIndex]);


    const handleBlur = () => {
        if (localText !== (exampleData?.text ?? '')) {
            console.log(`ExampleCard onBlur: Updating text for story ${storyIndex}, rule ${ruleIndex}, example ${exampleIndex}`);
            onUpdateText(storyIndex, ruleIndex, exampleIndex, localText);
        }
    };

    return (
        <CardContent> {/* Or appropriate wrapper */}
            <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-sm">Example</label>
                {onDeleteExample && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteExample(ruleIndex, exampleIndex)}
                        aria-label={`Delete example: ${exampleData?.text || 'Untitled example'}`}
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Textarea
                ref={textareaRef} // Assign the ref to the textarea
                className="bg-transparent"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleBlur}
            />
        </CardContent>
    );
}

export default ExampleCard;
