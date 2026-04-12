import axios from 'axios';
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function isAllowedCifraClubUrl(urlString) {
    try {
        const u = new URL(urlString);
        if (u.protocol !== 'https:') return false;
        const h = u.hostname.toLowerCase();
        return h === 'cifraclub.com.br' || h.endsWith('.cifraclub.com.br');
    } catch {
        return false;
    }
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

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body || '{}');
        } catch {
            return res.status(400).json({ error: 'JSON inválido' });
        }
    }
    const { url } = body || {};

    if (!url || typeof url !== 'string' || !isAllowedCifraClubUrl(url)) {
        return res.status(400).json({ error: 'URL inválida. Use apenas links https do Cifra Club.' });
    }

    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
            timeout: 9000,
            maxRedirects: 5,
        });

        const $ = cheerio.load(data);
        let title = $('h1.t1').text().trim() || $('h1').first().text().trim();
        let artist = $('.header-main-subtitle').text().trim() || $('h2.t3').text().trim() || $('.t3').text().trim();

        if (!artist || artist.toLowerCase().includes('cifra club')) {
            $('h2').each((i, el) => {
                const text = $(el).text().trim();
                if (text && !text.toLowerCase().includes('cifra club')) {
                    artist = text;
                    return false;
                }
            });
        }

        let content = $('pre').first().text().trim();
        if (!content) {
            content = $('pre').text().trim();
        }
        content = content
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/\u00a0/g, ' ');

        if (!content) {
            return res.status(422).json({ error: 'Não foi possível encontrar a cifra (<pre>) nesta página.' });
        }

        return res.status(200).json({
            title: title || 'Música',
            artist: artist || 'Artista Desconhecido',
            content,
        });
    } catch (error) {
        const msg = error.response?.status ? `HTTP ${error.response.status}` : (error.message || 'Erro na extração');
        return res.status(500).json({ error: msg });
    }
}
