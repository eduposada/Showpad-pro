export const styles = {
    appContainer: { display: 'flex', flexDirection:'column', height: '100vh', backgroundColor: '#1c1c1e', color: '#fff', overflow:'hidden', fontFamily: 'sans-serif' },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', borderBottom:'1px solid #333' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border:'none' },
    
    // BARRA LATERAL (300px - Espaço para as abas sem quebrar nome)
    sidebar: { width: '300px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#2c2c2e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333', backgroundColor: '#1a1a1a' },
    tab: { flex: 1, padding: '12px 2px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'9px', fontWeight:'bold' },
    activeTab: { flex: 1, padding: '12px 2px', border: 'none', background: '#3a3a3c', color: '#007aff', borderBottom: '2px solid #007aff', fontSize:'9px', fontWeight:'bold' },
    
    // LISTA DA BIBLIOTECA (TEXTO BRANCO GARANTIDO)
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    
    // RODAPÉ COM BOTÕES GRANDES (VERDE E AZUL)
    sidebarFooter: { padding: '15px', display: 'flex', flexDirection:'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#2c2c2e' },
    addBtn: { width: '100%', padding: '12px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { width: '100%', padding: '12px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#fff', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
    
    // EDITORES
    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor:'#1c1c1e' },
    editorHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2c2e', borderBottom:'1px solid #333' },
    hInput: { fontSize: '20px', background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', outline:'none', width:'100%' },
    artistInput: { fontSize: '14px', background: 'none', border: 'none', color: '#888', outline:'none', width:'100%' },
    mainTextArea: { flex: 1, background: '#1c1c1e', color: '#fff', border: 'none', padding: '20px', fontSize: '17px', fontFamily: 'monospace', outline: 'none', resize: 'none' },

    // GARIMPO
    garimpoPanel: { padding: '30px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1c1c1e', color: '#fff' },
    miniItemGarimpo: { padding: '12px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#FFFFFF' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    processBtn: { padding: '15px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },

    // SETLIST (ESTILO APROVADO)
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow:'hidden' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor:'#1a1a1a' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#fff' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    showMetaData: { padding: '15px 20px', backgroundColor: '#2c2c2e', display: 'flex', flexDirection: 'column', gap: '8px' },
    
    // MODO SHOW
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '60px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000', color:'#fff' },
    showDrawer: { position:'absolute', top:0, left:0, width:'260px', height:'100%', backgroundColor:'#1c1c1e', zIndex:3000, borderRight:'1px solid #333', padding:'20px', boxShadow:'20px 0 50px rgba(0,0,0,0.8)', display:'flex', flexDirection:'column' },
    
    // BADGES E STATUS
    midiBadgeOn: { fontSize:'9px', color:'#34c759', border:'1px solid #34c759', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeActive: { fontSize:'9px', color:'#000', backgroundColor:'yellow', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeOff: { fontSize:'9px', color:'#666', border:'1px solid #333', padding:'2px 6px', borderRadius:'4px' },
    serverLedOn: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#34c759', fontWeight: 'bold' },
    serverLedOff: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' },
    ledDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor', boxShadow: '0 0 10px currentColor' },
    
    // OUTROS
    infoBtn: { background:'none', border:'none', color:'#888', cursor:'pointer' },
    listActionBtnShow: { background:'none', border:'none', color:'#007aff', cursor:'pointer' },
    listActionBtnDelete: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer' },
    wizard: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:4000 },
    settingsCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '500px', color:'#333', display:'flex', flexDirection:'column' },
};