import React, { useState } from 'react';
import { supabase } from './ShowPadCore';
import { Mail, Loader2, Music } from 'lucide-react';

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
        if (res.error) alert(res.error.message);
        else if (!usePass) alert('Verifique seu e-mail!');
        setLoading(false);
    };

    return (
        <div style={styles.wizard}>
            <div style={styles.settingsCard}>
                <Music size={50} color="#007aff" style={{alignSelf:'center', marginBottom:'10px'}} />
                <h2 style={{textAlign:'center', margin:0}}>ShowPad Cloud</h2>
                <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'20px'}}>
                    <input style={styles.inputField} type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
                    {usePass && <input style={styles.inputField} type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} required />}
                    <button style={styles.primaryButton} disabled={loading}>{loading ? "..." : (usePass ? "Entrar" : "Entrar com e-mail")}</button>
                </form>
                <button onClick={()=>setUsePass(!usePass)} style={{marginTop:'15px', background:'none', border:'none', color:'#007aff', cursor:'pointer', fontSize:'11px'}}>
                    {usePass ? "Usar link por e-mail" : "Entrar com senha"}
                </button>
            </div>
        </div>
    );
};