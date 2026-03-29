import React, { useState } from 'react';
import { supabase } from './ShowPadCore';
import { Mail, Loader2, Music, AlertTriangle, Lock } from 'lucide-react';

export const AuthView = ({ styles }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Nova opção
    const [usePassword, setUsePassword] = useState(false); // Alternar entre e-mail e senha

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);

        let result;
        if (usePassword) {
            // Login com Senha (Mais rápido para teste)
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            // Magic Link (E-mail)
            result = await supabase.auth.signInWithOtp({ 
                email,
                options: { emailRedirectTo: window.location.origin }
            });
        }

        if (result.error) {
            alert(result.error.message);
        } else if (!usePassword) {
            alert('Verifique seu e-mail para o link de acesso!');
        }
        setLoading(false);
    };

    if (!supabase) {
        return (
            <div style={styles.wizard}>
                <div style={styles.settingsCard}>
                    <AlertTriangle size={50} color="orange" style={{alignSelf:'center'}} />
                    <h2>Erro de Configuração</h2>
                    <p style={{textAlign:'center', fontSize:'14px'}}>Chaves do Supabase não encontradas.</p>
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
                    
                    {usePassword && (
                        <input 
                            style={styles.inputField} 
                            type="password" 
                            placeholder="Sua senha" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    )}

                    <button style={styles.primaryButton} disabled={loading}>
                        {loading ? <Loader2 className="spin" size={20} /> : (usePassword ? "Entrar" : "Enviar Link por E-mail")}
                    </button>
                </form>

                <button 
                    onClick={() => setUsePassword(!usePassword)}
                    style={{marginTop:'20px', background:'none', border:'none', color:'#007aff', cursor:'pointer', fontSize:'12px'}}
                >
                    {usePassword ? "Entrar sem senha (e-mail)" : "Já tenho uma senha"}
                </button>
            </div>
            <style>{`.spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};