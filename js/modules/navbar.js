import { debounce } from '../utils/helpers.js';

export function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navbar || !hamburger || !navMenu) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 70;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('scroll', () => {
        let current = '';
        document.querySelectorAll('section[id]').forEach((section) => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 100) {
                current = section.getAttribute('id') || '';
            }
        });
        navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    let lastScrollTop = 0;
    window.addEventListener(
        'scroll',
        () => {
            if (navMenu.classList.contains('active')) {
                window.scrollTo(0, lastScrollTop);
            } else {
                lastScrollTop = window.scrollY;
            }
        },
        { passive: false }
    );

    window.addEventListener('scroll', debounce(() => {}, 10));
}
