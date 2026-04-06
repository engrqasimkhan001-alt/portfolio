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
import { initForms } from './modules/forms.js';

initSplashLoader();

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollAnimations();
    initForms();
    void initPortfolio();
    void initTeam();
    void initReviews();
});
