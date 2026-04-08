import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import { 
  Plus, Music, Trash2, Save, Monitor, Settings, Zap, 
  LogOut, SortAsc, UserRound, Cloud, RefreshCw, User
} from 'lucide-react';

import { db, transposeContent, supabase, triggerDL, pushToCloud, pullFromCloud } from './ShowPadCore';
import { MainEditor } from './EditorComponents';
import { ShowModeView } from './ShowModeView';
import { SettingsView } from './SettingsView';
import { AuthView } from './AuthView';
import { BandView } from './BandView';
import { GarimpoView } from './GarimpoView';
import { styles } from './Styles';

export default function App() {
  const [session, setSession] = useState(null);
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [bands, setBands] = useState([]); 
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
  const [isScraping, setIsScraping] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);

  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

  // PEGAR NOME DO USUÁRIO (Google ou Email)
  const getUserDisplayName = () => {
    if (!session?.user) return "Usuário";
    const meta = session.user.user_metadata;
    return meta?.full_name || meta?.name || session.user.email.split('@')[0];
  };

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then((res) => { if (res.data) setSession(res.data.session); });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        if (!s) {
          // Limpa tudo ao deslogar
          setSongs([]);
          setSetlists([]);
          setBands([]);
          setSelectedItem(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const checkSoloBandV3 = async (user) => {
    if (!user) return;
    const existing = await db.my_bands.where('invite_code').equals('SOLO_V3').first();
    if (!existing) {
        const soloName = `${getUserDisplayName().toUpperCase()} - SOLO`;
        try {
            const { data: newBand, error: bErr } = await supabase.from('bands').insert([{ 
                name: soloName, 
                invite_code: 'SOLO_V3', 
                owner_id: user.id 
            }]).select().single();
            if (bErr) throw bErr;
            const { error: mErr } = await supabase.from('band_members').insert([{ 
                band_id: newBand.id, 
                profile_id: user.id, 
                role: 'admin' 
            }]);
            if (mErr) throw mErr;
            const soloData = { ...newBand, role: 'admin', is_solo: true };
            await db.my_bands.put(soloData);
            refreshData();
        } catch(e) { console.error("❌ Erro na Solo V3:", e.message); }
    }
  };

  useEffect(() => { 
    if (session) { 
        checkSoloBandV3(session.user);
        refreshData(); 
        initMidi(); 
        checkServer(); 
    }
  }, [session, sortBy]);

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);

  const refreshData = async () => { 
    if (!session) return;
    try {
        const s = await db.songs.toArray();
        const sl = await db.setlists.toArray();
        
        // SEGREGAR BANDAS: Apenas as que o usuário logado participa
        const allBands = await db.my_bands.toArray(); 
        const filteredBands = allBands.filter(b => b.owner_id === session.user.id || b.role);

        s.sort((a,b) => {
            const valA = (sortBy === 'artist' ? a.artist : a.title) || "";
            const valB = (sortBy === 'artist' ? b.artist : b.title) || "";
            return valA.toLowerCase().localeCompare(valB.toLowerCase());
        });
        
        setSongs(s); 
        setSetlists(sl);
        setBands(filteredBands); 

        if (selectedItem) {
            const id = selectedItem.data.id;
            const upd = (selectedItem.type === 'song') ? s.find(x => x.id === id) : sl.find(x => x.id === id);
            if (upd) setSelectedItem({type: selectedItem.type, data: upd});
        }
    } catch (e) { console.error("Erro ao atualizar dados:", e); }
  };

  const handleCreateNew = async () => {
    const isSetlist = view === 'setlists';
    const obj = isSetlist ? {
      title: "Novo Show",
      songs: [],
      location: "",
      time: "",
      members: "",
      notes: "",
      creator_id: session.user.id
    } : {
      title: "Nova Música",
      artist: "Artista",
      content: "",
      creator_id: session.user.id,
      bpm: 120
    };
    const id = await (isSetlist ? db.setlists.add(obj) : db.songs.add(obj));
    await refreshData();
    const savedItem = await (isSetlist ? db.setlists.get(id) : db.songs.get(id));
    setSelectedItem({ type: isSetlist ? 'setlist' : 'song', data: savedItem });
  };

  const openBandShow = (show) => {
    setSelectedItem({ type: 'setlist', data: show });
    setView('setlists'); 
  };

  const checkServer = () => {
    if (window.location.hostname === "localhost") {
      fetch('http://localhost:3001/ping').then(r => setIsServerOnline(r.ok)).catch(() => setIsServerOnline(false));
    } else { setIsServerOnline(false); }
  };

  const handleCloudPush = async () => {
    if (!session) return;
    setIsScraping(true);
    try { await pushToCloud(session.user.id); alert("Backup salvo!"); } catch (e) { alert("Erro: " + e.message); }
    setIsScraping(false);
  };

  const handleCloudPull = async () => {
    if (!session) return;
    setIsScraping(true);
    try { await pullFromCloud(session.user.id); await refreshData(); alert("Sincronizado!"); } catch (e) { alert("Erro: " + e.message); }
    setIsScraping(false);
  };

  const initMidi = () => {
    setTimeout(() => {
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
                setMidiFlash(true); setLastSignalUI(sig); 
                setTimeout(() => { setMidiFlash(false); setLastSignalUI(""); }, 1000);
                if (midiLearningRef.current) { localStorage.setItem("midi-" + midiLearningRef.current, sig); setMidiLearning(null); return; }
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
    }, 500);
  };

  const scrollPage = (d) => { if (showScrollRef.current) showScrollRef.current.scrollBy({ top: (window.innerHeight * 0.45) * d, behavior: 'smooth' }); };

  const handleImport = (e, targetMode) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (targetMode === 'library' && d.songs) {
          for (let s of d.songs) { if (!(await db.songs.where({title: s.title, artist: s.artist}).first())) await db.songs.add({ ...s, id: undefined, creator_id: session.user.id }); }
        } else if (targetMode === 'setlists' && d.setlists) {
             for (let sl of d.setlists) await db.setlists.add({ ...sl, id: undefined, creator_id: session.user.id });
        }
        refreshData(); alert("Importado!");
      } catch (err) { alert("Erro JSON."); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const getMidiStyle = () => {
    const isReady = midiStatus === 'ready';
    return {
      display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px',
      fontSize: '10px', fontWeight: '800', transition: 'all 0.3s ease', cursor: 'default',
      boxShadow: midiFlash ? '0 0 15px #4cd964' : 'inset 0 -2px 4px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
      background: isReady ? 'radial-gradient(circle at 30% 30%, #4cd964, #28a745)' : 'radial-gradient(circle at 30% 30%, #8e8e93, #3a3a3c)',
      color: '#fff', transform: midiFlash ? 'scale(1.1)' : 'scale(1)'
    };
  };

  if (!session) return <AuthView styles={styles} />;

  return (
    <div style={styles.appContainer}>
      <header style={styles.mainHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <Music color="#007aff" />
          <h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
          
          <div style={getMidiStyle()}>
            <Zap size={10} fill={midiStatus === 'ready' ? "#fff" : "none"}/> 
            {midiStatus === 'ready' ? "MIDI OK" : "MIDI OFF"}
          </div>
        </div>

        {/* HEADER DIREITO: USUÁRIO E AÇÕES */}
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', backgroundColor:'rgba(255,255,255,0.05)', padding:'5px 12px', borderRadius:'15px', border:'1px solid rgba(255,255,255,0.1)'}}>
              <User size={14} color="#007aff" />
              <span style={{fontSize:'12px', fontWeight:'600', color:'#fff'}}>{getUserDisplayName()}</span>
            </div>

            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <button title="Backup na Nuvem" style={styles.headerBtn} onClick={handleCloudPush}><Cloud size={14}/></button>
              <button title="Sincronizar Nuvem" style={styles.headerBtn} onClick={handleCloudPull}><RefreshCw size={14}/></button>
              <button onClick={() => setShowSettings(true)} style={{background:'none', border:'none', cursor:'pointer', color:'#fff', padding:'5px'}}><Settings size={20}/></button>
              <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', cursor:'pointer', color:'#ff3b30', padding:'5px'}}><LogOut size={20}/></button>
            </div>
        </div>
      </header>

      <div style={{ display:'flex', flex: 1, overflow:'hidden', width: '100%' }}>
        <div style={styles.sidebar}>
          <div style={styles.navTabs}>
            <button onClick={() => setView('library')} style={view === 'library' ? styles.activeTab : styles.tab}>MÚSICAS</button>
            <button onClick={() => setView('setlists')} style={view === 'setlists' ? styles.activeTab : styles.tab}>SHOWS</button>
            <button onClick={() => setView('bands')} style={view === 'bands' ? styles.activeTab : styles.tab}>BANDAS</button>
            <button onClick={() => setView('garimpo')} style={view === 'garimpo' ? styles.activeTab : styles.tab}>GARIMPAR</button>
          </div>

          <div style={styles.listArea}>
            {['library', 'setlists'].includes(view) ? (view === 'library' ? songs : setlists).map(item => {
              const band = item.band_id ? bands.find(b => b.id === item.band_id) : null;
              return (
                <div key={item.id} style={selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem}
                     onClick={() => setSelectedItem({type: view==='library'?'song':'setlist', data: item})}>
                  <div style={{flex:1, overflow:'hidden'}}>
                      <strong style={{color:'#fff', display:'block'}}>{item.title}</strong>
                      {band && <span style={styles.bandTagOrange}>{band.name}</span>}
                      <small style={styles.artistYellow}>{item.artist || item.location || "---"}</small>
                  </div>
                  <div style={{display:'flex', gap:'6px'}}>
                      <div style={{cursor:'pointer'}} onClick={(e) => { e.stopPropagation(); setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setShowMode(true); }}><Monitor size={20} color="#007aff"/></div>
                      <div style={{cursor:'pointer'}} onClick={async (e) => { e.stopPropagation(); if(confirm("Excluir?")) { if(view==='library') await db.songs.delete(item.id); else await db.setlists.delete(item.id); refreshData(); setSelectedItem(null); }}}><Trash2 size={20} color="#444"/></div>
                  </div>
                </div>
              )
            }) : <div style={{padding:'20px', color:'#888', fontSize:'11px', textAlign:'center'}}>Selecione uma opção no menu lateral.</div>}
          </div>

          <div style={styles.sidebarFooter}>
            {['library', 'setlists'].includes(view) && (
              <button onClick={handleCreateNew} style={styles.addBtn}>+ NOVO</button>
            )}
          </div>
        </div>

        <div style={styles.mainEditor}>
          {view === 'garimpo' ? <GarimpoView isServerOnline={isServerOnline} styles={styles} refresh={refreshData} session={session} />
          : view === 'bands' ? <BandView session={session} styles={styles} onSelectShow={openBandShow} />
          : selectedItem ? <MainEditor key={selectedItem.data.id} item={selectedItem} songs={songs} bands={bands} triggerDL={triggerDL} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} styles={styles} />
          : <div style={styles.empty}>
              <Music size={120} color="#111" />
              <h1 style={{fontSize:'40px', fontWeight:'900', color:'#111', margin:0}}>SHOWPAD PRO</h1>
              <p style={{color:'#333', fontWeight:'bold'}}>Selecione uma música ou show.</p>
            </div>}
        </div>
      </div>

      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={()=>setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} styles={styles} midiStatus={midiStatus} />}
      {showSettings && <SettingsView onClose={()=>setShowSettings(false)} inputs={allInputs} setMidiLearning={setMidiLearning} midiLearning={midiLearning} midiStatus={midiStatus} handleImport={handleImport} styles={styles} />}
    </div>
  );
}