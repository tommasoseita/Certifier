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

    return (
        '<div class="cert cert-elegant" style="' +
            'background:#fffdf5;' +
            'border:3px solid ' + primary + ';' +
            'font-family:var(--font-serif);' +
            'position:relative;overflow:hidden;">' +

            /* Ornate double-border */
            '<div class="cert-border" style="' +
                'position:absolute;inset:10px;' +
                'border:2px solid ' + primary + ';' +
                'pointer-events:none;' +
            '"></div>' +

            /* Corner decorations */
            '<div class="cert-corner-tl" style="position:absolute;top:6px;left:6px;width:60px;height:60px;' +
                'border-top:4px solid ' + primary + ';border-left:4px solid ' + primary + ';"></div>' +
            '<div class="cert-corner-tr" style="position:absolute;top:6px;right:6px;width:60px;height:60px;' +
                'border-top:4px solid ' + primary + ';border-right:4px solid ' + primary + ';"></div>' +
            '<div class="cert-corner-bl" style="position:absolute;bottom:6px;left:6px;width:60px;height:60px;' +
                'border-bottom:4px solid ' + primary + ';border-left:4px solid ' + primary + ';"></div>' +
            '<div class="cert-corner-br" style="position:absolute;bottom:6px;right:6px;width:60px;height:60px;' +
                'border-bottom:4px solid ' + primary + ';border-right:4px solid ' + primary + ';"></div>' +

            /* Watermark */
            '<div class="cert-watermark" style="' +
                'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
                'font-size:180px;opacity:0.03;color:' + primary + ';font-family:var(--font-serif);' +
                'pointer-events:none;white-space:nowrap;">' +
                escapeHtml(data.organization) +
            '</div>' +

            /* Decorative top ornament */
            '<div class="cert-deco-top" style="text-align:center;margin-top:30px;color:' + primary + ';font-size:28px;">' +
                '&#10053; &#10053; &#10053;' +
            '</div>' +

            /* Logo / Org */
            '<div class="cert-logo" style="text-align:center;margin:10px 0 0;color:' + secondary + ';' +
                'font-size:14px;letter-spacing:3px;text-transform:uppercase;">' +
                escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-size:36px;'
            ) +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom ornament */
            '<div style="text-align:center;padding-bottom:20px;color:' + primary + ';font-size:20px;">' +
                '&#9733; &#9733; &#9733;' +
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

    return (
        '<div class="cert cert-modern" style="' +
            'background:#ffffff;' +
            'font-family:var(--font-sans);' +
            'position:relative;overflow:hidden;">' +

            /* Gradient top strip */
            '<div style="position:absolute;top:0;left:0;right:0;height:6px;' +
                'background:linear-gradient(90deg,' + primary + ',' + secondary + ');"></div>' +

            /* Geometric accent shapes */
            '<div class="cert-deco-circle" style="' +
                'position:absolute;top:-60px;right:-60px;width:200px;height:200px;' +
                'border-radius:50%;background:' + primary + ';opacity:0.05;"></div>' +
            '<div class="cert-deco-circle" style="' +
                'position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;' +
                'border-radius:50%;background:' + secondary + ';opacity:0.05;"></div>' +

            /* Small geometric squares */
            '<div style="position:absolute;top:40px;right:40px;width:24px;height:24px;' +
                'border:2px solid ' + primary + ';opacity:0.2;transform:rotate(45deg);"></div>' +
            '<div style="position:absolute;bottom:60px;left:50px;width:16px;height:16px;' +
                'background:' + primary + ';opacity:0.1;transform:rotate(15deg);"></div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:50px;color:' + secondary + ';' +
                'font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:600;">' +
                escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-family:var(--font-sans);font-weight:700;font-size:32px;'
            ) +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom accent line */
            '<div style="position:absolute;bottom:0;left:0;right:0;height:3px;' +
                'background:linear-gradient(90deg,' + secondary + ',' + primary + ');"></div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 3 – Royal Premium                                        */
/* ------------------------------------------------------------------ */

function renderRoyal(data) {
    var primary = escapeHtml(data.primaryColor || '#7c3aed');
    var secondary = escapeHtml(data.secondaryColor || '#d4af37');

    return (
        '<div class="cert cert-royal" style="' +
            'background:linear-gradient(180deg,#1a0a2e 0%,#2d1b4e 100%);' +
            'color:#f0e6d3;' +
            'font-family:var(--font-serif);' +
            'position:relative;overflow:hidden;">' +

            /* Ornate border */
            '<div class="cert-border" style="' +
                'position:absolute;inset:12px;' +
                'border:2px solid ' + secondary + ';' +
                'pointer-events:none;"></div>' +
            '<div class="cert-border" style="' +
                'position:absolute;inset:16px;' +
                'border:1px solid ' + secondary + ';opacity:0.5;' +
                'pointer-events:none;"></div>' +

            /* Corner decorations */
            '<div class="cert-corner-tl" style="position:absolute;top:8px;left:8px;width:70px;height:70px;' +
                'border-top:4px solid ' + secondary + ';border-left:4px solid ' + secondary + ';"></div>' +
            '<div class="cert-corner-tr" style="position:absolute;top:8px;right:8px;width:70px;height:70px;' +
                'border-top:4px solid ' + secondary + ';border-right:4px solid ' + secondary + ';"></div>' +
            '<div class="cert-corner-bl" style="position:absolute;bottom:8px;left:8px;width:70px;height:70px;' +
                'border-bottom:4px solid ' + secondary + ';border-left:4px solid ' + secondary + ';"></div>' +
            '<div class="cert-corner-br" style="position:absolute;bottom:8px;right:8px;width:70px;height:70px;' +
                'border-bottom:4px solid ' + secondary + ';border-right:4px solid ' + secondary + ';"></div>' +

            /* Medallion / crest */
            '<div class="cert-deco-circle" style="' +
                'margin:30px auto 0;width:80px;height:80px;' +
                'border-radius:50%;border:3px solid ' + secondary + ';' +
                'display:flex;align-items:center;justify-content:center;' +
                'font-size:32px;color:' + secondary + ';">' +
                '&#9813;' +
            '</div>' +

            /* Watermark */
            '<div class="cert-watermark" style="' +
                'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
                'font-size:200px;opacity:0.03;color:' + secondary + ';' +
                'font-family:var(--font-serif);pointer-events:none;">' +
                '&#9813;' +
            '</div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:10px;color:' + secondary + ';' +
                'font-size:13px;letter-spacing:4px;text-transform:uppercase;">' +
                escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: secondary, secondaryColor: '#e0d0f0' }),
                'color:' + secondary + ';font-size:34px;'
            ) +

            buildFooter(Object.assign({}, data, { primaryColor: secondary, secondaryColor: '#e0d0f0' })) +

            '<div style="text-align:center;padding-bottom:18px;color:' + secondary + ';font-size:18px;">' +
                '&#9830; &#9830; &#9830;' +
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

    // Build a circuit-like SVG pattern
    var circuitSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;opacity:0.06;">' +
            '<defs><pattern id="circuitPattern" width="60" height="60" patternUnits="userSpaceOnUse">' +
                '<path d="M0 30h20M40 30h20M30 0v20M30 40v20" stroke="' + primary + '" stroke-width="1" fill="none"/>' +
                '<circle cx="30" cy="30" r="3" fill="' + primary + '"/>' +
                '<circle cx="0" cy="30" r="2" fill="' + secondary + '"/>' +
                '<circle cx="60" cy="30" r="2" fill="' + secondary + '"/>' +
                '<circle cx="30" cy="0" r="2" fill="' + secondary + '"/>' +
                '<circle cx="30" cy="60" r="2" fill="' + secondary + '"/>' +
            '</pattern></defs>' +
            '<rect width="100%" height="100%" fill="url(#circuitPattern)"/>' +
        '</svg>';

    return (
        '<div class="cert cert-tech" style="' +
            'background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);' +
            'color:#e2e8f0;' +
            'font-family:var(--font-sans);' +
            'position:relative;overflow:hidden;">' +

            circuitSvg +

            /* Gradient accent strip */
            '<div style="position:absolute;top:0;left:0;right:0;height:4px;' +
                'background:linear-gradient(90deg,' + primary + ',' + secondary + ');"></div>' +

            /* Glowing corner dots */
            '<div style="position:absolute;top:20px;left:20px;width:8px;height:8px;border-radius:50%;' +
                'background:' + primary + ';box-shadow:0 0 12px ' + primary + ';"></div>' +
            '<div style="position:absolute;top:20px;right:20px;width:8px;height:8px;border-radius:50%;' +
                'background:' + secondary + ';box-shadow:0 0 12px ' + secondary + ';"></div>' +
            '<div style="position:absolute;bottom:20px;left:20px;width:8px;height:8px;border-radius:50%;' +
                'background:' + secondary + ';box-shadow:0 0 12px ' + secondary + ';"></div>' +
            '<div style="position:absolute;bottom:20px;right:20px;width:8px;height:8px;border-radius:50%;' +
                'background:' + primary + ';box-shadow:0 0 12px ' + primary + ';"></div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:44px;color:' + primary + ';' +
                'font-size:12px;letter-spacing:5px;text-transform:uppercase;font-weight:700;">' +
                '&lt;/&gt; ' + escapeHtml(data.organization) +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-family:var(--font-sans);font-weight:800;font-size:30px;' +
                'background:linear-gradient(90deg,' + primary + ',' + secondary + ');' +
                '-webkit-background-clip:text;-webkit-text-fill-color:transparent;' +
                'background-clip:text;'
            ) +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom gradient line */
            '<div style="position:absolute;bottom:0;left:0;right:0;height:4px;' +
                'background:linear-gradient(90deg,' + secondary + ',' + primary + ');"></div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 5 – Nature & Growth                                      */
/* ------------------------------------------------------------------ */

function renderNature(data) {
    var primary = escapeHtml(data.primaryColor || '#16a34a');
    var secondary = escapeHtml(data.secondaryColor || '#65a30d');

    // Leaf SVG decoration
    var leafSvg = function (x, y, rotate, opacity) {
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" ' +
                'style="position:absolute;top:' + y + ';left:' + x + ';opacity:' + opacity +
                ';transform:rotate(' + rotate + 'deg);pointer-events:none;">' +
                '<path d="M30 5 C15 15, 5 30, 30 55 C55 30, 45 15, 30 5Z" ' +
                    'fill="' + primary + '" opacity="0.12"/>' +
                '<path d="M30 15 L30 45" stroke="' + primary + '" stroke-width="0.8" opacity="0.15" fill="none"/>' +
                '<path d="M30 25 L22 20M30 30 L20 27M30 35 L23 33M30 25 L38 20M30 30 L40 27M30 35 L37 33" ' +
                    'stroke="' + primary + '" stroke-width="0.5" opacity="0.12" fill="none"/>' +
            '</svg>'
        );
    };

    return (
        '<div class="cert cert-nature" style="' +
            'background:linear-gradient(180deg,#f0fdf4 0%,#fefce8 100%);' +
            'color:#1a2e05;' +
            'font-family:var(--font-serif);' +
            'position:relative;overflow:hidden;">' +

            /* Leaf decorations */
            leafSvg('10px', '10px', 0, 0.7) +
            leafSvg('calc(100% - 70px)', '10px', 90, 0.7) +
            leafSvg('10px', 'calc(100% - 70px)', -90, 0.7) +
            leafSvg('calc(100% - 70px)', 'calc(100% - 70px)', 180, 0.7) +
            leafSvg('45%', '5px', 15, 0.3) +
            leafSvg('20%', 'calc(100% - 60px)', -30, 0.3) +

            /* Soft organic top border */
            '<div style="position:absolute;top:0;left:0;right:0;height:5px;' +
                'background:linear-gradient(90deg,' + primary + ',' + secondary + ',#facc15);' +
                'border-radius:0 0 50% 50%;"></div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:40px;color:' + primary + ';' +
                'font-size:13px;letter-spacing:3px;text-transform:uppercase;">' +
                '&#127807; ' + escapeHtml(data.organization) + ' &#127807;' +
            '</div>' +

            buildCoreBody(
                Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary }),
                'font-size:34px;color:' + primary + ';'
            ) +

            buildFooter(Object.assign({}, data, { primaryColor: primary, secondaryColor: secondary })) +

            /* Bottom organic border */
            '<div style="position:absolute;bottom:0;left:0;right:0;height:5px;' +
                'background:linear-gradient(90deg,#facc15,' + secondary + ',' + primary + ');' +
                'border-radius:50% 50% 0 0;"></div>' +
        '</div>'
    );
}

/* ------------------------------------------------------------------ */
/*  Template 6 – Gradient Bold                                        */
/* ------------------------------------------------------------------ */

function renderGradient(data) {
    var primary = escapeHtml(data.primaryColor || '#ec4899');
    var secondary = escapeHtml(data.secondaryColor || '#8b5cf6');

    return (
        '<div class="cert cert-gradient" style="' +
            'background:linear-gradient(135deg,' + primary + ',' + secondary + ');' +
            'color:#ffffff;' +
            'font-family:var(--font-sans);' +
            'position:relative;overflow:hidden;">' +

            /* Large decorative circles */
            '<div class="cert-deco-circle" style="' +
                'position:absolute;top:-100px;right:-100px;width:350px;height:350px;' +
                'border-radius:50%;background:rgba(255,255,255,0.06);"></div>' +
            '<div class="cert-deco-circle" style="' +
                'position:absolute;bottom:-80px;left:-80px;width:280px;height:280px;' +
                'border-radius:50%;background:rgba(255,255,255,0.06);"></div>' +
            '<div class="cert-deco-circle" style="' +
                'position:absolute;top:40%;left:60%;width:150px;height:150px;' +
                'border-radius:50%;background:rgba(255,255,255,0.04);"></div>' +

            /* Organization */
            '<div class="cert-logo" style="text-align:center;margin-top:48px;color:rgba(255,255,255,0.85);' +
                'font-size:12px;letter-spacing:5px;text-transform:uppercase;font-weight:700;">' +
                escapeHtml(data.organization) +
            '</div>' +

            /* Title */
            '<div class="cert-title" style="color:#ffffff;font-family:var(--font-sans);font-weight:800;font-size:36px;">' +
                escapeHtml(data.title) +
            '</div>' +
            '<div class="cert-subtitle" style="color:rgba(255,255,255,0.85);">' +
                escapeHtml(data.subtitle) +
            '</div>' +
            '<div class="cert-recipient" style="color:#ffffff;font-family:var(--font-serif);' +
                'text-shadow:0 2px 12px rgba(0,0,0,0.15);">' +
                escapeHtml(data.recipientName) +
            '</div>' +
            (data.courseName
                ? '<div class="cert-course" style="color:rgba(255,255,255,0.9);">' +
                  escapeHtml(data.courseName) + '</div>'
                : '') +
            (data.description
                ? '<div class="cert-description" style="color:rgba(255,255,255,0.8);">' +
                  escapeHtml(data.description) + '</div>'
                : '') +

            /* Footer – custom for gradient (white lines) */
            '<div class="cert-footer">' +
                '<div class="cert-footer-item">' +
                    '<div class="cert-signature-line" style="border-color:rgba(255,255,255,0.5);"></div>' +
                    '<div class="cert-signer-name" style="color:#fff;">' + escapeHtml(data.signerName) + '</div>' +
                    '<div class="cert-signer-role" style="color:rgba(255,255,255,0.75);">' + escapeHtml(data.signerRole) + '</div>' +
                '</div>' +
                '<div class="cert-footer-item" style="text-align:center;">' +
                    (data.showQR && data.certId
                        ? '<div class="cert-qr" style="color:rgba(255,255,255,0.9);">' +
                          generateQRCode(data.certId, 100) + '</div>'
                        : '') +
                    (data.showNumber && data.certId
                        ? '<div class="cert-id" style="color:rgba(255,255,255,0.8);">Certificate No: ' +
                          escapeHtml(data.certId) + '</div>'
                        : '') +
                '</div>' +
                '<div class="cert-footer-item">' +
                    '<div class="cert-signature-line" style="border-color:rgba(255,255,255,0.5);"></div>' +
                    '<div class="cert-date" style="color:#fff;">' + escapeHtml(data.date) + '</div>' +
                    '<div class="cert-org" style="color:rgba(255,255,255,0.75);">' + escapeHtml(data.organization) + '</div>' +
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
        description: 'Gold and navy design with ornate corners and serif typography for a timeless, formal look.',
        render: renderElegant
    },
    {
        id: 'modern',
        name: 'Modern Minimal',
        category: 'excellence',
        description: 'Clean white canvas with subtle gradient accents and geometric shapes for a contemporary feel.',
        render: renderModern
    },
    {
        id: 'royal',
        name: 'Royal Premium',
        category: 'participation',
        description: 'Deep purple and gold palette with a medallion crest and ornate borders for a regal presentation.',
        render: renderRoyal
    },
    {
        id: 'tech',
        name: 'Tech & Innovation',
        category: 'achievement',
        description: 'Dark background with circuit patterns and neon gradient accents for tech-oriented awards.',
        render: renderTech
    },
    {
        id: 'nature',
        name: 'Nature & Growth',
        category: 'completion',
        description: 'Soft green palette with leaf decorations and organic textures celebrating growth and learning.',
        render: renderNature
    },
    {
        id: 'gradient',
        name: 'Gradient Bold',
        category: 'excellence',
        description: 'Vibrant gradient background with bold white typography for modern, eye-catching certificates.',
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
