import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, MapPin, Trash2, Monitor, ChevronRight } from 'lucide-react';
import { db, deleteBandSetlistFromCloud } from './ShowPadCore';

export const BandShowManager = ({ band, isBandAdmin, onClose, onSelectShow, styles }) => {
    const [shows, setShows] = useState([]);

    useEffect(() => {
        if (band) {
            loadBandShows();
        }
    }, [band]);

    const loadBandShows = async () => {
        try {
            // Busca shows vinculados a esta banda no Dexie
            const list = await db.setlists.where('band_id').equals(band.id).toArray();
            setShows(list);
        } catch (e) {
            console.error("Erro ao carregar shows da banda:", e);
        }
    };

    const createNewShow = async () => {
        const newShow = {
            title: `Show em ${new Date().toLocaleDateString()}`,
            location: "Local do Evento",
            time: "21:00",
            songs: [], // Começa vazio para adicionar do repertório da banda
            band_id: band.id,
            creator_id: band.owner_id || "",
            from_band_sync: false,
            revoked_by_admin: false,
        };
        try {
            await db.setlists.add(newShow);
            await loadBandShows();
        } catch (e) {
            console.error("Erro ao criar novo show:", e);
        }
    };

    const removeLocal = async (id) => {
        await db.setlists.delete(id);
        await loadBandShows();
    };

    const deleteShow = async (show) => {
        try {
            if (show.revoked_by_admin) {
                if (!confirm('Remover da tua lista? O administrador já não mantém este show na agenda oficial.')) return;
                await removeLocal(show.id);
                return;
            }
            if (!isBandAdmin) {
                if (!confirm('Remover só neste aparelho? O show continua na agenda oficial na nuvem para os outros.')) return;
                await removeLocal(show.id);
                return;
            }
            if (!confirm('Excluir na nuvem e aqui? Membros verão este show como removido da agenda oficial após sincronizarem.')) return;
            const { error } = await deleteBandSetlistFromCloud(band.id, show.title);
            if (error) {
                alert(error.message || 'Não foi possível apagar na nuvem (verifica permissões DELETE em setlists).');
                return;
            }
            await removeLocal(show.id);
        } catch (e) {
            console.error('Erro ao excluir show:', e);
            alert(e.message || String(e));
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#1c1c1e', width: '100%', maxWidth: '700px', height: '80vh', borderRadius: '24px', border: '1px solid #444', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Header */}
                <div style={{ padding: '20px 25px', background: '#252529', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ color: '#FFD700', margin: 0, fontSize: '20px' }}>Agenda de Shows</h2>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Banda: {band ? band.name : "---"}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={createNewShow} style={{ ...styles.addBtn, padding: '8px 15px', fontSize: '12px', width: 'auto' }}>+ NOVO SHOW</button>
                        <button onClick={onClose} style={{ background: '#333', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18}/></button>
                    </div>
                </div>

                {/* Lista de Shows */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {shows.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '100px', color: '#444' }}>
                            <Calendar size={48} style={{ marginBottom: '10px', opacity: 0.2, marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
                            <p>Nenhum show agendado para esta banda.</p>
                        </div>
                    ) : (
                        [...shows].sort((a, b) => (a.revoked_by_admin ? 1 : 0) - (b.revoked_by_admin ? 1 : 0)).map((show) => {
                            const revoked = !!show.revoked_by_admin;
                            return (
                            <div key={show.id} style={{
                                ...styles.listItem,
                                marginBottom: '10px',
                                padding: '15px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                opacity: revoked ? 0.72 : 1,
                                border: revoked ? '1px dashed #555' : undefined,
                                backgroundColor: revoked ? '#1a1a1c' : undefined,
                            }} onClick={() => onSelectShow(show)}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <strong style={{ color: revoked ? '#888' : '#fff', fontSize: '16px' }}>{show.title}</strong>
                                        {revoked && (
                                            <span style={{
                                                fontSize: '10px', fontWeight: 800, color: '#000', background: '#ff9500',
                                                padding: '3px 8px', borderRadius: '8px', textTransform: 'uppercase',
                                            }}>
                                                Fora da agenda oficial
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px', color: '#888', fontSize: '12px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {show.location}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> {show.time}</span>
                                    </div>
                                    {revoked && (
                                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#a67c00', lineHeight: 1.35 }}>
                                            O administrador removeu este show na nuvem. Podes abrir para consultar ou remover da tua lista.
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <button type="button" title={revoked ? 'Remover da minha lista' : (isBandAdmin ? 'Excluir show' : 'Remover só aqui')}
                                        onClick={(e) => { e.stopPropagation(); deleteShow(show); }}
                                        style={{ background: 'none', border: 'none', color: revoked ? '#ff9500' : '#444', cursor: 'pointer' }}>
                                        <Trash2 size={18}/>
                                    </button>
                                    <ChevronRight size={20} color={revoked ? '#666' : '#007aff'} />
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};