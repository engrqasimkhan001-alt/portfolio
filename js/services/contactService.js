import { getSupabase } from '../config/supabase.js';

/** @param {Record<string, unknown>} payload */
export async function insertContactMessage(payload) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') };
    return supabase.from('contact_messages').insert([payload]).select();
}

/** @param {Record<string, unknown>} payload */
export async function insertJobApplication(payload) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not initialized') };
    return supabase.from('job_applications').insert([payload]).select();
}

/**
 * @param {File} file
 * @returns {Promise<string>} public URL
 */
export async function uploadResumeToStorage(file) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');
    const fileExt = file.name.split('.').pop();
    const fileName = `resumes/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return urlData.publicUrl;
}
