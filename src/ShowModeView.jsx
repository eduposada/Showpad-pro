import React, { useState } from 'react';
import { ChevronLeft, PanelLeftOpen, Type, ChevronUp, ChevronDown, X, ChevronRight } from 'lucide-react';
import { formatChordsVisual } from './ShowPadCore';

export const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, onClose, showScrollRef, lastSignal, styles }) => {
    const [idx, setIdx] = useState(0), [dr, setDr] = useState(false);
    const songsArr = (item && item.type === 'setlist') ? (item.data.songs || []) : (item ? [item.data] : []);
    const song = songsArr[idx];

    const controlBtnStyle = {
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2c2c2e',
        border: '1px solid #444',
        borderRadius: '8px',
        color: '#fff',
        cursor: 'pointer'
    };

    return (
        <div style={styles.showOverlay}>
            {/* GAVETA LATERAL COM ANIMAÇÃO DE SLIDE */}
            <div style={{
                ...styles.showDrawer,
                transform: dr ? 'translateX(0)' : 'translateX(-100%)',
                visibility: dr ? 'visible' : 'hidden'
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
                            onClick={() => { 
                                setIdx(i); 
                                setDr(false); 
                                if (showScrollRef.current) showScrollRef.current.scrollTop = 0; 
                            }}
                        >
                            <span style={{opacity: 0.5, marginRight: '10px'}}>{(i + 1).toString().padStart(2, '0')}</span>
                            {s.title}
                        </div>
                    ))}
                </div>
                <div style={{padding: '20px', borderTop: '1px solid #333', fontSize: '10px', color: '#444'}}>
                    SHOWPAD PRO HUD v2.0
                </div>
            </div>

            {/* TOOLBAR REFORMULADA */}
            <div style={{...styles.showToolbar, height: '100px', padding: '10px 20px'}}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                        onClick={() => setDr(true)} 
                        style={{...controlBtnStyle, backgroundColor: dr ? '#007aff' : '#2c2c2e'}}
                    >
                        <PanelLeftOpen />
                    </button>
                    <button onClick={onClose} style={{...controlBtnStyle, width: 'auto', padding: '0 15px'}}>
                        <ChevronLeft /> Sair
                    </button>
                </div>

                {/* BLOCO CENTRAL */}
                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <strong style={{ color: '#fff', fontSize: '36px', lineHeight: '1', display: 'block', textTransform: 'uppercase' }}>
                        {song ? song.title : "FIM DO SHOW"}
                    </strong>
                    <span style={{ color: '#FFD700', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
                        {song ? song.artist : ""}
                    </span>
                    {lastSignal && <div style={styles.midiProbeFloating}>MIDI: {lastSignal}</div>}
                </div>

                {/* BPM E CONTROLES */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ 
                        backgroundColor: '#000', 
                        border: '2px solid #007aff', 
                        borderRadius: '8px', 
                        padding: '5px 12px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        marginRight: '10px'
                    }}>
                        <span style={{fontSize: '9px', color: '#007aff', fontWeight: 'bold'}}>BPM</span>
                        <span style={{fontSize: '20px', color: '#007aff', fontWeight: 'bold', fontFamily: 'monospace'}}>
                            {song?.bpm || "---"}
                        </span>
                    </div>

                    <button style={controlBtnStyle} onClick={() => setFontSize(f => f - 5)}><Type size={18} />-</button>
                    <button style={controlBtnStyle} onClick={() => setFontSize(f => f + 5)}><Type size={18} />+</button>
                    <button style={controlBtnStyle} onClick={() => scrollPage(-1)}><ChevronUp size={24} /></button>
                    <button style={controlBtnStyle} onClick={() => scrollPage(1)}><ChevronDown size={24} /></button>
                </div>
            </div>

            {/* CONTEÚDO */}
            <div ref={showScrollRef} style={{ ...styles.showContent, padding: '40px' }}>
                {song && song.notes && (
                    <div style={{
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderLeft: '5px solid #FFD700',
                        padding: '15px',
                        marginBottom: '30px',
                        borderRadius: '4px',
                        color: '#FFD700',
                        fontSize: '20px',
                        fontFamily: 'sans-serif',
                        whiteSpace: 'pre-wrap'
                    }}>
                        <strong>OBSERVAÇÕES:</strong><br/>
                        {song.notes}
                    </div>
                )}
                
                <div style={{ fontSize: fontSize + 'px', fontFamily: 'monospace', color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {song ? formatChordsVisual(song.content) : "Obrigado!"}
                </div>

                {item && item.type === 'setlist' && (
                    <div style={styles.pageActions}>
                        {idx > 0 && <button style={styles.pageBtn} onClick={() => { setIdx(idx - 1); if (showScrollRef.current) showScrollRef.current.scrollTop = 0; }}><ChevronLeft /> ANTERIOR</button>}
                        {idx < songsArr.length - 1 && <button style={styles.pageBtnNext} onClick={() => { setIdx(idx + 1); if (showScrollRef.current) showScrollRef.current.scrollTop = 0; }}>PRÓXIMA <ChevronRight /></button>}
                    </div>
                )}
            </div>
        </div>
    );
};