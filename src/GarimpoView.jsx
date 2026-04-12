import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2, DownloadCloud } from 'lucide-react';
import { db } from './ShowPadCore';

/** Mesmo caminho que na Vercel. No dev, o Vite (vite.config) faz proxy para VITE_API_SCRAPE_URL se estiver no .env. */
const SCRAPE_API_PATH = '/api/scrape';

function parseHtmlCifra(html) {
    const titleMatch = html.match(/<h1 class="t1">([^<]+)<\/h1>/) || html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const artistMatch = html.match(/<h2 class="t3">([^<]+)<\/h2>/) || html.match(/<a[^>]*js-main-artist[^>]*>([^<]+)<\/a>/);
    const contentMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    if (!contentMatch) {
        return { ok: false, error: 'Cifra não encontrada no HTML.' };
    }
    const content = contentMatch[1].replace(/<[^>]*>/g, '').trim();
    if (!content) {
        return { ok: false, error: 'Bloco <pre> da cifra está vazio (resposta inválida ou página errada).' };
    }
    return {
        ok: true,
        title: titleMatch ? titleMatch[1].trim() : 'Música',
        artist: artistMatch ? artistMatch[1].trim() : 'Artista',
        content,
    };
}

function isNonJsonBodyProbablySpa(text) {
    const t = (text || '').trimStart();
    return t.startsWith('<!') || t.startsWith('<html') || t.startsWith('<HTML');
}

async function scrapeViaApi(endpoint, url) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        const text = await response.text();
        let data = {};
        try {
            data = JSON.parse(text);
        } catch {
            if (response.ok && isNonJsonBodyProbablySpa(text)) {
                return {
                    ok: false,
                    error:
                        'A API devolveu HTML em vez de JSON. No dev: crie .env com VITE_API_SCRAPE_URL=https://seu-app.vercel.app e reinicie o npm run dev.',
                };
            }
            data = {};
        }
        if (!response.ok) {
            return { ok: false, error: data.error || `API: ${response.status}` };
        }
        const content = data.content != null ? String(data.content).trim() : '';
        if (!content) {
            return { ok: false, error: data.error || 'Cifra vazia na resposta do servidor.' };
        }
        return {
            ok: true,
            title: (data.title || '').trim() || 'Música',
            artist: (data.artist || '').trim() || 'Artista',
            content,
        };
    } catch (e) {
        return { ok: false, error: e.message || 'Falha de rede na API.' };
    }
}

async function scrapeViaCorsproxy(url) {
    try {
        const response = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
        const text = await response.text();
        if (!response.ok) {
            try {
                const j = JSON.parse(text);
                if (j.error) return { ok: false, error: `Proxy: ${j.error}` };
            } catch {
                /* ignore */
            }
            return { ok: false, error: `Proxy HTTP ${response.status}` };
        }
        try {
            const j = JSON.parse(text);
            if (j.error && !text.includes('<pre')) {
                return { ok: false, error: `Proxy: ${j.error}` };
            }
        } catch {
            /* HTML esperado */
        }
        const parsed = parseHtmlCifra(text);
        if (!parsed.ok) return parsed;
        if (!parsed.content.trim()) {
            return { ok: false, error: 'Cifra vazia após leitura do HTML (proxy).' };
        }
        return parsed;
    } catch (e) {
        return { ok: false, error: e.message || 'Falha no proxy.' };
    }
}

export const GarimpoView = ({ styles, refresh, session }) => {
    const [garimpoInput, setGarimpoInput] = useState('');
    const [garimpoQueue, setGarimpoQueue] = useState([]);
    const [isScraping, setIsScraping] = useState(false);
    const [status, setStatus] = useState('');

    const formatFromUrl = (str) => {
        if (!str) return 'Artista';
        return str.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleGarimpo = async () => {
        if (!session) {
            alert('Acesse sua conta para salvar.');
            return;
        }
        setIsScraping(true);
        setStatus('Iniciando extração...');

        const failed = [];
        let imported = 0;

        for (const url of garimpoQueue) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/').filter((x) => x);
                const artistaFallback = formatFromUrl(pathParts[0]);
                const musicaFallback = formatFromUrl(pathParts[pathParts.length - 1]);

                setStatus(`Garimpando: ${musicaFallback}...`);

                let result = await scrapeViaApi(SCRAPE_API_PATH, url);
                if (!result.ok) {
                    result = await scrapeViaCorsproxy(url);
                }

                if (!result.ok) {
                    failed.push({ url, reason: result.error || 'Falha desconhecida' });
                    continue;
                }
                if (!result.content || !String(result.content).trim()) {
                    failed.push({ url, reason: 'Cifra vazia — importação cancelada.' });
                    continue;
                }

                await db.songs.add({
                    title: result.title || musicaFallback,
                    artist: result.artist || artistaFallback,
                    content: result.content,
                    notes: '',
                    bpm: 120,
                    creator_id: session.user.id,
                });
                imported += 1;
            } catch (err) {
                console.error('Erro no Garimpo:', err);
                failed.push({ url, reason: err.message || 'Erro inesperado' });
            }
        }

        setGarimpoQueue(failed.map((f) => f.url));

        if (imported > 0) {
            await refresh();
        }

        if (imported > 0 && failed.length === 0) {
            setStatus(`✅ ${imported} música(s) importada(s).`);
        } else if (imported > 0 && failed.length > 0) {
            setStatus(`⚠️ ${imported} ok, ${failed.length} falha(s). Veja o alerta.`);
            alert(
                `Importadas: ${imported}.\nFalharam:\n${failed.map((f) => `• ${f.reason}\n  ${f.url}`).join('\n')}`
            );
        } else if (failed.length > 0) {
            setStatus('❌ Nenhuma música importada.');
            const hint =
                import.meta.env.DEV && !import.meta.env.VITE_API_SCRAPE_URL
                    ? '\n\nDica (dev): no .env defina VITE_API_SCRAPE_URL=https://seu-app.vercel.app (sem / no fim) e reinicie o Vite — o proxy usa o mesmo /api/scrape que na Vercel.'
                    : '';
            alert(`${failed.map((f) => `${f.reason}\n${f.url}`).join('\n\n')}${hint}`);
        } else {
            setStatus('');
        }

        setTimeout(() => {
            setIsScraping(false);
            if (imported > 0 && failed.length === 0) {
                setStatus('');
            }
        }, 2500);
    };

    const addToQueue = () => {
        if (garimpoInput.includes('cifraclub.com.br')) {
            setGarimpoQueue([...garimpoQueue, garimpoInput]);
            setGarimpoInput('');
        }
    };

    return (
        <div style={{ ...styles.garimpoPanel, padding: '30px', background: '#000', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h1 style={{ color: '#fff', fontWeight: '900', margin: 0 }}>GARIMPO</h1>
                {status && <span style={{ color: '#007aff', fontWeight: '900', fontSize: '12px', textAlign: 'right', maxWidth: '55%' }}>{status}</span>}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', background: '#1c1c1e', padding: '10px', borderRadius: '18px', border: '1px solid #333' }}>
                <input
                    style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', paddingLeft: '10px', fontSize: '16px' }}
                    placeholder="Cole o link aqui..."
                    value={garimpoInput}
                    onChange={(e) => setGarimpoInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToQueue()}
                />
                <button
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 5px' }}
                    type="button"
                    onClick={async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            setGarimpoInput(text);
                        } catch (e) {
                            alert('Permita o acesso.');
                        }
                    }}
                >
                    <ClipboardPaste size={20} />
                </button>
                <button type="button" style={{ background: '#007aff', color: '#fff', borderRadius: '12px', padding: '10px 20px', border: 'none', fontWeight: '800', cursor: 'pointer' }} onClick={addToQueue}>
                    OK
                </button>
            </div>

            <div style={{ minHeight: '200px', background: '#111', borderRadius: '20px', padding: '20px', border: '1px dashed #333', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {garimpoQueue.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', color: '#444' }}>
                        <DownloadCloud size={48} style={{ opacity: 0.2 }} />
                    </div>
                ) : (
                    garimpoQueue.map((url, i) => {
                        const partes = url.split('/').filter((x) => x && !x.includes('cifraclub'));
                        const txtMusica = formatFromUrl(partes.pop());
                        const txtArtista = formatFromUrl(partes.pop());
                        return (
                            <div key={`${url}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1e', padding: '12px 18px', borderRadius: '10px', border: '1px solid #2c2c2e' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#007aff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>{txtArtista}</span>
                                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{txtMusica}</span>
                                </div>
                                <X size={20} color="#ff3b30" style={{ cursor: 'pointer' }} onClick={() => setGarimpoQueue(garimpoQueue.filter((_, idx) => idx !== i))} />
                            </div>
                        );
                    })
                )}
            </div>

            <button
                type="button"
                style={{
                    width: '100%',
                    height: '60px',
                    borderRadius: '18px',
                    border: 'none',
                    marginTop: '30px',
                    backgroundColor: garimpoQueue.length > 0 ? '#34c759' : '#1c1c1e',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '16px',
                    cursor: 'pointer',
                }}
                onClick={handleGarimpo}
                disabled={isScraping || garimpoQueue.length === 0}
            >
                {isScraping ? <Loader2 size={24} className="spin" /> : `IMPORTAR ${garimpoQueue.length} MÚSICA(S)`}
            </button>
        </div>
    );
};
