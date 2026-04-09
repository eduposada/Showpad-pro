import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import { 
  Plus, Music, Trash2, Save, Monitor, Settings, Zap, 
  LogOut, SortAsc, UserRound, Cloud, RefreshCw, User,
  CloudUpload, CloudDownload, Search, Filter, UserCircle
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

  // v7.2: Novos estados para Busca e Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [artistFilter, setArtistFilter] = useState("all");

  const [midiStatus, setMidiStatus] = useState("off");
  const [midiFlash, setMidiFlash] = useState(false);
  const [allInputs, setAllInputs] = useState([]);
  const [lastSignalUI, setLastSignalUI] = useState("");
  const [midiLearning, setMidiLearning] = useState(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);

  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

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
          setSongs([]);
          setSetlists([]);
          setBands([]);
          setSelectedItem(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const checkSoloBandV4 = async (user) => {
    if (!user || !supabase) return;
    const soloUniqueCode = `SOLO-${user.id.substring(0, 5).toUpperCase()}`;
    try {
        const { data: cloudSolo, error: searchErr } = await supabase
            .from('bands')
            .select('*')
            .eq('owner_id', user.id)
            .eq('is_solo', true)
            .maybeSingle();

        if (searchErr) throw searchErr;

        if (cloudSolo) {
            const soloData = { ...cloudSolo, role: 'admin', is_solo: true };
            await db.my_bands.put(soloData);
        } else {
            const soloName = `${getUserDisplayName().toUpperCase()} (SOLO)`;
            const { data: newBand, error: bErr } = await supabase.from('bands').insert([{ 
                name: soloName, 
                invite_code: soloUniqueCode, 
                owner_id: user.id,
                is_solo: true 
            }]).select().single();

            if (bErr) throw bErr;
            await supabase.from('band_members').insert([{ band_id: newBand.id, profile_id: user.id, role: 'admin' }]);
            const soloData = { ...newBand, role: 'admin', is_solo: true };
            await db.my_bands.put(soloData);
        }
        await refreshData();
    } catch(e) { console.error("Falha no nascimento:", e.message); }
  };

  useEffect(() => { 
    if (session) { 
        checkSoloBandV4(session.user);
        refreshData(); 
        initMidi(); 
        checkServer(); 
    }
  }, [session, sortBy, searchTerm, artistFilter]); // v7.2: Recarrega ao filtrar

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);

  const refreshData = async () => { 
    if (!session) return;
    try {
        let s = await db.songs.toArray();
        const sl = await db.setlists.toArray();
        const allBands = await db.my_bands.toArray(); 
        const filteredBands = allBands.filter(b => b.owner_id === session.user.id || b.role);

        // v7.2: Lógica de Filtro e Busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            s = s.filter(x => 
                x.title.toLowerCase().includes(term) || 
                (x.artist && x.artist.toLowerCase().includes(term))
            );
        }
        if (artistFilter !== "all") {
            s = s.filter(x => x.artist === artistFilter);
        }

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
      title: "Novo Show", songs: [], location: "", time: "", members: "", notes: "", creator_id: session.user.id
    } : {
      title: "Nova Música", artist: "Artista", content: "", creator_id: session.user.id, bpm: 120
    };
    const id = await (isSetlist ? db.setlists.add(obj) : db.songs.add(obj));
    await refreshData();
    const savedItem = await (isSetlist ? db.setlists.get(id) : db.songs.get(id));
    setSelectedItem({ type: isSetlist ? 'setlist' : 'song', data: savedItem });
  };

  const openBandShow = (item) => {
    setSelectedItem(item);
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
    try { await pushToCloud(session.user.id); alert("Backup enviado com sucesso!"); } catch (e) { alert("Erro: " + e.message); }
    setIsScraping(false);
  };

  const handleCloudPull = async () => {
    if (!session) return;
    setIsScraping(true);
    try { await pullFromCloud(session.user.id); await refreshData(); alert("Sincronização concluída!"); } catch (e) { alert("Erro: " + e.message); }
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

  // v7.2: Lista de artistas únicos para o filtro
  const uniqueArtists = Array.from(new Set(songs.map(s => s.artist).filter(Boolean))).sort();

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

        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', backgroundColor:'rgba(255,255,255,0.05)', padding:'5px 12px', borderRadius:'15px', border:'1px solid rgba(255,255,255,0.1)'}}>
              <UserCircle size={14} color="#007aff" />
              <span style={{fontSize:'12px', fontWeight:'600', color:'#fff'}}>{getUserDisplayName()}</span>
            </div>

            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <button title="Backup" style={{...styles.headerBtn, color:'#4cd964', borderColor:'#4cd96466'}} onClick={handleCloudPush}><CloudUpload size={16}/></button>
              <button title="Sync" style={{...styles.headerBtn, color:'#007aff', borderColor:'#007aff66'}} onClick={handleCloudPull}><CloudDownload size={16}/></button>
              <button onClick={() => setShowSettings(true)} style={{background:'none', border:'none', cursor:'pointer', color:'#fff'}}><Settings size={20}/></button>
              <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', cursor:'pointer', color:'#ff3b30'}}><LogOut size={20}/></button>
            </div>
        </div>
      </header>

      <div style={{ display:'flex', flex: 1, overflow:'hidden', width: '100%' }}>
        <div style={{...styles.sidebar, background: '#000', borderRight: '1px solid #1c1c1e'}}>
          <div style={styles.navTabs}>
            <button onClick={() => setView('library')} style={view === 'library' ? styles.activeTab : styles.tab}>LIBRARY</button>
            <button onClick={() => setView('setlists')} style={view === 'setlists' ? styles.activeTab : styles.tab}>SHOWS</button>
            <button onClick={() => setView('bands')} style={view === 'bands' ? styles.activeTab : styles.tab}>BANDS</button>
            <button onClick={() => setView('garimpo')} style={view === 'garimpo' ? styles.activeTab : styles.tab}>GARIMPO</button>
          </div>

          {/* v7.2: Painel de Busca e Filtros na Sidebar */}
          {['library', 'setlists'].includes(view) && (
            <div style={{padding: '15px', borderBottom: '1px solid #1c1c1e', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <Search size={14} color="#666" style={{position: 'absolute', left: '10px'}} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar música ou artista..." 
                  style={{...styles.inputField, paddingLeft: '30px', margin: 0, height: '35px', fontSize: '12px', background: '#1c1c1e'}}
                />
              </div>
              
              <div style={{display: 'flex', gap: '8px'}}>
                <select 
                  value={artistFilter}
                  onChange={(e) => setArtistFilter(e.target.value)}
                  style={{...styles.inputField, flex: 1, margin: 0, height: '35px', fontSize: '11px', background: '#1c1c1e', cursor: 'pointer'}}
                >
                  <option value="all">TODOS ARTISTAS</option>
                  {uniqueArtists.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                </select>
                
                <button 
                  onClick={() => {
                    const next = sortBy === 'title' ? 'artist' : 'title';
                    setSortBy(next);
                    localStorage.setItem('sortBy', next);
                  }}
                  style={{...styles.headerBtn, padding: '0 10px', backgroundColor: '#1c1c1e'}}
                >
                  <SortAsc size={16} color={sortBy === 'artist' ? "#007aff" : "#fff"} />
                </button>
              </div>
            </div>
          )}

          <div style={styles.listArea}>
            {['library', 'setlists'].includes(view) ? (view === 'library' ? songs : setlists).map(item => {
              const band = item.band_id ? bands.find(b => b.id === item.band_id) : null;
              return (
                <div key={item.id} style={{
                    ...(selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem),
                    borderLeft: selectedItem && selectedItem.data.id === item.id ? '4px solid #007aff' : '4px solid transparent',
                    background: selectedItem && selectedItem.data.id === item.id ? '#1c1c1e' : 'transparent'
                }}
                     onClick={() => setSelectedItem({type: view==='library'?'song':'setlist', data: item})}>
                  <div style={{flex:1, overflow:'hidden'}}>
                      <strong style={{color: selectedItem && selectedItem.data.id === item.id ? '#007aff' : '#fff', display:'block', fontSize: '14px'}}>{item.title}</strong>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                        <small style={{color: '#FFD700', fontWeight: 'bold', fontSize: '10px'}}>{item.artist || "DESCONHECIDO"}</small>
                        {band && <span style={{...styles.bandTagOrange, fontSize: '9px', padding: '1px 5px'}}>{band.name}</span>}
                      </div>
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedItem({type: view==='library'?'song':'setlist', data: item}); setShowMode(true); }} style={{background: 'none', border: 'none', cursor: 'pointer'}}><Monitor size={18} color="#007aff"/></button>
                      <button onClick={async (e) => { e.stopPropagation(); if(confirm("Excluir?")) { if(view==='library') await db.songs.delete(item.id); else await db.setlists.delete(item.id); refreshData(); setSelectedItem(null); }}} style={{background: 'none', border: 'none', cursor: 'pointer'}}><Trash2 size={18} color="#444"/></button>
                  </div>
                </div>
              )
            }) : <div style={{padding:'20px', color:'#888', fontSize:'11px', textAlign:'center', marginTop: '50px'}}>
                  <Music size={40} style={{opacity: 0.1, marginBottom: '10px'}} />
                  <p>MENU ATIVO</p>
                </div>}
          </div>

          <div style={styles.sidebarFooter}>
            {['library', 'setlists'].includes(view) && (
              <button onClick={handleCreateNew} style={{...styles.addBtn, background: '#007aff', width: '100%', borderRadius: '12px'}}>+ NOVO</button>
            )}
          </div>
        </div>

        <div style={{...styles.mainEditor, background: '#000'}}>
          {view === 'garimpo' ? <GarimpoView isServerOnline={isServerOnline} styles={styles} refresh={refreshData} session={session} />
          : view === 'bands' ? <BandView session={session} styles={styles} onSelectShow={openBandShow} />
          : selectedItem ? <MainEditor key={selectedItem.data.id} item={selectedItem} songs={songs} bands={bands} triggerDL={triggerDL} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} styles={styles} />
          : <div style={styles.empty}>
              <Music size={120} color="#0a0a0a" />
              <h1 style={{fontSize:'40px', fontWeight:'900', color:'#111', margin:0}}>SHOWPAD PRO</h1>
              <p style={{color:'#111', fontWeight:'bold'}}>Selecione para editar.</p>
            </div>}
        </div>
      </div>

      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={()=>setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} styles={styles} midiStatus={midiStatus} />}
      {showSettings && <SettingsView onClose={()=>setShowSettings(false)} inputs={allInputs} setMidiLearning={setMidiLearning} midiLearning={midiLearning} midiStatus={midiStatus} handleImport={handleImport} styles={styles} />}
    </div>
  );
}