import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2 } from 'lucide-react';
import { db } from './ShowPadCore';

export const GarimpoView = ({ styles, refresh, session }) => {
    const [garimpoInput, setGarimpoInput] = useState("");
    const [garimpoQueue, setGarimpoQueue] = useState([]);
    const [isScraping, setIsScraping] = useState(false);
    const [status, setStatus] = useState("");

    const handleGarimpo = async () => {
        if (!session) {
            alert("Acesse sua conta para salvar as músicas na nuvem.");
            return;
        }

        setIsScraping(true); 
        setStatus("Iniciando Garimpo...");

        for (const url of garimpoQueue) {
            try {
                const nomeMusicaStr = url.split('/').filter(x => x).pop() || "música";
                setStatus(`Extraindo: ${nomeMusicaStr}...`);
                
                const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error("Falha na conexão");

                const html = await response.text();

                // --- ESTRATÉGIA DE TÍTULO DA PÁGINA (Mais estável) ---
                // O padrão costuma ser: "MÚSICA - ARTISTA - Cifra Club"
                const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
                let title = "Nova Música";
                let artist = "Artista";

                if (titleTagMatch && titleTagMatch[1]) {
                    let fullTitle = titleTagMatch[1].replace(/ - Cifra Club/gi, "").trim();
                    if (fullTitle.includes('-')) {
                        const parts = fullTitle.split(' - ');
                        // Cifra Club costuma colocar MÚSICA - ARTISTA ou ARTISTA - MÚSICA dependendo da seção
                        // Vamos tentar capturar os dois e limpar
                        title = parts[0].trim();
                        artist = parts[1] ? parts[1].trim() : "Artista";
                    }
                }

                // Captura da Cifra (o bloco de texto principal)
                const contentMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);

                if (!contentMatch) throw new Error("Layout incompatível");

                const song = {
                    title: title,
                    artist: artist,
                    content: contentMatch[1].replace(/<[^>]*>/g, '').trim(),
                    notes: "", 
                    bpm: 120,
                    creator_id: session.user.id 
                };

                await db.songs.add(song);

            } catch (err) { 
                console.error("Erro no Garimpo:", err);
                alert("Não foi possível extrair: " + url);
            }
        }

        setStatus("✅ Concluído!"); 
        setGarimpoQueue([]); 
        refresh(); 
        
        setTimeout(() => {
            setIsScraping(false);
            setStatus("");
        }, 2000);
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h2 style={{margin:0, color:'#007aff'}}>GARIMPO DE CIFRAS (v7.1.6-Stable)</h2>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    {isScraping && <Loader2 size={14} className="spin" color="#007aff" />}
                    <span style={{fontSize:'11px', color:'#888', fontWeight:'bold'}}>{status}</span>
                </div>
            </div>

            <p style={{fontSize:'12px', color:'#aaa', marginBottom:'15px'}}>
                Extração baseada em metadados (mais estável). Cole os links e processe.
            </p>

            <div style={{display:'flex', gap:'10px', height:'45px', marginBottom:'20px'}}>
                <input 
                    style={{...styles.inputField, flex:1, margin:0}} 
                    placeholder="Cole a URL aqui..." 
                    value={garimpoInput} 
                    onChange={e => setGarimpoInput(e.target.value)}
                    onKeyPress={e => {
                        if (e.key === 'Enter' && garimpoInput) {
                            setGarimpoQueue([...garimpoQueue, garimpoInput]);
                            setGarimpoInput("");
                        }
                    }}
                />
                <button 
                    title="Colar do Clipboard"
                    style={{...styles.headerBtn, height:'100%', padding:'0 15px'}} 
                    onClick={async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            setGarimpoInput(text);
                        } catch (e) { alert("Permita o acesso."); }
                    }}
                >
                    <ClipboardPaste size={18}/>
                </button>
                <button 
                    style={{...styles.addBtn, width: '80px', height: '100%', margin:0}} 
                    onClick={() => {
                        if (garimpoInput) {
                            setGarimpoQueue([...garimpoQueue, garimpoInput]);
                            setGarimpoInput("");
                        }
                    }}
                >
                    OK
                </button>
            </div>

            <div style={styles.scrollList}>
                {garimpoQueue.length === 0 ? (
                    <div style={{color:'#444', textAlign:'center', marginTop:'50px', fontSize:'13px'}}>
                        Fila de links vazia
                    </div>
                ) : (
                    garimpoQueue.map((url, i) => (
                        <div key={i} style={styles.miniItemGarimpo}>
                            <span style={{color: '#FFFFFF', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'85%'}}>
                                {url.split('/').filter(x => x).pop()}
                            </span>
                            <X 
                                size={16} 
                                color="#ff3b30" 
                                style={{cursor:'pointer', minWidth:'16px'}} 
                                onClick={() => setGarimpoQueue(garimpoQueue.filter((_, idx) => idx !== i))}
                            />
                        </div>
                    ))
                )}
            </div>

            <button 
                style={{
                    ...styles.wideGreenBtn, 
                    opacity: (garimpoQueue.length > 0 && !isScraping) ? 1 : 0.5,
                    cursor: (garimpoQueue.length > 0 && !isScraping) ? 'pointer' : 'not-allowed',
                    marginTop: '20px'
                }} 
                onClick={handleGarimpo} 
                disabled={isScraping || garimpoQueue.length === 0}
            >
                {isScraping ? "PROCESSANDO..." : `SALVAR ${garimpoQueue.length} MÚSICA(S) NA BIBLIOTECA`}
            </button>
        </div>
    );
};