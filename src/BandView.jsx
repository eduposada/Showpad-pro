import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, Users, Loader2, RefreshCw } from 'lucide-react';
import { supabase, db } from './ShowPadCore';

export const BandView = ({ session, styles }) => {
    const [loading, setLoading] = useState(false);
    const [bands, setBands] = useState([]);
    const [newBandName, setNewBandName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => { fetchBands(); }, []);

    const fetchBands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('band_members')
                .select('role, bands(id, name, invite_code)')
                .eq('profile_id', session.user.id);
            
            if (error) throw error;

            if (data) {
                const list = data.map(i => ({
                    id: i.bands.id,
                    name: i.bands.name,
                    invite_code: i.bands.invite_code,
                    role: i.role
                }));
                setBands(list);
                await db.my_bands.clear();
                await db.my_bands.bulkAdd(list);
            }
        } catch (err) { console.error("Erro ao buscar bandas:", err.message); }
        setLoading(false);
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // 1. Criar a banda
            const { data: band, error: bErr } = await supabase
                .from('bands')
                .insert([{ name: newBandName, owner_id: session.user.id, invite_code: code }])
                .select()
                .single();

            if (bErr) throw bErr;

            // 2. Adicionar você como admin
            const { error: mErr } = await supabase
                .from('band_members')
                .insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);

            if (mErr) throw mErr;

            alert(`Banda "${newBandName}" criada! Código: ${code}`);
            setNewBandName('');
            fetchBands();
        } catch (err) {
            alert("Erro ao criar banda: " + err.message);
        }
        setLoading(false);
    };

    const joinBand = async () => {
        if (!inviteCode) return;
        setLoading(true);
        try {
            const { data: band, error: bErr } = await supabase
                .from('bands')
                .select('id')
                .eq('invite_code', inviteCode.trim())
                .single();
            
            if (!band) throw new Error("Código de convite não encontrado.");

            const { error: jErr } = await supabase
                .from('band_members')
                .insert([{ band_id: band.id, profile_id: session.user.id, role: 'member' }]);

            if (jErr) throw new Error("Você já faz parte desta banda.");

            alert("Você entrou na banda!");
            setInviteCode('');
            fetchBands();
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
    };

    return (
        <div style={styles.garimpoPanel}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 style={{color: '#fff'}}>Minhas Bandas</h2>
                <button onClick={fetchBands} style={{background:'none', border:'none', color:'#007aff'}}><RefreshCw size={18}/></button>
            </div>
            
            <div style={{display:'flex', gap:'20px', marginBottom:'30px', marginTop:'20px'}}>
                <div style={{flex:1, background:'#2c2c2e', padding:'20px', borderRadius:'15px', border:'1px solid #333'}}>
                    <h4 style={{margin:'0 0 10px 0'}}>Nova Banda</h4>
                    <input style={styles.inputField} placeholder="Ex: Os Tecladistas" value={newBandName} onChange={e=>setNewBandName(e.target.value)} />
                    <button style={{...styles.primaryButton, backgroundColor:'#007aff'}} onClick={createBand} disabled={loading}>Criar</button>
                </div>
                <div style={{flex:1, background:'#2c2c2e', padding:'20px', borderRadius:'15px', border:'1px solid #333'}}>
                    <h4 style={{margin:'0 0 10px 0'}}>Convite</h4>
                    <input style={styles.inputField} placeholder="Código" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} />
                    <button style={{...styles.primaryButton, backgroundColor:'#34c759'}} onClick={joinBand} disabled={loading}>Entrar</button>
                </div>
            </div>

            <h3>Bandas que Participo</h3>
            <div style={styles.scrollList}>
                {bands.length === 0 ? <p style={{padding:'20px', color:'#555'}}>Nenhuma banda cadastrada.</p> : bands.map(b => (
                    <div key={b.id} style={{padding:'15px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <strong style={{fontSize:'16px', color:'#fff'}}>{b.name}</strong>
                            <div style={{fontSize:'11px', color:'#888'}}>Status: {b.role === 'admin' ? 'Líder' : 'Membro'}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <div style={{fontSize:'9px', color:'#aaa'}}>CÓDIGO DE ACESSO</div>
                            <code style={{color:'#007aff', fontWeight:'bold', fontSize:'16px'}}>{b.invite_code}</code>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};