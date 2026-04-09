import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Users, Trash2, Layout, Music, X, Settings, Save, UserMinus, ImageIcon, Zap, MinusCircle, Upload, Hash, Radio, Bell } from 'lucide-react';
import { supabase, db, deleteBandComplete, broadcastBandChanges, pullBandChanges } from './ShowPadCore';
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

    const [hasUpdates, setHasUpdates] = useState(false);

    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLogo, setEditLogo] = useState('');
    const [editDate, setEditDate] = useState('');

    useEffect(() => { 
        fetchBands(); 
        
        // v7.1.7: Monitoramento de atualizações em tempo real
        const channel = supabase
            .channel('band_updates')
            .on('postgres_changes', { event: 'INSERT', table: 'band_broadcasts' }, (payload) => {
                if (payload.new.sender_id !== session.user.id) {
                    setHasUpdates(true);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

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
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const SIZE = 200;
                let width = img.width, height = img.height;
                let sx = 0, sy = 0, sw = width, sh = height;
                if (width > height) { sw = height; sx = (width - height) / 2; }
                else { sh = width; sy = (height - width) / 2; }
                canvas.width = SIZE; canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
                setEditLogo(canvas.toDataURL('image/jpeg', 0.6));
                setLoading(false);
            };
        };
        reader.readAsDataURL(file);
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
                    // v7.1.7: Reconhece banda solo pelo marcador is_solo da nuvem
                    is_solo: i.bands.is_solo === true || i.bands.invite_code.startsWith("SOLO")
                }));
                await db.my_bands.clear();
                for (let b of cloudList) await db.my_bands.put(b);
            }
            const localBands = await db.my_bands.toArray();
            localBands.sort((a, b) => (a.is_solo ? -1 : b.is_solo ? 1 : 0));
            setBands(localBands);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleBroadcast = async (band) => {
        setLoading(true);
        try {
            await broadcastBandChanges(band.id, session.user.id);
            alert("📢 Mudanças disseminadas para a nuvem!");
        } catch (e) { alert("Erro no Broadcast: " + e.message); }
        setLoading(false);
    };

    const handlePullChanges = async () => {
        setLoading(true);
        try {
            const myBands = await db.my_bands.toArray();
            for (let b of myBands) {
                // Sincroniza todas, incluindo a SOLO se houver mudanças remotas
                await pullBandChanges(b.id);
            }
            setHasUpdates(false);
            await fetchBands();
            alert("✅ Sincronização concluída!");
        } catch (e) { alert("Erro ao sincronizar: " + e.message); }
        setLoading(false);
    };

    const joinBandByCode = async () => {
        const cleanCode = inviteCode.trim().toUpperCase();
        if (!cleanCode || cleanCode.length < 3) return;
        setLoading(true);
        try {
            const { data: band } = await supabase.from('bands').select('id, name').eq('invite_code', cleanCode).maybeSingle(); 
            if (!band) throw new Error("Código não encontrado.");
            await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'member' }]);
            alert(`Bem-vindo à banda ${band.name}!`);
            setInviteCode(''); await fetchBands();
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    const leaveBand = async (bandId) => {
        if (!window.confirm("Deseja realmente sair desta banda?")) return;
        setLoading(true);
        try {
            await supabase.from('band_members').delete().eq('band_id', bandId).eq('profile_id', session.user.id);
            await fetchBands();
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    const handleDeleteBand = async (band) => {
        if (window.confirm(`Excluir a banda "${band.name}"?`)) {
            setLoading(true);
            try { await deleteBandComplete(band.id); await fetchBands(); } catch (err) { alert(err.message); }
            setLoading(false);
        }
    };

    const fetchMembers = async (bandId) => {
        const { data } = await supabase.from('band_members').select('profile_id, role, profiles(full_name, email)').eq('band_id', bandId);
        setMembers(data || []);
    };

    const refreshRepertoire = async () => {
        if (!showRepertoire) return;
        const total = await db.songs.toArray();
        const relations = await db.band_songs.where('band_id').equals(showRepertoire.id).toArray();
        const songIds = relations.map(r => r.song_id);
        setAllSongs(total);
        setBandSongs(total.filter(s => songIds.includes(s.id)));
    };

    const addSongToBand = async (songId) => {
        if (!showRepertoire) return;
        await db.band_songs.put({ band_id: showRepertoire.id, song_id: songId, custom_tone: 0 });
        refreshRepertoire();
    };

    const removeSongFromBand = async (songId) => {
        if (!showRepertoire) return;
        const rel = await db.band_songs.where({ band_id: showRepertoire.id, song_id: songId }).first();
        if (rel) await db.band_songs.delete(rel.id);
        refreshRepertoire();
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const { data: band } = await supabase.from('bands').insert([{ name: newBandName, owner_id: session.user.id, invite_code: code, is_solo: false }]).select().single();
        if (band) {
            await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);
            setNewBandName(''); fetchBands();
        }
        setLoading(false);
    };

    const handleUpdateBand = async () => {
        setLoading(true);
        await supabase.from('bands').update({ name: editName, description: editDesc, logo_url: editLogo, created_at: editDate }).eq('id', showSettings.id);
        await fetchBands(); setShowSettings(null); setLoading(false);
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>BANDAS</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    {hasUpdates && (
                        <div style={{backgroundColor:'#ff9500', color:'#000', padding:'8px 15px', borderRadius:'10px', fontSize:'11px', fontWeight:'900', display:'flex', alignItems:'center', gap:'8px'}}>
                            <Bell size={14}/> NOVIDADES DISPONÍVEIS
                        </div>
                    )}
                    <button onClick={hasUpdates ? handlePullChanges : fetchBands} style={{
                        ...styles.headerBtn, 
                        borderColor: hasUpdates ? '#ff9500' : '#333',
                        color: hasUpdates ? '#ff9500' : '#fff'
                    }}>
                        <RefreshCw size={16} className={(loading || hasUpdates) ? "spin" : ""}/> 
                        {hasUpdates ? "SINCRONIZAR AGORA" : "ATUALIZAR"}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, background: '#1c1c1e', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h4 style={{ color: '#007aff', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Nova Banda</h4>
                    <input style={styles.inputField} value={newBandName} onChange={e => setNewBandName(e.target.value)} placeholder="Nome da Banda" />
                    <button style={{ ...styles.primaryButton, marginTop: '10px' }} onClick={createBand} disabled={loading}>CADASTRAR</button>
                </div>
                <div style={{ flex: 1, background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h4 style={{ color: '#34c759', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Código de Convite</h4>
                    <input style={styles.inputField} value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Ex: AX72P" />
                    <button onClick={joinBandByCode} style={{ ...styles.primaryButton, backgroundColor: '#34c759', marginTop: '10px' }} disabled={loading}>ENTRAR</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {bands.map(b => (
                    <div key={b.id} style={{ ...styles.settingsCard, maxWidth: 'none', background: '#1c1c1e', border: '1px solid #333' }}>
                        <div style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#000', border: '1px solid #444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {b.logo_url ? <img src={b.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music color={b.is_solo ? "#007aff" : "#333"} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ color: b.is_solo ? '#007aff' : '#FFD700', margin: 0, fontSize: '18px', fontWeight: '900' }}>{b.name}</h2>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <span style={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}>{b.role?.toUpperCase()}</span>
                                    {!b.is_solo && (
                                        <div style={{backgroundColor:'#222', padding:'2px 8px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'4px'}}>
                                            <Hash size={10} color="#34c759"/>
                                            <span style={{color:'#34c759', fontSize:'11px', fontWeight:'900'}}>{b.invite_code}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!b.is_solo && (
                                    b.role === 'admin' ? 
                                    <button onClick={() => handleDeleteBand(b)} style={{ background: 'none', border: 'none', color: '#ff3b30' }} title="Excluir"><Trash2 size={18} /></button> :
                                    <button onClick={() => leaveBand(b.id)} style={{ background: 'none', border: 'none', color: '#ff9500' }} title="Sair"><UserMinus size={18} /></button>
                                )}
                                {b.role === 'admin' && <button onClick={() => setShowSettings(b)} style={{ background: 'none', border: 'none', color: '#888' }}><Settings size={20} /></button>}
                            </div>
                        </div>
                        <div style={{ padding: '15px 20px', borderTop: '1px solid #222', display: 'flex', gap: '8px', background: '#161618' }}>
                            <button onClick={() => setShowRepertoire(b)} style={{ ...styles.headerBtn, flex: 1, color: '#FFD700' }}><Music size={14}/> REPERTÓRIO</button>
                            <button onClick={() => setShowBandShows(b)} style={{ ...styles.headerBtn, flex: 1, color: '#fff' }}><Layout size={14}/> SHOWS</button>
                            {b.role === 'admin' && (
                                <button onClick={() => handleBroadcast(b)} style={{ ...styles.headerBtn, flex: 1, color: '#4cd964', borderColor:'#4cd96444' }}>
                                    <Radio size={14}/> DISSEMINAR
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showRepertoire && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '850px', height: '85vh', borderRadius: '24px', border: '1px solid #444', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '25px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252529' }}>
                            <h2 style={{ color: showRepertoire.is_solo ? '#007aff' : '#FFD700', margin: 0 }}>{showRepertoire.is_solo ? "Meu Acervo Particular" : `Repertório: ${showRepertoire.name}`}</h2>
                            <X onClick={() => setShowRepertoire(null)} style={{ cursor: 'pointer' }} color="#fff" />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                <div>
                                    <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '15px' }}>BIBLIOTECA GERAL</h4>
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
                                    <h4 style={{ color: showRepertoire.is_solo ? '#007aff' : '#FFD700', fontSize: '11px', marginBottom: '15px' }}>{showRepertoire.is_solo ? "MINHAS SELECIONADAS" : "REPERTÓRIO DA BANDA"}</h4>
                                    <div style={{ background: '#000', borderRadius: '12px', padding: '10px', border: `1px solid ${showRepertoire.is_solo ? '#007aff33' : '#FFD70033'}` }}>
                                        {bandSongs.map(s => (
                                            <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: showRepertoire.is_solo ? '#007aff' : '#FFD700' }}>{s.title}</span>
                                                <MinusCircle onClick={() => removeSongFromBand(s.id)} size={18} color="#ff3b30" style={{ cursor: 'pointer' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '20px', background: '#252529', textAlign: 'right' }}><button onClick={() => setShowRepertoire(null)} style={styles.saveBtn}>FECHAR</button></div>
                    </div>
                </div>
            )}
            
            {showSettings && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '550px', borderRadius: '28px', border: '1px solid #444', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 25px', background: '#252529', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>EDITAR CONFIGURAÇÕES</h2>
                            <X onClick={() => setShowSettings(null)} style={{ cursor: 'pointer' }} color="#888" />
                        </div>
                        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input style={styles.inputField} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome da Banda" />
                            <textarea style={{ ...styles.inputField, height: '80px' }} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Observações..." />
                        </div>
                        <div style={{ padding: '20px', background: '#252529' }}>
                            <button onClick={handleUpdateBand} style={{ ...styles.saveBtn, width: '100%', background: '#34c759' }}><Save size={18}/> SALVAR ALTERAÇÕES</button>
                        </div>
                    </div>
                </div>
            )}

            {showBandShows && (
                <BandShowManager band={showBandShows} styles={styles} onClose={() => setShowBandShows(null)} onSelectShow={(show) => { onSelectShow({ type: 'setlist', data: show }); setShowBandShows(null); }} />
            )}
        </div>
    );
};