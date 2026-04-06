import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Monitor, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content || "");
  const [lT, setLT] = useState(item.data.title || item.data.name || "");
  const [lA, setLA] = useState(item.data.artist || "");
  const [lLoc, setLLoc] = useState(item.data.location || "");
  const [lTim, setLTim] = useState(item.data.time || "");
  const [lNot, setLNot] = useState(item.data.notes || "");
  const [lBpm, setLBpm] = useState(item.data.bpm || 120);
  const [search, setSearch] = useState("");

  const save = async () => {
    const changes = item.type === 'song' 
        ? { content: lC, title: lT, artist: lA, notes: lNot, bpm: lBpm }
        : { title: lT, name: lT, location: lLoc, time: lTim, notes: lNot };
    
    await (item.type === 'song' ? db.songs : db.setlists).update(item.data.id, changes);
    refresh();
  };

  if (item.type === 'setlist') {
    const setlistSongs = item.data.songs || [];
    const filteredLibrary = songs.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={styles.mainEditor}>
            <div style={styles.editorHeader}>
                <input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Nome do Show" />
                <div style={{display:'flex', gap:'10px'}}>
                    <input style={{...styles.artistInput, color:'#888'}} value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save} placeholder="Local do Evento" />
                    <input style={{...styles.artistInput, color:'#888'}} value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save} placeholder="Data/Hora" />
                </div>
            </div>
            
            <div style={styles.setlistSplit}>
                <div style={styles.setlistHalf}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                        <h3 style={{color:'#007aff', fontSize:'12px'}}>ORDEM DO SHOW ({setlistSongs.length})</h3>
                    </div>
                    {setlistSongs.map((s, i) => (
                        <div key={i} style={styles.miniItemReorder}>
                            <span style={{fontSize:'13px'}}>{i+1}. {s.title}</span>
                            <div style={styles.reorderControls}>
                                <button onClick={async ()=>{const n=[...setlistSongs]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}}><ArrowUp size={14}/></button>
                                <button onClick={async ()=>{const n=[...setlistSongs]; if(i<n.length-1){[n[i],n[i+1]]=[n[i+1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}}><ArrowDown size={14}/></button>
                                <button onClick={async ()=>{const n=[...setlistSongs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}}><X size={14} color="#ff3b30"/></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{...styles.setlistHalf, background:'#111', borderLeft:'1px solid #222'}}>
                    <input 
                        style={{...styles.inputField, height:'35px', marginBottom:'15px', fontSize:'12px'}} 
                        placeholder="Buscar na biblioteca..." 
                        value={search}
                        onChange={e=>setSearch(e.target.value)}
                    />
                    <div style={{overflowY:'auto', flex:1}}>
                        {filteredLibrary.map(s => (
                            <div key={s.id} style={styles.listItem} onClick={async ()=>{
                                const n=[...setlistSongs, {id: s.id, title: s.title, artist: s.artist, content: s.content}];
                                await db.setlists.update(item.data.id,{songs:n});
                                refresh();
                            }}>
                                <span style={{fontSize:'13px'}}>{s.title}</span>
                                <Plus size={14} color="#34c759"/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{padding:'20px', borderTop:'1px solid #333', display:'flex', justifyContent:'space-between'}}>
                <button onClick={onClose} style={styles.saveBtn}>CONCLUIR</button>
                <button onClick={()=>onShow(item.data)} style={styles.showBtn}><Monitor size={16} style={{marginRight:'8px'}}/> ABRIR SHOW</button>
            </div>
        </div>
    );
  }

  // ... (Mantenha o retorno original para 'song' que já estava legal)
  return (
    <div style={styles.mainEditor}>
        {/* O código de edição de música que você já tinha continua aqui */}
    </div>
  );
};