import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2, Monitor, User } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content || "");
  const [lT, setLT] = useState(item.data.title || "");
  const [lA, setLA] = useState(item.data.artist || "");
  const [lLoc, setLLoc] = useState(item.data.location || "");
  const [lTim, setLTim] = useState(item.data.time || "");
  const [lMem, setLMem] = useState(item.data.members || "");
  const [lNot, setLNot] = useState(item.data.notes || "");
  const [myBands, setMyBands] = useState([]);
  const [selectedBand, setSelectedBand] = useState(item.data.band_id || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { 
    db.my_bands.toArray().then(setMyBands); 
    setConfirmDelete(false); 
  }, [item.data.id]);

  const save = async () => {
    const changes = item.type === 'song' 
        ? { content: lC, title: lT, artist: lA, band_id: selectedBand || null }
        : { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot, band_id: selectedBand || null };
    
    if (item.type === 'song') await db.songs.update(item.data.id, changes);
    else await db.setlists.update(item.data.id, changes);
    refresh();
  };

  const handleDelete = async () => {
    if (item.type === 'song') await db.songs.delete(item.data.id);
    else await db.setlists.delete(item.data.id);
    refresh();
    onClose();
  };

  return (
    <div style={styles.mainEditor}>
      <div style={styles.editorHeader}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', width: '100%'}}>
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:'8px'}}>
                {/* ÁREA DE TÍTULO */}
                <div>
                    <span style={{fontSize:'10px', color:'#007aff', fontWeight:'bold', textTransform:'uppercase'}}>Título</span>
                    <input style={styles.hInput} value={lT} onChange={e => setLT(e.target.value)} onBlur={save} placeholder="Título..."/>
                </div>

                {/* CAMPO ARTISTA - EXCLUSIVO PARA MÚSICAS */}
                {item.type === 'song' && (
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <User size={12} color="#34c759" />
                        <div style={{flex:1}}>
                            <span style={{fontSize:'10px', color:'#34c759', fontWeight:'bold', textTransform:'uppercase', display:'block'}}>Artista / Banda</span>
                            <input 
                                style={{...styles.artistInput, borderBottom: '1px solid #333', padding: '2px 0', width: '100%'}} 
                                value={lA} 
                                onChange={e => setLA(e.target.value)} 
                                onBlur={save} 
                                placeholder="Nome do artista..."
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* TRAVA DE SEGURANÇA PARA EXCLUSÃO */}
            <button 
                onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)}
                onMouseLeave={() => setConfirmDelete(false)}
                style={{
                    backgroundColor: confirmDelete ? '#ff3b30' : 'transparent',
                    color: confirmDelete ? '#fff' : '#444',
                    border: confirmDelete ? '1px solid #fff' : '1px solid #333',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    marginLeft: '15px'
                }}
            >
                <Trash2 size={18}/>
                {confirmDelete && <span style={{fontSize:'10px', fontWeight:'bold'}}>CONFIRMA EXCLUSÃO?</span>}
            </button>
        </div>

        <div style={{...styles.btnGroup, marginTop: '10px'}}>
          <button style={styles.exportBtn} onClick={() => triggerDL({songs:[{...item.data, content:lC, title:lT, artist:lA}]}, `Musica_${lT}.json`)}>EXPORTAR</button>
          {item.type === 'song' && (
            <>
              <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, 1); setLC(n); }}>+ Tom</button>
              <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, -1); setLC(n); }}>- Tom</button>
            </>
          )}
          <button onClick={onShow} style={styles.showBtn}>
            <Monitor size={14} style={{marginRight: '5px'}}/> {item.type === 'song' ? 'SHOW' : 'START'}
          </button>
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
        </div>
      </div>
      
      {item.type === 'song' ? (
        <textarea 
            style={styles.mainTextArea} 
            value={lC} 
            onChange={e=>setLC(e.target.value)} 
            onBlur={save}
            placeholder="Digite ou cole a cifra aqui..."
        />
      ) : (
        <div style={styles.setlistSplit}>
            <div style={styles.setlistHalf}>
                <h3 style={{color:'#007aff', fontSize:'12px', marginBottom:'10px'}}>Set List</h3>
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
                <h3 style={{color:'#888', fontSize:'12px', marginBottom:'10px'}}>Biblioteca</h3>
                {songs.map(s => (<div key={s.id} style={{padding:'8px', borderBottom:'1px solid #222', cursor:'pointer', display:'flex', justifyContent:'space-between'}} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}>{s.title} <Plus size={14} color="#34c759"/></div>))}
            </div>
        </div>
      )}
    </div>
  );
};