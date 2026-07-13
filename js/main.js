/* =========================================
   BLANCO GROSSO — Works Data
   =========================================
   HOW TO ADD A NEW WORK:
   1. Put your cover image in img/works/ (e.g., img/works/my-project.jpg)
   2. Copy a work-card block from old-works.html
   3. Update: data-category, image src, title, tag, and tools
      CATEGORIES AVAILABLE:
    - sport    → Sport Design
    - ai       → AI-Powered
    - digital  → Digital Content
    - brand    → Brand Systems
    - product  → Product Design
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const workCards = document.querySelectorAll('.work-card');
    const emptyState = document.querySelector('.empty-state');

    // Stagger animation on load
    workCards.forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            let visibleCount = 0;

            workCards.forEach((card, i) => {
                const categoryAttr = card.getAttribute('data-category') || '';
                const categories = categoryAttr.split(/\s+/).filter(Boolean);
                const match = filter === 'all' || categories.includes(filter);

                if (match) {
                    card.style.display = '';
                    card.style.animation = 'none';
                    card.offsetHeight; // trigger reflow
                    card.style.animation = `cardFade 0.4s ease-out ${visibleCount * 0.04}s both`;
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Show empty state if no results
            if (emptyState) {
                emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        });
    });
});
