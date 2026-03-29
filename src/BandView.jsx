import React, { useState, useEffect } from 'react';
import { Users, Plus, DoorOpen, Copy, Check, Loader2 } from 'lucide-react';
import { supabase, db } from './ShowPadCore';

export const BandView = ({ session, styles, refreshApp }) => {
    const [loading, setLoading] = useState(false);
    const [bands, setBands] = useState([]);
    const [newBandName, setNewBandName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => { fetchBands(); }, []);

    const fetchBands = async () => {
        const { data, error } = await supabase
            .from('band_members')
            .select('role, bands(id, name, invite_code)')
            .eq('profile_id', session.user.id);
        
        if (data) {
            const formatted = data.map(item => ({
                id: item.bands.id,
                name: item.bands.name,
                invite_code: item.bands.invite_code,
                role: item.role
            }));
            setBands(formatted);
            await db.my_bands.clear();
            await db.my_bands.bulkAdd(formatted);
        }
    };

    const createBand = async () => {
        if (!newBandName) return;
        setLoading(true);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { data: band, error: bErr } = await supabase
            .from('bands')
            .insert([{ name: newBandName, owner_id: session.user.id, invite_code: code }])
            .select()
            .single();

        if (band) {
            await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);
            setNewBandName('');
            fetchBands();
        }
        setLoading(false);
    };

    const joinBand = async () => {
        if (!inviteCode) return;
        setLoading(true);
        const { data: band, error } = await supabase.from('bands').select('id').eq('invite_code', inviteCode).single();
        
        if (band) {
            const { error: jErr } = await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'member' }]);
            if (jErr) alert("Você já está nesta banda ou código inválido.");
            else { setInviteCode(''); fetchBands(); }
        } else {
            alert("Código de convite não encontrado.");
        }
        setLoading(false);
    };

    return (
        <div style={styles.garimpoPanel}>
            <h2>Gestão de Bandas</h2>
            <div style={{display:'flex', gap:'20px', marginBottom:'30px'}}>
                <div style={{flex:1, background:'#2c2c2e', padding:'20px', borderRadius:'15px'}}>
                    <h4>Criar Banda</h4>
                    <input style={styles.inputField} placeholder="Nome da Banda" value={newBandName} onChange={e=>setNewBandName(e.target.value)} />
                    <button style={{...styles.processBtn, marginTop:'10px'}} onClick={createBand} disabled={loading}><Plus size={18}/> Criar</button>
                </div>
                <div style={{flex:1, background:'#2c2c2e', padding:'20px', borderRadius:'15px'}}>
                    <h4>Entrar em Banda</h4>
                    <input style={styles.inputField} placeholder="Código de Convite" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} />
                    <button style={{...styles.processBtn, marginTop:'10px', backgroundColor:'#007aff'}} onClick={joinBand} disabled={loading}><DoorOpen size={18}/> Entrar</button>
                </div>
            </div>

            <h3>Minhas Participações</h3>
            <div style={styles.scrollList}>
                {bands.map(b => (
                    <div key={b.id} style={{padding:'15px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between'}}>
                        <div>
                            <strong style={{fontSize:'16px'}}>{b.name}</strong>
                            <div style={{fontSize:'11px', color:'#888'}}>Função: {b.role === 'admin' ? 'Líder' : 'Músico'}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <div style={{fontSize:'10px', color:'#aaa'}}>CÓDIGO DE CONVITE</div>
                            <code style={{color:'#007aff', fontWeight:'bold'}}>{b.invite_code}</code>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};