import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, RefreshCw, Users, Trash2, Layout, Music, Copy, CheckCircle } from 'lucide-react';
import { supabase, db } from './ShowPadCore';

export const BandView = ({ session, styles }) => {
    const [loading, setLoading] = useState(false);
    const [bands, setBands] = useState([]);
    const [newBandName, setNewBandName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => { fetchBands(); }, []);

    const fetchBands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('band_members')
                .select(`
                    role, 
                    bands (
                        id, 
                        name, 
                        invite_code
                    )
                `)
                .eq('profile_id', session.user.id);

            if (error) throw error;

            if (data) {
                const list = data
                    .filter(i => i.bands) // Garante que a banda existe
                    .map(i => ({ 
                        id: i.bands.id, 
                        name: i.bands.name, 
                        invite_code: i.bands.invite_code, 
                        role: i.role 
                    }));
                setBands(list);
                await db.my_bands.clear(); 
                await db.my_bands.bulkAdd(list);
            }
        } catch (err) { 
            console.error("Erro ao buscar bandas:", err); 
        }
        setLoading(false);
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Tenta criar a banda. Se der erro de 'invite_code', o catch vai pegar.
            const { data: band, error: bandError } = await supabase
                .from('bands')
                .insert([{ 
                    name: newBandName, 
                    owner_id: session.user.id, 
                    invite_code: code 
                }])
                .select()
                .single();

            if (bandError) {
                if (bandError.message.includes('invite_code')) {
                    throw new Error("A coluna 'invite_code' não existe na tabela 'bands' do Supabase. Verifique o banco de dados.");
                }
                throw bandError;
            }

            if (band) {
                const { error: memberError } = await supabase
                    .from('band_members')
                    .insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);
                
                if (memberError) throw memberError;

                setNewBandName(''); 
                await fetchBands();
                alert(`Banda "${band.name}" criada com sucesso!`);
            }
        } catch (err) {
            alert("Erro na Operação: " + err.message);
        }
        setLoading(false);
    };

    const joinBand = async () => {
        if (!inviteCode) return;
        setLoading(true);
        try {
            const cleanCode = inviteCode.trim().toUpperCase();
            const { data: band, error: searchError } = await supabase
                .from('bands')
                .select('id, name')
                .eq('invite_code', cleanCode)
                .single();

            if (searchError || !band) {
                alert("Código de convite não encontrado.");
            } else {
                const { error: joinError } = await supabase
                    .from('band_members')
                    .insert([{ band_id: band.id, profile_id: session.user.id, role: 'member' }]);
                
                if (joinError) {
                    if (joinError.code === "23505") alert("Você já faz parte desta banda!");
                    else throw joinError;
                } else {
                    alert(`Bem-vindo à banda ${band.name}!`);
                    setInviteCode('');
                    fetchBands();
                }
            }
        } catch (err) {
            console.error(err);
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
            {/* CABEÇALHO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 }}>BANDAS</h1>
                    <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Gestão de formações e códigos de acesso.</p>
                </div>
                <button 
                    onClick={fetchBands} 
                    style={{ background: '#1c1c1e', border: '1px solid #444', borderRadius: '12px', padding: '12px', color: '#007aff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>SINCRONIZAR</span>
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                {/* CRIAR BANDA */}
                <div style={{ flex: 1, background: '#1c1c1e', padding: '25px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h3 style={{ color: '#007aff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={14}/> Criar Nova Banda
                    </h3>
                    <input 
                        style={styles.inputField} 
                        value={newBandName} 
                        onChange={e => setNewBandName(e.target.value)} 
                        placeholder="Nome da Banda" 
                    />
                    <button 
                        style={{ ...styles.primaryButton, marginTop: '15px' }} 
                        onClick={createBand}
                        disabled={loading}
                    >
                        {loading ? "CRIANDO..." : "CADASTRAR"}
                    </button>
                </div>

                {/* ENTRAR EM BANDA */}
                <div style={{ flex: 1, background: '#111', padding: '25px', borderRadius: '15px', border: '1px solid #333' }}>
                    <h3 style={{ color: '#34c759', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={14}/> Código de Convite
                    </h3>
                    <input 
                        style={styles.inputField} 
                        value={inviteCode} 
                        onChange={e => setInviteCode(e.target.value.toUpperCase())} 
                        placeholder="Ex: XH892A" 
                    />
                    <button 
                        style={{ ...styles.primaryButton, backgroundColor: '#34c759', marginTop: '15px' }} 
                        onClick={joinBand}
                        disabled={loading}
                    >
                        {loading ? "BUSCANDO..." : "ENTRAR"}
                    </button>
                </div>
            </div>

            <h3 style={{ marginBottom: '20px', fontSize: '14px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Formações
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {bands.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#444', gridColumn: '1/-1', border: '2px dashed #222', borderRadius: '20px' }}>
                        <Users size={48} style={{ marginBottom: '15px', opacity: 0.2 }} />
                        <p>Nenhuma banda encontrada no seu perfil.</p>
                    </div>
                ) : (
                    bands.map(b => (
                        <div key={b.id} style={{ ...styles.settingsCard, maxWidth: 'none', border: '1px solid #333', background: '#1c1c1e' }}>
                            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ color: '#FFD700', margin: 0, fontSize: '22px', fontWeight: '900' }}>{b.name}</h2>
                                    <span style={{ color: b.role === 'admin' ? '#007aff' : '#888', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                                        <Users size={12}/> {b.role === 'admin' ? 'Administrador' : 'Membro'}
                                    </span>
                                </div>
                                <div 
                                    onClick={() => copyToClipboard(b.invite_code)}
                                    style={{ background: '#000', padding: '10px 15px', borderRadius: '10px', border: '1px solid #333', cursor: 'pointer', textAlign: 'center', minWidth: '80px' }}
                                >
                                    <small style={{ color: '#666', display: 'block', fontSize: '8px', fontWeight: 'bold' }}>CÓDIGO</small>
                                    <strong style={{ color: '#fff', fontFamily: 'monospace', fontSize: '16px' }}>{b.invite_code || "---"}</strong>
                                    {copied && <div style={{ fontSize: '8px', color: '#34c759', marginTop: '2px' }}>COPIADO</div>}
                                </div>
                            </div>
                            
                            <div style={{ padding: '15px 20px', borderTop: '1px solid #222', display: 'flex', gap: '10px', background: '#161618' }}>
                                <button style={{ ...styles.headerBtn, flex: 1, color: '#FFD700', border: '1px solid #444' }}>
                                    <Music size={14}/> REPERTÓRIO
                                </button>
                                <button style={{ ...styles.headerBtn, flex: 1, color: '#fff', border: '1px solid #444' }}>
                                    <Layout size={14}/> SHOWS
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};