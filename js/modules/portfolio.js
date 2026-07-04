import { fetchPublicProjects } from '../services/projectService.js';
import { LOAD_PORTFOLIO_FROM_SUPABASE } from '../utils/constants.js';
import { observeScrollReveal } from './animations.js';

/** @type {unknown[] | null} */
let portfolioProjectsCache = null;

export function getPortfolioProjects() {
    return portfolioProjectsCache;
}

/** Escape for use inside CSS `url('…')` (matches portfolio card inline style pattern). */
function cssUrlForBackground(url) {
    return String(url ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function dedupeUrlsPreserveOrder(urls) {
    const seen = new Set();
    const out = [];
    for (const u of urls) {
        const s = typeof u === 'string' ? u.trim() : String(u ?? '').trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

/** Normalize `image_urls` from API (array or JSON string) plus legacy `image_url`. */
function normalizeProjectImageUrls(project) {
    let raw = project?.image_urls;
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        } catch {
            raw = [];
        }
    }
    let list = [];
    if (Array.isArray(raw) && raw.length > 0) {
        list = raw.map(String).filter(Boolean);
    } else if (project?.image_url) {
        list = [String(project.image_url)];
    }
    return dedupeUrlsPreserveOrder(list);
}

function getProjectFromCard(card) {
    const index = card.getAttribute('data-index');
    if (index != null && portfolioProjectsCache && portfolioProjectsCache[parseInt(index, 10)] != null) {
        return portfolioProjectsCache[parseInt(index, 10)];
    }
    const title = card.getAttribute('data-project-title');
    if (!title) return null;
    const technologies = (card.getAttribute('data-project-technologies') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    const imageUrlsRaw = card.getAttribute('data-project-image-urls') || '';
    const image_urls = dedupeUrlsPreserveOrder(
        imageUrlsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    );
    const image_url = image_urls[0] || '';
    return {
        title,
        platform: card.getAttribute('data-project-platform') || '',
        description: card.getAttribute('data-project-description') || '',
        technologies: technologies.join(', '),
        image_url,
        image_urls,
        project_link: card.getAttribute('data-project-link') || '',
        client_need: card.getAttribute('data-project-client-need') || '',
        my_role: card.getAttribute('data-project-my-role') || '',
        key_features: card.getAttribute('data-project-key-features') || '',
        challenges_solved: card.getAttribute('data-project-challenges-solved') || '',
        results_impact: card.getAttribute('data-project-results-impact') || '',
        github_link: card.getAttribute('data-project-github-link') || '',
    };
}

function openProjectDetail(project) {
    const overlay = document.getElementById('projectDetailOverlay');
    const heroEl = document.getElementById('projectDetailHero');
    const thumbsEl = document.getElementById('projectDetailThumbs');
    const platformEl = document.getElementById('projectDetailPlatform');
    const titleEl = document.getElementById('projectDetailTitle');
    const descEl = document.getElementById('projectDetailDescription');
    const techEl = document.getElementById('projectDetailTech');
    const linkEl = document.getElementById('projectDetailLink');

    if (!overlay || !project) return;

    const images = normalizeProjectImageUrls(project);
    const mainImage = images[0] || '';

    heroEl.style.backgroundImage = mainImage ? `url('${cssUrlForBackground(mainImage)}')` : '';
    heroEl.style.backgroundSize = 'cover';
    heroEl.style.backgroundPosition = 'center';

    thumbsEl.innerHTML = '';
    if (images.length > 1) {
        images.forEach((url, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'project-detail-thumb' + (i === 0 ? ' is-active' : '');
            thumb.style.backgroundImage = `url('${cssUrlForBackground(url)}')`;
            thumb.setAttribute('aria-label', `View image ${i + 1}`);
            thumb.addEventListener('click', () => {
                thumbsEl.querySelectorAll('.project-detail-thumb').forEach((t) => t.classList.remove('is-active'));
                thumb.classList.add('is-active');
                heroEl.style.backgroundImage = `url('${cssUrlForBackground(url)}')`;
            });
            thumbsEl.appendChild(thumb);
        });
    }

    platformEl.textContent = project.platform || 'Project';
    titleEl.textContent = project.title || '';
    descEl.textContent = project.description || '';

    const techList = (project.technologies || '').split(',').map((t) => t.trim()).filter(Boolean);
    techEl.innerHTML = techList.map((tech) => `<span class="tech-tag">${tech}</span>`).join('');

    if (project.project_link) {
        linkEl.href = project.project_link;
        linkEl.style.display = '';
    } else {
        linkEl.style.display = 'none';
    }

    // Populate Case Study sections if fields exist
    const studySection = document.getElementById('projectCaseStudySection');
    const detailProblem = document.getElementById('projectDetailProblem');
    const detailRole = document.getElementById('projectDetailRole');
    const detailFeatures = document.getElementById('projectDetailFeatures');
    const detailChallenges = document.getElementById('projectDetailChallenges');
    const detailResults = document.getElementById('projectDetailResults');
    const githubLinkEl = document.getElementById('projectDetailGithub');

    const hasCaseStudy = project.client_need || project.my_role || project.key_features || project.challenges_solved || project.results_impact;

    if (hasCaseStudy && studySection) {
        studySection.style.display = 'block';
        
        if (detailProblem) {
            detailProblem.textContent = project.client_need || '';
            const group = document.getElementById('caseStudyProblemGroup');
            if (group) group.style.display = project.client_need ? 'block' : 'none';
        }
        if (detailRole) {
            detailRole.textContent = project.my_role || '';
            const group = document.getElementById('caseStudyRoleGroup');
            if (group) group.style.display = project.my_role ? 'block' : 'none';
        }
        if (detailFeatures) {
            detailFeatures.textContent = project.key_features || '';
            const group = document.getElementById('caseStudyFeaturesGroup');
            if (group) group.style.display = project.key_features ? 'block' : 'none';
        }
        if (detailChallenges) {
            detailChallenges.textContent = project.challenges_solved || '';
            const group = document.getElementById('caseStudyChallengesGroup');
            if (group) group.style.display = project.challenges_solved ? 'block' : 'none';
        }
        if (detailResults) {
            detailResults.textContent = project.results_impact || '';
            const group = document.getElementById('caseStudyResultsGroup');
            if (group) group.style.display = project.results_impact ? 'block' : 'none';
        }
    } else if (studySection) {
        studySection.style.display = 'none';
    }

    if (githubLinkEl) {
        if (project.github_link) {
            githubLinkEl.href = project.github_link;
            githubLinkEl.style.display = '';
        } else {
            githubLinkEl.style.display = 'none';
        }
    }

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeProjectDetail() {
    const overlay = document.getElementById('projectDetailOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/** Add +N badge to static HTML cards that list multiple URLs in `data-project-image-urls`. */
function applyPortfolioCardStagger(grid) {
    grid.querySelectorAll('.portfolio-item').forEach((el, i) => {
        el.style.setProperty('--stagger', String(i));
    });
}

function decorateStaticPortfolioImageBadges(grid) {
    grid.querySelectorAll('.portfolio-item').forEach((card) => {
        const raw = card.getAttribute('data-project-image-urls') || '';
        const urls = dedupeUrlsPreserveOrder(
            raw
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
        );
        if (urls.length <= 1) return;
        const wrap = card.querySelector('.portfolio-image');
        if (!wrap || wrap.querySelector('.portfolio-image-count')) return;
        const extra = urls.length - 1;
        const badge = document.createElement('span');
        badge.className = 'portfolio-image-count';
        badge.setAttribute('aria-label', `${extra} more images`);
        badge.textContent = `+${extra}`;
        wrap.appendChild(badge);
    });
}

export async function initPortfolio() {
    const portfolioGrid = document.getElementById('portfolioGrid') || document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;

    portfolioGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.portfolio-item');
        if (!card) return;
        if (e.target.closest('a[href^="http"]')) return;
        e.preventDefault();
        const project = getProjectFromCard(card);
        if (project) openProjectDetail(project);
    });

    const overlay = document.getElementById('projectDetailOverlay');
    if (overlay) {
        overlay.querySelector('.project-detail-backdrop')?.addEventListener('click', closeProjectDetail);
        overlay.querySelector('.project-detail-close')?.addEventListener('click', closeProjectDetail);
        const backLink = overlay.querySelector('.project-detail-back');
        backLink?.addEventListener('click', (e) => {
            e.preventDefault();
            closeProjectDetail();
            document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    try {
        if (!LOAD_PORTFOLIO_FROM_SUPABASE) {
            applyPortfolioCardStagger(portfolioGrid);
            decorateStaticPortfolioImageBadges(portfolioGrid);
            return;
        }

        const { data, error } = await fetchPublicProjects(48);
        if (error) {
            console.error('Error loading portfolio:', error);
            return;
        }
        if (!data || data.length === 0) return;

        portfolioProjectsCache = data;
        if (typeof window !== 'undefined') window.portfolioProjects = data;

        const escapeHtml = (s) =>
            String(s ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');

        portfolioGrid.innerHTML = data
            .map((project, index) => {
                const technologies = (project.technologies || '')
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                const techTags = technologies.map((tech) => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('');
                const imageUrls = normalizeProjectImageUrls(project);
                const mainImage = imageUrls[0] || '';
                const mainImageCss = String(mainImage).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                const extraImageCount = imageUrls.length > 1 ? imageUrls.length - 1 : 0;
                const title = escapeHtml(project.title);
                const desc = escapeHtml(project.description);
                const platform = escapeHtml(project.platform);
                return `
                <div class="portfolio-item" data-index="${index}">
                    <div class="portfolio-image" style="${mainImage ? `background-image: url('${mainImageCss}'); background-size: cover; background-position: center;` : ''}">
                        <div class="portfolio-overlay">
                            <span class="portfolio-platform">${platform}</span>
                        </div>
                        ${
                            extraImageCount > 0
                                ? `<span class="portfolio-image-count" aria-label="${extraImageCount} more images">+${extraImageCount}</span>`
                                : ''
                        }
                    </div>
                    <div class="portfolio-content" style="display: flex; flex-direction: column; min-height: 160px; justify-content: space-between;">
                        <div>
                            <h3 class="portfolio-title">${title}</h3>
                            <p class="portfolio-description">${desc}</p>
                        </div>
                        <div>
                            <div class="portfolio-tech" style="margin-bottom: 0.75rem;">
                                ${techTags}
                            </div>
                            <div class="portfolio-action-row" style="border-top: 1px solid var(--border-color); padding-top: 0.6rem; margin-top: 0.4rem;">
                                <span class="btn-case-study" style="font-size: 0.8125rem; font-weight: 600; color: var(--primary-color); display: inline-flex; align-items: center; gap: 0.25rem;">
                                    View Case Study
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.2s;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            })
            .join('');

        applyPortfolioCardStagger(portfolioGrid);
        observeScrollReveal(portfolioGrid.querySelectorAll('.portfolio-item'));
    } catch (err) {
        console.error('Error loading portfolio:', err);
    }
}
