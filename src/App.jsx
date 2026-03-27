import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import Dexie from 'dexie';
import { 
  Plus, Music, Play, Trash2, ChevronLeft, 
  FileUp, ChevronUp, ChevronDown, 
  Type, ListMusic, CheckCircle2, X, RefreshCw, Piano, Info, Activity, Zap, Monitor, Menu, ChevronRight, Download, Share2, ArrowUp, ArrowDown, Globe, ClipboardPaste, Loader2, Database, Save
} from 'lucide-react';

// --- 1. BANCO DE DADOS ---
const db = new Dexie('ShowPadProWeb');
db.version(11).stores({ 
    songs: '++id, title, artist', 
    setlists: '++id, title, location, time, members, notes' 
});

// --- 2. MOTOR MUSICAL ---
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
  return content.split('\n').map(line => {
    if (line.toLowerCase().includes("tom")) return line.replace(/([A-G][#b]?)/g, (m) => shiftNote(m, steps));
    const matches = line.match(chordRegex);
    if (matches && matches.length >= line.trim().split(/\s+/).length * 0.4) return line.replace(chordRegex, (m) => shiftNote(m, steps));
    return line;
  }).join('\n');
};

export default function App() {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showMode, setShowMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showWizard, setShowWizard] = useState(!localStorage.getItem('wizardDone'));
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  const [view, setView] = useState('library');
  
  const [isMidiEnabled, setIsMidiEnabled] = useState(false);
  const [midiFlash, setMidiFlash] = useState(false); 
  const [lastSignalUI, setLastSignalUI] = useState("");
  const [allInputs, setAllInputs] = useState([]);
  const [midiLearning, setMidiLearning] = useState(null);
  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

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
                        setMidiLearning(null); return;
                    }
                    if (signalId === localStorage.getItem('midi-up')) scrollPage(-1);
                    if (signalId === localStorage.getItem('midi-down')) scrollPage(1);
                }
            });
        });
      };
      updateInputs();
      WebMidi.addListener("connected", updateInputs);
    }).catch(() => {});
  };

  const scrollPage = (dir) => {
    if (showScrollRef.current) {
        const amount = window.innerHeight * 0.45;
        showScrollRef.current.scrollBy({ top: amount * dir, behavior: 'smooth' });
    }
  };

  const triggerDownload = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
  };

  const handleGenericImport = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            let importedSongsMap = {};
            if (data.songs) {
                for (let s of data.songs) {
                    let existing = await db.songs.where({title: s.title, artist: s.artist}).first();
                    if (!existing) {
                        const newId = await db.songs.add({ title: s.title, artist: s.artist, content: s.content, notes: s.notes || "" });
                        existing = await db.songs.get(newId);
                    }
                    importedSongsMap[s.title + s.artist] = existing;
                }
            }
            if (data.setlists) {
                for (let sl of data.setlists) {
                    const newSongs = (sl.songs || []).map(s => importedSongsMap[s.title + s.artist] || s);
                    await db.setlists.add({ ...sl, id: undefined, songs: newSongs });
                }
            }
            refreshData(); alert(`Importação de ${type} concluída!`);
        } catch (err) { alert("Arquivo JSON inválido."); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  if (showWizard) return <Wizard onDone={() => { localStorage.setItem('wizardDone', 'true'); setShowWizard(false); }} />;

  return (
    <div style={styles.appContainer}>
      
      {/* CABEÇALHO COM COMANDOS DE BACKUP (RESTAURAR E GERAR) */}
      <header style={styles.mainHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <Music color="#007aff" />
            <h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
            <div style={midiFlash ? styles.midiBadgeActive : (isMidiEnabled && allInputs.length > 0 ? styles.midiBadgeOn : styles.midiBadgeOff)}>
                <Zap size={10}/> {midiFlash ? "SINAL MIDI!" : "MIDI READY"}
            </div>
        </div>
        
        <div style={{display:'flex', gap:'10px'}}>
            <label style={styles.headerBtn}>
                <FileUp size={14}/> RESTAURAR
                <input type="file" hidden onChange={(e) => handleGenericImport(e, "Backup Total")} />
            </label>
            <button style={styles.headerBtn} onClick={() => triggerDownload({songs, setlists}, `ShowPad_Full_Backup_${new Date().toISOString().slice(0,10)}.json`)}>
                <Download size={14}/> GERAR BACKUP
            </button>
            <button onClick={() => setShowInfo(true)} style={styles.infoBtn}><Info size={22}/></button>
        </div>
      </header>

      <div style={{display:'flex', flex: 1, overflow:'hidden'}}>
        {/* BARRA LATERAL */}
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
                            <button style={styles.listActionBtnDelete} onClick={async () => { if(confirm("Excluir definitivamente?")) { if(view==='library') await db.songs.delete(item.id); else await db.setlists.delete(item.id); refreshData(); setSelectedItem(null); }}}><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.sidebarFooter}>
                {view === 'library' ? (
                    <>
                        <button onClick={async () => {
                            const id = await db.songs.add({title:"Nova Música", artist:"Artista", content:""});
                            refreshData(); setSelectedItem({type:'song', data: await db.songs.get(id)});
                        }} style={styles.addBtn}>+ MÚSICA</button>
                        <label style={styles.importBtnLabel}><FileUp size={16}/> IMPORTAR CIFRA<input type="file" hidden onChange={(e) => handleGenericImport(e, "Cifra Individual")} /></label>
                    </>
                ) : view === 'setlists' ? (
                    <>
                        <button onClick={async () => {
                            const id = await db.setlists.add({title:"Novo Show", songs:[], location:"", time:"", members:"", notes:""});
                            refreshData(); setSelectedItem({type:'setlist', data: await db.setlists.get(id)});
                        }} style={styles.addBtn}>+ NOVO SHOW</button>
                        <label style={styles.importBtnLabel}><ListMusic size={16}/> IMPORTAR SHOW<input type="file" hidden onChange={(e) => handleGenericImport(e, "Setlist")} /></label>
                    </>
                ) : (
                    <div style={{color:'#666', fontSize:'11px', textAlign:'center', width:'100%'}}>Modo Garimpo via Mac ativo</div>
                )}
            </div>
        </div>

        {/* ÁREA CENTRAL */}
        <div style={styles.mainEditor}>
            {view === 'garimpo' ? (
                <div style={styles.garimpoPanel}>
                    <h2 style={{color: '#fff', margin: '0 0 10px 0'}}>Garimpar do Mac</h2>
                    <div style={styles.inputRow}>
                        <input style={styles.inputField} placeholder="Link do CifraClub..." value={garimpoInput} onChange={e=>setGarimpoInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && (()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}})()}/>
                        <button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button>
                    </div>
                    <div style={styles.scrollList}>
                        {garimpoQueue.map((url,i)=>(<div key={i} style={styles.miniItemGarimpo}><span>{url.split('/').pop()}</span><X size={14} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))}/></div>))}
                    </div>
                    <button style={styles.processBtn} onClick={async () => {
                        setIsScraping(true); setScrapingStatus("Garimpando...");
                        for (const url of garimpoQueue) {
                            try {
                                const response = await fetch('http://localhost:3001/scrape', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}) });
                                const song = await response.json();
                                if(song.title && !(await db.songs.where({title:song.title, artist:song.artist}).first())) await db.songs.add({...song, notes:""});
                            } catch (err) { console.error(err); }
                        }
                        setIsScraping(false); setScrapingStatus("✅ Biblioteca Atualizada!"); setGarimpoQueue([]); refreshData();
                    }} disabled={isScraping || garimpoQueue.length===0}>{isScraping ? <Loader2 className="spin" size={20}/> : "Processar e Salvar"}</button>
                    <div style={styles.statusText}>{scrapingStatus}</div>
                </div>
            ) : selectedItem?.type === 'song' ? (
                <SongEditor key={selectedItem.data.id} song={selectedItem.data} triggerDownload={triggerDownload} onClose={() => { setSelectedItem(null); refreshData(); }} onShow={() => setShowMode(true)} onTranspose={(dir) => {
                    const newC = transposeContent(selectedItem.data.content, dir);
                    setSelectedItem({...selectedItem, data: {...selectedItem.data, content: newC}});
                }} />
            ) : selectedItem?.type === 'setlist' ? (
                <SetlistEditor key={selectedItem.data.id} setlist={selectedItem.data} allSongs={songs} triggerDownload={triggerDownload} onClose={() => { setSelectedItem(null); refreshData(); }} onShow={() => setShowMode(true)} update={async (changes) => {
                    await db.setlists.update(selectedItem.data.id, changes);
                    setSelectedItem({...selectedItem, data: {...selectedItem.data, ...changes}});
                    refreshData();
                }} />
            ) : (
                <div style={styles.empty}><Music size={80} color="#222" /><h2>ShowPad Pro</h2></div>
            )}
        </div>
      </div>

      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} setMidiLearning={setMidiLearning} midiLearning={midiLearning} formatChords={formatChords} onClose={() => setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} />}
      {showInfo && <InfoView onClose={() => setShowInfo(false)} inputs={allInputs} />}
    </div>
  );
}

// --- EDITOR DE MÚSICA ---
const SongEditor = ({ song, onClose, onShow, onTranspose, triggerDownload }) => {
    const [localContent, setLocalContent] = useState(song.content);
    const [localTitle, setLocalTitle] = useState(song.title);
    const [localArtist, setLocalArtist] = useState(song.artist);
    const persist = async () => await db.songs.update(song.id, { content: localContent, title: localTitle, artist: localArtist });
    return (
        <div style={styles.editorContent}>
            <div style={styles.editorHeader}>
                <div style={{flex:1}}><input style={styles.hInput} value={localTitle} onChange={e => setLocalTitle(e.target.value)} onBlur={persist} /><input style={styles.artistInput} value={localArtist} onChange={e => setLocalArtist(e.target.value)} onBlur={persist} /></div>
                <div style={styles.btnGroup}>
                    <button style={styles.exportBtn} onClick={() => triggerDownload({songs:[{...song, content:localContent, title:localTitle, artist:localArtist}]}, `ShowPad_Cifra_${localTitle.replace(/\s/g, '_')}.json`)}>EXPORTAR</button>
                    <button style={styles.transpBtn} onClick={() => { onTranspose(1); setLocalContent(transposeContent(localContent, 1)); }}>+ Tom</button>
                    <button style={styles.transpBtn} onClick={() => { onTranspose(-1); setLocalContent(transposeContent(localContent, -1)); }}>- Tom</button>
                    <button onClick={() => { persist(); onClose(); }} style={styles.saveBtn}>Concluir</button>
                    <button onClick={() => { persist(); onShow(); }} style={styles.showBtn}>SHOW</button>
                </div>
            </div>
            <textarea style={styles.mainTextArea} value={localContent} onChange={e => setLocalContent(e.target.value)} onBlur={persist} />
        </div>
    );
};

// --- EDITOR DE SHOW ---
const SetlistEditor = ({ setlist, allSongs, onClose, onShow, update, triggerDownload }) => {
    const [lLoc, setLLoc] = useState(setlist.location || ""), [lTime, setLTime] = useState(setlist.time || ""), [lMem, setLMem] = useState(setlist.members || ""), [lNote, setLNote] = useState(setlist.notes || "");
    const persist = () => update({ location: lLoc, time: lTime, members: lMem, notes: lNote });
    const moveSong = (index, dir) => { const n = [...setlist.songs]; const t = index+dir; if(t>=0 && t<n.length) { [n[index], n[t]] = [n[t], n[index]]; update({songs:n}); } };
    return (
        <div style={styles.editorContent}>
            <div style={styles.editorHeader}>
                <input style={styles.hInput} value={setlist.title} onChange={e => update({title: e.target.value})} />
                <div style={styles.btnGroup}>
                    <button style={styles.exportBtn} onClick={() => triggerDownload({songs: setlist.songs, setlists: [setlist]}, `ShowPad_Show_${setlist.title.replace(/\s/g, '_')}.json`)}>EXPORTAR SHOW</button>
                    <button onClick={onShow} style={styles.showBtn}>START SHOW</button>
                    <button onClick={onClose} style={styles.saveBtn}>Concluir</button>
                </div>
            </div>
            <div style={styles.showMetaData}>
                <div style={styles.metaRow}><input placeholder="Local" value={lLoc} onChange={e => setLLoc(e.target.value)} onBlur={persist} style={styles.metaInput}/><input placeholder="Hora" value={lTime} onChange={e => setLTime(e.target.value)} onBlur={persist} style={styles.metaInputSmall}/></div>
                <input placeholder="Integrantes" value={lMem} onChange={e => setLMem(e.target.value)} onBlur={persist} style={styles.metaInputWide}/>
                <textarea placeholder="Obs Gerais do Show..." value={lNote} onChange={e => setLNote(e.target.value)} onBlur={persist} style={styles.metaTextArea}></textarea>
            </div>
            <div style={styles.setlistSplit}>
                <div style={styles.setlistHalf}><h3>Set List do Show</h3>{(setlist.songs || []).map((s, i) => (<div key={i} style={styles.miniItemReorder}><div style={{flex:1}}><b>{i+1}.</b> {s.title}</div><div style={styles.reorderControls}><button onClick={()=>moveSong(i,-1)} disabled={i===0}><ArrowUp size={14}/></button><button onClick={()=>moveSong(i,1)} disabled={i===setlist.songs.length-1}><ArrowDown size={14}/></button><button onClick={()=>{const n=[...setlist.songs]; n.splice(i,1); update({songs:n});}} style={{color:'#ff3b30'}}><Trash2 size={14}/></button></div></div>))}</div>
                <div style={styles.setlistHalf}><h3>Sua Biblioteca</h3>{allSongs.map(s => (<div key={s.id} style={styles.miniItem} onClick={() => update({songs: [...(setlist.songs||[]), s]})}>{s.title} +</div>))}</div>
            </div>
        </div>
    );
};

const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, setMidiLearning, midiLearning, formatChords, onClose, showScrollRef, lastSignal }) => {
    const [songIdx, setSongIdx] = useState(0), [drawerOpen, setDrawerOpen] = useState(false);
    const currentSong = item.type === 'setlist' ? (item.data.songs[songIdx] || null) : item.data;
    return (
        <div style={styles.showOverlay}>
            {drawerOpen && <div style={styles.showDrawer}><div style={styles.drawerHeader}>SET LIST <X onClick={()=>setDrawerOpen(false)} style={{cursor:'pointer'}}/></div><div style={{overflowY:'auto', flex:1}}>{item.type === 'setlist' && item.data.songs.map((s, i) => (<div key={i} style={songIdx === i ? styles.drawerItemActive : styles.drawerItem} onClick={() => { setSongIdx(i); setDrawerOpen(false); if(showScrollRef.current) showScrollRef.current.scrollTop = 0; }}>{i+1}. {s.title}</div>))}</div></div>}
            <div style={styles.showToolbar}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}><button onClick={()=>setDrawerOpen(true)} style={styles.backBtn}><Menu/></button><button onClick={onClose} style={styles.backBtn}><ChevronLeft/> Sair</button></div>
                <div style={{textAlign: 'center', flex:1}}><strong>{currentSong?.title}</strong>{lastSignal && <div style={styles.midiProbeFloating}>MIDI: {lastSignal}</div>}</div>
                <div style={styles.showControls}><button onClick={() => setFontSize(f => f-5)}><Type size={14}/>-</button><button onClick={() => setFontSize(f => f+5)}><Type size={14}/>+</button><button onClick={() => scrollPage(-1)}><ChevronUp size={20}/></button><button onClick={() => scrollPage(1)}><ChevronDown size={20}/></button><button onClick={() => setMidiLearning('up')} style={{color: midiLearning ? '#ff3b30' : '#fff'}}><Piano size={20}/></button></div>
            </div>
            <div ref={showScrollRef} style={{...styles.showContent, fontSize: fontSize + 'px', fontFamily: 'monospace'}}>{currentSong ? formatChords(currentSong.content) : "Fim do Show"}<div style={styles.pageActions}>{item.type === 'setlist' && songIdx > 0 && <button style={styles.pageBtn} onClick={()=>{ setSongIdx(songIdx-1); showScrollRef.current.scrollTop = 0; }}><ChevronLeft/> ANTERIOR</button>}{item.type === 'setlist' && songIdx < item.data.songs.length - 1 && <button style={styles.pageBtnNext} onClick={()=>{ setSongIdx(songIdx+1); showScrollRef.current.scrollTop = 0; }}>PRÓXIMA <ChevronRight/></button>}</div></div>
        </div>
    );
};

const InfoView = ({ onClose, inputs }) => (
    <div style={styles.wizard}><div style={styles.wizardCard}><h2>Painel ShowPad Pro v10.1</h2><div style={{textAlign:'left', fontSize:'12px', color:'#333'}}><p><b>Autor:</b> Edu Posada</p><p><b>Desenvolvimento:</b> Gemini 1.5 Flash (Google AI)</p><hr/><p><b>MIDI:</b> {inputs.join(", ") || "Nenhum teclado detectado."}</p><hr/><p><b>Instruções:</b> Use os botões de BACKUP (Topo) para salvar ou restaurar toda a sua biblioteca. Use IMPORTAR (Lateral) para arquivos individuais.</p></div><button style={styles.primaryButton} onClick={onClose}>Fechar</button></div></div>
);

const Wizard = ({ onDone }) => (
    <div style={styles.wizard}><div style={styles.wizardCard}><Music size={50} color="#007aff" /><h2>ShowPad Pro</h2><button style={styles.primaryButton} onClick={onDone}>Entrar</button></div></div>
);

const styles = {
    appContainer: { display: 'flex', flexDirection:'column', height: '100vh', backgroundColor: '#1c1c1e', color: '#fff', overflow:'hidden', fontFamily: 'sans-serif' },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', borderBottom:'1px solid #333' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border:'none' },
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
    listItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px' },
    selectedItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px' },
    listActionBtnShow: { background:'none', border:'none', color:'#007aff', cursor:'pointer', padding:'5px' },
    listActionBtnDelete: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer', padding:'5px' },
    sidebarFooter: { padding: '15px', display: 'flex', gap: '8px', borderTop: '1px solid #333', flexWrap: 'wrap' },
    addBtn: { flex: 1, padding: '10px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { flex: 1.5, padding: '10px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' },
    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor:'#1c1c1e' },
    editorContent: { display: 'flex', flexDirection: 'column', height: '100%' },
    editorHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2c2e' },
    hInput: { fontSize: '20px', background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', outline:'none', width:'100%' },
    artistInput: { fontSize: '14px', background: 'none', border: 'none', color: '#888', outline:'none', width:'100%' },
    btnGroup: { display: 'flex', gap: '6px' },
    showBtn: { padding: '8px 12px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer' },
    saveBtn: { padding: '8px 12px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontSize:'12px', cursor:'pointer' },
    transpBtn: { padding: '6px 10px', border: '1px solid #555', borderRadius: '5px', background: 'none', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    exportBtn: { padding: '6px 10px', backgroundColor: '#444', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize:'11px', display:'flex', alignItems:'center', gap:'5px' },
    mainTextArea: { flex: 1, background: '#1c1c1e', color: '#fff', border: 'none', padding: '20px', fontSize: '17px', fontFamily: 'monospace', outline: 'none', resize: 'none' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '60px' },
    showControls: { display: 'flex', gap: '15px', alignItems:'center' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left' },
    showDrawer: { position:'absolute', top:0, left:0, width:'250px', height:'100%', backgroundColor:'#1c1c1e', zIndex:3000, borderRight:'1px solid #333', padding:'20px', boxShadow:'20px 0 50px rgba(0,0,0,0.8)', display:'flex', flexDirection:'column' },
    drawerHeader: { fontSize:'18px', fontWeight:'bold', marginBottom:'20px', display:'flex', justifyContent:'space-between', color:'#007aff' },
    drawerItem: { padding:'12px', borderBottom:'1px solid #333', cursor:'pointer', fontSize:'14px' },
    drawerItemActive: { padding:'12px', borderBottom:'1px solid #333', cursor:'pointer', fontSize:'14px', backgroundColor:'#007aff22', color:'#007aff', fontWeight:'bold' },
    pageActions: { padding:'50px 0', display:'flex', flexDirection:'column', gap:'20px' },
    pageBtn: { padding:'20px', backgroundColor:'#222', border:'1px solid #444', color:'#888', borderRadius:'10px', fontSize:'16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
    pageBtnNext: { padding:'25px', backgroundColor:'#007aff22', border:'1px solid #007aff', color:'#fff', borderRadius:'10px', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontWeight:'bold', cursor:'pointer' },
    showMetaData: { padding: '15px 20px', backgroundColor: '#2c2c2e', display: 'flex', flexDirection: 'column', gap: '8px' },
    metaRow: { display: 'flex', gap: '10px' },
    metaInput: { flex: 1, background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputSmall: { width: '80px', background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputWide: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaTextArea: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px', resize: 'none', height: '60px' },
    miniItem: { padding: '10px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px' },
    miniItemGarimpo: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'12px', color:'#fff' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    setlistSplit: { display: 'flex', flex: 1 },
    setlistHalf: { flex: 1, borderRight: '1px solid #333', padding: '15px', overflowY: 'auto' },
    wizard: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:4000 },
    wizardCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '20px', textAlign: 'center', maxWidth: '320px', color:'#333' },
    primaryButton: { marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#007aff', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor:'pointer' },
    empty: { flex: 1, display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: '#333' },
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1c1c1e' },
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    inputField: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2c2c2e', color: '#fff' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    processBtn: { padding: '15px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },
    statusText: { marginTop: '10px', color: '#007aff', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' },
    secondaryBtn: { padding: '10px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};