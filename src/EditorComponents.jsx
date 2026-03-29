import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { db, transposeContent, supabase } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
    // Estados locais para blindar o cursor e a performance
    const [lC, setLC] = useState(item.data.content || "");
    const [lT, setLT] = useState(item.data.title || "");
    const [lA, setLA] = useState(item.data.artist || "");
    const [lLoc, setLLoc] = useState(item.data.location || "");
    const [lTim, setLTim] = useState(item.data.time || "");
    const [lMem, setLMem] = useState(item.data.members || "");
    const [lNot, setLNot] = useState(item.data.notes || "");
    const [myBands, setMyBands] = useState([]);
    const [selectedBand, setSelectedBand] = useState(item.data.band_id || "");

    useEffect(() => { db.my_bands.toArray().then(setMyBands); }, []);

    const save = async () => {
        const isSong = item.type === 'song';
        const changes = isSong 
            ? { content: lC, title: lT, artist: lA, band_id: selectedBand || null }
            : { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot, band_id: selectedBand || null };
        
        if (isSong) await db.songs.update(item.data.id, changes);
        else await db.setlists.update(item.data.id, changes);
        
        if (selectedBand && supabase) {
            const table = isSong ? 'songs' : 'setlists';
            await supabase.from(table).upsert({ ...changes, id: item.data.id, creator_id: item.data.creator_id });
        }
        refresh();
    };

    if (item.type === 'setlist') return (
        <div style={styles.editorContent}>
            <div style={styles.editorHeader}>
                <div style={{flex:1}}>
                    <input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save}/>
                    <select style={{background:'#1a1a1a', color:'#007aff', border:'none', fontSize:'11px', outline:'none'}} value={selectedBand} onChange={(e) => { setSelectedBand(e.target.value); save(); }}>
                        <option value="">🔒 Privado (Solo)</option>
                        {myBands.map(b => <option key={b.id} value={b.id}>👥 Banda: {b.name}</option>)}
                    </select>
                </div>
                <div style={styles.btnGroup}>
                    <button style={styles.exportBtn} onClick={()=>triggerDL({songs: item.data.songs, setlists:[{...item.data}]}, `Show_${lT}.json`)}>EXPORTAR SHOW</button>
                    <button onClick={onShow} style={styles.showBtn}>START SHOW</button>
                    <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
                </div>
            </div>
            <div style={styles.showMetaData}>
                <div style={styles.metaRow}>
                    <input placeholder="Local" value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save} style={styles.metaInput}/>
                    <input placeholder="Hora" value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save} style={styles.metaInputSmall}/>
                </div>
                <input placeholder="Integrantes" value={lMem} onChange={e=>setLMem(e.target.value)} onBlur={save} style={styles.metaInputWide}/>
                <textarea placeholder="Obs Gerais..." value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} style={styles.metaTextArea}></textarea>
            </div>
            <div style={styles.setlistSplit}>
                <div style={styles.setlistHalf}>
                    <h3 style={{color:'#007aff', fontSize:'13px', marginBottom:'10px'}}>SET LIST DO SHOW</h3>
                    {(item.data.songs || []).map((s, i) => (
                        <div key={i} style={styles.miniItemReorder}>
                            <div style={{flex:1, color:'#fff'}}>{i+1}. {s.title}</div>
                            <div style={styles.reorderControls}>
                                <button onClick={async ()=>{const n=[...item.data.songs]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}}><ArrowUp size={14}/></button>
                                <button onClick={async ()=>{const n=[...item.data.songs]; if(i<n.length-1){[n[i],n[i+1]]=[n[i+1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}}><ArrowDown size={14}/></button>
                                <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}}><Trash2 size={14} color="#ff3b30"/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{...styles.setlistHalf, background:'#222'}}>
                    <h3 style={{color:'#888', fontSize:'13px', marginBottom:'10px'}}>SUA BIBLIOTECA (Clique +)</h3>
                    {songs.map(s => (<div key={s.id} style={styles.miniItem} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}><div style={{flex:1}}>{s.title}</div><Plus size={14} color="#34c759"/></div>))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={styles.editorContent}>
            <div style={styles.editorHeader}>
                <div style={{flex:1}}>
                    <input style={styles.hInput} value={lT} onChange={e => setLT(e.target.value)} onBlur={save}/>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <input style={styles.artistInput} value={lA} onChange={e => setLA(e.target.value)} onBlur={save} placeholder="Artista"/>
                        <select style={{background:'none', color:'#007aff', border:'none', fontSize:'11px', outline:'none'}} value={selectedBand} onChange={(e) => { setSelectedBand(e.target.value); save(); }}>
                            <option value="">🔒 Pessoal</option>
                            {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={styles.btnGroup}>
                    <button style={styles.exportBtn} onClick={() => triggerDL({songs:[{...item.data, content:lC, title:lT, artist:lA}]}, `Musica_${lT}.json`)}>EXPORTAR</button>
                    <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, 1); setLC(n); }}>+ Tom</button>
                    <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, -1); setLC(n); }}>- Tom</button>
                    <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
                    <button onClick={onShow} style={styles.showBtn}>SHOW</button>
                </div>
            </div>
            <textarea style={styles.mainTextArea} value={lC} onChange={e => setLC(e.target.value)} onBlur={save} />
        </div>
    );
};