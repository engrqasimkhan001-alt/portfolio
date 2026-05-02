/** App-wide constants (Supabase + admin). */

/**
 * When true, the homepage portfolio grid loads from Supabase `portfolio_projects` (same data as the admin panel).
 * When false, only the static cards in index.html are shown — new projects you add in Admin will NOT appear.
 */
export const LOAD_PORTFOLIO_FROM_SUPABASE = true;

/** When true, the Blog section loads posts from Supabase `blogs` (status = published). */
export const LOAD_BLOGS_FROM_SUPABASE = true;

export const SUPABASE_URL = 'https://widshsxgcqmyjobaxkhz.supabase.co';
export const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHNoc3hnY3FteWpvYmF4a2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njg1ODEsImV4cCI6MjA4NTE0NDU4MX0.9unbbHCwCCqg94oxR-GkzJBwFDdya0MyLEnDXbV5GlM';

/** Admin panel password (same as before refactor). */
export const ADMIN_PASSWORD = 'Qasim@123';

export const SPLASH_MIN_MS = 2400;
