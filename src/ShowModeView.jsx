import React, { useState, useEffect } from 'react';
import { ChevronLeft, PanelLeftOpen, Type, ChevronUp, ChevronDown, X, ChevronRight, Zap, RefreshCw } from 'lucide-react';
import { formatChordsVisual, transposeContent } from './ShowPadCore';

export const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, onClose, showScrollRef, lastSignal, styles, midiStatus }) => {
    const [idx, setIdx] = useState(0), [dr, setDr] = useState(false);
    const [btnPressed, setBtnPressed] = useState(null); 
    
    // ESTADO DE TRANSPOSIÇÃO VOLÁTIL (v7.1)
    const [tempTranspose, setTempTranspose] = useState(0);
    
    const songsArr = (item && item.type === 'setlist') ? (item.data.songs || []) : (item ? [item.data] : []);
    const song = songsArr[idx];

    // Resetar transposição ao trocar de música na setlist
    useEffect(() => {
        setTempTranspose(0);
    }, [idx]);

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

    // PROCESSAMENTO DA CIFRA COM TRANSPOSE TEMPORÁRIO
    const getTransposedContent = () => {
        if (!song) return "Obrigado!";
        let text = song.content;
        if (tempTranspose !== 0) {
            text = transposeContent(text, tempTranspose);
        }
        return formatChordsVisual(text);
    };

    // ESTILO DO LED MIDI NO SHOW (v7.1)
    const midiPulse = lastSignal !== "";
    const midiOk = midiStatus === 'ready';

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
                    onClick={() => handleNav(-1)}
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
                    onClick={() => handleNav(1)}
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
        </div>
    );
};