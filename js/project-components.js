/**
 * BLANCO GROSSO — Project Components
 * Interactive elements for project detail pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    initComparisonSliders();
    initLightbox();
});

/**
 * Lightbox for zooming images
 */
function initLightbox() {
    const zoomables = document.querySelectorAll('[data-zoomable]');
    if (!zoomables.length) return;

    // Create overlay if not exists
    let overlay = document.querySelector('.lightbox-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = '<img class="lightbox-img" src="" alt="Zoomed image">';
        document.body.appendChild(overlay);
    }

    const lightboxImg = overlay.querySelector('.lightbox-img');

    zoomables.forEach(img => {
        img.classList.add('zoom-cursor');
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    overlay.addEventListener('click', () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

/**
 * Comparison Sliders (Before/After)
 */
function initComparisonSliders() {
    const sliders = document.querySelectorAll('.comparison-slider');
    
    sliders.forEach(slider => {
        const handle = slider.querySelector('.cs-handle');
        const overlay = slider.querySelector('.cs-overlay');
        const overlayInner = overlay.querySelector('.cs-overlay-inner');
        const container = slider;
        
        let isResizing = false;

        const setPosition = (x) => {
            const rect = container.getBoundingClientRect();
            let position = ((x - rect.left) / rect.width) * 100;
            
            // Bounds
            if (position < 0) position = 0;
            if (position > 100) position = 100;
            
            handle.style.left = `${position}%`;
            overlay.style.width = `${position}%`;
            
            // Keep inner container at full container width
            overlayInner.style.width = `${rect.width}px`;
        };

        const onMove = (e) => {
            if (!isResizing) return;
            const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            setPosition(x);
        };

        const onStart = () => isResizing = true;
        const onEnd = () => isResizing = false;

        handle.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        handle.addEventListener('touchstart', onStart);
        handle.addEventListener('touchmove', onMove);
        handle.addEventListener('touchend', onEnd);
        
        // Initial position and responsive width
        const init = () => {
            const rect = container.getBoundingClientRect();
            if (overlayInner) overlayInner.style.width = `${rect.width}px`;
            // center handle if it's the first run
            if (!handle.style.left) {
                 handle.style.left = `50%`;
                 overlay.style.width = `50%`;
            }
        };

        window.addEventListener('resize', init);
        init();
    });

    // Prompt Terminal Toggle
    const promptToggle = document.getElementById('prompt-toggle');
    const promptContent = document.getElementById('prompt-terminal-content');
    const promptOverlay = document.getElementById('prompt-overlay');

    if (promptToggle && promptContent) {
        promptToggle.addEventListener('click', () => {
            const isCollased = promptContent.style.maxHeight !== 'none';
            if (isCollased) {
                promptContent.style.maxHeight = 'none';
                if (promptOverlay) promptOverlay.style.display = 'none';
                promptToggle.querySelector('.lang-es').textContent = '- Ver menos';
                promptToggle.querySelector('.lang-en').textContent = '- View less';
            } else {
                promptContent.style.maxHeight = '200px';
                if (promptOverlay) promptOverlay.style.display = 'block';
                promptToggle.querySelector('.lang-es').textContent = '+ Ver prompt completo';
                promptToggle.querySelector('.lang-en').textContent = '+ View full prompt';
            }
        });
    }
}
