import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import { 
  Plus, Music, Trash2, FileUp, Save, Monitor, Settings, Zap, 
  Loader2, X, ClipboardPaste, SortAsc, UserRound, ChevronLeft, LogOut, Cloud
} from 'lucide-react';

// Importando nossos módulos e lógica
import { db, transposeContent, supabase } from './MusicEngine';
import { MainEditor } from './EditorComponents';
import { ShowModeView } from './ShowModeView';
import { SettingsView } from './SettingsView';
import { AuthView } from './AuthView';

export default function App() {
  // --- ESTADOS DE SESSÃO E DADOS ---
  const [session, setSession] = useState(null);
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // --- ESTADOS DE INTERFACE ---
  const [showMode, setShowMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState('library');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  const [sortBy, setSortBy] = useState('title');

  // --- ESTADOS MIDI E GARIMPO ---
  const [midiStatus, setMidiStatus] = useState("off");
  const [midiFlash, setMidiFlash] = useState(false);
  const [allInputs, setAllInputs] = useState([]);
  const [lastSignalUI, setLastSignalUI] = useState("");
  const [midiLearning, setMidiLearning] = useState(null);
  const [garimpoInput, setGarimpoInput] = useState("");
  const [garimpoQueue, setGarimpoQueue] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState("");
  const [isServerOnline, setIsServerOnline] = useState(false);

  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

  // --- 1. MONITOR DE LOGIN (SUPABASE) ---
  useEffect(() => {
    // Pega a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. SINCRONIZAÇÃO E CARREGAMENTO ---
  useEffect(() => { 
    if (session) {
      refreshData(); 
      initMidi();
      checkServer();
    }
  }, [session, sortBy]);

  const refreshData = async () => { 
    let s = await db.songs.toArray();
    const sl = await db.setlists.toArray();
    s.sort((a,b) => (sortBy === 'artist' ? (a.artist||"").localeCompare(b.artist||"") : a.title.localeCompare(b.title)));
    setSongs(s); 
    setSetlists(sl); 
    
    // Se algo estiver selecionado, mantém atualizado
    if (selectedItem) {
        const item = selectedItem.type === 'song' ? s.find(x => x.id === selectedItem.data.id) : sl.find(x => x.id === selectedItem.data.id);
        if (item) setSelectedItem({type: selectedItem.type, data: item});
    }
  };

  const checkServer = () => {
    fetch('http://localhost:3001/ping')
      .then(r => setIsServerOnline(r.ok))
      .catch(() => setIsServerOnline(false));
  };

  // --- 3. LÓGICA MIDI ---
  const initMidi = () => {
    WebMidi.enable({ sysex: true }).then(() => {
      const upd = () => {
        const ins = WebMidi.inputs.filter(i => !i.name.includes("IAC"));
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
  
  const triggerDL = (d, f) => { 
    const u = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })); 
    const l = document.createElement('a'); l.href = u; l.download = f; l.click(); 
  };

  const handleImport = (e) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.songs) {
          for (let s of d.songs) {
            if (!(await db.songs.where({title: s.title, artist: s.artist}).first())) {
              await db.songs.add({ ...s, id: undefined, creator_id: session.user.id });
            }
          }
        }
        refreshData(); alert("Importado!");
      } catch (err) { alert("Erro no JSON"); }
    };
    reader.readAsText(e.target.files[0]);
  };

  // --- SE NÃO ESTIVER LOGADO, MOSTRA TELA DE LOGIN ---
  if (!session) return <AuthView styles={styles} />;

  // --- INTERFACE PRINCIPAL ---
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
            <span style={{fontSize:'10px', color:'#666'}}>{session.user.email}</span>
            <button style={styles.headerBtn} onClick={() => triggerDL({songs, setlists}, "Backup.json")}><Save size={14}/> BACKUP</button>
            <button onClick={() => setShowSettings(true)} style={styles.infoBtn}><Settings size={22}/></button>
            <button onClick={() => supabase.auth.signOut()} style={styles.logoutBtn}><LogOut size={18}/></button>
        </div>
      </header>

      <div style={{display:'flex', flex: 1, overflow:'hidden'}}>
        <div style={styles.sidebar}>
          <div style={styles.navTabs}>
            <button onClick={() => setView('library')} style={view === 'library' ? styles.activeTab : styles.tab}>BIBLIOTECA</button>
            <button onClick={() => setView('setlists')} style={view === 'setlists' ? styles.activeTab : styles.tab}>SHOWS</button>
            <button onClick={() => setView('garimpo')} style={view === 'garimpo' ? styles.activeTab : styles.tab}>GARIMPAR</button>
          </div>
          {view === 'library' && (
              <div style={styles.sortBar}>
                  <button onClick={()=>setSortBy('title')} style={sortBy==='title'?styles.sortBtnActive:styles.sortBtn}><SortAsc size={12}/> Título</button>
                  <button onClick={()=>setSortBy('artist')} style={sortBy==='artist'?styles.sortBtnActive:styles.sortBtn}><UserRound size={12}/> Banda</button>
              </div>
          )}
          <div style={styles.listArea}>
            {(view === 'library' ? songs : (view === 'setlists' ? setlists : [])).map(item => (
              <div key={item.id} style={selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem}>
                <div style={{flex:1, overflow:'hidden'}} onClick={() => setSelectedItem({type: view==='library'?'song':'setlist', data: item})}>
                    <strong style={{color:'#fff'}}>{item.title}</strong>
                    <small style={{display:'block', opacity:0.5, color:'#aaa'}}>{item.artist || item.location || "---"}</small>
                </div>
                <div style={{display:'flex', gap:'6px'}}>
                    <button style={styles.listActionBtnShow} onClick={() => { setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setShowMode(true); }}><Monitor size={16}/></button>
                    <button style={styles.listActionBtnDelete} onClick={async () => { if(confirm("Excluir?")) { if(view==='library') await db.songs.delete(item.id); else await db.setlists.delete(item.id); refreshData(); setSelectedItem(null); }}}><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.sidebarFooter}>
            {view !== 'garimpo' && <button onClick={async () => { 
                const obj = view==='library'?{title:"Nova Música", artist:"Artista", content:"", creator_id: session.user.id}:{title:"Novo Show", songs:[], location:"", time:"", members:"", notes:"", creator_id: session.user.id}; 
                const id = await (view==='library'?db.songs.add(obj):db.setlists.add(obj)); 
                refreshData(); setSelectedItem({type:view==='library'?'song':'setlist', data: await (view==='library'?db.songs.get(id):db.setlists.get(id))}); 
            }} style={styles.addBtn}>+ NOVO</button>}
          </div>
        </div>

        <div style={styles.mainEditor}>
          {view === 'garimpo' ? (
            <div style={styles.garimpoPanel}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h2 style={{color:'#fff'}}>Garimpar</h2><div style={isServerOnline ? styles.serverLedOn : styles.serverLedOff}><div style={styles.ledDot}></div>{isServerOnline ? "MAC OK" : "MAC OFF"}</div></div>
              <div style={styles.inputRow}><input style={styles.inputField} placeholder="Link CifraClub..." value={garimpoInput} onChange={e=>setGarimpoInput(e.target.value)} /><button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button></div>
              <div style={styles.scrollList}>{garimpoQueue.map((u,i)=>(<div key={i} style={styles.miniItemGarimpo}><span>{u.split('/').pop()}</span><X size={14} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))} style={{cursor:'pointer', color:'#ff3b30'}}/></div>))}</div>
              <button style={styles.processBtn} onClick={async () => {
                setIsScraping(true); setScrapingStatus("Extraindo...");
                for (let k=0; k<garimpoQueue.length; k++) {
                  try {
                    const r = await fetch('http://localhost:3001/scrape', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url: garimpoQueue[k]}) });
                    const s = await r.json(); if(s.title && !(await db.songs.where({title:s.title, artist:s.artist}).first())) await db.songs.add({...s, notes:"", creator_id: session.user.id});
                  } catch (e) {}
                }
                setIsScraping(false); setScrapingStatus("✅ Concluído!"); setGarimpoQueue([]); refreshData();
              }} disabled={isScraping || garimpoQueue.length===0 || !isServerOnline}>Salvar na Biblioteca</button>
              <div style={styles.statusText}>{scrapingStatus}</div>
            </div>
          ) : selectedItem ? (
            <MainEditor key={selectedItem.data.id} item={selectedItem} songs={songs} triggerDL={triggerDL} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} styles={styles} />
          ) : <div style={styles.empty}><Music size={80} color="#222" /><h2>ShowPad Pro</h2><p style={{color:'#444'}}>Logado como {session.user.email}</p></div>}
        </div>
      </div>

      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={()=>setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} styles={styles} />}
      {showSettings && <SettingsView onClose={()=>setShowSettings(false)} inputs={allInputs} setMidiLearning={setMidiLearning} midiLearning={midiLearning} midiStatus={midiStatus} handleImport={handleImport} styles={styles} />}
    </div>
  );
}

// --- ESTILOS GLOBAIS ---
const styles = {
    appContainer: { display: 'flex', flexDirection:'column', height: '100vh', backgroundColor: '#1c1c1e', color: '#fff', overflow:'hidden', fontFamily: 'sans-serif' },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', borderBottom:'1px solid #333' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border:'none' },
    midiBadgeOn: { fontSize:'9px', color:'#34c759', border:'1px solid #34c759', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeActive: { fontSize:'9px', color:'#000', backgroundColor:'yellow', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeOff: { fontSize:'9px', color:'#666', border:'1px solid #333', padding:'2px 6px', borderRadius:'4px' },
    midiProbeFloating: { position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', color: 'yellow', fontSize: '9px', fontWeight: 'bold' },
    infoBtn: { background:'none', border:'none', color:'#888', cursor:'pointer' },
    logoutBtn: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer', marginLeft:'10px' },
    sidebar: { width: '280px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#2c2c2e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333' },
    tab: { flex: 1, padding: '12px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'11px' },
    activeTab: { flex: 1, padding: '12px', border: 'none', background: '#3a3a3c', color: '#fff', borderBottom: '2px solid #007aff' },
    sortBar: { padding: '10px', backgroundColor:'#1a1a1a', display:'flex', gap:'10px', alignItems:'center', fontSize:'11px' },
    sortBtn: { padding:'4px 8px', background:'#333', border:'none', color:'#aaa', borderRadius:'4px', display:'flex', alignItems:'center', gap:'4px' },
    sortBtnActive: { padding:'4px 8px', background:'#007aff', border:'none', color:'#fff', borderRadius:'4px', display:'flex', alignItems:'center', gap:'4px' },
    listArea: { flex: 1, overflowY: 'auto' },
    listItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px' },
    selectedItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px' },
    listActionBtnShow: { background:'none', border:'none', color:'#007aff', cursor:'pointer', padding:'5px' },
    listActionBtnDelete: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer', padding:'5px' },
    sidebarFooter: { padding: '15px', display: 'flex', gap: '8px', borderTop: '1px solid #333', flexWrap: 'wrap' },
    addBtn: { flex: 1, padding: '10px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { flex: 1, padding: '10px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center' },
    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor:'#1c1c1e' },
    editorContent: { display: 'flex', flexDirection: 'column', height: '100%' },
    editorHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2c2e' },
    hInput: { fontSize: '20px', background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', outline:'none', width:'100%' },
    artistInput: { fontSize: '14px', background: 'none', border: 'none', color: '#888', outline:'none', width:'100%' },
    btnGroup: { display: 'flex', gap: '6px' },
    showBtn: { padding: '8px 12px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer' },
    saveBtn: { padding: '8px 12px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontSize:'12px', cursor:'pointer' },
    transpBtn: { padding: '6px 10px', border: '1px solid #555', borderRadius: '5px', background: 'none', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    exportBtn: { padding: '6px 10px', backgroundColor: '#444', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    mainTextArea: { flex: 1, background: '#1c1c1e', color: '#fff', border: 'none', padding: '20px', fontSize: '17px', fontFamily: 'monospace', outline: 'none', resize: 'none' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '60px' },
    showControls: { display: 'flex', gap: '15px', alignItems:'center' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000', color:'#fff' },
    backBtn: { background:'none', border:'none', color:'#fff', display:'flex', alignItems:'center', cursor:'pointer' },
    wizard: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:4000 },
    wizardCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '20px', textAlign: 'center', maxWidth: '320px', color:'#333', display:'flex', flexDirection:'column', gap:'10px' },
    settingsCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '500px', color:'#333', display:'flex', flexDirection:'column' },
    settingsSection: { textAlign:'left', marginBottom:'20px', padding:'15px', backgroundColor:'#f9f9f9', borderRadius:'15px' },
    learnBtn: { flex:1, padding:'12px', backgroundColor:'#007aff', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', cursor:'pointer' },
    learnBtnActive: { flex:1, padding:'12px', backgroundColor:'#ff3b30', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', cursor:'pointer' },
    importFullBtn: { display:'block', width:'100%', padding:'12px', backgroundColor:'#34c759', color:'#fff', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', textAlign:'center', cursor:'pointer' },
    primaryButton: { marginTop: '10px', width: '100%', padding: '15px', backgroundColor: '#1c1c1e', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor:'pointer' },
    serverLedOn: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#34c759', fontWeight: 'bold' },
    serverLedOff: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' },
    ledDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor', boxShadow: '0 0 10px currentColor' },
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1c1c1e', color: '#fff' },
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    inputField: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2c2c2e', color: '#fff' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    miniItemGarimpo: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'12px', color:'#fff' },
    processBtn: { padding: '15px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },
    statusText: { marginTop: '10px', color: '#007aff', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#fff' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    miniItem: { padding: '10px', borderBottom: '1px solid #333', cursor: 'pointer', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' },
    empty: { flex: 1, display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: '#333' },
    showDrawer: { position:'absolute', top:0, left:0, width:'250px', height:'100%', backgroundColor:'#1c1c1e', zIndex:3000, borderRight:'1px solid #333', padding:'20px', boxShadow:'20px 0 50px rgba(0,0,0,0.8)', display:'flex', flexDirection:'column' },
    drawerHeader: { fontSize:'18px', fontWeight:'bold', marginBottom:'20px', display:'flex', justifyContent:'space-between', color:'#007aff' },
    drawerItem: { padding:'12px', borderBottom:'1px solid #333', cursor:'pointer', fontSize:'14px' },
    drawerItemActive: { padding:'12px', borderBottom:'1px solid #333', cursor:'pointer', fontSize:'14px', backgroundColor:'#007aff22', color:'#007aff', fontWeight:'bold' },
    pageActions: { padding:'50px 0', display:'flex', flexDirection:'column', gap:'20px' },
    pageBtn: { padding:'20px', backgroundColor:'#222', border:'1px solid #444', color:'#fff', borderRadius:'10px', fontSize:'16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
    pageBtnNext: { padding:'25px', backgroundColor:'#007aff22', border:'1px solid #007aff', color:'#fff', borderRadius:'10px', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontWeight:'bold', cursor:'pointer' },
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow:'hidden' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '10px', border: '1px solid #333', borderRadius: '10px' },
    showMetaData: { padding: '15px 20px', backgroundColor: '#2c2c2e', display: 'flex', flexDirection: 'column', gap: '8px' },
    metaRow: { display: 'flex', gap: '10px' },
    metaInput: { flex: 1, background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputSmall: { width: '80px', background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputWide: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaTextArea: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px', resize: 'none', height: '60px' }
};