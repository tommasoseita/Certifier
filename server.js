import express from 'express';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

/**
 * POST /api/send-email
 * Body: { to, toName, subject, html, fromName }
 * Sends a single email via Resend.
 */
app.post('/api/send-email', async (req, res) => {
    const { to, toName, subject, html, fromName } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ error: 'Campi obbligatori mancanti: to, subject, html' });
    }

    const from = `${fromName || 'Wibo Certification'} <noreply@wibocertification.it>`;
    const recipient = toName ? `${toName} <${to}>` : to;

    try {
        const { data, error } = await resend.emails.send({
            from,
            to: [recipient],
            subject,
            html,
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ ok: true, id: data.id });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// SPA fallback: serve index.html for all unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Wibo Certifier in ascolto su porta ${PORT}`);
});
