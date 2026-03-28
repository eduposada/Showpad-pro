import React from 'react';
import { X } from 'lucide-react';

export const SettingsView = ({ onClose, inputs, setMidiLearning, midiLearning, midiStatus, handleImport, styles }) => (
    <div style={styles.wizard}><div style={styles.settingsCard}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h2>Ajustes</h2><X onClick={onClose} style={{cursor:'pointer'}}/></div>
      <div style={styles.settingsSection}><h4>MIDI</h4><div>{midiStatus === 'ready' ? "Conectado" : "Desconectado"}</div>{midiLearning ? <div style={{marginTop:'15px', padding:'10px', background:'#ff3b3022', borderRadius:'10px', border:'1px solid #ff3b30'}}><p style={{margin:0, fontWeight:'bold'}}>CAPTURANDO {midiLearning.toUpperCase()}...</p><button onClick={()=>setMidiLearning(null)} style={{marginTop:'8px', padding:'5px', background:'#ff3b30', color:'#fff', border:'none', borderRadius:'5px'}}>CANCELAR</button></div> : <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button onClick={()=>setMidiLearning('up')} style={styles.learnBtn}>Mapear VOLTAR</button><button onClick={()=>setMidiLearning('down')} style={styles.learnBtn}>Mapear AVANÇAR</button></div>}</div>
      <div style={styles.settingsSection}><h4>Backup</h4><label style={styles.importFullBtn}>RESTAURAR BACKUP (JSON)<input type="file" hidden onChange={(e)=>handleImport(e, "Backup")} /></label></div>
      <button style={styles.primaryButton} onClick={onClose}>Fechar</button>
    </div></div>
);