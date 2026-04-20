// src/components/settings/GeneralSettingsSection.jsx - CORRECTED

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext'; // Already correctly imported
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function GeneralSettingsSection() {
    const settingKey = 'application_title';
    const defaultTitle = 'DiscoInferno';

    const [title, setTitle] = useState('');
    const [initialTitle, setInitialTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const { token } = useAuth(); // Already correctly getting token

    // Fetch initial setting value using useCallback
    const fetchSetting = useCallback(async () => {
        console.log("Fetching setting:", settingKey);
        setIsLoading(true);
        try {
            // *** CHANGE: Define fetch options with Auth header ***
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization header IF token exists
                    ...(token && { 'Authorization': `${token}` }) // Ensure token format (e.g., Bearer prefix) matches backend middleware expectation
                }
            };

            const response = await fetch(`/api/settings/core/${settingKey}`, fetchOptions); // *** Use fetchOptions ***

            let fetchedValue = defaultTitle;
            if (response.ok) {
                const data = await response.json();
                fetchedValue = data.value || defaultTitle;
            } else if (response.status === 401 || response.status === 403) { // Handle Auth error specifically
                console.error("Auth error fetching setting");
                toast({ title: "Authentication Error", description: "Failed to load settings. Please log in again.", variant: "destructive" });
                 // Optionally call logoutAction() here if available via context
            } else if (response.status === 404) {
                console.log(`Setting ${settingKey} not found, using default.`);
            } else {
                console.error(`Failed to fetch setting ${settingKey}: ${response.status}`);
                toast({ title: "Error Loading Settings", description: `Could not load ${settingKey}.`, variant: "destructive" });
            }
            setTitle(fetchedValue);
            setInitialTitle(fetchedValue);

        } catch (error) {
            console.error(`Error fetching setting ${settingKey}:`, error);
            setTitle(defaultTitle);
            setInitialTitle(defaultTitle);
            toast({ title: "Error Loading Settings", description: "Could not connect to the server.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    // *** CHANGE: Add token to dependency array ***
    }, [settingKey, toast, defaultTitle, token]);

    // Fetch data when component mounts OR when token changes
    useEffect(() => {
        if (token) { // Only fetch if we are authenticated
            fetchSetting();
        } else {
             // Handle case where user logs out while viewing page, or component mounts before auth is ready
             setIsLoading(false);
             setTitle(defaultTitle); // Reset to default if not authenticated
             setInitialTitle(defaultTitle);
             console.log("GeneralSettingsSection: No token, not fetching settings.");
        }
    // *** CHANGE: Add token to dependency array ***
    }, [fetchSetting, token]);

    // Handle input changes
    const handleInputChange = (event) => {
        setTitle(event.target.value);
    };

    // Handle saving changes
    const handleSave = async () => {
        console.log("Saving setting:", settingKey, "with value:", title);
        setIsSaving(true);
        try {
             // *** CHANGE: Define fetch options with Auth header ***
             const fetchOptions = {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                      // Add Authorization header IF token exists
                     ...(token && { 'Authorization': `${token}` }) // Ensure token format matches backend middleware expectation
                 },
                 body: JSON.stringify({ key: settingKey, value: title })
             };

            const response = await fetch(`/api/settings/core`, fetchOptions); // *** Use fetchOptions ***

            if (!response.ok) {
                // Handle specific auth errors first
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Unauthorized: Invalid or missing token.");
                }
                // Handle other errors
                const errorData = await response.json().catch(() => ({ message: 'Unknown error during save.' }));
                throw new Error(errorData.message || `Failed to save setting (HTTP ${response.status})`);
            }

            // If save is successful:
            setInitialTitle(title); // Update the 'initial' state to reflect the saved value
            toast({ title: "Success", description: "Settings saved successfully." });

        } catch (error) {
            console.error("Error saving setting:", error);
            toast({ title: "Error Saving Settings", description: `${error.message || 'Please try again.'}`, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // Determine if the value has changed from its initial loaded state
    const hasChanges = title !== initialTitle;

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage core application settings like the application title.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="core_setting_app_title">Application Title</Label>
                        <Input
                            id="core_setting_app_title"
                            name={settingKey}
                            value={title}
                            onChange={handleInputChange}
                            placeholder="Enter application title"
                            disabled={isLoading || isSaving || !token} // Also disable if not authenticated
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
                 <Button
                    onClick={handleSave}
                    disabled={isLoading || isSaving || !hasChanges || !token} // Disable button if loading, saving, no changes, or not authenticated
                 >
                    {isSaving ? 'Saving...' : 'Save General Settings'}
                 </Button>
             </CardFooter>
        </Card>
    );
}

// Ensure this component is exported correctly if not already
// export default GeneralSettingsSection; // Or export { GeneralSettingsSection };