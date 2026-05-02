import { getSupabase } from '../config/supabase.js';

/** Field definitions for Admin → Website (single source of truth). */
export const SITE_CONTENT_FIELDS = [
    { key: 'badge_logo', label: 'Home badge — logo text (e.g. wOs)', type: 'text' },
    { key: 'badge_tagline', label: 'Home badge — company line', type: 'text' },
    { key: 'nav_brand', label: 'Navbar brand text', type: 'text' },
    { key: 'hero_greeting', label: 'Hero — greeting line', type: 'text' },
    { key: 'hero_name', label: 'Hero — your name', type: 'text' },
    { key: 'hero_role', label: 'Hero — role / title', type: 'text' },
    { key: 'hero_location', label: 'Hero — location line', type: 'text' },
    { key: 'hero_description', label: 'Hero — intro paragraph', type: 'textarea', rows: 5 },
    { key: 'hero_btn_hire', label: 'Hero — primary button label', type: 'text' },
    { key: 'hero_btn_portfolio', label: 'Hero — secondary button label', type: 'text' },
    { key: 'hero_upwork_url', label: 'Hero — Upwork profile URL', type: 'url' },
    { key: 'hero_upwork_label', label: 'Hero — Upwork link label', type: 'text' },
    { key: 'section_about_title', label: 'Section — About title', type: 'text' },
    { key: 'about_p1', label: 'About — paragraph 1', type: 'textarea', rows: 5 },
    { key: 'about_p2', label: 'About — paragraph 2', type: 'textarea', rows: 6 },
    { key: 'about_p3', label: 'About — paragraph 3', type: 'textarea', rows: 5 },
    { key: 'section_skills_title', label: 'Section — Skills title', type: 'text' },
    { key: 'section_portfolio_title', label: 'Section — Portfolio title', type: 'text' },
    { key: 'section_portfolio_subtitle', label: 'Section — Portfolio subtitle', type: 'text' },
    { key: 'section_blog_title', label: 'Section — Blog title', type: 'text' },
    { key: 'section_blog_subtitle', label: 'Section — Blog subtitle', type: 'text' },
    { key: 'section_services_title', label: 'Section — Services title', type: 'text' },
    { key: 'section_services_subtitle', label: 'Section — Services subtitle', type: 'text' },
    { key: 'section_reviews_title', label: 'Section — Reviews title', type: 'text' },
    { key: 'section_reviews_subtitle', label: 'Section — Reviews subtitle', type: 'text' },
    { key: 'section_team_title', label: 'Section — Team title', type: 'text' },
    { key: 'section_team_subtitle', label: 'Section — Team subtitle', type: 'text' },
    { key: 'section_careers_title', label: 'Section — Careers title', type: 'text' },
    { key: 'section_careers_subtitle', label: 'Section — Careers subtitle', type: 'text' },
    { key: 'section_contact_title', label: 'Section — Contact title', type: 'text' },
    { key: 'section_contact_subtitle', label: 'Section — Contact subtitle', type: 'text' },
    { key: 'contact_company_line', label: 'Contact — company line (under Company)', type: 'text' },
    { key: 'footer_logo', label: 'Footer — logo text', type: 'text' },
    { key: 'footer_company', label: 'Footer — company name', type: 'text' },
    { key: 'footer_rights', label: 'Footer — copyright line', type: 'text' },
    { key: 'footer_note', label: 'Footer — tagline under copyright', type: 'text' },
];

/**
 * @returns {{ data: Record<string, string>, error: Error | null }}
 */
export async function fetchSiteContentMap() {
    const supabase = getSupabase();
    if (!supabase) {
        return { data: {}, error: new Error('Supabase not initialized') };
    }
    const { data, error } = await supabase.from('site_content').select('key, value');
    if (error) return { data: {}, error };
    const map = {};
    for (const row of data || []) {
        if (row && typeof row.key === 'string') {
            map[row.key] = row.value != null ? String(row.value) : '';
        }
    }
    return { data: map, error: null };
}
