/* ============================================================
   Wibo Certification - app.js
   Logica principale dell'applicazione: routing, stato, UI,
   destinatari, storico, template gallery.
   ============================================================ */

// ────────────────────────────────────────────────────────────
// Utilita' per generare ID unici
// ────────────────────────────────────────────────────────────
function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback per browser senza randomUUID
    return 'xxxx-xxxx-xxxx'.replace(/x/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
    });
}

function generateCertNumber() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = 'CERT-';
    for (var i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ────────────────────────────────────────────────────────────
// App – Oggetto globale principale
// ────────────────────────────────────────────────────────────
var App = {

    STORAGE_KEY: 'wibocertification_state',

    state: {
        recipients: [],
        designs: [],
        history: [],
        selectedTemplate: 'elegant'
    },

    // ── Stato ──────────────────────────────────────────────

    loadState: function () {
        try {
            var raw = localStorage.getItem(App.STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                App.state.recipients = Array.isArray(parsed.recipients) ? parsed.recipients : [];
                App.state.designs = Array.isArray(parsed.designs) ? parsed.designs : [];
                App.state.history = Array.isArray(parsed.history) ? parsed.history : [];
                App.state.selectedTemplate = parsed.selectedTemplate || 'elegant';
            }
        } catch (e) {
            console.warn('Errore nel caricamento dello stato:', e);
        }
    },

    saveState: function () {
        try {
            localStorage.setItem(App.STORAGE_KEY, JSON.stringify(App.state));
        } catch (e) {
            console.warn('Errore nel salvataggio dello stato:', e);
        }
    },

    // ── Router SPA ─────────────────────────────────────────

    navigate: function (pageName) {
        // Nascondi tutte le sezioni
        var pages = document.querySelectorAll('.page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.remove('active');
        }

        // Mostra la pagina richiesta
        var target = document.getElementById('page-' + pageName);
        if (target) {
            target.classList.add('active');
        }

        // Aggiorna lo stato attivo nella navigazione
        var navItems = document.querySelectorAll('.nav-item');
        for (var j = 0; j < navItems.length; j++) {
            navItems[j].classList.remove('active');
            if (navItems[j].getAttribute('data-page') === pageName) {
                navItems[j].classList.add('active');
            }
        }

        // Aggiorna hash senza triggerare hashchange duplicato
        if (location.hash !== '#' + pageName) {
            history.replaceState(null, '', '#' + pageName);
        }

        // Chiudi sidebar mobile se aperta
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');

        // Callback specifici per pagina
        switch (pageName) {
            case 'dashboard':
                App.updateDashboard();
                break;
            case 'templates':
                App.renderTemplates();
                break;
            case 'designer':
                if (typeof CertDesigner !== 'undefined' && CertDesigner.updatePreview) {
                    CertDesigner.updatePreview();
                }
                break;
            case 'recipients':
                Recipients.render();
                break;
            case 'send':
                if (typeof EmailSender !== 'undefined') {
                    if (EmailSender.init) EmailSender.init();
                    if (EmailSender.renderEmailPreview) EmailSender.renderEmailPreview();
                    if (EmailSender.populateDesignOptions) EmailSender.populateDesignOptions();
                }
                break;
            case 'history':
                History.render();
                break;
        }
    },

    // ── Modali ─────────────────────────────────────────────

    openModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('visible');
    },

    closeModal: function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('visible');
    },

    // ── Toast ──────────────────────────────────────────────

    toast: function (message, type) {
        type = type || 'info';
        var container = document.getElementById('toastContainer');
        if (!container) return;

        var icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M13 7l-6 6M7 7l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v4M10 7h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3l8 14H2L10 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 9v3M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
        };

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
            '<span class="toast-message">' + App.escapeHtml(message) + '</span>' +
            '<button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';

        container.appendChild(toast);

        setTimeout(function () {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 4000);
    },

    // ── Escape HTML ────────────────────────────────────────

    escapeHtml: function (str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // ── Dashboard ──────────────────────────────────────────

    updateDashboard: function () {
        var state = App.state;

        // Contatori
        var elTotal = document.getElementById('statTotal');
        var elSent = document.getElementById('statSent');
        var elRecipients = document.getElementById('statRecipients');
        var elTemplates = document.getElementById('statTemplates');

        if (elTotal) elTotal.textContent = state.history.length;
        if (elSent) elSent.textContent = state.history.filter(function (h) { return h.status === 'delivered' || h.status === 'opened'; }).length;
        if (elRecipients) elRecipients.textContent = state.recipients.length;
        if (elTemplates) {
            var templateCount = (typeof CERT_TEMPLATES !== 'undefined' && Array.isArray(CERT_TEMPLATES)) ? CERT_TEMPLATES.length : 0;
            templateCount += state.designs.length;
            elTemplates.textContent = templateCount;
        }

        // Attivita' recente
        var activityEl = document.getElementById('recentActivity');
        if (!activityEl) return;

        if (state.history.length === 0) {
            activityEl.innerHTML = '<div class="empty-state-sm"><p>Nessuna attivita\' recente. Crea il tuo primo certificato!</p></div>';
            return;
        }

        // Ultimi 8 elementi ordinati per data
        var recent = state.history.slice().sort(function (a, b) {
            return new Date(b.sentAt) - new Date(a.sentAt);
        }).slice(0, 8);

        var html = '<div class="activity-list">';
        for (var i = 0; i < recent.length; i++) {
            var item = recent[i];
            var dotClass = item.status === 'opened' ? 'activity-dot-blue' : 'activity-dot-green';
            var statusText = item.status === 'opened' ? 'aperto' : 'consegnato';
            var timeStr = App._formatTimeAgo(item.sentAt);

            html += '<div class="activity-item">' +
                '<div class="activity-dot ' + dotClass + '"></div>' +
                '<div class="activity-text">Certificato inviato a <strong>' + App.escapeHtml(item.recipientName) + '</strong> — ' + App.escapeHtml(statusText) + '</div>' +
                '<span class="activity-time">' + App.escapeHtml(timeStr) + '</span>' +
                '</div>';
        }
        html += '</div>';
        activityEl.innerHTML = html;
    },

    _formatTimeAgo: function (dateStr) {
        var now = new Date();
        var then = new Date(dateStr);
        var diffMs = now - then;
        var diffMin = Math.floor(diffMs / 60000);
        var diffH = Math.floor(diffMs / 3600000);
        var diffD = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'adesso';
        if (diffMin < 60) return diffMin + ' min fa';
        if (diffH < 24) return diffH + ' ore fa';
        if (diffD < 7) return diffD + ' giorni fa';
        return then.toLocaleDateString('it-IT');
    },

    // ── Template Gallery ───────────────────────────────────

    renderTemplates: function (filterCategory) {
        var grid = document.getElementById('templatesGrid');
        if (!grid) return;

        var templates = (typeof CERT_TEMPLATES !== 'undefined' && Array.isArray(CERT_TEMPLATES)) ? CERT_TEMPLATES : [];

        // Filtro per categoria
        var filtered = templates;
        if (filterCategory && filterCategory !== 'all') {
            filtered = templates.filter(function (t) {
                return t.category === filterCategory;
            });
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state-sm"><p>Nessun template trovato per questa categoria.</p></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < filtered.length; i++) {
            var t = filtered[i];
            var isSelected = App.state.selectedTemplate === t.id;
            var selectedClass = isSelected ? ' selected' : '';

            // Genera miniatura del certificato
            var thumbHtml = '';
            if (typeof CertDesigner !== 'undefined' && CertDesigner.renderThumbnail) {
                thumbHtml = CertDesigner.renderThumbnail(t.id);
            } else {
                thumbHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);"><span style="font-size:2rem;opacity:0.3;">&#128196;</span></div>';
            }

            html += '<div class="template-card' + selectedClass + '" data-template-id="' + App.escapeHtml(t.id) + '" onclick="App.selectTemplate(\'' + App.escapeHtml(t.id) + '\')">' +
                '<div class="template-thumb"><div class="template-thumb-inner">' + thumbHtml + '</div></div>' +
                '<div class="template-info">' +
                '<div class="template-name">' + App.escapeHtml(t.name) + '</div>' +
                '<div class="template-category">' + App.escapeHtml(t.category || '') + '</div>' +
                '</div>' +
                '<div class="template-actions">' +
                '<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); App.selectTemplate(\'' + App.escapeHtml(t.id) + '\'); App.navigate(\'designer\');">Personalizza</button>' +
                '<button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); App.previewTemplate(\'' + App.escapeHtml(t.id) + '\');">Anteprima</button>' +
                '</div>' +
                '</div>';
        }

        grid.innerHTML = html;
    },

    selectTemplate: function (templateId) {
        App.state.selectedTemplate = templateId;
        App.saveState();

        // Aggiorna la selezione visuale
        var cards = document.querySelectorAll('.template-card');
        for (var i = 0; i < cards.length; i++) {
            cards[i].classList.remove('selected');
            if (cards[i].getAttribute('data-template-id') === templateId) {
                cards[i].classList.add('selected');
            }
        }

        // Aggiorna il select nel designer
        var certTemplateSelect = document.getElementById('certTemplate');
        if (certTemplateSelect) {
            certTemplateSelect.value = templateId;
        }

        App.toast('Template selezionato', 'success');
    },

    previewTemplate: function (templateId) {
        if (typeof CertDesigner !== 'undefined' && CertDesigner.renderForRecipient) {
            var container = document.getElementById('certViewContainer');
            if (container) {
                container.innerHTML = '<div class="certificate-preview">' +
                    CertDesigner.renderForRecipient({
                        name: 'Mario Rossi',
                        course: 'Corso di Esempio',
                        date: new Date().toISOString().split('T')[0]
                    }, templateId) +
                    '</div>';
            }
            App.openModal('modalCertView');
        }
    },

    // ── Filtri template ────────────────────────────────────

    _setupTemplateFilters: function () {
        var filterBtns = document.querySelectorAll('.filter-btn');
        for (var i = 0; i < filterBtns.length; i++) {
            filterBtns[i].addEventListener('click', function () {
                // Aggiorna stato attivo
                var all = document.querySelectorAll('.filter-btn');
                for (var k = 0; k < all.length; k++) {
                    all[k].classList.remove('active');
                }
                this.classList.add('active');

                var category = this.getAttribute('data-filter');
                App.renderTemplates(category);
            });
        }
    },

    // ── Mobile ─────────────────────────────────────────────

    _setupMobile: function () {
        var mobileMenuBtn = document.getElementById('mobileMenuBtn');
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');

        if (mobileMenuBtn && sidebar && overlay) {
            mobileMenuBtn.addEventListener('click', function () {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('visible');
            });

            overlay.addEventListener('click', function () {
                sidebar.classList.remove('open');
                overlay.classList.remove('visible');
            });
        }
    },

    // ── Navigazione setup ──────────────────────────────────

    _setupNavigation: function () {
        var navItems = document.querySelectorAll('.nav-item');
        for (var i = 0; i < navItems.length; i++) {
            navItems[i].addEventListener('click', function (e) {
                e.preventDefault();
                var page = this.getAttribute('data-page');
                if (page) {
                    App.navigate(page);
                }
            });
        }

        // Hash change
        window.addEventListener('hashchange', function () {
            var hash = location.hash.replace('#', '');
            if (hash) {
                App.navigate(hash);
            }
        });
    }
};

// ────────────────────────────────────────────────────────────
// Recipients – Gestione destinatari
// ────────────────────────────────────────────────────────────
var Recipients = {

    _searchFilter: '',
    _parsedCSVData: null,

    // ── Render tabella ─────────────────────────────────────

    render: function () {
        var body = document.getElementById('recipientsBody');
        var emptyState = document.getElementById('recipientsEmpty');
        var countEl = document.getElementById('recipientCount');
        var table = document.getElementById('recipientsTable');
        var deleteBtn = document.getElementById('deleteSelectedBtn');

        if (!body) return;

        var recipients = App.state.recipients;

        // Applica filtro ricerca
        var filtered = recipients;
        if (Recipients._searchFilter) {
            var q = Recipients._searchFilter.toLowerCase();
            filtered = recipients.filter(function (r) {
                return (r.name && r.name.toLowerCase().indexOf(q) !== -1) ||
                    (r.email && r.email.toLowerCase().indexOf(q) !== -1) ||
                    (r.course && r.course.toLowerCase().indexOf(q) !== -1);
            });
        }

        // Aggiorna conteggio
        if (countEl) {
            countEl.textContent = filtered.length + ' destinatar' + (filtered.length === 1 ? 'io' : 'i');
        }

        // Mostra / nascondi stato vuoto
        if (recipients.length === 0) {
            if (emptyState) emptyState.style.display = '';
            if (table) table.style.display = 'none';
            body.innerHTML = '';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (table) table.style.display = '';
        }

        // Mostra/nascondi pulsante elimina selezionati
        var anySelected = recipients.some(function (r) { return r.selected; });
        if (deleteBtn) {
            deleteBtn.style.display = anySelected ? '' : 'none';
        }

        // Genera righe
        var html = '';
        for (var i = 0; i < filtered.length; i++) {
            var r = filtered[i];
            var statusBadge = r.status === 'sent'
                ? '<span class="badge badge-success">Inviato</span>'
                : '<span class="badge badge-gray">In attesa</span>';

            var dateFormatted = r.date ? new Date(r.date).toLocaleDateString('it-IT') : '—';

            html += '<tr>' +
                '<td class="th-check"><input type="checkbox" ' + (r.selected ? 'checked' : '') +
                ' onchange="Recipients.toggleSelect(\'' + App.escapeHtml(r.id) + '\')"></td>' +
                '<td><strong>' + App.escapeHtml(r.name) + '</strong></td>' +
                '<td>' + App.escapeHtml(r.email) + '</td>' +
                '<td>' + App.escapeHtml(r.course || '—') + '</td>' +
                '<td>' + App.escapeHtml(dateFormatted) + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td><div class="row-actions">' +
                '<button class="row-action-btn" title="Visualizza certificato" onclick="Recipients._viewCert(\'' + App.escapeHtml(r.id) + '\')">' +
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>' +
                '</button>' +
                '<button class="row-action-btn danger" title="Elimina" onclick="Recipients.deleteRecipient(\'' + App.escapeHtml(r.id) + '\')">' +
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v4M10 7v4M4 4l.8 8.5a1 1 0 001 .9h4.4a1 1 0 001-.9L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '</button>' +
                '</div></td>' +
                '</tr>';
        }

        body.innerHTML = html;
    },

    _viewCert: function (recipientId) {
        var r = App.state.recipients.find(function (rec) { return rec.id === recipientId; });
        if (!r) return;

        if (typeof CertDesigner !== 'undefined' && CertDesigner.renderForRecipient) {
            var container = document.getElementById('certViewContainer');
            if (container) {
                container.innerHTML = '<div class="certificate-preview">' +
                    CertDesigner.renderForRecipient({
                        name: r.name,
                        course: r.course,
                        date: r.date
                    }) +
                    '</div>';
            }
            App.openModal('modalCertView');
        } else {
            App.toast('Designer non disponibile', 'warning');
        }
    },

    // ── Aggiungi destinatario ──────────────────────────────

    showAddModal: function () {
        // Svuota i campi
        var fields = ['addName', 'addEmail', 'addCourse', 'addDate'];
        for (var i = 0; i < fields.length; i++) {
            var el = document.getElementById(fields[i]);
            if (el) el.value = '';
        }
        // Imposta data di default a oggi
        var dateField = document.getElementById('addDate');
        if (dateField) {
            dateField.value = new Date().toISOString().split('T')[0];
        }
        App.openModal('modalAddRecipient');
    },

    addRecipient: function () {
        var name = (document.getElementById('addName') || {}).value || '';
        var email = (document.getElementById('addEmail') || {}).value || '';
        var course = (document.getElementById('addCourse') || {}).value || '';
        var date = (document.getElementById('addDate') || {}).value || '';

        name = name.trim();
        email = email.trim();
        course = course.trim();
        date = date.trim();

        if (!name || !email) {
            App.toast('Nome e email sono obbligatori', 'error');
            return;
        }

        // Validazione email semplice
        if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
            App.toast('Inserisci un indirizzo email valido', 'error');
            return;
        }

        var recipient = {
            id: generateId(),
            name: name,
            email: email,
            course: course,
            date: date || new Date().toISOString().split('T')[0],
            status: 'pending',
            selected: false
        };

        App.state.recipients.push(recipient);
        App.saveState();
        Recipients.render();
        App.closeModal('modalAddRecipient');
        App.toast('Destinatario aggiunto con successo', 'success');
    },

    // ── Import CSV ─────────────────────────────────────────

    showImportModal: function () {
        Recipients._parsedCSVData = null;

        // Reset UI
        var preview = document.getElementById('csvPreview');
        var importBtn = document.getElementById('csvImportBtn');
        var fileInput = document.getElementById('csvFileInput');
        if (preview) preview.style.display = 'none';
        if (importBtn) importBtn.disabled = true;
        if (fileInput) fileInput.value = '';

        App.openModal('modalImportCSV');

        // Setup drag & drop
        Recipients._setupCSVDragDrop();
    },

    _setupCSVDragDrop: function () {
        var dropZone = document.getElementById('csvDropZone');
        var fileInput = document.getElementById('csvFileInput');
        if (!dropZone || !fileInput) return;

        // Rimuovi vecchi listener clonando il nodo (semplifica la gestione)
        var newDropZone = dropZone.cloneNode(true);
        dropZone.parentNode.replaceChild(newDropZone, dropZone);
        dropZone = newDropZone;

        // Ricollega file input
        var newFileInput = dropZone.querySelector('#csvFileInput');
        if (!newFileInput) {
            newFileInput = document.getElementById('csvFileInput');
        }

        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');

            var files = e.dataTransfer.files;
            if (files.length > 0) {
                Recipients._readCSVFile(files[0]);
            }
        });

        if (newFileInput) {
            newFileInput.addEventListener('change', function () {
                if (this.files && this.files.length > 0) {
                    Recipients._readCSVFile(this.files[0]);
                }
            });
        }
    },

    _readCSVFile: function (file) {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
            App.toast('Seleziona un file CSV valido', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var text = e.target.result;
            var parsed = Recipients.parseCSV(text);

            if (parsed.length === 0) {
                App.toast('Nessun dato trovato nel file CSV', 'warning');
                return;
            }

            Recipients._parsedCSVData = parsed;
            Recipients._showCSVPreview(parsed);
        };
        reader.onerror = function () {
            App.toast('Errore nella lettura del file', 'error');
        };
        reader.readAsText(file);
    },

    parseCSV: function (text) {
        if (!text || !text.trim()) return [];

        var lines = text.trim().split(/\r?\n/);
        if (lines.length === 0) return [];

        var results = [];
        var startIndex = 0;

        // Rileva se la prima riga e' un header
        var firstLine = lines[0].toLowerCase().trim();
        if (firstLine.indexOf('nome') !== -1 || firstLine.indexOf('name') !== -1 ||
            firstLine.indexOf('email') !== -1 || firstLine.indexOf('corso') !== -1) {
            startIndex = 1;
        }

        for (var i = startIndex; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            // Parse con supporto per campi tra virgolette
            var fields = Recipients._parseCSVLine(line);

            var name = (fields[0] || '').trim();
            var email = (fields[1] || '').trim();
            var course = (fields[2] || '').trim();
            var date = (fields[3] || '').trim();

            if (name && email) {
                results.push({
                    name: name,
                    email: email,
                    course: course,
                    date: date
                });
            }
        }

        return results;
    },

    _parseCSVLine: function (line) {
        var result = [];
        var current = '';
        var inQuotes = false;

        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (ch === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current);
        return result;
    },

    _showCSVPreview: function (data) {
        var preview = document.getElementById('csvPreview');
        var table = document.getElementById('csvPreviewTable');
        var count = document.getElementById('csvPreviewCount');
        var importBtn = document.getElementById('csvImportBtn');

        if (!preview || !table) return;

        // Mostra anteprima (max 5 righe)
        var maxPreview = Math.min(data.length, 5);
        var html = '<table class="data-table"><thead><tr><th>Nome</th><th>Email</th><th>Corso</th><th>Data</th></tr></thead><tbody>';
        for (var i = 0; i < maxPreview; i++) {
            var d = data[i];
            html += '<tr>' +
                '<td>' + App.escapeHtml(d.name) + '</td>' +
                '<td>' + App.escapeHtml(d.email) + '</td>' +
                '<td>' + App.escapeHtml(d.course || '—') + '</td>' +
                '<td>' + App.escapeHtml(d.date || '—') + '</td>' +
                '</tr>';
        }
        html += '</tbody></table>';

        table.innerHTML = html;
        if (count) {
            count.textContent = data.length + ' destinatar' + (data.length === 1 ? 'io' : 'i') + ' trovati nel file';
        }

        preview.style.display = '';
        if (importBtn) importBtn.disabled = false;
    },

    importCSV: function () {
        if (!Recipients._parsedCSVData || Recipients._parsedCSVData.length === 0) {
            App.toast('Nessun dato da importare', 'warning');
            return;
        }

        var imported = 0;
        for (var i = 0; i < Recipients._parsedCSVData.length; i++) {
            var d = Recipients._parsedCSVData[i];
            App.state.recipients.push({
                id: generateId(),
                name: d.name,
                email: d.email,
                course: d.course || '',
                date: d.date || new Date().toISOString().split('T')[0],
                status: 'pending',
                selected: false
            });
            imported++;
        }

        App.saveState();
        Recipients._parsedCSVData = null;
        App.closeModal('modalImportCSV');
        Recipients.render();
        App.toast(imported + ' destinatar' + (imported === 1 ? 'io importato' : 'i importati') + ' con successo', 'success');
    },

    // ── Eliminazione ───────────────────────────────────────

    deleteRecipient: function (id) {
        App.state.recipients = App.state.recipients.filter(function (r) { return r.id !== id; });
        App.saveState();
        Recipients.render();
        App.toast('Destinatario eliminato', 'info');
    },

    deleteSelected: function () {
        var before = App.state.recipients.length;
        App.state.recipients = App.state.recipients.filter(function (r) { return !r.selected; });
        var removed = before - App.state.recipients.length;
        App.saveState();
        Recipients.render();

        if (removed > 0) {
            App.toast(removed + ' destinatar' + (removed === 1 ? 'io eliminato' : 'i eliminati'), 'info');
        }
    },

    // ── Selezione ──────────────────────────────────────────

    toggleSelectAll: function () {
        var allSelected = App.state.recipients.every(function (r) { return r.selected; });
        var newState = !allSelected;

        for (var i = 0; i < App.state.recipients.length; i++) {
            App.state.recipients[i].selected = newState;
        }

        // Aggiorna checkbox "checkAll"
        var checkAll = document.getElementById('checkAll');
        if (checkAll) checkAll.checked = newState;

        App.saveState();
        Recipients.render();
    },

    toggleSelect: function (id) {
        for (var i = 0; i < App.state.recipients.length; i++) {
            if (App.state.recipients[i].id === id) {
                App.state.recipients[i].selected = !App.state.recipients[i].selected;
                break;
            }
        }

        // Aggiorna checkbox "checkAll"
        var checkAll = document.getElementById('checkAll');
        if (checkAll) {
            checkAll.checked = App.state.recipients.every(function (r) { return r.selected; }) && App.state.recipients.length > 0;
        }

        App.saveState();
        Recipients.render();
    },

    // ── Ricerca ────────────────────────────────────────────

    search: function () {
        var input = document.getElementById('recipientSearch');
        Recipients._searchFilter = input ? input.value.trim() : '';
        Recipients.render();
    }
};

// ────────────────────────────────────────────────────────────
// History – Storico invii
// ────────────────────────────────────────────────────────────
var History = {

    render: function () {
        var body = document.getElementById('historyBody');
        var emptyState = document.getElementById('historyEmpty');
        var table = document.getElementById('historyTable');

        if (!body) return;

        var historyItems = App.state.history;

        if (historyItems.length === 0) {
            if (emptyState) emptyState.style.display = '';
            if (table) table.style.display = 'none';
            body.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (table) table.style.display = '';

        // Ordina per data piu' recente
        var sorted = historyItems.slice().sort(function (a, b) {
            return new Date(b.sentAt) - new Date(a.sentAt);
        });

        var html = '';
        for (var i = 0; i < sorted.length; i++) {
            var h = sorted[i];

            var statusBadge = h.status === 'opened'
                ? '<span class="badge badge-info">Aperto</span>'
                : '<span class="badge badge-success">Consegnato</span>';

            var sentDate = h.sentAt ? new Date(h.sentAt).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '—';

            var templateName = h.template || '—';

            html += '<tr>' +
                '<td>' +
                '<div><strong>' + App.escapeHtml(h.recipientName) + '</strong></div>' +
                '<div style="font-size:0.75rem;color:var(--gray-500);">' + App.escapeHtml(h.recipientEmail) + '</div>' +
                '</td>' +
                '<td>' + App.escapeHtml(h.course || '—') + '</td>' +
                '<td>' + App.escapeHtml(templateName) + '</td>' +
                '<td>' + App.escapeHtml(sentDate) + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td><div class="row-actions">' +
                '<button class="row-action-btn" title="Visualizza certificato" onclick="History.viewCertificate(\'' + App.escapeHtml(h.id) + '\')">' +
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>' +
                '</button>' +
                '</div></td>' +
                '</tr>';
        }

        body.innerHTML = html;
    },

    viewCertificate: function (historyId) {
        var entry = App.state.history.find(function (h) { return h.id === historyId; });
        if (!entry) {
            App.toast('Elemento non trovato', 'error');
            return;
        }

        if (typeof CertDesigner !== 'undefined' && CertDesigner.renderForRecipient) {
            var container = document.getElementById('certViewContainer');
            if (container) {
                container.innerHTML = '<div class="certificate-preview">' +
                    CertDesigner.renderForRecipient({
                        name: entry.recipientName,
                        course: entry.course,
                        date: entry.sentAt ? entry.sentAt.split('T')[0] : '',
                        certId: entry.certId
                    }, entry.designId || entry.template) +
                    '</div>';
            }
            App.openModal('modalCertView');

            // Segna come aperto
            entry.status = 'opened';
            App.saveState();
        } else {
            App.toast('Designer non disponibile', 'warning');
        }
    },

    exportCSV: function () {
        var historyItems = App.state.history;
        if (historyItems.length === 0) {
            App.toast('Nessun dato da esportare', 'warning');
            return;
        }

        var rows = [];
        rows.push('Nome,Email,Corso,Template,ID Certificato,Data Invio,Stato');

        for (var i = 0; i < historyItems.length; i++) {
            var h = historyItems[i];
            var row = [
                History._csvEscape(h.recipientName || ''),
                History._csvEscape(h.recipientEmail || ''),
                History._csvEscape(h.course || ''),
                History._csvEscape(h.template || ''),
                History._csvEscape(h.certId || ''),
                History._csvEscape(h.sentAt || ''),
                History._csvEscape(h.status || '')
            ];
            rows.push(row.join(','));
        }

        var csvContent = rows.join('\n');
        var blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);

        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'wibocertification_storico_' + new Date().toISOString().split('T')[0] + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        App.toast('File CSV esportato con successo', 'success');
    },

    _csvEscape: function (value) {
        var str = String(value);
        if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }
};

// ────────────────────────────────────────────────────────────
// Inizializzazione
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Carica lo stato
    App.loadState();

    // Setup navigazione
    App._setupNavigation();

    // Setup mobile
    App._setupMobile();

    // Setup filtri template
    App._setupTemplateFilters();

    // Setup ricerca destinatari (input live)
    var searchInput = document.getElementById('recipientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            Recipients.search();
        });
    }

    // Imposta data di default nel designer
    var certDate = document.getElementById('certDate');
    if (certDate && !certDate.value) {
        certDate.value = new Date().toISOString().split('T')[0];
    }

    // Imposta data di default nel modal aggiungi
    var addDate = document.getElementById('addDate');
    if (addDate && !addDate.value) {
        addDate.value = new Date().toISOString().split('T')[0];
    }

    // Inizializza CertDesigner se disponibile
    if (typeof CertDesigner !== 'undefined' && CertDesigner.init) {
        CertDesigner.init();
    }

    // Naviga alla pagina iniziale basata sull'hash
    var initialHash = location.hash.replace('#', '');
    var validPages = ['dashboard', 'templates', 'designer', 'recipients', 'send', 'history', 'verify'];
    if (initialHash && validPages.indexOf(initialHash) !== -1) {
        App.navigate(initialHash);
    } else {
        App.navigate('dashboard');
    }

    // Chiudi modali con click esterno sull'overlay
    var overlays = document.querySelectorAll('.modal-overlay');
    for (var i = 0; i < overlays.length; i++) {
        overlays[i].addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('visible');
            }
        });
    }

    // Chiudi modali con ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var visibleModals = document.querySelectorAll('.modal-overlay.visible');
            for (var j = 0; j < visibleModals.length; j++) {
                visibleModals[j].classList.remove('visible');
            }
        }
    });

    // Aggiorna i valori colore live nel designer
    var colorPrimary = document.getElementById('certColorPrimary');
    var colorPrimaryVal = document.getElementById('colorPrimaryVal');
    if (colorPrimary && colorPrimaryVal) {
        colorPrimary.addEventListener('input', function () {
            colorPrimaryVal.textContent = this.value;
        });
    }

    var colorSecondary = document.getElementById('certColorSecondary');
    var colorSecondaryVal = document.getElementById('colorSecondaryVal');
    if (colorSecondary && colorSecondaryVal) {
        colorSecondary.addEventListener('input', function () {
            colorSecondaryVal.textContent = this.value;
        });
    }

    // Aggiorna anteprima designer quando i campi cambiano
    var designerFields = [
        'certTitle', 'certSubtitle', 'certCourse', 'certDescription',
        'certOrg', 'certSigner', 'certSignerRole', 'certDate',
        'certTemplate', 'certColorPrimary', 'certColorSecondary',
        'certQR', 'certNumber'
    ];

    for (var f = 0; f < designerFields.length; f++) {
        var field = document.getElementById(designerFields[f]);
        if (field) {
            var eventType = (field.type === 'checkbox' || field.tagName === 'SELECT') ? 'change' : 'input';
            field.addEventListener(eventType, function () {
                if (typeof CertDesigner !== 'undefined' && CertDesigner.updatePreview) {
                    CertDesigner.updatePreview();
                }
            });
        }
    }

    // Aggiorna anteprima email quando i campi cambiano nella pagina invio
    var emailFields = ['emailSubject', 'emailSender', 'emailMessage', 'emailLinkedIn', 'emailPDF', 'sendDesign', 'sendRecipients'];
    for (var ef = 0; ef < emailFields.length; ef++) {
        var emailField = document.getElementById(emailFields[ef]);
        if (emailField) {
            var emailEventType = (emailField.type === 'checkbox' || emailField.tagName === 'SELECT') ? 'change' : 'input';
            emailField.addEventListener(emailEventType, function () {
                if (typeof EmailSender !== 'undefined' && EmailSender.renderEmailPreview) {
                    EmailSender.renderEmailPreview();
                }
                // Aggiorna conteggio destinatari
                if (typeof EmailSender !== 'undefined' && EmailSender.updateRecipientsCount) {
                    EmailSender.updateRecipientsCount();
                }
            });
        }
    }
});
