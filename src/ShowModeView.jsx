import React, { useState } from 'react';
import { ChevronLeft, PanelLeftOpen, Type, ChevronUp, ChevronDown, X, ChevronRight } from 'lucide-react';
import { formatChordsVisual } from './ShowPadCore';

export const ShowModeView = ({ item, fontSize, setFontSize, scrollPage, onClose, showScrollRef, lastSignal, styles }) => {
    const [idx, setIdx] = useState(0), [dr, setDr] = useState(false);
    const [btnPressed, setBtnPressed] = useState(null); // Para efeito visual do clique
    
    const songsArr = (item && item.type === 'setlist') ? (item.data.songs || []) : (item ? [item.data] : []);
    const song = songsArr[idx];

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

    return (
        <div style={styles.showOverlay}>
            {/* GAVETA LATERAL */}
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
                            onClick={() => { setIdx(i); setDr(false); if (showScrollRef.current) showScrollRef.current.scrollTop = 0; }}
                        >
                            <span style={{opacity: 0.5, marginRight: '10px'}}>{(i + 1).toString().padStart(2, '0')}</span>
                            {s.title}
                        </div>
                    ))}
                </div>
            </div>

            {/* TOOLBAR SUPERIOR (SEM PROX/ANT) */}
            <div style={{...styles.showToolbar, height: '100px', padding: '10px 20px'}}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => setDr(true)} style={{...controlBtnStyle, backgroundColor: dr ? '#007aff' : '#2c2c2e'}}>
                        <PanelLeftOpen />
                    </button>
                    <button onClick={onClose} style={{...controlBtnStyle, width: 'auto', padding: '0 15px'}}>
                        <ChevronLeft /> Sair
                    </button>
                </div>

                <div style={{ flex: 1, textAlign: 'center' }}>
                    <strong style={{ color: '#fff', fontSize: '32px', lineHeight: '1', display: 'block', textTransform: 'uppercase' }}>
                        {song ? song.title : "FIM DO SHOW"}
                    </strong>
                    <span style={{ color: '#FFD700', fontSize: '18px', fontWeight: 'bold' }}>
                        {song ? song.artist : ""}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#000', border: '2px solid #007aff', borderRadius: '8px', padding: '5px 12px', textAlign:'center' }}>
                        <span style={{fontSize: '9px', color: '#007aff', fontWeight: 'bold', display:'block'}}>BPM</span>
                        <span style={{fontSize: '20px', color: '#007aff', fontWeight: 'bold'}}>{song?.bpm || "---"}</span>
                    </div>
                    <button style={controlBtnStyle} onClick={() => setFontSize(f => f - 5)}><Type size={16} />-</button>
                    <button style={controlBtnStyle} onClick={() => setFontSize(f => f + 5)}><Type size={16} />+</button>
                </div>
            </div>

            {/* CONTEÚDO DA CIFRA */}
            <div ref={showScrollRef} style={{ ...styles.showContent, padding: '40px' }}>
                {song && song.notes && (
                    <div style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderLeft: '5px solid #FFD700', padding: '15px', marginBottom: '30px', color: '#FFD700', fontSize: '20px' }}>
                        <strong>OBSERVAÇÕES:</strong><br/>{song.notes}
                    </div>
                )}
                <div style={{ fontSize: fontSize + 'px', fontFamily: 'monospace', color: '#fff', whiteSpace: 'pre-wrap', paddingBottom: '100px' }}>
                    {song ? formatChordsVisual(song.content) : "Obrigado!"}
                </div>
            </div>

            {/* NOVO RODAPÉ DE NAVEGAÇÃO 50/50 3D */}
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