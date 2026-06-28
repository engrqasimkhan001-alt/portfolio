/** Shared blog AI types and normalization (used by api/generate-blog.js). */

export const BLOG_TYPE_OPTIONS = [
    'Article',
    'Case Study',
    'Tutorial',
    'News',
    'Project Update',
    'Tips & Tricks',
];

const TYPE_ALIASES = {
    article: 'Article',
    'case study': 'Case Study',
    casestudy: 'Case Study',
    tutorial: 'Tutorial',
    news: 'News',
    'project update': 'Project Update',
    projectupdate: 'Project Update',
    'tips & tricks': 'Tips & Tricks',
    'tips and tricks': 'Tips & Tricks',
    tips: 'Tips & Tricks',
};

export function slugifyForBlog(title) {
    let s = String(title || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    s = s.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return s.slice(0, 200);
}

export function normalizeTags(tags) {
    if (Array.isArray(tags)) {
        return tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12);
    }
    if (typeof tags === 'string') {
        return tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 12);
    }
    return [];
}

export function normalizeBlogType(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'Article';
    if (BLOG_TYPE_OPTIONS.includes(raw)) return raw;
    const key = raw.toLowerCase();
    if (TYPE_ALIASES[key]) return TYPE_ALIASES[key];
    for (const opt of BLOG_TYPE_OPTIONS) {
        if (opt.toLowerCase() === key) return opt;
    }
    return 'Article';
}

/**
 * @param {unknown} parsed
 * @returns {Record<string, unknown>}
 */
export function normalizeAiBlogPayload(parsed) {
    const p = parsed && typeof parsed === 'object' ? parsed : {};
    const title = String(p.title || '').trim().slice(0, 500);
    const content = String(p.content || '').trim();
    const excerpt = String(p.excerpt || '').trim().slice(0, 2000);
    const category = String(p.category || '').trim().slice(0, 120);
    const blogType = normalizeBlogType(p.blog_type || p.type);
    const tags = normalizeTags(p.tags);
    let slug = slugifyForBlog(p.slug || title);
    if (!slug) slug = 'post';

    return {
        title,
        slug,
        excerpt,
        content,
        category,
        blog_type: blogType,
        tags,
        status: 'draft',
    };
}

export function buildSystemPrompt() {
    return `You are an expert technical blog editor for a software developer portfolio (mobile & web apps).
Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "string",
  "slug": "string (lowercase, hyphenated, no spaces)",
  "excerpt": "string (1-2 sentences, max 220 chars, for blog cards)",
  "content": "string (full post, plain text; use blank lines between sections; optional lines like '## Heading' for structure)",
  "category": "string (e.g. Engineering, Web Development, Mobile Apps)",
  "blog_type": "one of: ${BLOG_TYPE_OPTIONS.join(', ')}",
  "tags": ["tag1", "tag2"],
  "status": "draft"
}
Rules:
- Preserve the author's meaning, experience, and facts. Do not invent credentials or fake metrics.
- Write in a clear, professional, human tone (not robotic SEO spam).
- Improve structure: intro, body with logical flow, conclusion.
- SEO-friendly title and excerpt without keyword stuffing.
- Always set status to "draft".
- blog_type must be exactly one of the allowed values.
- tags: 3-8 relevant lowercase or Title Case tags, no hashtags.`;
}

export function buildUserPrompt({ mode, rawText, existing }) {
    const ex = existing && typeof existing === 'object' ? existing : {};
    const parts = [];
    parts.push(`Mode: ${mode === 'improve' ? 'improve' : 'generate'}`);
    if (mode === 'improve') {
        parts.push(
            'Improve and expand the blog using the rough notes and/or existing fields below. Keep factual details; polish prose and structure.'
        );
    } else {
        parts.push('Turn the rough notes below into a complete blog post and fill all JSON fields.');
    }
    parts.push('\n--- Rough notes / draft ---\n' + String(rawText || '').trim());
    const hasExisting =
        ex.title ||
        ex.content ||
        ex.excerpt ||
        ex.category ||
        ex.blog_type ||
        (Array.isArray(ex.tags) && ex.tags.length);
    if (hasExisting) {
        parts.push('\n--- Existing fields (use when strong; otherwise generate better) ---');
        if (ex.title) parts.push(`title: ${ex.title}`);
        if (ex.slug) parts.push(`slug: ${ex.slug}`);
        if (ex.excerpt) parts.push(`excerpt: ${ex.excerpt}`);
        if (ex.content) parts.push(`content:\n${ex.content}`);
        if (ex.category) parts.push(`category: ${ex.category}`);
        if (ex.blog_type) parts.push(`blog_type: ${ex.blog_type}`);
        if (ex.tags?.length) parts.push(`tags: ${ex.tags.join(', ')}`);
        if (ex.author_name) parts.push(`author_name: ${ex.author_name}`);
    }
    return parts.join('\n');
}

/**
 * Parse JSON from AI text, tolerating markdown fences and leading/trailing prose.
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function parseAiJsonFromText(text) {
    let raw = String(text || '').trim();
    if (!raw) {
        throw new Error('AI returned empty content.');
    }

    const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
    if (fenced) {
        raw = fenced[1].trim();
    }

    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return /** @type {Record<string, unknown>} */ (parsed);
        }
    } catch {
        // try extracting object below
    }

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
        try {
            const parsed = JSON.parse(raw.slice(start, end + 1));
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return /** @type {Record<string, unknown>} */ (parsed);
            }
        } catch {
            // fall through
        }
    }

    throw new Error('AI returned invalid JSON. Try again.');
}
