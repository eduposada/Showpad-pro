import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2, CheckCircle2 } from 'lucide-react';
import { db } from './ShowPadCore';

export const GarimpoView = ({ isServerOnline, styles, refresh, session }) => {
    const [garimpoInput, setGarimpoInput] = useState("");
    const [garimpoQueue, setGarimpoQueue] = useState([]);
    const [isScraping, setIsScraping] = useState(false);
    const [status, setStatus] = useState("");

    const handleGarimpo = async () => {
        setIsScraping(true); setStatus("Iniciando...");
        for (const url of garimpoQueue) {
            try {
                const response = await fetch('http://localhost:3001/scrape', { 
                    method:'POST', 
                    headers:{'Content-Type':'application/json'}, 
                    body:JSON.stringify({ url }) 
                });
                const song = await response.json();
                if (song.title) {
                    await db.songs.add({ ...song, notes: "", creator_id: session.user.id });
                }
            } catch (err) { console.error("Falha no link", url); }
        }
        setIsScraping(false); setStatus("✅ Biblioteca Atualizada!"); setGarimpoQueue([]); refresh();
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 style={{color: '#fff', margin: 0}}>Garimpar Cifras</h2>
                <div style={isServerOnline ? styles.serverLedOn : styles.serverLedOff}>
                    <div style={styles.ledDot}></div> {isServerOnline ? "ASSISTENTE MAC: ONLINE" : "ASSISTENTE MAC: OFFLINE"}
                </div>
            </div>
            
            <div style={styles.inputRow}>
                <input 
                    style={styles.inputField} 
                    placeholder="Cole o link do CifraClub aqui..." 
                    value={garimpoInput} 
                    onChange={e=>setGarimpoInput(e.target.value)}
                />
                <button style={styles.secondaryBtn} onClick={async ()=>{ try {const t = await navigator.clipboard.readText(); setGarimpoInput(t);} catch(e){alert("Permita o clipboard")}}}>
                    <ClipboardPaste size={18}/>
                </button>
                <button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button>
            </div>

            <div style={styles.scrollList}>
                {garimpoQueue.length === 0 ? (
                    <div style={{color:'#444', textAlign:'center', marginTop:'50px'}}>Fila de links vazia</div>
                ) : (
                    garimpoQueue.map((url, i) => (
                        <div key={i} style={styles.miniItemGarimpo}>
                            <span style={{color: '#FFFFFF'}}>{url.split('/').filter(x => x).pop()}</span>
                            <X size={16} color="#ff3b30" style={{cursor:'pointer'}} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))}/>
                        </div>
                    ))
                )}
            </div>

            <button 
                style={{...styles.processBtn, opacity: (garimpoQueue.length > 0 && !isScraping) ? 1 : 0.5}} 
                onClick={handleGarimpo} 
                disabled={isScraping || garimpoQueue.length === 0 || !isServerOnline}
            >
                {isScraping ? <><Loader2 className="spin" size={20}/> Garimpando...</> : "Garimpar e Salvar na Biblioteca"}
            </button>
            <div style={styles.statusText}>{status}</div>
        </div>
    );
};