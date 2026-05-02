import { getSupabase } from '../config/supabase.js';

/**
 * Published posts for the public site (newest first).
 * Prefer `published_at`; fall back to `created_at` ordering via client sort if needed.
 */
export async function fetchPublishedBlogs(limit = 100) {
    const supabase = getSupabase();
    if (!supabase) {
        return { data: null, error: new Error('Supabase not initialized') };
    }
    return supabase
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);
}
