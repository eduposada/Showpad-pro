import { isAllowedCifraClubUrl, scrapeCifraClubUrl } from './scrapeCore.js';

function readStreamToString(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

async function getPostJson(req) {
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'string') {
            try {
                return JSON.parse(req.body);
            } catch {
                return {};
            }
        }
        if (Buffer.isBuffer(req.body)) {
            try {
                return JSON.parse(req.body.toString('utf8'));
            } catch {
                return {};
            }
        }
        if (typeof req.body === 'object') {
            return { ...req.body };
        }
    }
    const len = Number(req.headers['content-length'] || 0);
    if (req.method === 'POST' && len > 0) {
        try {
            const raw = await readStreamToString(req);
            return JSON.parse(raw || '{}');
        } catch {
            return {};
        }
    }
    return {};
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const body = await getPostJson(req);
    const { url } = body;

    if (!url || typeof url !== 'string' || !isAllowedCifraClubUrl(url)) {
        return res.status(400).json({ error: 'URL inválida. Use apenas links https do Cifra Club.' });
    }

    try {
        const payload = await scrapeCifraClubUrl(url);
        return res.status(200).json(payload);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        const msg = error.response?.status ? `HTTP ${error.response.status}` : (error.message || 'Erro na extração');
        return res.status(500).json({ error: msg });
    }
}
