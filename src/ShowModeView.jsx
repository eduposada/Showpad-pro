import React, { useState } from 'react';
import { ChevronLeft, Menu, Type, ChevronUp, ChevronDown, X, ChevronRight, Piano } from 'lucide-react';
import { formatChordsVisual } from './ShowPadCore'; // Certifique-se que o nome do arquivo bate

export const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, onClose, showScrollRef, lastSignal, styles }) => {
    const [idx, setIdx] = useState(0), [dr, setDr] = useState(false);
    const songsArr = (item && item.type === 'setlist') ? (item.data.songs || []) : (item ? [item.data] : []);
    const song = songsArr[idx];

    return (
        <div style={styles.showOverlay}>
            {/* GAVETA LATERAL */}
            {dr && (
                <div style={styles.showDrawer}>
                    <div style={styles.drawerHeader}>SET LIST <X onClick={() => setDr(false)} style={{ cursor: 'pointer' }} /></div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {songsArr.map((s, i) => (
                            <div key={i} style={idx === i ? styles.drawerItemActive : styles.drawerItem} onClick={() => { setIdx(i); setDr(false); if (showScrollRef.current) showScrollRef.current.scrollTop = 0; }}>
                                {i + 1}. {s.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOOLBAR */}
            <div style={styles.showToolbar}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={() => setDr(true)} style={styles.backBtn}><Menu /></button>
                    <button onClick={onClose} style={styles.backBtn}><ChevronLeft /> Sair</button>
                </div>
                <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <strong style={{ color: '#fff' }}>{song ? song.title : ""}</strong>
                    {lastSignal && <div style={styles.midiProbeFloating}>MIDI: {lastSignal}</div>}
                </div>
                <div style={styles.showControls}>
                    <button onClick={() => setFontSize(f => f - 5)}><Type size={14} />-</button>
                    <button onClick={() => setFontSize(f => f + 5)}><Type size={14} />+</button>
                    <button onClick={() => scrollPage(-1)}><ChevronUp size={20} /></button>
                    <button onClick={() => scrollPage(1)}><ChevronDown size={20} /></button>
                </div>
            </div>

            {/* CONTEÚDO */}
            <div ref={showScrollRef} style={{ ...styles.showContent, fontSize: fontSize + 'px', fontFamily: 'monospace', color: '#fff' }}>
                {song ? formatChordsVisual(song.content) : "Fim do Show"}
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