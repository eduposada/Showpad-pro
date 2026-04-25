import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, PanelLeftOpen, Type, ChevronUp, ChevronDown, X, ChevronRight, Zap, RefreshCw, Camera, FileMusic, Settings } from 'lucide-react';
import { formatChordsVisual, transposeContent } from './ShowPadCore';
import { useHandGestures } from './hooks/useHandGestures';
import { mapKeyboardToStageCommand, stageInputEnabled, StageCommand } from './stageControls';

export const ShowModeView = ({
    item,
    fontSize,
    setFontSize,
    scrollPage,
    onClose,
    showScrollRef,
    lastSignal,
    styles,
    midiStatus,
    stageControls,
    onStageCommand,
    onToggleStageCamera,
    onOpenSettings,
    learningAction,
    onLearnGestureSample,
}) => {
    const [idx, setIdx] = useState(0), [dr, setDr] = useState(false);
    const [btnPressed, setBtnPressed] = useState(null); 
    const [tabsVisible, setTabsVisible] = useState(true);
    const keyDebounceRef = useRef({});
    
    // ESTADO DE TRANSPOSIÇÃO VOLÁTIL (v7.1)
    const [tempTranspose, setTempTranspose] = useState(0);
    
    const songsArr = (item && item.type === 'setlist') ? (item.data.songs || []) : (item ? [item.data] : []);
    const song = songsArr[idx];

    // Resetar transposição ao trocar de música na setlist
    useEffect(() => {
        setTempTranspose(0);
    }, [idx]);
    useEffect(() => {
        setTabsVisible(true);
    }, [idx, item?.data?.id]);

    const controlBtnStyle = {
        width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#2c2c2e', border: '1px solid #444', borderRadius: '8px', color: '#fff', cursor: 'pointer'
    };

    const handleNav = (dir) => {
        const newIdx = idx + dir;
        if (newIdx >= 0 && newIdx < songsArr.length) {
            setIdx(newIdx);
            if (showScrollRef.current) showScrollRef.current.scrollTop = 0;
        }
    };

    const executeStageCommand = useCallback((command, source = 'touch') => {
        const upDir = stageControls?.invertScroll ? 1 : -1;
        const downDir = stageControls?.invertScroll ? -1 : 1;
        if (command === StageCommand.SCROLL_UP) scrollPage(upDir);
        if (command === StageCommand.SCROLL_DOWN) scrollPage(downDir);
        if (command === StageCommand.PREV_SONG) handleNav(-1);
        if (command === StageCommand.NEXT_SONG) handleNav(1);
        onStageCommand?.(command, source);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleNav depende de idx atual
    }, [scrollPage, stageControls?.invertScroll, onStageCommand, idx, songsArr.length]);

    useEffect(() => {
        if (!stageInputEnabled(stageControls, 'pedal')) return;
        const onKeyDown = (event) => {
            const command = mapKeyboardToStageCommand(event.code);
            if (!command) return;
            event.preventDefault();
            const now = Date.now();
            const last = keyDebounceRef.current[command] || 0;
            if (now - last < 150) return;
            keyDebounceRef.current[command] = now;
            executeStageCommand(command, 'pedal');
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [stageControls, executeStageCommand]);

    const { videoRef, gestureStatus, gestureError } = useHandGestures({
        enabled: stageInputEnabled(stageControls, 'gestures'),
        cameraEnabled: Boolean(stageControls?.cameraEnabled),
        sensitivity: stageControls?.gestureSensitivity || 'medium',
        gestureBindings: stageControls?.gestureBindings,
        onCommand: executeStageCommand,
        onGestureSample: onLearnGestureSample,
    });

    // PROCESSAMENTO DA CIFRA COM TRANSPOSE TEMPORÁRIO
    const getTransposedContent = () => {
        if (!song) return "Obrigado!";
        let text = song.content;
        if (tempTranspose !== 0) {
            text = transposeContent(text, tempTranspose);
        }
        if (!tabsVisible) {
            text = text
                .split('\n')
                .filter((line) => !isTablatureLine(line))
                .join('\n');
        }
        return formatChordsVisual(text);
    };
    const isTablatureLine = (line) => {
        const t = String(line || '').trim();
        if (!t) return false;
        const explicitString = /^[eEbBgGdDaA]\|/.test(t);
        const fretPattern = /[\-|]{4,}/.test(t) && /\d/.test(t);
        return explicitString || fretPattern;
    };

    // ESTILO DO LED MIDI NO SHOW (v7.1)
    const midiPulse = lastSignal !== "";
    const midiOk = midiStatus === 'ready';
    const gesturesEnabled = stageInputEnabled(stageControls, 'gestures');
    const showCameraPreview = gesturesEnabled && stageControls?.cameraEnabled && stageControls?.cameraPreviewVisible;
    const hasTablature = Boolean(song?.content && song.content.split('\n').some((line) => isTablatureLine(line)));

    return (
        <div style={styles.showOverlay}>
            {/* GAVETA LATERAL */}
            <div style={{
                ...styles.showDrawer,
                transform: dr ? 'translateX(0)' : 'translateX(-100%)',
                visibility: dr ? 'visible' : 'hidden',
                zIndex: 2000
            }}>
                <div style={styles.drawerHeader}>
                    SET LIST ATUAL 
                    <X onClick={() => setDr(false)} style={{ cursor: 'pointer' }} color="#ff3b30" />
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {songsArr.map((s, i) => (
                        <div 
                            key={i} 
                            style={idx === i ? styles.drawerItemActive : styles.drawerItem} 
                            onClick={() => { setIdx(i); setDr(false); if (showScrollRef.current) showScrollRef.current.scrollTop = 0; }}
                        >
                            <span style={{opacity: 0.5, marginRight: '10px'}}>{(i + 1).toString().padStart(2, '0')}</span>
                            {s.title}
                        </div>
                    ))}
                </div>
            </div>

            {/* TOOLBAR SUPERIOR */}
            <div style={{...styles.showToolbar, height: '110px', padding: '10px 20px'}}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => setDr(true)} style={{...controlBtnStyle, backgroundColor: dr ? '#007aff' : '#2c2c2e'}}>
                        <PanelLeftOpen />
                    </button>
                    <button onClick={onClose} style={{...controlBtnStyle, width: 'auto', padding: '0 15px'}}>
                        <ChevronLeft /> Sair
                    </button>
                    
                    {/* INDICADOR MIDI BOLHA NO SHOW (v7.1) */}
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: midiOk ? (midiPulse ? '#4cd964' : '#1e3a1e') : '#3a3a3c',
                        boxShadow: midiPulse ? '0 0 15px #4cd964' : 'none',
                        border: '2px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.1s ease'
                    }}>
                        <Zap size={20} color={midiOk ? (midiPulse ? '#fff' : '#4cd964') : '#888'} fill={midiPulse ? "#fff" : "none"} />
                    </div>
                    {gesturesEnabled && (
                        <>
                            <button
                                type="button"
                                onClick={onToggleStageCamera}
                                title={stageControls?.cameraPreviewVisible ? 'Ocultar imagem da câmera' : 'Mostrar imagem da câmera'}
                                style={{
                                    ...controlBtnStyle,
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: stageControls?.cameraPreviewVisible ? '#007aff' : '#3a3a3c',
                                    borderColor: stageControls?.cameraPreviewVisible ? '#5ac8fa' : '#555',
                                }}
                            >
                                <Camera size={18} />
                            </button>
                            {hasTablature && (
                                <button
                                    type="button"
                                    onClick={() => setTabsVisible((v) => !v)}
                                    title={tabsVisible ? 'Ocultar tablaturas' : 'Mostrar tablaturas'}
                                    style={{
                                        ...controlBtnStyle,
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: tabsVisible ? '#ff9f0a' : '#3a3a3c',
                                        borderColor: tabsVisible ? '#ffbd59' : '#555',
                                    }}
                                >
                                    <FileMusic size={18} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div style={{ flex: 1, textAlign: 'center' }}>
                    <strong style={{ color: '#fff', fontSize: '32px', lineHeight: '1.1', display: 'block', textTransform: 'uppercase' }}>
                        {song ? song.title : "FIM DO SHOW"}
                    </strong>
                    <span style={{ color: '#FFD700', fontSize: '18px', fontWeight: 'bold' }}>
                        {song ? (tempTranspose !== 0 ? `${song.artist} (${tempTranspose > 0 ? '+' : ''}${tempTranspose} ST)` : song.artist) : ""}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        title="Abrir configurações"
                        style={controlBtnStyle}
                    >
                        <Settings size={18} />
                    </button>
                    {/* CONTROLE DE TRANSPOSE TEMPORÁRIO (v7.1) */}
                    <div style={{display:'flex', gap:'4px', backgroundColor:'rgba(0,0,0,0.3)', padding:'4px', borderRadius:'10px', border:'1px solid #444'}}>
                        <button style={{...controlBtnStyle, height:'36px', width:'36px'}} onClick={() => setTempTranspose(t => t - 1)}>-1</button>
                        <div style={{minWidth:'40px', textAlign:'center'}}>
                            <span style={{fontSize:'9px', color:'#aaa', display:'block'}}>TOM</span>
                            <span style={{fontSize:'16px', color:'#FFD700', fontWeight:'bold'}}>{tempTranspose > 0 ? '+' : ''}{tempTranspose}</span>
                        </div>
                        <button style={{...controlBtnStyle, height:'36px', width:'36px'}} onClick={() => setTempTranspose(t => t + 1)}>+1</button>
                        {tempTranspose !== 0 && (
                            <button style={{...controlBtnStyle, height:'36px', width:'36px', backgroundColor:'#ff3b30'}} onClick={() => setTempTranspose(0)}>
                                <RefreshCw size={14} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={controlBtnStyle} onClick={() => setFontSize(f => f - 5)}><Type size={14} />-</button>
                        <button style={controlBtnStyle} onClick={() => setFontSize(f => f + 5)}><Type size={14} />+</button>
                    </div>
                </div>
            </div>

            {/* CONTEÚDO DA CIFRA */}
            <div ref={showScrollRef} style={{ ...styles.showContent, padding: '40px' }}>
                {song && song.notes && (
                    <div style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderLeft: '5px solid #FFD700', padding: '15px', marginBottom: '30px', color: '#FFD700', fontSize: '20px', whiteSpace: 'pre-wrap' }}>
                        <strong>OBSERVAÇÕES:</strong><br/>{song.notes}
                    </div>
                )}
                <div style={{ fontSize: fontSize + 'px', fontFamily: 'monospace', color: '#fff', whiteSpace: 'pre-wrap', paddingBottom: '150px' }}>
                    {getTransposedContent()}
                </div>
            </div>

            {/* RODAPÉ 3D 50/50 */}
            <div style={styles.showFooter}>
                <button 
                    onMouseDown={() => setBtnPressed('prev')}
                    onMouseUp={() => setBtnPressed(null)}
                    onClick={() => executeStageCommand(StageCommand.PREV_SONG, 'touch')}
                    style={{
                        ...styles.navBtn3D,
                        ...(btnPressed === 'prev' ? styles.navBtn3DActive : {}),
                        opacity: idx === 0 ? 0.3 : 1
                    }}
                    disabled={idx === 0}
                >
                    <ChevronLeft size={30}/> ANTERIOR
                </button>

                <button 
                    onMouseDown={() => setBtnPressed('next')}
                    onMouseUp={() => setBtnPressed(null)}
                    onClick={() => executeStageCommand(StageCommand.NEXT_SONG, 'touch')}
                    style={{
                        ...styles.navBtn3D,
                        ...(btnPressed === 'next' ? styles.navBtn3DActive : {}),
                        opacity: idx === songsArr.length - 1 ? 0.3 : 1
                    }}
                    disabled={idx === songsArr.length - 1}
                >
                    PRÓXIMA <ChevronRight size={30}/>
                </button>
            </div>
            {gesturesEnabled && (
                <div style={{ position: 'absolute', bottom: 104, right: 14, background: '#111d', border: '1px solid #333', borderRadius: 8, padding: '6px 8px', fontSize: 11, color: '#8e8e93', zIndex: 40 }}>
                    {learningAction
                        ? `Aprendendo gesto para ${learningAction}...`
                        : gestureError
                            ? `Gestos: ${gestureError}`
                            : `Gestos: ${gestureStatus}`
                    }
                </div>
            )}
            <video
                ref={videoRef}
                playsInline
                muted
                style={showCameraPreview
                    ? {
                        position: 'absolute',
                        top: 120,
                        right: 14,
                        width: 140,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #555',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
                        zIndex: 45,
                        transform: 'scaleX(-1)',
                        background: '#000',
                    }
                    : { position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            />
        </div>
    );
};