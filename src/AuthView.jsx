import React, { useState } from 'react';
import { supabase } from './ShowPadCore';
import { Mail, Loader2, Music, AlertTriangle } from 'lucide-react';

export const AuthView = ({ styles }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ 
            email,
            options: { emailRedirectTo: window.location.origin }
        });
        if (error) alert(error.message);
        else alert('Verifique seu e-mail para acessar o App!');
        setLoading(false);
    };

    if (!supabase) {
        return (
            <div style={styles.wizard}>
                <div style={styles.settingsCard}>
                    <AlertTriangle size={50} color="orange" style={{alignSelf:'center'}} />
                    <h2>Erro de Configuração</h2>
                    <p style={{textAlign:'center', fontSize:'14px'}}>As chaves do Supabase não foram encontradas. Verifique o painel da Vercel ou o arquivo .env</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.wizard}>
            <div style={styles.settingsCard}>
                <Music size={50} color="#007aff" style={{alignSelf:'center'}} />
                <h2 style={{textAlign:'center'}}>ShowPad Cloud</h2>
                <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'20px'}}>
                    <input 
                        style={styles.inputField} 
                        type="email" 
                        placeholder="seu@email.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <button style={styles.primaryButton} disabled={loading}>
                        {loading ? <Loader2 className="spin" size={20} /> : "Entrar com E-mail"}
                    </button>
                </form>
            </div>
            <style>{`.spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};