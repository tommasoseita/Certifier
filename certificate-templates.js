/**
 * Wibo Certification - Certificate Template Engine
 * A full-featured certificate designer with 6 templates, live preview,
 * QR code generation, and export capabilities.
 */

/* ------------------------------------------------------------------ */
/*  Utility: HTML Escaping (XSS Prevention)                           */
/* ------------------------------------------------------------------ */

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------------ */
/*  Utility: Decorative QR Code Generator (SVG)                       */
/* ------------------------------------------------------------------ */

function generateQRCode(text, size) {
    size = size || 120;
    var gridSize = 21;
    var cellSize = size / gridSize;
    var grid = [];
    var i, j, hash, charCode;

    // Seed a deterministic pattern from the text so the same input
    // always produces the same visual.
    hash = 0;
    for (i = 0; i < text.length; i++) {
        charCode = text.charCodeAt(i);
        hash = ((hash << 5) - hash + charCode) | 0;
    }

    // Build the grid
    for (i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (j = 0; j < gridSize; j++) {
            grid[i][j] = 0;
        }
    }

    // Finder patterns (three corners)
    function setFinderPattern(row, col) {
        var r, c;
        for (r = 0; r < 7; r++) {
            for (c = 0; c < 7; c++) {
                if (r === 0 || r === 6 || c === 0 || c === 6) {
                    grid[row + r][col + c] = 1;
                } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                    grid[row + r][col + c] = 1;
                } else {
                    grid[row + r][col + c] = 0;
                }
            }
        }
    }

    setFinderPattern(0, 0);
    setFinderPattern(0, gridSize - 7);
    setFinderPattern(gridSize - 7, 0);

    // Timing patterns
    for (i = 7; i < gridSize - 7; i++) {
        grid[6][i] = i % 2 === 0 ? 1 : 0;
        grid[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Alignment pattern (center-ish)
    var alignRow = gridSize - 9;
    var alignCol = gridSize - 9;
    for (i = -2; i <= 2; i++) {
        for (j = -2; j <= 2; j++) {
            if (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) {
                grid[alignRow + i][alignCol + j] = 1;
            }
        }
    }

    // Fill data area with seeded pseudo-random values derived from the text
    var seed = Math.abs(hash);
    function nextRand() {
        seed = (seed * 16807 + 12345) & 0x7fffffff;
        return seed;
    }

    for (i = 0; i < gridSize; i++) {
        for (j = 0; j < gridSize; j++) {
            // Skip finder, timing, and alignment areas
            var inFinder =
                (i < 8 && j < 8) ||
                (i < 8 && j >= gridSize - 8) ||
                (i >= gridSize - 8 && j < 8);
            var inTiming = (i === 6 || j === 6);
            var inAlign =
                (i >= alignRow - 2 && i <= alignRow + 2 &&
                 j >= alignCol - 2 && j <= alignCol + 2);

            if (!inFinder && !inTiming && !inAlign) {
                grid[i][j] = nextRand() % 3 === 0 ? 1 : 0;
            }
        }
    }

    // Build SVG
    var rects = '';
    for (i = 0; i < gridSize; i++) {
        for (j = 0; j < gridSize; j++) {
            if (grid[i][j]) {
                rects +=
                    '<rect x="' + (j * cellSize).toFixed(2) +
                    '" y="' + (i * cellSize).toFixed(2) +
                    '" width="' + cellSize.toFixed(2) +
                    '" height="' + cellSize.toFixed(2) +
                    '" fill="currentColor"/>';
            }
        }
    }

    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
        size + ' ' + size +
        '" width="' + size + '" height="' + size +
        '" role="img" aria-label="Certificate QR Code">' +
        '<rect width="' + size + '" height="' + size + '" fill="white" rx="4"/>' +
        rects +
        '</svg>'
    );
}

/* ------------------------------------------------------------------ */
/*  Utility: Generate Unique Certificate ID                           */
/* ------------------------------------------------------------------ */

function generateCertificateId() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var id = 'CERT-';
    for (var i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/* ------------------------------------------------------------------ */
/*  Template Helpers                                                   */
/* ------------------------------------------------------------------ */

function buildFooter(data) {
    var safe = {
        signerName: escapeHtml(data.signerName),
        signerRole: escapeHtml(data.signerRole),
        organization: escapeHtml(data.organization),
        date: escapeHtml(data.date),
        certId: escapeHtml(data.certId)
    };

    var qrBlock = '';
    if (data.showQR && data.certId) {
        qrBlock =
            '<div class="cert-qr" style="color:' + escapeHtml(data.primaryColor) + '">' +
            generateQRCode(data.certId, 100) +
            '</div>';
    }

    var numberBlock = '';
    if (data.showNumber && data.certId) {
        numberBlock =
            '<div class="cert-id">Certificate No: ' + safe.certId + '</div>';
    }

    return (
        '<div class="cert-footer">' +
            '<div class="cert-footer-item">' +
                '<div class="cert-signature-line" style="border-color:' + escapeHtml(data.primaryColor) + '"></div>' +
                '<div class="cert-signer-name">' + safe.signerName + '</div>' +
                '<div class="cert-signer-role">' + safe.signerRole + '</div>' +
            '</div>' +
            '<div class="cert-footer-item" style="text-align:center;">' +
                qrBlock +
                numberBlock +
            '</div>' +
            '<div class="cert-footer-item">' +
                '<div class="cert-signature-line" style="border-color:' + escapeHtml(data.primaryColor) + '"></div>' +
                '<div class="cert-date">' + safe.date + '</div>' +
                '<div class="cert-org">' + safe.organization + '</div>' +
            '</div>' +
        '</div>'
    );
}

function buildCoreBody(data, extraStyles) {
    var safe = {
        title: escapeHtml(data.title),
        subtitle: escapeHtml(data.subtitle),
        recipientName: escapeHtml(data.recipientName),
        courseName: escapeHtml(data.courseName),
        description: escapeHtml(data.description)
    };

    return (
        '<div class="cert-title" style="color:' + escapeHtml(data.primaryColor) +
            ';font-family:var(--font-serif);' + (extraStyles || '') + '">' +
            safe.title +
        '</div>' +
        '<div class="cert-subtitle">' + safe.subtitle + '</div>' +
        '<div class="cert-recipient" style="color:' + escapeHtml(data.primaryColor) +
            ';font-family:var(--font-serif);">' +
            safe.recipientName +
        '</div>' +
        (safe.courseName
            ? '<div class="cert-course" style="color:' + escapeHtml(data.secondaryColor) + ';">' +
              safe.courseName + '</div>'
            : '') +
        (safe.description
            ? '<div class="cert-description">' + safe.description + '</div>'
            : '')
    );
}

/* ------------------------------------------------------------------ */
/*  Template 1 – Elegant Classic                                      */
/* ------------------------------------------------------------------ */

function renderElegant(data) {
    var primary = escapeHtml(data.primaryColor || '#b8860b');
    var secondary = escapeHtml(data.secondaryColor || '#1b2a4a');

    // Filigree SVG ornament (horizontal divider)
    var filigree = function(color, width) {
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + (width || 280) + '" height="24" viewBox="0 0 280 24" style="display:block;margin:0 auto;">' +
                '<g fill="none" stroke="' + color + '" stroke-width="0.8" opacity="0.6">' +
                    '<path d="M140 12 C130 4,120 4,110 12 C100 20,90 20,80 12 C70 4,60 4,50 12 C40 20,30 20,20 12"/>' +
                    '<path d="M140 12 C150 4,160 4,170 12 C180 20,190 20,200 12 C210 4,220 4,230 12 C240 20,250 20,260 12"/>' +
                    '<circle cx="140" cy="12" r="3" fill="' + color + '" opacity="0.4"/>' +
                    '<circle cx="140" cy="12" r="6" stroke-width="0.5"/>' +
                    '<line x1="0" y1="12" x2="15" y2="12" stroke-width="0.5"/>' +
                    '<line x1="265" y1="12" x2="280" y2="12" stroke-width="0.5"/>' +
                '</g>' +
            '</svg>'
        );
    };

    // Ornate corner SVG (more detailed than plain CSS borders)
    var cornerSvg = function(rotate) {
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" ' +
                'style="transform:rotate(' + rotate + 'deg);">' +
                '<g fill="none" stroke="' + primary + '" stroke-width="1" opacity="0.7">' +
                    '<path d="M4 4 L4 40 M4 4 L40 4"/>' +
                    '<path d="M8 8 L8 32 M8 8 L32 8" stroke-width="0.5"/>' +
                    '<path d="M4 4 C4 4,20 4,20 20 C20 36,4 36,4 36" stroke-width="0.5" opacity="0.4"/>' +
                    '<circle cx="4" cy="4" r="2.5" fill="' + primary + '" opacity="0.5"/>' +
                    '<path d="M12 4 C12 4,12 12,4 12" stroke-width="0.5" opacity="0.3"/>' +
                '</g>' +
            '</svg>'
        );
    };

    // Wax seal SVG
    var sealSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" style="display:block;margin:0 auto 6px;">' +
            '<defs>' +
                '<radialGradient id="sealGrad" cx="40%" cy="35%" r="60%">' +
                    '<stop offset="0%" stop-color="' + primary + '" stop-opacity="0.9"/>' +
                    '<stop offset="100%" stop-color="' + primary + '" stop-opacity="0.6"/>' +
                '</radialGradient>' +
            '</defs>' +
            '<g>' +
                '<circle cx="32" cy="32" r="28" fill="url(#sealGrad)" opacity="0.15"/>' +
                '<circle cx="32" cy="32" r="28" fill="none" stroke="' + primary + '" stroke-width="1.5" opacity="0.5"/>' +
                '<circle cx="32" cy="32" r="22" fill="none" stroke="' + primary + '" stroke-width="0.5" opacity="0.4"/>' +
                '<circle cx="32" cy="32" r="18" fill="none" stroke="' + primary + '" stroke-width="0.3" opacity="0.3" stroke-dasharray="2 2"/>' +
                '<text x="32" y="37" text-anchor="middle" fill="' + primary + '" font-size="18" font-family="serif" opacity="0.6">&#9733;</text>' +
            '</g>' +
        '</svg>';

    return (
        '<div class="cert cert-elegant" style="' +
            'background:linear-gradient(180deg,#fffdf5 0%,#fdf8ee 50%,#faf3e0 100%);' +
            'border:3px solid ' + primary + ';' +
            'font-family:var(--font-serif);' +
            'position:relative;overflow:hidden;">' +

            /* Subtle paper texture overlay */
            '<div style="position:absolute;inset:0;background:' +
                'radial-gradient(ellipse at 20% 50%,rgba(184,134,11,0.03) 0%,transparent 70%),' +
                'radial-gradient(ellipse at 80% 50%,rgba(27,42,74,0.02) 0%,transparent 70%);' +
                'pointer-events:none;"></div>' +

            /* Ornate double-border */
            '<div class="cert-border" style="' +
                'position:absolute;inset:10px;' +
                'border:2px solid ' + primary + ';' +
                'opacity:0.6;' +
                'pointer-events:none;' +
            '"></div>' +
            '<div style="' +
                'position:absolute;inset:14px;' +
                'border:1px solid ' + primary + ';' +
                'opacity:0.25;' +
                'pointer-events:none;' +
            '"></div>' +

            /* Corner decorations (SVG ornate) */
            '<div style="position:absolute;top:4px;left:4px;">' + cornerSvg(0) + '</div>' +
            '<div style="position:absolute;top:4px;right:4px;">' + cornerSvg(90) + '</div>' +
            '<div style="position:absolute;bottom:4px;left:4px;">' + cornerSvg(270) + '</div>' +
            '<div style="position:absolute;bottom:4px;right:4px;">' + cornerSvg(180) + '</div>' +

            /* Watermark */
            '<div class="cert-watermark" style="' +
                'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
                'font-size:180px;opacity:0.025;color:' + primary + ';font-family:var(--font-serif);' +
                'pointer-events:none;white-space:nowrap;">' +
                escapeHtml(data.organization) +
            '</div>' +

            /* Top filigree ornament */
            '<div style="margin-top:28px;position:relative;z-index:1;">' +
                filigree(primary, 240) +
            '</div>' +

            /* Logo / Org */
            '<div class="cert-logo" style="text-align:center;margin:8px 0 0;color:' + secondary + ';' +
                'font-size:11px;letter-spacing:5px;text-transform:uppercase;font-weight:500;">' +
                escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-size:36px;text-shadow:0 1px 2px rgba(0,0,0,0.05);'
            ) +

            /* Wax seal before footer */
            '<div style="position:relative;z-index:1;margin-top:4px;">' +
                sealSvg +
            '</div>' +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom filigree */
            '<div style="padding-bottom:18px;position:relative;z-index:1;">' +
                filigree(primary, 200) +
            '</div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 2 – Modern Minimal                                       */
/* ------------------------------------------------------------------ */

function renderModern(data) {
    var primary = escapeHtml(data.primaryColor || '#2563eb');
    var secondary = escapeHtml(data.secondaryColor || '#64748b');

    // Dot grid pattern SVG
    var dotGrid =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">' +
            '<defs><pattern id="dotGridModern" width="24" height="24" patternUnits="userSpaceOnUse">' +
                '<circle cx="12" cy="12" r="0.8" fill="' + primary + '" opacity="0.08"/>' +
            '</pattern></defs>' +
            '<rect width="100%" height="100%" fill="url(#dotGridModern)"/>' +
        '</svg>';

    // Abstract geometric accent (layered shapes for top-right)
    var geoAccent =
        '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220" ' +
            'style="position:absolute;top:-30px;right:-30px;pointer-events:none;opacity:0.07;">' +
            '<circle cx="110" cy="110" r="100" fill="none" stroke="' + primary + '" stroke-width="0.5"/>' +
            '<circle cx="110" cy="110" r="75" fill="none" stroke="' + primary + '" stroke-width="0.5"/>' +
            '<circle cx="110" cy="110" r="50" fill="' + primary + '" opacity="0.15"/>' +
            '<rect x="80" y="80" width="60" height="60" fill="none" stroke="' + primary + '" stroke-width="0.5" transform="rotate(45 110 110)"/>' +
        '</svg>';

    // Abstract geometric accent (bottom-left)
    var geoAccent2 =
        '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" ' +
            'style="position:absolute;bottom:-20px;left:-20px;pointer-events:none;opacity:0.05;">' +
            '<circle cx="90" cy="90" r="80" fill="none" stroke="' + secondary + '" stroke-width="0.5"/>' +
            '<circle cx="90" cy="90" r="55" fill="' + secondary + '" opacity="0.2"/>' +
            '<line x1="10" y1="90" x2="170" y2="90" stroke="' + secondary + '" stroke-width="0.3"/>' +
            '<line x1="90" y1="10" x2="90" y2="170" stroke="' + secondary + '" stroke-width="0.3"/>' +
        '</svg>';

    // Minimal horizontal divider
    var divider =
        '<div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:6px 0 20px;position:relative;z-index:1;">' +
            '<div style="width:40px;height:1px;background:' + primary + ';opacity:0.25;"></div>' +
            '<div style="width:6px;height:6px;border:1px solid ' + primary + ';opacity:0.3;transform:rotate(45deg);"></div>' +
            '<div style="width:40px;height:1px;background:' + primary + ';opacity:0.25;"></div>' +
        '</div>';

    return (
        '<div class="cert cert-modern" style="' +
            'background:#ffffff;' +
            'font-family:var(--font-sans);' +
            'position:relative;overflow:hidden;">' +

            dotGrid +

            /* Gradient top strip - thicker, with subtle glow */
            '<div style="position:absolute;top:0;left:0;right:0;height:5px;' +
                'background:linear-gradient(90deg,' + primary + ',' + secondary + ');' +
                'box-shadow:0 2px 12px rgba(37,99,235,0.15);"></div>' +

            geoAccent +
            geoAccent2 +

            /* Floating geometric accents */
            '<div style="position:absolute;top:50px;right:50px;width:20px;height:20px;' +
                'border:1.5px solid ' + primary + ';opacity:0.12;transform:rotate(45deg);"></div>' +
            '<div style="position:absolute;top:70px;right:80px;width:10px;height:10px;' +
                'background:' + primary + ';opacity:0.08;transform:rotate(20deg);"></div>' +
            '<div style="position:absolute;bottom:70px;left:60px;width:14px;height:14px;' +
                'border:1px solid ' + secondary + ';opacity:0.1;transform:rotate(30deg);border-radius:2px;"></div>' +
            '<div style="position:absolute;bottom:50px;left:85px;width:8px;height:8px;' +
                'background:' + secondary + ';opacity:0.06;border-radius:50%;"></div>' +

            /* Left accent bar */
            '<div style="position:absolute;left:0;top:40px;bottom:40px;width:3px;' +
                'background:linear-gradient(180deg,transparent,' + primary + ',transparent);opacity:0.1;"></div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:48px;color:' + secondary + ';' +
                'font-size:11px;letter-spacing:5px;text-transform:uppercase;font-weight:600;' +
                'position:relative;z-index:1;">' +
                escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-family:var(--font-sans);font-weight:700;font-size:32px;letter-spacing:-0.5px;'
            ) +

            divider +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom accent line */
            '<div style="position:absolute;bottom:0;left:0;right:0;height:5px;' +
                'background:linear-gradient(90deg,' + secondary + ',' + primary + ');' +
                'box-shadow:0 -2px 12px rgba(37,99,235,0.1);"></div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 3 – Royal Premium                                        */
/* ------------------------------------------------------------------ */

function renderRoyal(data) {
    var primary = escapeHtml(data.primaryColor || '#7c3aed');
    var secondary = escapeHtml(data.secondaryColor || '#d4af37');

    // Fleur-de-lis SVG
    var fleurDeLis = function(size, color, opacity) {
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 40 40" opacity="' + (opacity || 0.5) + '">' +
                '<g fill="' + color + '">' +
                    '<path d="M20 4 C20 4,24 10,24 16 C24 20,22 22,20 24 C18 22,16 20,16 16 C16 10,20 4,20 4Z"/>' +
                    '<path d="M20 24 C20 24,14 20,10 22 C6 24,6 28,8 30 C10 32,14 30,16 28 C17 27,18 26,20 26 C22 26,23 27,24 28 C26 30,30 32,32 30 C34 28,34 24,30 22 C26 20,20 24,20 24Z"/>' +
                    '<rect x="18" y="26" width="4" height="10" rx="1"/>' +
                    '<rect x="14" y="34" width="12" height="3" rx="1.5"/>' +
                '</g>' +
            '</svg>'
        );
    };

    // Royal ornate corner SVG
    var royalCorner = function(rotate) {
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90" ' +
                'style="transform:rotate(' + rotate + 'deg);">' +
                '<g fill="none" stroke="' + secondary + '" stroke-width="1">' +
                    '<path d="M5 5 L5 55" opacity="0.6"/>' +
                    '<path d="M5 5 L55 5" opacity="0.6"/>' +
                    '<path d="M10 10 L10 42" stroke-width="0.5" opacity="0.4"/>' +
                    '<path d="M10 10 L42 10" stroke-width="0.5" opacity="0.4"/>' +
                    '<path d="M5 5 Q5 25,25 25 Q45 25,45 5" stroke-width="0.5" fill="none" opacity="0.3"/>' +
                    '<circle cx="5" cy="5" r="3" fill="' + secondary + '" opacity="0.5"/>' +
                    '<circle cx="5" cy="5" r="6" stroke-width="0.3" opacity="0.3"/>' +
                    '<path d="M5 15 L15 5" stroke-width="0.3" opacity="0.25"/>' +
                    '<path d="M5 25 L25 5" stroke-width="0.3" opacity="0.15"/>' +
                '</g>' +
            '</svg>'
        );
    };

    // Royal medallion SVG
    var medallion =
        '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90" style="display:block;margin:0 auto;">' +
            '<defs>' +
                '<radialGradient id="royalMedGrad" cx="40%" cy="35%" r="60%">' +
                    '<stop offset="0%" stop-color="' + secondary + '" stop-opacity="0.3"/>' +
                    '<stop offset="100%" stop-color="' + secondary + '" stop-opacity="0.1"/>' +
                '</radialGradient>' +
            '</defs>' +
            '<circle cx="45" cy="45" r="40" fill="url(#royalMedGrad)"/>' +
            '<circle cx="45" cy="45" r="40" fill="none" stroke="' + secondary + '" stroke-width="2" opacity="0.6"/>' +
            '<circle cx="45" cy="45" r="35" fill="none" stroke="' + secondary + '" stroke-width="0.5" opacity="0.4"/>' +
            '<circle cx="45" cy="45" r="30" fill="none" stroke="' + secondary + '" stroke-width="0.3" opacity="0.3" stroke-dasharray="3 3"/>' +
            /* Inner crown icon */
            '<g transform="translate(45,45)" fill="' + secondary + '" opacity="0.7">' +
                '<path d="M-12 4 L-12 -4 L-7 0 L0 -8 L7 0 L12 -4 L12 4 Z" />' +
                '<rect x="-12" y="4" width="24" height="3" rx="1"/>' +
            '</g>' +
        '</svg>';

    // Royal divider
    var royalDivider =
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="16" viewBox="0 0 200 16" style="display:block;margin:2px auto;">' +
            '<g fill="none" stroke="' + secondary + '" stroke-width="0.7" opacity="0.5">' +
                '<line x1="0" y1="8" x2="80" y2="8"/>' +
                '<line x1="120" y1="8" x2="200" y2="8"/>' +
                '<path d="M85 8 L92 2 L100 8 L92 14 Z" fill="' + secondary + '" opacity="0.4"/>' +
                '<path d="M100 8 L108 2 L115 8 L108 14 Z" fill="' + secondary + '" opacity="0.4"/>' +
            '</g>' +
        '</svg>';

    return (
        '<div class="cert cert-royal" style="' +
            'background:linear-gradient(180deg,#1a0a2e 0%,#241545 40%,#2d1b4e 100%);' +
            'color:#f0e6d3;' +
            'font-family:var(--font-serif);' +
            'position:relative;overflow:hidden;">' +

            /* Subtle radial glow behind content */
            '<div style="position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);' +
                'width:80%;height:60%;border-radius:50%;' +
                'background:radial-gradient(ellipse,rgba(124,58,237,0.08) 0%,transparent 70%);' +
                'pointer-events:none;"></div>' +

            /* Ornate borders */
            '<div class="cert-border" style="' +
                'position:absolute;inset:12px;' +
                'border:2px solid ' + secondary + ';' +
                'opacity:0.5;' +
                'pointer-events:none;"></div>' +
            '<div style="' +
                'position:absolute;inset:16px;' +
                'border:1px solid ' + secondary + ';opacity:0.25;' +
                'pointer-events:none;"></div>' +
            '<div style="' +
                'position:absolute;inset:20px;' +
                'border:0.5px solid ' + secondary + ';opacity:0.15;' +
                'pointer-events:none;"></div>' +

            /* Corner decorations */
            '<div style="position:absolute;top:4px;left:4px;">' + royalCorner(0) + '</div>' +
            '<div style="position:absolute;top:4px;right:4px;">' + royalCorner(90) + '</div>' +
            '<div style="position:absolute;bottom:4px;left:4px;">' + royalCorner(270) + '</div>' +
            '<div style="position:absolute;bottom:4px;right:4px;">' + royalCorner(180) + '</div>' +

            /* Fleur-de-lis side accents */
            '<div style="position:absolute;top:50%;left:22px;transform:translateY(-50%);">' +
                fleurDeLis(28, secondary, 0.15) +
            '</div>' +
            '<div style="position:absolute;top:50%;right:22px;transform:translateY(-50%);">' +
                fleurDeLis(28, secondary, 0.15) +
            '</div>' +

            /* Watermark */
            '<div class="cert-watermark" style="' +
                'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
                'font-size:200px;opacity:0.02;color:' + secondary + ';' +
                'font-family:var(--font-serif);pointer-events:none;">' +
                '&#9813;' +
            '</div>' +

            /* Medallion */
            '<div style="margin-top:24px;position:relative;z-index:1;">' +
                medallion +
            '</div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:6px;color:' + secondary + ';' +
                'font-size:11px;letter-spacing:5px;text-transform:uppercase;font-weight:500;">' +
                escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: secondary, secondaryColor: '#e0d0f0' }),
                'color:' + secondary + ';font-size:34px;text-shadow:0 2px 8px rgba(212,175,55,0.15);'
            ) +

            /* Royal divider */
            '<div style="position:relative;z-index:1;">' + royalDivider + '</div>' +

            buildFooter(Object.assign({}, data, { primaryColor: secondary, secondaryColor: '#e0d0f0' })) +

            /* Bottom fleur-de-lis row */
            '<div style="text-align:center;padding-bottom:14px;position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;">' +
                fleurDeLis(18, secondary, 0.35) +
                fleurDeLis(22, secondary, 0.45) +
                fleurDeLis(18, secondary, 0.35) +
            '</div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 4 – Tech & Innovation                                    */
/* ------------------------------------------------------------------ */

function renderTech(data) {
    var primary = escapeHtml(data.primaryColor || '#06b6d4');
    var secondary = escapeHtml(data.secondaryColor || '#8b5cf6');

    // Enhanced circuit SVG with more complex pathways
    var circuitSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">' +
            '<defs>' +
                '<pattern id="circuitPatternV2" width="80" height="80" patternUnits="userSpaceOnUse">' +
                    '<path d="M0 40h25M55 40h25M40 0v25M40 55v25" stroke="' + primary + '" stroke-width="0.5" fill="none" opacity="0.08"/>' +
                    '<path d="M25 40h10 l5-5 v-10" stroke="' + primary + '" stroke-width="0.5" fill="none" opacity="0.06"/>' +
                    '<path d="M40 25v10 l5 5 h10" stroke="' + secondary + '" stroke-width="0.5" fill="none" opacity="0.06"/>' +
                    '<circle cx="40" cy="40" r="2.5" fill="' + primary + '" opacity="0.1"/>' +
                    '<circle cx="40" cy="40" r="1" fill="' + primary + '" opacity="0.2"/>' +
                    '<circle cx="0" cy="40" r="1.5" fill="' + secondary + '" opacity="0.08"/>' +
                    '<circle cx="80" cy="40" r="1.5" fill="' + secondary + '" opacity="0.08"/>' +
                    '<circle cx="40" cy="0" r="1.5" fill="' + secondary + '" opacity="0.08"/>' +
                    '<circle cx="40" cy="80" r="1.5" fill="' + secondary + '" opacity="0.08"/>' +
                    '<rect x="20" y="20" width="4" height="4" fill="none" stroke="' + primary + '" stroke-width="0.3" opacity="0.06"/>' +
                    '<rect x="56" y="56" width="4" height="4" fill="none" stroke="' + secondary + '" stroke-width="0.3" opacity="0.06"/>' +
                '</pattern>' +
                /* Hex grid pattern overlay */
                '<pattern id="hexGrid" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">' +
                    '<path d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z" fill="none" stroke="' + primary + '" stroke-width="0.3" opacity="0.04"/>' +
                '</pattern>' +
            '</defs>' +
            '<rect width="100%" height="100%" fill="url(#circuitPatternV2)"/>' +
            '<rect width="100%" height="100%" fill="url(#hexGrid)"/>' +
        '</svg>';

    // Scan-line effect
    var scanLines =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;opacity:0.03;">' +
            '<defs><pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">' +
                '<line x1="0" y1="0" x2="4" y2="0" stroke="#fff" stroke-width="0.5"/>' +
            '</pattern></defs>' +
            '<rect width="100%" height="100%" fill="url(#scanlines)"/>' +
        '</svg>';

    // Tech border with connection points
    var techBorder =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:12px;pointer-events:none;" viewBox="0 0 800 566">' +
            '<g fill="none" stroke="' + primary + '" stroke-width="0.8" opacity="0.2">' +
                /* Top border with notch */
                '<path d="M0 0 L350 0 L360 10 L440 10 L450 0 L800 0"/>' +
                /* Right border */
                '<path d="M800 0 L800 250 L790 260 L790 306 L800 316 L800 566"/>' +
                /* Bottom border with notch */
                '<path d="M800 566 L450 566 L440 556 L360 556 L350 566 L0 566"/>' +
                /* Left border */
                '<path d="M0 566 L0 316 L10 306 L10 260 L0 250 L0 0"/>' +
            '</g>' +
            /* Node dots at notches */
            '<circle cx="355" cy="5" r="2" fill="' + primary + '" opacity="0.3"/>' +
            '<circle cx="445" cy="5" r="2" fill="' + secondary + '" opacity="0.3"/>' +
            '<circle cx="355" cy="561" r="2" fill="' + secondary + '" opacity="0.3"/>' +
            '<circle cx="445" cy="561" r="2" fill="' + primary + '" opacity="0.3"/>' +
        '</svg>';

    // Tech chip/badge icon
    var chipIcon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52" style="display:block;margin:0 auto;">' +
            '<rect x="12" y="12" width="28" height="28" rx="4" fill="none" stroke="' + primary + '" stroke-width="1.5" opacity="0.5"/>' +
            '<rect x="18" y="18" width="16" height="16" rx="2" fill="' + primary + '" opacity="0.1"/>' +
            /* Pins */
            '<g stroke="' + primary + '" stroke-width="1" opacity="0.4">' +
                '<line x1="20" y1="12" x2="20" y2="4"/><line x1="26" y1="12" x2="26" y2="4"/><line x1="32" y1="12" x2="32" y2="4"/>' +
                '<line x1="20" y1="40" x2="20" y2="48"/><line x1="26" y1="40" x2="26" y2="48"/><line x1="32" y1="40" x2="32" y2="48"/>' +
                '<line x1="12" y1="20" x2="4" y2="20"/><line x1="12" y1="26" x2="4" y2="26"/><line x1="12" y1="32" x2="4" y2="32"/>' +
                '<line x1="40" y1="20" x2="48" y2="20"/><line x1="40" y1="26" x2="48" y2="26"/><line x1="40" y1="32" x2="48" y2="32"/>' +
            '</g>' +
            '<circle cx="26" cy="26" r="4" fill="' + primary + '" opacity="0.3"/>' +
            '<circle cx="26" cy="26" r="2" fill="' + primary + '" opacity="0.6"/>' +
        '</svg>';

    return (
        '<div class="cert cert-tech" style="' +
            'background:linear-gradient(135deg,#0a0f1e 0%,#0f172a 40%,#162033 100%);' +
            'color:#e2e8f0;' +
            'font-family:var(--font-sans);' +
            'position:relative;overflow:hidden;">' +

            /* Ambient glow effects */
            '<div style="position:absolute;top:10%;left:20%;width:200px;height:200px;' +
                'background:radial-gradient(circle,' + primary + ' 0%,transparent 70%);' +
                'opacity:0.04;pointer-events:none;"></div>' +
            '<div style="position:absolute;bottom:15%;right:15%;width:250px;height:250px;' +
                'background:radial-gradient(circle,' + secondary + ' 0%,transparent 70%);' +
                'opacity:0.04;pointer-events:none;"></div>' +

            circuitSvg +
            scanLines +
            techBorder +

            /* Gradient accent strip with glow */
            '<div style="position:absolute;top:0;left:0;right:0;height:3px;' +
                'background:linear-gradient(90deg,transparent 5%,' + primary + ' 30%,' + secondary + ' 70%,transparent 95%);' +
                'box-shadow:0 0 20px ' + primary + '40;"></div>' +

            /* Glowing corner dots with rings */
            '<div style="position:absolute;top:20px;left:20px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:' + primary + ';box-shadow:0 0 10px ' + primary + ',0 0 20px ' + primary + '40;"></div>' +
            '</div>' +
            '<div style="position:absolute;top:20px;right:20px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:' + secondary + ';box-shadow:0 0 10px ' + secondary + ',0 0 20px ' + secondary + '40;"></div>' +
            '</div>' +
            '<div style="position:absolute;bottom:20px;left:20px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:' + secondary + ';box-shadow:0 0 10px ' + secondary + ';"></div>' +
            '</div>' +
            '<div style="position:absolute;bottom:20px;right:20px;">' +
                '<div style="width:6px;height:6px;border-radius:50%;background:' + primary + ';box-shadow:0 0 10px ' + primary + ';"></div>' +
            '</div>' +

            /* Chip icon */
            '<div style="margin-top:36px;position:relative;z-index:1;">' + chipIcon + '</div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:8px;color:' + primary + ';' +
                'font-size:10px;letter-spacing:6px;text-transform:uppercase;font-weight:700;' +
                'position:relative;z-index:1;">' +
                '&lt;/&gt; ' + escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-family:var(--font-sans);font-weight:800;font-size:30px;' +
                'background:linear-gradient(90deg,' + primary + ',' + secondary + ');' +
                '-webkit-background-clip:text;-webkit-text-fill-color:transparent;' +
                'background-clip:text;'
            ) +

            /* Tech divider */
            '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:2px 0 4px;position:relative;z-index:1;">' +
                '<div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,' + primary + ');opacity:0.3;"></div>' +
                '<div style="width:4px;height:4px;background:' + primary + ';transform:rotate(45deg);opacity:0.5;"></div>' +
                '<div style="width:20px;height:1px;background:' + secondary + ';opacity:0.4;"></div>' +
                '<div style="width:4px;height:4px;background:' + secondary + ';transform:rotate(45deg);opacity:0.5;"></div>' +
                '<div style="width:60px;height:1px;background:linear-gradient(90deg,' + secondary + ',transparent);opacity:0.3;"></div>' +
            '</div>' +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom gradient line with glow */
            '<div style="position:absolute;bottom:0;left:0;right:0;height:3px;' +
                'background:linear-gradient(90deg,transparent 5%,' + secondary + ' 30%,' + primary + ' 70%,transparent 95%);' +
                'box-shadow:0 0 20px ' + secondary + '40;"></div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 5 – Nature & Growth                                      */
/* ------------------------------------------------------------------ */

function renderNature(data) {
    var primary = escapeHtml(data.primaryColor || '#16a34a');
    var secondary = escapeHtml(data.secondaryColor || '#65a30d');

    // Enhanced detailed leaf SVG
    var leafSvg = function (x, y, rotate, opacity, size) {
        size = size || 60;
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 60 60" ' +
                'style="position:absolute;top:' + y + ';left:' + x + ';opacity:' + opacity +
                ';transform:rotate(' + rotate + 'deg);pointer-events:none;">' +
                '<path d="M30 5 C15 15, 5 30, 30 55 C55 30, 45 15, 30 5Z" ' +
                    'fill="' + primary + '" opacity="0.10"/>' +
                '<path d="M30 5 C15 15, 5 30, 30 55 C55 30, 45 15, 30 5Z" ' +
                    'fill="none" stroke="' + primary + '" stroke-width="0.5" opacity="0.15"/>' +
                /* Detailed vein structure */
                '<path d="M30 12 L30 48" stroke="' + primary + '" stroke-width="0.6" opacity="0.12" fill="none"/>' +
                '<path d="M30 20 L21 15 M30 25 L19 21 M30 30 L18 27 M30 35 L20 33 M30 40 L22 38" ' +
                    'stroke="' + primary + '" stroke-width="0.4" opacity="0.10" fill="none"/>' +
                '<path d="M30 20 L39 15 M30 25 L41 21 M30 30 L42 27 M30 35 L40 33 M30 40 L38 38" ' +
                    'stroke="' + primary + '" stroke-width="0.4" opacity="0.10" fill="none"/>' +
            '</svg>'
        );
    };

    // Decorative branch SVG
    var branchSvg = function(side) {
        var flip = side === 'right' ? 'scaleX(-1)' : '';
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="200" viewBox="0 0 120 200" ' +
                'style="position:absolute;' + side + ':-10px;top:50%;transform:translateY(-50%) ' + flip + ';pointer-events:none;opacity:0.08;">' +
                '<g fill="none" stroke="' + primary + '" stroke-width="1" stroke-linecap="round">' +
                    '<path d="M60 200 C60 200,60 150,50 120 C40 90,30 80,20 60 C10 40,15 20,25 10"/>' +
                    /* Small branch offshoots */
                    '<path d="M50 120 C50 120,40 115,35 108" stroke-width="0.6"/>' +
                    '<path d="M40 100 C40 100,30 95,25 88" stroke-width="0.6"/>' +
                    '<path d="M30 80 C30 80,20 78,16 72" stroke-width="0.5"/>' +
                    '<path d="M50 120 C50 120,60 112,65 106" stroke-width="0.6"/>' +
                    '<path d="M35 90 C35 90,45 85,50 80" stroke-width="0.5"/>' +
                '</g>' +
                /* Small leaves on branch */
                '<g fill="' + primary + '" opacity="0.12">' +
                    '<ellipse cx="35" cy="105" rx="6" ry="10" transform="rotate(-30 35 105)"/>' +
                    '<ellipse cx="25" cy="85" rx="5" ry="9" transform="rotate(-40 25 85)"/>' +
                    '<ellipse cx="65" cy="103" rx="5" ry="9" transform="rotate(20 65 103)"/>' +
                    '<ellipse cx="50" cy="78" rx="5" ry="8" transform="rotate(15 50 78)"/>' +
                    '<ellipse cx="20" cy="65" rx="4" ry="7" transform="rotate(-35 20 65)"/>' +
                '</g>' +
            '</svg>'
        );
    };

    // Flower/seed of life ornament for center
    var flowerOrnament =
        '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" style="display:block;margin:0 auto;">' +
            '<g fill="none" stroke="' + primary + '" stroke-width="0.6" opacity="0.25">' +
                '<circle cx="25" cy="25" r="8"/>' +
                '<circle cx="25" cy="17" r="8"/>' +
                '<circle cx="25" cy="33" r="8"/>' +
                '<circle cx="18" cy="21" r="8"/>' +
                '<circle cx="32" cy="21" r="8"/>' +
                '<circle cx="18" cy="29" r="8"/>' +
                '<circle cx="32" cy="29" r="8"/>' +
            '</g>' +
            '<circle cx="25" cy="25" r="2.5" fill="' + primary + '" opacity="0.2"/>' +
        '</svg>';

    // Organic divider
    var organicDivider =
        '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="20" viewBox="0 0 220 20" style="display:block;margin:0 auto;">' +
            '<g fill="none" stroke="' + primary + '" stroke-width="0.6" opacity="0.3">' +
                '<path d="M10 10 C30 5,50 5,70 10 C90 15,110 15,130 10 C150 5,170 5,190 10 L210 10"/>' +
                '<ellipse cx="110" cy="10" rx="4" ry="6" fill="' + primary + '" opacity="0.15"/>' +
            '</g>' +
        '</svg>';

    // Watercolor-like spots
    var watercolorSpots =
        '<div style="position:absolute;top:15%;right:10%;width:100px;height:100px;' +
            'background:radial-gradient(circle,' + primary + ' 0%,transparent 70%);' +
            'opacity:0.03;pointer-events:none;border-radius:50%;filter:blur(10px);"></div>' +
        '<div style="position:absolute;bottom:20%;left:8%;width:120px;height:120px;' +
            'background:radial-gradient(circle,' + secondary + ' 0%,transparent 70%);' +
            'opacity:0.03;pointer-events:none;border-radius:50%;filter:blur(12px);"></div>' +
        '<div style="position:absolute;top:40%;left:50%;width:80px;height:80px;' +
            'background:radial-gradient(circle,#facc15 0%,transparent 70%);' +
            'opacity:0.02;pointer-events:none;border-radius:50%;filter:blur(8px);transform:translateX(-50%);"></div>';

    return (
        '<div class="cert cert-nature" style="' +
            'background:linear-gradient(180deg,#f0fdf4 0%,#f7fee7 40%,#fefce8 100%);' +
            'color:#1a2e05;' +
            'font-family:var(--font-serif);' +
            'position:relative;overflow:hidden;">' +

            watercolorSpots +

            /* Subtle organic border */
            '<div style="position:absolute;inset:12px;' +
                'border:1px solid ' + primary + ';opacity:0.12;' +
                'border-radius:4px;pointer-events:none;"></div>' +

            /* Branch decorations on sides */
            branchSvg('left') +
            branchSvg('right') +

            /* Leaf decorations (corners + scattered) */
            leafSvg('12px', '12px', 0, 0.6, 55) +
            leafSvg('calc(100% - 65px)', '12px', 90, 0.6, 55) +
            leafSvg('12px', 'calc(100% - 65px)', -90, 0.6, 55) +
            leafSvg('calc(100% - 65px)', 'calc(100% - 65px)', 180, 0.6, 55) +
            leafSvg('30%', '-5px', 20, 0.25, 40) +
            leafSvg('60%', '-5px', -15, 0.2, 35) +
            leafSvg('25%', 'calc(100% - 40px)', 170, 0.2, 38) +
            leafSvg('65%', 'calc(100% - 45px)', -170, 0.25, 42) +

            /* Soft organic top border */
            '<div style="position:absolute;top:0;left:0;right:0;height:4px;' +
                'background:linear-gradient(90deg,transparent 5%,' + primary + ' 25%,' + secondary + ' 50%,#facc15 75%,transparent 95%);' +
                'opacity:0.7;"></div>' +

            /* Flower ornament */
            '<div style="margin-top:30px;position:relative;z-index:1;">' + flowerOrnament + '</div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:4px;color:' + primary + ';' +
                'font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:500;' +
                'position:relative;z-index:1;">' +
                escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-size:34px;color:' + primary + ';'
            ) +

            /* Organic divider */
            '<div style="position:relative;z-index:1;">' + organicDivider + '</div>' +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom organic border */
            '<div style="position:absolute;bottom:0;left:0;right:0;height:4px;' +
                'background:linear-gradient(90deg,transparent 5%,#facc15 25%,' + secondary + ' 50%,' + primary + ' 75%,transparent 95%);' +
                'opacity:0.7;"></div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 6 – Gradient Bold                                        */
/* ------------------------------------------------------------------ */

function renderGradient(data) {
    var primary = escapeHtml(data.primaryColor || '#ec4899');
    var secondary = escapeHtml(data.secondaryColor || '#8b5cf6');

    // Mesh gradient overlay (simulated with multiple radial gradients)
    var meshOverlay =
        '<div style="position:absolute;inset:0;pointer-events:none;' +
            'background:' +
                'radial-gradient(ellipse at 15% 20%,rgba(255,255,255,0.08) 0%,transparent 50%),' +
                'radial-gradient(ellipse at 85% 25%,rgba(255,255,255,0.06) 0%,transparent 45%),' +
                'radial-gradient(ellipse at 50% 80%,rgba(255,255,255,0.05) 0%,transparent 50%),' +
                'radial-gradient(ellipse at 20% 70%,rgba(0,0,0,0.04) 0%,transparent 40%),' +
                'radial-gradient(ellipse at 80% 75%,rgba(0,0,0,0.04) 0%,transparent 40%);' +
        '"></div>';

    // Noise-like texture overlay for depth
    var noiseSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;opacity:0.03;">' +
            '<defs><pattern id="noiseGrad" width="6" height="6" patternUnits="userSpaceOnUse">' +
                '<circle cx="1" cy="1" r="0.5" fill="white"/>' +
                '<circle cx="4" cy="4" r="0.3" fill="white"/>' +
            '</pattern></defs>' +
            '<rect width="100%" height="100%" fill="url(#noiseGrad)"/>' +
        '</svg>';

    // Glass-morphism card for content area
    var glassStart = '<div style="position:relative;z-index:1;' +
        'background:rgba(255,255,255,0.07);' +
        'border:1px solid rgba(255,255,255,0.12);' +
        'border-radius:16px;' +
        'padding:24px 32px 20px;' +
        'margin:0 40px;' +
        'backdrop-filter:blur(10px);' +
        '-webkit-backdrop-filter:blur(10px);' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.15);">';
    var glassEnd = '</div>';

    // Abstract wave SVG
    var waveSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="60" viewBox="0 0 800 60" preserveAspectRatio="none" ' +
            'style="position:absolute;bottom:0;left:0;right:0;pointer-events:none;">' +
            '<path d="M0 30 C100 10,200 50,300 30 C400 10,500 50,600 30 C700 10,800 50,800 30 L800 60 L0 60 Z" ' +
                'fill="rgba(255,255,255,0.03)"/>' +
            '<path d="M0 40 C150 20,250 55,400 35 C550 15,650 50,800 35 L800 60 L0 60 Z" ' +
                'fill="rgba(255,255,255,0.02)"/>' +
        '</svg>';

    // Star/sparkle decoration
    var sparkle = function(x, y, size, opacity) {
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" ' +
                'style="position:absolute;top:' + y + ';left:' + x + ';opacity:' + opacity + ';pointer-events:none;">' +
                '<path d="M12 2 L13.5 9 L20 8 L14.5 12 L18 18 L12 14 L6 18 L9.5 12 L4 8 L10.5 9 Z" ' +
                    'fill="white" opacity="0.6"/>' +
            '</svg>'
        );
    };

    return (
        '<div class="cert cert-gradient" style="' +
            'background:linear-gradient(135deg,' + primary + ' 0%,' + secondary + ' 100%);' +
            'color:#ffffff;' +
            'font-family:var(--font-sans);' +
            'position:relative;overflow:hidden;">' +

            meshOverlay +
            noiseSvg +

            /* Large decorative circles with more variation */
            '<div style="' +
                'position:absolute;top:-120px;right:-80px;width:380px;height:380px;' +
                'border-radius:50%;background:rgba(255,255,255,0.05);"></div>' +
            '<div style="' +
                'position:absolute;top:-80px;right:-40px;width:300px;height:300px;' +
                'border-radius:50%;border:1px solid rgba(255,255,255,0.06);"></div>' +
            '<div style="' +
                'position:absolute;bottom:-100px;left:-60px;width:320px;height:320px;' +
                'border-radius:50%;background:rgba(255,255,255,0.04);"></div>' +
            '<div style="' +
                'position:absolute;bottom:-60px;left:-20px;width:240px;height:240px;' +
                'border-radius:50%;border:1px solid rgba(255,255,255,0.05);"></div>' +
            '<div style="' +
                'position:absolute;top:35%;left:55%;width:180px;height:180px;' +
                'border-radius:50%;background:rgba(255,255,255,0.03);"></div>' +
            '<div style="' +
                'position:absolute;top:15%;left:10%;width:80px;height:80px;' +
                'border-radius:50%;border:1px solid rgba(255,255,255,0.06);"></div>' +

            /* Sparkles */
            sparkle('8%', '15%', 16, 0.3) +
            sparkle('88%', '12%', 12, 0.2) +
            sparkle('75%', '65%', 14, 0.25) +
            sparkle('15%', '72%', 10, 0.2) +
            sparkle('50%', '8%', 11, 0.15) +

            waveSvg +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:42px;color:rgba(255,255,255,0.8);' +
                'font-size:11px;letter-spacing:6px;text-transform:uppercase;font-weight:700;' +
                'position:relative;z-index:1;">' +
                escapeHtml(data.organization) +
            '</div>' +

            /* Title */
            '<div class="cert-title" style="color:#ffffff;font-family:var(--font-sans);font-weight:800;font-size:36px;' +
                'position:relative;z-index:1;text-shadow:0 2px 20px rgba(0,0,0,0.1);">' +
                escapeHtml(data.title) +
            '</div>' +
            '<div class="cert-subtitle" style="color:rgba(255,255,255,0.8);position:relative;z-index:1;">' +
                escapeHtml(data.subtitle) +
            '</div>' +

            /* Glassmorphism card for recipient info */
            glassStart +
                '<div class="cert-recipient" style="color:#ffffff;font-family:var(--font-serif);' +
                    'text-shadow:0 2px 12px rgba(0,0,0,0.15);margin-bottom:6px;">' +
                    escapeHtml(data.recipientName) +
                '</div>' +
                (data.courseName
                    ? '<div class="cert-course" style="color:rgba(255,255,255,0.9);">' +
                      escapeHtml(data.courseName) + '</div>'
                    : '') +
                (data.description
                    ? '<div class="cert-description" style="color:rgba(255,255,255,0.75);">' +
                      escapeHtml(data.description) + '</div>'
                    : '') +
            glassEnd +

            /* Footer – custom for gradient (white lines) */
            '<div class="cert-footer" style="position:relative;z-index:1;">' +
                '<div class="cert-footer-item">' +
                    '<div class="cert-signature-line" style="border-color:rgba(255,255,255,0.4);"></div>' +
                    '<div class="cert-signer-name" style="color:#fff;">' + escapeHtml(data.signerName) + '</div>' +
                    '<div class="cert-signer-role" style="color:rgba(255,255,255,0.7);">' + escapeHtml(data.signerRole) + '</div>' +
                '</div>' +
                '<div class="cert-footer-item" style="text-align:center;">' +
                    (data.showQR && data.certId
                        ? '<div class="cert-qr" style="color:rgba(255,255,255,0.9);">' +
                          generateQRCode(data.certId, 100) + '</div>'
                        : '') +
                    (data.showNumber && data.certId
                        ? '<div class="cert-id" style="color:rgba(255,255,255,0.7);">Certificate No: ' +
                          escapeHtml(data.certId) + '</div>'
                        : '') +
                '</div>' +
                '<div class="cert-footer-item">' +
                    '<div class="cert-signature-line" style="border-color:rgba(255,255,255,0.4);"></div>' +
                    '<div class="cert-date" style="color:#fff;">' + escapeHtml(data.date) + '</div>' +
                    '<div class="cert-org" style="color:rgba(255,255,255,0.7);">' + escapeHtml(data.organization) + '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  CERT_TEMPLATES Gallery Array                                      */
/* ------------------------------------------------------------------ */

var CERT_TEMPLATES = [
    {
        id: 'elegant',
        name: 'Elegant Classic',
        category: 'completion',
        description: 'Gold filigree ornaments, wax seal, ornate SVG corners and serif typography on warm parchment.',
        render: renderElegant
    },
    {
        id: 'modern',
        name: 'Modern Minimal',
        category: 'excellence',
        description: 'Clean canvas with dot-grid texture, layered geometric accents, and refined typography hierarchy.',
        render: renderModern
    },
    {
        id: 'royal',
        name: 'Royal Premium',
        category: 'participation',
        description: 'Deep purple with gold crown medallion, fleur-de-lis accents, and triple ornate borders.',
        render: renderRoyal
    },
    {
        id: 'tech',
        name: 'Tech & Innovation',
        category: 'achievement',
        description: 'Dark UI with circuit pathways, hex grid overlay, chip icon, glowing nodes and scan-line effects.',
        render: renderTech
    },
    {
        id: 'nature',
        name: 'Nature & Growth',
        category: 'completion',
        description: 'Botanical branches, detailed leaf veins, seed-of-life ornament, and soft watercolor washes.',
        render: renderNature
    },
    {
        id: 'gradient',
        name: 'Gradient Bold',
        category: 'excellence',
        description: 'Vibrant mesh gradient with glassmorphism card, sparkle accents, and layered wave effects.',
        render: renderGradient
    }
];

/* ------------------------------------------------------------------ */
/*  CertDesigner – Main Designer Controller                           */
/* ------------------------------------------------------------------ */

var CertDesigner = {

    _previewEl: null,
    _boundUpdate: null,
    _currentCertId: null,
    _toastTimeout: null,

    /* ---- Initialisation ---- */

    init: function () {
        this._previewEl = document.getElementById('certificatePreview');
        this._currentCertId = generateCertificateId();
        this._boundUpdate = this.updatePreview.bind(this);

        // Bind every relevant input to live-preview updates
        var fieldIds = [
            'certTitle', 'certSubtitle', 'certCourse', 'certDescription',
            'certOrg', 'certSigner', 'certSignerRole', 'certDate',
            'certTemplate', 'certColorPrimary', 'certColorSecondary',
            'certQR', 'certNumber'
        ];

        var self = this;
        fieldIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;

            // Use 'input' for text/color fields, 'change' for selects/checkboxes
            var evtType = 'input';
            if (el.tagName === 'SELECT' || el.type === 'checkbox') {
                evtType = 'change';
            }
            el.addEventListener(evtType, self._boundUpdate);

            // Also bind 'change' on color pickers for when a colour is chosen
            // from the native popover (doesn't always fire 'input')
            if (el.type === 'color') {
                el.addEventListener('change', self._boundUpdate);
            }
        });

        // Try to restore a saved design from localStorage
        this._restoreFromStorage();

        // Initial render
        this.updatePreview();
    },

    /* ---- Read form values ---- */

    _readFormData: function () {
        var val = function (id, fallback) {
            var el = document.getElementById(id);
            if (!el) return fallback || '';
            if (el.type === 'checkbox') return el.checked;
            return el.value || fallback || '';
        };

        return {
            title: val('certTitle', 'Certificate of Completion'),
            subtitle: val('certSubtitle', 'This certificate is proudly presented to'),
            recipientName: val('certRecipient', 'Recipient Name') || 'Recipient Name',
            courseName: val('certCourse', ''),
            description: val('certDescription', ''),
            organization: val('certOrg', 'Wibo Certification'),
            signerName: val('certSigner', ''),
            signerRole: val('certSignerRole', ''),
            date: val('certDate', new Date().toLocaleDateString()),
            templateId: val('certTemplate', 'elegant'),
            primaryColor: val('certColorPrimary', '#b8860b'),
            secondaryColor: val('certColorSecondary', '#1b2a4a'),
            showQR: val('certQR', false),
            showNumber: val('certNumber', false),
            certId: this._currentCertId
        };
    },

    /* ---- Render / Preview ---- */

    _getTemplateById: function (id) {
        for (var i = 0; i < CERT_TEMPLATES.length; i++) {
            if (CERT_TEMPLATES[i].id === id) return CERT_TEMPLATES[i];
        }
        return CERT_TEMPLATES[0]; // default to elegant
    },

    updatePreview: function () {
        if (!this._previewEl) return;

        var data = this._readFormData();
        var template = this._getTemplateById(data.templateId);

        this._previewEl.innerHTML = template.render(data);
    },

    /* ---- Render for a specific recipient (batch/issue mode) ---- */

    /**
     * Renders a certificate for a specific recipient.
     *
     * Accepts two calling conventions:
     *   1) renderForRecipient({ name, course, date, certId }, templateId)
     *   2) renderForRecipient(name, course, date, certId)  // legacy
     *
     * @param {string|Object} nameOrObj  - Recipient name string, or an object with {name, course, date, certId}
     * @param {string}        [courseOrTemplateId] - Course name (legacy) or templateId (object form)
     * @param {string}        [date]     - Date string (legacy only)
     * @param {string}        [certId]   - Certificate ID (legacy only)
     * @returns {string} HTML string
     */
    renderForRecipient: function (nameOrObj, courseOrTemplateId, date, certId) {
        var data = this._readFormData();

        if (nameOrObj && typeof nameOrObj === 'object') {
            // Object-based call: renderForRecipient({name, course, date, certId}, templateId)
            data.recipientName = nameOrObj.name || data.recipientName;
            data.courseName = nameOrObj.course || data.courseName;
            data.date = nameOrObj.date || data.date;
            data.certId = nameOrObj.certId || generateCertificateId();

            // Optional template override (second argument)
            if (courseOrTemplateId) {
                data.templateId = courseOrTemplateId;
            }
        } else {
            // Legacy call: renderForRecipient(name, course, date, certId)
            data.recipientName = nameOrObj || data.recipientName;
            data.courseName = courseOrTemplateId || data.courseName;
            data.date = date || data.date;
            data.certId = certId || generateCertificateId();
        }

        var template = this._getTemplateById(data.templateId);
        return template.render(data);
    },

    /* ---- Persistence ---- */

    saveDesign: function () {
        var data = this._readFormData();
        try {
            localStorage.setItem('wibocertification_design', JSON.stringify(data));

            // Sync into App.state.designs so the send page dropdown can find it
            if (typeof App !== 'undefined' && App.state) {
                var designName = data.title || 'Design';
                var existingIdx = -1;
                for (var i = 0; i < App.state.designs.length; i++) {
                    if (App.state.designs[i].name === designName) {
                        existingIdx = i;
                        break;
                    }
                }
                var entry = {
                    id: existingIdx >= 0 ? App.state.designs[existingIdx].id : ('design-' + Date.now()),
                    name: designName,
                    data: data
                };
                if (existingIdx >= 0) {
                    App.state.designs[existingIdx] = entry;
                } else {
                    App.state.designs.push(entry);
                }
                App.saveState();
            }

            this._showToast('Design saved successfully!');
        } catch (e) {
            this._showToast('Failed to save design.');
        }
    },

    _restoreFromStorage: function () {
        try {
            var raw = localStorage.getItem('wibocertification_design');
            if (!raw) return;

            var saved = JSON.parse(raw);
            var mapping = {
                title: 'certTitle',
                subtitle: 'certSubtitle',
                courseName: 'certCourse',
                description: 'certDescription',
                organization: 'certOrg',
                signerName: 'certSigner',
                signerRole: 'certSignerRole',
                date: 'certDate',
                templateId: 'certTemplate',
                primaryColor: 'certColorPrimary',
                secondaryColor: 'certColorSecondary',
                showQR: 'certQR',
                showNumber: 'certNumber'
            };

            for (var key in mapping) {
                if (!mapping.hasOwnProperty(key)) continue;
                var el = document.getElementById(mapping[key]);
                if (!el || saved[key] === undefined) continue;

                if (el.type === 'checkbox') {
                    el.checked = !!saved[key];
                } else {
                    el.value = saved[key];
                }
            }

            if (saved.certId) {
                this._currentCertId = saved.certId;
            }
        } catch (e) {
            // Silently ignore corrupt storage
        }
    },

    resetDesign: function () {
        var fieldDefaults = {
            certTitle: 'Certificate of Completion',
            certSubtitle: 'This certificate is proudly presented to',
            certCourse: '',
            certDescription: '',
            certOrg: 'Wibo Certification',
            certSigner: '',
            certSignerRole: '',
            certDate: '',
            certTemplate: 'elegant',
            certColorPrimary: '#b8860b',
            certColorSecondary: '#1b2a4a'
        };

        for (var id in fieldDefaults) {
            if (!fieldDefaults.hasOwnProperty(id)) continue;
            var el = document.getElementById(id);
            if (el) el.value = fieldDefaults[id];
        }

        // Reset checkboxes
        var qrEl = document.getElementById('certQR');
        if (qrEl) qrEl.checked = false;
        var numEl = document.getElementById('certNumber');
        if (numEl) numEl.checked = false;

        // New certificate ID
        this._currentCertId = generateCertificateId();

        // Clear saved data
        try {
            localStorage.removeItem('wibocertification_design');
        } catch (e) {
            // ignore
        }

        this.updatePreview();
        this._showToast('Design has been reset.');
    },

    /* ---- Export ---- */

    downloadPDF: function () {
        this._printCertificate();
    },

    downloadCurrentPDF: function () {
        this._printCertificate();
    },

    _printCertificate: function () {
        if (!this._previewEl) return;

        // Ensure the preview is up-to-date
        this.updatePreview();

        // Brief delay so the DOM settles, then trigger print
        setTimeout(function () {
            window.print();
        }, 100);
    },

    /* ---- Toast Notification ---- */

    _showToast: function (message) {
        // Remove any existing toast
        var existing = document.getElementById('wibocertification-toast');
        if (existing) {
            existing.remove();
        }

        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }

        var toast = document.createElement('div');
        toast.id = 'wibocertification-toast';
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        // Inline styles so we don't rely on external CSS for the toast
        toast.style.cssText =
            'position:fixed;bottom:24px;right:24px;z-index:10000;' +
            'padding:14px 28px;border-radius:8px;' +
            'background:#1e293b;color:#f8fafc;font-size:14px;' +
            'font-family:var(--font-sans),system-ui,sans-serif;' +
            'box-shadow:0 8px 24px rgba(0,0,0,0.25);' +
            'opacity:0;transform:translateY(12px);' +
            'transition:opacity 0.3s ease,transform 0.3s ease;';

        document.body.appendChild(toast);

        // Trigger transition
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });
        });

        this._toastTimeout = setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    /* ---- Thumbnail for Template Gallery ---- */

    /**
     * Renders a small thumbnail preview for the template gallery.
     * Uses sample data so every template card shows a realistic miniature.
     *
     * @param {string} templateId - The id of the template to render
     * @returns {string} HTML string of the thumbnail
     */
    renderThumbnail: function (templateId) {
        var sampleData = {
            title: 'Certificate of Completion',
            subtitle: 'This certificate is proudly presented to',
            recipientName: 'Mario Rossi',
            courseName: 'Web Development',
            description: '',
            organization: 'Wibo Certification',
            signerName: 'Prof. Marco Rossi',
            signerRole: 'Director',
            date: new Date().toLocaleDateString(),
            primaryColor: null,   // let the template choose its default
            secondaryColor: null,
            showQR: false,
            showNumber: false,
            certId: 'CERT-THUMB'
        };

        var template = this._getTemplateById(templateId);
        if (!template) return '';

        return '<div style="transform:scale(0.28);transform-origin:top left;width:357%;pointer-events:none;">' +
            template.render(sampleData) +
            '</div>';
    },

    /* ---- Certificate ID Management ---- */

    getCertificateId: function () {
        return this._currentCertId;
    },

    regenerateCertificateId: function () {
        this._currentCertId = generateCertificateId();
        this.updatePreview();
        return this._currentCertId;
    }
};
