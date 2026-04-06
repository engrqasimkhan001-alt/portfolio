import { getSupabase } from '../config/supabase.js';

export async function fetchActiveTeamMembers() {
    const supabase = getSupabase();
    if (!supabase) {
        return { data: null, error: new Error('Supabase not initialized') };
    }
    return supabase
        .from('team_members')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
}
