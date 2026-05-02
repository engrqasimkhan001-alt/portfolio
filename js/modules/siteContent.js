import { fetchSiteContentMap } from '../services/siteContentService.js';

/**
 * Apply Supabase `site_content` rows to `[data-site="key"]` on the homepage.
 * URL keys (`*_url`) set `href` on <a> elements; everything else uses textContent.
 */
export async function initSiteContent() {
    const { data: map, error } = await fetchSiteContentMap();
    if (error) {
        console.warn('[site content]', error.message || error);
        return;
    }
    if (!map || typeof map !== 'object') return;

    document.querySelectorAll('[data-site]').forEach((el) => {
        const key = el.getAttribute('data-site');
        if (!key || !(key in map)) return;
        const val = map[key];
        if (val === '' || val == null) return;

        if (el.tagName === 'A' && key.endsWith('_url')) {
            el.setAttribute('href', val);
        } else {
            el.textContent = val;
        }
    });
}
