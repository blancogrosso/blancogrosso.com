/* =========================================
   BLANCO GROSSO — Portfolio Interactivity
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* ── Nav: scroll effect ── */
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    /* ── Nav: mobile toggle ── */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    /* ── Smooth scroll for anchor links ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = nav.offsetHeight + 10;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    /* ── Works filter ── */
    const filterBtns = document.querySelectorAll('.wf-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterBtns.length > 0 && projectCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                let delay = 0;

                projectCards.forEach(card => {
                    const categoryAttr = card.getAttribute('data-category') || '';
                    const categories = categoryAttr.split(/\s+/).filter(Boolean);
                    const match = filter === 'all' || categories.includes(filter);

                    if (match) {
                        card.style.display = '';
                        card.style.animation = 'none';
                        card.offsetHeight; // trigger reflow
                        card.style.animation = `cardReveal 0.4s var(--ease) ${delay * 0.05}s both`;
                        delay++;
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    /* ── Scroll reveal ── */
    const revealEls = document.querySelectorAll('.section-header, .lab-card, .service-card, .pb-step, .lab-copy, .lab-visual, .works-more, .contact-inner');
    revealEls.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));

    /* ── Active nav link on scroll ── */
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + nav.offsetHeight + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) {
                link.classList.toggle('active', scrollY >= top && scrollY < top + height);
            }
        });
    });
});

/* ── Card reveal keyframe (injected) ── */
const style = document.createElement('style');
style.textContent = `
@keyframes cardReveal {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
}
.nav-link.active { color: var(--accent) !important; }
`;
document.head.appendChild(style);
