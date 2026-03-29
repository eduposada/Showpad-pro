import React, { useState } from 'react';
import { ChevronLeft, Menu, Type, ChevronUp, ChevronDown, X, ChevronRight } from 'lucide-react';
import { formatChordsVisual } from './ShowPadCore';

export const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, onClose, showScrollRef, lastSignal, styles }) => {
    const [idx, setIdx] = useState(0);
    const [dr, setDr] = useState(false); // Controle da gaveta (Drawer)
    
    // Se for um setlist, usa o array de músicas. Se for música única, cria um array de um item só.
    const songsArr = (item && item.type === 'setlist') ? (item.data.songs || []) : (item ? [item.data] : []);
    const song = songsArr[idx];

    return (
        <div style={styles.showOverlay}>
            {/* GAVETA LATERAL ESCAMOTEÁVEL */}
            {dr && (
                <div style={styles.showDrawer}>
                    <div style={styles.drawerHeader}>
                        SET LIST 
                        <X onClick={() => setDr(false)} style={{ cursor: 'pointer' }} />
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
                                {i + 1}. {s.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOOLBAR DO PALCO */}
            <div style={styles.showToolbar}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={() => setDr(true)} style={styles.backBtn} title="Lista de Músicas"><Menu /></button>
                    <button onClick={onClose} style={styles.backBtn}><ChevronLeft /> Sair</button>
                </div>
                
                <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <strong style={{ color: '#fff', fontSize: '18px' }}>{song ? song.title : "Fim do Show"}</strong>
                    <div style={{ fontSize: '11px', color: '#34c759', fontWeight: 'bold' }}>{song ? song.artist : ""}</div>
                    {/* INDICADOR MIDI FLUTUANTE */}
                    {lastSignal && <div style={styles.midiProbeFloating}>SINAL: {lastSignal}</div>}
                </div>

                <div style={styles.showControls}>
                    <button onClick={() => setFontSize(f => { const n = f - 5; localStorage.setItem('fontSize', n); return n; })}><Type size={14} />-</button>
                    <button onClick={() => setFontSize(f => { const n = f + 5; localStorage.setItem('fontSize', n); return n; })}><Type size={14} />+</button>
                    <button onClick={() => scrollPage(-1)}><ChevronUp size={20} /></button>
                    <button onClick={() => scrollPage(1)}><ChevronDown size={20} /></button>
                </div>
            </div>

            {/* ÁREA DA CIFRA (UMA POR VEZ) */}
            <div ref={showScrollRef} style={{ ...styles.showContent, fontSize: fontSize + 'px', fontFamily: 'monospace' }}>
                <div style={{ color: '#fff' }}>
                    {song ? formatChordsVisual(song.content) : (
                        <div style={{ textAlign: 'center', padding: '100px', color: '#666' }}>Fim do Repertório</div>
                    )}
                </div>
                
                {/* BOTÕES DE NAVEGAÇÃO ENTRE MÚSICAS */}
                {item && item.type === 'setlist' && song && (
                    <div style={styles.pageActions}>
                        {idx > 0 && (
                            <button style={styles.pageBtn} onClick={() => { setIdx(idx - 1); if (showScrollRef.current) showScrollRef.current.scrollTop = 0; }}>
                                <ChevronLeft /> ANTERIOR: {songsArr[idx - 1].title}
                            </button>
                        )}
                        {idx < songsArr.length - 1 && (
                            <button style={styles.pageBtnNext} onClick={() => { setIdx(idx + 1); if (showScrollRef.current) showScrollRef.current.scrollTop = 0; }}>
                                PRÓXIMA: {songsArr[idx + 1].title} <ChevronRight />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};