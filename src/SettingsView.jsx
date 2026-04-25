import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Zap, Database, ChevronLeft, ChevronRight, Ban, Camera, Keyboard, TestTube2 } from 'lucide-react';
import { useHandGestures } from './hooks/useHandGestures';
import { GESTURE_PRESETS, GESTURE_TOKEN_OPTIONS, gestureBindingConflicts, mapKeyboardToStageCommand, StageCommand, stageInputEnabled } from './stageControls';

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
}) => {
  const [testModeOpen, setTestModeOpen] = useState(false);
  const [testFlash, setTestFlash] = useState({});
  const keyDebounceRef = useRef({});
  const gesturesEnabled = stageInputEnabled(stageControls, 'gestures');
  const pedalEnabled = stageInputEnabled(stageControls, 'pedal');
  const sensitivity = stageControls?.gestureSensitivity || 'medium';

  const handleTestCommand = useCallback((command, source) => {
    setTestFlash((prev) => ({ ...prev, [command]: Date.now() }));
    onStageCommandTest?.(command, source);
  }, [onStageCommandTest]);

  const { videoRef, gestureStatus, gestureError } = useHandGestures({
    enabled: testModeOpen && gesturesEnabled,
    cameraEnabled: testModeOpen,
    sensitivity,
    gestureBindings: stageControls?.gestureBindings,
    onCommand: (command) => handleTestCommand(command, 'gesture-test'),
  });

  useEffect(() => {
    if (!testModeOpen || !pedalEnabled) return undefined;
    const onKeyDown = (event) => {
      const command = mapKeyboardToStageCommand(event.code);
      if (!command) return;
      event.preventDefault();
      const now = Date.now();
      const last = keyDebounceRef.current[command] || 0;
      if (now - last < 150) return;
      keyDebounceRef.current[command] = now;
      handleTestCommand(command, 'pedal-test');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [testModeOpen, pedalEnabled, handleTestCommand]);

  const isFlashing = (command) => Date.now() - (testFlash[command] || 0) < 550;

  return (
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
              <option value="oneFinger">1 dedo (cima/baixo)</option>
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

              <span style={{ fontSize: 11, color: '#aaa' }}>Anterior</span>
              <select
                value={stageControls?.gestureBindings?.prev_song || GESTURE_PRESETS.default.prev_song}
                onChange={(e) => onStageControlsChange?.({ gestureBindings: { ...stageControls?.gestureBindings, prev_song: e.target.value } })}
                style={{ ...styles.inputField, height: 34, fontSize: 11 }}
              >
                {GESTURE_TOKEN_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button type="button" style={{ ...styles.headerBtn, fontSize: 10, height: 34 }} onClick={() => onStartGestureLearning?.('prev_song')}>
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

            <button type="button" onClick={() => setTestModeOpen(true)} style={{ ...styles.headerBtn, height: 40, fontSize: 11, width: '100%' }}>
              <TestTube2 size={15} /> ABRIR TESTE/CALIBRAÇÃO
            </button>
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

      </div>
      <div style={{ borderTop: '1px solid #333', padding: '14px 20px', background: '#1c1c1e' }}>
        <button 
          style={{...styles.addBtn, height: '46px', fontSize: '14px'}} 
          onClick={onClose}
        >
          CONCLUIR AJUSTES
        </button>
      </div>
      {testModeOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#1c1c1e', border: '1px solid #3a3a3c', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: '#fff' }}>Teste/Calibração de Comandos</strong>
              <button onClick={() => setTestModeOpen(false)} style={{ ...styles.headerBtn, color: '#ff3b30', borderColor: '#ff3b30', fontSize: 10 }}>
                <X size={14} /> FECHAR
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <button type="button" onClick={() => handleTestCommand(StageCommand.SCROLL_UP, 'manual-test')} style={{ border: '1px solid #3a3a3c', borderRadius: 8, padding: '10px 8px', background: isFlashing(StageCommand.SCROLL_UP) ? '#34c759' : '#2a2a2d', color: isFlashing(StageCommand.SCROLL_UP) ? '#03220d' : '#fff', fontWeight: 700 }}>PAG ↑</button>
              <button type="button" onClick={() => handleTestCommand(StageCommand.SCROLL_DOWN, 'manual-test')} style={{ border: '1px solid #3a3a3c', borderRadius: 8, padding: '10px 8px', background: isFlashing(StageCommand.SCROLL_DOWN) ? '#34c759' : '#2a2a2d', color: isFlashing(StageCommand.SCROLL_DOWN) ? '#03220d' : '#fff', fontWeight: 700 }}>PAG ↓</button>
              <button type="button" onClick={() => handleTestCommand(StageCommand.NEXT_SONG, 'manual-test')} style={{ border: '1px solid #3a3a3c', borderRadius: 8, padding: '10px 8px', background: isFlashing(StageCommand.NEXT_SONG) ? '#34c759' : '#2a2a2d', color: isFlashing(StageCommand.NEXT_SONG) ? '#03220d' : '#fff', fontWeight: 700 }}>PRÓX MÚSICA</button>
              <button type="button" onClick={() => handleTestCommand(StageCommand.PREV_SONG, 'manual-test')} style={{ border: '1px solid #3a3a3c', borderRadius: 8, padding: '10px 8px', background: isFlashing(StageCommand.PREV_SONG) ? '#34c759' : '#2a2a2d', color: isFlashing(StageCommand.PREV_SONG) ? '#03220d' : '#fff', fontWeight: 700 }}>MÚSICA ANT</button>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <video ref={videoRef} playsInline muted style={{ width: 170, height: 120, borderRadius: 8, border: '1px solid #555', objectFit: 'cover', background: '#000', transform: 'scaleX(-1)' }} />
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.45, flex: 1 }}>
                <p style={{ margin: 0 }}>
                  Status Gestos: <span style={{ color: '#fff' }}>{gestureError ? `erro: ${gestureError}` : gestureStatus}</span>
                </p>
                <p style={{ margin: '6px 0 0 0' }}>
                  Você pode testar por toque (botões acima), pedal HID e gestos configurados.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};