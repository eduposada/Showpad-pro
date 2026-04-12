import { isAllowedCifraClubUrl, scrapeCifraClubUrl } from './api/scrapeCore.js';

function readReqBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

/**
 * No `npm run dev`, responde POST /api/scrape com a mesma lógica de api/scrape.js (Vercel).
 * Deve ficar antes de outros plugins para o Connect tratar a rota antes do fallback SPA.
 */
export function garimpoDevApi() {
    return {
        name: 'showpad-garimpo-dev-api',
        apply: 'serve',
        configureServer(server) {
            server.httpServer?.once('listening', () => {
                console.log('\n[ShowPad] Garimpo no dev: POST /api/scrape atendido localmente (mesma lógica da Vercel).\n')
            })

            server.middlewares.use(async (req, res, next) => {
                const pathOnly = (req.url || '').split('?')[0];
                if (pathOnly !== '/api/scrape') {
                    return next();
                }

                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                if (req.method === 'OPTIONS') {
                    res.statusCode = 204;
                    return res.end();
                }

                if (req.method !== 'POST') {
                    res.statusCode = 405;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ error: 'Método não permitido' }));
                }

                let body = {};
                try {
                    const raw = await readReqBody(req);
                    body = JSON.parse(raw || '{}');
                } catch {
                    body = {};
                }

                const { url } = body;
                if (!url || typeof url !== 'string' || !isAllowedCifraClubUrl(url)) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ error: 'URL inválida. Use apenas links https do Cifra Club.' }));
                }

                try {
                    const payload = await scrapeCifraClubUrl(url);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify(payload));
                } catch (err) {
                    const code = err.statusCode || 500;
                    const msg = err.response?.status ? `HTTP ${err.response.status}` : err.message || 'Erro na extração';
                    res.statusCode = code;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ error: msg }));
                }
            });
        },
    };
}
