import React, { useState } from 'react';
import { supabase } from './ShowPadCore';
import { Loader2, Music, Eye, EyeOff, Mail } from 'lucide-react';

export const AuthView = ({ styles }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usePass, setUsePass] = useState(true); // Agora a senha é o padrão

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);
        
        try {
            let res;
            if (usePass) {
                // Tenta logar. Se falhar porque o usuário não existe, tenta cadastrar.
                res = await supabase.auth.signInWithPassword({ email, password });
                
                if (res.error && res.error.message.includes("Invalid login credentials")) {
                    // Se as credenciais falharem, tentamos o Sign Up (Auto-cadastro)
                    const signUp = await supabase.auth.signUp({ email, password });
                    if (signUp.error) throw signUp.error;
                    alert("Conta criada com sucesso! Você já está logado.");
                    setLoading(false);
                    return;
                }
                if (res.error) throw res.error;
            } else {
                res = await supabase.auth.signInWithOtp({ 
                    email, 
                    options: { emailRedirectTo: window.location.origin } 
                });
                if (res.error) throw res.error;
                alert('Verifique seu e-mail! Enviamos um link de acesso.');
            }
        } catch (err) {
            alert("Erro no acesso: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!supabase) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) alert("Erro ao logar com Google: " + error.message);
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

                <div style={{display:'flex', flexDirection:'column', gap:'12px', marginTop:'20px'}}>
                    {/* BOTÃO GOOGLE - O CAMINHO MAIS FÁCIL */}
                    <button 
                        onClick={handleGoogleLogin} 
                        style={{...styles.headerBtn, padding:'12px', justifyContent:'center', backgroundColor:'#fff', color:'#000', fontWeight:'bold', border:'1px solid #ddd'}}
                        disabled={loading}
                    >
                        <img src="https://www.google.com/favicon.ico" alt="google" style={{width:'16px', marginRight:'10px'}} />
                        Entrar com Google
                    </button>

                    <div style={{display:'flex', alignItems:'center', gap:'10px', margin:'10px 0'}}>
                        <div style={{flex:1, height:'1px', backgroundColor:'#333'}}></div>
                        <span style={{fontSize:'10px', color:'#666'}}>OU E-MAIL</span>
                        <div style={{flex:1, height:'1px', backgroundColor:'#333'}}></div>
                    </div>

                    <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <input 
                            style={styles.inputField} 
                            type="email" 
                            placeholder="Seu e-mail" 
                            value={email} 
                            onChange={e=>setEmail(e.target.value)} 
                            required 
                        />
                        
                        {usePass && (
                            <div style={{position:'relative'}}>
                                <input 
                                    style={{...styles.inputField, width:'100%'}} 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Sua senha" 
                                    value={password} 
                                    onChange={e=>setPassword(e.target.value)} 
                                    required 
                                />
                                <div 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{position:'absolute', right:'15px', top:'12px', cursor:'pointer', color:'#666'}}
                                >
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </div>
                            </div>
                        )}

                        <button style={styles.primaryButton} disabled={loading}>
                            {loading ? <Loader2 size={20} className="spin" /> : (usePass ? "Entrar ou Criar Conta" : "Receber link por e-mail")}
                        </button>
                    </form>
                </div>

                <button 
                    onClick={()=>setUsePass(!usePass)} 
                    style={{...styles.secondaryLink, marginTop:'15px', fontSize:'12px'}}
                >
                    {usePass ? "Dificuldade com senha? Use o e-mail." : "Prefiro usar minha senha"}
                </button>

                <div style={{marginTop: '40px', textAlign: 'center'}}>
                    <span style={{fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px'}}>
                        CMG(RM1) Posada &copy; 2026
                    </span>
                </div>
            </div>
        </div>
    );
};