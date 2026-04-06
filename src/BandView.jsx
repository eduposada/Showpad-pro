import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, RefreshCw, Users, Trash2, Layout, Music, Copy, CheckCircle, X, Zap } from 'lucide-react';
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

    useEffect(() => { 
        fetchBands(); 
        loadSongs();
    }, []);

    const loadSongs = async () => {
        const s = await db.songs.toArray();
        setAllSongs(s);
    };

    const fetchBands = async () => {
        setLoading(true);
        try {
            // 1. Busca no Supabase
            const { data, error } = await supabase
                .from('band_members')
                .select(`role, bands (id, name, invite_code)`)
                .eq('profile_id', session.user.id);

            let cloudList = [];
            if (data) {
                cloudList = data.filter(i => i.bands).map(i => ({ 
                    id: i.bands.id, 
                    name: i.bands.name, 
                    invite_code: i.bands.invite_code, 
                    role: i.role,
                    is_solo: i.bands.invite_code.startsWith("SOLO")
                }));
            }

            // 2. Busca no Dexie (Garante a Banda Solo local)
            const localBands = await db.my_bands.toArray();
            
            // 3. Merge inteligente
            const combined = [...cloudList];
            localBands.forEach(lb => {
                if (!combined.find(c => c.id === lb.id)) combined.push(lb);
            });

            setBands(combined);
            
            // Atualiza o cache local
            await db.my_bands.clear(); 
            if (combined.length > 0) await db.my_bands.bulkAdd(combined);
            
        } catch (err) { 
            console.error("Erro na faina de busca:", err); 
        }
        setLoading(false);
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: band, error } = await supabase
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
        } catch (err) { alert("Erro ao criar: " + err.message); }
        setLoading(false);
    };

    const handleDeleteBand = async (band) => {
        if (!confirm(`⚓ ATENÇÃO COMANDANTE: Deseja realmente excluir a banda "${band.name}"?`)) return;
        
        setLoading(true);
        try {
            // Ordem de demolição na Nuvem (Supabase)
            const { error } = await supabase
                .from('bands')
                .delete()
                .eq('id', band.id);

            if (error) throw error;

            // Limpeza no Porto Local (Dexie)
            await db.my_bands.delete(band.id);

            await fetchBands();
            alert("Banda enviada para o fundo do mar!");
        } catch (err) {
            alert("Falha na exclusão: " + err.message);
        }
        setLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={styles.garimpoPanel}>
            {/* HEADER NAVAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>BANDAS</h1>
                    <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Gestão de guarnições e repertórios.</p>
                </div>
                <button 
                    onClick={fetchBands} 
                    style={{ ...styles.headerBtn, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""}/> 
                    {loading ? "SINCRONIZANDO..." : "ATUALIZAR"}
                </button>
            </div>
            
            {/* PAINEL DE COMANDO (CRIAR/ENTRAR) */}
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

            {/* LISTAGEM DE CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {bands.map(b => (
                    <div key={b.id} style={{ ...styles.settingsCard, maxWidth: 'none', border: '1px solid #333', background: '#1c1c1e', position: 'relative' }}>
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ color: '#FFD700', margin: 0, fontSize: '20px', fontWeight: '900' }}>{b.name}</h2>
                                <span style={{ color: b.role === 'admin' ? '#007aff' : '#888', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                                    <Users size={12}/> {b.role === 'admin' ? '⚓ LÍDER' : 'MÚSICO'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div 
                                    onClick={() => copyToClipboard(b.invite_code)}
                                    style={{ background: '#000', padding: '5px 10px', borderRadius: '6px', border: '1px solid #333', cursor: 'pointer', textAlign: 'center' }}
                                >
                                    <small style={{ color: '#555', display: 'block', fontSize: '8px' }}>CONVITE</small>
                                    <code style={{ color: '#fff', fontSize: '14px' }}>{b.invite_code}</code>
                                </div>
                                {!b.is_solo && b.role === 'admin' && (
                                    <button 
                                        onClick={() => handleDeleteBand(b)}
                                        style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', padding: '5px' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div style={{ padding: '15px 20px', borderTop: '1px solid #222', display: 'flex', gap: '10px', background: '#161618' }}>
                            <button 
                                onClick={() => setShowRepertoire(b)}
                                style={{ ...styles.headerBtn, flex: 1, color: '#FFD700', border: '1px solid #444' }}
                            >
                                <Music size={14}/> REPERTÓRIO
                            </button>
                            <button style={{ ...styles.headerBtn, flex: 1, color: '#fff', border: '1px solid #444' }}>
                                <Layout size={14}/> SHOWS
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE REPERTÓRIO (INTERFACE DE SELEÇÃO) */}
            {showRepertoire && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '850px', height: '85vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', border: '1px solid #444', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        
                        <div style={{ padding: '25px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252529' }}>
                            <div>
                                <h2 style={{ color: '#FFD700', margin: 0, fontSize: '22px' }}>Gestão de Repertório</h2>
                                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Banda: {showRepertoire.name}</p>
                            </div>
                            <button 
                                onClick={() => setShowRepertoire(null)} 
                                style={{ background: '#ff3b30', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <X size={20} color="#fff" />
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            {showRepertoire.is_solo ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                    <div style={{ background: '#222', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <Zap size={40} color="#FFD700" />
                                    </div>
                                    <h3 style={{ color: '#fff' }}>Modo Solo Ativo</h3>
                                    <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                                        Neste modo, o ShowPad Pro disponibiliza automaticamente <strong>toda a sua biblioteca global</strong> para criação de shows. Não é necessário selecionar músicas individualmente.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', height: '100%' }}>
                                    {/* COLUNA ESQUERDA: BIBLIOTECA */}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <h4 style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>📚 Sua Biblioteca</h4>
                                        <div style={{ flex: 1, background: '#111', borderRadius: '12px', padding: '10px', border: '1px solid #222', overflowY: 'auto' }}>
                                            {allSongs.map(s => (
                                                <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>{s.title}</div>
                                                        <div style={{ color: '#666', fontSize: '10px' }}>{s.artist}</div>
                                                    </div>
                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                        <Plus size={18} color="#34c759" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* COLUNA DIREITA: REPERTÓRIO DA BANDA */}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <h4 style={{ color: '#FFD700', fontSize: '11px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>🎸 Repertório da Banda</h4>
                                        <div style={{ flex: 1, background: '#000', borderRadius: '12px', padding: '10px', border: '1px solid #FFD70033', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <Music size={32} color="#222" style={{ marginBottom: '10px' }} />
                                            <p style={{ color: '#444', fontSize: '12px', textAlign: 'center' }}>Adicione músicas da biblioteca <br/> para compor o repertório desta banda.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div style={{ padding: '20px', background: '#252529', borderTop: '1px solid #333', textAlign: 'right' }}>
                            <button onClick={() => setShowRepertoire(null)} style={styles.saveBtn}>CONCLUIR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};