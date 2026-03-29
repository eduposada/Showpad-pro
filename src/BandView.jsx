import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, RefreshCw, Users } from 'lucide-react';
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

    return (
        <div style={styles.garimpoPanel}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                <h2 style={{color: '#fff', margin: 0}}>Gestão de Bandas</h2>
                <button onClick={fetchBands} style={{background:'none', border:'none', color:'#007aff', cursor:'pointer'}}><RefreshCw size={20}/></button>
            </div>
            
            <div style={{display:'flex', gap:'20px', marginBottom:'40px'}}>
                <div style={{flex:1, background:'#1a1a1a', padding:'20px', borderRadius:'12px', border:'1px solid #333'}}>
                    <span style={styles.showLabel}>Nome da Nova Banda</span>
                    <input style={styles.whiteInputLarge} value={newBandName} onChange={e=>setNewBandName(e.target.value)} placeholder="Ex: Banda Alpha" />
                    <button style={{...styles.wideGreenBtn, backgroundColor:'#007aff', marginTop:'15px'}} onClick={createBand}>CRIAR BANDA</button>
                </div>
                <div style={{flex:1, background:'#1a1a1a', padding:'20px', borderRadius:'12px', border:'1px solid #333'}}>
                    <span style={styles.showLabel}>Código de Convite</span>
                    <input style={styles.whiteInputLarge} value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="Digite o Código" />
                    <button style={{...styles.wideGreenBtn, marginTop:'15px'}} onClick={async ()=>{
                        const { data } = await supabase.from('bands').select('id').eq('invite_code', inviteCode.trim().toUpperCase()).single();
                        if (data) { await supabase.from('band_members').insert([{ band_id: data.id, profile_id: session.user.id, role: 'member' }]); setInviteCode(''); fetchBands(); }
                        else { alert("Código não encontrado."); }
                    }}>ENTRAR NA BANDA</button>
                </div>
            </div>

            <h3 style={{marginBottom:'10px', fontSize:'16px'}}>Bandas Cadastradas</h3>
            
            {/* CABEÇALHO DA TABELA */}
            <div style={styles.tableHeader}>
                <div style={styles.colName}>Nome da Banda</div>
                <div style={styles.colRole}>Sua Função</div>
                <div style={styles.colCode}>Código de Acesso</div>
            </div>

            <div style={styles.scrollList}>
                {bands.length === 0 ? (
                    <div style={{padding:'40px', textAlign:'center', color:'#444'}}>Nenhuma banda vinculada.</div>
                ) : (
                    bands.map(b => (
                        <div key={b.id} style={styles.tableRow}>
                            <div style={styles.colName}>{b.name}</div>
                            <div style={styles.colRole}>
                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                    <Users size={12}/> {b.role === 'admin' ? 'Administrador' : 'Músico'}
                                </div>
                            </div>
                            <div style={styles.colCode}>{b.invite_code}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};