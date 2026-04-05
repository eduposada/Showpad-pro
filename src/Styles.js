export const styles = {
    // --- SISTEMA DE LOGIN ---
    wizard: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', background: 'radial-gradient(circle, #1c1c1e 0%, #000000 100%)', position: 'fixed', top: 0, left: 0, zIndex: 9999 },
    authCard: { backgroundColor: '#1c1c1e', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '40px', border: '1px solid #333', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
    authTitle: { fontSize: '24px', fontWeight: '800', color: '#fff', textAlign: 'center', margin: '10px 0 5px 0', letterSpacing: '-0.5px', fontFamily: 'sans-serif' },
    authSubtitle: { fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '30px', fontFamily: 'sans-serif' },
    inputField: { width: '100%', height: '50px', backgroundColor: '#2c2c2e', border: '1px solid #444', borderRadius: '12px', color: '#fff', padding: '0 15px', fontSize: '16px', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' },
    primaryButton: { width: '100%', height: '50px', backgroundColor: '#007aff', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'sans-serif' },
    secondaryLink: { marginTop: '20px', background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'center', alignSelf: 'center', fontFamily: 'sans-serif' },

    // --- ESTRUTURA PRINCIPAL ---
    appContainer: { display: 'flex', flexDirection:'column', width: '100%', height: '100%', backgroundColor: '#000', color: '#fff', overflow: 'hidden', position: 'absolute', top: 0, left: 0 },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 40px 0 20px', borderBottom:'1px solid #333' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#FFF', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border:'1px solid #444' },
    sidebar: { width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#1c1c1e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333', backgroundColor: '#1a1a1a' },
    tab: { flex: 1, padding: '12px 5px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'10px', fontWeight:'bold' },
    activeTab: { flex: 1, padding: '12px 5px', border: 'none', background: '#2c2c2e', color: '#007aff', borderBottom: '2px solid #007aff', fontSize:'10px', fontWeight:'bold' },
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    artistYellow: { display:'block', color: '#FFD700', fontSize: '11px', fontWeight: 'bold' },
    sidebarFooter: { padding: '15px', display: 'flex', flexDirection:'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '40px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },

    // --- INTERFACE DE BANDAS (REFORMULADA) ---
    bandGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '20px' },
    bandCard: { backgroundColor: '#1c1c1e', borderRadius: '16px', border: '1px solid #333', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', transition: 'transform 0.2s' },
    bandHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    bandName: { fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: 0 },
    bandTagSolo: { backgroundColor: '#34c75922', color: '#34c759', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' },
    bandTagGroup: { backgroundColor: '#007aff22', color: '#007aff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' },
    setlistList: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' },
    setlistItemMini: { backgroundColor: '#2c2c2e', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid transparent' },
    setlistItemMiniActive: { backgroundColor: '#007aff22', border: '1px solid #007aff' },

    // --- EDITOR & SHOW MODE ---
    mainEditor: { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', backgroundColor: '#000', position: 'relative', height: '100%', overflow: 'hidden' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '100px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '40px', textAlign: 'left', backgroundColor: '#000', color:'#fff' },
    showDrawer: { position: 'fixed', top: 0, left: 0, width: '300px', height: '100%', backgroundColor: 'rgba(28, 28, 30, 0.80)', backdropFilter: 'blur(15px)', zIndex: 3000, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', boxShadow: '10px 0 30px rgba(0,0,0,0.5)', transition: 'transform 0.2s ease-out' },
    drawerHeader: { padding: '20px', fontSize: '14px', fontWeight: 'bold', color: '#007aff', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    drawerItem: { padding: '15px 20px', borderBottom: '1px solid #222', cursor: 'pointer', color: '#888', fontSize: '14px' },
    drawerItemActive: { padding: '15px 20px', borderBottom: '1px solid #333', cursor: 'pointer', color: '#fff', backgroundColor: '#007aff22', borderLeft: '5px solid #007aff', fontSize: '14px', fontWeight: 'bold' },
    
    // --- NOVO VISUAL DE CONFIGURAÇÕES (FLUTUANTE PREMIUM) ---
    settingsOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    settingsCard: { backgroundColor: '#1c1c1e', borderRadius: '24px', width: '90%', maxWidth: '480px', maxHeight: '90vh', border: '1px solid #333', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', overflow: 'hidden' },
    settingsHeader: { padding: '20px 30px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2c2e' },
    settingsTitle: { fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.5px' },
    settingsContent: { padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' },
    settingsSection: { backgroundColor: '#2c2c2e', borderRadius: '16px', padding: '20px', border: '1px solid #444', display: 'flex', flexDirection: 'column', gap: '12px' },
    settingsLabel: { fontSize: '10px', color: '#007aff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' },
    midiSignalBox: { backgroundColor: '#000', padding: '15px', borderRadius: '12px', border: '2px solid #007aff', color: '#007aff', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 0 15px rgba(0,122,255,0.2)' },
    closeBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

    // --- COMPONENTES GERAIS ---
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000', color: '#fff' },
    saveBtn: { padding: '10px 15px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer' },
    showBtn: { padding: '10px 15px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center' },
};