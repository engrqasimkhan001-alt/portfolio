import { SPLASH_MIN_MS } from '../utils/constants.js';

/** Splash screen: min display time, progress bar, reveal .reveal-item on hide. */
export function initSplashLoader() {
    const MIN_DISPLAY_MS = SPLASH_MIN_MS;
    const loader = document.getElementById('appLoader');
    const progressBar = loader?.querySelector('.loader-progress');
    const start = Date.now();
    let ready = false;

    function hideLoader() {
        if (!loader) return;
        document.querySelectorAll('.reveal-item').forEach((el) => el.classList.add('revealed'));
        loader.classList.add('loader-hidden');
        loader.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 650);
    }

    function tryHide() {
        const elapsed = Date.now() - start;
        if (ready && elapsed >= MIN_DISPLAY_MS) hideLoader();
    }

    if (progressBar) {
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min(100, (elapsed / MIN_DISPLAY_MS) * 98);
            progressBar.style.width = `${pct}%`;
            progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
            if (pct >= 98) clearInterval(progressInterval);
        }, 50);
    }

    window.addEventListener('load', () => {
        ready = true;
        tryHide();
    });
    if (document.readyState === 'complete') {
        ready = true;
        tryHide();
    }
    setTimeout(() => {
        ready = true;
        document.querySelectorAll('.reveal-item').forEach((el) => el.classList.add('revealed'));
        tryHide();
    }, MIN_DISPLAY_MS + 500);
}
