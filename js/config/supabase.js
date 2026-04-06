import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants.js';

let client = null;

/**
 * Uses global `window.supabase` from the CDN script (see index.html / admin.html).
 * Avoids esm.sh imports that often fail with CORS or network blocks.
 */
export function getSupabase() {
    if (!client) {
        if (typeof window === 'undefined') return null;
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.error(
                'Supabase: load https://unpkg.com/@supabase/supabase-js@2 before the app module.'
            );
            return null;
        }
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = client;
    }
    return client;
}

getSupabase();
