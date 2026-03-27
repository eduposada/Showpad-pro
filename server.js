import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rota de saúde
app.get('/ping', (req, res) => res.json({ status: "online" }));

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    try {
        console.log(`🔎 Minerando: ${url}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            timeout: 5000 // Se o site demorar mais de 5s, ele desiste deste link mas NÃO desliga o servidor
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
        console.error("   ⚠️ Erro em um link específico, mas sigo vivo!");
        res.status(500).json({ error: "Erro neste link" });
    }
});

app.listen(3001, () => {
    console.log(`\n🚀 SERVIDOR ANTICHOQUE ATIVO NA PORTA 3001`);
});