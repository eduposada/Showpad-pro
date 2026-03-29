import React, { useState } from 'react';
import { X, ClipboardPaste, Loader2 } from 'lucide-react';
import { db } from './ShowPadCore';

export const GarimpoView = ({ isServerOnline, styles, refresh, session }) => {
    const [garimpoInput, setGarimpoInput] = useState(""), [garimpoQueue, setGarimpoQueue] = useState([]), [isScraping, setIsScraping] = useState(false), [status, setStatus] = useState("");

    const handleGarimpo = async () => {
        setIsScraping(true); setStatus("Extraindo...");
        for (let k = 0; k < garimpoQueue.length; k++) {
            try {
                const response = await fetch('http://localhost:3001/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: garimpoQueue[k] }) });
                const song = await response.json();
                if (song.title && !(await db.songs.where({ title: song.title, artist: song.artist }).first())) await db.songs.add({ ...song, notes: "", creator_id: session.user.id });
            } catch (e) { console.error(e); }
        }
        setIsScraping(false); setStatus("✅ Concluído!"); setGarimpoQueue([]); refresh();
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ color: '#fff', margin: 0 }}>Garimpar</h2><div style={isServerOnline ? styles.serverLedOn : styles.serverLedOff}><div style={styles.ledDot}></div>{isServerOnline ? "MAC OK" : "MAC OFF"}</div></div>
            <div style={styles.inputRow}>
                <input style={styles.inputField} placeholder="Link CifraClub..." value={garimpoInput} onChange={e => setGarimpoInput(e.target.value)} />
                <button style={styles.secondaryBtn} onClick={async () => { try { const t = await navigator.clipboard.readText(); setGarimpoInput(t); } catch (e) { alert("Cole manualmente"); } }}><ClipboardPaste size={18} /></button>
                <button style={styles.addBtn} onClick={() => { if (garimpoInput) { setGarimpoQueue([...garimpoQueue, garimpoInput]); setGarimpoInput(""); } }}>OK</button>
            </div>
            <div style={styles.scrollList}>{garimpoQueue.map((u, i) => (<div key={i} style={styles.miniItemGarimpo}><span>{u.split('/').pop()}</span><X size={14} onClick={() => setGarimpoQueue(garimpoQueue.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer', color: '#ff3b30' }} /></div>))}</div>
            <button style={styles.processBtn} onClick={handleGarimpo} disabled={isScraping || garimpoQueue.length === 0 || !isServerOnline}>{isScraping ? <Loader2 className="spin" size={20} /> : "Salvar na Biblioteca"}</button>
            <div style={styles.statusText}>{status}</div>
        </div>
    );
};