import { getSupabase } from '../config/supabase.js';

/** @param {number} [limit] */
export async function fetchVisibleReviews(limit = 12) {
    const supabase = getSupabase();
    if (!supabase) {
        return { data: null, error: new Error('Supabase not initialized') };
    }
    return supabase
        .from('client_reviews')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false })
        .limit(limit);
}
