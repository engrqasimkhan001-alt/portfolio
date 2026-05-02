/**
 * Scroll-driven background motion: hero parallax layers + subtle global page tint.
 * Disabled when prefers-reduced-motion is set.
 */

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function updateScrollAmbience() {
    const y = window.scrollY || 0;
    const doc = document.documentElement;
    const maxY = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const t = clamp01(y / maxY);

    doc.style.setProperty('--scroll-t', t.toFixed(4));
    doc.style.setProperty('--bg-shift-x', `${(y * 0.018).toFixed(1)}px`);
    doc.style.setProperty('--bg-shift-y', `${(y * 0.026).toFixed(1)}px`);

    const deep = document.querySelector('.home-parallax-bg__layer--deep');
    const front = document.querySelector('.home-parallax-bg__layer--front');
    if (deep) {
        deep.style.transform = `translate3d(${y * 0.035}px, ${y * 0.1}px, 0) rotate(${y * 0.018}deg)`;
    }
    if (front) {
        front.style.transform = `translate3d(${-y * 0.045}px, ${y * 0.07}px, 0) rotate(${-y * 0.01}deg)`;
    }
}

export function initScrollAmbience() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.setProperty('--scroll-t', '0');
        return;
    }

    let ticking = false;
    const onScrollOrResize = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            updateScrollAmbience();
        });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    updateScrollAmbience();
}
