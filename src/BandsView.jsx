import React, { useState, useEffect } from 'react';
import { Users, Plus, Music, ListMusic, Trash2 } from 'lucide-react';
import { db } from './ShowPadCore';

export const BandsView = ({ styles, session, onOpenSetlist }) => {
    const [bands, setBands] = useState([]);
    const [setlists, setSetlists] = useState([]);
    const [newBandName, setNewBandName] = useState("");

    useEffect(() => {
        loadData();
    }, [session]);

    const loadData = async () => {
        if (!session) return;
        
        // 1. Carregar Bandas
        let b = await db.bands.toArray();
        
        // 2. Verificar/Criar Banda Solo de forma blindada
        const soloName = `${session.user.user_metadata?.full_name || 'Edu'} (Solo)`;
        const existingSolo = b.find(x => x.is_solo === true || x.is_solo === 1);
        
        if (!existingSolo) {
            await db.bands.add({ 
                name: soloName, 
                is_solo: true, 
                members: [session.user.email],
                creator_id: session.user.id 
            });
            b = await db.bands.toArray();
        }
        
        setBands(b);

        // 3. Carregar Setlists
        const s = await db.setlists.toArray();
        setSetlists(s);
    };

    const addBand = async () => {
        if (!newBandName) return;
        await db.bands.add({
            name: newBandName,
            is_solo: false,
            members: [session.user.email],
            creator_id: session.user.id
        });
        setNewBandName("");
        loadData();
    };

    const deleteBand = async (bandId) => {
        if (confirm("Deseja apagar esta banda e todos os seus setlists? As músicas individuais não serão apagadas.")) {
            // Limpa setlists da banda
            const relatedSetlists = await db.setlists.where({ band_id: bandId }).toArray();
            for (let sl of relatedSetlists) {
                await db.setlists.delete(sl.id);
            }
            // Apaga a banda
            await db.bands.delete(bandId);
            loadData();
        }
    };

    const deleteSetlist = async (e, slId) => {
        e.stopPropagation();
        if (confirm("Apagar este setlist?")) {
            await db.setlists.delete(slId);
            loadData();
        }
    };

    return (
        <div style={{ padding: '30px', backgroundColor: '#000', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#fff', margin: 0 }}>Minhas Bandas</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        style={{ ...styles.inputField, width: '200px', height: '40px' }} 
                        placeholder="Nome da nova banda..." 
                        value={newBandName}
                        onChange={e => setNewBandName(e.target.value)}
                    />
                    <button style={{ ...styles.addBtn, width: '120px' }} onClick={addBand}>
                        <Plus size={18} /> NOVA BANDA
                    </button>
                </div>
            </div>

            <div style={styles.bandGrid}>
                {bands.map(band => (
                    <div key={band.id} style={styles.bandCard}>
                        <div style={styles.bandHeader}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 style={styles.bandName}>{band.name}</h3>
                                <span style={band.is_solo ? styles.bandTagSolo : styles.bandTagGroup}>
                                    {band.is_solo ? "MODO SOLO" : "GRUPO"}
                                </span>
                            </div>
                            
                            {/* LIXEIRA: Só aparece se não for a Banda Solo */}
                            {!band.is_solo && (
                                <Trash2 
                                    size={18} 
                                    color="#444" 
                                    style={{ cursor: 'pointer' }} 
                                    onClick={() => deleteBand(band.id)}
                                />
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#007aff', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                                <ListMusic size={16} /> SETLISTS DA BANDA
                            </div>

                            <div style={styles.setlistList}>
                                {setlists.filter(s => s.band_id === band.id).length === 0 ? (
                                    <span style={{ fontSize: '11px', color: '#555' }}>Nenhum setlist criado.</span>
                                ) : (
                                    setlists.filter(s => s.band_id === band.id).map(sl => (
                                        <div 
                                            key={sl.id} 
                                            style={styles.setlistItemMini}
                                            onClick={() => onOpenSetlist(sl)}
                                        >
                                            <span>{sl.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '10px', opacity: 0.5 }}>{sl.songs?.length || 0} músicas</span>
                                                <Trash2 size={14} color="#555" onClick={(e) => deleteSetlist(e, sl.id)} />
                                            </div>
                                        </div>
                                    ))
                                )}
                                
                                <button 
                                    style={{ 
                                        marginTop: '10px', 
                                        background: 'none', 
                                        border: '1px dashed #444', 
                                        color: '#888', 
                                        padding: '8px', 
                                        borderRadius: '8px', 
                                        fontSize: '11px', 
                                        cursor: 'pointer' 
                                    }}
                                    onClick={async () => {
                                        const name = prompt("Nome do Setlist:");
                                        if (name) {
                                            await db.setlists.add({
                                                name,
                                                band_id: band.id,
                                                songs: [],
                                                creator_id: session.user.id
                                            });
                                            loadData();
                                        }
                                    }}
                                >
                                    + NOVO SETLIST PARA ESTA BANDA
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};