/**
 * Vercel serverless: AI blog generation (Google Gemini).
 * Always responds with JSON: { success: true, blog } | { success: false, error }
 *
 * Env: GEMINI_API_KEY, ADMIN_PASSWORD (required)
 * Optional: GEMINI_MODEL (default gemini-1.5-flash)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
}

function sendSuccess(res, blog) {
    sendJson(res, 200, {
        success: true,
        blog: {
            title: blog.title || '',
            slug: blog.slug || '',
            excerpt: blog.excerpt || '',
            content: blog.content || '',
            category: blog.category || '',
            blog_type: blog.blog_type || 'Article',
            tags: Array.isArray(blog.tags) ? blog.tags : [],
            status: 'draft',
        },
    });
}

function toErrorString(error) {
    if (!error) return 'Request failed';
    if (typeof error === 'string') return error;
    if (error instanceof Error && error.message) return String(error.message);
    if (typeof error === 'object' && error.message && typeof error.message === 'string') {
        return error.message;
    }
    if (typeof error === 'object' && error.error && typeof error.error === 'string') {
        return error.error;
    }
    if (typeof error === 'object' && error.error && typeof error.error === 'object') {
        return toErrorString(error.error);
    }
    try {
        return JSON.stringify(error);
    } catch {
        return 'Request failed';
    }
}

function sendFail(res, status, error) {
    sendJson(res, status, {
        success: false,
        error: toErrorString(error),
    });
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            if (!data) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(data));
            } catch {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}

module.exports = async function handler(req, res) {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }

        if (req.method !== 'POST') {
            sendFail(res, 405, 'Method not allowed. Use POST.');
            return;
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!geminiKey) {
            sendFail(res, 503, 'GEMINI_API_KEY is missing in environment variables.');
            return;
        }

        if (!adminPassword) {
            sendFail(res, 503, 'ADMIN_PASSWORD is missing in environment variables.');
            return;
        }

        let body = req.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            try {
                body = await readJsonBody(req);
            } catch (e) {
                sendFail(res, 400, toErrorString(e));
                return;
            }
        }

        if (!body.admin_password) {
            sendFail(res, 401, 'Session expired. Log out and log in again.');
            return;
        }

        if (body.admin_password !== adminPassword) {
            sendFail(res, 401, 'Session expired. Log out and log in again.');
            return;
        }

        const rawText = String(body.raw_text || '').trim();
        const mode = body.mode === 'improve' ? 'improve' : 'generate';
        const existing = body.existing && typeof body.existing === 'object' ? body.existing : {};
        const existingContent = String(existing.content || '').trim();

        if (rawText.length < 20 && existingContent.length < 40) {
            sendFail(
                res,
                400,
                'Add notes in the AI box (20+ characters) or more content in the post to improve.'
            );
            return;
        }

        const {
            buildSystemPrompt,
            buildUserPrompt,
            normalizeAiBlogPayload,
            parseAiJsonFromText,
        } = await import('../lib/blogAiShared.js');

        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const userPrompt = buildUserPrompt({ mode, rawText, existing });

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: buildSystemPrompt(),
            generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json',
            },
        });

        let rawContent;
        try {
            const result = await model.generateContent(userPrompt);
            const response = result?.response;
            if (!response) {
                sendFail(res, 502, 'Empty response from AI');
                return;
            }
            rawContent = response.text();
        } catch (err) {
            console.error('[generate-blog] Gemini error:', err);
            sendFail(res, 502, `Gemini API error: ${toErrorString(err)}`);
            return;
        }

        if (!rawContent || !String(rawContent).trim()) {
            sendFail(res, 502, 'Empty response from AI');
            return;
        }

        let parsed;
        try {
            parsed = parseAiJsonFromText(rawContent);
        } catch (err) {
            console.error('[generate-blog] invalid AI JSON:', String(rawContent).slice(0, 300));
            sendFail(res, 502, toErrorString(err));
            return;
        }

        const normalized = normalizeAiBlogPayload(parsed);
        if (!normalized.title || !normalized.content) {
            sendFail(res, 502, 'AI response missing title or content. Try again with more detail.');
            return;
        }

        sendSuccess(res, normalized);
    } catch (err) {
        console.error('[generate-blog] unhandled:', err);
        sendFail(res, 500, toErrorString(err));
    }
};
