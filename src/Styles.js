export const styles = {
    appContainer: { display: 'flex', flexDirection:'column', width: '100%', height: '100%', backgroundColor: '#000000', color: '#FFFFFF', overflow: 'hidden', position: 'absolute', top: 0, left: 0 },
    mainHeader: { height: '60px', minHeight: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 40px 0 20px', borderBottom:'1px solid #333' },
    
    sidebar: { width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#1c1c1e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333', backgroundColor: '#1a1a1a' },
    tab: { flex: 1, padding: '12px 5px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'10px', fontWeight:'bold' },
    activeTab: { flex: 1, padding: '12px 5px', border: 'none', background: '#2c2c2e', color: '#007aff', borderBottom: '2px solid #007aff', fontSize:'10px', fontWeight:'bold' },
    
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    artistYellow: { display:'block', opacity:1, color: '#FFD700', fontSize: '11px', fontWeight: 'bold' },

    sidebarFooter: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '40px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { width: '100%', height: '40px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center' },

    // --- ÁREA DO EDITOR (REVISADA) ---
    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000', minWidth: 0, overflow: 'hidden' },
    editorContent: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' },
    
    // Cabeçalho do Editor com mais espaço para respirar
    editorHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', gap: '20px' },
    
    // Container de Inputs com largura controlada para não ser infinita
    inputContainer: { display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, maxWidth: '600px' }, // Limitado a 600px para harmonia

    whiteInputLarge: { 
        backgroundColor: '#FFFFFF', color: '#000000', padding: '8px 12px', borderRadius: '6px', 
        fontSize: '18px', fontWeight: 'bold', width: '100%', border: 'none', outline: 'none' 
    },
    whiteInputMedium: { 
        backgroundColor: '#FFFFFF', color: '#000000', padding: '6px 12px', borderRadius: '6px', 
        fontSize: '14px', fontWeight: '600', width: '100%', border: 'none', outline: 'none' 
    },

    // A ÁREA DE TEXTO (A CIFRA) - RESPONSIVIDADE TOTAL
    mainTextArea: { 
        flex: 1, // Preenche todo o resto da tela
        width: '100%', 
        background: '#000000', 
        color: '#FFFFFF', 
        border: 'none', 
        padding: '30px', 
        fontSize: '18px', 
        fontFamily: 'monospace', 
        outline: 'none', 
        resize: 'none', 
        lineHeight: '1.6' 
    },

    // ... (restante dos estilos mantidos)
    headerBtn: { backgroundColor: '#2c2c2e', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '6px' },
    btnGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '350px' },
    showBtn: { padding: '8px 15px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor: 'pointer' },
    saveBtn: { padding: '8px 15px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor: 'pointer' },
    transpBtn: { padding: '6px 10px', border: '1px solid #555', borderRadius: '5px', background: 'none', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    exportBtn: { padding: '6px 10px', backgroundColor: '#444', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    showMetaData: { padding: '15px 20px', backgroundColor: '#2c2c2e', display: 'flex', flexDirection: 'column', gap: '8px' },
    metaInput: { flex: 1, background: '#FFFFFF', color: '#000', padding: '8px', borderRadius: '5px', fontSize: '13px', border: 'none' },
    metaInputSmall: { width: '80px', background: '#FFFFFF', color: '#000', padding: '8px', borderRadius: '5px', fontSize: '13px', border: 'none' },
    metaInputWide: { background: '#FFFFFF', color: '#000', padding: '8px', borderRadius: '5px', fontSize: '13px', border: 'none' },
    metaTextArea: { background: '#FFFFFF', color: '#000', padding: '8px', borderRadius: '5px', fontSize: '13px', resize: 'none', height: '60px', border: 'none' },
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'hidden', backgroundColor: '#000000' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor: '#1c1c1e' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#FFFFFF' },
    reorderControls: { display: 'flex', gap: '10px', alignItems: 'center' },
    sortBar: { padding: '10px', backgroundColor:'#1a1a1a', display:'flex', gap:'10px', alignItems:'center', fontSize:'11px' },
    sortBtn: { padding:'4px 8px', background:'#333', border:'none', color:'#aaa', borderRadius:'4px', display:'flex', alignItems:'center', gap:'4px' },
    sortBtnActive: { padding:'4px 8px', background:'#007aff', border:'none', color:'#fff', borderRadius:'4px', display:'flex', alignItems:'center', gap:'4px' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '60px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000', color:'#fff' },
    backBtn: { background:'none', border:'none', color:'#fff', display:'flex', alignItems:'center', cursor:'pointer' },
    midiProbeFloating: { position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', color: 'yellow', fontSize: '9px', fontWeight: 'bold' },
    showDrawer: { position:'absolute', top:0, left:0, width:'250px', height:'100%', backgroundColor:'#1c1c1e', zIndex:3000, borderRight:'1px solid #333', padding:'20px', boxShadow:'20px 0 50px rgba(0,0,0,0.8)', display:'flex', flexDirection:'column' },
    drawerHeader: { fontSize:'18px', fontWeight:'bold', marginBottom:'20px', display:'flex', justifyContent:'space-between', color:'#007aff' },
    drawerItem: { padding:'12px', borderBottom:'1px solid #333', cursor:'pointer', fontSize:'14px' },
    drawerItemActive: { padding:'12px', borderBottom:'1px solid #333', cursor:'pointer', fontSize:'14px', backgroundColor:'#007aff22', color:'#007aff', fontWeight:'bold' },
    pageActions: { padding:'50px 0', display:'flex', flexDirection:'column', gap:'20px' },
    pageBtn: { padding:'20px', backgroundColor:'#222', border:'1px solid #444', color:'#fff', borderRadius:'10px', fontSize:'16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
    pageBtnNext: { padding:'25px', backgroundColor:'#007aff22', border:'1px solid #007aff', color:'#fff', borderRadius:'10px', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontWeight:'bold', cursor:'pointer' },
};