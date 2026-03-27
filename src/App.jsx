import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import Dexie from 'dexie';
import { 
  Plus, Music, Play, Trash2, ChevronLeft, 
  FileUp, ChevronUp, ChevronDown, 
  Type, ListMusic, CheckCircle2, X, RefreshCw, Piano, Info, Activity, Zap, Monitor, Menu, ChevronRight, Download, Save, ClipboardPaste, Loader2, Database, Cloud
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
  const [showInfo, setShowInfo] = useState(false);
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  const [view, setView] = useState('library');
  
  // MIDI / SERVER
  const [isMidiEnabled, setIsMidiEnabled] = useState(false);
  const [midiFlash, setMidiFlash] = useState(false); 
  const [lastSignalUI, setLastSignalUI] = useState("");
  const [allInputs, setAllInputs] = useState([]);
  const [midiLearning, setMidiLearning] = useState(null);
  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);

  // GARIMPO CLOUD
  const [garimpoInput, setGarimpoInput] = useState("");
  const [garimpoQueue, setGarimpoQueue] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState("");
  const [isCloudOnline, setIsCloudOnline] = useState(true);

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
                    setMidiFlash(true); setLastSignalUI(signalId);
                    setTimeout(() => { setMidiFlash(false); setLastSignalUI(""); }, 1500);
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
        showScrollRef.current.scrollBy({ top: (window.innerHeight * 0.45) * dir, behavior: 'smooth' });
    }
  };

  const handleImport = (e, label) => {
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
                for (let sl of data.setlists) {
                    await db.setlists.add({ ...sl, id: undefined });
                }
            }
            refreshData(); alert(`Importado!`);
        } catch (err) { alert("Arquivo inválido."); }
    };
    reader.readAsText(file);
  };

  const triggerDownload = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
  };

  const handleGarimpo = async () => {
      if (garimpoQueue.length === 0) return;
      setIsScraping(true);
      setScrapingStatus("O assistente na nuvem está trabalhando...");

      for (const url of garimpoQueue) {
          try {
              const nameSimple = url.split('/').filter(Boolean).pop();
              setScrapingStatus(`Garimpando: ${nameSimple}...`);
              
              // TENTA A API NA NUVEM (VERCEL)
              const response = await fetch('/api/scrape', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url })
              });
              
              if (!response.ok) throw new Error("Erro na nuvem");
              const song = await response.json();
              
              const exists = await db.songs.where({title: song.title, artist: song.artist}).first();
              if (!exists) {
                  await db.songs.add({ ...song, notes: "" });
              }
          } catch (err) {
              alert("O assistente na nuvem falhou. Tente novamente em alguns instantes.");
              break;
          }
      }
      setIsScraping(false); 
      setScrapingStatus("✅ Músicas adicionadas com sucesso!");
      setGarimpoQueue([]); 
      refreshData();
  };

  return (
    <div style={styles.appContainer}>
      <header style={styles.mainHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <Music color="#007aff" />
            <h1 style={{fontSize:'16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
            <div style={midiFlash ? styles.midiBadgeActive : (isMidiEnabled && allInputs.length > 0 ? styles.midiBadgeOn : styles.midiBadgeOff)}>
                <Zap size={10}/> {midiFlash ? "SINAL!" : "MIDI READY"}
            </div>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
            <label style={styles.headerBtn}><FileUp size={14}/> RESTAURAR BACKUP<input type="file" hidden onChange={(e)=>handleImport(e, "Backup Total")} /></label>
            <button style={styles.headerBtn} onClick={() => triggerDownload({songs, setlists}, `ShowPad_Backup.json`)}><Save size={14}/> GERAR BACKUP</button>
            <button onClick={() => setShowInfo(true)} style={styles.infoBtn}><Info size={22}/></button>
        </div>
      </header>

      <div style={{display:'flex', flex: 1, overflow:'hidden'}}>
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
                            <strong style={{color:'#fff'}}>{item.title}</strong>
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
                    <><button onClick={async () => { const id = await db.songs.add({title:"Nova Música", artist:"Artista", content:""}); refreshData(); setSelectedItem({type:'song', data: await db.songs.get(id)}); }} style={styles.addBtn}>+ MÚSICA</button><label style={styles.importBtnLabel}>IMPORTAR CIFRA<input type="file" hidden onChange={(e)=>handleImport(e, "Cifra")} /></label></>
                ) : view === 'setlists' ? (
                    <><button onClick={async () => { const id = await db.setlists.add({title:"Novo Show", songs:[], location:"", time:"", members:"", notes:""}); refreshData(); setSelectedItem({type:'setlist', data: await db.setlists.get(id)}); }} style={styles.addBtn}>+ NOVO SHOW</button><label style={styles.importBtnLabel}>IMPORTAR SHOW<input type="file" hidden onChange={(e)=>handleImport(e, "Setlist")} /></label></>
                ) : <div style={{color:'#007aff', fontSize:'11px', textAlign:'center', width:'100%', fontWeight:'bold'}}>ASSISTENTE EM NUVEM ATIVO</div>}
            </div>
        </div>

        <div style={styles.mainEditor}>
            {view === 'garimpo' ? (
                <div style={styles.garimpoPanel}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <h2 style={{color: '#fff', margin: 0}}>Garimpar Músicas (Nuvem)</h2>
                        <div style={styles.serverLedOn}>
                            <div style={styles.ledDot}></div>
                            MODO INDEPENDENTE: ON
                        </div>
                    </div>
                    <p style={{fontSize:'14px', color:'#aaa', margin:'10px 0 25px 0'}}>Não é necessário ligar o Mac. O assistente funciona direto no iPad.</p>
                    <div style={styles.inputRow}>
                        <input style={styles.inputField} placeholder="Cole o link do CifraClub..." value={garimpoInput} onChange={e=>setGarimpoInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && (()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}})()}/>
                        <button style={styles.secondaryBtn} onClick={async ()=>{ try {const t = await navigator.clipboard.readText(); setGarimpoInput(t);} catch(e){alert("Cole manualmente")}}}>
                            <ClipboardPaste size={18}/>
                        </button>
                        <button style={styles.addBtn} onClick={()=>{if(garimpoInput){setGarimpoQueue([...garimpoQueue, garimpoInput]);setGarimpoInput("");}}}>OK</button>
                    </div>
                    <div style={styles.scrollList}>
                        {garimpoQueue.map((url,i)=>(<div key={i} style={styles.miniItemGarimpo}><span>{url.replace(/\/$/, "").split('/').pop()}</span><X size={14} onClick={()=>setGarimpoQueue(garimpoQueue.filter((_,idx)=>idx!==i))} style={{cursor:'pointer'}}/></div>))}
                    </div>
                    <button style={styles.processBtn} onClick={handleGarimpo} disabled={isScraping || garimpoQueue.length===0}>
                        {isScraping ? <Loader2 className="spin" size={20}/> : "Garimpar e Salvar"}
                    </button>
                    <div style={styles.statusText}>{scrapingStatus}</div>
                </div>
            ) : selectedItem ? (
                <SongEditor key={selectedItem.data.id} item={selectedItem} triggerDownload={triggerDownload} onClose={() => { setSelectedItem(null); refreshData(); }} onShow={() => setShowMode(true)} update={async (changes) => {
                    if(selectedItem.type==='song') await db.songs.update(selectedItem.data.id, changes);
                    else await db.setlists.update(selectedItem.data.id, changes);
                    setSelectedItem({...selectedItem, data: {...selectedItem.data, ...changes}});
                    refreshData();
                }} />
            ) : <div style={styles.empty}><Music size={80} color="#222" /><h2>ShowPad Pro</h2></div>}
        </div>
      </div>

      {showMode && (
        <div style={styles.showOverlay}>
            <div style={styles.showToolbar}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}><button onClick={() => setShowMode(false)} style={styles.backBtn}><ChevronLeft/> Sair</button></div>
                <div style={{textAlign: 'center', flex:1}}>
                    <strong style={{color:'#fff'}}>{selectedItem.data.title}</strong>
                </div>
                <div style={styles.showControls}>
                    <button onClick={() => setFontSize(f => {const n=f-5; localStorage.setItem('fontSize', n); return n;})}><Type size={14}/>-</button>
                    <button onClick={() => setFontSize(f => {const n=f+5; localStorage.setItem('fontSize', n); return n;})}><Type size={14}/>+</button>
                    <button onClick={() => scrollPage(-1)}><ChevronUp size={20}/></button>
                    <button onClick={() => scrollPage(1)}><ChevronDown size={20}/></button>
                    <button onClick={() => setMidiLearning('up')} style={{color: midiLearning ? '#ff3b30' : '#fff'}}><Piano size={20}/></button>
                </div>
            </div>
            <div ref={showScrollRef} style={{...styles.showContent, fontSize: fontSize + 'px'}}>
                <div style={{fontFamily: 'monospace', color: '#FFFFFF'}}>
                    {selectedItem.type === 'song' ? formatChordsVisual(selectedItem.data.content) : (selectedItem.data.songs || []).map(s => (
                        <div key={s.id} style={{marginBottom:'15vh', borderTop:'1px solid #333', paddingTop:'20px'}}>
                            <h2 style={{color:'#666', fontSize:'0.7em'}}>{s.title}</h2>
                            {formatChordsVisual(s.content)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
      {showInfo && <InfoView onClose={() => setShowInfo(false)} inputs={allInputs} />}
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
                <div style={styles.setlistHalf}><h3>Set List do Show</h3>{(setlist.songs || []).map((s, i) => (<div key={i} style={styles.miniItemReorder}><div style={{flex:1, color:'#fff'}}><b>{i+1}.</b> {s.title}</div><div style={styles.reorderControls}><button onClick={()=>moveSong(i,-1)} disabled={i===0}><ArrowUp size={14}/></button><button onClick={()=>moveSong(i,1)} disabled={i===setlist.songs.length-1}><ArrowDown size={14}/></button><button onClick={()=>{const n=[...setlist.songs]; n.splice(i,1); update({songs:n});}} style={{color:'#ff3b30'}}><Trash2 size={14}/></button></div></div>))}</div>
                <div style={{...styles.setlistHalf, backgroundColor:'#2c2c2e'}}><h3>Clique na Biblioteca Lateral para adicionar músicas</h3></div>
            </div>
        </div>
    );
};

const InfoView = ({ onClose, inputs }) => (
    <div style={styles.wizard}>
        <div style={styles.wizardCard}>
            <h2 style={{color:'#007aff', margin:0}}>Painel ShowPad Pro v13.0</h2>
            <div style={{textAlign:'left', fontSize:'12px', color:'#333', marginTop:'15px'}}>
                <p><b>Autor:</b> Edu Posada | <b>IA:</b> Gemini 1.5 Flash</p>
                <hr/>
                <p><b>MODO NUVEM:</b> O garimpo agora funciona direto no iPad via Vercel API. Não precisa ligar o Mac!</p>
                <p><b>MIDI:</b> {inputs.join(", ") || "Nenhum"}</p>
            </div>
            <button style={styles.primaryButton} onClick={onClose}>Fechar</button>
        </div>
    </div>
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
    listItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#fff' },
    selectedItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#fff' },
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
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000' },
    backBtn: { background:'none', border:'none', color:'#fff', display:'flex', alignItems:'center', cursor:'pointer' },
    midiMenu: { position:'absolute', top:'40px', right:'0', backgroundColor:'#333', borderRadius:'8px', width:'150px', zIndex:3000, overflow:'hidden', boxShadow:'0 10px 20px rgba(0,0,0,0.5)' },
    learnBanner: { backgroundColor:'#ff3b30', color:'#fff', padding:'10px', textAlign:'center', fontSize:'11px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
    wizard: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:4000 },
    wizardCard: { backgroundColor: '#fff', padding: '35px', borderRadius: '20px', textAlign: 'center', maxWidth: '320px', color:'#333' },
    primaryButton: { marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#007aff', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor:'pointer' },
    empty: { flex: 1, display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: '#333' },
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1c1c1e', color: '#fff' },
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    inputField: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#2c2c2e', color: '#fff' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    miniItemGarimpo: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'12px', color:'#fff' },
    processBtn: { padding: '15px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },
    statusText: { marginTop: '10px', color: '#007aff', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' },
    secondaryBtn: { padding: '10px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    serverLedOn: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#34c759', fontWeight: 'bold' },
    serverLedOff: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' },
    ledDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor', boxShadow: '0 0 10px currentColor' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#fff' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    showMetaData: { padding: '15px 20px', backgroundColor: '#2c2c2e', display: 'flex', flexDirection: 'column', gap: '8px' },
    metaRow: { display: 'flex', gap: '10px' },
    metaInput: { flex: 1, background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputSmall: { width: '80px', background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaInputWide: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px' },
    metaTextArea: { background: '#1c1c1e', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '5px', fontSize: '13px', resize: 'none', height: '60px' },
    setlistSplit: { display: 'flex', flex: 1 },
    setlistHalf: { flex: 1, borderRight: '1px solid #333', padding: '15px', overflowY: 'auto' }
};