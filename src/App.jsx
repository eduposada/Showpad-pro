import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import { 
  Plus, Music, Trash2, Monitor, Settings, Zap, 
  LogOut, UserRound, Cloud, RefreshCw, Activity, Users 
} from 'lucide-react';

// IMPORTAÇÃO BLINDADA: supabase deve ser um dos primeiros
import { supabase, db, triggerDL, pushToCloud, pullFromCloud } from './ShowPadCore';

import { MainEditor } from './EditorComponents';
import { ShowModeView } from './ShowModeView';
import { SettingsView } from './SettingsView';
import { AuthView } from './AuthView';
import { BandsView } from './BandsView'; 
import { GarimpoView } from './GarimpoView';
import { styles } from './Styles';

export default function App() {
  const [session, setSession] = useState(null);
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [showMode, setShowMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState('library'); 
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  const [sortBy, setSortBy] = useState(localStorage.getItem('sortBy') || 'title');

  const [midiStatus, setMidiStatus] = useState("off");
  const [midiFlash, setMidiFlash] = useState(false);
  const [allInputs, setAllInputs] = useState([]);
  const [lastSignalUI, setLastSignalUI] = useState("");
  const [midiLearning, setMidiLearning] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

  // Efeito para Gerenciamento de Sessão (Blindado contra Undefined)
  useEffect(() => {
    const checkSession = async () => {
      if (supabase && supabase.auth) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) setSession(data.session);
      }
    };
    
    checkSession();

    if (supabase && supabase.auth) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => { 
    if (session) { refreshData(); initMidi(); }
  }, [session, sortBy]);

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);

  const refreshData = async () => { 
    try {
        const s = await db.songs.toArray();
        const sl = await db.setlists.toArray();
        
        // Criar Banda Solo se não existir
        if (session) {
            const bands = await db.bands.toArray();
            if (!bands.find(b => b.is_solo)) {
                const soloName = `${session.user.user_metadata?.full_name || 'Edu'} (Solo)`;
                await db.bands.add({
                    name: soloName,
                    is_solo: true,
                    members: [session.user.email],
                    creator_id: session.user.id
                });
            }
        }

        s.sort((a,b) => {
            const valA = (sortBy === 'artist' ? a.artist : a.title) || "";
            const valB = (sortBy === 'artist' ? b.artist : b.title) || "";
            return valA.toLowerCase().localeCompare(valB.toLowerCase());
        });
        
        setSongs(s); 
        setSetlists(sl); 

        if (selectedItem) {
            const id = selectedItem.data.id;
            const upd = (selectedItem.type === 'song') ? s.find(x => x.id === id) : sl.find(x => x.id === id);
            if (upd) setSelectedItem({type: selectedItem.type, data: upd});
        }
    } catch (e) { console.error("Erro ao atualizar dados:", e); }
  };

  const handleCloudPush = async () => {
    if (!session) return;
    setIsSyncing(true);
    try { await pushToCloud(session.user.id); alert("ShowPad Cloud: Backup salvo!"); } 
    catch (e) { alert("Erro ao subir: " + e.message); }
    setIsSyncing(false);
  };

  const handleCloudPull = async () => {
    if (!session) return;
    setIsSyncing(true);
    try { await pullFromCloud(session.user.id); await refreshData(); alert("ShowPad Cloud: Sincronizado!"); } 
    catch (e) { alert("Erro ao baixar: " + e.message); }
    setIsSyncing(false);
  };

  const initMidi = () => {
    WebMidi.enable({ sysex: true }).then(() => {
      const updateMidi = () => {
        const ins = WebMidi.inputs;
        setAllInputs(ins.map(i => i.name));
        setMidiStatus(ins.length > 0 ? "ready" : "nodevice");
        
        ins.forEach(input => {
          input.removeListener();
          input.addListener("midimessage", e => {
            const st = e.data[0], d1 = e.data[1], d2 = e.data[2];
            if ((st >= 144 && st <= 159 && d2 > 0) || (st >= 176 && st <= 191)) {
              const sig = (st >= 144 && st <= 159 ? "note" : "cc") + "-" + d1;
              setMidiFlash(true); 
              setLastSignalUI(sig); 
              setTimeout(() => { setMidiFlash(false); setLastSignalUI(""); }, 1000);
              
              if (midiLearningRef.current) { 
                localStorage.setItem("midi-" + midiLearningRef.current, sig); 
                setMidiLearning(null); 
                return; 
              }
              if (sig === localStorage.getItem('midi-up')) scrollPage(-1);
              if (sig === localStorage.getItem('midi-down')) scrollPage(1);
            }
          });
        });
      };
      updateMidi();
      WebMidi.addListener("connected", updateMidi);
      WebMidi.addListener("disconnected", updateMidi);
    }).catch(() => setMidiStatus("blocked"));
  };

  const scrollPage = (d) => { if (showScrollRef.current) showScrollRef.current.scrollBy({ top: (window.innerHeight * 0.45) * d, behavior: 'smooth' }); };

  const handleImport = (e, targetMode) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (targetMode === 'library' && d.songs) {
          for (let s of d.songs) {
            if (!(await db.songs.where({title: s.title, artist: s.artist}).first())) {
              await db.songs.add({ ...s, id: undefined, creator_id: session.user.id });
            }
          }
        }
        refreshData(); alert("Importado!");
      } catch (err) { alert("Erro JSON."); }
    };
    reader.readAsText(e.target.files[0]);
  };

  // Se não houver sessão ou supabase estiver carregando
  if (!session) return <AuthView styles={styles} />;

  return (
    <div style={styles.appContainer}>
      <header style={styles.mainHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <Music color="#007aff" />
          <h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
          <div style={midiFlash ? styles.midiBadgeActive : (midiStatus === 'ready' ? styles.midiBadgeOn : styles.midiBadgeOff)}>
            <Zap size={10}/> {midiStatus === 'ready' ? "MIDI OK" : "MIDI OFF"}
          </div>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
            <button style={styles.headerBtn} onClick={handleCloudPush}><Cloud size={14}/> {isSyncing ? "..." : "SUBIR"}</button>
            <button style={styles.headerBtn} onClick={handleCloudPull}><RefreshCw size={14}/> {isSyncing ? "..." : "BAIXAR"}</button>
            <button style={styles.headerBtn} onClick={() => triggerDL({songs, setlists}, "Backup_ShowPad.json")}>BACKUP</button>
            <button onClick={() => setShowSettings(true)} style={{background:'none', border:'none', cursor:'pointer', color:'#fff'}}><Settings size={22}/></button>
            <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', cursor:'pointer', color:'#ff3b30'}}><LogOut size={20}/></button>
        </div>
      </header>

      <div style={{ display:'flex', flex: 1, overflow:'hidden', width: '100%' }}>
        <div style={styles.sidebar}>
          <div style={styles.navTabs}>
            <button onClick={() => setView('library')} style={view === 'library' ? styles.activeTab : styles.tab}>
                <Music size={12} style={{marginBottom: 4}}/><br/>MÚSICAS
            </button>
            <button onClick={() => setView('bands')} style={view === 'bands' ? styles.activeTab : styles.tab}>
                <Users size={12} style={{marginBottom: 4}}/><br/>BANDAS
            </button>
            <button onClick={() => setView('garimpo')} style={view === 'garimpo' ? styles.activeTab : styles.tab}>
                <Activity size={12} style={{marginBottom: 4}}/><br/>GARIMPAR
            </button>
          </div>

          <div style={styles.listArea}>
            {view === 'library' ? (
                songs.map(item => (
                    <div key={item.id} style={selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem}
                         onClick={() => setSelectedItem({type: 'song', data: item})}>
                        <div style={{flex:1, overflow:'hidden'}}>
                            <strong style={{color:'#fff', display:'block'}}>{item.title}</strong>
                            <small style={styles.artistYellow}>{item.artist || "---"}</small>
                        </div>
                        <div style={{display:'flex', gap:'6px'}}>
                            <div style={{cursor:'pointer'}} onClick={(e) => { e.stopPropagation(); setSelectedItem({type: 'song', data: item}); setShowMode(true); }}><Monitor size={20} color="#007aff"/></div>
                            <div style={{cursor:'pointer'}} onClick={async (e) => { e.stopPropagation(); if(confirm("Excluir música?")) { await db.songs.delete(item.id); refreshData(); setSelectedItem(null); }}}><Trash2 size={20} color="#444"/></div>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{padding:'40px 20px', color:'#444', textAlign:'center', fontSize:'12px'}}>
                    {view === 'bands' ? "Selecione uma Banda no painel central para gerenciar seus Setlists." : "Use o painel central para capturar novas cifras."}
                </div>
            )}
          </div>

          <div style={styles.sidebarFooter}>
            {view === 'library' && (
                <button onClick={async () => { 
                    const id = await db.songs.add({title:"Nova Música", artist:"Artista", content:"", creator_id: session.user.id}); 
                    refreshData(); 
                    setSelectedItem({type:'song', data: await db.songs.get(id)}); 
                }} style={styles.addBtn}>+ NOVA MÚSICA</button>
            )}
          </div>
        </div>

        <div style={styles.mainEditor}>
          {view === 'garimpo' ? (
            <GarimpoView styles={styles} refresh={refreshData} session={session} />
          ) : view === 'bands' ? (
            <BandsView 
                styles={styles} 
                session={session} 
                onOpenSetlist={(sl) => {
                    setSelectedItem({ type: 'setlist', data: sl });
                }} 
            />
          ) : selectedItem ? (
            <MainEditor 
                key={selectedItem.data.id} 
                item={selectedItem} 
                songs={songs} 
                onClose={()=>setSelectedItem(null)} 
                onShow={()=>setShowMode(true)} 
                refresh={refreshData} 
                styles={styles} 
            />
          ) : (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', opacity: 0.1}}>
              <Music size={150} color="#fff" />
              <h1 style={{fontSize:'48px', fontWeight:'900', margin:0}}>SHOWPAD PRO</h1>
            </div>
          )}
        </div>
      </div>

      {showMode && (
        <ShowModeView 
            item={selectedItem} 
            fontSize={fontSize} 
            setFontSize={setFontSize} 
            scrollPage={scrollPage} 
            onClose={()=>setShowMode(false)} 
            showScrollRef={showScrollRef} 
            lastSignal={lastSignalUI} 
            styles={styles} 
        />
      )}
      
      {showSettings && (
        <SettingsView 
            onClose={()=>setShowSettings(false)} 
            inputs={allInputs} 
            setMidiLearning={setMidiLearning} 
            midiLearning={midiLearning} 
            midiStatus={midiStatus} 
            handleImport={handleImport} 
            styles={styles} 
        />
      )}
    </div>
  );
}