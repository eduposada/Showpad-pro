import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rota de saúde (Ping)
app.get('/ping', (req, res) => res.send("ok"));

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    try {
        console.log(`🔎 Tentando minerar: ${url}`);
        
        // Proteção 1: Timeout de 8 segundos. Se o site não responder, o server desiste e segue vivo.
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            timeout: 8000 
        });

        const $ = cheerio.load(response.data);
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

        if (title && content) {
            console.log(`   ✅ Sucesso: ${title}`);
            res.json({ title, artist: artist || "Artista Desconhecido", content });
        } else {
            throw new Error("Conteúdo incompleto");
        }
    } catch (error) {
        // Proteção 2: O Catch garante que o erro não "mate" o servidor
        console.error(`   ⚠️ Falha no link: ${url.split('/').pop()} - Motivo: ${error.message}`);
        res.status(500).json({ error: "Erro ao extrair este link específico." });
    }
});

// Tratamento global de erros para o servidor não crashar nunca
process.on('uncaughtException', (err) => {
    console.error('🔥 Erro Crítico evitado:', err);
});

app.listen(3001, '0.0.0.0', () => {
    console.log(`\n🚀 ASSISTENTE SHOWPAD ATIVO E PROTEGIDO (PORTA 3001)`);
});