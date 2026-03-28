import React from 'react';
import { X, FileUp } from 'lucide-react';

export default function SettingsModal({ onClose, inputs, setMidiLearning, midiLearning, midiStatus, handleImport }) {
  return (
    <div style={styles.wizard}>
      <div style={styles.settingsCard}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2>Configurações</h2>
          <X onClick={onClose} style={{cursor:'pointer'}}/>
        </div>
        <div style={styles.settingsSection}>
          <h4>MIDI - {midiStatus === 'ready' ? 'OK' : 'OFF'}</h4>
          <div style={{fontSize:'12px', color: midiStatus === 'ready' ? '#34c759' : '#ff3b30'}}>
            {inputs.length > 0 ? `Hardware: ${inputs.join(", ")}` : "Sem teclados detectados."}
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
        <div style={styles.settingsSection}>
          <h4>Backup</h4>
          <label style={styles.importFullBtn}>RESTAURAR BACKUP (JSON)<input type="file" hidden onChange={(e)=>handleImport(e)} /></label>
        </div>
        <button style={styles.primaryButton} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

const styles = {
    wizard: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:4000 },
    settingsCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '500px', color:'#333', display:'flex', flexDirection:'column' },
    settingsSection: { textAlign:'left', marginBottom:'20px', padding:'15px', backgroundColor:'#f9f9f9', borderRadius:'15px' },
    learnBtn: { flex:1, padding:'12px', backgroundColor:'#007aff', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', cursor:'pointer' },
    learnBtnActive: { flex:1, padding:'12px', backgroundColor:'#ff3b30', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', cursor:'pointer' },
    importFullBtn: { display:'block', width:'100%', padding:'12px', backgroundColor:'#34c759', color:'#fff', borderRadius:'10px', fontSize:'12px', fontWeight:'bold', textAlign:'center', cursor:'pointer' },
    primaryButton: { marginTop: '10px', width: '100%', padding: '15px', backgroundColor: '#1c1c1e', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor:'pointer' }
};