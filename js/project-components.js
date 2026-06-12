/**
 * BLANCO GROSSO — Project Components
 * Interactive elements for project detail pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    initComparisonSliders();
    initLightbox();
    initToolIcons();
    initIphoneRotation();
});

/**
 * iPhone Rotation logic
 */
function initIphoneRotation() {
    const frame = document.getElementById('auto-rotate-phone');
    const video = document.getElementById('reel-video');
    const muteBtn = document.getElementById('mute-toggle');
    
    if (frame) {
        // Auto rotate after 2.5 seconds
        setTimeout(() => {
            frame.classList.add('rotated');
        }, 2500);
    }
    
    if (video && muteBtn) {
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent video play/pause
            video.muted = !video.muted;
            if (video.muted) {
                muteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-muted"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
            } else {
                muteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-unmuted"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
            }
        });
        
        // Add click to pause/play
        video.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
    }
}

/**
 * Enhanced Tool Icons with SVG injection and hover labels
 */
/**
 * Optimized Tool Icons - Silent Loading to prevent browser spinner
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

function initToolIcons() {
    const tags = document.querySelectorAll('.stack-tag');
    
    tags.forEach(tag => {
        const name = tag.textContent.trim().toLowerCase();
        const originalText = tag.textContent.trim();
        
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
            span.textContent = originalText;
            tag.appendChild(span);
        };

        img.onerror = () => {
            if (img.src.endsWith('.svg')) {
                img.src = `img/icons/${name}.png`;
            }
        };
    });
}

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
