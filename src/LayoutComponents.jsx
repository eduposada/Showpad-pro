import React, { useState } from 'react';
import { Music, Settings, Zap, LogOut, Save, FileUp, Monitor, Trash2, SortAsc, UserRound } from 'lucide-react';
import { supabase, db } from './ShowPadCore'; 

export const Header = ({ midiFlash, midiStatus, session, triggerDL, setShowSettings, songs, setlists, styles }) => (
  <header style={styles.mainHeader}>
    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
      <Music color="#007aff" />
      <h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
      <div style={midiFlash ? styles.midiBadgeActive : (midiStatus === 'ready' ? styles.midiBadgeOn : styles.midiBadgeOff)}>
        <Zap size={10}/> {midiStatus === 'ready' ? "MIDI OK" : "MIDI OFF"}
      </div>
    </div>
    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
      <span style={{fontSize:'10px', color:'#666'}}>{session?.user?.email}</span>
      <button style={styles.headerBtn} onClick={() => triggerDL({songs, setlists}, "Backup.json")}><Save size={14}/> BACKUP</button>
      <button onClick={() => setShowSettings(true)} style={{background:'none', border:'none', cursor:'pointer', color:'#fff'}}><Settings size={22}/></button>
      <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', cursor:'pointer', color:'#ff3b30'}}><LogOut size={18}/></button>
    </div>
  </header>
);

export const Sidebar = ({ view, setView, sortBy, setSortBy, songs, setlists, selectedItem, setSelectedItem, setShowMode, refreshData, styles }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Função ajustada para "furar" o bloqueio do Web MIDI Browser
  const handleDelete = async (e, item) => {
    // e.preventDefault() aqui evita que o navegador trate o toque como scroll
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    if (confirmDelete === item.id) {
      if (view === 'library') await db.songs.delete(item.id);
      else await db.setlists.delete(item.id);
      refreshData();
      setSelectedItem(null);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(item.id);
      // Mantém o botão "armado" por 4 segundos
      setTimeout(() => setConfirmDelete(null), 4000);
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.navTabs}>
        {['library', 'setlists', 'bands', 'garimpo'].map(v => (
          <button 
            key={v} 
            onClick={() => { setView(v); setConfirmDelete(null); }} 
            style={view === v ? styles.activeTab : styles.tab}
          >
            {v === 'library' ? 'MÚSICAS' : v === 'setlists' ? 'SHOWS' : v.toUpperCase()}
          </button>
        ))}
      </div>
      
      {view === 'library' && (
        <div style={{display:'flex', padding:'10px', gap:'10px', borderBottom:'1px solid #333', backgroundColor:'#1a1a1a'}}>
          <button onClick={()=>setSortBy('title')} style={sortBy==='title'?{color:'#007aff', background:'none', border:'none', fontSize:'11px', fontWeight:'bold'}:{color:'#666', background:'none', border:'none', fontSize:'11px'}}><SortAsc size={12}/> Título</button>
          <button onClick={()=>setSortBy('artist')} style={sortBy==='artist'?{color:'#007aff', background:'none', border:'none', fontSize:'11px', fontWeight:'bold'}:{color:'#666', background:'none', border:'none', fontSize:'11px'}}><UserRound size={12}/> Banda</button>
        </div>
      )}

      <div style={styles.listArea}>
        {(view==='library' || view==='setlists') ? (view==='library'?songs:setlists).map(item => (
          <div key={item.id} style={selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem}>
            <div 
              style={{flex:1, overflow:'hidden', cursor:'pointer', padding: '5px 0'}} 
              onPointerDown={() => { setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setConfirmDelete(null); }}
            >
              <strong style={{display:'block', color:'#fff'}}>{item.title}</strong>
              <small style={styles.artistYellow}>{item.artist || item.location || "---"}</small>
            </div>
            <div style={{display:'flex', gap:'12px', alignItems:'center', paddingRight: '10px'}}>
              <button 
                style={{background:'none', border:'none', color:'#007aff', cursor:'pointer', padding:'8px'}} 
                onPointerDown={(e) => { e.stopPropagation(); setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setShowMode(true); }}
              >
                <Monitor size={20}/>
              </button>
              
              <button 
                // onPointerDown é o segredo para o iPad 8 reagir na hora
                onPointerDown={(e) => handleDelete(e, item)}
                style={{
                  background: confirmDelete === item.id ? '#ff3b30' : 'none', 
                  border: confirmDelete === item.id ? '1px solid #fff' : 'none', 
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: confirmDelete === item.id ? '#fff' : '#444',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'none' // Bloqueia gestos nativos do navegador neste botão
                }}
              >
                {confirmDelete === item.id ? <Trash2 size={24} strokeWidth={3} /> : <Trash2 size={20}/>}
              </button>
            </div>
          </div>
        )) : <div style={{padding:'20px', color:'#888', fontSize:'12px', textAlign:'center'}}>Aba ativa no painel central.</div>}
      </div>
    </div>
  );
};