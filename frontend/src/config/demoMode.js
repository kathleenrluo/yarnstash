/**
 * Demo Mode Configuration
 * 
 * Set to true to enable read-only demo mode
 * This disables all write operations (add, edit, delete)
 */

// Check for demo mode via environment variable or default to false
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || false;
