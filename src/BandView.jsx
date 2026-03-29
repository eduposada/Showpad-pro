import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, RefreshCw } from 'lucide-react';
import { supabase, db } from './ShowPadCore';

export const BandView = ({ session, styles }) => {
    const [loading, setLoading] = useState(false), [bands, setBands] = useState([]), [newBandName, setNewBandName] = useState(''), [inviteCode, setInviteCode] = useState('');
    useEffect(() => { fetchBands(); }, []);
    const fetchBands = async () => {
        const { data } = await supabase.from('band_members').select('role, bands(id, name, invite_code)').eq('profile_id', session.user.id);
        if (data) {
            const list = data.map(i => ({ id: i.bands.id, name: i.bands.name, invite_code: i.bands.invite_code, role: i.role }));
            setBands(list);
            await db.my_bands.clear(); await db.my_bands.bulkAdd(list);
        }
    };
    const createBand = async () => {
        if (!newBandName) return; setLoading(true);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: band } = await supabase.from('bands').insert([{ name: newBandName, owner_id: session.user.id, invite_code: code }]).select().single();
        if (band) {
            await supabase.from('band_members').insert([{ band_id: band.id, profile_id: session.user.id, role: 'admin' }]);
            setNewBandName(''); fetchBands();
        }
        setLoading(false);
    };
    return (
        <div style={styles.garimpoPanel}>
            <h2>Gestão de Bandas</h2>
            <div style={{display:'flex', gap:'20px', marginBottom:'30px', marginTop:'20px'}}>
                <div style={{flex:1, background:'#1a1a1a', padding:'20px', borderRadius:'15px', border:'1px solid #333'}}>
                    <span style={styles.showLabel}>Nome da Nova Banda</span>
                    <input style={styles.whiteInputLarge} value={newBandName} onChange={e=>setNewBandName(e.target.value)} />
                    <button style={{...styles.wideGreenBtn, backgroundColor:'#007aff', height:'40px', marginTop:'15px'}} onClick={createBand}>CRIAR BANDA</button>
                </div>
                <div style={{flex:1, background:'#1a1a1a', padding:'20px', borderRadius:'15px', border:'1px solid #333'}}>
                    <span style={styles.showLabel}>Código de Convite</span>
                    <input style={styles.whiteInputLarge} value={inviteCode} onChange={e=>setInviteCode(e.target.value)} />
                    <button style={{...styles.wideGreenBtn, height:'40px', marginTop:'15px'}} onClick={async ()=>{
                        const { data } = await supabase.from('bands').select('id').eq('invite_code', inviteCode.trim()).single();
                        if (data) { await supabase.from('band_members').insert([{ band_id: data.id, profile_id: session.user.id, role: 'member' }]); setInviteCode(''); fetchBands(); }
                    }}>ENTRAR</button>
                </div>
            </div>
            <h3>Participações</h3>
            <div style={styles.scrollList}>
                {bands.map(b => (<div key={b.id} style={styles.miniItem}><div><strong>{b.name}</strong><div style={{fontSize:'10px'}}>{b.role==='admin'?'Líder':'Membro'}</div></div><div>CÓDIGO: <code style={{color:'#007aff'}}>{b.invite_code}</code></div></div>))}
            </div>
        </div>
    );
};