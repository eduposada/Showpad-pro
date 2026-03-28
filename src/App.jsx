import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import Dexie from 'dexie';
import { 
  Plus, Music, Play, Trash2, ChevronLeft, FileUp, ChevronUp, ChevronDown, 
  Type, ListMusic, CheckCircle2, X, RefreshCw, Piano, Info, Activity, Zap, Monitor, Menu, ChevronRight, Download, Save, ClipboardPaste, Loader2, Database, Settings, Share2, ArrowUp, ArrowDown, XCircle
} from 'lucide-react';

const db = new Dexie('ShowPadProWeb');
db.version(11).stores({ songs: '++id, title, artist', setlists: '++id, title, location, time, members, notes' });

const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const chordRegex = /([A-G][#b]?(?:m|maj|dim|sus|aug|add|alt|[0-9])*(?:\/[A-G][#b]?)?)/g;

const shiftNote = (n, s) => {
    const f = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
    const rM = n.match(/^[A-G][#b]?/); if (!rM) return n;
    const r = rM[0], suf = n.substring(r.length), norm = f[r] || r;
    let idx = scale.indexOf(norm.toUpperCase()); if (idx === -1) return n;
    let newIdx = (idx + s) % 12; if (newIdx < 0) newIdx += 12;
    return scale[newIdx] + suf;
};

const transposeContent = (c, s) => {
  if (!c) return "";
  return c.split('\n').map(l => {
    if (l.toLowerCase().indexOf("tom") !== -1) return l.replace(/([A-G][#b]?)/g, (m) => shiftNote(m, s));
    const m = l.match(chordRegex);
    if (m && m.length >= l.trim().split(/\s+/).length * 0.4) return l.replace(chordRegex, (match) => shiftNote(match, s));
    return l;
  }).join('\n');
};

const formatChordsVisual = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const m = line.match(chordRegex);
        const isC = m && m.length > 0 && m.length >= line.trim().split(/\s+/).length * 0.4;
        return (
            <div key={i} style={{ color: isC ? '#FFD700' : '#FFFFFF', fontWeight: isC ? 'bold' : 'normal', minHeight: '1.2em', whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.8' }}>{line || ' '}</div>
        );
    });
};

export default function App() {
  const [songs, setSongs] = useState([]), [setlists, setSetlists] = useState([]), [selectedItem, setSelectedItem] = useState(null);
  const [showMode, setShowMode] = useState(false), [showSettings, setShowSettings] = useState(false), [view, setView] = useState('library');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  
  const [midiStatus, setMidiStatus] = useState("disconnected"); // disconnected, ready, blocked, nodevice
  const [midiFlash, setMidiFlash] = useState(false), [lastSignalUI, setLastSignalUI] = useState(""), [allInputs, setAllInputs] = useState([]);
  const [midiLearning, setMidiLearning] = useState(null);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [showWizard, setShowWizard] = useState(!localStorage.getItem('wizardDone'));

  const midiLearningRef = useRef(null), showScrollRef = useRef(null);

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);
  useEffect(() => { refreshData(); initMidi(); }, []);
  
  useEffect(() => {
    const check = () => fetch('http://localhost:3001/ping').then(r => setIsServerOnline(r.ok)).catch(() => setIsServerOnline(false));
    check(); setInterval(check, 5000);
  }, []);

  const refreshData = async () => { 
    const s = await db.songs.toArray(); const sl = await db.setlists.toArray();
    setSongs(s); setSetlists(sl); 
    if (selectedItem) {
        const updated = (selectedItem.type === 'song') ? s.find(x => x.id === selectedItem.data.id) : sl.find(x => x.id === selectedItem.data.id);
        if (updated) setSelectedItem({type: selectedItem.type, data: updated});
    }
  };

  // --- INICIALIZAÇÃO MIDI REFORÇADA PARA IPAD ---
  const initMidi = () => {
    setMidiStatus("initializing");
    
    // Fallback: Se não houver navigator.requestMIDIAccess (Safari comum)
    if (!navigator.requestMIDIAccess) {
        setMidiStatus("blocked");
        return;
    }

    WebMidi.enable().then(() => {
      const upd = () => {
        const inputs = WebMidi.inputs;
        setAllInputs(inputs.map(i => i.name));
        setMidiStatus(inputs.length > 0 ? "ready" : "nodevice");

        inputs.forEach(input => {
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
      upd(); WebMidi.addListener("connected", upd); WebMidi.addListener("disconnected", upd);
    }).catch(err => {
      setMidiStatus("blocked");
    });

    // Segurança: Se após 4 segundos nada acontecer, define como erro
    setTimeout(() => {
        setMidiStatus(current => current === "initializing" ? "blocked" : current);
    }, 4000);
  };

  const scrollPage = (d) => { if (showScrollRef.current) showScrollRef.current.scrollBy({ top: (window.innerHeight * 0.45) * d, behavior: 'smooth' }); };
  const triggerDL = (d, f) => { const u = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })); const l = document.createElement('a'); l.href = u; l.download = f; l.click(); };

  const handleImport = (e) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        let map = {};
        if (d.songs) { for (let s of d.songs) { 
            let titleToSave = s.title;
            const ex = await db.songs.where({title: s.title, artist: s.artist}).first();
            if (ex) titleToSave = s.title + " (Importada)";
            const id = await db.songs.add({ ...s, title: titleToSave, id: undefined }); 
            map[s.title+s.artist] = await db.songs.get(id); 
        } }
        if (d.setlists) { for (let sl of d.setlists) { const ns = (sl.songs || []).map(s => map[s.title+s.artist] || s); await db.setlists.add({ ...sl, id: undefined, songs: ns }); } }
        refreshData(); alert("Importado!");
      } catch (err) { alert("Erro JSON"); }
    };
    reader.readAsText(e.target.files[0]);
    e.target.value = null;
  };

  if (showWizard && !localStorage.getItem('wizardDone')) return <div style={styles.wizard}><div style={styles.wizardCard}><Music size={50} color="#007aff" /><h2>ShowPad Pro</h2><button style={styles.primaryButton} onClick={() => {localStorage.setItem('wizardDone', 'true'); setShowWizard(false)}}>Entrar</button></div></div>;

  return (
    <div style={styles.appContainer}>
      <header style={styles.mainHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}><Music color="#007aff" /><h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
            <div onClick={initMidi} style={midiFlash ? styles.midiBadgeActive : (midiStatus === 'ready' ? styles.midiBadgeOn : styles.midiBadgeOff)}>
                <Zap size={10}/> 
                {midiStatus === 'initializing' ? "MIDI..." : (midiStatus === 'ready' ? "MIDI OK" : (midiStatus === 'nodevice' ? "SEM CABO" : "MIDI OFF"))}
            </div>
        </div>
        <div style={{display:'flex', gap:'10px'}}><label style={styles.headerBtn}><FileUp size={14}/> RESTAURAR<input type="file" hidden onChange={(e)=>handleImport(e)} /></label><button style={styles.headerBtn} onClick={() => triggerDL({songs, setlists}, "Backup.json")}><Save size={14}/> BACKUP</button><button onClick={() => setShowSettings(true)} style={styles.infoBtn}><Settings size={22}/></button></div>
      </header>

      <div style={{display:'flex', flex: 1, overflow:'hidden'}}>
        <div style={styles.sidebar}>
          <div style={styles.navTabs}>
            <button onClick={() => setView('library')} style={view === 'library' ? styles.activeTab : styles.tab}>BIBLIOTECA</button>
            <button onClick={() => setView('setlists')} style={view === 'setlists' ? styles.activeTab : styles.tab}>SHOWS</button>
            <button onClick={() => setView('garimpo')} style={view === 'garimpo' ? styles.activeTab : styles.tab}>GARIMPAR</button>
          </div>
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
            {view !== 'garimpo' && <button onClick={async () => { const obj = view==='library'?{title:"Nova Música", artist:"Artista", content:""}:{title:"Novo Show", songs:[], location:"", time:"", members:"", notes:""}; const id = await (view==='library'?db.songs.add(obj):db.setlists.add(obj)); refreshData(); const ni = await (view==='library'?db.songs.get(id):db.setlists.get(id)); setSelectedItem({type:view==='library'?'song':'setlist', data: ni}); }} style={styles.addBtn}>+ NOVO</button>}
          </div>
        </div>

        <div style={styles.mainEditor}>
          {view === 'garimpo' ? (
            <div style={styles.garimpoPanel}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h2 style={{color:'#fff'}}>Garimpar</h2><div style={isServerOnline ? styles.serverLedOn : styles.serverLedOff}><div style={styles.ledDot}></div>{isServerOnline ? "MAC OK" : "MAC OFF"}</div></div>
              <div style={styles.inputRow}><input style={styles.inputField} placeholder="Link CifraClub..." value={garimpoInput} onChange={e=>setGarimpoInput(e.target.value)} /><button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button></div>
              <div style={styles.scrollList}>{garimpoQueue.map((u,i)=>(<div key={i} style={styles.miniItemGarimpo}><span>{u.split('/').pop()}</span><X size={14} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))} style={{cursor:'pointer'}}/></div>))}</div>
              <button style={styles.processBtn} onClick={async () => {
                setIsScraping(true); setScrapingStatus("Extraindo...");
                for (let k=0; k<garimpoQueue.length; k++) {
                  try {
                    const r = await fetch('http://localhost:3001/scrape', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url: garimpoQueue[k]}) });
                    const s = await r.json(); if(s.title && !(await db.songs.where({title:s.title, artist:s.artist}).first())) await db.songs.add({...s, notes:""});
                  } catch (e) {}
                }
                setIsScraping(false); setScrapingStatus("✅ Concluído!"); setGarimpoQueue([]); refreshData();
              }} disabled={isScraping || garimpoQueue.length===0 || !isServerOnline}>Salvar na Biblioteca</button>
              <div style={styles.statusText}>{scrapingStatus}</div>
            </div>
          ) : selectedItem ? (
            <MainEditor key={selectedItem.data.id} item={selectedItem} songs={songs} triggerDL={triggerDL} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} />
          ) : <div style={styles.empty}><Music size={80} color="#222" /><h2>ShowPad Pro</h2></div>}
        </div>
      </div>

      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={()=>setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} />}
      {showSettings && <SettingsView onClose={()=>setShowSettings(false)} inputs={allInputs} setMidiLearning={setMidiLearning} midiLearning={midiLearning} midiStatus={midiStatus} handleImport={handleImport} />}
    </div>
  );
}

const MainEditor = ({ item, songs, triggerDL, onClose, onShow, refresh }) => {
  const [lC, setLC] = useState(item.data.content), [lT, setLT] = useState(item.data.title), [lA, setLA] = useState(item.data.artist || ""), [lLoc, setLLoc] = useState(item.data.location || ""), [lTim, setLTim] = useState(item.data.time || ""), [lMem, setLMem] = useState(item.data.members || ""), [lNot, setLNot] = useState(item.data.notes || "");
  const save = async () => {
    if (item.type === 'song') await db.songs.update(item.data.id, { content: lC, title: lT, artist: lA });
    else await db.setlists.update(item.data.id, { title: lT, location: lLoc, time: lTim, members: lMem, notes: lNot });
    refresh();
  };
  const moveSong = async (index, dir) => {
    const newSongs = [...item.data.songs]; const target = index + dir;
    if (target >= 0 && target < newSongs.length) { [newSongs[index], newSongs[target]] = [newSongs[target], newSongs[index]]; await db.setlists.update(item.data.id, { songs: newSongs }); refresh(); }
  };
  return (
    <div style={styles.editorContent}>
      <div style={styles.editorHeader}>
        <div style={{flex:1}}><input style={styles.hInput} value={lT} onChange={e=>setLT(e.target.value)} onBlur={save}/><input style={styles.artistInput} value={item.type==='song'?lA:lLoc} onChange={e=>item.type==='song'?setLA(e.target.value):setLLoc(e.target.value)} onBlur={save} placeholder={item.type==='song'?"Artista":"Local"}/></div>
        <div style={styles.btnGroup}>
          <button style={styles.exportBtn} onClick={()=>triggerDL(item.type==='song'?{songs:[{...item.data, content:lC}]}:{songs:item.data.songs, setlists:[{...item.data}]}, `ShowPad_${item.type==='song'?'Musica':'Show'}_${lT}.json`)}>EXPORTAR</button>
          {item.type==='song' && <><button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, 1); setLC(n); save();}}>+ Tom</button><button style={styles.transpBtn} onClick={()=>{const n=transposeContent(lC, -1); setLC(n); save();}}>- Tom</button></>}
          <button onClick={onClose} style={styles.saveBtn}>Concluir</button><button onClick={onShow} style={styles.showBtn}>SHOW</button>
        </div>
      </div>
      {item.type === 'setlist' ? (
        <>
            <div style={styles.showMetaData}>
                <div style={styles.metaRow}><input placeholder="Local" value={lLoc} onChange={e=>setLLoc(e.target.value)} onBlur={save} style={styles.metaInput}/><input placeholder="Hora" value={lTim} onChange={e=>setLTim(e.target.value)} onBlur={save} style={styles.metaInputSmall}/></div>
                <input placeholder="Integrantes" value={lMem} onChange={e=>setLMem(e.target.value)} onBlur={save} style={styles.metaInputWide}/>
                <textarea placeholder="Observações Gerais..." value={lNot} onChange={e=>setLNot(e.target.value)} onBlur={save} style={styles.metaTextArea}></textarea>
            </div>
            <div style={styles.setlistSplit}>
                <div style={styles.setlistHalf}>
                    <h3 style={{color:'#007aff'}}>Set List do Show</h3>
                    {(item.data.songs || []).map((s, i) => (
                    <div key={i} style={styles.miniItemReorder}>
                        <div style={{flex:1, color:'#fff'}}>{i+1}. {s.title}</div>
                        <div style={styles.reorderControls}>
                            <button onClick={() => moveSong(i, -1)} disabled={i === 0}><ArrowUp size={14}/></button>
                            <button onClick={() => moveSong(i, 1)} disabled={i === item.data.songs.length - 1}><ArrowDown size={14}/></button>
                            <button onClick={async ()=>{const n=[...item.data.songs]; n.splice(i,1); await db.setlists.update(item.data.id,{songs:n}); refresh();}}><Trash2 size={14} color="#ff3b30"/></button>
                        </div>
                    </div>))}
                </div>
                <div style={{...styles.setlistHalf, background:'#222'}}>
                    <h3 style={{color:'#888'}}>Biblioteca (Clique no +)</h3>
                    {songs.map(s => (<div key={s.id} style={styles.miniItem} onClick={async ()=>{const n=[...(item.data.songs||[]), s]; await db.setlists.update(item.data.id,{songs:n}); refresh();}}><div style={{flex:1}}>{s.title}</div><Plus size={14} color="#34c759"/></div>))}
                </div>
            </div>
        </>
      ) : <textarea style={styles.mainTextArea} value={lC} onChange={e=>setLC(e.target.value)} onBlur={save} />}
    </div>
  );
};

const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, onClose, showScrollRef, lastSignal }) => {
  const [idx, setIdx] = useState(0), [dr, setDr] = useState(false);
  const songsArr = item.type === 'setlist' ? item.data.songs : [item.data];
  const song = songsArr[idx];
  const render = (txt) => txt?.split('\n').map((l, i) => {
    const m = l.match(chordRegex); const isC = m && m.length > 0 && m.length >= l.trim().split(/\s+/).length * 0.4;
    return <div key={i} style={{ color: isC ? '#FFD700' : '#FFF', fontWeight: isC ? 'bold' : 'normal', whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.8' }}>{l || ' '}</div>;
  });
  return (
    <div style={styles.showOverlay}>
      {dr && <div style={styles.showDrawer}><div style={styles.drawerHeader}>SET LIST <X onClick={()=>setDr(false)} style={{cursor:'pointer'}}/></div>{songsArr.map((s,i)=><div key={i} style={idx===i?styles.drawerItemActive:styles.drawerItem} onClick={()=>{setIdx(i);setDr(false); if(showScrollRef.current) showScrollRef.current.scrollTop = 0;}}>{i+1}. {s.title}</div>)}</div>}
      <div style={styles.showToolbar}><button onClick={()=>setDr(true)} style={styles.backBtn}><Menu/></button><button onClick={onClose} style={styles.backBtn}><ChevronLeft/> Sair</button><div style={{flex:1, textAlign:'center'}}><strong style={{color:'#fff'}}>{song?.title}</strong>{lastSignal && <div style={styles.midiProbeFloating}>MIDI: {lastSignal}</div>}</div><div style={styles.showControls}><button onClick={()=>setFontSize(f=>f-5)}><Type size={14}/>-</button><button onClick={()=>setFontSize(f=>f+5)}><Type size={14}/>+</button><button onClick={()=>scrollPage(-1)}><ChevronUp size={20}/></button><button onClick={()=>scrollPage(1)}><ChevronDown size={20}/></button></div></div>
      <div ref={showScrollRef} style={{...styles.showContent, fontSize:fontSize+'px', fontFamily:'monospace', color:'#fff'}}>{song ? render(song.content) : "Fim"}{item.type==='setlist' && <div style={styles.pageActions}>{idx>0 && <button style={styles.pageBtn} onClick={()=>{setIdx(idx-1); if(showScrollRef.current) showScrollRef.current.scrollTop = 0;}}><ChevronLeft/> ANTERIOR</button>}{idx<songsArr.length-1 && <button style={styles.pageBtnNext} onClick={()=>{setIdx(idx+1); if(showScrollRef.current) showScrollRef.current.scrollTop = 0;}}>PRÓXIMA <ChevronRight/></button>}</div>}</div>
    </div>
  );
};

const SettingsView = ({ onClose, inputs, setMidiLearning, midiLearning, midiStatus, handleImport }) => (
  <div style={styles.wizard}>
    <div style={styles.settingsCard}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h2>Ajustes</h2><X onClick={onClose} style={{cursor:'pointer'}}/></div>
        <div style={styles.settingsSection}>
            <h4>MIDI - {midiStatus === 'ready' ? 'CONECTADO' : 'AGUARDANDO...'}</h4>
            <div style={{fontSize:'12px', color: midiStatus === 'ready' ? '#34c759' : '#ff3b30'}}>
                {inputs.length>0 ? `Hardware: ${inputs.join(", ")}` : "Abra o link via 'Web MIDI Browser'."}
            </div>
            {midiLearning ? (
                <div style={{marginTop:'15px', padding:'10px', background:'#ff3b3022', borderRadius:'10px', border:'1px solid #ff3b30'}}>
                    <p style={{margin:0, fontWeight:'bold', fontSize:'11px'}}>TOCANDO TECLA PARA {midiLearning.toUpperCase()}...</p>
                    <button onClick={()=>setMidiLearning(null)} style={{marginTop:'8px', padding:'5px 10px', background:'#ff3b30', color:'#fff', border:'none', borderRadius:'5px', fontSize:'10px'}}>CANCELAR</button>
                </div>
            ) : (
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                    <button onClick={()=>setMidiLearning('up')} style={styles.learnBtn}>Mapear VOLTAR</button>
                    <button onClick={()=>setMidiLearning('down')} style={styles.learnBtn}>Mapear AVANÇAR</button>
                </div>
            )}
        </div>
        <div style={styles.settingsSection}><h4>Backup</h4><label style={styles.importFullBtn}>RESTAURAR BACKUP (JSON)<input type="file" hidden onChange={(e)=>handleImport(e, "Backup")} /></label></div>
        <button style={styles.primaryButton} onClick={onClose}>Fechar</button>
    </div>
  </div>
);

const styles = {
    appContainer: { display: 'flex', flexDirection:'column', height: '100vh', backgroundColor: '#1c1c1e', color: '#fff', overflow:'hidden', fontFamily: 'sans-serif' },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', borderBottom:'1px solid #333' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border:'none' },
    midiBadgeOn: { fontSize:'9px', color:'#34c759', border:'1px solid #34c759', padding:'2px 6px', borderRadius:'4px', cursor:'pointer' },
    midiBadgeActive: { fontSize:'9px', color:'#000', backgroundColor:'yellow', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeOff: { fontSize:'9px', color:'#666', border:'1px solid #333', padding:'2px 6px', borderRadius:'4px', cursor:'pointer' },
    midiProbeFloating: { position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', color: 'yellow', fontSize: '9px', fontWeight: 'bold' },
    infoBtn: { background:'none', border:'none', color:'#888', cursor:'pointer' },
    sidebar: { width: '280px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#2c2c2e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333' },
    tab: { flex: 1, padding: '12px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'11px' },
    activeTab: { flex: 1, padding: '12px', border: 'none', background: '#3a3a3c', color: '#fff', borderBottom: '2px solid #007aff' },
    listArea: { flex: 1, overflowY: 'auto' },
    listItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px' },
    selectedItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px' },
    listActionBtnShow: { background:'none', border:'none', color:'#007aff', cursor:'pointer', padding:'5px' },
    listActionBtnDelete: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer', padding:'5px' },
    sidebarFooter: { padding: '15px', display: 'flex', gap: '8px', borderTop: '1px solid #333', flexWrap: 'wrap' },
    addBtn: { flex: 1, padding: '10px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { flex: 1, padding: '10px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'10px' },
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
    wizardCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '20px', textAlign: 'center', maxWidth: '320px', color:'#333' },
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