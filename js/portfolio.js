/* =========================================
   BLANCO GROSSO — Portfolio Interactivity
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    initPortfolioIcons();

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

/**
 * Enhanced Tool Icons with SVG injection and hover labels
 */
const iconMap = {
    'ps': 'adobe photoshop.png',
    'photoshop': 'adobe photoshop.png',
    'ai': 'adobe illustrator.png',
    'illustrator': 'adobe illustrator.png',
    'pr': 'adobe premiere.png',
    'premiere': 'adobe premiere.png',
    'lr': 'adobe lightroom.png',
    'lightroom': 'adobe lightroom.png',
    'cc': 'capcut.png',
    'capcut': 'capcut.png',
    'gpt': 'chatGPT.png',
    'chatgpt': 'chatGPT.png',
    'gemini': 'gemini.png',
    'claude': 'claude.png',
    'flow': 'flow.png',
    'freepik': 'freepik.png',
    'suno': 'suno.png',
    'heygen': 'heygen.png',
    'lovable': 'lovable.webp',
    'antigravity': 'antigravity.webp'
};

/* Full display names for abbreviated tool tags */
const displayNames = {
    'ps': 'PHOTOSHOP',
    'photoshop': 'PHOTOSHOP',
    'ai': 'ILLUSTRATOR',
    'illustrator': 'ILLUSTRATOR',
    'pr': 'PREMIERE',
    'premiere': 'PREMIERE',
    'lr': 'LIGHTROOM',
    'lightroom': 'LIGHTROOM',
    'cc': 'CAPCUT',
    'capcut': 'CAPCUT',
};

function initPortfolioIcons() {
    const tags = document.querySelectorAll('.pc-tools span');
    
    tags.forEach(tag => {
        const name = tag.textContent.trim().toLowerCase();
        const labelText = displayNames[name] || tag.textContent.trim().toUpperCase();
        
        const img = new Image();
        if (iconMap[name]) {
            img.src = `img/icons/${iconMap[name]}`;
        } else {
            img.src = `img/icons/${name}.svg`;
        }
        img.className = 'tool-icon';
        
        img.onload = () => {
            tag.innerHTML = '';
            tag.appendChild(img);
            const span = document.createElement('span');
            span.className = 'tool-name';
            span.textContent = labelText;
            tag.appendChild(span);
        };

        img.onerror = () => {
            if (img.src.endsWith('.svg')) {
                img.src = `img/icons/${name}.png`;
            }
        };
    });
}

function initToolsTicker() {
    const tickerTools = [
        { name: 'Photoshop', file: 'adobe photoshop.png' },
        { name: 'Illustrator', file: 'adobe illustrator.png' },
        { name: 'Premiere', file: 'adobe premiere.png' },
        { name: 'Lightroom', file: 'adobe lightroom.png' },
        { name: 'CapCut', file: 'capcut.png' },
        { name: 'ChatGPT', file: 'chatGPT.png' },
        { name: 'Gemini', file: 'gemini.png' },
        { name: 'Claude', file: 'claude.png' },
        { name: 'Flow', file: 'flow.png' },
        { name: 'Freepik', file: 'freepik.png' },
        { name: 'Suno', file: 'suno.png' },
        { name: 'HeyGen', file: 'heygen.png' },
        { name: 'Lovable', file: 'lovable.webp' },
        { name: 'Antigravity', file: 'antigravity.webp' }
    ];
    
    const ticker = document.getElementById('tools-ticker');
    const tickerDup = document.getElementById('tools-ticker-dup');
    
    if (!ticker) return;

    const createTickerItem = (tool) => {
        const item = document.createElement('div');
        item.className = 'ticker-item';
        // Always display since we know the files exist
        item.style.display = 'flex';

        const img = new Image();
        img.src = `img/icons/${tool.file}`;
        img.className = 'tool-icon';

        const span = document.createElement('span');
        span.textContent = tool.name;

        item.appendChild(img);
        item.appendChild(span);
        return item;
    };

    tickerTools.forEach(tool => {
        ticker.appendChild(createTickerItem(tool));
        tickerDup.appendChild(createTickerItem(tool));
    });
}

// Update initialization to include the ticker
document.addEventListener('DOMContentLoaded', () => {
    initToolsTicker();
});
