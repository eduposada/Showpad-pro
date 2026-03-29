import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import { 
  Plus, Music, Trash2, FileUp, Save, Monitor, Settings, Zap, 
  LogOut, SortAsc, UserRound, ChevronLeft, Cloud, RefreshCw 
} from 'lucide-react';

// Importação dos módulos (Certifique-se que o arquivo se chama ShowPadCore.jsx)
import { db, transposeContent, supabase, triggerDL, pushToCloud, pullFromCloud } from './ShowPadCore';
import { MainEditor } from './EditorComponents';
import { ShowModeView } from './ShowModeView';
import { SettingsView } from './SettingsView';
import { AuthView } from './AuthView';
import { BandView } from './BandView';
import { GarimpoView } from './GarimpoView';
import { styles } from './Styles';

export default function App() {
  // --- ESTADOS DE DADOS ---
  const [session, setSession] = useState(null);
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // --- ESTADOS DE INTERFACE ---
  const [showMode, setShowMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState('library'); 
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  const [sortBy, setSortBy] = useState(localStorage.getItem('sortBy') || 'title');

  // --- ESTADOS MIDI E GARIMPO ---
  const [midiStatus, setMidiStatus] = useState("off");
  const [midiFlash, setMidiFlash] = useState(false);
  const [allInputs, setAllInputs] = useState([]);
  const [lastSignalUI, setLastSignalUI] = useState("");
  const [midiLearning, setMidiLearning] = useState(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);

  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

  // --- 1. MONITOR DE SESSÃO ---
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then((res) => { if (res.data) setSession(res.data.session); });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
      return () => subscription.unsubscribe();
    }
  }, []);

  // --- 2. CARREGAMENTO E SINCRONIZACAO ---
  useEffect(() => { 
    if (session) { refreshData(); initMidi(); checkServer(); }
  }, [session, sortBy]);

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);

  const refreshData = async () => { 
    try {
        const s = await db.songs.toArray();
        const sl = await db.setlists.toArray();
        
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

  const checkServer = () => {
    fetch('http://localhost:3001/ping').then(r => setIsServerOnline(r.ok)).catch(() => setIsServerOnline(false));
  };

  // --- 3. LÓGICA DE NUVEM ---
  const handleCloudPush = async () => {
    if (!session) return;
    setIsScraping(true);
    try {
        await pushToCloud(session.user.id);
        alert("ShowPad Cloud: Backup salvo com sucesso!");
    } catch (e) { alert("Erro ao subir dados: " + e.message); }
    setIsScraping(false);
  };

  const handleCloudPull = async () => {
    if (!session) return;
    setIsScraping(true);
    try {
        await pullFromCloud(session.user.id);
        await refreshData();
        alert("ShowPad Cloud: Biblioteca sincronizada!");
    } catch (e) { alert("Erro ao baixar dados: " + e.message); }
    setIsScraping(false);
  };

  // --- 4. LÓGICA MIDI ---
  const initMidi = () => {
    WebMidi.enable({ sysex: true }).then(() => {
      const upd = () => {
        const ins = WebMidi.inputs.filter(i => i.name.indexOf("IAC") === -1);
        setAllInputs(ins.map(i => i.name));
        setMidiStatus(ins.length > 0 ? "ready" : "nodevice");
        ins.forEach(input => {
          input.removeListener();
          input.addListener("midimessage", e => {
            const st = e.data[0], d1 = e.data[1], d2 = e.data[2];
            if ((st >= 144 && st <= 159 && d2 > 0) || (st >= 176 && st <= 191)) {
              const sig = (st >= 144 && st <= 159 ? "note" : "cc") + "-" + d1;
              setMidiFlash(true); setLastSignalUI(sig); setTimeout(() => { setMidiFlash(false); setLastSignalUI(""); }, 1500);
              if (midiLearningRef.current) { localStorage.setItem("midi-" + midiLearningRef.current, sig); setMidiLearning(null); return; }
              if (sig === localStorage.getItem('midi-up')) scrollPage(-1);
              if (sig === localStorage.getItem('midi-down')) scrollPage(1);
            }
          });
        });
      };
      upd(); WebMidi.addListener("connected", upd);
    }).catch(() => setMidiStatus("blocked"));
  };

  const scrollPage = (d) => { if (showScrollRef.current) showScrollRef.current.scrollBy({ top: (window.innerHeight * 0.45) * d, behavior: 'smooth' }); };

  // Função handleImport corrigida para aceitar o modo (song ou setlist)
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
        } else if (targetMode === 'setlists' && d.setlists) {
             for (let sl of d.setlists) {
                await db.setlists.add({ ...sl, id: undefined, creator_id: session.user.id });
             }
        }
        refreshData(); alert("Importado com sucesso!");
      } catch (err) { alert("Erro no arquivo JSON."); }
    };
    reader.readAsText(e.target.files[0]);
  };

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
            <span style={{fontSize:'11px', color:'#007aff', fontWeight:'bold'}}>{session.user.email}</span>
            <button style={{...styles.headerBtn, backgroundColor:'#007aff'}} onClick={handleCloudPush} title="Subir para Nuvem"><Cloud size={14}/> SUBIR</button>
            <button style={{...styles.headerBtn, backgroundColor:'#007aff'}} onClick={handleCloudPull} title="Baixar da Nuvem"><RefreshCw size={14}/> BAIXAR</button>
            <button style={styles.headerBtn} onClick={() => triggerDL({songs, setlists}, "Backup_ShowPad.json")}>BACKUP</button>
            <button onClick={() => setShowSettings(true)} style={styles.infoBtn}><Settings size={22}/></button>
            <button onClick={() => supabase.auth.signOut()} style={styles.logoutBtn} title="Sair"><LogOut size={20}/></button>
        </div>
      </header>

      <div style={{display:'flex', flex: 1, overflow:'hidden'}}>
        <div style={styles.sidebar}>
          <div style={styles.navTabs}>
            <button onClick={() => { setView('library'); setSelectedItem(null); }} style={view === 'library' ? styles.activeTab : styles.tab}>BIBLIOTECA</button>
            <button onClick={() => { setView('setlists'); setSelectedItem(null); }} style={view === 'setlists' ? styles.activeTab : styles.tab}>SHOWS</button>
            <button onClick={() => { setView('garimpo'); setSelectedItem(null); }} style={view === 'garimpo' ? styles.activeTab : styles.tab}>GARIMPAR</button>
            <button onClick={() => { setView('bands'); setSelectedItem(null); }} style={view === 'bands' ? styles.activeTab : styles.tab}>BANDAS</button>
          </div>
          {view === 'library' && (
              <div style={styles.sortBar}>
                  <button onClick={()=>{setSortBy('title');}} style={sortBy==='title'?styles.sortBtnActive:styles.sortBtn}><SortAsc size={12}/> Título</button>
                  <button onClick={()=>{setSortBy('artist');}} style={sortBy==='artist'?styles.sortBtnActive:styles.sortBtn}><UserRound size={12}/> Banda</button>
              </div>
          )}
          <div style={styles.listArea}>
            {['library', 'setlists'].includes(view) ? (view === 'library' ? songs : setlists).map(item => (
              <div key={item.id} style={selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem}>
                <div style={{flex:1, overflow:'hidden', cursor:'pointer'}} onClick={() => setSelectedItem({type: view==='library'?'song':'setlist', data: item})}>
                    <strong style={{color:'#fff'}}>{item.title}</strong>
                    <small style={styles.artistYellow}>{item.artist || item.location || "---"}</small>
                </div>
                <div style={{display:'flex', gap:'6px'}}>
                    <button style={styles.listActionBtnShow} onClick={() => { setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setShowMode(true); }}><Monitor size={16}/></button>
                    <button style={styles.listActionBtnDelete} onClick={async () => { if(confirm("Deseja excluir permanentemente?")) { if(view==='library') await db.songs.delete(item.id); else await db.setlists.delete(item.id); refreshData(); setSelectedItem(null); }}}><Trash2 size={16}/></button>
                </div>
              </div>
            )) : <div style={{padding:'20px', color:'#888', fontSize:'12px', textAlign:'center'}}>Menu Ativo no Painel Central.</div>}
          </div>
          <div style={styles.sidebarFooter}>
            {['library', 'setlists'].includes(view) && <button onClick={async () => { const obj = view==='setlists'?{title:"Novo Show", songs:[], location:"", time:"", members:"", notes:"", creator_id: session.user.id}:{title:"Nova Música", artist:"Artista", content:"", creator_id: session.user.id}; const id = await (view==='setlists'?db.setlists.add(obj):db.songs.add(obj)); refreshData(); setSelectedItem({type:view==='setlists'?'setlist':'song', data: await (view==='setlists'?db.setlists.get(id):db.songs.get(id))}); }} style={styles.addBtn}>+ NOVO {view === 'setlists' ? 'SHOW' : 'MÚSICA'}</button>}
            {['library', 'setlists'].includes(view) && <label style={styles.importBtnLabel}>IMPORTAR {view==='setlists'?'SHOW':'CIFRA'}<input type="file" hidden onChange={(e)=>handleImport(e, view)} /></label>}
          </div>
        </div>

        <div style={styles.mainEditor}>
          {view === 'garimpo' ? <GarimpoView isServerOnline={isServerOnline} styles={styles} refresh={refreshData} session={session} />
          : view === 'bands' ? <BandView session={session} styles={styles} />
          : selectedItem ? <MainEditor key={selectedItem.data.id} item={selectedItem} songs={songs} triggerDL={triggerDL} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} styles={styles} />
          : <div style={styles.empty}>
              <Music size={120} color="#111" />
              <h1 style={{fontSize:'40px', fontWeight:'900', color:'#111', margin:0}}>SHOWPAD PRO</h1>
              <p style={{color:'#222', fontWeight:'bold'}}>Selecione um item na lateral para começar.</p>
            </div>}
        </div>
      </div>
      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={()=>setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} styles={styles} />}
      {showSettings && <SettingsView onClose={()=>setShowSettings(false)} inputs={allInputs} setMidiLearning={setMidiLearning} midiLearning={midiLearning} midiStatus={midiStatus} handleImport={handleImport} styles={styles} />}
    </div>
  );
}