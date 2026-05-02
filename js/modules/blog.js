import { fetchPublishedBlogs } from '../services/blogService.js';
import { LOAD_BLOGS_FROM_SUPABASE } from '../utils/constants.js';
import { escapeHtml } from '../utils/helpers.js';
import { debounce } from '../utils/helpers.js';

/** @type {Record<string, unknown>[] | null} */
let blogsCache = null;

function cssUrlForBackground(url) {
    return String(url ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
    if (typeof tags === 'string') {
        try {
            const p = JSON.parse(tags);
            return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function formatBlogDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '';
    }
}

function collectCategoriesAndTags(posts) {
    const categories = new Set();
    const tagSet = new Set();
    for (const p of posts) {
        const c = (p.category || '').trim();
        if (c) categories.add(c);
        for (const t of normalizeTags(p.tags)) tagSet.add(t);
    }
    return {
        categories: [...categories].sort((a, b) => a.localeCompare(b)),
        tags: [...tagSet].sort((a, b) => a.localeCompare(b)),
    };
}

function fillFilterSelect(selectEl, values, prefix) {
    if (!selectEl) return;
    const cur = selectEl.value;
    selectEl.innerHTML = `<option value="">${prefix}</option>`;
    for (const v of values) {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = v;
        selectEl.appendChild(o);
    }
    if (values.includes(cur)) selectEl.value = cur;
}

function postMatchesFilters(post, q, type, category, tag) {
    const tags = normalizeTags(post.tags);
    if (type && String(post.type || '') !== type) return false;
    if (category && String(post.category || '').trim() !== category) return false;
    if (tag && !tags.includes(tag)) return false;
    if (!q) return true;
    const hay = `${post.title || ''} ${post.excerpt || ''} ${post.content || ''}`.toLowerCase();
    return hay.includes(q);
}

function renderBlogGrid(posts, q, type, category, tag) {
    const grid = document.getElementById('blogGrid');
    const empty = document.getElementById('blogEmptyState');
    if (!grid || !empty) return;

    const filtered = posts.filter((p) => postMatchesFilters(p, q, type, category, tag));

    if (!filtered.length) {
        grid.innerHTML = '';
        empty.classList.remove('is-hidden');
        return;
    }
    empty.classList.add('is-hidden');

    grid.innerHTML = filtered
        .map((post) => {
            const cover = post.cover_image_url ? cssUrlForBackground(post.cover_image_url) : '';
            const coverStyle = cover
                ? `background-image: url('${cover}');`
                : '';
            const tags = normalizeTags(post.tags);
            const tagHtml = tags
                .slice(0, 6)
                .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
                .join('');
            const dateStr = formatBlogDate(post.published_at || post.created_at);
            const readMin = post.reading_time != null ? `${post.reading_time} min read` : '';
            const featured = post.featured
                ? `<span class="blog-card-featured" aria-label="Featured post">Featured</span>`
                : '';
            return `
            <article class="blog-card fade-in" role="listitem" data-blog-id="${escapeHtml(String(post.id))}">
                <div class="blog-card-cover" style="${coverStyle}">
                    ${featured}
                </div>
                <div class="blog-card-body">
                    <div class="blog-card-meta">
                        <span class="blog-card-type">${escapeHtml(post.type || 'Article')}</span>
                        ${post.category ? `<span>${escapeHtml(post.category)}</span>` : ''}
                        <span>${escapeHtml(dateStr)}</span>
                        ${readMin ? `<span>${escapeHtml(readMin)}</span>` : ''}
                    </div>
                    <h3 class="blog-card-title">${escapeHtml(post.title || '')}</h3>
                    <p class="blog-card-excerpt">${escapeHtml(post.excerpt || '')}</p>
                    ${tagHtml ? `<div class="blog-card-tags">${tagHtml}</div>` : ''}
                </div>
            </article>`;
        })
        .join('');

    grid.querySelectorAll('.blog-card').forEach((card) => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-blog-id');
            const post = filtered.find((p) => String(p.id) === id);
            if (post) openBlogDetail(post);
        });
    });
}

function openBlogDetail(post) {
    const overlay = document.getElementById('blogDetailOverlay');
    const coverEl = document.getElementById('blogDetailCover');
    const featEl = document.getElementById('blogDetailFeatured');
    const metaEl = document.getElementById('blogDetailMeta');
    const titleEl = document.getElementById('blogDetailTitle');
    const tagsEl = document.getElementById('blogDetailTags');
    const contentEl = document.getElementById('blogDetailContent');
    if (!overlay || !titleEl || !contentEl) return;

    const cover = post.cover_image_url ? cssUrlForBackground(post.cover_image_url) : '';
    if (coverEl) {
        if (cover) {
            coverEl.style.display = '';
            coverEl.style.backgroundImage = `url('${cover}')`;
        } else {
            coverEl.style.display = 'none';
            coverEl.style.backgroundImage = '';
        }
    }
    if (featEl) {
        featEl.classList.toggle('is-visible', !!post.featured);
    }

    const parts = [];
    parts.push(escapeHtml(post.type || 'Article'));
    if (post.category) parts.push(escapeHtml(post.category));
    parts.push(escapeHtml(formatBlogDate(post.published_at || post.created_at)));
    if (post.author_name) parts.push(escapeHtml(post.author_name));
    if (post.reading_time != null) parts.push(`${escapeHtml(String(post.reading_time))} min read`);
    if (metaEl) metaEl.innerHTML = parts.join(' · ');

    titleEl.textContent = post.title || '';
    const tags = normalizeTags(post.tags);
    if (tagsEl) {
        tagsEl.innerHTML = tags.map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('');
    }
    contentEl.textContent = post.content || '';

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeBlogDetail() {
    const overlay = document.getElementById('blogDetailOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function applyFiltersAndRender() {
    if (!blogsCache) return;
    const q = (document.getElementById('blogSearchInput')?.value || '').trim().toLowerCase();
    const type = document.getElementById('blogFilterType')?.value || '';
    const category = document.getElementById('blogFilterCategory')?.value || '';
    const tag = document.getElementById('blogFilterTag')?.value || '';
    renderBlogGrid(blogsCache, q, type, category, tag);
}

export async function initBlog() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    const overlay = document.getElementById('blogDetailOverlay');
    overlay?.querySelector('.blog-detail-backdrop')?.addEventListener('click', closeBlogDetail);
    document.getElementById('blogDetailClose')?.addEventListener('click', closeBlogDetail);
    document.getElementById('blogDetailBack')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeBlogDetail();
        document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const search = document.getElementById('blogSearchInput');
    const debounced = debounce(applyFiltersAndRender, 200);
    search?.addEventListener('input', debounced);
    document.getElementById('blogFilterType')?.addEventListener('change', applyFiltersAndRender);
    document.getElementById('blogFilterCategory')?.addEventListener('change', applyFiltersAndRender);
    document.getElementById('blogFilterTag')?.addEventListener('change', applyFiltersAndRender);

    if (!LOAD_BLOGS_FROM_SUPABASE) {
        grid.innerHTML = '';
        const empty = document.getElementById('blogEmptyState');
        if (empty) {
            empty.textContent = 'Blog loading from Supabase is disabled in settings.';
            empty.classList.remove('is-hidden');
        }
        return;
    }

    try {
        const { data, error } = await fetchPublishedBlogs(120);
        if (error) {
            console.error('Blog load error:', error);
            grid.innerHTML = `<p class="blog-empty">Could not load posts. Add the blogs table (see database/migrations/migration-blogs.sql).</p>`;
            return;
        }
        if (!data || data.length === 0) {
            blogsCache = [];
            grid.innerHTML = '';
            const empty = document.getElementById('blogEmptyState');
            if (empty) {
                empty.textContent = 'No published posts yet. Check back soon.';
                empty.classList.remove('is-hidden');
            }
            return;
        }

        blogsCache = data;
        if (typeof window !== 'undefined') window.publicBlogsCache = data;

        const { categories, tags } = collectCategoriesAndTags(data);
        fillFilterSelect(document.getElementById('blogFilterCategory'), categories, 'All categories');
        fillFilterSelect(document.getElementById('blogFilterTag'), tags, 'All tags');

        applyFiltersAndRender();
    } catch (e) {
        console.error('initBlog:', e);
        grid.innerHTML = `<p class="blog-empty">Error loading blog.</p>`;
    }
}
