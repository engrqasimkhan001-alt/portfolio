/**
 * Smooth cursor-following ring + scale on interactive targets.
 * Skipped on touch / reduced-motion (CSS also hides #cursor-hover-ring).
 */
const POINTER_SELECTORS = [
    'a[href]',
    'button',
    '[role="button"]',
    '.btn',
    '.btn-primary',
    '.btn-secondary',
    '.nav-link',
    '.portfolio-item',
    '.blog-card',
    '.review-card',
    '.team-member',
    '.service-card',
    '.skill-category',
    '.hamburger',
    'input[type="submit"]',
    '.file-upload-btn',
    '.scroll-indicator',
    '.social-link',
    '.brand-link',
    '.project-detail-close',
    '.blog-detail-close',
    '.position-item',
    '.contact-details a',
    'select',
].join(',');

function isPointerTarget(el) {
    if (!el || el.nodeType !== 1) return false;
    return Boolean(el.closest(POINTER_SELECTORS));
}

export function initCursorHover() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const ring = document.createElement('div');
    ring.id = 'cursor-hover-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;
    let visible = false;

    const lerp = 0.14;

    function tick() {
        currentX += (targetX - currentX) * lerp;
        currentY += (targetY - currentY) * lerp;
        ring.style.left = `${currentX}px`;
        ring.style.top = `${currentY}px`;
        const still = Math.abs(targetX - currentX) < 0.35 && Math.abs(targetY - currentY) < 0.35;
        if (visible || !still) {
            raf = requestAnimationFrame(tick);
        } else {
            raf = 0;
        }
    }

    function ensureLoop() {
        if (!raf) raf = requestAnimationFrame(tick);
    }

    function onMove(e) {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!visible) {
            visible = true;
            currentX = targetX;
            currentY = targetY;
            ring.style.left = `${currentX}px`;
            ring.style.top = `${currentY}px`;
            ring.classList.add('is-visible');
        }
        const under = document.elementFromPoint(e.clientX, e.clientY);
        ring.classList.toggle('is-pointer', isPointerTarget(under));
        ensureLoop();
    }

    function onLeave() {
        visible = false;
        ring.classList.remove('is-visible', 'is-pointer');
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onLeave);
}
