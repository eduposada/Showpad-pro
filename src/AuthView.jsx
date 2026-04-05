import React, { useState } from 'react';
import { supabase } from './ShowPadCore';
import { Loader2, Music } from 'lucide-react';

export const AuthView = ({ styles }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [usePass, setUsePass] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);
        let res = usePass 
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
        
        if (res.error) {
            alert(res.error.message);
        } else if (!usePass) {
            alert('Verifique seu e-mail! Enviamos um link de acesso.');
        }
        setLoading(false);
    };

    return (
        <div style={styles.wizard}>
            <div style={styles.authCard}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <div style={{
                        backgroundColor: '#007aff22', 
                        padding: '15px', 
                        borderRadius: '20px', 
                        marginBottom: '15px'
                    }}>
                        <Music size={40} color="#007aff" />
                    </div>
                    <h2 style={styles.authTitle}>ShowPad Pro</h2>
                    <p style={styles.authSubtitle}>Sua biblioteca de cifras na nuvem</p>
                </div>

                <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'10px'}}>
                    <input 
                        style={styles.inputField} 
                        type="email" 
                        placeholder="E-mail" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        required 
                    />
                    
                    {usePass && (
                        <input 
                            style={styles.inputField} 
                            type="password" 
                            placeholder="Senha" 
                            value={password} 
                            onChange={e=>setPassword(e.target.value)} 
                            required 
                        />
                    )}

                    <button style={styles.primaryButton} disabled={loading}>
                        {loading ? <Loader2 size={20} className="spin" /> : (usePass ? "Entrar" : "Enviar Link de Acesso")}
                    </button>
                </form>

                <button 
                    onClick={()=>setUsePass(!usePass)} 
                    style={styles.secondaryLink}
                >
                    {usePass ? "Entrar sem senha (Magic Link)" : "Prefiro entrar com senha"}
                </button>

                <div style={{marginTop: '40px', textAlign: 'center'}}>
                    <span style={{fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px'}}>
                        Comandante Eduardo Posada &copy; 2026
                    </span>
                </div>
            </div>
        </div>
    );
};