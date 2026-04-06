import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, MapPin, Trash2, Monitor, ChevronRight } from 'lucide-react';
import { db, supabase } from './ShowPadCore';

export const BandShowManager = ({ band, onClose, onSelectShow, styles }) => {
    const [shows, setShows] = useState([]);

    useEffect(() => {
        loadBandShows();
    }, [band]);

    const loadBandShows = async () => {
        // Busca shows vinculados a esta banda no Dexie
        const list = await db.setlists.where('band_id').equals(band.id).toArray();
        setShows(list);
    };

    const createNewShow = async () => {
        const newShow = {
            title: `Show em ${new Date().toLocaleDateString()}`,
            location: "Local do Evento",
            time: "21:00",
            songs: [], // Começa vazio para adicionar do repertório da banda
            band_id: band.id,
            creator_id: band.owner_id || "" 
        };
        const id = await db.setlists.add(newShow);
        loadBandShows();
        // Opcional: já abrir o editor para este show
    };

    const deleteShow = async (id) => {
        if (confirm("Excluir este show permanentemente?")) {
            await db.setlists.delete(id);
            loadBandShows();
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '700px', height: '80vh', borderRadius: '24px', border: '1px solid #444', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Header */}
                <div style={{ padding: '20px 25px', background: '#252529', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ color: '#FFD700', margin: 0, fontSize: '20px' }}>Agenda de Shows</h2>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Banda: {band.name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={createNewShow} style={{ ...styles.addBtn, padding: '8px 15px', fontSize: '12px' }}>+ NOVO SHOW</button>
                        <button onClick={onClose} style={{ background: '#333', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff' }}><X size={18}/></button>
                    </div>
                </div>

                {/* Lista de Shows */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {shows.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '100px', color: '#444' }}>
                            <Calendar size={48} style={{ marginBottom: '10px', opacity: 0.2 }} />
                            <p>Nenhum show agendado para esta banda.</p>
                        </div>
                    ) : (
                        shows.map(show => (
                            <div key={show.id} style={{ ...styles.listItem, marginBottom: '10px', padding: '15px' }} onClick={() => onSelectShow(show)}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <strong style={{ color: '#fff', fontSize: '16px' }}>{show.title}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px', color: '#888', fontSize: '12px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {show.location}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> {show.time}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); deleteShow(show.id); }} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><Trash2 size={18}/></button>
                                    <ChevronRight size={20} color="#007aff" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};