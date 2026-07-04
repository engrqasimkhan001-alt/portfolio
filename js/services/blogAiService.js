import { slugifyForBlog } from '../../lib/blogAiShared.js';

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

/**
 * Generates blog draft locally as a free fallback when Gemini API is unavailable.
 * @param {{ rawText: string, mode: 'generate'|'improve', existing?: Record<string, unknown> }} opts
 * @returns {{
 *   title: string,
 *   slug: string,
 *   excerpt: string,
 *   content: string,
 *   category: string,
 *   blog_type: string,
 *   tags: string[],
 *   seo_title: string,
 *   meta_description: string,
 *   keywords: string,
 *   hashtags: string,
 *   status: string
 * }}
 */
export function generateLocalFallbackBlog({ rawText, mode, existing = {} }) {
    const input = String(rawText || '').trim();

    // 1. Title
    let title = '';
    if (mode === 'improve' && existing.title) {
        title = existing.title;
    } else {
        const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
        let firstLine = '';
        if (lines.length > 0) {
            firstLine = lines[0].replace(/^#+\s*/, '');
        }
        if (firstLine && firstLine.length > 3 && firstLine.length < 120) {
            title = firstLine;
        } else {
            const sentences = input.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
            if (sentences.length > 0) {
                title = sentences[0].replace(/^#+\s*/, '').slice(0, 100);
            } else {
                title = 'Untitled Blog Post';
            }
        }
    }

    // Capitalize words in title
    title = title.replace(/\b\w/g, c => c.toUpperCase());

    // 2. Slug
    let slug = '';
    if (mode === 'improve' && existing.slug) {
        slug = existing.slug;
    } else {
        slug = slugifyForBlog(title);
        if (!slug) slug = 'post';
    }

    // 3. Content formatting
    let content = '';
    if (mode === 'improve' && existing.content) {
        content = existing.content;
        if (input && !content.includes(input)) {
            content += '\n\n' + input;
        }
    } else {
        content = input;
    }

    const contentLines = content.split('\n');
    const processedLines = [];
    for (let i = 0; i < contentLines.length; i++) {
        let line = contentLines[i].trim();
        if (!line) {
            processedLines.push('');
            continue;
        }

        const isList = line.startsWith('* ') || line.startsWith('- ') || /^\d+\.\s/.test(line);
        if (!line.startsWith('#') && !isList && line.length < 75 && !/[.?!,;]$/.test(line) && (i === 0 || !contentLines[i - 1].trim())) {
            processedLines.push('## ' + line);
        } else {
            processedLines.push(line);
        }
    }
    content = processedLines.join('\n').replace(/\n{3,}/g, '\n\n');

    // 4. Excerpt
    let excerpt = '';
    if (mode === 'improve' && existing.excerpt) {
        excerpt = existing.excerpt;
    } else {
        const sentences = content.replace(/##+/g, '').split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
        if (sentences.length > 0) {
            excerpt = sentences.slice(0, 2).join('. ') + '.';
            if (excerpt.length > 200) {
                excerpt = excerpt.slice(0, 197) + '...';
            }
        } else {
            excerpt = 'A summary of the latest updates and insights.';
        }
    }

    // 5. Category
    let category = '';
    if (mode === 'improve' && existing.category) {
        category = existing.category;
    } else {
        const lowerText = (title + ' ' + content).toLowerCase();
        const hasWord = (word) => new RegExp('\\b' + word + '\\b', 'i').test(lowerText);

        if (lowerText.includes('mobile') || lowerText.includes('ios') || lowerText.includes('android') || lowerText.includes('flutter') || lowerText.includes('react native') || lowerText.includes('swift') || lowerText.includes('kotlin')) {
            category = 'Mobile App Development';
        } else if (lowerText.includes('supabase') || lowerText.includes('database') || lowerText.includes('sql') || lowerText.includes('postgres')) {
            category = 'Supabase';
        } else if (hasWord('ai') || lowerText.includes('artificial intelligence') || lowerText.includes('gemini') || lowerText.includes('llm') || lowerText.includes('openai') || lowerText.includes('gpt') || lowerText.includes('machine learning')) {
            category = 'AI';
        } else if (lowerText.includes('automate') || lowerText.includes('automation') || lowerText.includes('cron') || lowerText.includes('workflow') || lowerText.includes('ci/cd') || lowerText.includes('github actions') || lowerText.includes('cli') || lowerText.includes('runner') || lowerText.includes('shell')) {
            category = 'Automation';
        } else if (lowerText.includes('portfolio') || lowerText.includes('website') || lowerText.includes('resume')) {
            category = 'Portfolio';
        } else if (lowerText.includes('career') || lowerText.includes('interview') || lowerText.includes('hiring') || lowerText.includes('salary')) {
            category = 'Career';
        } else if (lowerText.includes('engineering') || lowerText.includes('architecture') || lowerText.includes('clean code') || lowerText.includes('refactor') || lowerText.includes('concurrency') || lowerText.includes('design patterns')) {
            category = 'Engineering';
        } else if (lowerText.includes('web') || lowerText.includes('html') || lowerText.includes('css') || lowerText.includes('javascript') || lowerText.includes('react') || lowerText.includes('vue') || lowerText.includes('angular') || lowerText.includes('nextjs') || lowerText.includes('vite') || lowerText.includes('node')) {
            category = 'Web Development';
        } else {
            category = 'General';
        }
    }

    // 6. Blog type
    let blogType = '';
    if (mode === 'improve' && existing.blog_type) {
        blogType = existing.blog_type;
    } else {
        const lowerText = (title + ' ' + content).toLowerCase();
        if (lowerText.includes('how to') || lowerText.includes('tutorial') || lowerText.includes('guide') || lowerText.includes('step') || lowerText.includes('build') || lowerText.includes('create') || lowerText.includes('implement')) {
            blogType = 'Tutorial';
        } else if (lowerText.includes('project') || lowerText.includes('update') || lowerText.includes('released') || lowerText.includes('version')) {
            blogType = 'Project Update';
        } else if (lowerText.includes('case study') || lowerText.includes('metrics') || lowerText.includes('result') || lowerText.includes('solved')) {
            blogType = 'Case Study';
        } else if (lowerText.includes('tip') || lowerText.includes('trick') || lowerText.includes('cheat') || lowerText.includes('hack')) {
            blogType = 'Tips & Tricks';
        } else if (lowerText.includes('news') || lowerText.includes('announcing')) {
            blogType = 'News';
        } else {
            blogType = 'Article';
        }
    }

    // 7. Tags (5 to 10 tags)
    let tags = [];
    if (mode === 'improve' && Array.isArray(existing.tags) && existing.tags.length > 0) {
        tags = existing.tags;
    } else {
        const keywordTags = {
            'react': ['react', 'frontend', 'javascript'],
            'nextjs': ['nextjs', 'react', 'frontend', 'web-dev'],
            'vue': ['vue', 'frontend', 'javascript'],
            'angular': ['angular', 'frontend', 'javascript'],
            'node': ['nodejs', 'backend', 'javascript'],
            'javascript': ['javascript', 'web-dev'],
            'typescript': ['typescript', 'javascript'],
            'supabase': ['supabase', 'database', 'backend'],
            'firebase': ['firebase', 'database', 'backend'],
            'flutter': ['flutter', 'mobile', 'dart'],
            'react native': ['react-native', 'mobile', 'javascript'],
            'ios': ['ios', 'mobile', 'swift'],
            'android': ['android', 'mobile', 'kotlin'],
            'automation': ['automation', 'workflow', 'scripts'],
            'ai': ['ai', 'machine-learning', 'artificial-intelligence'],
            'gemini': ['gemini', 'ai', 'google'],
            'database': ['database', 'sql', 'postgres'],
            'css': ['css', 'styling', 'frontend'],
            'html': ['html', 'web-dev'],
            'git': ['git', 'version-control'],
            'github': ['github', 'git', 'devops'],
            'career': ['career', 'software-engineering', 'tips'],
            'clean code': ['clean-code', 'best-practices', 'software-engineering'],
            'go': ['go', 'backend', 'concurrency'],
            'golang': ['go', 'backend', 'concurrency'],
            'cli': ['cli', 'automation', 'tools'],
            'concurrency': ['concurrency', 'go', 'async'],
            'runner': ['automation', 'scripts', 'workflow'],
        };
        const lowerText = (title + ' ' + content).toLowerCase();
        const tagSet = new Set();
        for (const [kw, tList] of Object.entries(keywordTags)) {
            const regex = kw.length <= 4 ? new RegExp('\\b' + kw + '\\b', 'i') : new RegExp(kw, 'i');
            if (regex.test(lowerText)) {
                tList.forEach(t => tagSet.add(t));
            }
        }
        const generalTags = ['web-dev', 'software-engineering', 'programming', 'tech', 'coding', 'development', 'portfolio', 'learning'];
        let genIdx = 0;
        while (tagSet.size < 6 && genIdx < generalTags.length) {
            tagSet.add(generalTags[genIdx++]);
        }
        tags = Array.from(tagSet).slice(0, 10);
    }

    // 8. SEO details
    const seo_title = title + ' | Engr Qasim Khan';
    const meta_description = excerpt.slice(0, 155);
    const keywords = tags.join(', ');
    const hashtags = tags.map(t => '#' + t.replace(/[^a-zA-Z0-9]/g, '')).join(' ');

    return {
        title,
        slug,
        excerpt,
        content,
        category,
        blog_type: blogType,
        tags,
        seo_title,
        meta_description,
        keywords,
        hashtags,
        status: 'draft',
    };
}
