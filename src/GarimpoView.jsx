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
                const nomeMusica = url.split('/').filter(x => x).pop() || "música";
                setStatus(`Extraindo: ${nomeMusica}...`);
                
                // Chamada para a Serverless Function na Vercel
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
                        creator_id: session.user.id 
                    });
                }
            } catch (err) { 
                console.error("Erro no Garimpo:", err);
                alert("Não foi possível extrair: " + url);
            }
        }

        setIsScraping(false); 
        setStatus("✅ Concluído!"); 
        setGarimpoQueue([]); 
        refresh(); // Atualiza a lista na lateral esquerda
        
        // Limpa o status após 3 segundos
        setTimeout(() => setStatus(""), 3000);
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h2 style={{margin:0, color:'#007aff'}}>GARIMPO DE CIFRAS</h2>
                <span style={{fontSize:'10px', color:'#888'}}>{status}</span>
            </div>

            <p style={{fontSize:'12px', color:'#aaa', marginBottom:'15px'}}>
                Cole abaixo links do Cifra Club. Você pode adicionar vários à fila antes de processar.
            </p>

            <div style={{display:'flex', gap:'10px', height:'45px', marginBottom:'20px'}}>
                <input 
                    style={{...styles.inputField, flex:1, margin:0}} 
                    placeholder="Cole a URL aqui..." 
                    value={garimpoInput} 
                    onChange={e => setGarimpoInput(e.target.value)}
                />
                <button 
                    style={{...styles.headerBtn, height:'100%', padding:'0 15px'}} 
                    onClick={async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            setGarimpoInput(text);
                        } catch (e) { alert("Permita o acesso à área de transferência."); }
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
                            <span style={{color: '#FFFFFF', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis'}}>
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
                    cursor: (garimpoQueue.length > 0 && !isScraping) ? 'pointer' : 'not-allowed'
                }} 
                onClick={handleGarimpo} 
                disabled={isScraping || garimpoQueue.length === 0}
            >
                {isScraping ? <Loader2 className="spin" size={20}/> : "PROCESSAR E SALVAR NA BIBLIOTECA"}
            </button>
        </div>
    );
};