import { fetchVisibleReviews } from '../services/reviewService.js';
import { escapeHtml } from '../utils/helpers.js';
import { observeScrollReveal } from './animations.js';

export async function initReviews() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    try {
        const { data, error } = await fetchVisibleReviews(12);
        if (error) throw error;

        const hasSupabaseReviews = data && data.length > 0;
        const additionalContainer = document.getElementById('additionalReviewsContainer');

        if (hasSupabaseReviews) {
            const starsHtml = (rating) => {
                const full = '<span class="star filled" aria-hidden="true">★</span>';
                const empty = '<span class="star" aria-hidden="true">★</span>';
                return full.repeat(rating) + empty.repeat(5 - rating);
            };

            grid.innerHTML = data
                .map((review) => {
                    const rating = Math.min(5, Math.max(1, review.rating || 5));
                    const name = escapeHtml(review.client_name || '');
                    const text = escapeHtml(review.review_text || '');
                    const role = escapeHtml(review.role_or_location || '');
                    return `
                    <div class="review-card fade-in">
                        <div class="review-stars" aria-label="${rating} out of 5 stars">
                            ${starsHtml(rating)}
                        </div>
                        <blockquote class="review-text">${text}</blockquote>
                        <div class="review-author">
                            <span class="review-name">${name}</span>
                            ${role ? `<span class="review-role">${role}</span>` : ''}
                        </div>
                    </div>
                `;
                })
                .join('');

            if (additionalContainer) {
                additionalContainer.style.display = 'block';
            }
            observeScrollReveal(grid.querySelectorAll('.review-card'));
        } else {
            if (additionalContainer) {
                additionalContainer.style.display = 'none';
            }
        }

        // Calculate average rating dynamically combining static Upwork reviews (5.0, 4.7) and Supabase reviews
        const staticRatings = [5.0, 4.7];
        const supabaseRatings = hasSupabaseReviews ? data.map(r => Math.min(5, Math.max(1, r.rating || 5))) : [];
        const allRatings = [...staticRatings, ...supabaseRatings];
        const avg = (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(1);

        const summaryEl = document.querySelector('.reviews-summary-text');
        if (summaryEl) {
            summaryEl.innerHTML = `<strong>${avg}</strong> average rating from client reviews`;
        }
        const summaryStars = document.querySelector('.reviews-summary-stars');
        if (summaryStars) {
            const r = Math.round(parseFloat(avg));
            summaryStars.innerHTML =
                '<span class="star filled">★</span>'.repeat(r) + '<span class="star">★</span>'.repeat(5 - r);
        }
    } catch (err) {
        console.error('Error loading reviews:', err);
    }
}
