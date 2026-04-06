/** App-wide constants (Supabase + admin). */

/**
 * When true, the portfolio grid is replaced by rows from Supabase `portfolio_projects` (admin panel).
 * When false, the cards in index.html are kept (use this until your database has the full project list).
 */
export const LOAD_PORTFOLIO_FROM_SUPABASE = false;

export const SUPABASE_URL = 'https://widshsxgcqmyjobaxkhz.supabase.co';
export const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHNoc3hnY3FteWpvYmF4a2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njg1ODEsImV4cCI6MjA4NTE0NDU4MX0.9unbbHCwCCqg94oxR-GkzJBwFDdya0MyLEnDXbV5GlM';

/** Admin panel password (same as before refactor). */
export const ADMIN_PASSWORD = 'Qasim@123';

export const SPLASH_MIN_MS = 2400;
