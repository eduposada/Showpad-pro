import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Monitor, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { db, transposeContent, supabase, hydrateBandSetlistSongsFromRepertoire } from './ShowPadCore';

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
  
  /** Repertório oficial da banda (Supabase `band_repertoire`) — Fase D não preenche mais `band_songs` no pull. */
  const [bandOfficialPickList, setBandOfficialPickList] = useState([]);

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
  }, [item.data.id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (item.type !== 'setlist' || !item.data.band_id || !supabase) {
        setBandOfficialPickList([]);
        return;
      }
      const band = bands.find((b) => b.id === item.data.band_id);
      if (band?.is_solo) {
        setBandOfficialPickList([]);
        return;
      }
      const { data, error } = await supabase
        .from('band_repertoire')
        .select('title, artist, content, bpm')
        .eq('band_id', item.data.band_id)
        .order('title', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn('Repertório da banda (editor):', error.message || error);
        setBandOfficialPickList([]);
        return;
      }
      const key = (title, artist) => `${String(title || '').trim()}::${String(artist || '').trim()}`;
      const rows = data || [];
      setBandOfficialPickList(
        rows.map((row) => ({
          id: `band-official:${item.data.band_id}:${key(row.title, row.artist)}`,
          title: row.title,
          artist: row.artist,
          content: row.content || '',
          bpm: row.bpm || 120,
        })),
      );
    };
    run();
    return () => { cancelled = true; };
  }, [item.type, item.data.band_id, item.data.id, bands]);

  useEffect(() => {
    let cancelled = false;
    const data = item.data;
    (async () => {
      if (item.type !== 'setlist' || !data.band_id || !supabase) return;
      const h = await hydrateBandSetlistSongsFromRepertoire(data);
      if (cancelled) return;
      if (JSON.stringify(data.songs ?? []) === JSON.stringify(h.songs ?? [])) return;
      await db.setlists.update(data.id, { songs: h.songs });
      refresh();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh não é estável; basta reagir ao item
  }, [item.type, item.data.id, item.data.band_id, item.data.songs]);

  const save = async (overideBpm) => {
    const isSong = item.type === 'song';
    const finalBpm = overideBpm !== undefined ? overideBpm : lBpm;
    
    const changes = isSong 
        ? { content: lC, title: lT, artist: lA, notes: lNot, bpm: parseInt(finalBpm, 10) }
        : { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot };
    
    await (isSong ? db.songs : db.setlists).update(item.data.id, changes);
    refresh();
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
    
    const filteredSongs = (band && !band.is_solo) ? bandOfficialPickList : songs;

    return (
        <div style={styles.mainEditor}>
            {item.data.revoked_by_admin && item.data.band_id && (
                <div style={{
                    padding: '12px 20px', background: '#2a2210', borderBottom: '1px solid #ff950055', color: '#ffcc6b',
                    fontSize: '12px', fontWeight: 700, lineHeight: 1.45,
                }}>
                    Este show já não faz parte da agenda oficial da banda (foi removido pelo administrador na nuvem).
                    Podes consultar ou remover da lista na agenda de shows da banda.
                </div>
            )}
            <div style={{...styles.editorHeader, borderLeft: band ? '6px solid #ff9500' : 'none'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Título do Show" />
                    {band && (
                        <div style={{display:'flex', alignItems:'center', gap:'10px', background:'#000', padding:'5px 12px', borderRadius:'20px', border:'1px solid #333'}}>
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
            
            <textarea style={{...styles.notesTextArea, marginBottom:'10px'}} value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} placeholder="Observações do show..." rows={2} />

            <div style={styles.setlistSplit}>
                <div style={styles.setlistHalf}>
                    <h3 style={{color:'#888', fontSize:'12px', marginBottom:'10px'}}>Músicas no Show</h3>
                    {item.data.songs?.map((s, i) => {
                        const liveSong = songs.find(original => original.id === s.id);
                        return (
                            <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px', borderBottom:'1px solid #222'}}>
                                <div style={{display:'flex', flexDirection:'column'}}>
                                    <span style={{fontSize:'13px'}}>{s.title}</span>
                                    <small style={{color: '#FFD700', fontSize:'10px', fontWeight: 'bold'}}>BPM: {liveSong ? liveSong.bpm : s.bpm || "---"}</small>
                                </div>
                                <div style={{display:'flex', gap:'5px'}}>
                                    <button onClick={async ()=>{const n=[...item.data.songs]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#888'}}><ArrowUp size={14}/></button>
                                    <button onClick={async ()=>{const n=[...item.data.songs]; if(i<n.length-1){[n[i],n[i+1]]=[n[i+1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}} style={{background:'none', border:'none', color:'#888'}}><ArrowDown size={14}/></button>
                                    <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}} style={{background:'none', border:'none', color:'#ff3b30'}}><Trash2 size={14}/></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{...styles.setlistHalf, background:'#111'}}>
                    <h3 style={{color: band ? '#ff9500' : '#888', fontSize:'12px', marginBottom:'10px'}}>
                        {band && !band.is_solo ? `Repertório: ${band.name}` : "Biblioteca Geral"}
                    </h3>
                    {filteredSongs.map(s => (
                        <div key={s.id} style={{padding:'8px', borderBottom:'1px solid #222', cursor:'pointer', display:'flex', justifyContent:'space-between'}} onClick={async ()=>{
                            const entry = (band && !band.is_solo)
                                ? { title: s.title, artist: s.artist, content: s.content ?? '', bpm: s.bpm ?? 120 }
                                : { ...s };
                            const n=[...(item.data.songs||[]), entry];
                            await db.setlists.update(item.data.id,{songs:n});
                            refresh();
                        }}>
                            <span style={{fontSize:'13px'}}>{s.title}</span>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <small style={{color: '#666', fontSize: '10px'}}>BPM: {s.bpm || "---"}</small>
                                <Plus size={14} color="#34c759"/>
                            </div>
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
          <button onClick={() => handleTranspose(-1)} style={{...styles.headerBtn, padding:'8px 15px'}}>- TOM</button>
          <button onClick={() => handleTranspose(1)} style={{...styles.headerBtn, padding:'8px 15px'}}>+ TOM</button>
          
          <div style={styles.bpmControlGroup}>
            <span style={{fontSize:'9px', color:'#666', fontWeight:'bold'}}>BPM</span>
            <div style={styles.bpmDisplay}>{lBpm}</div>
            <div style={{display:'flex', flexDirection:'column'}}>
                <button onClick={() => adjustBpm(1)} style={styles.bpmBtnSmall}><ChevronUp size={14}/></button>
                <button onClick={() => adjustBpm(-1)} style={styles.bpmBtnSmall}><ChevronDown size={14}/></button>
            </div>
          </div>

          <button onClick={async () => { await save(); onShow(item.data); }} style={styles.showBtn}>
            <Monitor size={16} style={{marginRight:'8px'}}/> SHOW
          </button>
          <button onClick={onClose} style={styles.saveBtn}>CONCLUIR</button>
        </div>
      </div>

      <textarea style={styles.notesTextArea} value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} placeholder="Observações..." rows={3} />
      <textarea style={styles.mainTextArea} value={lC} onChange={e=>setLC(e.target.value)} onBlur={save} placeholder="Cifra..." />

      {confirmDelete && (
        <div style={styles.settingsOverlay}>
          <div style={{...styles.settingsCard, padding:'30px', textAlign:'center'}}>
            <h3 style={{color:'#fff', marginBottom:'10px'}}>EXCLUIR MÚSICA?</h3>
            <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
              <button onClick={()=>setConfirmDelete(false)} style={{...styles.saveBtn, backgroundColor:'#444'}}>CANCELAR</button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await db.songs.delete(item.data.id);
                    await refresh();
                    onClose();
                  } catch (err) {
                    alert('Não foi possível excluir: ' + (err?.message || String(err)));
                  }
                }}
                style={{...styles.saveBtn, backgroundColor:'#ff3b30'}}
              >
                EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};