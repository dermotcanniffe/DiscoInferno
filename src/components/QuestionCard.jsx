// src/components/QuestionCard.jsx
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { CardContent } from "@/components/ui/card"; // Adjust path if needed
import { Textarea } from "@/components/ui/textarea";    // Adjust path if needed
import { Button } from "@/components/ui/button";

// Props:
// - questionData: The specific question object { text, order, ... }
// - questionIndex: The index 'i' of this question within its story's questions array
// - storyIndex: The index of the parent story (currently 0)
// - onUpdateText: Function to call when text should be saved to main state
function QuestionCard({ questionData, questionIndex, storyIndex, onUpdateText, onDeleteQuestion }) {
    // Local state for the textarea value
    const [localText, setLocalText] = useState(questionData?.text ?? '');

    // Effect to sync local state if the prop changes from outside
    useEffect(() => {
        setLocalText(questionData?.text ?? '');
    }, [questionData?.text]);

    // Handler for when the textarea loses focus (onBlur)
    const handleBlur = () => {
        // Only call the update function if the text actually changed
        if (localText !== (questionData?.text ?? '')) {
            console.log(`QuestionCard onBlur: Updating text for story ${storyIndex}, question ${questionIndex}`);
            // Call the prop function to update the main state via updateField
            onUpdateText(storyIndex, questionIndex, localText);
        }
    };

    return (
        <CardContent> {/* Or appropriate wrapper */}
            <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-sm">Question</label>
                {onDeleteQuestion && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteQuestion(questionIndex)}
                        aria-label={`Delete question: ${questionData?.text || 'Untitled question'}`}
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Textarea
                className="bg-transparent"
                value={localText} // Bind to local state
                onChange={(e) => setLocalText(e.target.value)} // Update local state only
                onBlur={handleBlur} // Update parent state on blur
            />
        </CardContent>
    );
}

export default QuestionCard;
