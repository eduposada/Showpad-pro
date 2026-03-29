import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
    // Estados locais para edição estável
    const [lC, setLC] = useState(item.data.content || "");
    const [lT, setLT] = useState(item.data.title || "");
    const [lA, setLA] = useState(item.data.artist || "");
    const [lLoc, setLLoc] = useState(item.data.location || "");
    const [lTim, setLTim] = useState(item.data.time || "");
    const [lMem, setLMem] = useState(item.data.members || "");
    const [lNot, setLNot] = useState(item.data.notes || "");
    
    const [myBands, setMyBands] = useState([]);
    const [selectedBand, setSelectedBand] = useState(item.data.band_id || "");

    useEffect(() => {
        db.my_bands.toArray().then(setMyBands);
    }, []);

    const save = async () => {
        const isSong = item.type === 'song';
        const changes = isSong 
            ? { content: lC, title: lT, artist: lA, band_id: selectedBand || null }
            : { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot, band_id: selectedBand || null };
        
        if (isSong) await db.songs.update(item.data.id, changes);
        else await db.setlists.update(item.data.id, changes);
        refresh();
    };

    // Função de Exportação isolada para evitar erros de sintaxe (Requisito de Mestre)
    const handleExport = () => {
        const cleanTitle = lT.replace(/\s/g, '_');
        if (item.type === 'song') {
            const data = { songs: [{ ...item.data, content: lC, title: lT, artist: lA }] };
            triggerDL(data, `Cifra_${cleanTitle}.json`);
        } else {
            const data = { songs: item.data.songs, setlists: [{ ...item.data, title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot }] };
            triggerDL(data, `Show_${cleanTitle}.json`);
        }
    };

    const moveSong = async (index, dir) => {
        const newSongs = [...item.data.songs];
        const target = index + dir;
        if (target >= 0 && target < newSongs.length) {
            [newSongs[index], newSongs[target]] = [newSongs[target], newSongs[index]];
            await db.setlists.update(item.data.id, { songs: newSongs });
            refresh();
        }
    };

    // --- INTERFACE DO SETLIST (SHOWS) ---
    if (item.type === 'setlist') {
        return (
            <div style={styles.editorContent}>
                <div style={styles.editorHeader}>
                    <div style={styles.inputContainer}>
                        <input style={styles.whiteInputLarge} value={lT} onChange={e => setLT(e.target.value)} onBlur={save} placeholder="Título do Show" />
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <input style={styles.whiteInputMedium} value={lLoc} onChange={e => setLLoc(e.target.value)} onBlur={save} placeholder="Local do Show" />
                            <select style={{ ...styles.whiteInputMedium, width: '200px' }} value={selectedBand} onChange={(e) => { setSelectedBand(e.target.value); save(); }}>
                                <option value="">👤 Solo (Individual)</option>
                                {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={styles.btnGroup}>
                        <button style={styles.exportBtn} onClick={handleExport}>EXPORTAR SHOW</button>
                        <button onClick={onShow} style={styles.showBtn}>START SHOW</button>
                        <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
                    </div>
                </div>
                
                <div style={styles.showMetaData}>
                    <div style={styles.metaRow}>
                        <input style={{ ...styles.whiteInputMedium, flex: 0.3 }} placeholder="Hora" value={lTim} onChange={e => setLTim(e.target.value)} onBlur={save} />
                        <input style={styles.whiteInputMedium} placeholder="Integrantes da Banda" value={lMem} onChange={e => setLMem(e.target.value)} onBlur={save} />
                    </div>
                    <textarea style={{ ...styles.whiteInputMedium, height: '80px', resize: 'none' }} placeholder="Observações do Show (Equipamento, timbres...)" value={lNot} onChange={e => setLNot(e.target.value)} onBlur={save} />
                </div>

                <div style={styles.setlistSplit}>
                    <div style={styles.setlistHalf}>
                        <h3 style={{ color: '#007aff', marginBottom: '10px' }}>Set List do Show</h3>
                        {(item.data.songs || []).map((s, i) => (
                            <div key={i} style={styles.miniItemReorder}>
                                <div style={{ flex: 1 }}><b>{i + 1}.</b> {s.title}</div>
                                <div style={styles.reorderControls}>
                                    <button onClick={() => moveSong(i, -1)} disabled={i === 0}><ArrowUp size={14} /></button>
                                    <button onClick={() => moveSong(i, 1)} disabled={i === item.data.songs.length - 1}><ArrowDown size={14} /></button>
                                    <button onClick={async () => { const n = [...item.data.songs]; n.splice(i, 1); await db.setlists.update(item.data.id, { songs: n }); refresh(); }}><Trash2 size={14} color="#ff3b30" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ ...styles.setlistHalf, background: '#222' }}>
                        <h3 style={{ color: '#888', marginBottom: '10px' }}>Biblioteca (Clique no +)</h3>
                        {songs.map(s => (
                            <div key={s.id} style={styles.miniItem} onClick={async () => { const n = [...(item.data.songs || []), s]; await db.setlists.update(item.data.id, { songs: n }); refresh(); }}>
                                <div style={{ flex: 1 }}>{s.title}</div><Plus size={14} color="#34c759" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- INTERFACE DO EDITOR DE MÚSICA (LIBRARY) ---
    return (
        <div style={styles.editorContent}>
            <div style={styles.editorHeader}>
                <div style={styles.inputContainer}>
                    <input style={styles.whiteInputLarge} value={lT} onChange={e => setLT(e.target.value)} onBlur={save} placeholder="Título da Música" />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={styles.whiteInputMedium} value={lA} onChange={e => setLA(e.target.value)} onBlur={save} placeholder="Artista / Banda" />
                        <select style={{ ...styles.whiteInputMedium, width: '200px' }} value={selectedBand} onChange={(e) => { setSelectedBand(e.target.value); save(); }}>
                            <option value="">🔒 Pessoal</option>
                            {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={styles.btnGroup}>
                    <button style={styles.exportBtn} onClick={handleExport}>EXPORTAR</button>
                    <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, 1); setLC(n); }}>+ Tom</button>
                    <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, -1); setLC(n); }}>- Tom</button>
                    <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
                    <button onClick={onShow} style={styles.showBtn}>SHOW</button>
                </div>
            </div>
            <textarea style={styles.mainTextArea} value={lC} onChange={e => setLC(e.target.value)} onBlur={save} placeholder="Cole sua cifra branca aqui..." />
        </div>
    );
};