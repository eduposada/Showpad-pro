import React from 'react';
import { X, Zap, Database, ChevronUp, ChevronDown, Ban, Settings, Cpu } from 'lucide-react';

export const SettingsView = ({ onClose, inputs, setMidiLearning, midiLearning, midiStatus, handleImport, styles }) => {
  return (
    <div style={styles.settingsOverlay}>
      <div style={styles.settingsCard}>
        
        {/* CABEÇALHO */}
        <div style={styles.settingsHeader}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <Settings size={20} color="#007aff" />
            <h2 style={styles.settingsTitle}>CONFIGURAÇÕES DO SISTEMA</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>

        <div style={styles.settingsContent}>
          
          {/* CARD MIDI */}
          <div style={styles.settingsSection}>
            <span style={styles.settingsLabel}>Interface MIDI</span>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom: '5px'}}>
              <Cpu size={18} color={midiStatus === 'ready' ? '#34c759' : '#ff3b30'} />
              <span style={{fontSize:'14px', color: '#fff', fontWeight:'bold'}}>
                {midiStatus === 'ready' ? "Hardware Conectado" : "Nenhum Dispositivo"}
              </span>
            </div>
            <small style={{color: '#666', fontSize: '11px'}}>
              {inputs.length > 0 ? `Ativo: ${inputs.join(", ")}` : "Conecte um teclado ou pedal USB para iniciar."}
            </small>

            <div style={{marginTop: '10px', borderTop: '1px solid #3d3d3d', paddingTop: '15px'}}>
              <span style={{...styles.settingsLabel, color: '#888', marginBottom: '10px', display: 'block'}}>Mapeamento de Pedais</span>
              
              {midiLearning ? (
                <div style={{textAlign:'center'}}>
                  <p style={{margin:'0 0 10px 0', fontWeight:'bold', fontSize:'11px', color: '#007aff', textTransform: 'uppercase'}}>
                    Aguardando sinal para: {midiLearning === 'up' ? "Subir Página" : "Descer Página"}
                  </p>
                  <div style={styles.midiSignalBox}>
                    PISE NO PEDAL AGORA
                  </div>
                  <button 
                    onClick={() => setMidiLearning(null)} 
                    style={{...styles.primaryButton, backgroundColor: '#ff3b30', marginTop: '15px', height: '40px'}}
                  >
                    <Ban size={14} /> CANCELAR
                  </button>
                </div>
              ) : (
                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={() => setMidiLearning('up')} style={{...styles.primaryButton, flex: 1, backgroundColor: '#1c1c1e', border: '1px solid #444', height: '45px', fontSize: '12px'}}>
                    <ChevronUp size={16} /> MAPEAR SUBIR
                  </button>
                  <button onClick={() => setMidiLearning('down')} style={{...styles.primaryButton, flex: 1, backgroundColor: '#1c1c1e', border: '1px solid #444', height: '45px', fontSize: '12px'}}>
                    <ChevronDown size={16} /> MAPEAR DESCER
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CARD BACKUP */}
          <div style={styles.settingsSection}>
            <span style={styles.settingsLabel}>Banco de Dados</span>
            <label style={{...styles.primaryButton, backgroundColor: '#34c759', height: '45px', fontSize: '13px', margin: 0}}>
              <Database size={16} /> RESTAURAR BACKUP (JSON)
              <input type="file" hidden onChange={(e) => handleImport(e, "library")} />
            </label>
            <p style={{fontSize:'10px', color: '#666', textAlign: 'center', marginTop: '5px'}}>
              O sistema mesclará as músicas do arquivo com sua biblioteca atual.
            </p>
          </div>

          {/* BOTÃO CONCLUIR NO RODAPÉ DO CONTEÚDO */}
          <button 
            style={{...styles.primaryButton, marginTop: '10px', boxShadow: '0 4px 15px rgba(0,122,255,0.3)'}} 
            onClick={onClose}
          >
            SALVAR E SAIR
          </button>

        </div>
      </div>
    </div>
  );
};