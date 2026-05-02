/**
 * Site entry — order matters: Supabase client before data modules.
 */
import './config/supabase.js';
import { initSplashLoader } from './modules/loader.js';
import { initNavbar } from './modules/navbar.js';
import { initScrollAnimations } from './modules/animations.js';
import { initPortfolio } from './modules/portfolio.js';
import { initTeam } from './modules/team.js';
import { initReviews } from './modules/reviews.js';
import { initBlog } from './modules/blog.js';
import { initForms } from './modules/forms.js';
import { initCursorHover } from './modules/cursorHover.js';
import { initScrollAmbience } from './modules/scrollAmbience.js';
import { initSiteContent } from './modules/siteContent.js';

initSplashLoader();

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initCursorHover();
    initScrollAmbience();
    initScrollAnimations();
    initForms();
    void initPortfolio();
    void initTeam();
    void initReviews();
    void initBlog();
    void initSiteContent();
});
