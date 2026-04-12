import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2, Music, Link as LinkIcon, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { db } from './ShowPadCore';

export const GarimpoView = ({ styles, refresh, session }) => {
    const [garimpoInput, setGarimpoInput] = useState("");
    const [garimpoQueue, setGarimpoQueue] = useState([]);
    const [isScraping, setIsScraping] = useState(false);
    const [status, setStatus] = useState("");

    // Função auxiliar para formatar nomes da URL sem forçar tudo maiúsculo
    const formatFromUrl = (str) => {
        if (!str) return "Artista";
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleGarimpo = async () => {
        if (!session) { alert("Acesse sua conta para salvar."); return; }
        setIsScraping(true); 
        setStatus("Iniciando extração...");

        for (const url of garimpoQueue) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/').filter(x => x);
                
                // Ponto de segurança: Se tudo falhar, pegamos daqui (Ex: the-beatles -> The Beatles)
                const artistaFallback = formatFromUrl(pathParts[0]);
                const musicaFallback = formatFromUrl(pathParts[pathParts.length - 1]);
                
                setStatus(`Garimpando: ${musicaFallback}...`);
                
                const response = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error("Falha na conexão");
                const html = await response.text();

                // Captura via Regex
                const titleMatch = html.match(/<h1 class="t1">([^<]+)<\/h1>/) || html.match(/<h1[^>]*>([^<]+)<\/h1>/);
                const artistMatch = html.match(/<h2 class="t3">([^<]+)<\/h2>/) || html.match(/<a[^>]*js-main-artist[^>]*>([^<]+)<\/a>/);
                const contentMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);

                if (contentMatch) {
                    await db.songs.add({ 
                        title: titleMatch ? titleMatch[1].trim() : musicaFallback,
                        artist: artistMatch ? artistMatch[1].trim() : artistaFallback,
                        content: contentMatch[1].replace(/<[^>]*>/g, '').trim(),
                        notes: "", 
                        bpm: 120, 
                        creator_id: session.user.id 
                    });
                }
            } catch (err) { 
                console.error("Erro no Garimpo:", err); 
            }
        }
        setStatus("✅ SUCESSO!"); setGarimpoQueue([]); refresh(); 
        setTimeout(() => { setIsScraping(false); setStatus(""); }, 2000);
    };

    const addToQueue = () => {
        if (garimpoInput.includes('cifraclub.com.br')) {
            setGarimpoQueue([...garimpoQueue, garimpoInput]);
            setGarimpoInput("");
        }
    };

    return (
        <div style={{...styles.garimpoPanel, padding: '30px', background: '#000', height: '100%', overflowY: 'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
                <h1 style={{color:'#fff', fontWeight: '900', margin: 0}}>GARIMPO</h1>
                {status && <span style={{color: '#007aff', fontWeight:'900'}}>{status}</span>}
            </div>

            <div style={{display:'flex', gap:'12px', marginBottom:'30px', background: '#1c1c1e', padding: '10px', borderRadius: '18px', border: '1px solid #333'}}>
                <input 
                    style={{flex:1, background: 'none', border: 'none', color: '#fff', outline: 'none', paddingLeft: '10px', fontSize: '16px'}} 
                    placeholder="Cole o link aqui..." 
                    value={garimpoInput} 
                    onChange={e => setGarimpoInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addToQueue()}
                />
                <button 
                    style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 5px'}}
                    onClick={async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            setGarimpoInput(text);
                        } catch (e) { alert("Permita o acesso."); }
                    }}
                >
                    <ClipboardPaste size={20}/>
                </button>
                <button style={{background:'#007aff', color:'#fff', borderRadius:'12px', padding:'10px 20px', border:'none', fontWeight: '800', cursor: 'pointer'}} onClick={addToQueue}>OK</button>
            </div>

            <div style={{minHeight: '200px', background: '#111', borderRadius: '20px', padding: '20px', border: '1px dashed #333', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {garimpoQueue.length === 0 ? (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', color: '#444'}}>
                        <DownloadCloud size={48} style={{opacity: 0.2}} />
                    </div>
                ) : (
                    garimpoQueue.map((url, i) => {
                        const partes = url.split('/').filter(x => x && !x.includes('cifraclub'));
                        const txtMusica = formatFromUrl(partes.pop());
                        const txtArtista = formatFromUrl(partes.pop());
                        return (
                            <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems: 'center', background:'#1c1c1e', padding:'12px 18px', borderRadius:'10px', border: '1px solid #2c2c2e'}}>
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{color: '#007aff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}}>{txtArtista}</span>
                                    <span style={{color: '#fff', fontSize: '14px', fontWeight: '600'}}>{txtMusica}</span>
                                </div>
                                <X size={20} color="#ff3b30" style={{cursor: 'pointer'}} onClick={() => setGarimpoQueue(garimpoQueue.filter((_, idx) => idx !== i))} />
                            </div>
                        );
                    })
                )}
            </div>

            <button 
                style={{
                    width: '100%', height: '60px', borderRadius: '18px', border: 'none', marginTop: '30px', 
                    backgroundColor: garimpoQueue.length > 0 ? '#34c759' : '#1c1c1e', 
                    color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer'
                }} 
                onClick={handleGarimpo} 
                disabled={isScraping || garimpoQueue.length === 0}
            >
                {isScraping ? <Loader2 size={24} className="spin" /> : `IMPORTAR ${garimpoQueue.length} MÚSICA(S)`}
            </button>
        </div>
    );
};