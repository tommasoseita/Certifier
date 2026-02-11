/* ========================================
   EMAIL & LINKEDIN SHARING MODULE
   CertifyPro - Piattaforma Certificati Digitali
   ======================================== */

// NOTE: escapeHtml() is defined in certificate-templates.js (loaded before this file).
// Do NOT redefine it here to avoid overwriting the canonical implementation.

/* ========================================
   EMAIL SENDER
   ======================================== */
var EmailSender = {

    /**
     * Renders a realistic email preview into #emailPreview.
     * Uses sample data for placeholders and reads form values from the send page.
     */
    renderEmailPreview: function () {
        var previewEl = document.getElementById('emailPreview');
        if (!previewEl) return;

        var subject = (document.getElementById('emailSubject') || {}).value || '';
        var sender = (document.getElementById('emailSender') || {}).value || 'CertifyPro';
        var message = (document.getElementById('emailMessage') || {}).value || '';
        var showLinkedIn = document.getElementById('emailLinkedIn') ? document.getElementById('emailLinkedIn').checked : true;
        var showPDF = document.getElementById('emailPDF') ? document.getElementById('emailPDF').checked : true;

        // Sample data for preview
        var sampleName = 'Mario Rossi';
        var sampleCourse = 'Web Development Avanzato';
        var sampleEmail = 'mario.rossi@email.com';

        // Replace placeholders with sample data
        var renderedMessage = message
            .replace(/\{nome\}/g, sampleName)
            .replace(/\{corso\}/g, sampleCourse);

        // Build the LinkedIn button HTML
        var linkedInBtnHtml = '';
        if (showLinkedIn) {
            linkedInBtnHtml = '<a class="email-btn email-btn-linkedin" href="#" style="text-decoration:none;">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">' +
                    '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>' +
                '</svg>' +
                'Condividi su LinkedIn' +
            '</a>';
        }

        // Build the PDF download button HTML
        var pdfBtnHtml = '';
        if (showPDF) {
            pdfBtnHtml = '<a class="email-btn email-btn-download" href="#" style="text-decoration:none;">' +
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
                    '<path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                'Scarica Certificato PDF' +
            '</a>';
        }

        // Build buttons section
        var buttonsHtml = '';
        if (showLinkedIn || showPDF) {
            buttonsHtml = '<div class="email-buttons">' + linkedInBtnHtml + pdfBtnHtml + '</div>';
        }

        // Certificate mini preview
        var certPreviewHtml = '<div class="email-cert-preview">' +
            '<div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); border-radius: 6px; padding: 24px 16px; text-align: center; color: white; position: relative; overflow: hidden;">' +
                '<div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.1);"></div>' +
                '<div style="position: absolute; bottom: -30px; left: -10px; width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.08);"></div>' +
                '<div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; margin-bottom: 8px;">Certificato di Completamento</div>' +
                '<div style="font-family: \'Playfair Display\', Georgia, serif; font-size: 18px; font-weight: 600; margin-bottom: 4px;">' + escapeHtml(sampleName) + '</div>' +
                '<div style="font-size: 11px; opacity: 0.9; margin-bottom: 6px;">ha completato con successo</div>' +
                '<div style="font-size: 13px; font-weight: 600;">' + escapeHtml(sampleCourse) + '</div>' +
                '<div style="margin-top: 12px; display: flex; justify-content: center; gap: 24px; font-size: 9px; opacity: 0.7;">' +
                    '<span>CertifyPro Academy</span>' +
                    '<span>' + new Date().toLocaleDateString('it-IT') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';

        // Full email preview
        var html = '<div class="email-preview-frame">' +
            // Header bar with meta info
            '<div class="email-header-bar">' +
                '<div class="email-meta">' +
                    '<div><strong>Da:</strong> ' + escapeHtml(sender) + ' &lt;noreply@certifypro.it&gt;</div>' +
                    '<div><strong>A:</strong> ' + escapeHtml(sampleEmail) + '</div>' +
                    '<div><strong>Oggetto:</strong> ' + escapeHtml(subject) + '</div>' +
                '</div>' +
            '</div>' +
            // Body content
            '<div class="email-body-content">' +
                // Brand section
                '<div class="email-brand">' +
                    '<div class="email-brand-logo">' +
                        '<svg width="24" height="24" viewBox="0 0 28 28" fill="none">' +
                            '<path d="M8 14.5L12 18.5L20 10.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="email-brand-name">CertifyPro</div>' +
                '</div>' +
                // Greeting / message
                '<div class="email-greeting">' + escapeHtml(renderedMessage) + '</div>' +
                // Certificate thumbnail
                certPreviewHtml +
                // Action buttons
                buttonsHtml +
            '</div>' +
            // Footer
            '<div class="email-footer-content">' +
                '<p>Questa email è stata inviata da CertifyPro per conto di ' + escapeHtml(sender) + '.<br>' +
                'Se ritieni di aver ricevuto questa email per errore, puoi ignorarla in sicurezza.</p>' +
                '<p style="margin-top: 8px;">&copy; ' + new Date().getFullYear() + ' CertifyPro. Tutti i diritti riservati.</p>' +
            '</div>' +
        '</div>';

        previewEl.innerHTML = html;
    },

    /**
     * Simulates sending certificates to all selected recipients.
     * Shows a progress modal and animates the sending process.
     */
    sendAll: function () {
        var designSelect = document.getElementById('sendDesign');
        var recipientsSelect = document.getElementById('sendRecipients');

        // Validate design selection
        if (!designSelect || !designSelect.value) {
            App.toast('Seleziona un design del certificato prima di inviare.', 'error');
            return;
        }

        // Determine which recipients to send to
        var allRecipients = (App.state && App.state.recipients) ? App.state.recipients : [];
        var recipientFilter = recipientsSelect ? recipientsSelect.value : 'all';
        var toSend = [];

        if (recipientFilter === 'all') {
            toSend = allRecipients.slice();
        } else if (recipientFilter === 'unsent') {
            toSend = allRecipients.filter(function (r) { return r.status !== 'sent'; });
        } else if (recipientFilter === 'selected') {
            toSend = allRecipients.filter(function (r) { return r.selected; });
        }

        if (toSend.length === 0) {
            App.toast('Nessun destinatario trovato per l\'invio. Aggiungi dei destinatari prima.', 'error');
            return;
        }

        // Get the selected design name for history records
        var designName = designSelect.options[designSelect.selectedIndex]
            ? designSelect.options[designSelect.selectedIndex].text
            : 'Design';

        // Open progress modal
        App.openModal('modalSendProgress');

        // Reset progress UI
        var progressBar = document.getElementById('sendProgressBar');
        var progressCount = document.getElementById('sendProgressCount');
        var progressText = document.getElementById('sendProgressText');
        var progressTitle = document.getElementById('sendProgressTitle');
        var progressAnim = document.getElementById('sendProgressAnim');

        if (progressBar) progressBar.style.width = '0%';
        if (progressCount) progressCount.textContent = '0 / ' + toSend.length;
        if (progressText) progressText.textContent = 'Preparazione certificati...';
        if (progressTitle) progressTitle.textContent = 'Invio in corso...';
        if (progressAnim) progressAnim.innerHTML = '<div class="send-spinner"></div>';

        var total = toSend.length;
        var current = 0;

        /**
         * Simulates sending one certificate at a time with a delay.
         */
        function sendNext() {
            if (current >= total) {
                // All done - show success state
                if (progressTitle) progressTitle.textContent = 'Invio completato!';
                if (progressText) progressText.textContent = 'Tutti i certificati sono stati inviati con successo.';
                if (progressBar) progressBar.style.width = '100%';
                if (progressCount) progressCount.textContent = total + ' / ' + total;

                // Replace spinner with success checkmark
                if (progressAnim) {
                    progressAnim.innerHTML = '<div class="send-success">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
                            '<path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                        '</svg>' +
                    '</div>';
                }

                // Mark recipients as sent in state and add to history
                var now = new Date();
                for (var i = 0; i < toSend.length; i++) {
                    var recipient = toSend[i];
                    recipient.status = 'sent';
                    recipient.sentDate = now.toISOString();

                    // Add history entry
                    if (App.state && App.state.history) {
                        App.state.history.unshift({
                            id: 'hist-' + Date.now() + '-' + i,
                            recipientName: recipient.name,
                            recipientEmail: recipient.email,
                            course: recipient.course || '',
                            template: designName,
                            designId: designSelect.value,
                            sentAt: now.toISOString(),
                            status: 'delivered'
                        });
                    }
                }

                // Save state and update dashboard
                if (typeof App.saveState === 'function') App.saveState();
                if (typeof App.updateDashboard === 'function') App.updateDashboard();

                App.toast(total + ' certificat' + (total === 1 ? 'o inviato' : 'i inviati') + ' con successo!', 'success');

                // Close modal after a delay
                setTimeout(function () {
                    App.closeModal('modalSendProgress');
                }, 2000);

                return;
            }

            current++;
            var recipient = toSend[current - 1];
            var percent = Math.round((current / total) * 100);

            if (progressBar) progressBar.style.width = percent + '%';
            if (progressCount) progressCount.textContent = current + ' / ' + total;
            if (progressText) progressText.textContent = 'Invio a ' + escapeHtml(recipient.name || recipient.email) + '...';

            // Simulate network delay for each send (200-500ms)
            var delay = 200 + Math.floor(Math.random() * 300);
            setTimeout(sendNext, delay);
        }

        // Start sending after a brief initial delay
        setTimeout(sendNext, 600);
    },

    /**
     * Updates the recipients count hint below the recipients selector.
     */
    updateRecipientsCount: function () {
        var countEl = document.getElementById('sendRecipientsCount');
        var recipientsSelect = document.getElementById('sendRecipients');
        if (!countEl) return;

        var allRecipients = (App.state && App.state.recipients) ? App.state.recipients : [];
        var filter = recipientsSelect ? recipientsSelect.value : 'all';
        var count = 0;

        if (filter === 'all') {
            count = allRecipients.length;
        } else if (filter === 'unsent') {
            count = allRecipients.filter(function (r) { return r.status !== 'sent'; }).length;
        } else if (filter === 'selected') {
            count = allRecipients.filter(function (r) { return r.selected; }).length;
        }

        countEl.textContent = count + ' destinatar' + (count === 1 ? 'io selezionato' : 'i selezionati');
    },

    /**
     * Populates the #sendDesign dropdown with saved designs from localStorage.
     */
    populateDesignOptions: function () {
        var select = document.getElementById('sendDesign');
        if (!select) return;

        // Preserve current value
        var currentValue = select.value;

        // Remove all options except the first placeholder
        while (select.options.length > 1) {
            select.remove(1);
        }

        var designs = (App.state && App.state.designs) ? App.state.designs : [];

        for (var i = 0; i < designs.length; i++) {
            var design = designs[i];
            var option = document.createElement('option');
            option.value = design.id || ('design-' + i);
            option.textContent = design.name || ('Design #' + (i + 1));
            select.appendChild(option);
        }

        // Restore previous selection if still present
        if (currentValue) {
            select.value = currentValue;
            // If previous value no longer exists, reset to placeholder
            if (select.value !== currentValue) {
                select.selectedIndex = 0;
            }
        }
    },

    /**
     * Initializes event listeners for live email preview updates.
     * Binds input/change events on all relevant form fields.
     */
    init: function () {
        var self = this;

        var inputIds = ['emailSubject', 'emailSender', 'emailMessage'];
        var checkboxIds = ['emailLinkedIn', 'emailPDF'];
        var selectIds = ['sendDesign', 'sendRecipients'];

        // Text input listeners
        for (var i = 0; i < inputIds.length; i++) {
            (function (id) {
                var el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', function () {
                        self.renderEmailPreview();
                    });
                }
            })(inputIds[i]);
        }

        // Checkbox listeners
        for (var j = 0; j < checkboxIds.length; j++) {
            (function (id) {
                var el = document.getElementById(id);
                if (el) {
                    el.addEventListener('change', function () {
                        self.renderEmailPreview();
                    });
                }
            })(checkboxIds[j]);
        }

        // Select listeners
        for (var k = 0; k < selectIds.length; k++) {
            (function (id) {
                var el = document.getElementById(id);
                if (el) {
                    el.addEventListener('change', function () {
                        if (id === 'sendRecipients') {
                            self.updateRecipientsCount();
                        }
                        self.renderEmailPreview();
                    });
                }
            })(selectIds[k]);
        }

        // Initial render
        this.renderEmailPreview();
        this.populateDesignOptions();
        this.updateRecipientsCount();
    }
};

/* ========================================
   LINKEDIN SHARE
   ======================================== */
var LinkedInShare = {

    /**
     * Generates LinkedIn sharing URLs for a given certificate.
     *
     * @param {Object} certData
     * @param {string} certData.certName      - Name of the certificate / course
     * @param {string} certData.recipientName  - Name of the certificate holder
     * @param {string} certData.orgName        - Issuing organization name
     * @param {string} certData.issueDate      - ISO date string of issuance
     * @param {string} certData.certUrl        - Public verification URL for the cert
     * @param {string} certData.certId         - Unique certificate ID
     *
     * @returns {Object} { shareUrl, addToProfileUrl }
     */
    getShareUrl: function (certData) {
        var data = certData || {};

        // Build the public URL that will be shared
        var certUrl = data.certUrl || (window.location.origin + '/verify/' + (data.certId || ''));

        // LinkedIn share-offsite URL
        var shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(certUrl);

        // LinkedIn add-to-profile URL for the certifications section
        var issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
        var issueYear = issueDate.getFullYear();
        var issueMonth = issueDate.getMonth() + 1; // 1-based

        var addToProfileUrl = 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME' +
            '&name=' + encodeURIComponent(data.certName || '') +
            '&organizationName=' + encodeURIComponent(data.orgName || 'CertifyPro') +
            '&issueYear=' + issueYear +
            '&issueMonth=' + issueMonth +
            '&certUrl=' + encodeURIComponent(certUrl) +
            '&certId=' + encodeURIComponent(data.certId || '');

        return {
            shareUrl: shareUrl,
            addToProfileUrl: addToProfileUrl
        };
    },

    /**
     * Opens the LinkedIn share dialog in a centered popup window.
     *
     * @param {Object} certData - Certificate data (same shape as getShareUrl)
     */
    openShareDialog: function (certData) {
        var urls = this.getShareUrl(certData);
        var shareUrl = urls.shareUrl;

        // Calculate centered popup position
        var width = 600;
        var height = 600;
        var left = Math.round((window.screen.width - width) / 2);
        var top = Math.round((window.screen.height - height) / 2);

        var features = 'width=' + width +
            ',height=' + height +
            ',left=' + left +
            ',top=' + top +
            ',toolbar=no' +
            ',menubar=no' +
            ',scrollbars=yes' +
            ',resizable=yes';

        window.open(shareUrl, 'linkedin-share', features);
    },

    /**
     * Returns the LinkedIn "Add to Profile" URL for a certificate.
     *
     * @param {Object} certData - Certificate data (same shape as getShareUrl)
     * @returns {string} The add-to-profile URL
     */
    getAddToProfileUrl: function (certData) {
        var urls = this.getShareUrl(certData);
        return urls.addToProfileUrl;
    }
};
