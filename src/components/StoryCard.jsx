// src/components/StoryCard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"; // Adjust path
import { Textarea } from "@/components/ui/textarea";    // Adjust path

// Props:
// - storyData: The specific story object { text, order, ... }
// - storyIndex: The index of this story
// - onUpdateText: Function to call to update main state on blur
function StoryCard({ storyData, storyIndex, onUpdateText }) {
    // Local state for the textarea value
    const [localText, setLocalText] = useState(storyData?.text ?? '');

    // Effect to sync local state if the prop changes from outside
    useEffect(() => {
        setLocalText(storyData?.text ?? '');
    }, [storyData?.text]);

    // Handler for when the textarea loses focus (onBlur)
    const handleBlur = () => {
        if (localText !== (storyData?.text ?? '')) {
            console.log(`StoryCard onBlur: Updating text for story ${storyIndex}`);
            onUpdateText(storyIndex, localText); // Pass index and new text
        }
    };

    return (
        // Use the same styling as before for consistency
        <div className="flex justify-center mb-4">
            <Card className="bg-yellow-100 shadow-lg w-full max-w-md">
                <CardContent>
                    <label className="font-bold block mb-2">Story #{storyIndex + 1}</label>
                    <Textarea
                        className="bg-transparent"
                        value={localText} // Use local state
                        onChange={(e) => setLocalText(e.target.value)} // Update local state
                        onBlur={handleBlur} // Update parent state on blur
                    />
                     {/* TODO: Add Delete Story Button here later? */}
                </CardContent>
            </Card>
        </div>
    );
}

export default StoryCard;
