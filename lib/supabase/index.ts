/**
 * Supabase Client Factory Module
 * 
 * This module provides factory functions for creating Supabase clients
 * with appropriate configurations for different execution contexts.
 * 
 * @module lib/supabase
 */

// Client-side Supabase client for browser usage
export { createClient as createBrowserClient } from './client';

// Server-side Supabase client for Next.js server components and API routes
export { createClient as createServerClient } from './server';

// Admin client with elevated privileges (server-side only)
export { createAdminClient } from './admin';

// Middleware session management
export { updateSession } from './proxy';
