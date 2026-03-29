import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content || ""), [lT, setLT] = useState(item.data.title || ""), [lA, setLA] = useState(item.data.artist || ""), [lLoc, setLLoc] = useState(item.data.location || ""), [lTim, setLTim] = useState(item.data.time || ""), [lMem, setLMem] = useState(item.data.members || ""), [lNot, setLNot] = useState(item.data.notes || "");
  const [myBands, setMyBands] = useState([]);
  const [selectedBand, setSelectedBand] = useState(item.data.band_id || "");

  useEffect(() => { db.my_bands.toArray().then(setMyBands); }, []);

  const save = async () => {
    if (item.type === 'song') await db.songs.update(item.data.id, { content: lC, title: lT, artist: lA, band_id: selectedBand || null });
    else await db.setlists.update(item.data.id, { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot, band_id: selectedBand || null });
    refresh();
  };

  if (item.type === 'setlist') return (
    <div style={styles.editorContent}>
      <div style={styles.editorHeader}>
        <div style={styles.inputContainer}>
            <input style={styles.whiteInputLarge} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Título do Show" />
            <div style={{display:'flex', gap:'10px', width:'100%'}}>
                <input style={styles.whiteInputMedium} value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save} placeholder="Local do Show"/>
                <select style={{...styles.whiteInputMedium, width:'200px'}} value={selectedBand} onChange={(e)=>{setSelectedBand(e.target.value); save();}}>
                    <option value="">👤 Solo (Pessoal)</option>
                    {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                </select>
            </div>
        </div>
        <div style={styles.btnGroup}>
          <button style={styles.exportBtn} onClick={()=>triggerDL({songs: item.data.songs, setlists:[{...item.data}]}, `Show_${lT}.json`)}>EXPORTAR</button>
          <button onClick={onShow} style={styles.showBtn}>START SHOW</button>
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
        </div>
      </div>
      <div style={styles.showMetaData}>
        <div style={styles.metaRow}>
            <input placeholder="Hora" value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save} style={{...styles.whiteInputMedium, flex: 0.3}}/>
            <input placeholder="Integrantes" value={lMem} onChange={e=>setLMem(e.target.value)} onBlur={save} style={styles.whiteInputMedium}/>
        </div>
        <textarea placeholder="Notas do Show..." value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} style={{...styles.whiteInputMedium, height:'60px', resize:'none'}}></textarea>
      </div>
      <div style={styles.setlistSplit}>
        <div style={styles.setlistHalf}>
            <h3 style={{color:'#007aff'}}>Set List do Show</h3>
            {(item.data.songs || []).map((s, i) => (
                <div key={i} style={styles.miniItemReorder}>
                    <div style={{flex:1, color:'#fff'}}>{i+1}. {s.title}</div>
                    <div style={styles.reorderControls}>
                        <button onClick={async ()=>{const n=[...item.data.songs]; if(i>0){[n[i],n[i-1]]=[n[i-1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}}><ArrowUp size={14}/></button>
                        <button onClick={async ()=>{const n=[...item.data.songs]; if(i<n.length-1){[n[i],n[i+1]]=[n[i+1],n[i]]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}}><ArrowDown size={14}/></button>
                        <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}}><Trash2 size={14} color="#ff3b30"/></button>
                    </div>
                </div>))}
        </div>
        <div style={{...styles.setlistHalf, background:'#222'}}>
            <h3 style={{color:'#888'}}>Biblioteca</h3>
            {songs.map(s => (<div key={s.id} style={styles.miniItem} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}><div style={{flex:1}}>{s.title}</div><Plus size={14} color="#34c759"/></div>))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.editorContent}>
      <div style={styles.editorHeader}>
        <div style={styles.inputContainer}>
            <input style={styles.whiteInputLarge} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save}/>
            <div style={{display:'flex', gap:'10px', width:'100%'}}>
                <input style={styles.whiteInputMedium} value={lA} onChange={e=>setLA(e.target.value)} onBlur={save} placeholder="Artista / Banda"/>
                <select style={{...styles.whiteInputMedium, width:'200px'}} value={selectedBand} onChange={(e) => { setSelectedBand(e.target.value); save(); }}>
                    <option value="">🔒 Pessoal</option>
                    {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                </select>
            </div>
        </div>
        <div style={styles.btnGroup}>
          <button style={styles.exportBtn} onClick={()=>triggerDL(item.type==='song'?{songs:[{...item.data, content:lC}]}:{songs:item.data.songs, setlists:[{...item.data}]}, `Export_${lT}.json`)}>EXPORTAR</button>
          <button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, 1); setLC(n); save();}}>+ Tom</button>
          <button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, -1); setLC(n); save();}}>- Tom</button>
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button><button onClick={onShow} style={styles.showBtn}>SHOW</button>
        </div>
      </div>
      <textarea style={styles.mainTextArea} value={lC} onChange={e=>setLC(e.target.value)} onBlur={save} />
    </div>
  );
};