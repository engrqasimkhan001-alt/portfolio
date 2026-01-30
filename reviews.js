// Load client reviews from Supabase (visible only)
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    try {
        const supabase = window.supabaseClient;
        if (!supabase || typeof supabase.from !== 'function') return;

        const { data, error } = await supabase
            .from('client_reviews')
            .select('*')
            .eq('visible', true)
            .order('created_at', { ascending: false })
            .limit(12);

        if (error) throw error;
        if (!data || data.length === 0) return;

        const starsHtml = (rating) => {
            const full = '<span class="star filled" aria-hidden="true">★</span>';
            const empty = '<span class="star" aria-hidden="true">★</span>';
            return full.repeat(rating) + empty.repeat(5 - rating);
        };

        grid.innerHTML = data.map(review => {
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
        }).join('');

        // Update summary average
        const avg = (data.reduce((s, r) => s + (r.rating || 5), 0) / data.length).toFixed(1);
        const summaryEl = document.querySelector('.reviews-summary-text');
        if (summaryEl) {
            summaryEl.innerHTML = `<strong>${avg}</strong> average rating from client reviews`;
        }
        const summaryStars = document.querySelector('.reviews-summary-stars');
        if (summaryStars) {
            const r = Math.round(parseFloat(avg));
            summaryStars.innerHTML = '<span class="star filled">★</span>'.repeat(r) + '<span class="star">★</span>'.repeat(5 - r);
        }

        // Observe for scroll animation
        const cards = grid.querySelectorAll('.review-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        cards.forEach(card => observer.observe(card));
    } catch (err) {
        console.error('Error loading reviews:', err);
    }
});

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
