// [Mantenha seus imports originais no topo]
// Adicione runFullBackup nos imports de ShowPadCore
import { db, transposeContent, supabase, triggerDL, pushToCloud, pullFromCloud, runFullBackup } from './ShowPadCore';

export default function App() {
  // ... [Mantenha todos os seus states originais]

  // FUNÇÕES DE SEGURANÇA v7.2
  const handleExportSingleSong = (song) => {
    const data = { type: 'SINGLE_SONG', data: song };
    triggerDL(data, `${song.title.replace(/\s+/g, '_')}.showpad`);
  };

  const handleImport = (e, targetMode) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        
        // Suporte para Backup Total
        if (d.type === "FULL_BACKUP") {
            if (d.songs) for (let s of d.songs) await db.songs.put({ ...s, id: undefined, creator_id: session.user.id });
            if (d.setlists) for (let sl of d.setlists) await db.setlists.put({ ...sl, id: undefined, creator_id: session.user.id });
            alert("Backup Total Restaurado!");
        } 
        // Suporte para Música Individual
        else if (d.type === "SINGLE_SONG") {
            await db.songs.add({ ...d.data, id: undefined, creator_id: session.user.id });
            alert("Música importada!");
        }
        // Suporte legado
        else if (targetMode === 'library' && d.songs) {
          for (let s of d.songs) await db.songs.put({ ...s, id: undefined, creator_id: session.user.id });
        }
        refreshData();
      } catch (err) { alert("Erro ao processar arquivo."); }
    };
    reader.readAsText(e.target.files[0]);
  };

  // ... [Mantenha o restante das suas funções: initMidi, refreshData, etc]

  return (
    <div style={styles.appContainer}>
      {/* ... Cabeçalho Original ... */}
      
      {/* No seu Editor, você pode passar a função de exportar individualmente */}
      <div style={{ display:'flex', flex: 1, overflow:'hidden', width: '100%' }}>
        {/* ... Sidebar Original ... */}

        <div style={styles.mainEditor}>
          {view === 'garimpo' ? <GarimpoView isServerOnline={isServerOnline} styles={styles} refresh={refreshData} session={session} />
          : view === 'bands' ? <BandView session={session} styles={styles} onSelectShow={openBandShow} />
          : selectedItem ? (
            <div style={{position:'relative', height:'100%'}}>
               {selectedItem.type === 'song' && (
                 <button 
                  onClick={() => handleExportSingleSong(selectedItem.data)}
                  style={{position:'absolute', top: 10, right: 150, zIndex: 10, padding:'5px 10px', fontSize:'10px', backgroundColor:'#555', color:'#fff', border:'none', borderRadius:'5px', cursor:'pointer'}}
                 >
                   EXPORTAR .SHOWPAD
                 </button>
               )}
               <MainEditor key={selectedItem.data.id} item={selectedItem} songs={songs} bands={bands} triggerDL={triggerDL} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} styles={styles} />
            </div>
          )
          : <div style={styles.empty}>...</div>}
        </div>
      </div>

      {showMode && <ShowModeView item={selectedItem} fontSize={fontSize} setFontSize={setFontSize} scrollPage={scrollPage} onClose={()=>setShowMode(false)} showScrollRef={showScrollRef} lastSignal={lastSignalUI} styles={styles} midiStatus={midiStatus} />}
      
      {/* BOTÃO DE BACKUP TOTAL DENTRO DO SETTINGS */}
      {showSettings && (
        <div style={styles.modalOverlay}>
            <SettingsView 
                onClose={()=>setShowSettings(false)} 
                inputs={allInputs} 
                setMidiLearning={setMidiLearning} 
                midiLearning={midiLearning} 
                midiStatus={midiStatus} 
                handleImport={handleImport} 
                styles={styles} 
            />
            {/* Adicionado Botão de Backup na base da modal de Settings */}
            <div style={{position:'absolute', bottom: 80, left:'50%', transform:'translateX(-50%)'}}>
                <button 
                    onClick={runFullBackup}
                    style={{padding:'10px 20px', backgroundColor:'#28a745', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}
                >
                    📥 BAIXAR BACKUP TOTAL (JSON)
                </button>
            </div>
        </div>
      )}
    </div>
  );
}