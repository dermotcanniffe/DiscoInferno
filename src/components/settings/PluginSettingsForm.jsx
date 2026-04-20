// src/components/settings/PluginSettingsForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // For isEnabled toggle
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Define expected props structure (can use PropTypes or TypeScript interface)
// interface PluginSettingsFormProps {
//   pluginId: string;
//   schema: Array<{
//     key: string;
//     label: string;
//     type: 'text' | 'url' | 'password' | 'number'; // Extend as needed
//     required: boolean;
//     description?: string;
//     defaultValue?: any;
//   }>;
// }

export function PluginSettingsForm({ pluginId, schema }) { // Destructure props
    const { token } = useAuth();
    const { toast } = useToast();

    // State for this specific form instance
    const [configuration, setConfiguration] = useState({});
    const [isEnabled, setIsEnabled] = useState(false);
    const [initialConfiguration, setInitialConfiguration] = useState({});
    const [initialIsEnabled, setInitialIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch this plugin's config for the current user
    const fetchUserPluginConfig = useCallback(async () => {
        console.log(`PluginSettingsForm: Fetching config for ${pluginId}`);
        setIsLoading(true);
        setError(null);

        if (!token || !pluginId) {
            setError("Cannot fetch config: Missing token or plugin ID.");
            setIsLoading(false);
            return;
        }

        try {
            const fetchOptions = {
                method: 'GET',
                headers: { 'Authorization': `${token}` }
            };
            const response = await fetch(`/api/settings/plugin/${pluginId}`, fetchOptions);

            let loadedConfig = {};
            let loadedEnabled = false;
            // Set defaults based on schema FIRST, in case fetch fails or returns no data
            const defaultValues = schema.reduce((acc, field) => {
                acc[field.key] = field.defaultValue ?? '';
                return acc;
            }, {});

            if (response.ok) {
                 const data = await response.json();
                 loadedConfig = (typeof data.configuration === 'object' && data.configuration !== null) ? data.configuration : {};
                 loadedEnabled = typeof data.isEnabled === 'boolean' ? data.isEnabled : false;
                 console.log(`PluginSettingsForm: Config loaded for ${pluginId}`, { loadedConfig, loadedEnabled });
            } else if (response.status === 404) {
                 console.log(`PluginSettingsForm: No config found for ${pluginId}, using defaults.`);
                 // Keep default empty config and false enabled status
            } else if (response.status === 401 || response.status === 403) {
                 throw new Error("Unauthorized to fetch plugin configuration.");
            } else {
                 throw new Error(`HTTP error ${response.status} fetching plugin config.`);
            }

            // Combine defaults with loaded config to ensure all schema keys exist in state
            const initialValues = schema.reduce((acc, field) => {
                acc[field.key] = loadedConfig[field.key] ?? defaultValues[field.key];
                return acc;
            }, {});

            setConfiguration(initialValues);
            setIsEnabled(loadedEnabled);
            setInitialConfiguration(initialValues); // Store initial state
            setInitialIsEnabled(loadedEnabled);

        } catch (err) {
            console.error(`PluginSettingsForm: Error fetching config for ${pluginId}:`, err);
            setError(err.message || "Failed to load configuration.");
            // Reset form to defaults on error
            const defaultValues = schema.reduce((acc, field) => {
                acc[field.key] = field.defaultValue ?? ''; return acc; }, {});
            setConfiguration(defaultValues);
            setIsEnabled(false);
            setInitialConfiguration(defaultValues);
            setInitialIsEnabled(false);
        } finally {
            setIsLoading(false);
        }
    }, [pluginId, schema, token]); // Dependencies

    // Fetch data on mount or when pluginId/token changes
    useEffect(() => {
        fetchUserPluginConfig();
    }, [fetchUserPluginConfig]);

    // Handle changes in form inputs
    const handleChange = (event) => {
        const { name, value } = event.target;
        setConfiguration(prevConfig => ({
            ...prevConfig,
            [name]: value
        }));
    };

    // Handle changes in the isEnabled switch
    const handleToggleChange = (checked) => {
        setIsEnabled(checked);
    };

    // Handle saving the configuration
    const handleSave = async () => {
        console.log(`PluginSettingsForm: Saving config for ${pluginId}`);
        setIsSaving(true);
        setError(null);

        if (!token || !pluginId) { /* ... handle missing token/pluginId ... */ return; }

        try {
            const payload = { configuration, isEnabled }; // Send current state
            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                },
                body: JSON.stringify(payload)
            };

            const response = await fetch(`/api/settings/plugin/${pluginId}`, fetchOptions);

            // --- This is the corrected error handling ---
            if (!response.ok) {
                // Handle specific auth errors first
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Unauthorized: Failed to save configuration.");
                }
                // Try to get more specific error from backend response body
                const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` })); // Default message if JSON parsing fails
                throw new Error(errorData.message || `Failed to save plugin configuration (HTTP ${response.status})`);
            }
            // --- End of corrected error handling ---

            // If save is successful:
            setInitialConfiguration(configuration); // Update the 'initial' state
            setInitialIsEnabled(isEnabled);

            toast({
                title: "Success",
                description: `Settings for ${pluginId} saved.`,
            });

        } catch (err) {
            console.error(`PluginSettingsForm: Error saving config for ${pluginId}:`, err);
            setError(err.message || "Failed to save configuration."); // Set error state
            toast({
                title: "Error Saving Settings",
                description: `${err.message || 'Please try again.'}`,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Check if changes have been made
    const hasChanges = JSON.stringify(configuration) !== JSON.stringify(initialConfiguration) || isEnabled !== initialIsEnabled;

    // --- Render Logic ---
    if (isLoading) {
        // Display Skeleton loaders matching the form structure
        return (
            <div className="space-y-4 p-4 border rounded mb-4">
                <Skeleton className="h-6 w-1/3 mb-4" /> {/* Title Skeleton */}
                {schema.map((field) => (
                     <div key={field.key} className="flex flex-col space-y-1.5">
                        <Skeleton className="h-4 w-1/4" /> {/* Label Skeleton */}
                        <Skeleton className="h-9 w-full" /> {/* Input Skeleton */}
                     </div>
                ))}
                <div className="flex items-center space-x-2 pt-4">
                    <Skeleton className="h-6 w-6 rounded-full" /> {/* Switch Skeleton */}
                    <Skeleton className="h-4 w-1/4" /> {/* Switch Label Skeleton */}
                </div>
                 <div className="pt-4 flex justify-end">
                     <Skeleton className="h-9 w-24" /> {/* Button Skeleton */}
                 </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 border rounded mb-4 text-destructive">Error loading config for {pluginId}: {error}</div>;
    }

    // Render the actual form using Shadcn components
    return (
        // Can wrap this in a Card if desired, or just use divs/styling
        <div className="space-y-4 p-4 border rounded mb-4">
            {/* Render form fields based on schema */}
            {schema && schema.length > 0 ? (
                schema.map((field) => (
                    <div key={field.key} className="flex flex-col space-y-1.5">
                        <Label htmlFor={`${pluginId}-${field.key}`}>
                            {field.label}{field.required ? ' *' : ''}
                        </Label>
                        <Input
                            type={field.type === 'password' ? 'password' : 'text'}
                            id={`${pluginId}-${field.key}`}
                            name={field.key}
                            value={configuration[field.key] || ''} // Bind value to state
                            onChange={handleChange} // Handle changes
                            placeholder={field.description || `Enter ${field.label}`}
                            disabled={isSaving || !isEnabled} // Disable inputs if saving or plugin disabled
                        />
                        {field.description && (
                            <p className="text-[0.8rem] text-muted-foreground pt-1">
                                {field.description}
                            </p>
                        )}
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground">This plugin has no configurable settings.</p>
            )}

            {/* Enable/Disable Toggle */}
             <div className="flex items-center space-x-2 pt-4">
                <Switch
                    id={`${pluginId}-enabled`}
                    checked={isEnabled}
                    onCheckedChange={handleToggleChange} // Use specific handler for switch
                    disabled={isSaving}
                />
                <Label htmlFor={`${pluginId}-enabled`}>Enable {pluginId} Plugin</Label>
            </div>

             {/* Save Button */}
             <div className="pt-4 flex justify-end">
                 <Button
                     size="sm"
                     onClick={handleSave}
                     disabled={isSaving || !hasChanges} // Disable if saving or no changes made
                 >
                     {isSaving ? 'Saving...' : `Save ${pluginId} Settings`}
                 </Button>
             </div>
        </div>
    );
}

