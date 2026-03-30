import React from 'react';
import { X, Zap, Database, ChevronLeft, ChevronRight, Ban } from 'lucide-react';

export const SettingsView = ({ onClose, inputs, setMidiLearning, midiLearning, midiStatus, handleImport, styles }) => (
  <div style={styles.settingsOverlay}>
    <div style={styles.settingsCard}>
      
      {/* CABEÇALHO DO PAINEL */}
      <div style={styles.settingsHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <Zap size={20} color="#007aff" />
          <h2 style={styles.settingsTitle}>PAINEL DE CONFIGURAÇÕES</h2>
        </div>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
      </div>

      <div style={styles.settingsContent}>
        
        {/* SEÇÃO MIDI */}
        <div style={styles.settingsSection}>
          <span style={styles.settingsLabel}>COMANDOS MIDI</span>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
            <span style={{fontSize:'13px', color: midiStatus === 'ready' ? '#34c759' : '#ff3b30', fontWeight:'bold'}}>
              STATUS: {midiStatus === 'ready' ? "DISPOSITIVO PRONTO" : "DESCONECTADO"}
            </span>
          </div>

          {midiLearning ? (
            <div style={{textAlign:'center', padding: '10px'}}>
              <p style={{margin:'0 0 10px 0', fontWeight:'bold', fontSize:'11px', color: '#ff3b30'}}>
                AGUARDANDO SINAL PARA: <span style={{color:'#fff', fontSize: '14px'}}>{midiLearning.toUpperCase()}</span>
              </p>
              <div style={styles.midiSignalBox}>
                TOQUE NO PEDAL / TECLA...
              </div>
              <button 
                onClick={() => setMidiLearning(null)} 
                style={{...styles.saveBtn, backgroundColor: '#ff3b30', marginTop: '15px', width: '100%'}}
              >
                <Ban size={14} /> CANCELAR MAPEAMENTO
              </button>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={() => setMidiLearning('up')} style={{...styles.headerBtn, flex: 1, height: '45px'}}>
                  <ChevronLeft size={16} /> MAPEAR VOLTAR
                </button>
                <button onClick={() => setMidiLearning('down')} style={{...styles.headerBtn, flex: 1, height: '45px'}}>
                  <ChevronRight size={16} /> MAPEAR AVANÇAR
                </button>
              </div>
              <p style={{fontSize:'10px', color: '#666', textAlign: 'center', marginTop: '5px'}}>
                Toque no botão acima e pressione o pedal MIDI para vincular.
              </p>
            </div>
          )}
        </div>

        {/* SEÇÃO BACKUP / RESTAURAÇÃO */}
        <div style={styles.settingsSection}>
          <span style={styles.settingsLabel}>SISTEMA DE ARQUIVOS</span>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <label style={{...styles.importBtnLabel, cursor: 'pointer'}}>
              <Database size={16} style={{marginRight:'8px'}} /> RESTAURAR BACKUP (JSON)
              <input type="file" hidden onChange={(e) => handleImport(e, "library")} />
            </label>
            <p style={{fontSize:'10px', color: '#666', textAlign: 'center'}}>
              A restauração via JSON adicionará músicas sem apagar as atuais.
            </p>
          </div>
        </div>

        {/* BOTÃO CONCLUIR */}
        <button 
          style={{...styles.addBtn, height: '50px', fontSize: '14px', marginTop: '10px'}} 
          onClick={onClose}
        >
          CONCLUIR AJUSTES
        </button>

      </div>
    </div>
  </div>
);