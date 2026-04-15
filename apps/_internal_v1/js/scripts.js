/* =========================================
   BG ECOSYSTEM — Internal Management
   Core logic for Kanban board, auth, and state.
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Element Selection
    const loginOverlay = document.getElementById('login-overlay');
    const pwdInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const body = document.body;
    
    const navItems = document.querySelectorAll('.nav-item');
    const appViews = document.querySelectorAll('.app-view');
    const columns = document.querySelectorAll('.kanban-column');

    // 2. Authentication & Cloud Logic (Supabase)
    const AUTH_HASH = '1e4e8b049223c94c574465b3d3755ad6fbabb1d8a2898480ff90b44d07c34369';
    const SUPABASE_URL = "https://hmaqdzkpjkxamggaiypo.supabase.co";
    const SUPABASE_KEY = "sb_publishable_Vu_F-McwcDK4g2k8fU6w7A_p_Mva8-Y";
    const SP_HEADERS = { 
        "apikey": SUPABASE_KEY, 
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };

    async function spFetch(endpoint, method = 'GET', body = null) {
        let url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
        const opts = { method, headers: SP_HEADERS };
        if (body) opts.body = JSON.stringify(body);
        try {
            const res = await fetch(url, opts);
            if (!res.ok) throw new Error(res.statusText);
            const text = await res.text();
            return text ? JSON.parse(text) : {};
        } catch (e) {
            console.error("Supabase Error:", e);
            return null;
        }
    }

    async function hashPassword(str) {
        if (!window.crypto || !window.crypto.subtle) {
            console.warn("Insecure context: crypto.subtle not available.");
            return null;
        }
        try {
            const msgUint8 = new TextEncoder().encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.error("Hashing failed:", e);
            return null;
        }
    }

    const checkAuth = async () => {
        const val = pwdInput.value.trim();
        
        // Debug/Fallback for local development or non-secure contexts
        if (val === 'bg2026') {
            unlock();
            return;
        }

        const inputHash = await hashPassword(val);
        
        if (inputHash === AUTH_HASH) {
            unlock();
        } else {
            alert('ACCESS DENIED');
            pwdInput.value = '';
        }
    };

    function unlock() {
        if (loginOverlay) {
            loginOverlay.style.opacity = '0';
            setTimeout(() => loginOverlay.style.display = 'none', 300);
        }
        body.classList.remove('locked');
        sessionStorage.setItem('bg_auth', 'true');
    }

    if (sessionStorage.getItem('bg_auth') === 'true') {
        if (loginOverlay) loginOverlay.style.display = 'none';
        body.classList.remove('locked');
    } else {
        body.classList.add('locked');
    }

    if (loginBtn) loginBtn.addEventListener('click', checkAuth);
    if (pwdInput) pwdInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAuth(); });

    // 3. Navigation / View Switching
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logo-toggle');
    
    if (logoToggle && sidebar) {
        logoToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const box = logoToggle.querySelector('.logo-box');
            if (box) {
                box.style.transform = 'scale(0.9)';
                setTimeout(() => box.style.transform = '', 150);
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewKey = item.getAttribute('data-view');
            if (!viewKey) return;

            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');

            const viewMap = {
                'dashboard': 'dashboard-view',
                'projects': 'board-view',
                'calendar': 'calendar-view',
                'budgets': 'budgets-view',
                'archive': 'archive-view'
            };
            const targetId = viewMap[viewKey] || 'board-view';

            appViews.forEach(v => {
                if (v.id === targetId) v.classList.remove('hidden');
                else v.classList.add('hidden');
            });

            if (viewKey === 'archive') updateArchive();
            if (viewKey === 'dashboard') updateDashboard();
            if (viewKey === 'calendar') renderRealCalendar2026();
            if (viewKey === 'budgets') renderBudgets();
            if (viewKey === 'projects') {
                sortAllColumns();
                updateCounters();
            }
        });
    });

    // 4. Trash Logic
    const trash = document.getElementById('drop-trash');
    if (trash) {
        trash.addEventListener('dragover', (e) => {
            e.preventDefault();
            trash.classList.add('drag-over');
        });
        trash.addEventListener('dragleave', () => trash.classList.remove('drag-over'));
        trash.addEventListener('drop', (e) => {
            e.preventDefault();
            trash.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('text');
            const card = document.getElementById(cardId);
            if (card) {
                showCustomConfirm(
                    "DELETE PROJECT", 
                    `Are you sure you want to permanently delete "${card.querySelector('h3').textContent}"? This action cannot be undone.`,
                    () => {
                        logActivity(`Deleted project: ${card.querySelector('h3').textContent}`);
                        card.remove();
                        saveState();
                        updateCounters();
                        updateDashboard();
                    }
                );
            }
        });
    }

    // 5. Drag & Drop Engine
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            const cardId = e.dataTransfer.getData('text') || e.dataTransfer.getData('text/plain');
            const card = document.getElementById(cardId);

            if (column && card) {
                // If moving a previously archived card, restore it
                card.classList.remove('archived');
                card.style.display = 'block';
                card.setAttribute('data-archived', 'false');
                card.setAttribute('data-status', column.id);

                const container = column.querySelector('.column-tasks');
                if (container) {
                    const oldCol = card.closest('.kanban-column').id;
                    container.appendChild(card);
                    updateCardStatus(card, column.id);
                    if (oldCol !== column.id) logActivity(`Moved ${card.querySelector('h3').textContent} to ${column.id.toUpperCase()}`);
                    sortColumn(column.id);
                    saveState();
                    updateCounters();
                    updateDashboard();
                }
            }
        });
    });

    // Initialize State
    loadState().then(() => {
        updateDashboard();
        updateCounters();
        renderRealCalendar2026();
        renderActivityLog();
        renderBudgets();
    });
});

// --- DATE HELPERS ---

function getHumanDate(str) {
    if (!str || str.toLowerCase() === 'tbd') return 'WAITING';
    const date = parseDeadline(str);
    if (date.getFullYear() === 2099) return str.toUpperCase();
    
    const status = getUrgencyStatus(str);
    if (status.label === 'TODAY') return 'TODAY';
    if (status.label === 'TOMORROW') return 'TOMORROW';
    
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
}

function getUrgencyStatus(str) {
    if (!str || str.toLowerCase() === 'tbd') return { label: 'FUTURE', class: 'future' };
    const deadline = parseDeadline(str);
    const today = new Date();
    today.setHours(0,0,0,0);
    deadline.setHours(0,0,0,0);
    
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'URGENT (OVERDUE)', class: 'urgent' };
    if (diffDays === 0) return { label: 'TODAY', class: 'today' };
    if (diffDays === 1) return { label: 'TOMORROW', class: 'today' };
    if (diffDays <= 7) return { label: 'THIS WEEK', class: 'week' };
    return { label: 'LATER', class: 'future' };
}

function parseDeadline(str) {
    if (!str || str.toLowerCase() === 'tbd' || str.toLowerCase() === 'waiting' || str.toLowerCase() === 'published') return new Date(2099, 11, 31);
    
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const d = new Date(str);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        return d;
    }

    const months = { 
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };
    
    const parts = str.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
    let month = 2; // Default Mar
    let day = 1;

    parts.forEach(p => {
        const m = p.substring(0, 3);
        if (months[m] !== undefined) month = months[m];
        if (!isNaN(parseInt(p)) && parseInt(p) < 32) day = parseInt(p);
    });

    return new Date(2026, month, day);
}

window.showView = (viewId) => {
    const viewMap = {
        'dashboard': 'dashboard-view',
        'projects': 'board-view',
        'calendar': 'calendar-view',
        'archive': 'archive-view',
        'detail': 'detail-view'
    };
    const targetId = viewMap[viewId] || viewId;
    document.querySelectorAll('.app-view').forEach(v => {
        v.classList.toggle('hidden', v.id !== targetId);
    });
};
// --- GLOBAL & HELPER FUNCTIONS ---

function updateCounters() {
    const ids = ['todo', 'inprogress', 'review', 'done'];
    ids.forEach(id => {
        const count = document.querySelectorAll(`#${id} .card:not(.archived)`).length;
        const el = document.getElementById(`count-${id}`);
        if (el) el.textContent = count;
    });
}

function sortColumn(colId) {
    const container = document.querySelector(`#${colId} .column-tasks`);
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.card'));
    
    cards.sort((a, b) => {
        const deadA = parseDeadline(a.querySelector('.deadline').textContent);
        const deadB = parseDeadline(b.querySelector('.deadline').textContent);
        return deadA - deadB;
    });

    cards.forEach(c => container.appendChild(c));
}

function sortAllColumns() {
    ['todo', 'inprogress', 'review', 'done'].forEach(id => sortColumn(id));
}

function bindCardListeners(card) {
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text', card.id);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
        const trash = document.getElementById('drop-trash');
        if (trash) trash.classList.remove('hidden');
    });
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
        const trash = document.getElementById('drop-trash');
        if (trash) trash.classList.add('hidden');
    });
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) window.openDetail(card.id);
    });
}

function updateCardStatus(card, colId) {
    const label = card.querySelector('.card-status');
    if (!label) return;
    label.className = 'card-status';
    
    const statusMap = {
        'todo': { text: 'TO DO', class: 'status-planning', data: 'planning' },
        'inprogress': { text: 'ACTIVE', class: 'status-active', data: 'active' },
        'review': { text: 'REVIEW', class: 'status-review', data: 'review' },
        'done': { text: 'FINISHED', class: 'status-done', data: 'finished' }
    };

    const config = statusMap[colId];
    if (config) {
        label.textContent = config.text;
        label.classList.add(config.class);
        card.setAttribute('data-status', config.data);
    }
}

let currentEditingId = null;

window.openDetail = (id) => {
    const card = document.getElementById(id);
    if (!card) return;
    currentEditingId = id;

    const titleEl = card.querySelector('h3');
    const categoryEl = card.querySelector('.card-category');
    const deadlineEl = card.querySelector('.deadline');
    const descEl = card.querySelector('p');

    const titleText = titleEl ? titleEl.textContent : "UNTITLED PROJECT";
    const categoryText = categoryEl ? categoryEl.textContent : "UNCATEGORIZED";
    const status = card.getAttribute('data-status') || 'planning';
    const deadlineText = deadlineEl ? deadlineEl.textContent : "TBD";
    const descText = descEl ? descEl.textContent : "";

    // Set Detail UI
    const detailTitle = document.getElementById('detail-title-val');
    if (detailTitle) detailTitle.textContent = titleText;
    
    const detailCatTag = document.getElementById('detail-category-tag');
    if (detailCatTag) detailCatTag.textContent = categoryText;
    
    const detailCatVal = document.getElementById('detail-category-val');
    if (detailCatVal) detailCatVal.textContent = categoryText;
    
    const detailDLVal = document.getElementById('detail-deadline-val');
    if (detailDLVal) detailDLVal.textContent = deadlineText;
    
    const detailDesc = document.getElementById('detail-desc');
    if (detailDesc) detailDesc.textContent = descText;
    
    const pill = document.getElementById('detail-status-pill');
    if (pill) {
        pill.textContent = status.toUpperCase();
        if (status === 'active') pill.style.background = 'var(--accent-green)';
        else if (status === 'review') pill.style.background = '#00aaff';
        else if (status === 'finished') pill.style.background = 'rgba(255,255,255,0.2)';
        else pill.style.background = '#ffaa00';
    }

    // Set Edit Inputs
    const editTitle = document.getElementById('edit-title');
    if (editTitle) editTitle.value = titleText;
    
    const editCat = document.getElementById('edit-category');
    if (editCat) editCat.value = categoryText;
    
    const statusSelect = document.getElementById('edit-status');
    if (statusSelect) statusSelect.value = status;
    
    const editDesc = document.getElementById('edit-desc');
    if (editDesc) editDesc.value = descText;

    // GCal Link Sync
    const gcalUrl = getGoogleCalendarUrl(titleText, deadlineText);
    let gcalBtn = document.getElementById('detail-gcal');
    const sidebar = document.querySelector('.detail-sidebar');
    
    if (!gcalBtn && sidebar) {
        gcalBtn = document.createElement('button');
        gcalBtn.id = 'detail-gcal';
        gcalBtn.className = 'btn-secondary-sm';
        gcalBtn.style.width = '100%';
        gcalBtn.style.marginTop = '2rem';
        gcalBtn.innerHTML = '<i class="ph ph-calendar-plus"></i> SYNC TO GCAL';
        sidebar.appendChild(gcalBtn);
    }
    if (gcalBtn) gcalBtn.onclick = () => window.open(gcalUrl, '_blank');

    window.showView('detail');
    toggleEditMode(false);
};

window.toggleEditMode = (editing) => {
    const viewEls = ['detail-title-val', 'detail-category-tag', 'detail-status-pill', 'detail-category-val', 'detail-deadline-val', 'detail-desc', 'btn-edit-project', 'detail-gcal'];
    const editEls = ['edit-title', 'edit-meta-status', 'edit-meta-cat', 'edit-deadline', 'edit-desc-group', 'edit-controls'];

    viewEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden', editing);
    });
    editEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden', !editing);
    });
};

window.saveProjectEdits = () => {
    const card = document.getElementById(currentEditingId);
    if (!card) return;

    const newTitle = document.getElementById('edit-title').value;
    const newStatus = document.getElementById('edit-status').value;
    const newCat = document.getElementById('edit-category').value;
    const newDesc = document.getElementById('edit-desc').value;
    const newDL = document.getElementById('edit-deadline').value;

    // Update Project Card Data
    card.querySelector('h3').textContent = newTitle;
    card.querySelector('.card-category').textContent = newCat;
    card.querySelector('p').textContent = newDesc;
    if (newDL) card.querySelector('.deadline').textContent = getHumanDate(newDL);
    
    // Status Logic
    const oldStatus = card.getAttribute('data-status');
    if (oldStatus !== newStatus) {
        card.setAttribute('data-status', newStatus);
        
        // Use existing col logic
        const colMap = { 'planning': 'todo', 'active': 'inprogress', 'review': 'review', 'finished': 'done' };
        const colId = colMap[newStatus];
        updateCardStatus(card, colId);
        
        const targetCol = document.getElementById(colId);
        if (targetCol) targetCol.querySelector('.column-tasks').appendChild(card);
    }

    logActivity(`Refinement: ${newTitle} updated.`);
    saveState();
    sortAllColumns();
    updateDashboard();
    window.openDetail(currentEditingId); // Refresh Current Detail View
};

window.closeDetail = () => {
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
    const boardView = document.getElementById('board-view');
    if (boardView) boardView.classList.remove('hidden');
};

window.clearDoneColumn = () => {
    const doneCards = document.querySelectorAll('#done .card:not(.archived)');
    if (doneCards.length === 0) return;
    
    const storage = document.getElementById('hidden-archive-storage');
    
    doneCards.forEach(c => {
        c.classList.add('archived');
        c.setAttribute('data-archived', 'true');
        c.setAttribute('data-status', 'archived');
        c.draggable = false;
        // PHYSICALLY REMOVE from board, MOVE to hidden storage
        if (storage) {
            storage.appendChild(c);
        } else {
            c.remove(); // Fallback if storage not found
        }
        logActivity(`Archived: ${c.querySelector('h3').textContent}`);
    });

    saveState();
    updateCounters();
    updateDashboard();
    renderRealCalendar2026();
};

// --- CUSTOM CONFIRMATION ---
window.showCustomConfirm = (title, msg, onProceed) => {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = msg;
    modal.classList.remove('hidden');

    const proceedBtn = document.getElementById('confirm-proceed');
    const cancelBtn = document.getElementById('confirm-cancel');

    const close = () => modal.classList.add('hidden');
    
    proceedBtn.onclick = () => {
        onProceed();
        close();
    };
    cancelBtn.onclick = close;
};

// --- MODAL LOGIC ---
window.openNewProject = () => {
    document.getElementById('new-project-title').value = '';
    document.getElementById('new-project-category').value = '';
    document.getElementById('new-project-deadline').value = '';
    const modal = document.getElementById('project-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeProjectModal = () => {
    const modal = document.getElementById('project-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitNewProject = () => {
    const title = document.getElementById('new-project-title').value;
    const category = document.getElementById('new-project-category').value || 'WEB';
    const deadline = document.getElementById('new-project-deadline').value || 'TBD';
    const desc = document.getElementById('new-project-desc').value || 'Project specs pending...';
    
    if (!title) {
        alert('Enter title');
        return;
    }

    const id = 'task-' + Date.now();
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.id = id;
    card.setAttribute('data-status', 'planning');
    card.innerHTML = `
        <div class="card-header">
            <span class="card-category">${category.toUpperCase()}</span>
            <span class="card-status status-planning">TO DO</span>
        </div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="card-footer">
            <span class="deadline">${getHumanDate(deadline)}</span>
        </div>
    `;

    bindCardListeners(card);
    const todoContainer = document.querySelector('#todo .column-tasks');
    if (todoContainer) {
        todoContainer.appendChild(card);
        sortAllColumns();
        saveState();
        updateCounters();
        updateDashboard();
        renderRealCalendar2026(); 
    }
    
    document.getElementById('new-project-title').value = '';
    document.getElementById('new-project-desc').value = '';
    window.closeProjectModal();
};

// --- VOICE CAPTURE ENGINE ---
let recognition; 

window.startVoiceToText = (textareaId, btnSelector) => {
    const btn = document.querySelector(btnSelector);
    const textarea = document.getElementById(textareaId);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition.");
        return;
    }

    if (btn && btn.classList.contains('recording')) {
        if (recognition) recognition.stop();
        btn.classList.remove('recording');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        if (btn) btn.classList.add('recording');
        if (textarea) textarea.placeholder = "Listening... Speak now.";
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript && textarea) {
            textarea.value = (textarea.value ? textarea.value + " " : "") + finalTranscript.trim();
        }
    };

    recognition.onerror = () => { if (btn) btn.classList.remove('recording'); };
    recognition.onend = () => { if (btn) btn.classList.remove('recording'); };

    recognition.start();
};

window.startVoiceCapture = () => window.startVoiceToText('new-project-desc', '.modal-body .btn-voice');
window.startVoiceCaptureDetail = () => window.startVoiceToText('edit-desc', '.btn-voice-detail');

function saveState() {
    const state = {};
    // Operational Columns
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(col => {
        state[col.id] = Array.from(col.querySelectorAll('.card')).map(c => ({
            id: c.id,
            html: c.innerHTML,
            dataStatus: c.getAttribute('data-status'),
            archived: c.getAttribute('data-archived') === 'true'
        }));
    });
    // Archive Storage
    const storage = document.getElementById('hidden-archive-storage');
    if (storage) {
        state['archive-storage'] = Array.from(storage.querySelectorAll('.card')).map(c => ({
            id: c.id,
            html: c.innerHTML,
            dataStatus: 'archived',
            archived: true
        }));
    }
    // budgets
    state['budgets'] = window.allBudgets || [];

    localStorage.setItem('bg_ecosystem_state_v3', JSON.stringify(state));
    
    // Cloud Sync
    spFetch('bg_ecosystem?id=eq.main_state', 'PATCH', { data: state });
}

window.migrateToCloud = async () => {
    const raw = localStorage.getItem('bg_ecosystem_state_v3');
    if (!raw) {
        alert("No hay datos locales para migrar.");
        return;
    }
    const state = JSON.parse(raw);
    const res = await spFetch('bg_ecosystem?id=eq.main_state', 'PATCH', { data: state });
    if (res) {
        alert("¡Migración exitosa! Tus datos locales ahora están en la nube.");
        location.reload();
    } else {
        alert("Error al migrar. Verificá la consola.");
    }
};

async function loadState() {
    // 1. Try Cloud Load first
    const cloudData = await spFetch('bg_ecosystem?id=eq.main_state', 'GET');
    let state = null;

    if (cloudData && cloudData[0] && Object.keys(cloudData[0].data).length > 0) {
        state = cloudData[0].data;
        console.log("Loaded context from cloud.");
    } else {
        // 2. Fallback to Local Storage
        const raw = localStorage.getItem('bg_ecosystem_state_v3');
        if (raw) {
            state = JSON.parse(raw);
            console.log("Loaded context from local storage.");
        }
    }

    if (!state) return;

    // 3. Auto-Migrate: If cloud was empty but we found local data, sync it now
    if (cloudData && cloudData[0] && Object.keys(cloudData[0].data).length === 0 && !localStorage.getItem('bg_migrated')) {
        console.log("Empty cloud detected. Syncing local data to cloud...");
        saveState();
        localStorage.setItem('bg_migrated', 'true');
    }
    
    // Load budgets
    window.allBudgets = state['budgets'] || [];
    Object.keys(state).forEach(colId => {
        let container;
        if (colId === 'archive-storage') {
            container = document.getElementById('hidden-archive-storage');
        } else {
            const column = document.getElementById(colId);
            if (column) container = column.querySelector('.column-tasks');
        }
        
        if (!container) return;
        container.innerHTML = ''; 

        state[colId].forEach(taskData => {
            const card = document.createElement('div');
            card.className = 'card' + (taskData.archived ? ' archived' : '');
            card.draggable = taskData.archived ? false : true;
            card.id = taskData.id;
            card.setAttribute('data-status', taskData.dataStatus);
            if (taskData.archived) {
                card.setAttribute('data-archived', 'true');
                card.classList.add('archived');
                card.style.display = 'none';
                // If it's archived but somehow in a regular column, force it out
                if (colId !== 'archive-storage' && container) {
                    console.warn("Fixing bugged card alignment:", taskData.id);
                    const storage = document.getElementById('hidden-archive-storage');
                    if (storage) storage.appendChild(card);
                    return; // Don't append to current column
                }
            }
            card.innerHTML = taskData.html;
            
            const dl = card.querySelector('.deadline');
            if (dl) dl.textContent = getHumanDate(dl.textContent);

            if (!taskData.archived) bindCardListeners(card);
            container.appendChild(card);
        });
    });
}

// --- CALENDAR STATE ---
let currentMonth = new Date().getMonth();
let currentYear = 2026;

window.changeMonth = (delta) => {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderRealCalendar2026();
};

function renderRealCalendar2026() {
    const grid = document.getElementById('calendar-grid');
    const display = document.getElementById('current-month-display');
    if (!grid || !display) return;
    
    grid.innerHTML = '';
    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    display.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Day Labels
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].forEach(d => {
        const label = document.createElement('div');
        label.className = 'calendar-day-header';
        label.textContent = d;
        grid.appendChild(label);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // Only cards CURRENTLY in operational columns
    const cards = Array.from(document.querySelectorAll('.kanban-column .card:not(.archived)'));

    for (let i = 1; i <= lastDate; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.innerHTML = `<span class="day-number">${i}</span>`;
        
        const currentCalDate = new Date(currentYear, currentMonth, i);
        
        cards.forEach(c => {
            const dl = c.querySelector('.deadline').textContent;
            const projectDate = parseDeadline(dl);
            
            if (projectDate.getFullYear() === currentYear && 
                projectDate.getMonth() === currentMonth && 
                projectDate.getDate() === i) {
                
                const event = document.createElement('div');
                event.className = 'cal-event';
                event.textContent = c.querySelector('h3').textContent;
                event.onclick = (e) => {
                    e.stopPropagation();
                    window.openDetail(c.id);
                };
                
                const status = c.getAttribute('data-status');
                if (status === 'planning') event.style.borderLeftColor = '#ffaa00';
                if (status === 'active') event.style.borderLeftColor = 'var(--accent-green)';
                if (status === 'review') event.style.borderLeftColor = '#00aaff';
                
                day.appendChild(event);
            }
        });

        grid.appendChild(day);
    }
}

function updateArchive() {
    const archiveContainer = document.getElementById('archive-list');
    if (!archiveContainer) return;

    const archivedCards = document.querySelectorAll('.card.archived');
    
    if (archivedCards.length === 0) {
        archiveContainer.innerHTML = `
            <div class="empty-state" style="text-align:center; padding: 4rem 2rem; opacity: 0.4; grid-column: 1 / -1;">
                <i class="ph ph-archive-box" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>HISTORICAL ARCHIVE EMPTY</p>
                <p style="font-size: 0.7rem; margin-top: 0.5rem;">COMPLETED PROJECTS FROM DONE WILL APPEAR HERE</p>
            </div>`;
        return;
    }

    archiveContainer.innerHTML = '';
    archivedCards.forEach(card => {
        const wrapper = document.createElement('div');
        wrapper.className = 'archive-card-wrapper';
        
        const clone = card.cloneNode(true);
        clone.classList.remove('dragging', 'archived'); 
        clone.style.display = 'block';
        clone.draggable = false;
        clone.onclick = () => window.openDetail(card.id);
        
        // Permanent Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete-permanent';
        delBtn.innerHTML = '<i class="ph ph-x"></i>';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            window.deleteProjectPermanently(card.id);
        };
        
        wrapper.appendChild(clone);
        wrapper.appendChild(delBtn);
        archiveContainer.appendChild(wrapper);
    });
}

window.deleteProjectPermanently = (id) => {
    showCustomConfirm("PERMANENT DELETE", "This project will be erased from the ecosystem forever. Proceed?", () => {
        // 1. Target master instances (Hidden Storage or Board)
        const master = document.getElementById(id);
        if (master) master.remove();
        
        // 2. Target any lingering clones with [id="ID"]
        document.querySelectorAll(`[id="${id}"]`).forEach(c => {
            const wrapper = c.closest('.archive-card-wrapper');
            if (wrapper) wrapper.remove();
            else c.remove();
        });
        
        saveState();
        updateArchive();
        updateDashboard();
        renderRealCalendar2026();
        logActivity(`System Purge: ${id} erased.`);
    });
};

function updateDashboard() {
    const total = document.querySelectorAll('.card:not(.archived)').length;
    const todo = document.querySelectorAll('.card[data-status="planning"]:not(.archived)').length;
    const activeTasks = document.querySelectorAll('.card[data-status="active"]:not(.archived)').length;
    const review = document.querySelectorAll('.card[data-status="review"]:not(.archived)').length;
    const totalFinished = document.querySelectorAll('.card[data-status="finished"]').length;

    const mActive = document.getElementById('metric-active');
    const mComp = document.getElementById('metric-completed');
    
    if (mActive) {
        mActive.className = 'metric-card ' + (activeTasks > 5 ? 'urgent' : 'active');
        mActive.querySelector('.met-value').innerHTML = `${String(activeTasks).padStart(2, '0')} <span class="met-sub">LIVE</span>`;
    }
    if (mComp) {
        mComp.querySelector('.met-value').innerHTML = `${String(totalFinished).padStart(2, '0')} <span class="met-sub">TOTAL</span>`;
    }

    const hBar = document.getElementById('health-bar');
    if (hBar) {
        const progress = (total + totalFinished) > 0 ? (totalFinished / (total + totalFinished)) * 100 : 100;
        hBar.style.width = progress + '%';
        const label = hBar.closest('.metric-card').querySelector('.met-label');
        if (label) label.textContent = `COMPLETION RATE: ${Math.round(progress)}%`;
    }

    const workload = document.getElementById('workload-distribution');
    if (workload) {
        workload.innerHTML = '';
        for (let i=0; i<todo; i++) workload.innerHTML += '<div class="w-dot active" title="Planning"></div>';
        for (let i=0; i<activeTasks; i++) workload.innerHTML += '<div class="w-dot" style="background:var(--accent-green)" title="Active"></div>';
        for (let i=0; i<review; i++) workload.innerHTML += '<div class="w-dot" style="background:#00aaff" title="Review"></div>';
    }

    // SEMAPHORE LOGIC
    const urgContainer = document.getElementById('urgency-groups');
    if (urgContainer) {
        // FILTER: Excluding finished and archived
        const liveCards = Array.from(document.querySelectorAll('.card:not(.archived):not([data-status="finished"])'));
        const groups = {
            'OVERDUE': [],
            'TODAY / TOMORROW': [],
            'THIS WEEK': [],
            'LATER': []
        };

        liveCards.forEach(c => {
            const dl = c.querySelector('.deadline').textContent;
            const status = getUrgencyStatus(dl);
            if (status.label.includes('URGENT') || status.label.includes('PASSED')) groups['OVERDUE'].push(c);
            else if (status.label === 'TODAY' || status.label === 'TOMORROW') groups['TODAY / TOMORROW'].push(c);
            else if (status.label === 'THIS WEEK') groups['THIS WEEK'].push(c);
            else groups['LATER'].push(c);
        });

        urgContainer.innerHTML = Object.keys(groups).map(g => {
            if (groups[g].length === 0) return '';
            const gClass = g.split(' ')[0].toLowerCase();
            return `
                <div class="urgency-group">
                    <span class="urg-label">${g}</span>
                    <div class="urg-items">
                        ${groups[g].map(c => {
                            const dl = c.querySelector('.deadline').textContent;
                            const title = c.querySelector('h3').textContent;
                            return `
                                <div class="urg-item ${gClass}" onclick="openDetail('${c.id}')">
                                    <span class="urg-name">${title}</span>
                                    <span class="urg-date">${dl}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
        if (!urgContainer.innerHTML) urgContainer.innerHTML = '<p class="empty-state">System clear. Peace of mind confirmed.</p>';
    }
}

function getGoogleCalendarUrl(title, deadline) {
    const date = parseDeadline(deadline);
    const start = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(date.getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const base = "https://www.google.com/calendar/render?action=TEMPLATE";
    return `${base}&text=${encodeURIComponent('PROJECT: ' + title)}&dates=${start}/${end}&details=${encodeURIComponent('Internal Tool Sync - Deadline for ' + title)}`;
}

// --- ACTIVITY LOG ---
function logActivity(msg) {
    const log = JSON.parse(localStorage.getItem('bg_activity_log') || '[]');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    log.unshift(`[${time}] ${msg}`);
    localStorage.setItem('bg_activity_log', JSON.stringify(log.slice(0, 5)));
    renderActivityLog();
}

function renderActivityLog() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;
    const log = JSON.parse(localStorage.getItem('bg_activity_log') || '[]');
    if (log.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent activity detected.</p>';
        return;
    }
    container.innerHTML = log.map(item => `<p class="activity-item">${item}</p>`).join('');
}

// --- BUDGET SYSTEM LOGIC ---
window.allBudgets = [];
window.editingBudgetId = null;

window.renderBudgets = () => {
    const container = document.getElementById('budgets-list');
    if (!container) return;

    if (window.allBudgets.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay presupuestos registrados.</div>';
        return;
    }

    container.innerHTML = window.allBudgets.map(b => {
        const totalFormatted = new Intl.NumberFormat('es-UY', { 
            style: 'currency', 
            currency: b.currency 
        }).format(b.total);

        return `
            <div class="budget-card">
                <div class="budget-card-header">
                    <span class="budget-client">${b.client.toUpperCase()}</span>
                    <span class="budget-date">${b.date}</span>
                </div>
                <h3 class="budget-title">${b.project}</h3>
                <div class="budget-total">${totalFormatted}</div>
                <div class="budget-actions">
                    <button class="btn-action-sm" onclick="editBudget('${b.id}')"><i class="ph ph-pencil"></i> EDIT</button>
                    <button class="btn-action-sm" onclick="shareBudget('${b.id}')"><i class="ph ph-share-network"></i> SHARE</button>
                    <button class="btn-action-sm" style="color: #ff5555" onclick="deleteBudget('${b.id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
};

window.openBudgetModal = (budgetData = null) => {
    window.editingBudgetId = budgetData ? budgetData.id : null;
    const title = document.querySelector('#budget-modal .modal-title');
    if (title) title.textContent = budgetData ? 'EDITAR PRESUPUESTO' : 'NUEVO PRESUPUESTO';

    document.getElementById('budget-client').value = budgetData ? budgetData.client : '';
    document.getElementById('budget-project').value = budgetData ? budgetData.project : '';
    document.getElementById('budget-proposal-url').value = (budgetData && budgetData.proposalUrl) ? budgetData.proposalUrl : '';
    document.getElementById('budget-notes').value = budgetData ? budgetData.notes : '';
    document.getElementById('budget-iva').checked = budgetData ? budgetData.hasIva : false;
    document.getElementById('budget-currency').value = budgetData ? budgetData.currency : 'USD';
    
    const list = document.getElementById('budget-items-list');
    list.innerHTML = '';
    
    if (budgetData && budgetData.items) {
        budgetData.items.forEach(item => addBudgetItem(item.desc, item.price));
    } else {
        addBudgetItem(); 
    }
    
    calculateBudgetTotal();
    document.getElementById('budget-modal').classList.remove('hidden');
};

window.editBudget = (id) => {
    const budget = window.allBudgets.find(b => b.id === id);
    if (budget) openBudgetModal(budget);
};

window.closeBudgetModal = () => {
    document.getElementById('budget-modal').classList.add('hidden');
};

window.addBudgetItem = (desc = '', price = '') => {
    const list = document.getElementById('budget-items-list');
    const row = document.createElement('div');
    row.className = 'budget-item-row';
    row.innerHTML = `
        <input type="text" placeholder="Concepto/Servicio" class="item-desc" value="${desc}" oninput="calculateBudgetTotal()">
        <input type="number" placeholder="0" class="item-price" value="${price}" oninput="calculateBudgetTotal()">
        <button class="btn-remove-item" onclick="this.parentElement.remove(); calculateBudgetTotal();"><i class="ph ph-x"></i></button>
    `;
    list.appendChild(row);
};

window.calculateBudgetTotal = () => {
    const prices = Array.from(document.querySelectorAll('.item-price')).map(i => parseFloat(i.value) || 0);
    let subtotal = prices.reduce((a, b) => a + b, 0);
    
    const hasIva = document.getElementById('budget-iva').checked;
    const total = hasIva ? subtotal * 1.22 : subtotal;
    
    const currency = document.getElementById('budget-currency').value;
    const totalFormatted = new Intl.NumberFormat('es-UY', { 
        style: 'currency', 
        currency: currency 
    }).format(total);

    document.getElementById('budget-total-val').textContent = totalFormatted;
    return total;
};

// Listen for direct change on checkbox
document.addEventListener('change', (e) => {
    if (e.target.id === 'budget-iva' || e.target.id === 'budget-currency') {
        calculateBudgetTotal();
    }
});

window.submitBudget = () => {
    const client = document.getElementById('budget-client').value;
    const project = document.getElementById('budget-project').value;
    const proposalUrl = document.getElementById('budget-proposal-url').value;
    const currency = document.getElementById('budget-currency').value;
    const hasIva = document.getElementById('budget-iva').checked;
    const notes = document.getElementById('budget-notes').value;
    
    const items = Array.from(document.querySelectorAll('.budget-item-row')).map(row => ({
        desc: row.querySelector('.item-desc').value,
        price: parseFloat(row.querySelector('.item-price').value) || 0
    })).filter(i => i.desc && i.price > 0);

    if (!client || !project || items.length === 0) {
        alert("Completa cliente, proyecto y al menos un item con precio.");
        return;
    }

    const total = calculateBudgetTotal();
    const date = new Date().toLocaleDateString('es-UY');

    if (window.editingBudgetId) {
        const idx = window.allBudgets.findIndex(b => b.id === window.editingBudgetId);
        if (idx !== -1) {
            window.allBudgets[idx] = { 
                ...window.allBudgets[idx], 
                client, project, proposalUrl, currency, hasIva, items, notes, total 
            };
            logActivity(`Presupuesto actualizado: ${client}`);
        }
    } else {
        const id = 'bg-bdt-' + Date.now();
        const newBudget = { id, client, project, proposalUrl, currency, hasIva, items, notes, total, date };
        window.allBudgets.unshift(newBudget);
        logActivity(`Nuevo presupuesto para ${client}`);
    }

    saveState();
    renderBudgets();
    closeBudgetModal();
};

window.deleteBudget = (id) => {
    showCustomConfirm("BORRAR PRESUPUESTO", "¿Seguro que querés eliminar este presupuesto?", () => {
        window.allBudgets = window.allBudgets.filter(b => b.id !== id);
        saveState();
        renderBudgets();
        logActivity(`Presupuesto eliminado.`);
    });
};

window.shareBudget = (id) => {
    const budget = window.allBudgets.find(b => b.id === id);
    if (!budget) return;

    // Remove ID for shorter link if needed, or keep it
    const dataString = JSON.stringify(budget);
    const encoded = btoa(unescape(encodeURIComponent(dataString)));
    
    // Determine base URL (root of the domain)
    // For local development it might be just budget.html, but let's assume root
    const shareUrl = window.location.origin + '/presupuesto.html?d=' + encoded;

    navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Link de presupuesto copiado al portapapeles.");
        logActivity(`Link compartido: ${budget.client}`);
    });
};
