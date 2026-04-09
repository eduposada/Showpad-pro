import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Monitor, Music, ChevronUp, ChevronDown, Share2, DownloadCloud } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, bands, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content || "");
  const [lT, setLT] = useState(item.data.title || "");
  const [lA, setLA] = useState(item.data.artist || "");
  const [lLoc, setLLoc] = useState(item.data.location || "");
  const [lTim, setLTim] = useState(item.data.time || "");
  const [lMem, setLMem] = useState(item.data.members || "");
  const [lNot, setLNot] = useState(item.data.notes || "");
  const [lBpm, setLBpm] = useState(parseInt(item.data.bpm, 10) || 120);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [bandRepertoireIds, setBandRepertoireIds] = useState([]);

  useEffect(() => { 
    setConfirmDelete(false); 
    setLC(item.data.content || "");
    setLT(item.data.title || "");
    setLA(item.data.artist || "");
    setLLoc(item.data.location || "");
    setLTim(item.data.time || "");
    setLMem(item.data.members || "");
    setLNot(item.data.notes || "");
    setLBpm(parseInt(item.data.bpm, 10) || 120);
    
    if (item.type === 'setlist' && item.data.band_id) {
        loadBandRepertoire();
    }
  }, [item.data.id]);

  const loadBandRepertoire = async () => {
    const relations = await db.band_songs.where('band_id').equals(item.data.band_id).toArray();
    setBandRepertoireIds(relations.map(r => r.song_id));
  };

  const save = async (overideBpm) => {
    const isSong = item.type === 'song';
    const finalBpm = overideBpm !== undefined ? overideBpm : lBpm;
    
    const changes = isSong 
        ? { content: lC, title: lT, artist: lA, notes: lNot, bpm: parseInt(finalBpm, 10) }
        : { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot };
    
    await (isSong ? db.songs : db.setlists).update(item.data.id, changes);
    refresh();
  };

  // v7.2: Exportação Individual .showpad
  const handleExportIndividual = () => {
    const exportData = {
        version: "v7.2",
        type: "single_song",
        export_date: new Date().toISOString(),
        data: {
            title: lT,
            artist: lA,
            content: lC,
            bpm: lBpm,
            notes: lNot
        }
    };
    const fileName = `${lA.replace(/\s+/g, '_')}_-_${lT.replace(/\s+/g, '_')}.showpad`;
    triggerDL(exportData, fileName);
  };

  const adjustBpm = (val) => {
    const next = parseInt(lBpm, 10) + val;
    if (next >= 40 && next <= 250) {
        setLBpm(next);
        save(next); 
    }
  };

  const handleTranspose = (dir) => {
    const newContent = transposeContent(lC, dir);
    setLC(newContent);
    save();
  };

  const yellowInputStyle = {
    ...styles.artistInput,
    color: '#FFD700',
    fontSize: '15px',
    fontWeight: 'bold',
    colorScheme: 'dark'
  };

  if (item.type === 'setlist') {
    const band = item.data.band_id ? bands.find(b => b.id === item.data.band_id) : null;
    const filteredSongs = (band && !band.is_solo) 
        ? songs.filter(s => bandRepertoireIds.includes(s.id)) 
        : songs;

    return (
        <div style={{...styles.mainEditor, background: '#000'}}>
            <div style={{...styles.editorHeader, borderLeft: band ? '6px solid #ff9500' : 'none', background: '#0a0a0a'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Título do Show" />
                    {band && (
                        <div style={{display:'flex', alignItems:'center', gap:'10px', background:'#1c1c1e', padding:'5px 12px', borderRadius:'20px', border:'1px solid #333'}}>
                            {band.logo_url ? (
                                <img src={band.logo_url} style={{width:'20px', height:'20px', borderRadius:'50%', objectFit:'cover'}} alt="Logo" />
                            ) : (
                                <Music size={14} color="#ff9500" />
                            )}
                            <span style={{color:'#ff9500', fontSize:'10px', fontWeight:'bold'}}>{band.name}</span>
                        </div>
                    )}
                </div>
                <div style={{display:'flex', gap:'15px', alignItems: 'center'}}>
                    <input style={yellowInputStyle} value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save} placeholder="Local" />
                    <input type="datetime-local" style={{...yellowInputStyle, width: 'auto'}} value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save} />
                </div>
            </div>
            
            <textarea style={{...styles.notesTextArea, marginBottom:'10px', background: '#1c1c1e'}} value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} placeholder="Observações do show..." rows={2} />

            <div style={styles.setlistSplit}>
                <div style={{...styles.setlistHalf, background: '#050505'}}>
                    <h3 style={{color:'#888', fontSize:'11px', fontWeight: '900', marginBottom:'15px'}}>ORDEM DO SHOW</h3>
                    {item.data.songs?.map((s, i) => {
                        const liveSong = songs.find(original => original.id === s.id);
                        return (
                            <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'12px', borderBottom:'1px solid #1c1c1e', background: '#0a0a0a', borderRadius: '8px', marginBottom: '5px'}}>
                                <div style={{display:'flex', flexDirection:'column'}}>
                                    <span style={{fontSize:'14px', fontWeight: 'bold', color: '#fff'}}>{s.title}</span>
                                    <small style={{color: '#FFD700', fontSize:'10px', fontWeight: '900'}}>BPM: {liveSong ? liveSong.bpm : s.bpm || "---"}</small>
                                </div>
                                <div style={{display:'flex', gap:'8px'}}>
                                    <button onClick={async ()=>{const n=[...item.data.songs]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#444'}}><ArrowUp size={16}/></button>
                                    <button onClick={async ()=>{const n=[...item.data.songs]; if(i<n.length-1){[n[i],n[i+1]]=[n[i+1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#444'}}><ArrowDown size={16}/></button>
                                    <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}} style={{background:'none', border:'none', color:'#ff3b30'}}><Trash2 size={16}/></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{...styles.setlistHalf, background:'#111', borderLeft: '1px solid #1c1c1e'}}>
                    <h3 style={{color: band ? '#ff9500' : '#888', fontSize:'11px', fontWeight: '900', marginBottom:'15px'}}>
                        {band && !band.is_solo ? `REPERTÓRIO: ${band.name.toUpperCase()}` : "BIBLIOTECA GERAL"}
                    </h3>
                    {filteredSongs.map(s => (
                        <div key={s.id} style={{padding:'10px 15px', borderBottom:'1px solid #222', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems: 'center'}} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}>
                            <div>
                                <span style={{fontSize:'13px', color: '#fff'}}>{s.title}</span>
                                <div style={{color: '#FFD700', fontSize: '9px', fontWeight: '900'}}>{s.artist}</div>
                            </div>
                            <Plus size={16} color="#34c759"/>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{padding:'20px', borderTop:'1px solid #1c1c1e', display:'flex', justifyContent:'space-between', background: '#0a0a0a'}}>
                <button onClick={onClose} style={styles.saveBtn}>CONCLUIR</button>
                <button onClick={()=>onShow(item.data)} style={styles.showBtn}><Monitor size={16} style={{marginRight:'8px'}}/> MODO SHOW</button>
            </div>
        </div>
    );
  }

  return (
    <div style={{...styles.mainEditor, background: '#000'}}>
      <div style={{...styles.editorHeader, background: '#0a0a0a'}}>
        <div style={{flex: 1}}>
            <input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Título da Música" />
            <input style={{...styles.artistInput, color: '#FFD700'}} value={lA} onChange={e=>setLA(e.target.value)} onBlur={save} placeholder="Artista / Banda" />
        </div>
        
        <div style={styles.btnGroup}>
          <button onClick={() => handleTranspose(-1)} style={{...styles.headerBtn, padding:'8px 12px'}}> - TOM </button>
          <button onClick={() => handleTranspose(1)} style={{...styles.headerBtn, padding:'8px 12px'}}> + TOM </button>
          
          <div style={styles.bpmControlGroup}>
            <span style={{fontSize:'9px', color:'#666', fontWeight:'bold'}}>BPM</span>
            <div style={styles.bpmDisplay}>{lBpm}</div>
            <div style={{display:'flex', flexDirection:'column'}}>
                <button onClick={() => adjustBpm(1)} style={styles.bpmBtnSmall}><ChevronUp size={14}/></button>
                <button onClick={() => adjustBpm(-1)} style={styles.bpmBtnSmall}><ChevronDown size={14}/></button>
            </div>
          </div>

          {/* v7.2: Botão de Exportar Individual */}
          <button onClick={handleExportIndividual} style={{...styles.headerBtn, borderColor: '#007aff66', color: '#007aff'}} title="Exportar .showpad">
            <Share2 size={18} />
          </button>

          <button onClick={async () => { await save(); onShow(item.data); }} style={styles.showBtn}>
            <Monitor size={16} style={{marginRight:'8px'}}/> SHOW
          </button>
          <button onClick={onClose} style={styles.saveBtn}>CONCLUIR</button>
        </div>
      </div>

      <textarea style={{...styles.notesTextArea, background: '#0a0a0a', borderBottom: '1px solid #1c1c1e'}} value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} placeholder="Observações..." rows={3} />
      <textarea style={{...styles.mainTextArea, background: '#000', fontSize: '18px', lineHeight: '1.6'}} value={lC} onChange={e=>setLC(e.target.value)} onBlur={save} placeholder="Cifra..." />

      {confirmDelete && (
        <div style={styles.settingsOverlay}>
          <div style={{...styles.settingsCard, padding:'30px', textAlign:'center', background: '#1c1c1e'}}>
            <h3 style={{color:'#fff', marginBottom:'10px'}}>EXCLUIR MÚSICA?</h3>
            <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
              <button onClick={()=>setConfirmDelete(false)} style={{...styles.saveBtn, backgroundColor:'#444'}}>CANCELAR</button>
              <button onClick={async ()=>{await db.songs.delete(item.data.id); refresh(); onClose();}} style={{...styles.saveBtn, backgroundColor:'#ff3b30'}}>EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};