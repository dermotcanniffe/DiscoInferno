// src/components/linking/ExternalItemSearch.jsx

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Added Label for clarity
import { useToast } from "@/hooks/use-toast"; // Use toast for errors maybe

// Define expected props (using comments for JS)
// interface ExternalItemSearchProps {
//   pluginId: string;         // e.g., "spira"
//   itemType: string;       // e.g., "exampleMap"
//   itemId: string;         // ID of the map being linked
//   itemData: object;       // Should contain { spiraProductId: number, ... } for Spira
//   // onItemSelected: (item: SearchResultItem) => void; // Callback for later
// }

export function ExternalItemSearch({ pluginId, itemType, itemId, itemData }) {
    const [inputValue, setInputValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]); // State for results (for later)
    const [searchError, setSearchError] = useState(null);
    const { token } = useAuth();
    const { toast } = useToast();

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setSearchError(null); // Clear error when typing
    };

    const triggerSearch = useCallback(async () => {
        // Basic validation
        if (!inputValue || inputValue.trim().length < 2) {
            toast({ title: "Search", description: "Please enter at least 2 characters.", variant: "destructive" });
            setSearchResults([]);
            return;
        }
        if (!token || !pluginId || !itemType || !itemId) {
             console.error("Search prerequisites missing (token, pluginId, item context)");
             setSearchError("Cannot perform search due to missing context or auth.");
             return;
        }
         // Specific check for Spira Product ID in context data
         if (pluginId === 'spira' && !itemData?.spiraProductId) {
             console.error("Missing spiraProductId in itemData for Spira search context.");
             setSearchError("Cannot search Spira: Target Product ID is missing.");
             return;
         }


        console.log(`Searching via plugin '${pluginId}' for query '${inputValue}' in context:`, { itemType, itemId });
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);

        try {
            // Construct context needed by the backend and Spira plugin
            const context = {
                 itemType,
                 itemId,
                 itemData // Contains spiraProductId etc.
            };
            const payload = {
                 query: inputValue,
                 context: context
            };
            const fetchOptions = {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `${token}`
                 },
                 body: JSON.stringify(payload)
            };

            const response = await fetch(`/api/link/search/${pluginId}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Search failed (HTTP ${response.status})`);
            }

            const results = await response.json();
            console.log("Search Results Received:", results); // *** LOG RESULTS FOR NOW ***
            setSearchResults(results || []); // Update state (even if not displayed yet)
             if (!results || results.length === 0) {
                 toast({ title: "Search", description: "No matching items found." });
             }

        } catch (error) {
             console.error("Search failed:", error);
             setSearchError(error.message || "Search failed.");
             toast({ title: "Search Error", description: error.message || "Search failed.", variant: "destructive"});
        } finally {
             setIsSearching(false);
        }
    }, [inputValue, pluginId, itemType, itemId, itemData, token, toast]); // Dependencies

    // Basic rendering with input and button
    return (
        <div className="p-4 border rounded space-y-4">
            <Label htmlFor={`search-${pluginId}-${itemId}`}>Link {itemType} to {pluginId}</Label>
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    id={`search-${pluginId}-${itemId}`}
                    placeholder={`Search ${pluginId} ${itemType === 'exampleMap' ? 'Requirements' : 'items'}...`}
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={isSearching}
                />
                <Button
                    type="button"
                    onClick={triggerSearch}
                    disabled={isSearching || inputValue.trim().length < 2}
                    size="sm"
                 >
                    {isSearching ? 'Searching...' : 'Search'}
                 </Button>
            </div>
            {/* Basic Error Display */}
            {searchError && (
                <p className="text-sm text-destructive">{searchError}</p>
            )}
             {/* TODO: Add display area for searchResults */}
             {/* Example: <pre>{JSON.stringify(searchResults, null, 2)}</pre> */}
        </div>
    );
}

//export { ExternalItemSearch }; // Use named export
