import React from 'react';
import { Music, Settings, Zap, LogOut, Save, Monitor, SortAsc, UserRound } from 'lucide-react';
import { supabase } from './ShowPadCore'; 

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

export const Sidebar = ({ view, setView, sortBy, setSortBy, songs, setlists, selectedItem, setSelectedItem, setShowMode, styles }) => {
  return (
    <div style={styles.sidebar}>
      <div style={styles.navTabs}>
        {['library', 'setlists', 'bands', 'garimpo'].map(v => (
          <button 
            key={v} 
            onClick={() => setView(v)} 
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
               style={selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem}
               onClick={() => setSelectedItem({type: view==='library'?'song':'setlist', data: item})}
          >
            <div style={{flex: 1, overflow: 'hidden'}}>
              <strong style={{display:'block', color:'#fff'}}>{item.title}</strong>
              <small style={styles.artistYellow}>{item.artist || item.location || "---"}</small>
            </div>
            
            {/* Único botão de ação na sidebar: Iniciar Show */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedItem({type: view==='library' ? 'song' : 'setlist', data: item}); 
                setShowMode(true); 
              }}
              style={{background: 'none', border: 'none', color: '#007aff', padding: '10px'}}
            >
              <Monitor size={22}/>
            </button>
          </div>
        )) : <div style={{padding:'20px', color:'#888', textAlign:'center', fontSize: '12px'}}>Aba ativa no painel central.</div>}
      </div>
    </div>
  );
};