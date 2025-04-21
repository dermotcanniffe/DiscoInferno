// src/components/RuleCard.jsx
import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card"; // Assuming path
import { Textarea } from "@/components/ui/textarea";    // Assuming path
import { Button } from "@/components/ui/button";      // Assuming path

// Props:
// - ruleData: The specific rule object { text, order, examples, ... }
// - ruleIndex: The index 'ri' of this rule within its story's rules array
// - storyIndex: The index of the parent story (currently always 0)
// - onUpdateText: Function to call when text should be saved to main state
// - onAddExample: Function to call to add an example to this rule
function RuleCard({ ruleData, ruleIndex, storyIndex, onUpdateText, onAddExample }) {
    // Local state for the textarea value
    const [localText, setLocalText] = useState(ruleData?.text ?? '');

    // Effect to sync local state if the prop changes from outside
    useEffect(() => {
        setLocalText(ruleData?.text ?? '');
    }, [ruleData?.text]);

    // Handler for when the textarea loses focus (onBlur)
    const handleBlur = () => {
        // Only call the update function if the text actually changed
        if (localText !== (ruleData?.text ?? '')) {
            console.log(`RuleCard onBlur: Updating text for story ${storyIndex}, rule ${ruleIndex}`);
            // Call the prop function to update the main state via updateField
            onUpdateText(storyIndex, ruleIndex, localText);
        }
    };

    return (
        <CardContent> {/* Or appropriate wrapper */}
            <label className="font-bold block mb-2">Rule</label>
            <Textarea
                className="bg-transparent"
                value={localText} // Bind to local state
                onChange={(e) => setLocalText(e.target.value)} // Update local state only
                onBlur={handleBlur} // Update parent state on blur
                // Add other necessary props like placeholder if needed
            />
            <Button onClick={() => onAddExample(ruleIndex)} className="w-full mt-2">
                + Example
            </Button>
            {/* We will render examples associated with this rule here later or pass them down */}
        </CardContent>
    );
}

export default RuleCard;
