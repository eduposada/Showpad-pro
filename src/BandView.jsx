import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Users, Trash2, Layout, Music, X, Settings, Save, UserMinus, ImageIcon, Zap, MinusCircle, Upload } from 'lucide-react';
import { supabase, db, deleteBandComplete } from './ShowPadCore';
import { BandShowManager } from './BandShowManager';

export const BandView = ({ session, styles, onSelectShow }) => {
    const [loading, setLoading] = useState(false);
    const [bands, setBands] = useState([]);
    const [newBandName, setNewBandName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    
    const [showRepertoire, setShowRepertoire] = useState(null); 
    const [showSettings, setShowSettings] = useState(null); 
    const [showBandShows, setShowBandShows] = useState(null); 
    
    const [allSongs, setAllSongs] = useState([]);
    const [bandSongs, setBandSongs] = useState([]);
    const [members, setMembers] = useState([]);

    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLogo, setEditLogo] = useState('');
    const [editDate, setEditDate] = useState('');

    useEffect(() => { fetchBands(); }, []);

    useEffect(() => {
        if (showRepertoire) refreshRepertoire();
    }, [showRepertoire]);

    useEffect(() => {
        if (showSettings) {
            setEditName(showSettings.name || '');
            setEditDesc(showSettings.description || '');
            setEditLogo(showSettings.logo_url || '');
            const dateOnly = showSettings.created_at ? showSettings.created_at.split('T')[0] : '';
            setEditDate(dateOnly);
            fetchMembers(showSettings.id);
        }
    }, [showSettings]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditLogo(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const fetchBands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('band_members')
                .select(`role, bands (*)`)
                .eq('profile_id', session.user.id);

            if (!error && data) {
                const cloudList = data.filter(i => i.bands).map(i => ({ 
                    ...i.bands, 
                    role: i.role,
                    is_solo: i.bands.invite_code.startsWith("SOLO")
                }));
                for (let b of cloudList) await db.my_bands.put(b);
            }

            const localBands = await db.my_bands.toArray();
            localBands.sort((a, b) => (a.is_solo ? -1 : b.is_solo ? 1 : 0));
            setBands(localBands);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleDeleteBand = async (band) => {
        if (band.is_solo) return; 
        const msg = `ATENÇÃO: Deseja excluir a banda "${band.name}"?\n\nIsso apagará todos os shows e conexões de repertório desta banda no dispositivo e na nuvem.\n\nAs músicas da biblioteca geral NÃO serão apagadas.`;
        
        if (window.confirm(msg)) {
            setLoading(true);
            try {
                await deleteBandComplete(band.id);
                await fetchBands();
            } catch (err) {
                alert("Erro ao excluir: " + err.message);
            }
            setLoading(false);
        }
    };

    const fetchMembers = async (bandId) => {
        const { data } = await supabase
            .from('band_members')
            .select('profile_id, role, profiles(full_name, email)')
            .eq('band_id', bandId);
        setMembers(data || []);
    };

    const refreshRepertoire = async () => {
        if (!showRepertoire) return;
        const total = await db.songs.toArray();
        const relations = await db.band_songs.where('band_id').equals(showRepertoire.id).toArray();
        const songIds = relations.map(r => r.song_id);
        const specific = total.filter(s => songIds.includes(s.id));
        
        setAllSongs(total);
        setBandSongs(specific);
    };

    const addSongToBand = async (songId) => {
        if (!showRepertoire) return;
        try {
            await db.band_songs.put({
                band_id: showRepertoire.id,
                song_id: songId,
                custom_tone: 0
            });
            await refreshRepertoire();
        } catch (e) { console.error(e); }
    };

    const removeSongFromBand = async (songId) => {
        if (!showRepertoire) return;
        try {
            const relation = await db.band_songs
                .where({ band_id: showRepertoire.id, song_id: songId })
                .first();
            if (relation) await db.band_songs.delete(relation.id);
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
                await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);
                setNewBandName(''); 
                fetchBands();
            }
        } catch (err) { alert(err.message); }
        setLoading(false);
    };

    const handleUpdateBand = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('bands')
            .update({ name: editName, description: editDesc, logo_url: editLogo, created_at: editDate })
            .eq('id', showSettings.id);
        
        if (!error) {
            await fetchBands();
            setShowSettings(null);
        }
        setLoading(false);
    };

    const removeMember = async (profileId) => {
        if (!confirm("Remover este integrante?")) return;
        await supabase.from('band_members').delete().eq('band_id', showSettings.id).eq('profile_id', profileId);
        fetchMembers(showSettings.id);
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>BANDAS</h1>
                <button onClick={fetchBands} style={styles.headerBtn}><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> ATUALIZAR</button>
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
                    <div key={b.id} style={{ ...styles.settingsCard, maxWidth: 'none', background: '#1c1c1e', border: '1px solid #333' }}>
                        <div style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#000', border: '1px solid #444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {b.logo_url ? <img src={b.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music color="#333" />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ color: b.is_solo ? '#007aff' : '#FFD700', margin: 0, fontSize: '18px', fontWeight: '900' }}>{b.name}</h2>
                                <span style={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}>{b.role?.toUpperCase()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {!b.is_solo && b.role === 'admin' && (
                                    <button onClick={() => handleDeleteBand(b)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', opacity: 0.7 }}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                {b.role === 'admin' && (
                                    <button onClick={() => setShowSettings(b)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><Settings size={20} /></button>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '15px 20px', borderTop: '1px solid #222', display: 'flex', gap: '10px', background: '#161618' }}>
                            <button onClick={() => setShowRepertoire(b)} style={{ ...styles.headerBtn, flex: 1, color: '#FFD700' }}><Music size={14}/> REPERTÓRIO</button>
                            <button onClick={() => setShowBandShows(b)} style={{ ...styles.headerBtn, flex: 1, color: '#fff' }}><Layout size={14}/> SHOWS</button>
                        </div>
                    </div>
                ))}
            </div>

            {showRepertoire && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '850px', height: '85vh', borderRadius: '24px', border: '1px solid #444', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '25px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252529' }}>
                            <div><h2 style={{ color: '#FFD700', margin: 0 }}>Repertório: {showRepertoire.name}</h2></div>
                            <X onClick={() => setShowRepertoire(null)} style={{ cursor: 'pointer' }} color="#fff" />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            {showRepertoire.is_solo ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}><Zap size={40} color="#FFD700" /><h3 style={{ color: '#fff' }}>Modo Solo Ativo</h3><p>Toda a sua biblioteca está disponível.</p></div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                    <div>
                                        <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '15px' }}>BIBLIOTECA</h4>
                                        <div style={{ background: '#111', borderRadius: '12px', padding: '10px', border: '1px solid #222' }}>
                                            {allSongs.filter(s => !bandSongs.find(bs => bs.id === s.id)).map(s => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#fff' }}>{s.title}</span>
                                                    <Plus onClick={() => addSongToBand(s.id)} size={18} color="#34c759" style={{ cursor: 'pointer' }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#FFD700', fontSize: '11px', marginBottom: '15px' }}>REPERTÓRIO DA BANDA</h4>
                                        <div style={{ background: '#000', borderRadius: '12px', padding: '10px', border: '1px solid #FFD70033' }}>
                                            {bandSongs.map(s => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#FFD700' }}>{s.title}</span>
                                                    <MinusCircle onClick={() => removeSongFromBand(s.id)} size={18} color="#ff3b30" style={{ cursor: 'pointer' }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '20px', background: '#252529', textAlign: 'right' }}><button onClick={() => setShowRepertoire(null)} style={styles.saveBtn}>FECHAR</button></div>
                    </div>
                </div>
            )}

            {showSettings && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '550px', borderRadius: '28px', border: '1px solid #444', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 25px', background: '#252529', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>EDITAR BANDA</h2>
                            <X onClick={() => setShowSettings(null)} style={{ cursor: 'pointer' }} color="#888" />
                        </div>
                        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '18px', border: '1px solid #333' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#000', border: '1px solid #444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {editLogo ? <img src={editLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={30} color="#222" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ color: '#666', fontSize: '10px' }}>UPLOAD DE LOGO</label>
                                    <label style={{ ...styles.primaryButton, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', padding: '8px 12px' }}>
                                        <Plus size={14} /> IMAGEM <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>
                            <input style={styles.inputField} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome da Banda" />
                            <input type="date" style={styles.inputField} value={editDate} onChange={e => setEditDate(e.target.value)} />
                            <textarea style={{ ...styles.inputField, height: '80px' }} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Observações..." />
                        </div>
                        <div style={{ padding: '20px', background: '#252529' }}>
                            <button onClick={handleUpdateBand} style={{ ...styles.saveBtn, width: '100%', background: '#34c759' }}><Save size={18}/> SALVAR ALTERAÇÕES</button>
                        </div>
                    </div>
                </div>
            )}

            {showBandShows && (
                <BandShowManager band={showBandShows} styles={styles} onClose={() => setShowBandShows(null)} onSelectShow={(show) => { onSelectShow(show); setShowBandShows(null); }} />
            )}
        </div>
    );
};