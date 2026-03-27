import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import Dexie from 'dexie';
import { 
  Plus, Music, Play, Trash2, ChevronLeft, 
  FileUp, ChevronUp, ChevronDown, 
  Type, ListMusic, CheckCircle2, X, RefreshCw, Piano, Info, Activity, Zap, Monitor, Menu, ChevronRight, Download, Save, ClipboardPaste, Loader2, Database, Cloud, Settings
} from 'lucide-react';

// --- BANCO DE DADOS ---
const db = new Dexie('ShowPadProWeb');
db.version(11).stores({ 
    songs: '++id, title, artist', 
    setlists: '++id, title, location, time, members, notes' 
});

// --- MOTOR MUSICAL ---
const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const chordRegex = /([A-G][#b]?(?:m|maj|dim|sus|aug|add|alt|[0-9])*(?:\/[A-G][#b]?)?)/g;

const shiftNote = (note, steps) => {
    const flats = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
    const rootMatch = note.match(/^[A-G][#b]?/);
    if (!rootMatch) return note;
    const root = rootMatch[0], suffix = note.substring(root.length), normalized = flats[root] || root;
    let index = scale.indexOf(normalized.toUpperCase());
    if (index === -1) return note;
    let newIndex = (index + steps) % 12;
    if (newIndex < 0) newIndex += 12;
    return scale[newIndex] + suffix;
};

const transposeContent = (content, steps) => {
  if (!content) return "";
  return content.split('\n').map(line => {
    if (line.toLowerCase().includes("tom")) return line.replace(/([A-G][#b]?)/g, (m) => shiftNote(m, steps));
    const matches = line.match(chordRegex);
    if (matches && matches.length >= line.trim().split(/\s+/).length * 0.4) return line.replace(chordRegex, (m) => shiftNote(m, steps));
    return line;
  }).join('\n');
};

const formatChordsVisual = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const matches = line.match(chordRegex);
        const isChordLine = (matches?.length || 0) > 0 && (matches?.length || 0) >= line.trim().split(/\s+/).length * 0.4;
        return (
            <div key={i} style={{ 
                color: isChordLine ? '#FFD700' : '#FFFFFF', 
                fontWeight: isChordLine ? 'bold' : 'normal', 
                minHeight: '1.2em', whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.8' 
            }}>
                {line || ' '}
            </div>
        );
    });
};

export default function App() {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showMode, setShowMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // NOVO: Painel de Engrenagem
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  const [view, setView] = useState('library');
  
  // MIDI ESTADOS
  const [isMidiEnabled, setIsMidiEnabled] = useState(false);
  const [midiFlash, setMidiFlash] = useState(false); 
  const [allInputs, setAllInputs] = useState([]);
  const [midiLearning, setMidiLearning] = useState(null);
  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

  // GARIMPO CLOUD
  const [garimpoInput, setGarimpoInput] = useState("");
  const [garimpoQueue, setGarimpoQueue] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState("");

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);
  useEffect(() => { refreshData(); initMidi(); }, []);

  const refreshData = async () => {
    setSongs(await db.songs.toArray());
    setSetlists(await db.setlists.toArray());
  };

  const initMidi = () => {
    WebMidi.enable({ sysex: true }).then(() => {
      setIsMidiEnabled(true);
      const updateInputs = () => {
        setAllInputs(WebMidi.inputs.map(i => i.name));
        WebMidi.inputs.forEach(input => {
            input.removeListener();
            input.addListener("midimessage", e => {
                const status = e.data[0], data1 = e.data[1], data2 = e.data[2];
                if ((status >= 144 && status <= 159 && data2 > 0) || (status >= 176 && status <= 191)) {
                    const signalId = `${status >= 144 && status <= 159 ? "note" : "cc"}-${data1}`;
                    setMidiFlash(true); setTimeout(() => setMidiFlash(false), 200);
                    
                    if (midiLearningRef.current) {
                        localStorage.setItem(`midi-${midiLearningRef.current}`, signalId);
                        setMidiLearning(null); 
                        alert(`Comando gravado com sucesso!`);
                        return;
                    }
                    if (signalId === localStorage.getItem('midi-up')) scrollPage(-1);
                    if (signalId === localStorage.getItem('midi-down')) scrollPage(1);
                }
            });
        });
      };
      updateInputs();
      WebMidi.addListener("connected", updateInputs);
    }).catch(() => setIsMidiEnabled(false));
  };

  const scrollPage = (dir) => {
    if (showScrollRef.current) {
        const amount = window.innerHeight * 0.45;
        showScrollRef.current.scrollBy({ top: amount * dir, behavior: 'smooth' });
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.songs) {
                for (let s of data.songs) {
                    if (!(await db.songs.where({title: s.title, artist: s.artist}).first())) {
                        await db.songs.add({ ...s, id: undefined, notes: "" });
                    }
                }
            }
            if (data.setlists) {
                for (let sl of data.setlists) { await db.setlists.add({ ...sl, id: undefined }); }
            }
            refreshData(); alert(`Importado com sucesso!`);
        } catch (err) { alert("Arquivo JSON inválido."); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const triggerDownload = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
  };

  if (showWizard) return <Wizard onDone={() => { localStorage.setItem('wizardDone', 'true'); setShowWizard(false); }} />;

  return (
    <div style={styles.appContainer}>
      <header style={styles.mainHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <Music color="#007aff" />
            <h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
            <div style={midiFlash ? styles.midiBadgeActive : (isMidiEnabled && allInputs.length > 0 ? styles.midiBadgeOn : styles.midiBadgeOff)}>
                <Zap size={10}/> {midiFlash ? "SINAL MIDI!" : "MIDI READY"}
            </div>
        </div>
        <div style={{display:'flex', gap:'15px'}}>
            <button onClick={() => setShowSettings(true)} style={styles.infoBtn}><Settings size={22}/></button>
        </div>
      </header>

      <div style={{display:'flex', flex: 1, overflow:'hidden'}}>
        {/* SIDEBAR */}
        <div style={styles.sidebar}>
            <div style={styles.navTabs}>
                <button onClick={() => setView('library')} style={view === 'library' ? styles.activeTab : styles.tab}>Biblioteca</button>
                <button onClick={() => setView('setlists')} style={view === 'setlists' ? styles.activeTab : styles.tab}>Shows</button>
                <button onClick={() => setView('garimpo')} style={view === 'garimpo' ? styles.activeTab : styles.tab}>Garimpar</button>
            </div>
            <div style={styles.listArea}>
                {(view === 'library' ? songs : setlists).map(item => (
                    <div key={item.id} style={selectedItem?.data?.id === item.id ? styles.selectedItem : styles.listItem}>
                        <div style={{flex:1, overflow:'hidden'}} onClick={() => setSelectedItem({type: view === 'library' ? 'song' : 'setlist', data: item})}>
                            <strong>{item.title}</strong>
                            <small style={{display:'block', opacity:0.5}}>{item.artist || item.location || "---"}</small>
                        </div>
                        <div style={{display:'flex', gap:'6px'}}>
                            <button style={styles.listActionBtnShow} onClick={() => { setSelectedItem({type: view === 'library' ? 'song' : 'setlist', data: item}); setShowMode(true); }}><Monitor size={16}/></button>
                            <button style={styles.listActionBtnDelete} onClick={async () => { if(confirm("Excluir?")) { if(view==='library') await db.songs.delete(item.id); else await db.setlists.delete(item.id); refreshData(); setSelectedItem(null); }}}><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            <div style={styles.sidebarFooter}>
                <button onClick={async () => {
                    const obj = view==='setlists' ? {title:"Novo Show", songs:[], location:"", time:"", members:"", notes:""} : {title:"Nova Música", artist:"Artista", content:""};
                    const id = await (view==='setlists' ? db.setlists.add(obj) : db.songs.add(obj));
                    refreshData();
                    setSelectedItem({type: view==='setlists'?'setlist':'song', data: await (view==='setlists'?db.setlists.get(id):db.songs.get(id))});
                }} style={styles.addBtn}>+ NOVO</button>
                <button onClick={() => triggerDownload({songs, setlists}, "ShowPad_Backup.json")} style={styles.iconBtn} title="Backup Total"><Download size={18}/></button>
            </div>
        </div>

        {/* ÁREA CENTRAL */}
        <div style={styles.mainEditor}>
            {view === 'garimpo' ? (
                <div style={styles.garimpoPanel}>
                    <h2 style={{color: '#fff', margin: 0}}>Garimpar Músicas (Cloud)</h2>
                    <div style={styles.inputRow}>
                        <input style={styles.inputField} placeholder="Link do CifraClub..." value={garimpoInput} onChange={e=>setGarimpoInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && (()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}})()}/>
                        <button style={styles.secondaryBtn} onClick={async ()=>{ const t = await navigator.clipboard.readText(); setGarimpoInput(t); }}><ClipboardPaste size={18}/></button>
                        <button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button>
                    </div>
                    <div style={styles.scrollList}>{garimpoQueue.map((url,i)=>(<div key={i} style={styles.miniItemGarimpo}><span>{url.split('/').pop()}</span><X size={14} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))} style={{cursor:'pointer'}}/></div>))}</div>
                    <button style={styles.processBtn} onClick={async () => {
                        setIsScraping(true); setScrapingStatus("Garimpando...");
                        for (const url of garimpoQueue) {
                            try {
                                const response = await fetch('/api/scrape', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}) });
                                const song = await response.json();
                                if(song.title && !(await db.songs.where({title:song.title, artist:song.artist}).first())) await db.songs.add({...song, notes:""});
                            } catch (err) { console.error(err); }
                        }
                        setIsScraping(false); setScrapingStatus("✅ Biblioteca Atualizada!"); setGarimpoQueue([]); refreshData();
                    }} disabled={isScraping || garimpoQueue.length===0}>Processar e Salvar</button>
                    <div style={styles.statusText}>{scrapingStatus}</div>
                </div>
            ) : selectedItem ? (
                <SongEditor key={selectedItem.data.id} item={selectedItem} triggerDownload={triggerDownload} onClose={() => { setSelectedItem(null); refreshData(); }} onShow={() => setShowMode(true)} update={async (changes) => {
                    if(selectedItem.type==='song') await db.songs.update(selectedItem.data.id, changes);
                    else await db.setlists.update(selectedItem.data.id, changes);
                    setSelectedItem({...selectedItem, data: {...selectedItem.data, ...changes}});
                    refreshData();
                }} />
            ) : (
                <div style={styles.empty}><Music size={80} color="#222" /><h2>ShowPad Pro</h2><p style={{color:'#444'}}>O cockpit do tecladista profissional.</p></div>
            )}
        </div>
      </div>

      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={() => setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} />}
      
      {/* NOVO PAINEL DE CONFIGURAÇÕES (GEAR) */}
      {showSettings && (
        <div style={styles.wizard}>
            <div style={styles.settingsCard}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h2 style={{margin:0, color:'#007aff'}}>Configurações MIDI</h2>
                    <X onClick={()=>setShowSettings(false)} style={{cursor:'pointer'}}/>
                </div>
                
                <div style={styles.settingsSection}>
                    <h4>Status do Hardware</h4>
                    <div style={isMidiEnabled ? styles.serverLedOn : styles.serverLedOff}>
                        <div style={styles.ledDot}></div>
                        {isMidiEnabled ? (allInputs.length > 0 ? "TECLADO CONECTADO" : "BROWSER OK / SEM HARDWARE") : "BROWSER SEM SUPORTE MIDI"}
                    </div>
                    {allInputs.length > 0 && (
                        <ul style={{fontSize:'12px', color:'#34c759', padding:'10px 0'}}>
                            {allInputs.map((d,i) => <li key={i}>{d}</li>)}
                        </ul>
                    )}
                </div>

                <div style={styles.settingsSection}>
                    <h4>Mapeamento de Pedais/Teclas</h4>
                    <p style={{fontSize:'11px', color:'#888'}}>Clique no botão e pressione a tecla ou pedal no seu instrumento.</p>
                    <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                        <button onClick={()=>setMidiLearning('up')} style={midiLearning==='up' ? styles.learnBtnActive : styles.learnBtn}>
                            {midiLearning==='up' ? "Aguardando..." : "Mapear VOLTAR Pág"}
                        </button>
                        <button onClick={()=>setMidiLearning('down')} style={midiLearning==='down' ? styles.learnBtnActive : styles.learnBtn}>
                            {midiLearning==='down' ? "Aguardando..." : "Mapear AVANÇAR Pág"}
                        </button>
                    </div>
                    <button onClick={()=>{localStorage.removeItem('midi-up'); localStorage.removeItem('midi-down'); alert("Limpo!")}} style={styles.clearMidiBtn}>Limpar Comandos</button>
                </div>

                <div style={styles.settingsSection}>
                    <h4>Sistema</h4>
                    <label style={styles.importFullBtn}>RESTAURAR BACKUP (JSON)<input type="file" hidden onChange={handleImport} /></label>
                    <p style={{fontSize:'10px', color:'#aaa', marginTop:'15px'}}>Edu Posada & Gemini 1.5 Flash (v14.0)</p>
                </div>
                
                <button style={styles.primaryButton} onClick={()=>setShowSettings(false)}>Fechar e Salvar</button>
            </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTES ---

const SongEditor = ({ item, triggerDownload, onClose, onShow, update }) => {
    const [lC, setLC] = useState(item.data.content), [lT, setLT] = useState(item.data.title), [lA, setLA] = useState(item.data.artist);
    const persist = () => update({ content: lC, title: lT, artist: lA });
    if (item.type === 'setlist') return <SetlistEditor setlist={item.data} onClose={onClose} onShow={onShow} update={update} triggerDownload={triggerDownload} />;
    return (
        <div style={styles.editorContent}>
            <div style={styles.editorHeader}>
                <div style={{flex:1}}><input style={styles.hInput} value={lT} onChange={e => setLT(e.target.value)} onBlur={persist}/><input style={styles.artistInput} value={lA} onChange={e => setLA(e.target.value)} onBlur={persist}/></div>
                <div style={styles.btnGroup}>
                    <button style={styles.exportBtn} onClick={() => triggerDownload({songs:[{...item.data, content:lC}]}, `ShowPad_Cifra.json`)}>EXPORTAR</button>
                    <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, 1); setLC(n); update({content:n}); }}>+ Tom</button>
                    <button style={styles.transpBtn} onClick={() => { const n = transposeContent(lC, -1); setLC(n); update({content:n}); }}>- Tom</button>
                    <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
                    <button onClick={onShow} style={styles.showBtn}>SHOW</button>
                </div>
            </div>
            <textarea style={styles.mainTextArea} value={lC} onChange={e => setLC(e.target.value)} onBlur={persist} />
        </div>
    );
};

const SetlistEditor = ({ setlist, onClose, onShow, update, triggerDownload }) => {
    const moveSong = (index, dir) => { const n = [...setlist.songs]; const t = index+dir; if(t>=0 && t<n.length) { [n[index], n[t]] = [n[t], n[index]]; update({songs:n}); } };
    return (
        <div style={styles.editorContent}>
            <div style={styles.editorHeader}>
                <input style={styles.hInput} value={setlist.title} onChange={e => update({title: e.target.value})} />
                <div style={styles.btnGroup}>
                    <button style={styles.exportBtn} onClick={() => triggerDownload({songs: setlist.songs, setlists: [setlist]}, `ShowPad_Show.json`)}>EXPORTAR SHOW</button>
                    <button onClick={onShow} style={styles.showBtn}>START SHOW</button>
                    <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
                </div>
            </div>
            <div style={styles.showMetaData}>
                <div style={styles.metaRow}><input placeholder="Local" value={setlist.location} onChange={e => update({location: e.target.value})} style={styles.metaInput}/><input placeholder="Hora" value={setlist.time} onChange={e => update({time: e.target.value})} style={styles.metaInputSmall}/></div>
                <input placeholder="Integrantes" value={setlist.members} onChange={e => update({members: e.target.value})} style={styles.metaInputWide}/>
                <textarea placeholder="Obs Gerais..." value={setlist.notes} onChange={e => update({notes: e.target.value})} style={styles.metaTextArea}></textarea>
            </div>
            <div style={styles.setlistSplit}>
                <div style={styles.setlistHalf}><h3>Set List do Show</h3>{(setlist.songs || []).map((s, i) => (<div key={i} style={styles.miniItemReorder}><div style={{flex:1}}><b>{i+1}.</b> {s.title}</div><div style={styles.reorderControls}><button onClick={()=>moveSong(i,-1)} disabled={i===0}><ArrowUp size={14}/></button><button onClick={()=>moveSong(i,1)} disabled={i===setlist.songs.length-1}><ArrowDown size={14}/></button><button onClick={()=>{const n=[...setlist.songs]; n.splice(i,1); update({songs:n});}} style={{color:'#ff3b30'}}><Trash2 size={14}/></button></div></div>))}</div>
                <div style={{...styles.setlistHalf, backgroundColor:'#2c2c2e'}}><h3>Clique na Biblioteca Lateral para adicionar músicas</h3></div>
            </div>
        </div>
    );
};

const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, onClose, showScrollRef, lastSignal }) => {
    const [songIdx, setSongIdx] = useState(0), [drawerOpen, setDrawerOpen] = useState(false);
    const currentSong = item.type === 'setlist' ? (item.data.songs[songIdx] || null) : item.data;
    return (
        <div style={styles.showOverlay}>
            {drawerOpen && <div style={styles.showDrawer}><div style={styles.drawerHeader}>SET LIST <X onClick={()=>setDrawerOpen(false)} style={{cursor:'pointer'}}/></div><div style={{overflowY:'auto', flex:1}}>{item.type === 'setlist' && item.data.songs.map((s, i) => (<div key={i} style={songIdx === i ? styles.drawerItemActive : styles.drawerItem} onClick={() => { setSongIdx(i); setDrawerOpen(false); if(showScrollRef.current) showScrollRef.current.scrollTop = 0; }}>{i+1}. {s.title}</div>))}</div></div>}
            <div style={styles.showToolbar}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}><button onClick={()=>setDrawerOpen(true)} style={styles.backBtn}><Menu/></button><button onClick={onClose} style={styles.backBtn}><ChevronLeft/> Sair</button></div>
                <div style={{textAlign: 'center', flex:1}}>
                    <strong style={{color:'#fff'}}>{currentSong?.title}</strong>
                    {lastSignal && <div style={styles.midiProbeFloating}>MIDI: {lastSignal}</div>}
                </div>
                <div style={styles.showControls}>
                    <button onClick={() => setFontSize(f => {const n=f-5; localStorage.setItem('fontSize', n); return n;})}><Type size={14}/>-</button>
                    <button onClick={() => setFontSize(f => {const n=f+5; localStorage.setItem('fontSize', n); return n;})}><Type size={14}/>+</button>
                    <button onClick={() => scrollPage(-1)}><ChevronUp size={20}/></button>
                    <button onClick={() => scrollPage(1)}><ChevronDown size={20}/></button>
                </div>
            </div>
            <div ref={showScrollRef} style={{...styles.showContent, fontSize: fontSize + 'px', fontFamily: 'monospace'}}>{currentSong ? formatChordsVisual(currentSong.content) : "Fim do Show"}<div style={styles.pageActions}>{item.type === 'setlist' && songIdx > 0 && <button style={styles.pageBtn} onClick={()=>{ setSongIdx(songIdx-1); showScrollRef.current.scrollTop = 0; }}><ChevronLeft/> ANTERIOR</button>}{item.type === 'setlist' && songIdx < item.data.songs.length - 1 && <button style={styles.pageBtnNext} onClick={()=>{ setSongIdx(songIdx+1); showScrollRef.current.scrollTop = 0; }}>PRÓXIMA <ChevronRight/></button>}</div></div>
        </div>
    );
};

const Wizard = ({ onDone }) => (
    <div style={styles.wizard}><div style={styles.wizardCard}><Music size={50} color="#007aff" /><h2>ShowPad Pro</h2><p style={{fontSize:'13px', color:'#666', marginBottom:'20px'}}>No iPad, use o ícone de engrenagem para configurar seu teclado musical.</p><button style={styles.primaryButton} onClick={onDone}>Entrar no App</button></div></div>
);

const styles = {
    appContainer: { display: 'flex', flexDirection:'column', height: '100vh', backgroundColor: '#1c1c1e', color: '#fff', overflow:'hidden', fontFamily: 'sans-serif' },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', borderBottom:'1px solid #333' },
    midiBadgeOn: { fontSize:'9px', color:'#34c759', border:'1px solid #34c759', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeActive: { fontSize:'9px', color:'#000', backgroundColor:'yellow', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeOff: { fontSize:'9px', color:'#666', border:'1px solid #333', padding:'2px 6px', borderRadius:'4px' },
    midiProbeFloating: { position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', color: 'yellow', fontSize: '9px', fontWeight: 'bold' },
    infoBtn: { background:'none', border:'none', color:'#888', cursor:'pointer' },
    sidebar: { width: '280px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#2c2c2e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333' },
    tab: { flex: 1, padding: '12px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'11px' },
    activeTab: { flex: 1, padding: '12px', border: 'none', background: '#3a3a3c', color: '#fff', borderBottom: '2px solid #007aff' },
    listArea: { flex: 1, overflowY: 'auto' },
    listItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#fff' },
    selectedItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#fff' },
    listActionBtnShow: { background:'none', border:'none', color:'#007aff', cursor:'pointer', padding:'5px' },
    listActionBtnDelete: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer', padding:'5px' },
    sidebarFooter: { padding: '15px', display: 'flex', gap: '8px', borderTop: '1px solid #333', flexWrap: 'wrap' },
    addBtn: { flex: 1, padding: '10px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
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
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000' },
    backBtn: { background:'none', border:'none', color:'#fff', display:'flex', alignItems:'center', cursor:'pointer' },
    wizard: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:4000 },
    wizardCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '20px', textAlign: 'center', maxWidth: '320px', color:'#333' },
    settingsCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '500px', color:'#333', display:'flex', flexDirection:'column' },
    settingsSection: { textAlign:'left', marginBottom:'20px', padding:'15px', backgroundColor:'#f9f9f9', borderRadius:'15px' },
    learnBtn: { flex:1, padding:'12px', backgroundColor:'#007aff', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', cursor:'pointer' },
    learnBtnActive: { flex:1, padding:'12px', backgroundColor:'#ff3b30', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', cursor:'pointer' },
    clearMidiBtn: { marginTop:'10px', background:'none', border:'none', color:'#ff3b30', fontSize:'11px', cursor:'pointer' },
    importFullBtn: { display:'block', width:'100%', padding:'12px', backgroundColor:'#34c759', color:'#fff', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', textAlign:'center', cursor:'pointer' },
    primaryButton: { marginTop: '10px', width: '100%', padding: '15px', backgroundColor: '#1c1c1e', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor:'pointer' },
    serverLedOn: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#34c759', fontWeight: 'bold' },
    serverLedOff: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' },
    ledDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor', boxShadow: '0 0 10px currentColor' },
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1c1c1e', color: '#fff' },
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    inputField: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2c2c2e', color: '#fff' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    processBtn: { padding: '15px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },
    statusText: { marginTop: '10px', color: '#007aff', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' },
    secondaryBtn: { padding: '10px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    miniItemGarimpo: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'12px', color:'#fff' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#fff' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    showMetaData: { padding: '15px 20px', backgroundColor: '#2c2c2e', display: 'flex', flexDirection: 'column', gap: '8px' },
    metaRow: { display: 'flex', gap: '10px' },
    metaInput: { flex: 1, background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputSmall: { width: '80px', background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputWide: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaTextArea: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px', resize: 'none', height: '60px' },
    setlistSplit: { display: 'flex', flex: 1 },
    setlistHalf: { flex: 1, borderRight: '1px solid #333', padding: '15px', overflowY: 'auto' },
    empty: { flex: 1, display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: '#333' }
};