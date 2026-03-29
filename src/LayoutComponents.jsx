import React from 'react';
import { Music, Settings, Zap, LogOut, Save, FileUp, Monitor, Trash2, SortAsc, UserRound } from 'lucide-react';
import { supabase, db } from './MusicEngine';

export const Header = ({ midiFlash, midiStatus, allInputs, session, triggerDL, setShowSettings, songs, setlists, handleImport, styles }) => (
  <header style={styles.mainHeader}>
    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
      <Music color="#007aff" />
      <h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
      <div style={midiFlash ? styles.midiBadgeActive : (midiStatus === 'ready' ? styles.midiBadgeOn : styles.midiBadgeOff)}>
        <Zap size={10}/> {midiStatus === 'ready' ? "MIDI OK" : "MIDI OFF"}
      </div>
    </div>
    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
      <span style={{fontSize:'10px', color:'#666'}}>{session.user.email}</span>
      <button style={styles.headerBtn} onClick={() => triggerDL({songs, setlists}, "Backup.json")}><Save size={14}/> BACKUP</button>
      <button onClick={() => setShowSettings(true)} style={styles.infoBtn}><Settings size={22}/></button>
      <button onClick={() => supabase.auth.signOut()} style={styles.logoutBtn}><LogOut size={18}/></button>
    </div>
  </header>
);

export const Sidebar = ({ view, setView, sortBy, setSortBy, songs, setlists, selectedItem, setSelectedItem, setShowMode, refreshData, session, styles }) => (
  <div style={styles.sidebar}>
    <div style={styles.navTabs}>
      {['library', 'setlists', 'garimpo', 'bands'].map(v => (
        <button key={v} onClick={() => setView(v)} style={view === v ? styles.activeTab : styles.tab}>{v.toUpperCase()}</button>
      ))}
    </div>
    {view === 'library' && (
      <div style={styles.sortBar}>
        <button onClick={()=>setSortBy('title')} style={sortBy==='title'?styles.sortBtnActive:styles.sortBtn}><SortAsc size={12}/> Título</button>
        <button onClick={()=>setSortBy('artist')} style={sortBy==='artist'?styles.sortBtnActive:styles.sortBtn}><UserRound size={12}/> Banda</button>
      </div>
    )}
    <div style={styles.listArea}>
      {(view==='library' || view==='setlists') ? (view==='library'?songs:setlists).map(item => (
        <div key={item.id} style={selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem}>
          <div style={{flex:1, overflow:'hidden'}} onClick={() => setSelectedItem({type: view==='library'?'song':'setlist', data: item})}>
            <strong>{item.title}</strong><small style={{display:'block', opacity:0.5, color:'#aaa'}}>{item.artist || item.location || "---"}</small>
          </div>
          <div style={{display:'flex', gap:'6px'}}>
            <button style={styles.listActionBtnShow} onClick={() => { setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setShowMode(true); }}><Monitor size={16}/></button>
            <button style={styles.listActionBtnDelete} onClick={async () => { if(confirm("Excluir?")) { if(view==='library') await db.songs.delete(item.id); else await db.setlists.delete(item.id); refreshData(); setSelectedItem(null); }}}><Trash2 size={16}/></button>
          </div>
        </div>
      )) : <div style={{padding:'20px', color:'#888', fontSize:'12px'}}>Aba ativa. Painel central liberado.</div>}
    </div>
  </div>
);