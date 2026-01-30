// Store projects for detail view (set when loading from Supabase)
window.portfolioProjects = null;

function getProjectFromCard(card) {
    const index = card.getAttribute('data-index');
    if (index != null && window.portfolioProjects && window.portfolioProjects[parseInt(index, 10)] != null) {
        return window.portfolioProjects[parseInt(index, 10)];
    }
    // Static fallback: read from data attributes
    const title = card.getAttribute('data-project-title');
    if (!title) return null;
    const technologies = (card.getAttribute('data-project-technologies') || '').split(',').map(t => t.trim()).filter(Boolean);
    return {
        title,
        platform: card.getAttribute('data-project-platform') || '',
        description: card.getAttribute('data-project-description') || '',
        technologies: technologies.join(', '),
        image_url: '',
        image_urls: [],
        project_link: card.getAttribute('data-project-link') || ''
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

    const images = (project.image_urls && project.image_urls.length) ? project.image_urls : (project.image_url ? [project.image_url] : []);
    const mainImage = images[0] || '';

    heroEl.style.backgroundImage = mainImage ? `url('${mainImage}')` : '';
    heroEl.style.backgroundSize = 'cover';
    heroEl.style.backgroundPosition = 'center';

    thumbsEl.innerHTML = '';
    if (images.length > 1) {
        images.forEach((url, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'project-detail-thumb' + (i === 0 ? ' is-active' : '');
            thumb.style.backgroundImage = `url('${url}')`;
            thumb.setAttribute('aria-label', 'View image ' + (i + 1));
            thumb.addEventListener('click', () => {
                thumbsEl.querySelectorAll('.project-detail-thumb').forEach(t => t.classList.remove('is-active'));
                thumb.classList.add('is-active');
                heroEl.style.backgroundImage = `url('${url}')`;
            });
            thumbsEl.appendChild(thumb);
        });
    }

    platformEl.textContent = project.platform || 'Project';
    titleEl.textContent = project.title || '';
    descEl.textContent = project.description || '';

    const techList = (project.technologies || '').split(',').map(t => t.trim()).filter(Boolean);
    techEl.innerHTML = techList.map(tech => `<span class="tech-tag">${tech}</span>`).join('');

    if (project.project_link) {
        linkEl.href = project.project_link;
        linkEl.style.display = '';
    } else {
        linkEl.style.display = 'none';
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

// Load portfolio projects from Supabase
document.addEventListener('DOMContentLoaded', async () => {
    const portfolioGrid = document.getElementById('portfolioGrid') || document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;

    // Click delegation: open project detail when a card is clicked
    portfolioGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.portfolio-item');
        if (!card) return;
        // Ignore if user clicked a link that goes elsewhere
        if (e.target.closest('a[href^="http"]')) return;
        e.preventDefault();
        const project = getProjectFromCard(card);
        if (project) openProjectDetail(project);
    });

    // Close detail overlay
    const overlay = document.getElementById('projectDetailOverlay');
    if (overlay) {
        overlay.querySelector('.project-detail-backdrop').addEventListener('click', closeProjectDetail);
        overlay.querySelector('.project-detail-close').addEventListener('click', closeProjectDetail);
        const backLink = overlay.querySelector('.project-detail-back');
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeProjectDetail();
            const portfolio = document.getElementById('portfolio');
            if (portfolio) {
                portfolio.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    try {
        const supabase = window.supabaseClient;
        if (!supabase || typeof supabase.from !== 'function') {
            return;
        }

        const { data, error } = await supabase
            .from('portfolio_projects')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(12);

        if (error) {
            console.error('Error loading portfolio:', error);
            return;
        }

        if (!data || data.length === 0) return;

        window.portfolioProjects = data;

        portfolioGrid.innerHTML = data.map((project, index) => {
            const technologies = project.technologies.split(',').map(t => t.trim());
            const techTags = technologies.map(tech =>
                `<span class="tech-tag">${tech}</span>`
            ).join('');
            const mainImage = (project.image_urls && project.image_urls[0]) || project.image_url || '';

            return `
                <div class="portfolio-item fade-in" data-index="${index}">
                    <div class="portfolio-image" style="${mainImage ? `background-image: url('${mainImage}'); background-size: cover; background-position: center;` : ''}">
                        <div class="portfolio-overlay">
                            <span class="portfolio-platform">${project.platform}</span>
                        </div>
                    </div>
                    <div class="portfolio-content">
                        <h3 class="portfolio-title">${project.title}</h3>
                        <p class="portfolio-description">${project.description}</p>
                        <div class="portfolio-tech">
                            ${techTags}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const portfolioItems = portfolioGrid.querySelectorAll('.portfolio-item');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        portfolioItems.forEach(item => observer.observe(item));

    } catch (error) {
        console.error('Error loading portfolio:', error);
    }
});
