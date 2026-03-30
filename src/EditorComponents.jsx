import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { db, transposeContent } from './ShowPadCore';

export const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh, styles }) => {
  const [lC, setLC] = useState(item.data.content || ""), [lT, setLT] = useState(item.data.title || ""), [lA, setLA] = useState(item.data.artist || ""), [lLoc, setLLoc] = useState(item.data.location || ""), [lTim, setLTim] = useState(item.data.time || ""), [lMem, setLMem] = useState(item.data.members || ""), [lNot, setLNot] = useState(item.data.notes || "");
  const [myBands, setMyBands] = useState([]);
  const [selectedBand, setSelectedBand] = useState(item.data.band_id || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { db.my_bands.toArray().then(setMyBands); }, []);

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
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div style={{flex:1}}>
                <span style={styles.fieldLabel}>{item.type === 'song' ? 'Título da Música' : 'Nome do Show'}</span>
                <input style={styles.hInput} value={lT} onChange={e => setLT(e.target.value)} onBlur={save}/>
            </div>
            
            {/* BOTÃO DE EXCLUIR DENTRO DO EDITOR - "BLINDADO" */}
            <button 
                onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)}
                onMouseLeave={() => setConfirmDelete(false)}
                style={{
                    backgroundColor: confirmDelete ? '#ff3b30' : 'transparent',
                    color: confirmDelete ? '#fff' : '#444',
                    border: confirmDelete ? '1px solid #fff' : '1px solid #333',
                    borderRadius: '8px',
                    padding: '10px 15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginLeft: '20px',
                    transition: 'all 0.2s'
                }}
            >
                <Trash2 size={18}/> {confirmDelete && <span style={{fontSize:'10px', fontWeight:'bold'}}>EXCLUIR?</span>}
            </button>
        </div>

        <div style={styles.btnGroup}>
          <button style={styles.exportBtn} onClick={() => triggerDL({songs:[{...item.data, content:lC, title:lT, artist:lA}]}, `Export_${lT}.json`)}>EXPORTAR</button>
          {item.type === 'song' && (
            <>
              <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, 1); setLC(n); }}>+ Tom</button>
              <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, -1); setLC(n); }}>- Tom</button>
            </>
          )}
          <button onClick={onShow} style={styles.showBtn}>START SHOW</button>
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
        </div>
      </div>
      
      {item.type === 'song' ? (
        <textarea style={styles.mainTextArea} value={lC} onChange={e=>setLC(e.target.value)} onBlur={save} />
      ) : (
        <div style={{padding:'20px', color:'#888'}}>Edição de Setlist (Show) ativa. Use a barra lateral para adicionar músicas.</div>
      )}
    </div>
  );
};