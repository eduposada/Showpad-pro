import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    // Habilita CORS para o seu próprio app
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.body;

    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            timeout: 8000
        });
        
        const $ = cheerio.load(data);
        let title = $('h1.t1').text().trim() || $('h1').first().text().trim();
        let artist = $('.header-main-subtitle').text().trim() || $('h2.t3').text().trim() || $('.t3').text().trim();
        
        if (!artist || artist.toLowerCase().includes("cifra club")) {
            $('h2').each((i, el) => {
                const text = $(el).text().trim();
                if (text && !text.toLowerCase().includes("cifra club")) { artist = text; return false; }
            });
        }
        let content = $('pre').text();
        content = content.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");

        return res.status(200).json({ title, artist: artist || "Artista Desconhecido", content });
    } catch (error) {
        return res.status(500).json({ error: "Erro na extração" });
    }
}