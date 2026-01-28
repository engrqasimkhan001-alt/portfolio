// Supabase Configuration
const SUPABASE_URL = 'https://widshsxgcqmyjobaxkhz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHNoc3hnY3FteWpvYmF4a2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njg1ODEsImV4cCI6MjA4NTE0NDU4MX0.9unbbHCwCCqg94oxR-GkzJBwFDdya0MyLEnDXbV5GlM';

// Initialize Supabase client
let supabase = null;

// Wait for Supabase library to be available
if (typeof window !== 'undefined') {
    // Check if the supabase object exists and has createClient
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
    } else {
        console.error('Supabase library not found. window.supabase:', window.supabase);
    }
}
