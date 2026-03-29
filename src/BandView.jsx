import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, RefreshCw } from 'lucide-react';
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
            const { data } = await supabase.from('band_members').select('role, bands(id, name, invite_code)').eq('profile_id', session.user.id);
            if (data) {
                const list = data.map(i => ({ id: i.bands.id, name: i.bands.name, invite_code: i.bands.invite_code, role: i.role }));
                setBands(list);
                await db.my_bands.clear(); await db.my_bands.bulkAdd(list);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: band } = await supabase.from('bands').insert([{ name: newBandName, owner_id: session.user.id, invite_code: code }]).select().single();
        if (band) {
            await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);
            setNewBandName(''); fetchBands();
        }
        setLoading(false);
    };

    const joinBand = async () => {
        if (!inviteCode) return;
        setLoading(true);
        const { data: band } = await supabase.from('bands').select('id').eq('invite_code', inviteCode.trim()).single();
        if (band) {
            await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'member' }]);
            setInviteCode(''); fetchBands();
        }
        setLoading(false);
    };

    return (
        <div style={styles.garimpoPanel}>
            <h2 style={{color: '#fff', marginBottom:'20px'}}>Gestão de Bandas</h2>
            <div style={{display:'flex', gap:'20px', marginBottom:'30px'}}>
                <div style={{flex:1, background:'#1a1a1a', padding:'25px', borderRadius:'15px', border:'1px solid #333'}}>
                    <h4 style={{marginBottom:'15px'}}>Criar Nova Banda</h4>
                    <input style={styles.whiteInputLarge} placeholder="Nome da Banda" value={newBandName} onChange={e=>setNewBandName(e.target.value)} />
                    {/* CORREÇÃO AQUI (LINHA 45): Estilo fundido em um só objeto */}
                    <button 
                        style={{...styles.wideGreenBtn, backgroundColor:'#007aff', marginTop:'15px'}} 
                        onClick={createBand} 
                        disabled={loading}
                    >
                        CRIAR BANDA E GERAR CÓDIGO
                    </button>
                </div>
                <div style={{flex:1, background:'#1a1a1a', padding:'25px', borderRadius:'15px', border:'1px solid #333'}}>
                    <h4 style={{marginBottom:'15px'}}>Entrar com Convite</h4>
                    <input style={styles.whiteInputLarge} placeholder="Código" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} />
                    <button 
                        style={{...styles.wideGreenBtn, backgroundColor:'#34c759', marginTop:'15px'}} 
                        onClick={joinBand} 
                        disabled={loading}
                    >
                        ENTRAR NA BANDA
                    </button>
                </div>
            </div>
            <h3>Minhas Bandas</h3>
            <div style={styles.scrollList}>
                {bands.map(b => (
                    <div key={b.id} style={styles.miniItem}>
                        <div><strong style={{color:'#fff'}}>{b.name}</strong><div style={{fontSize:'10px', color:'#aaa'}}>{b.role==='admin'?'Líder':'Membro'}</div></div>
                        <div style={{textAlign:'right'}}>CÓDIGO: <code style={{color:'#007aff', fontSize:'16px'}}>{b.invite_code}</code></div>
                    </div>
                ))}
            </div>
        </div>
    );
};