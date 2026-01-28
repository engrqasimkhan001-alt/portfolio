// Load portfolio projects from Supabase
document.addEventListener('DOMContentLoaded', async () => {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    
    if (!portfolioGrid) return;

    try {
        // Check if Supabase is configured
        const supabase = window.supabaseClient;
        if (!supabase || typeof supabase.from !== 'function') {
            console.log('Supabase not available, keeping static projects');
            return;
        }

        // Fetch projects from Supabase
        const { data, error } = await supabase
            .from('portfolio_projects')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(12); // Limit to 12 most recent projects

        if (error) {
            console.error('Error loading portfolio:', error);
            // Keep default static projects on error
            return;
        }

        if (!data || data.length === 0) {
            // Keep default static projects if no data
            return;
        }

        // Replace portfolio grid with database projects
        portfolioGrid.innerHTML = data.map(project => {
            const technologies = project.technologies.split(',').map(t => t.trim());
            const techTags = technologies.map(tech => 
                `<span class="tech-tag">${tech}</span>`
            ).join('');

            return `
                <div class="portfolio-item fade-in">
                    <div class="portfolio-image" style="${project.image_url ? `background-image: url('${project.image_url}'); background-size: cover; background-position: center;` : ''}">
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
                        ${project.project_link ? `
                            <div style="margin-top: 1rem;">
                                <a href="${project.project_link}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                                    View Project →
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Animate portfolio items on scroll
        const portfolioItems = portfolioGrid.querySelectorAll('.portfolio-item');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        portfolioItems.forEach(item => {
            observer.observe(item);
        });

    } catch (error) {
        console.error('Error loading portfolio:', error);
        // Keep default static projects on error
    }
});
