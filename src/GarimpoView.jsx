import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2, Music, Link as LinkIcon, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { db } from './ShowPadCore';

export const GarimpoView = ({ styles, refresh, session }) => {
    const [garimpoInput, setGarimpoInput] = useState("");
    const [garimpoQueue, setGarimpoQueue] = useState([]);
    const [isScraping, setIsScraping] = useState(false);
    const [status, setStatus] = useState("");

    const handleGarimpo = async () => {
        if (!session) { alert("Acesse sua conta para salvar."); return; }
        setIsScraping(true); 
        setStatus("Iniciando extração...");

        for (const url of garimpoQueue) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/').filter(x => x);
                const artistaDaUrl = pathParts[0]?.replace(/-/g, ' ') || "Artista";
                
                const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error("Falha");
                const html = await response.text();

                const titleMatch = html.match(/<h1 class="t1">([^<]+)<\/h1>/) || html.match(/<h1[^>]*>([^<]+)<\/h1>/);
                const artistMatch = html.match(/<h2 class="t3">([^<]+)<\/h2>/) || html.match(/<a[^>]*js-main-artist[^>]*>([^<]+)<\/a>/);
                const contentMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);

                if (titleMatch && contentMatch) {
                    await db.songs.add({ 
                        title: titleMatch[1].trim(),
                        artist: (artistMatch ? artistMatch[1].trim() : artistaDaUrl).toUpperCase(),
                        content: contentMatch[1].replace(/<[^>]*>/g, '').trim(),
                        notes: "", bpm: 120, creator_id: session.user.id 
                    });
                }
            } catch (err) { console.error(err); }
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
                <h1 style={{color:'#fff', fontWeight: '900'}}>GARIMPO</h1>
                {status && <span style={{color: '#007aff', fontWeight:'900'}}>{status}</span>}
            </div>

            <div style={{display:'flex', gap:'12px', marginBottom:'30px', background: '#1c1c1e', padding: '10px', borderRadius: '18px'}}>
                <input 
                    style={{flex:1, background: 'none', border: 'none', color: '#fff', outline: 'none'}} 
                    placeholder="Cole o link aqui..." 
                    value={garimpoInput} 
                    onChange={e => setGarimpoInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addToQueue()}
                />
                <button style={{background:'#007aff', color:'#fff', borderRadius:'12px', padding:'10px 20px', border:'none'}} onClick={addToQueue}>OK</button>
            </div>

            <div style={{minHeight: '200px', background: '#111', borderRadius: '20px', padding: '20px', border: '1px dashed #333'}}>
                {garimpoQueue.map((url, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', background:'#1c1c1e', padding:'10px', borderRadius:'10px', marginBottom:'10px'}}>
                        <span style={{color:'#fff'}}>{url.split('/').pop()?.toUpperCase()}</span>
                        <X color="#ff3b30" onClick={() => setGarimpoQueue(garimpoQueue.filter((_, idx) => idx !== i))} />
                    </div>
                ))}
            </div>

            <button 
                style={{width: '100%', height: '60px', borderRadius: '18px', border: 'none', marginTop: '30px', backgroundColor: garimpoQueue.length > 0 ? '#34c759' : '#1c1c1e', color: '#fff'}} 
                onClick={handleGarimpo} 
                disabled={isScraping || garimpoQueue.length === 0}
            >
                {isScraping ? "PROCESSANDO..." : `IMPORTAR ${garimpoQueue.length} MÚSICA(S)`}
            </button>
        </div>
    );
};