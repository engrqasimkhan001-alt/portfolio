/** Scroll-triggered fade-in and skill bar animation. */
export function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll(
        '.skill-category, .portfolio-item, .service-card, .review-card, .about-text, .contact-item'
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
