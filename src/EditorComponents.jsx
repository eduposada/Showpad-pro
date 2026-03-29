import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  // Inicialização de estados
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
    const changes = item.type === 'song' 
        ? { content: lC, title: lT, artist: lA, band_id: selectedBand || null }
        : { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot, band_id: selectedBand || null };
    
    if (item.type === 'song') await db.songs.update(item.data.id, changes);
    else await db.setlists.update(item.data.id, changes);
    refresh();
  };

  // --- RENDERIZAÇÃO PARA SETLIST (SHOWS) ---
  if (item.type === 'setlist') return (
    <div style={styles.mainEditor}> {/* CORRIGIDO: de editorContent para mainEditor */}
      <div style={styles.editorHeader}>
        <div style={{flex: 1}}>
            <span style={styles.fieldLabel}>Nome do Show</span>
            <input style={styles.whiteInputLarge} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save}/>
        </div>
        <div style={styles.btnGroup}>
          <button style={styles.exportBtn} onClick={()=>triggerDL({songs: item.data.songs, setlists:[{...item.data}]}, `Show_${lT}.json`)}>EXPORTAR</button>
          <button onClick={onShow} style={styles.showBtn}>START SHOW</button>
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
        </div>
      </div>
      
      <div style={{padding: '20px', backgroundColor: '#1c1c1e', borderRadius: '10px', margin: '10px 0'}}>
        <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex:0.3}}><span style={styles.fieldLabel}>Hora</span><input style={styles.whiteInputMedium} value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save}/></div>
            <div style={{flex:1}}><span style={styles.fieldLabel}>Local</span><input style={styles.whiteInputMedium} value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save}/></div>
            <div style={{flex:0.8}}><span style={styles.fieldLabel}>Banda</span>
                <select style={{...styles.whiteInputMedium, height:'35px'}} value={selectedBand} onChange={(e)=>{setSelectedBand(e.target.value); save();}}>
                    <option value="">👤 Solo</option>
                    {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                </select>
            </div>
        </div>
      </div>

      <div style={styles.setlistSplit}>
        <div style={styles.setlistHalf}>
            <h3 style={{color:'#007aff', fontSize:'12px', marginBottom: '10px'}}>Set List</h3>
            {(item.data.songs || []).map((s, i) => (
                <div key={i} style={styles.miniItemReorder}>
                    <div style={{flex:1}}><b>{i+1}.</b> {s.title}</div>
                    <div style={styles.reorderControls}>
                        <button onClick={async ()=>{const n=[...item.data.songs]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#888'}}><ArrowUp size={14}/></button>
                        <button onClick={async ()=>{const n=[...item.data.songs]; if(i<n.length-1){[n[i],n[i+1]]=[n[i+1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#888'}}><ArrowDown size={14}/></button>
                        <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}} style={{background:'none', border:'none', color:'#ff3b30'}}><Trash2 size={14}/></button>
                    </div>
                </div>))}
        </div>
        <div style={{...styles.setlistHalf, background:'#111'}}>
            <h3 style={{color:'#888', fontSize:'12px', marginBottom: '10px'}}>Biblioteca</h3>
            {songs.map(s => (
                <div key={s.id} style={{padding:'8px', borderBottom:'1px solid #222', cursor:'pointer', display:'flex', justifyContent:'space-between'}} 
                     onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}>
                    {s.title} <Plus size={14} color="#34c759"/>
                </div>
            ))}
        </div>
      </div>
    </div>
  );

  // --- RENDERIZAÇÃO PARA MÚSICA (BIBLIOTECA) ---
  return (
    <div style={styles.mainEditor}> {/* CORRIGIDO: de editorContent para mainEditor */}
      <div style={styles.editorHeader}>
        <div style={{flex: 1}}>
            <span style={styles.fieldLabel}>Título da Música</span>
            <input style={styles.hInput} value={lT} onChange={e => setLT(e.target.value)} onBlur={save}/>
            <div style={{display:'flex', gap:'10px', marginTop: '5px'}}>
                <input style={styles.artistInput} value={lA} onChange={e => setLA(e.target.value)} onBlur={save} placeholder="Artista"/>
                <select style={{background:'none', border:'1px solid #444', color:'#aaa', borderRadius:'4px', fontSize:'11px'}} value={selectedBand} onChange={(e)=>{setSelectedBand(e.target.value); save();}}>
                    <option value="">🔒 Pessoal</option>
                    {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                </select>
            </div>
        </div>
        <div style={styles.btnGroup}>
          <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, 1); setLC(n); }}>+ Tom</button>
          <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, -1); setLC(n); }}>- Tom</button>
          <button onClick={onShow} style={styles.showBtn}>SHOW</button>
          <button onClick={onClose} style={styles.saveBtn}>OK</button>
        </div>
      </div>
      <textarea 
        style={styles.mainTextArea} 
        value={lC} 
        onChange={e=>setLC(e.target.value)} 
        onBlur={save}
        placeholder="Cole sua cifra aqui..."
      />
    </div>
  );
};