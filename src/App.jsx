import React, { useState, useEffect, useRef } from 'react';
import { db, supabase, triggerDL } from './MusicEngine';
import { MainEditor } from './EditorComponents';
import { ShowModeView } from './ShowModeView';
import { SettingsView } from './SettingsView';
import { AuthView } from './AuthView';
import { BandView } from './BandView';
import { GarimpoView } from './GarimpoView';
import { Header, Sidebar } from './LayoutComponents';
import { useShowPad } from './useShowPad';
import { styles } from './Styles';

export default function App() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [view, setView] = useState('library');
  const [sortBy, setSortBy] = useState('title');
  const [showMode, setShowMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(30);

  const { session, setSession, songs, setlists, midiStatus, midiFlash, allInputs, lastSignal, midiLearning, setMidiLearning, isServerOnline, refreshData, initMidi } = useShowPad(sortBy, selectedItem, setSelectedItem);
  const showScrollRef = useRef(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then((res) => setSession(res.data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const scrollPage = (d) => { if (showScrollRef.current) showScrollRef.current.scrollBy({ top: (window.innerHeight * 0.45) * d, behavior: 'smooth' }); };
  useEffect(() => {
    const handleUp = () => scrollPage(-1); const handleDown = () => scrollPage(1);
    window.addEventListener('scroll-up', handleUp); window.addEventListener('scroll-down', handleDown);
    return () => { window.removeEventListener('scroll-up', handleUp); window.removeEventListener('scroll-down', handleDown); };
  }, []);

  if (!session) return <AuthView styles={styles} />;

  return (
    <div style={styles.appContainer}>
      <Header midiFlash={midiFlash} midiStatus={midiStatus} allInputs={allInputs} session={session} triggerDL={(d,f)=>{const u=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));const l=document.createElement('a');l.href=u;l.download=f;l.click();}} setShowSettings={setShowSettings} songs={songs} setlists={setlists} handleImport={()=>{}} styles={styles} />
      <div style={{display:'flex', flex: 1, overflow:'hidden'}}>
        <Sidebar view={view} setView={setView} sortBy={sortBy} setSortBy={setSortBy} songs={songs} setlists={setlists} selectedItem={selectedItem} setSelectedItem={setSelectedItem} setShowMode={setShowMode} refreshData={refreshData} session={session} styles={styles} />
        <div style={styles.mainEditor}>
          {view === 'garimpo' ? <GarimpoView isServerOnline={isServerOnline} styles={styles} refresh={refreshData} session={session} />
          : view === 'bands' ? <BandView session={session} styles={styles} />
          : selectedItem ? <MainEditor item={selectedItem} songs={songs} triggerDL={(d,f)=>{}} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} styles={styles} />
          : <div style={styles.empty}><h2>ShowPad Pro</h2></div>}
        </div>
      </div>
      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={()=>setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignal} styles={styles} />}
      {showSettings && <SettingsView onClose={()=>setShowSettings(false)} inputs={allInputs} setMidiLearning={setMidiLearning} midiLearning={midiLearning} midiStatus={midiStatus} styles={styles} />}
    </div>
  );
}