import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2, Play } from 'lucide-react';
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
                setStatus(`Extraindo: ${url.split('/').pop()}...`);
                const response = await fetch('http://localhost:3001/scrape', { 
                    method:'POST', 
                    headers:{'Content-Type':'application/json'}, 
                    body:JSON.stringify({ url }) 
                });
                const song = await response.json();
                if (song.title) {
                    await db.songs.add({ ...song, notes: "", creator_id: session.user.id });
                }
            } catch (err) { console.error("Erro no link", url); }
        }
        setIsScraping(false); setStatus("✅ Concluído!"); setGarimpoQueue([]); refresh();
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 style={{color: '#fff', margin: 0}}>Garimpar Cifras</h2>
                <div style={isServerOnline ? styles.serverLedOn : styles.serverLedOff}>
                    <div style={styles.ledDot}></div> {isServerOnline ? "MAC ONLINE" : "MAC OFFLINE"}
                </div>
            </div>
            <div style={styles.inputRow}>
                <input style={styles.inputField} placeholder="Link do CifraClub..." value={garimpoInput} onChange={e=>setGarimpoInput(e.target.value)} />
                <button style={styles.secondaryBtn} onClick={async ()=>{ const t = await navigator.clipboard.readText(); setGarimpoInput(t); }}><ClipboardPaste size={18}/></button>
                <button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button>
            </div>
            <div style={styles.scrollList}>
                {garimpoQueue.map((url,i)=>(
                    <div key={i} style={styles.miniItemGarimpo}>
                        <span>{url.split('/').filter(Boolean).pop()}</span>
                        <X size={14} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))} style={{cursor:'pointer', color:'#ff3b30'}}/>
                    </div>
                ))}
            </div>
            <button style={styles.processBtn} onClick={handleGarimpo} disabled={isScraping || garimpoQueue.length===0 || !isServerOnline}>
                {isScraping ? <Loader2 className="spin" size={20}/> : "Garimpar e Salvar na Biblioteca"}
            </button>
            <div style={styles.statusText}>{status}</div>
        </div>
    );
};