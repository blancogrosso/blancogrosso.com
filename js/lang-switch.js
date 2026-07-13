/**
 * Blanco Grosso - Language Switcher
 * Handles ES/EN toggling with persistence
 */

document.addEventListener('DOMContentLoaded', () => {
    const langToggles = document.querySelectorAll('.lang-toggle');
    const currentLang = localStorage.getItem('bg-lang') || 'es';

    // Set initial language
    setLanguage(currentLang);

    langToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = toggle.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    function setLanguage(lang) {
        if (lang === 'en') {
            document.body.classList.add('lang-en-active');
        } else {
            document.body.classList.remove('lang-en-active');
        }
        
        localStorage.setItem('bg-lang', lang);

        // Update active state on buttons
        langToggles.forEach(t => {
            if (t.getAttribute('data-lang') === lang) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
    }
});
