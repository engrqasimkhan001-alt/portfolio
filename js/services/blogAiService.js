/**
 * Client for POST /api/generate-blog (Vercel serverless + Google Gemini).
 */

const API_PATH = '/api/generate-blog';

/**
 * Coerce any thrown value or API error field into a user-visible string.
 * @param {unknown} error
 * @returns {string}
 */
export function getReadableError(error) {
    if (!error) return 'Something went wrong.';
    if (typeof error === 'string') return error;
    if (error instanceof Error && typeof error.message === 'string' && error.message) {
        return error.message;
    }
    if (typeof error === 'object' && error !== null) {
        const o = /** @type {Record<string, unknown>} */ (error);
        if (typeof o.message === 'string' && o.message) return o.message;
        if (typeof o.error === 'string' && o.error) return o.error;
        if (o.error && typeof o.error === 'object') {
            const nested = getReadableError(o.error);
            if (nested !== 'Something went wrong.') return nested;
        }
    }
    try {
        return JSON.stringify(error, null, 2);
    } catch {
        return 'Something went wrong.';
    }
}

function isLocalDevHost() {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
}

function isDevLogging() {
    return isLocalDevHost();
}

function getAdminPasswordForApi() {
    return sessionStorage.getItem('adminApiPassword') || '';
}

function apiUnavailableMessage() {
    return (
        'AI API route is not available. Run with vercel dev or deploy to Vercel.\n\n' +
        'Local: stop npm run dev, then run:\n  npm run dev:vercel\n' +
        'Open http://localhost:8000/admin.html'
    );
}

/**
 * @param {Response} res
 * @param {string} rawText
 */
async function parseBlogApiResponse(res, rawText) {
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const text = (rawText ?? '').trim();

    if (isDevLogging()) {
        console.log('[blog-ai] HTTP', res.status, res.statusText, '|', contentType);
        if (text) {
            console.log('[blog-ai] body (first 400 chars):', text.slice(0, 400));
        } else {
            console.log('[blog-ai] empty body');
        }
    }

    if (!text) {
        const noApiRoute =
            res.status === 404 ||
            res.status === 405 ||
            res.status === 501 ||
            !contentType.includes('json');
        if (noApiRoute) {
            throw new Error(apiUnavailableMessage());
        }
        throw new Error('Empty response from server.');
    }

    const looksLikeHtml = /^\s*</.test(text) || contentType.includes('text/html');
    if (looksLikeHtml) {
        throw new Error(apiUnavailableMessage());
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        if (res.status === 404) {
            throw new Error(apiUnavailableMessage());
        }
        throw new Error(apiUnavailableMessage());
    }

    if (data && data.success === false) {
        throw new Error(getReadableError(data.error ?? data));
    }

    if (data && data.success === true) {
        if (data.blog && typeof data.blog === 'object') {
            return data.blog;
        }
        throw new Error('AI response did not include blog data.');
    }

    if (isDevLogging()) {
        console.warn('[blog-ai] unexpected JSON shape:', data);
    }

    throw new Error(
        getReadableError(data?.error) ||
            'Unexpected API response. Deploy the latest API or use npm run dev:vercel.'
    );
}

/**
 * @param {{ rawText: string, mode: 'generate'|'improve', existing?: Record<string, unknown> }} opts
 * @returns {Promise<{
 *   title: string,
 *   slug: string,
 *   excerpt: string,
 *   content: string,
 *   category: string,
 *   blog_type: string,
 *   tags: string[],
 *   status: string
 * }>}
 */
export async function requestBlogAiGeneration({ rawText, mode, existing = {} }) {
    const admin_password = getAdminPasswordForApi();
    if (!admin_password) {
        throw new Error('Session expired. Log out and log in again.');
    }

    let res;
    let rawTextBody = '';
    try {
        res = await fetch(API_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                admin_password,
                raw_text: rawText,
                mode: mode === 'improve' ? 'improve' : 'generate',
                existing,
            }),
        });
        rawTextBody = await res.text();
    } catch (e) {
        if (isDevLogging()) {
            console.error('[blog-ai] readable error:', getReadableError(e), e);
        }
        if (isLocalDevHost()) {
            throw new Error(apiUnavailableMessage());
        }
        throw new Error(getReadableError(e) || 'Network error');
    }

    const blog = await parseBlogApiResponse(res, rawTextBody);

    if (!res.ok && isDevLogging()) {
        console.warn('[blog-ai] non-OK status but parsed success payload');
    }

    return blog;
}
