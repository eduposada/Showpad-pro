import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, RefreshCw, Users, Trash2, Layout, Music, Copy, CheckCircle, X, Zap, MinusCircle } from 'lucide-react';
import { supabase, db } from './ShowPadCore';

export const BandView = ({ session, styles }) => {
    const [loading, setLoading] = useState(false);
    const [bands, setBands] = useState([]);
    const [newBandName, setNewBandName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);

    // Estados para o Modal de Repertório
    const [showRepertoire, setShowRepertoire] = useState(null); 
    const [allSongs, setAllSongs] = useState([]);
    const [bandSongs, setBandSongs] = useState([]);

    useEffect(() => { 
        fetchBands(); 
    }, []);

    // Monitora quando o modal abre para carregar os dados
    useEffect(() => {
        if (showRepertoire) {
            refreshRepertoire();
        }
    }, [showRepertoire]);

    // FUNÇÃO VITAL: Recarrega as duas colunas simultaneamente
    const refreshRepertoire = async () => {
        if (!showRepertoire) return;
        const fullLibrary = await db.songs.toArray();
        const specificBand = await db.songs.where('band_id').equals(showRepertoire.id).toArray();
        
        setAllSongs(fullLibrary);
        setBandSongs(specificBand);
    };

    const fetchBands = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('band_members')
                .select(`role, bands (id, name, invite_code)`)
                .eq('profile_id', session.user.id);

            let cloudList = data ? data.filter(i => i.bands).map(i => ({ 
                id: i.bands.id, 
                name: i.bands.name, 
                invite_code: i.bands.invite_code, 
                role: i.role,
                is_solo: i.bands.invite_code.startsWith("SOLO")
            })) : [];

            const localBands = await db.my_bands.toArray();
            const combined = [...cloudList];
            localBands.forEach(lb => {
                if (!combined.find(c => c.id === lb.id)) combined.push(lb);
            });

            setBands(combined);
            await db.my_bands.clear(); 
            if (combined.length > 0) await db.my_bands.bulkAdd(combined);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const addSongToBand = async (songId) => {
        if (!showRepertoire) return;
        try {
            await db.songs.update(songId, { band_id: showRepertoire.id });
            await refreshRepertoire(); // Atualiza as duas colunas
        } catch (e) { console.error(e); }
    };

    const removeSongFromBand = async (songId) => {
        try {
            await db.songs.update(songId, { band_id: null });
            await refreshRepertoire(); // Atualiza as duas colunas
        } catch (e) { console.error(e); }
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: band } = await supabase
                .from('bands')
                .insert([{ name: newBandName, owner_id: session.user.id, invite_code: code }])
                .select().single();

            if (band) {
                await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);
                setNewBandName(''); 
                fetchBands();
            }
        } catch (err) { alert(err.message); }
        setLoading(false);
    };

    const handleDeleteBand = async (band) => {
        if (!confirm(`Atenção: Deseja excluir a banda "${band.name}"?`)) return;
        setLoading(true);
        try {
            await supabase.from('bands').delete().eq('id', band.id);
            await db.my_bands.delete(band.id);
            await fetchBands();
        } catch (err) { alert(err.message); }
        setLoading(false);
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>BANDAS</h1>
                <button onClick={fetchBands} style={{ ...styles.headerBtn, padding: '10px 20px' }}>
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""}/> ATUALIZAR
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, background: '#1c1c1e', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <input style={styles.inputField} value={newBandName} onChange={e => setNewBandName(e.target.value)} placeholder="Nome da Nova Banda" />
                    <button style={{ ...styles.primaryButton, marginTop: '10px' }} onClick={createBand}>CADASTRAR</button>
                </div>
                <div style={{ flex: 1, background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <input style={styles.inputField} value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Código de Convite" />
                    <button style={{ ...styles.primaryButton, backgroundColor: '#34c759', marginTop: '10px' }}>ENTRAR</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {bands.map(b => (
                    <div key={b.id} style={{ ...styles.settingsCard, maxWidth: 'none', border: '1px solid #333', background: '#1c1c1e' }}>
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ color: '#FFD700', margin: 0 }}>{b.name}</h2>
                                <small style={{ color: '#888' }}>{b.role === 'admin' ? 'Administrador' : 'Integrante'}</small>
                            </div>
                            {!b.is_solo && b.role === 'admin' && (
                                <button onClick={() => handleDeleteBand(b)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer' }}><Trash2 size={20} /></button>
                            )}
                        </div>
                        <div style={{ padding: '15px 20px', borderTop: '1px solid #222', display: 'flex', gap: '10px', background: '#161618' }}>
                            <button onClick={() => setShowRepertoire(b)} style={{ ...styles.headerBtn, flex: 1, color: '#FFD700', border: '1px solid #444' }}><Music size={14}/> REPERTÓRIO</button>
                            <button style={{ ...styles.headerBtn, flex: 1, color: '#fff', border: '1px solid #444' }}><Layout size={14}/> SHOWS</button>
                        </div>
                    </div>
                ))}
            </div>

            {showRepertoire && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '850px', height: '85vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', border: '1px solid #444', overflow: 'hidden' }}>
                        <div style={{ padding: '25px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252529' }}>
                            <div>
                                <h2 style={{ color: '#FFD700', margin: 0 }}>Gestão de Repertório</h2>
                                <p style={{ color: '#888', fontSize: '12px' }}>Banda: {showRepertoire.name}</p>
                            </div>
                            <X onClick={() => setShowRepertoire(null)} style={{ cursor: 'pointer' }} color="#fff" />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            {showRepertoire.is_solo ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                                    <Zap size={40} color="#FFD700" style={{ marginBottom: '20px' }} />
                                    <h3 style={{ color: '#fff' }}>Modo Solo Ativo</h3>
                                    <p>Toda a sua biblioteca está disponível automaticamente.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                    <div>
                                        <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '15px', textTransform: 'uppercase' }}>Biblioteca Geral</h4>
                                        <div style={{ flex: 1, background: '#111', borderRadius: '12px', padding: '10px', border: '1px solid #222' }}>
                                            {allSongs.filter(s => s.band_id !== showRepertoire.id).map(s => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#fff', fontSize: '13px' }}>{s.title}</span>
                                                    <button onClick={() => addSongToBand(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={18} color="#34c759" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#FFD700', fontSize: '11px', marginBottom: '15px', textTransform: 'uppercase' }}>Repertório da Banda</h4>
                                        <div style={{ flex: 1, background: '#000', borderRadius: '12px', padding: '10px', border: '1px solid #FFD70033' }}>
                                            {bandSongs.length === 0 ? <p style={{ color: '#444', fontSize: '12px', textAlign: 'center', padding: '20px' }}>Vazio</p> : 
                                            bandSongs.map(s => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{s.title}</span>
                                                    <button onClick={() => removeSongFromBand(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MinusCircle size={18} color="#ff3b30" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '20px', background: '#252529', borderTop: '1px solid #333', textAlign: 'right' }}>
                            <button onClick={() => setShowRepertoire(null)} style={styles.saveBtn}>FECHAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};