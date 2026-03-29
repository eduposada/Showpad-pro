import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content || ""), [lT, setLT] = useState(item.data.title || ""), [lA, setLA] = useState(item.data.artist || ""), [lLoc, setLLoc] = useState(item.data.location || ""), [lTim, setLTim] = useState(item.data.time || ""), [lMem, setLMem] = useState(item.data.members || ""), [lNot, setLNot] = useState(item.data.notes || "");
  const [myBands, setMyBands] = useState([]);
  const [selectedBand, setSelectedBand] = useState(item.data.band_id || "");

  useEffect(() => { db.my_bands.toArray().then(setMyBands); }, []);

  const save = async () => {
    const changes = item.type === 'song' 
        ? { content: lC, title: lT, artist: lA, band_id: selectedBand || null }
        : { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot, band_id: selectedBand || null };
    
    if (item.type === 'song') await db.songs.update(item.data.id, changes);
    else await db.setlists.update(item.data.id, changes);
    refresh();
  };

  if (item.type === 'setlist') return (
    <div style={styles.editorContent}>
      <div style={styles.editorHeader}>
        <div style={styles.inputContainer}>
            <div style={styles.inputWrapper}>
                <span style={styles.fieldLabel}>Nome do Show</span>
                <input style={styles.whiteInputLarge} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save} placeholder="Ex: Show de Lançamento" />
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
            <div style={{...styles.inputWrapper, flex: 0.3}}>
                <span style={styles.fieldLabel}>Horário</span>
                <input placeholder="21:00" value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save} style={styles.whiteInputMedium}/>
            </div>
            <div style={styles.inputWrapper}>
                <span style={styles.fieldLabel}>Local / Evento</span>
                <input placeholder="Nome do Clube ou Bar" value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save} style={styles.whiteInputMedium}/>
            </div>
            <div style={{...styles.inputWrapper, flex: 0.6}}>
                <span style={styles.fieldLabel}>Banda Responsável</span>
                <select style={{...styles.whiteInputMedium, height: '38px'}} value={selectedBand} onChange={(e)=>{setSelectedBand(e.target.value); save();}}>
                    <option value="">👤 Solo (Pessoal)</option>
                    {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                </select>
            </div>
        </div>
        <div style={styles.inputWrapper}>
            <span style={styles.fieldLabel}>Participantes (Músicos Convidados / Equipe)</span>
            <input placeholder="João (Baixo), Maria (Voz)..." value={lMem} onChange={e=>setLMem(e.target.value)} onBlur={save} style={styles.whiteInputMedium}/>
        </div>
        <div style={styles.inputWrapper}>
            <span style={styles.fieldLabel}>Observações Técnicas (Timbres, Mapas, BPM)</span>
            <textarea placeholder="Notas importantes para o palco..." value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} style={{...styles.whiteInputMedium, height:'60px', resize:'none'}}></textarea>
        </div>
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
                </div>))}
        </div>
        <div style={{...styles.setlistHalf, background:'#222'}}>
            <h3 style={{color:'#888', fontSize:'13px', marginBottom:'10px'}}>BIBLIOTECA</h3>
            {songs.map(s => (<div key={s.id} style={styles.miniItem} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}><div style={{flex:1}}>{s.title}</div><Plus size={14} color="#34c759"/></div>))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.editorContent}>
      <div style={styles.editorHeader}>
        <div style={styles.inputContainer}>
            <div style={styles.inputWrapper}>
                <span style={styles.fieldLabel}>Título da Música</span>
                <input style={styles.whiteInputLarge} value={lT} onChange={e => setLT(e.target.value)} onBlur={save}/>
            </div>
            <div style={{display:'flex', gap:'10px', width:'100%'}}>
                <div style={styles.inputWrapper}>
                    <span style={styles.fieldLabel}>Banda / Artista</span>
                    <input style={styles.whiteInputMedium} value={lA} onChange={e => setLA(e.target.value)} onBlur={save} placeholder="Artista / Banda"/>
                </div>
                <div style={{...styles.inputWrapper, width: '200px', flex: 'none'}}>
                    <span style={styles.fieldLabel}>Visibilidade</span>
                    <select style={{...styles.whiteInputMedium, height: '38px'}} value={selectedBand} onChange={(e) => { setSelectedBand(e.target.value); save(); }}>
                        <option value="">🔒 Pessoal</option>
                        {myBands.map(b => <option key={b.id} value={b.id}>👥 {b.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
        <div style={styles.btnGroup}>
          <button style={styles.exportBtn} onClick={()=>triggerDL({songs:[{...item.data, content:lC}]}, `Export_${lT}.json`)}>EXPORTAR</button>
          <button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, 1); setLC(n); save();}}>+ Tom</button>
          <button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, -1); setLC(n); save();}}>- Tom</button>
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button><button onClick={onShow} style={styles.showBtn}>SHOW</button>
        </div>
      </div>
      <textarea style={styles.mainTextArea} value={lC} onChange={e=>setLC(e.target.value)} onBlur={save} />
    </div>
  );
};