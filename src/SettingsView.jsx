import React from 'react';
import { X, Zap, Database, ChevronLeft, ChevronRight, Ban, Camera, Keyboard } from 'lucide-react';
import { GESTURE_PRESETS, GESTURE_TOKEN_OPTIONS, gestureBindingConflicts } from './stageControls';

export const SettingsView = ({
  onClose,
  inputs,
  setMidiLearning,
  midiLearning,
  midiStatus,
  handleImport,
  styles,
  stageControls,
  onStageControlsChange,
  onApplyGesturePreset,
  onStartGestureLearning,
  onCancelGestureLearning,
  onStageCommandTest,
  lastStageCommand,
  learningAction,
}) => (
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

        {/* SEÇÃO CONTROLES DE PALCO */}
        <div style={styles.settingsSection}>
          <span style={styles.settingsLabel}>CONTROLES DE PALCO</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>MÉTODO DE ENTRADA</label>
            <select
              value={stageControls?.inputMode || 'touch'}
              onChange={(e) => onStageControlsChange?.({ inputMode: e.target.value })}
              style={{ ...styles.inputField, height: 40, fontSize: 12 }}
            >
              <option value="touch">Toque</option>
              <option value="pedal">Pedal HID</option>
              <option value="gestures">Gestos por Câmera</option>
              <option value="pedal+gestures">Pedal + Gestos</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#ccc', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean(stageControls?.invertScroll)}
                onChange={(e) => onStageControlsChange?.({ invertScroll: e.target.checked })}
              />
              Inverter rolagem
            </label>

            <label style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>SENSIBILIDADE DOS GESTOS</label>
            <select
              value={stageControls?.gestureSensitivity || 'medium'}
              onChange={(e) => onStageControlsChange?.({ gestureSensitivity: e.target.value })}
              style={{ ...styles.inputField, height: 40, fontSize: 12 }}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>

            <label style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>PRESET DE GESTOS</label>
            <select
              value={stageControls?.gesturePreset || 'default'}
              onChange={(e) => onApplyGesturePreset?.(e.target.value)}
              style={{ ...styles.inputField, height: 40, fontSize: 12 }}
            >
              <option value="default">Default (2 dedos/rock)</option>
              <option value="palm">Palma + swipe</option>
              <option value="swipe">Swipe predominante</option>
            </select>

            <label style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>MAPEAMENTO POR AÇÃO</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>Subir</span>
              <select
                value={stageControls?.gestureBindings?.scroll_up || GESTURE_PRESETS.default.scroll_up}
                onChange={(e) => onStageControlsChange?.({ gestureBindings: { ...stageControls?.gestureBindings, scroll_up: e.target.value } })}
                style={{ ...styles.inputField, height: 34, fontSize: 11 }}
              >
                {GESTURE_TOKEN_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button type="button" style={{ ...styles.headerBtn, fontSize: 10, height: 34 }} onClick={() => onStartGestureLearning?.('scroll_up')}>
                Aprender
              </button>

              <span style={{ fontSize: 11, color: '#aaa' }}>Descer</span>
              <select
                value={stageControls?.gestureBindings?.scroll_down || GESTURE_PRESETS.default.scroll_down}
                onChange={(e) => onStageControlsChange?.({ gestureBindings: { ...stageControls?.gestureBindings, scroll_down: e.target.value } })}
                style={{ ...styles.inputField, height: 34, fontSize: 11 }}
              >
                {GESTURE_TOKEN_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button type="button" style={{ ...styles.headerBtn, fontSize: 10, height: 34 }} onClick={() => onStartGestureLearning?.('scroll_down')}>
                Aprender
              </button>

              <span style={{ fontSize: 11, color: '#aaa' }}>Próxima</span>
              <select
                value={stageControls?.gestureBindings?.next_song || GESTURE_PRESETS.default.next_song}
                onChange={(e) => onStageControlsChange?.({ gestureBindings: { ...stageControls?.gestureBindings, next_song: e.target.value } })}
                style={{ ...styles.inputField, height: 34, fontSize: 11 }}
              >
                {GESTURE_TOKEN_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button type="button" style={{ ...styles.headerBtn, fontSize: 10, height: 34 }} onClick={() => onStartGestureLearning?.('next_song')}>
                Aprender
              </button>
            </div>
            {learningAction && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2a2210', border: '1px solid #ff950055', borderRadius: 8, padding: '8px 10px' }}>
                <span style={{ fontSize: 11, color: '#ffcc6b', fontWeight: 700 }}>
                  Aprendendo gesto para: {learningAction}
                </span>
                <button type="button" onClick={onCancelGestureLearning} style={{ ...styles.headerBtn, color: '#ff3b30', borderColor: '#ff3b30', fontSize: 10 }}>
                  Cancelar
                </button>
              </div>
            )}
            {gestureBindingConflicts(stageControls?.gestureBindings || {}).length > 0 && (
              <p style={{ fontSize: 10, color: '#ff9500', margin: 0 }}>
                Atenção: há gestos repetidos em mais de uma ação.
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => onStageCommandTest?.('scroll_up', 'test')} style={{ ...styles.headerBtn, fontSize: 10 }}>
                <Keyboard size={14} /> TESTE CIMA
              </button>
              <button type="button" onClick={() => onStageCommandTest?.('scroll_down', 'test')} style={{ ...styles.headerBtn, fontSize: 10 }}>
                <Keyboard size={14} /> TESTE BAIXO
              </button>
              <button type="button" onClick={() => onStageCommandTest?.('prev_song', 'test')} style={{ ...styles.headerBtn, fontSize: 10 }}>
                <ChevronLeft size={14} /> TESTE ANT
              </button>
              <button type="button" onClick={() => onStageCommandTest?.('next_song', 'test')} style={{ ...styles.headerBtn, fontSize: 10 }}>
                <ChevronRight size={14} /> TESTE PRÓX
              </button>
            </div>
            <p style={{ fontSize: 10, color: '#666', margin: 0 }}>
              Último comando: <span style={{ color: '#fff' }}>{lastStageCommand || 'nenhum'}</span>
            </p>
            <p style={{ fontSize: 10, color: '#666', margin: 0, lineHeight: 1.4 }}>
              <Camera size={11} style={{ display: 'inline', marginRight: 4 }} />
              Gestos só atuam no Modo Show e usam câmera local (sem envio para nuvem).
            </p>
          </div>
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