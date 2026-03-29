import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, Users, Loader2 } from 'lucide-react';
import { supabase, db } from './ShowPadCore';

export const BandView = ({ session, styles }) => {
    const [loading, setLoading] = useState(false);
    const [bands, setBands] = useState([]);
    const [newBandName, setNewBandName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => { fetchBands(); }, []);

    const fetchBands = async () => {
        const { data } = await supabase.from('band_members').select('role, bands(id, name, invite_code)').eq('profile_id', session.user.id);
        if (data) {
            const list = data.map(i => ({ id: i.bands.id, name: i.bands.name, invite_code: i.bands.invite_code, role: i.role }));
            setBands(list);
            await db.my_bands.clear();
            await db.my_bands.bulkAdd(list);
        }
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
        const { data: band } = await supabase.from('bands').select('id').eq('invite_code', inviteCode).single();
        if (band) {
            await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'member' }]);
            setInviteCode(''); fetchBands();
        } else { alert("Código não encontrado."); }
        setLoading(false);
    };

    return (
        <div style={styles.garimpoPanel}>
            <h2>Gestão de Bandas</h2>
            <div style={{display:'flex', gap:'20px', marginBottom:'30px'}}>
                <div style={{flex:1, background:'#2c2c2e', padding:'20px', borderRadius:'15px'}}>
                    <h4>Criar Nova Banda</h4>
                    <input style={styles.inputField} placeholder="Nome da Banda" value={newBandName} onChange={e=>setNewBandName(e.target.value)} />
                    <button style={{...styles.primaryButton, marginTop:'10px'}} onClick={createBand}>Criar</button>
                </div>
                <div style={{flex:1, background:'#2c2c2e', padding:'20px', borderRadius:'15px'}}>
                    <h4>Entrar em Banda</h4>
                    <input style={styles.inputField} placeholder="Código" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} />
                    <button style={{...styles.primaryButton, marginTop:'10px', backgroundColor:'#007aff'}} onClick={joinBand}>Entrar</button>
                </div>
            </div>
            <h3>Bandas que Participo</h3>
            <div style={styles.scrollList}>
                {bands.map(b => (
                    <div key={b.id} style={styles.miniItem}>
                        <div><strong>{b.name}</strong><div style={{fontSize:'10px'}}>{b.role === 'admin' ? 'Líder' : 'Músico'}</div></div>
                        <div>CÓDIGO: <code style={{color:'#007aff'}}>{b.invite_code}</code></div>
                    </div>
                ))}
            </div>
        </div>
    );
};