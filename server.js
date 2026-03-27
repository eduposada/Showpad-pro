import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    try {
        console.log(`🔎 Minerando: ${url}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
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
        console.log(`   ✅ Sucesso: ${title}`);
        res.json({ title, artist: artist || "Artista Desconhecido", content });
    } catch (error) {
        res.status(500).json({ error: "Falha na conexão" });
    }
});

app.listen(3001, () => console.log(`🚀 SERVIDOR UNIFICADO ATIVO NA PORTA 3001`));