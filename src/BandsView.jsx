import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, ListMusic, Trash2, Send, MessageSquare, X, Mail } from 'lucide-react';
import { db, supabase, sendBandMessage, inviteMember } from './ShowPadCore';

export const BandsView = ({ styles, session, onOpenSetlist }) => {
    const [bands, setBands] = useState([]);
    const [selectedBand, setSelectedBand] = useState(null);
    const [setlists, setSetlists] = useState([]);
    const [newBandName, setNewBandName] = useState("");
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState("");
    const chatEndRef = useRef(null);

    useEffect(() => { loadData(); }, [session]);

    // Escuta mensagens em Tempo Real (Realtime)
    useEffect(() => {
        if (!selectedBand || !supabase) return;

        const channel = supabase
            .channel(`band_chat_${selectedBand.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'band_messages', filter: `band_id=eq.${selectedBand.id}` }, 
                payload => {
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        loadMessages(selectedBand.id);
        return () => supabase.removeChannel(channel);
    }, [selectedBand]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const loadData = async () => {
        if (!session) return;
        const b = await db.bands.toArray();
        setBands(b);
        setSetlists(await db.setlists.toArray());
    };

    const loadMessages = async (bandId) => {
        const { data } = await supabase.from('band_messages').select('*').eq('band_id', bandId).order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    const handleSendMessage = async () => {
        if (!msgInput.trim() || !selectedBand) return;
        await sendBandMessage(selectedBand.id, session.user.id, session.user.user_metadata.full_name || "Músico", msgInput);
        setMsgInput("");
    };

    const handleInvite = async () => {
        const email = prompt("Digite o e-mail do músico para convidar:");
        if (email && selectedBand) {
            await inviteMember(selectedBand.id, email, session.user.id);
            alert("Convite enviado!");
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', backgroundColor: '#000' }}>
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#fff', margin: 0 }}>Minhas Bandas</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            style={{ ...styles.inputField, width: '200px', height: '40px' }} 
                            placeholder="Nome da banda..." 
                            value={newBandName}
                            onChange={e => setNewBandName(e.target.value)}
                        />
                        <button style={{ ...styles.addBtn, width: '120px' }} onClick={async () => {
                            await db.bands.add({ name: newBandName, is_solo: false, creator_id: session.user.id });
                            setNewBandName(""); loadData();
                        }}>
                            <Plus size={18} /> NOVA BANDA
                        </button>
                    </div>
                </div>

                <div style={styles.bandGrid}>
                    {bands.map(band => (
                        <div 
                            key={band.id} 
                            style={{...styles.bandCard, border: selectedBand?.id === band.id ? '2px solid #007aff' : '1px solid #333'}}
                            onClick={() => setSelectedBand(band)}
                        >
                            <div style={styles.bandHeader}>
                                <h3 style={styles.bandName}>{band.name}</h3>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <MessageSquare size={18} color="#888" onClick={() => setChatOpen(true)} style={{cursor:'pointer'}} />
                                    {!band.is_solo && <Trash2 size={18} color="#444" style={{cursor:'pointer'}} />}
                                </div>
                            </div>

                            <div style={{marginTop:'15px'}}>
                                <button onClick={handleInvite} style={{fontSize:'10px', background:'#2c2c2e', border:'none', color:'#007aff', padding:'5px 10px', borderRadius:'5px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                    <Mail size={12}/> CONVIDAR INTEGRANTE
                                </button>
                            </div>

                            <div style={styles.setlistList}>
                                {setlists.filter(s => s.band_id === band.id).map(sl => (
                                    <div key={sl.id} style={styles.setlistItemMini} onClick={() => onOpenSetlist(sl)}>
                                        {sl.name || sl.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DRAWER LATERAL DE CHAT */}
            {selectedBand && chatOpen && (
                <div style={{ width: '300px', backgroundColor: '#1c1c1e', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>CHAT: {selectedBand.name}</span>
                        <X size={18} onClick={() => setChatOpen(false)} style={{ cursor: 'pointer' }} />
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map(m => (
                            <div key={m.id} style={{ alignSelf: m.sender_id === session.user.id ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                <small style={{ fontSize: '9px', color: '#888' }}>{m.sender_name}</small>
                                <div style={{ backgroundColor: m.sender_id === session.user.id ? '#007aff' : '#333', padding: '8px 12px', borderRadius: '12px', fontSize: '13px' }}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div style={{ padding: '15px', borderTop: '1px solid #333', display: 'flex', gap: '5px' }}>
                        <input 
                            style={{ ...styles.inputField, height: '35px', fontSize: '12px' }} 
                            placeholder="Mensagem..." 
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage} style={{ background: '#007aff', border: 'none', borderRadius: '8px', padding: '0 10px', color: '#fff' }}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};