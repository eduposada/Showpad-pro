import React, { useState } from 'react';
import { supabase } from '.ShowPadCore';
import { Mail, Loader2, Music } from 'lucide-react';

export const AuthView = ({ styles }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) alert(error.message);
        else alert('Verifique seu e-mail para o link de acesso!');
        setLoading(false);
    };

    return (
        <div style={styles.wizard}>
            <div style={styles.settingsCard}>
                <Music size={50} color="#007aff" style={{alignSelf:'center'}} />
                <h2 style={{textAlign:'center'}}>ShowPad Cloud</h2>
                <p style={{fontSize:'13px', color:'#666', textAlign:'center'}}>
                    Entre com seu e-mail para sincronizar suas cifras na nuvem e colaborar com sua banda.
                </p>
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
                        {loading ? <Loader2 className="spin" size={20} /> : "Enviar Link de Acesso"}
                    </button>
                </form>
            </div>
        </div>
    );
};