import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2, Music, Link as LinkIcon, DownloadCloud, CheckCircle2 } from 'lucide-react';
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
        setStatus("Iniciando extração...");

        for (const url of garimpoQueue) {
            try {
                const nomeMusica = url.split('/').filter(x => x).pop() || "música";
                setStatus(`Garimpando: ${nomeMusica.toUpperCase()}...`);
                
                const response = await fetch('/api/scrape', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ url: url }) 
                });

                if (!response.ok) throw new Error("Falha na extração");

                const song = await response.json();
                
                if (song.title) {
                    await db.songs.add({ 
                        ...song, 
                        notes: "", 
                        bpm: 120,
                        creator_id: session.user.id 
                    });
                }
            } catch (err) { 
                console.error("Erro no Garimpo:", err);
            }
        }

        setStatus("✅ SUCESSO!"); 
        setGarimpoQueue([]); 
        refresh(); 
        
        setTimeout(() => {
            setIsScraping(false);
            setStatus("");
        }, 2000);
    };

    const addToQueue = () => {
        if (garimpoInput && garimpoInput.includes('cifraclub.com.br')) {
            setGarimpoQueue([...garimpoQueue, garimpoInput]);
            setGarimpoInput("");
        } else if (garimpoInput) {
            alert("Por favor, cole um link válido do Cifra Club.");
        }
    };

    return (
        <div style={{...styles.garimpoPanel, padding: '30px', background: '#000'}}>
            {/* Header Estilizado */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                <div>
                    <h1 style={{margin:0, color:'#fff', fontSize: '28px', fontWeight: '900'}}>GARIMPO</h1>
                    <p style={{fontSize:'12px', color:'#888', margin: '5px 0 0 0'}}>Capture cifras do Cifra Club diretamente para sua biblioteca.</p>
                </div>
                {status && (
                    <div style={{
                        display:'flex', 
                        alignItems:'center', 
                        gap:'10px', 
                        backgroundColor: status.includes('✅') ? '#34c75922' : '#007aff22',
                        padding: '8px 15px',
                        borderRadius: '12px',
                        border: `1px solid ${status.includes('✅') ? '#34c75944' : '#007aff44'}`
                    }}>
                        {isScraping && !status.includes('✅') ? <Loader2 size={16} className="spin" color="#007aff" /> : <CheckCircle2 size={16} color="#34c759"/>}
                        <span style={{fontSize:'11px', color: status.includes('✅') ? '#34c759' : '#007aff', fontWeight:'900'}}>{status}</span>
                    </div>
                )}
            </div>

            {/* Barra de Input Profissional */}
            <div style={{display:'flex', gap:'12px', marginBottom:'30px', background: '#1c1c1e', padding: '10px', borderRadius: '18px', border: '1px solid #333'}}>
                <div style={{display: 'flex', alignItems: 'center', paddingLeft: '10px', color: '#666'}}>
                    <LinkIcon size={20} />
                </div>
                <input 
                    style={{
                        flex:1, 
                        background: 'none', 
                        border: 'none', 
                        color: '#fff', 
                        fontSize: '16px', 
                        outline: 'none',
                        padding: '10px'
                    }} 
                    placeholder="Cole o link da cifra aqui..." 
                    value={garimpoInput} 
                    onChange={e => setGarimpoInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addToQueue()}
                />
                <button 
                    title="Colar"
                    style={{
                        background: '#2c2c2e', 
                        border: 'none', 
                        borderRadius: '12px', 
                        color: '#fff', 
                        padding: '0 15px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} 
                    onClick={async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            setGarimpoInput(text);
                        } catch (e) { alert("Permita o acesso à área de transferência."); }
                    }}
                >
                    <ClipboardPaste size={20}/>
                </button>
                <button 
                    style={{
                        backgroundColor: '#007aff', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        padding: '0 25px', 
                        fontWeight: '900', 
                        fontSize: '13px',
                        cursor: 'pointer'
                    }} 
                    onClick={addToQueue}
                >
                    ADICIONAR
                </button>
            </div>

            {/* Fila de Links em Cards Estilizados */}
            <div style={{
                minHeight: '200px', 
                background: '#111', 
                borderRadius: '20px', 
                padding: '20px', 
                border: '1px dashed #333',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {garimpoQueue.length === 0 ? (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#444'}}>
                        <DownloadCloud size={48} style={{marginBottom: '10px', opacity: 0.2}} />
                        <span style={{fontSize: '14px', fontWeight: '600'}}>Nenhum link na fila</span>
                    </div>
                ) : (
                    garimpoQueue.map((url, i) => {
                        // Extração inteligente do Artista e Música da URL
                        const partes = url.split('/').filter(x => x && x !== 'www.cifraclub.com.br' && x !== 'https:' && x !== 'http:');
                        const artista = partes[0]?.replace(/-/g, ' ').toUpperCase() || "ARTISTA";
                        const musica = partes[1]?.replace(/-/g, ' ').toUpperCase() || "MÚSICA";

                        return (
                            <div key={i} style={{
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                background: '#1c1c1e', 
                                padding: '12px 18px', 
                                borderRadius: '12px',
                                border: '1px solid #2c2c2e'
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden', flex: 1}}>
                                    <Music size={18} color="#007aff" style={{minWidth: '18px'}} />
                                    <div style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                                        <span style={{color: '#007aff', fontSize:'10px', fontWeight: '900', letterSpacing: '0.5px'}}>
                                            {artista}
                                        </span>
                                        <span style={{color: '#fff', fontSize:'14px', fontWeight: '600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                            {musica}
                                        </span>
                                    </div>
                                </div>
                                <X 
                                    size={20} 
                                    color="#ff3b30" 
                                    style={{cursor:'pointer', opacity: 0.7, marginLeft: '10px'}} 
                                    onClick={() => setGarimpoQueue(garimpoQueue.filter((_, idx) => idx !== i))}
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {/* Botão de Ação Massiva */}
            <button 
                style={{
                    width: '100%',
                    height: '60px',
                    borderRadius: '18px',
                    border: 'none',
                    marginTop: '30px',
                    fontSize: '16px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    backgroundColor: (garimpoQueue.length > 0 && !isScraping) ? '#34c759' : '#1c1c1e',
                    color: (garimpoQueue.length > 0 && !isScraping) ? '#fff' : '#444',
                    cursor: (garimpoQueue.length > 0 && !isScraping) ? 'pointer' : 'not-allowed',
                    boxShadow: (garimpoQueue.length > 0 && !isScraping) ? '0 10px 20px rgba(52, 199, 89, 0.2)' : 'none'
                }} 
                onClick={handleGarimpo} 
                disabled={isScraping || garimpoQueue.length === 0}
            >
                {isScraping ? (
                    <>
                        <Loader2 size={20} className="spin" />
                        PROCESSANDO...
                    </>
                ) : (
                    <>
                        <DownloadCloud size={20} />
                        IMPORTAR {garimpoQueue.length} MÚSICA{garimpoQueue.length > 1 ? 'S' : ''}
                    </>
                )}
            </button>
        </div>
    );
};