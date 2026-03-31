import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2, Monitor, User, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content || "");
  const [lT, setLT] = useState(item.data.title || "");
  const [lA, setLA] = useState(item.data.artist || "");
  const [lLoc, setLLoc] = useState(item.data.location || "");
  const [lTim, setLTim] = useState(item.data.time || "");
  const [lMem, setLMem] = useState(item.data.members || "");
  const [lNot, setLNot] = useState(item.data.notes || "");
  const [lBpm, setLBpm] = useState(item.data.bpm || 120);
  const [myBands, setMyBands] = useState([]);
  const [selectedBand, setSelectedBand] = useState(item.data.band_id || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { 
    db.my_bands.toArray().then(setMyBands); 
    setConfirmDelete(false); 
    setLC(item.data.content || "");
    setLT(item.data.title || "");
    setLA(item.data.artist || "");
    setLNot(item.data.notes || "");
    setLBpm(item.data.bpm || 120);
  }, [item.data.id]);

  const save = async () => {
    const changes = item.type === 'song' 
        ? { content: lC, title: lT, artist: lA, notes: lNot, bpm: lBpm, band_id: selectedBand || null }
        : { title: lT, location: lLoc, time: lTim, members: lMem };
    
    await (item.type === 'song' ? db.songs : db.setlists).update(item.data.id, changes);
    refresh();
  };

  const adjustBpm = (val) => {
    const next = lBpm + val;
    if (next >= 40 && next <= 250) setLBpm(next);
  };

  const handleTranspose = (dir) => {
    const newContent = transposeContent(lC, dir);
    setLC(newContent);
  };

  if (item.type === 'setlist') {
    return (
        <div style={styles.mainEditor}>
            <div style={styles.editorHeader}>
                <input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Título do Show" />
                <div style={{display:'flex', gap:'10px'}}>
                    <input style={{...styles.artistInput, color:'#888'}} value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save} placeholder="Local" />
                    <input style={{...styles.artistInput, color:'#888'}} value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save} placeholder="Data/Hora" />
                </div>
            </div>
            <div style={styles.setlistSplit}>
                <div style={styles.setlistHalf}>
                    <h3 style={{color:'#888', fontSize:'12px', marginBottom:'10px'}}>Músicas no Show</h3>
                    {item.data.songs?.map((s, i) => (
                        <div key={i} style={styles.miniItemReorder}>
                            <span>{s.title}</span>
                            <div style={styles.reorderControls}>
                                <button onClick={async ()=>{const n=[...item.data.songs]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#888'}}><ArrowUp size={14}/></button>
                                <button onClick={async ()=>{const n=[...item.data.songs]; if(i<n.length-1){[n[i],n[i+1]]=[n[i+1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#888'}}><ArrowDown size={14}/></button>
                                <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}} style={{background:'none', border:'none', color:'#ff3b30'}}><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{...styles.setlistHalf, background:'#111'}}>
                    <h3 style={{color:'#888', fontSize:'12px', marginBottom:'10px'}}>Biblioteca</h3>
                    {songs.map(s => (
                        <div key={s.id} style={{padding:'8px', borderBottom:'1px solid #222', cursor:'pointer', display:'flex', justifyContent:'space-between'}} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}>
                            <span style={{fontSize:'13px'}}>{s.title}</span>
                            <Plus size={14} color="#34c759"/>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{padding:'20px', borderTop:'1px solid #333', display:'flex', justifyContent:'space-between'}}>
                <button onClick={onClose} style={styles.saveBtn}>CONCLUIR</button>
                <button onClick={()=>onShow(item.data)} style={styles.showBtn}><Monitor size={16} style={{marginRight:'8px'}}/> MODO SHOW</button>
            </div>
        </div>
    );
  }

  return (
    <div style={styles.mainEditor}>
      <div style={styles.editorHeader}>
        <input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Título da Música" />
        <input style={styles.artistInput} value={lA} onChange={e=>setLA(e.target.value)} onBlur={save} placeholder="Artista / Banda" />
        
        <div style={styles.btnGroup}>
          {/* GRUPO DE TOM */}
          <button onClick={() => handleTranspose(-1)} style={styles.transpBtn}>- TOM</button>
          <button onClick={() => handleTranspose(1)} style={styles.transpBtn}>+ TOM</button>
          
          {/* GRUPO DE BPM */}
          <div style={styles.bpmControlGroup}>
            <span style={{fontSize:'9px', color:'#666', fontWeight:'bold'}}>BPM</span>
            <div style={styles.bpmDisplay}>{lBpm}</div>
            <div style={{display:'flex', flexDirection:'column'}}>
                <button onClick={() => { adjustBpm(1); save(); }} style={styles.bpmBtnSmall}><ChevronUp size={14}/></button>
                <button onClick={() => { adjustBpm(-1); save(); }} style={styles.bpmBtnSmall}><ChevronDown size={14}/></button>
            </div>
          </div>

          {/* AÇÕES */}
          <button onClick={() => onShow(item.data)} style={styles.showBtn}>
            <Monitor size={16} style={{marginRight:'8px'}}/> SHOW
          </button>
          
          <button onClick={onClose} style={styles.saveBtn}>CONCLUIR</button>
          
          <button onClick={() => triggerDL(item.data, `${lT}.txt`)} style={styles.exportBtn}>EXPORTAR</button>
          
          <button onClick={() => setConfirmDelete(true)} style={{background:'none', border:'none', color:'#444', marginLeft:'auto'}}><Trash2 size={18}/></button>
        </div>
      </div>

      {/* CAMPO DE OBSERVAÇÕES */}
      <textarea 
        style={styles.notesTextArea} 
        value={lNot} 
        onChange={e=>setLNot(e.target.value)} 
        onBlur={save} 
        placeholder="Observações, timbres, convenções..."
        rows={3}
      />

      <textarea 
        style={styles.mainTextArea} 
        value={lC} 
        onChange={e=>setLC(e.target.value)} 
        onBlur={save}
        placeholder="Cole sua cifra aqui..."
      />

      {confirmDelete && (
        <div style={styles.settingsOverlay}>
          <div style={{...styles.settingsCard, padding:'30px', textAlign:'center'}}>
            <h3 style={{color:'#fff', marginBottom:'10px'}}>EXCLUIR MÚSICA?</h3>
            <p style={{color:'#888', marginBottom:'20px'}}>Esta ação não pode ser desfeita.</p>
            <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
              <button onClick={()=>setConfirmDelete(false)} style={{...styles.saveBtn, backgroundColor:'#444'}}>CANCELAR</button>
              <button onClick={async ()=>{await db.songs.delete(item.data.id); refresh(); onClose();}} style={{...styles.saveBtn, backgroundColor:'#ff3b30'}}>EXCLUIR AGORA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};