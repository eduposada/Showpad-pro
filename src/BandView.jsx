import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Layout, Music, X, Settings, Save, UserMinus, Zap, MinusCircle, Hash, Radio, Bell, UserPlus, Check, Ban } from 'lucide-react';
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
    const [officialRepertoire, setOfficialRepertoire] = useState([]);
    const [pendingProposals, setPendingProposals] = useState([]);
    const [proposalQueueIds, setProposalQueueIds] = useState([]);
    const [repertoireSortBy, setRepertoireSortBy] = useState('title');
    const [members, setMembers] = useState([]);

    // v7.1.5: Estados para controle de Broadcast
    const [hasUpdates, setHasUpdates] = useState(false);

    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLogo, setEditLogo] = useState('');
    const [editDate, setEditDate] = useState('');

    /** Pedidos de entrada pendentes (Fase B) — só admins veem todos da banda via RLS */
    const [joinRequests, setJoinRequests] = useState([]);
    const [pendingJoinCounts, setPendingJoinCounts] = useState({});
    const [pendingProposalCounts, setPendingProposalCounts] = useState({});

    useEffect(() => { 
        fetchBands(); 
        
        // v7.1.5: Sintonizar rádio de atualizações em tempo real
        const channel = supabase
            .channel('band_updates')
            .on('postgres_changes', { event: 'INSERT', table: 'band_broadcasts' }, (payload) => {
                // Se o sinal de fumaça não foi enviado por mim, alertar novidades
                if (payload.new.sender_id !== session.user.id) {
                    setHasUpdates(true);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        if (showRepertoire) refreshRepertoire();
    }, [showRepertoire, repertoireSortBy]);

    useEffect(() => {
        if (showSettings) {
            setEditName(showSettings.name || '');
            setEditDesc(showSettings.description || '');
            setEditLogo(showSettings.logo_url || '');
            const dateOnly = showSettings.created_at ? showSettings.created_at.split('T')[0] : '';
            setEditDate(dateOnly);
            fetchMembers(showSettings.id);
            if (showSettings.role === 'admin' && !showSettings.is_solo) {
                fetchJoinRequests(showSettings.id);
            } else {
                setJoinRequests([]);
            }
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
                    is_solo: i.bands.invite_code.startsWith("SOLO")
                }));
                await db.my_bands.clear();
                for (let b of cloudList) await db.my_bands.put(b);
            }
            const localBands = await db.my_bands.toArray();
            localBands.sort((a, b) => (a.is_solo ? -1 : b.is_solo ? 1 : 0));
            setBands(localBands);
            await loadPendingJoinCounts();
            await loadPendingProposalCounts();
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const loadPendingJoinCounts = async () => {
        const { data } = await supabase.from('band_join_requests').select('band_id').eq('status', 'pending');
        const counts = {};
        (data || []).forEach((r) => {
            counts[r.band_id] = (counts[r.band_id] || 0) + 1;
        });
        setPendingJoinCounts(counts);
    };

    const loadPendingProposalCounts = async () => {
        const { data } = await supabase.from('band_repertoire_proposals').select('band_id').eq('status', 'pending');
        const counts = {};
        (data || []).forEach((r) => {
            counts[r.band_id] = (counts[r.band_id] || 0) + 1;
        });
        setPendingProposalCounts(counts);
    };

    const fetchJoinRequests = async (bandId) => {
        let q = supabase
            .from('band_join_requests')
            .select('id, band_id, profile_id, created_at, profiles(full_name, email)')
            .eq('band_id', bandId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        let { data, error } = await q;
        if (error && (error.message || '').includes('relationship')) {
            ({ data, error } = await supabase
                .from('band_join_requests')
                .select('id, band_id, profile_id, created_at')
                .eq('band_id', bandId)
                .eq('status', 'pending')
                .order('created_at', { ascending: true }));
        }
        if (error) {
            console.error(error);
            setJoinRequests([]);
            return;
        }
        setJoinRequests(data || []);
    };

    // v7.1.5: DISSEMINAR (ADMIN)
    const handleBroadcast = async (band) => {
        setLoading(true);
        try {
            await broadcastBandChanges(band.id, session.user.id);
            alert("📢 Mudanças disseminadas com sucesso para todos os membros!");
        } catch (e) { alert("Erro no Broadcast: " + e.message); }
        setLoading(false);
    };

    // v7.1.5: CAPTURAR MUDANÇAS (MEMBRO)
    const handlePullChanges = async () => {
        setLoading(true);
        try {
            // Pegar IDs de todas as bandas que participo
            const myBands = await db.my_bands.toArray();
            for (let b of myBands) {
                if (!b.is_solo) await pullBandChanges(b.id);
            }
            setHasUpdates(false);
            await fetchBands();
            alert('✅ Sincronização concluída. O repertório da banda foi atualizado sem sobrescrever sua biblioteca pessoal.');
        } catch (e) { alert("Erro ao sincronizar: " + e.message); }
        setLoading(false);
    };

    const joinBandByCode = async () => {
        const cleanCode = inviteCode.trim().toUpperCase();
        if (!cleanCode || cleanCode.length < 3) return;
        setLoading(true);
        try {
            const { data: band } = await supabase.from('bands').select('id, name').eq('invite_code', cleanCode).maybeSingle();
            if (!band) throw new Error('Código não encontrado.');
            const { error } = await supabase.from('band_join_requests').insert({
                band_id: band.id,
                profile_id: session.user.id,
            });
            if (error) {
                if (error.code === '23505') {
                    throw new Error('Já existe um pedido pendente para esta banda. Aguarde o administrador.');
                }
                if (error.code === '42501' || (error.message && error.message.includes('policy'))) {
                    throw new Error('Não foi possível enviar o pedido. Talvez você já seja membro desta banda.');
                }
                throw new Error(error.message || 'Erro ao enviar pedido.');
            }
            alert(`Pedido enviado para "${band.name}". O administrador precisa aprovar sua entrada.`);
            setInviteCode('');
        } catch (err) {
            alert(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const acceptJoinRequest = async (req) => {
        setLoading(true);
        try {
            const { error: eMem } = await supabase.from('band_members').insert({
                band_id: req.band_id,
                profile_id: req.profile_id,
                role: 'member',
            });
            if (eMem) throw new Error(eMem.message || 'Erro ao admitir membro.');
            const { error: eUp } = await supabase.from('band_join_requests').update({
                status: 'accepted',
                resolved_at: new Date().toISOString(),
            }).eq('id', req.id);
            if (eUp) throw new Error(eUp.message || 'Erro ao atualizar pedido.');
            await fetchJoinRequests(showSettings.id);
            await fetchMembers(showSettings.id);
            await loadPendingJoinCounts();
            alert('Membro admitido com sucesso.');
        } catch (e) {
            alert(e.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    const rejectJoinRequest = async (req) => {
        if (!window.confirm('Recusar este pedido de entrada?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('band_join_requests').update({
                status: 'rejected',
                resolved_at: new Date().toISOString(),
            }).eq('id', req.id);
            if (error) throw new Error(error.message);
            await fetchJoinRequests(showSettings.id);
            await loadPendingJoinCounts();
        } catch (e) {
            alert(e.message || String(e));
        } finally {
            setLoading(false);
        }
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
        const sorted = [...total].sort((a, b) => {
            const va = (repertoireSortBy === 'artist' ? a.artist : a.title) || '';
            const vb = (repertoireSortBy === 'artist' ? b.artist : b.title) || '';
            return va.localeCompare(vb, 'pt-BR', { sensitivity: 'base' });
        });
        setAllSongs(sorted);

        const { data: official } = await supabase
            .from('band_repertoire')
            .select('title, artist, content, bpm, last_updated_by')
            .eq('band_id', showRepertoire.id)
            .order('title', { ascending: true });
        setOfficialRepertoire(official || []);

        const { data: pending } = await supabase
            .from('band_repertoire_proposals')
            .select('id, title, artist, content, bpm, proposer_id, created_at')
            .eq('band_id', showRepertoire.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        setPendingProposals(pending || []);
    };

    const addSongToProposalQueue = (songId) => {
        if (!proposalQueueIds.includes(songId)) {
            setProposalQueueIds((prev) => [...prev, songId]);
        }
    };

    const removeSongFromProposalQueue = (songId) => {
        setProposalQueueIds((prev) => prev.filter((id) => id !== songId));
    };

    const submitRepertoireProposals = async () => {
        if (!showRepertoire || proposalQueueIds.length === 0) return;
        setLoading(true);
        try {
            const selected = allSongs.filter((s) => proposalQueueIds.includes(s.id));
            if (selected.length === 0) throw new Error('Nenhuma música para enviar.');
            const payload = selected.map((s) => ({
                band_id: showRepertoire.id,
                proposer_id: session.user.id,
                title: s.title,
                artist: s.artist,
                content: s.content || '',
                bpm: s.bpm || 120,
            }));
            const { error } = await supabase.from('band_repertoire_proposals').insert(payload);
            if (error) throw new Error(error.message || 'Erro ao enviar propostas.');

            let bErr = null;
            const ins = await supabase.from('band_broadcasts').insert({
                band_id: showRepertoire.id,
                sender_id: session.user.id,
                kind: 'proposals',
            });
            bErr = ins.error;
            if (bErr && (bErr.message || '').toLowerCase().includes('kind')) {
                await supabase.from('band_broadcasts').insert({ band_id: showRepertoire.id, sender_id: session.user.id });
            }

            setProposalQueueIds([]);
            await refreshRepertoire();
            await loadPendingProposalCounts();
            alert('Propostas enviadas para aprovação do administrador.');
        } catch (e) {
            alert(e.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const { data: band } = await supabase.from('bands').insert([{ name: newBandName, owner_id: session.user.id, invite_code: code }]).select().single();
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

    const toSongKey = (title, artist) => `${(title || '').trim()}::${(artist || '').trim()}`;
    const queuedSongs = allSongs.filter((s) => proposalQueueIds.includes(s.id));
    const pendingKeys = new Set([
        ...pendingProposals.map((p) => toSongKey(p.title, p.artist)),
        ...queuedSongs.map((s) => toSongKey(s.title, s.artist)),
    ]);
    const officialKeys = new Set(officialRepertoire.map((s) => toSongKey(s.title, s.artist)));
    const availableLocalSongs = allSongs.filter((s) => {
        const key = toSongKey(s.title, s.artist);
        return !officialKeys.has(key) && !pendingKeys.has(key);
    });
    const isRepertoireAdmin = showRepertoire?.role === 'admin';

    const saveOfficialSong = async (song) => {
        const { error } = await supabase.from('band_repertoire').upsert([{
            band_id: showRepertoire.id,
            title: song.title,
            artist: song.artist,
            content: song.content || '',
            bpm: song.bpm || 120,
            last_updated_by: session.user.id,
        }], { onConflict: 'band_id,title,artist' });
        if (error) throw new Error(error.message || 'Erro ao salvar repertório oficial.');
    };

    const notifyBandChange = async (kind = 'repertoire') => {
        const res = await supabase.from('band_broadcasts').insert({
            band_id: showRepertoire.id,
            sender_id: session.user.id,
            kind,
        });
        if (res.error && (res.error.message || '').toLowerCase().includes('kind')) {
            await supabase.from('band_broadcasts').insert({
                band_id: showRepertoire.id,
                sender_id: session.user.id,
            });
        }
    };

    const addSongToRepertoire = async (songId) => {
        if (!showRepertoire) return;
        if (!isRepertoireAdmin) return addSongToProposalQueue(songId);
        setLoading(true);
        try {
            const song = allSongs.find((s) => s.id === songId);
            if (!song) throw new Error('Música não encontrada.');
            await saveOfficialSong(song);
            await notifyBandChange('repertoire');
            await refreshRepertoire();
            setHasUpdates(true);
        } catch (e) {
            alert(e.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    const removeOfficialSong = async (song) => {
        if (!showRepertoire || !isRepertoireAdmin) return;
        if (!window.confirm(`Remover "${song.title}" do repertório oficial?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('band_repertoire')
                .delete()
                .eq('band_id', showRepertoire.id)
                .eq('title', song.title)
                .eq('artist', song.artist);
            if (error) throw new Error(error.message || 'Erro ao remover música oficial.');
            await notifyBandChange('repertoire');
            await refreshRepertoire();
        } catch (e) {
            alert(e.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    const acceptProposal = async (proposal) => {
        if (!isRepertoireAdmin) return;
        setLoading(true);
        try {
            await saveOfficialSong(proposal);
            const { error } = await supabase.from('band_repertoire_proposals')
                .update({ status: 'accepted', resolved_at: new Date().toISOString() })
                .eq('id', proposal.id);
            if (error) throw new Error(error.message || 'Erro ao aprovar proposta.');
            await notifyBandChange('repertoire');
            await refreshRepertoire();
            await loadPendingProposalCounts();
        } catch (e) {
            alert(e.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    const rejectProposal = async (proposal) => {
        if (!isRepertoireAdmin) return;
        if (!window.confirm('Recusar esta proposta?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('band_repertoire_proposals')
                .update({ status: 'rejected', resolved_at: new Date().toISOString() })
                .eq('id', proposal.id);
            if (error) throw new Error(error.message || 'Erro ao recusar proposta.');
            await refreshRepertoire();
            await loadPendingProposalCounts();
        } catch (e) {
            alert(e.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>BANDAS</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    {hasUpdates && (
                        <div style={{backgroundColor:'#ff9500', color:'#000', padding:'8px 15px', borderRadius:'10px', fontSize:'11px', fontWeight:'900', display:'flex', alignItems:'center', gap:'8px', animation:'pulse 2s infinite'}}>
                            <Bell size={14}/> NOVIDADES DA FROTA
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

            {/* Cadastro de Bandas */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, background: '#1c1c1e', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h4 style={{ color: '#007aff', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Nova Banda</h4>
                    <input style={styles.inputField} value={newBandName} onChange={e => setNewBandName(e.target.value)} placeholder="Nome da Banda" />
                    <button style={{ ...styles.primaryButton, marginTop: '10px' }} onClick={createBand} disabled={loading}>CADASTRAR</button>
                </div>
                <div style={{ flex: 1, background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h4 style={{ color: '#34c759', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>Código de Convite</h4>
                    <p style={{ color: '#888', fontSize: '11px', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        Digite o código da banda. Seu pedido será enviado ao administrador para aprovação.
                    </p>
                    <input style={styles.inputField} value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Ex: AX72P" />
                    <button onClick={joinBandByCode} style={{ ...styles.primaryButton, backgroundColor: '#34c759', marginTop: '10px' }} disabled={loading}>PEDIR ENTRADA</button>
                </div>
            </div>

            {/* Cards de Bandas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {bands.map(b => (
                    <div key={b.id} style={{ ...styles.settingsCard, maxWidth: 'none', background: '#1c1c1e', border: '1px solid #333' }}>
                        <div style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#000', border: '1px solid #444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {b.logo_url ? <img src={b.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music color="#333" />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ color: b.is_solo ? '#007aff' : '#FFD700', margin: 0, fontSize: '18px', fontWeight: '900' }}>{b.name}</h2>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <span style={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}>{b.role?.toUpperCase()}</span>
                                    {b.role === 'admin' && !b.is_solo && (
                                        <div style={{backgroundColor:'#222', padding:'2px 8px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'4px'}}>
                                            <Hash size={10} color="#34c759"/>
                                            <span style={{color:'#34c759', fontSize:'11px', fontWeight:'900'}}>{b.invite_code}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {!b.is_solo && (
                                    b.role === 'admin' ? 
                                    <button onClick={() => handleDeleteBand(b)} style={{ background: 'none', border: 'none', color: '#ff3b30' }} title="Excluir"><Trash2 size={18} /></button> :
                                    <button onClick={() => leaveBand(b.id)} style={{ background: 'none', border: 'none', color: '#ff9500' }} title="Sair"><UserMinus size={18} /></button>
                                )}
                                {b.role === 'admin' && (
                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setShowSettings(b)} style={{ background: 'none', border: 'none', color: '#888' }} title="Configurações da banda"><Settings size={20} /></button>
                                        {(pendingJoinCounts[b.id] || 0) > 0 && (
                                            <span title="Pedidos de entrada pendentes" style={{
                                                position: 'absolute', top: -2, right: -6, minWidth: 18, height: 18, borderRadius: 9,
                                                background: '#ff3b30', color: '#fff', fontSize: 10, fontWeight: 900,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                                            }}>
                                                {pendingJoinCounts[b.id] > 9 ? '9+' : pendingJoinCounts[b.id]}
                                            </span>
                                        )}
                                        {(pendingProposalCounts[b.id] || 0) > 0 && (
                                            <span title="Propostas de repertório pendentes" style={{
                                                position: 'absolute', top: 16, right: -6, minWidth: 18, height: 18, borderRadius: 9,
                                                background: '#ff9500', color: '#111', fontSize: 10, fontWeight: 900,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                                            }}>
                                                {pendingProposalCounts[b.id] > 9 ? '9+' : pendingProposalCounts[b.id]}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '15px 20px', borderTop: '1px solid #222', display: 'flex', gap: '8px', background: '#161618' }}>
                            <button onClick={() => setShowRepertoire(b)} style={{ ...styles.headerBtn, flex: 1, color: '#FFD700' }}><Music size={14}/> REPERTÓRIO</button>
                            <button onClick={() => setShowBandShows(b)} style={{ ...styles.headerBtn, flex: 1, color: '#fff' }}><Layout size={14}/> SHOWS</button>
                            {b.role === 'admin' && !b.is_solo && (
                                <button onClick={() => handleBroadcast(b)} style={{ ...styles.headerBtn, flex: 1, color: '#4cd964', borderColor:'#4cd96444' }}>
                                    <Radio size={14}/> DISSEMINAR
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Repertório */}
            {showRepertoire && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '850px', height: '85vh', borderRadius: '24px', border: '1px solid #444', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '25px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252529' }}>
                            <h2 style={{ color: '#FFD700', margin: 0 }}>Repertório: {showRepertoire.name}</h2>
                            <X onClick={() => setShowRepertoire(null)} style={{ cursor: 'pointer' }} color="#fff" />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            {showRepertoire.is_solo ? (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}><Zap size={40} color="#FFD700" /><h3 style={{ color: '#fff' }}>Modo Solo Ativo</h3><p>Músicas pessoais.</p></div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
                                            <h4 style={{ color: '#888', fontSize: '11px', margin: 0 }}>BIBLIOTECA LOCAL</h4>
                                            <select value={repertoireSortBy} onChange={(e) => setRepertoireSortBy(e.target.value)} style={{ background: '#111', color: '#ddd', border: '1px solid #333', borderRadius: 8, padding: '5px 8px', fontSize: 11 }}>
                                                <option value="title">Ordenar: título</option>
                                                <option value="artist">Ordenar: artista</option>
                                            </select>
                                        </div>
                                        <div style={{ background: '#111', borderRadius: '12px', padding: '10px', border: '1px solid #222', minHeight: '220px' }}>
                                            {availableLocalSongs.length === 0 ? (
                                                <p style={{ color: '#666', fontSize: '12px', margin: '8px' }}>Sem músicas disponíveis para propor.</p>
                                            ) : availableLocalSongs.map((s) => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{s.title}</div>
                                                        <div style={{ color: '#8a8a8a', fontSize: 11 }}>{s.artist || 'Artista'}</div>
                                                    </div>
                                                    <Plus onClick={() => addSongToRepertoire(s.id)} size={18} color="#34c759" style={{ cursor: 'pointer', flexShrink: 0 }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#FFD700', fontSize: '11px', marginBottom: '15px' }}>REPERTÓRIO DA BANDA</h4>
                                        <div style={{ background: '#000', borderRadius: '12px', padding: '10px', border: '1px solid #FFD70033', minHeight: '220px' }}>
                                            {officialRepertoire.map((s, idx) => (
                                                <div key={`off-${s.title}-${s.artist}-${idx}`} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ color: '#FFD700', fontSize: 13, fontWeight: 700 }}>{s.title}</div>
                                                        <div style={{ color: '#b8992d', fontSize: 11 }}>{s.artist || 'Artista'} • Oficial</div>
                                                    </div>
                                                    {isRepertoireAdmin && (
                                                        <MinusCircle onClick={() => removeOfficialSong(s)} size={18} color="#ff3b30" style={{ cursor: 'pointer', flexShrink: 0 }} />
                                                    )}
                                                </div>
                                            ))}
                                            {pendingProposals.map((p) => (
                                                <div key={p.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ color: '#9ea3aa', fontSize: 13, fontWeight: 700 }}>{p.title}</div>
                                                        <div style={{ color: '#7d858f', fontSize: 11 }}>{p.artist || 'Artista'} • Pendente</div>
                                                    </div>
                                                    {isRepertoireAdmin && (
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button type="button" disabled={loading} onClick={() => acceptProposal(p)} style={{ ...styles.headerBtn, color: '#34c759', borderColor: '#34c75955', padding: '4px 8px', fontSize: 10 }}>
                                                                <Check size={12} /> OK
                                                            </button>
                                                            <button type="button" disabled={loading} onClick={() => rejectProposal(p)} style={{ ...styles.headerBtn, color: '#ff3b30', borderColor: '#ff3b3055', padding: '4px 8px', fontSize: 10 }}>
                                                                <Ban size={12} /> NÃO
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {queuedSongs.map((s) => (
                                                <div key={`q-${s.id}`} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                                    <div>
                                                        <div style={{ color: '#9ea3aa', fontSize: 13, fontWeight: 700 }}>{s.title}</div>
                                                        <div style={{ color: '#7d858f', fontSize: 11 }}>{s.artist || 'Artista'} • Pendente (não enviado)</div>
                                                    </div>
                                                    <MinusCircle onClick={() => removeSongFromProposalQueue(s.id)} size={18} color="#ff9500" style={{ cursor: 'pointer', flexShrink: 0 }} />
                                                </div>
                                            ))}
                                            {officialRepertoire.length === 0 && pendingProposals.length === 0 && queuedSongs.length === 0 && (
                                                <p style={{ color: '#666', fontSize: '12px', margin: '8px' }}>Repertório vazio.</p>
                                            )}
                                        </div>
                                        <button type="button" disabled={loading || isRepertoireAdmin || proposalQueueIds.length === 0} onClick={submitRepertoireProposals} style={{ ...styles.primaryButton, width: '100%', marginTop: '12px', backgroundColor: proposalQueueIds.length ? '#ff9500' : '#3a3a3a', color: proposalQueueIds.length ? '#111' : '#888' }}>
                                            {isRepertoireAdmin ? 'ALTERAÇÕES DIRETAS ATIVAS (ADMIN)' : `ENVIAR PROPOSTAS (${proposalQueueIds.length})`}
                                        </button>
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
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '580px', maxHeight: '90vh', borderRadius: '28px', border: '1px solid #444', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 25px', background: '#252529', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>EDITAR BANDA</h2>
                            <X onClick={() => setShowSettings(null)} style={{ cursor: 'pointer' }} color="#888" />
                        </div>
                        <div style={{ padding: '25px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <input style={styles.inputField} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome da Banda" />
                            <textarea style={{ ...styles.inputField, height: '80px' }} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Observações..." />
                            {showSettings.role === 'admin' && !showSettings.is_solo && (
                                <div style={{ borderTop: '1px solid #333', paddingTop: '18px' }}>
                                    <h3 style={{ color: '#ff9500', fontSize: '11px', fontWeight: 900, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <UserPlus size={14} /> PEDIDOS DE ENTRADA
                                    </h3>
                                    {joinRequests.length === 0 ? (
                                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Nenhum pedido pendente.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {joinRequests.map((req) => {
                                                const prof = req.profiles;
                                                const nome = prof?.full_name || prof?.email || `Usuário ${String(req.profile_id).slice(0, 8)}…`;
                                                return (
                                                    <div key={req.id} style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                                        <div style={{ flex: 1, minWidth: 140 }}>
                                                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{nome}</div>
                                                            {prof?.email && <div style={{ color: '#888', fontSize: '11px' }}>{prof.email}</div>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button type="button" disabled={loading} onClick={() => acceptJoinRequest(req)} style={{ ...styles.headerBtn, color: '#34c759', borderColor: '#34c75955', padding: '8px 12px', fontSize: '11px' }}>
                                                                <Check size={14} /> ACEITAR
                                                            </button>
                                                            <button type="button" disabled={loading} onClick={() => rejectJoinRequest(req)} style={{ ...styles.headerBtn, color: '#ff3b30', borderColor: '#ff3b3055', padding: '8px 12px', fontSize: '11px' }}>
                                                                <Ban size={14} /> RECUSAR
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '20px', background: '#252529', flexShrink: 0 }}>
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