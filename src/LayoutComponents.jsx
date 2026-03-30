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

  const executeDelete = async (id) => {
    if (view === 'library') await db.songs.delete(id);
    else await db.setlists.delete(id);
    refreshData();
    setSelectedItem(null);
    setConfirmDelete(null);
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

      <div style={{...styles.listArea, WebkitOverflowScrolling: 'touch'}}>
        {(view==='library' || view==='setlists') ? (view==='library'?songs:setlists).map(item => (
          <div key={item.id} 
               style={{
                 ...(selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem),
                 position: 'relative',
                 display: 'flex',
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 userSelect: 'none',
                 WebkitUserSelect: 'none'
               }}>
            
            {/* ÁREA DE SELEÇÃO: Otimizada para iPad */}
            <div 
              style={{flex: 1, height: '100%', padding: '10px 0', cursor: 'pointer', zIndex: 1}} 
              onPointerUp={() => { setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setConfirmDelete(null); }}
            >
              <strong style={{display:'block', color:'#fff'}}>{item.title}</strong>
              <small style={styles.artistYellow}>{item.artist || item.location || "---"}</small>
            </div>
            
            {/* ÁREA DE COMANDO: Botões com Z-Index alto e área de toque expandida */}
            <div style={{display:'flex', gap:'15px', alignItems:'center', zIndex: 10, pointerEvents: 'auto'}}>
              <button 
                onPointerUp={(e) => { e.stopPropagation(); setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setShowMode(true); }}
                style={{background:'none', border:'none', color:'#007aff', padding:'12px'}}
              >
                <Monitor size={22}/>
              </button>
              
              <button 
                onPointerUp={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (confirmDelete === item.id) {
                    executeDelete(item.id);
                  } else {
                    setConfirmDelete(item.id);
                    setTimeout(() => setConfirmDelete(null), 4000);
                  }
                }}
                style={{
                  backgroundColor: confirmDelete === item.id ? '#ff3b30' : 'rgba(255,255,255,0.05)', 
                  border: confirmDelete === item.id ? '2px solid #fff' : '1px solid #333',
                  borderRadius: '8px',
                  color: confirmDelete === item.id ? '#fff' : '#666',
                  padding: '10px',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'none'
                }}
              >
                {confirmDelete === item.id ? <Trash2 size={24} strokeWidth={3} /> : <Trash2 size={20}/>}
              </button>
            </div>
          </div>
        )) : <div style={{padding:'20px', color:'#888', textAlign:'center'}}>Menu Central Ativo.</div>}
      </div>
    </div>
  );
};