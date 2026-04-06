import { getSupabase } from '../config/supabase.js';

/** @param {number} [limit] */
export async function fetchPublicProjects(limit = 12) {
    const supabase = getSupabase();
    if (!supabase) {
        return { data: null, error: new Error('Supabase not initialized') };
    }
    return supabase
        .from('portfolio_projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
}
