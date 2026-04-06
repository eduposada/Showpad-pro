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

    // Monitora a abertura do modal para carregar os dados frescos
    useEffect(() => {
        if (showRepertoire) {
            refreshRepertoire();
        }
    }, [showRepertoire]);

    // Atualiza as duas colunas do modal simultaneamente
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
            // 1. Busca no Supabase (Nuvem)
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

            // 2. Busca no Dexie (Local - Garante a SOLO)
            const localBands = await db.my_bands.toArray();
            let combined = [...cloudList];
            
            localBands.forEach(lb => {
                if (!combined.find(c => c.id === lb.id)) combined.push(lb);
            });

            // 3. ORDENAÇÃO FIXA: Banda SOLO sempre em primeiro
            combined.sort((a, b) => {
                if (a.is_solo) return -1;
                if (b.is_solo) return 1;
                return 0;
            });

            setBands(combined);
            
            // 4. Atualiza cache local
            await db.my_bands.clear(); 
            if (combined.length > 0) await db.my_bands.bulkAdd(combined);
        } catch (err) { 
            console.error("Erro ao carregar bandas:", err); 
        }
        setLoading(false);
    };

    const addSongToBand = async (songId) => {
        if (!showRepertoire) return;
        try {
            await db.songs.update(songId, { band_id: showRepertoire.id });
            await refreshRepertoire();
        } catch (e) { console.error(e); }
    };

    const removeSongFromBand = async (songId) => {
        try {
            await db.songs.update(songId, { band_id: null });
            await refreshRepertoire();
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
                await supabase.from('band_members').insert([{ 
                    band_id: band.id, 
                    profile_id: session.user.id, 
                    role: 'admin' 
                }]);
                setNewBandName(''); 
                fetchBands();
            }
        } catch (err) { alert("Erro ao criar banda: " + err.message); }
        setLoading(false);
    };

    const handleDeleteBand = async (band) => {
        if (!confirm(`Atenção: Deseja realmente excluir a banda "${band.name}"?`)) return;
        setLoading(true);
        try {
            await supabase.from('bands').delete().eq('id', band.id);
            await db.my_bands.delete(band.id);
            await fetchBands();
        } catch (err) { alert("Erro ao excluir: " + err.message); }
        setLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>BANDAS</h1>
                    <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Gerencie seus grupos e repertórios.</p>
                </div>
                <button onClick={fetchBands} style={{ ...styles.headerBtn, padding: '10px 20px' }}>
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""}/> ATUALIZAR
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, background: '#1c1c1e', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h4 style={{ color: '#007aff', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Nova Banda</h4>
                    <input style={styles.inputField} value={newBandName} onChange={e => setNewBandName(e.target.value)} placeholder="Nome da Banda" />
                    <button style={{ ...styles.primaryButton, marginTop: '10px' }} onClick={createBand}>CADASTRAR</button>
                </div>
                <div style={{ flex: 1, background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h4 style={{ color: '#34c759', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Código de Convite</h4>
                    <input style={styles.inputField} value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Ex: AX72P" />
                    <button style={{ ...styles.primaryButton, backgroundColor: '#34c759', marginTop: '10px' }}>ENTRAR</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {bands.map(b => (
                    <div key={b.id} style={{ ...styles.settingsCard, maxWidth: 'none', border: '1px solid #333', background: '#1c1c1e' }}>
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ color: b.is_solo ? '#007aff' : '#FFD700', margin: 0, fontSize: '20px', fontWeight: '900' }}>{b.name}</h2>
                                <span style={{ color: b.role === 'admin' ? '#007aff' : '#888', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                                    <Users size={12}/> {b.role === 'admin' ? 'Administrador' : 'Integrante'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div onClick={() => copyToClipboard(b.invite_code)} style={{ background: '#000', padding: '5px 10px', borderRadius: '6px', border: '1px solid #333', cursor: 'pointer' }}>
                                    <code style={{ color: '#fff', fontSize: '14px' }}>{b.invite_code}</code>
                                </div>
                                {!b.is_solo && b.role === 'admin' && (
                                    <button onClick={() => handleDeleteBand(b)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer' }}><Trash2 size={20} /></button>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '15px 20px', borderTop: '1px solid #222', display: 'flex', gap: '10px', background: '#161618' }}>
                            <button onClick={() => setShowRepertoire(b)} style={{ ...styles.headerBtn, flex: 1, color: '#FFD700', border: '1px solid #444' }}>
                                <Music size={14}/> REPERTÓRIO
                            </button>
                            <button style={{ ...styles.headerBtn, flex: 1, color: '#fff', border: '1px solid #444' }}>
                                <Layout size={14}/> SHOWS
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE REPERTÓRIO */}
            {showRepertoire && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '850px', height: '85vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', border: '1px solid #444', overflow: 'hidden' }}>
                        <div style={{ padding: '25px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252529' }}>
                            <div>
                                <h2 style={{ color: '#FFD700', margin: 0, fontSize: '22px' }}>Gestão de Repertório</h2>
                                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Banda: {showRepertoire.name}</p>
                            </div>
                            <button onClick={() => setShowRepertoire(null)} style={{ background: '#ff3b30', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={20} color="#fff" />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            {showRepertoire.is_solo ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                    <Zap size={40} color="#FFD700" style={{ marginBottom: '20px' }} />
                                    <h3 style={{ color: '#fff' }}>Modo Solo Ativo</h3>
                                    <p>Toda a sua biblioteca está disponível automaticamente para shows solo.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                    <div>
                                        <h4 style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase' }}>Biblioteca Geral</h4>
                                        <div style={{ flex: 1, background: '#111', borderRadius: '12px', padding: '10px', border: '1px solid #222' }}>
                                            {allSongs.filter(s => s.band_id !== showRepertoire.id).map(s => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#fff', fontSize: '13px' }}>{s.title}</span>
                                                    <button onClick={() => addSongToBand(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={18} color="#34c759" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#FFD700', fontSize: '11px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase' }}>Repertório da Banda</h4>
                                        <div style={{ flex: 1, background: '#000', borderRadius: '12px', padding: '10px', border: '1px solid #FFD70033' }}>
                                            {bandSongs.length === 0 ? <p style={{ color: '#444', fontSize: '12px', textAlign: 'center', padding: '20px' }}>Vazio</p> : 
                                            bandSongs.map(s => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#FFD700', fontSize: '13px', fontWeight: 'bold' }}>{s.title}</span>
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