import React, { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content), [lT, setLT] = useState(item.data.title), [lA, setLA] = useState(item.data.artist || ""), [lLoc, setLLoc] = useState(item.data.location || ""), [lTim, setLTim] = useState(item.data.time || ""), [lMem, setLMem] = useState(item.data.members || ""), [lNot, setLNot] = useState(item.data.notes || "");
  
  const save = async () => {
    if (item.type === 'song') await db.songs.update(item.data.id, { content: lC, title: lT, artist: lA });
    else await db.setlists.update(item.data.id, { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot });
    refresh();
  };

  const moveSong = async (index, dir) => {
    const newSongs = [...item.data.songs]; const target = index + dir;
    if (target >= 0 && target < newSongs.length) { [newSongs[index], newSongs[target]] = [newSongs[target], newSongs[index]]; await db.setlists.update(item.data.id, { songs: newSongs }); refresh(); }
  };

  return (
    <div style={styles.editorContent}>
      <div style={styles.editorHeader}>
        <div style={{flex:1}}><input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save}/><input style={styles.artistInput} value={item.type==='song'?lA:lLoc} onChange={e=>item.type==='song'?setLA(e.target.value):setLLoc(e.target.value)} onBlur={save} placeholder={item.type==='song'?"Artista":"Local"}/></div>
        <div style={styles.btnGroup}>
          <button style={styles.exportBtn} onClick={()=>triggerDL(item.type==='song'?{songs:[{...item.data, content:lC}]}:{songs:item.data.songs, setlists:[{...item.data}]}, `ShowPad_${item.type==='song'?'Musica':'Show'}_${lT}.json`)}>EXPORTAR</button>
          {item.type==='song' && <><button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, 1); setLC(n); save();}}>+ Tom</button><button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, -1); setLC(n); save();}}>- Tom</button></>}
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button><button onClick={onShow} style={styles.showBtn}>SHOW</button>
        </div>
      </div>
      {item.type === 'setlist' ? (
        <div style={styles.setlistSplit}>
            <div style={styles.setlistHalf}>
                <h3 style={{color:'#007aff'}}>Set List do Show</h3>
                {(item.data.songs || []).map((s, i) => (
                    <div key={i} style={styles.miniItemReorder}>
                        <div style={{flex:1, color:'#fff'}}>{i+1}. {s.title}</div>
                        <div style={styles.reorderControls}>
                            <button onClick={() => moveSong(i, -1)} disabled={i === 0}><ArrowUp size={14}/></button>
                            <button onClick={() => moveSong(i, 1)} disabled={i === item.data.songs.length - 1}><ArrowDown size={14}/></button>
                            <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}}><Trash2 size={14} color="#ff3b30"/></button>
                        </div>
                    </div>))}
            </div>
            <div style={{...styles.setlistHalf, background:'#222'}}>
                <h3 style={{color:'#888'}}>Biblioteca (Clique no +)</h3>
                {songs.map(s => (<div key={s.id} style={styles.miniItem} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}><div style={{flex:1}}>{s.title}</div><Plus size={14} color="#34c759"/></div>))}
            </div>
        </div>
      ) : <textarea style={styles.mainTextArea} value={lC} onChange={e=>setLC(e.target.value)} onBlur={save} />}
    </div>
  );
};