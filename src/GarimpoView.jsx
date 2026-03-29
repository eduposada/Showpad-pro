import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2, Play } from 'lucide-react';
import { db } from './ShowPadCore';

export const GarimpoView = ({ isServerOnline, styles, refresh, session }) => {
    const [garimpoInput, setGarimpoInput] = useState("");
    const [garimpoQueue, setGarimpoQueue] = useState([]);
    const [isScraping, setIsScraping] = useState(false);
    const [status, setStatus] = useState("");

    const handleGarimpo = async () => {
        setIsScraping(true); setStatus("Extraindo...");
        for (let k = 0; k < garimpoQueue.length; k++) {
            const url = garimpoQueue[k];
            try {
                const response = await fetch('http://localhost:3001/scrape', { 
                    method:'POST', 
                    headers:{'Content-Type':'application/json'}, 
                    body:JSON.stringify({ url: url }) 
                });
                const song = await response.json();
                if (song.title) {
                    await db.songs.add({ ...song, notes: "", creator_id: session.user.id });
                }
            } catch (err) { console.error(err); }
        }
        setIsScraping(false); setStatus("✅ Concluído!"); setGarimpoQueue([]); refresh();
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 style={{color: '#fff', margin: 0}}>Garimpar Cifras</h2>
                <div style={isServerOnline ? styles.serverLedOn : styles.serverLedOff}>
                    <div style={styles.ledDot}></div> {isServerOnline ? "MAC OK" : "MAC OFF"}
                </div>
            </div>
            <div style={{...styles.inputRow, marginTop: '20px'}}>
                <input style={styles.inputField} placeholder="Link CifraClub..." value={garimpoInput} onChange={e=>setGarimpoInput(e.target.value)} />
                <button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button>
            </div>
            <div style={styles.scrollList}>
                {garimpoQueue.map((u, i) => (
                    <div key={i} style={styles.miniItemGarimpo}>
                        <span style={{color: '#FFFFFF'}}>{u.split('/').pop()}</span>
                        <X size={16} color="#ff3b30" style={{cursor:'pointer'}} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))}/>
                    </div>
                ))}
            </div>
            
            {/* REQUISITO 8: BOTÃO VERDE LARGO */}
            <button 
                style={styles.wideGreenBtn} 
                onClick={handleGarimpo} 
                disabled={isScraping || garimpoQueue.length === 0 || !isServerOnline}
            >
                {isScraping ? <Loader2 className="spin" size={20}/> : "PROCESSAR E SALVAR NA BIBLIOTECA"}
            </button>
            <div style={styles.statusText}>{status}</div>
        </div>
    );
};