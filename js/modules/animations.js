/** Scroll-triggered fade-in and skill bar animation. */

const REVEAL_OBSERVER_OPTIONS = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
};

/** @type {IntersectionObserver | null} */
let scrollRevealObserver = null;

function ensureScrollRevealObserver() {
    if (!scrollRevealObserver) {
        scrollRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, REVEAL_OBSERVER_OPTIONS);
    }
    return scrollRevealObserver;
}

/**
 * Same scroll fade-in as the rest of the site: adds `.fade-in`, observes until `.visible`.
 * Use after injecting nodes (blog cards, Supabase portfolio/team/reviews).
 */
export function observeScrollReveal(elements) {
    const obs = ensureScrollRevealObserver();
    for (const el of Array.from(elements || [])) {
        if (!el || el.nodeType !== 1) continue;
        el.classList.add('fade-in');
        obs.observe(el);
    }
}

export function initScrollAnimations() {
    const observer = ensureScrollRevealObserver();

    const animateElements = document.querySelectorAll(
        [
            '.skill-category',
            '.portfolio-item',
            '.service-card',
            '.review-card',
            '.about-text',
            '.contact-item',
            '.section-title',
            '.section-subtitle',
            '.blog-filters',
            '.careers-content',
        ].join(',')
    );
    animateElements.forEach((el) => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    const skillBars = document.querySelectorAll('.skill-progress');
    const skillObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const progressBar = entry.target;
                    const width = progressBar.style.width;
                    progressBar.style.width = '0';
                    setTimeout(() => {
                        progressBar.style.width = width;
                    }, 100);
                    skillObserver.unobserve(progressBar);
                }
            });
        },
        { threshold: 0.5 }
    );
    skillBars.forEach((bar) => skillObserver.observe(bar));

    document.querySelectorAll('.portfolio-image').forEach((img) => {
        img.addEventListener('load', () => {
            img.style.opacity = '1';
        });
    });
}
