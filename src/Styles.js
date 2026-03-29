export const styles = {
    appContainer: { display: 'flex', flexDirection:'column', width: '100%', height: '100%', backgroundColor: '#000000', color: '#FFFFFF', overflow: 'hidden', position: 'absolute', top: 0, left: 0 },
    mainHeader: { height: '60px', minHeight: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 40px 0 20px', borderBottom:'1px solid #333' },
    
    // Sidebar
    sidebar: { width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#1c1c1e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333', backgroundColor: '#1a1a1a' },
    tab: { flex: 1, padding: '12px 5px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'10px', fontWeight:'bold' },
    activeTab: { flex: 1, padding: '12px 5px', border: 'none', background: '#2c2c2e', color: '#007aff', borderBottom: '2px solid #007aff', fontSize:'10px', fontWeight:'bold' },
    
    // Lista e Ordenação
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    artistYellow: { display:'block', opacity:1, color: '#FFD700', fontSize: '11px', fontWeight: 'bold' },
    sortBar: { padding: '10px', backgroundColor:'#111', display:'flex', gap:'10px', alignItems:'center', fontSize:'11px', borderBottom:'1px solid #222' },
    sortBtn: { flex: 1, padding:'6px', background:'#222', border:'1px solid #444', color:'#aaa', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', fontSize:'10px' },
    sortBtnActive: { flex: 1, padding:'6px', background:'#007aff', border:'none', color:'#fff', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', fontSize:'10px' },

    // Rodapé
    sidebarFooter: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '45px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { width: '100%', height: '45px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },

    // --- ÁREA CENTRAL E EDITOR ---
    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000', minWidth: 0, overflow: 'hidden' },
    editorContent: { display: 'flex', flexDirection: 'column', flex: 1, width: '100%', overflow: 'hidden' },
    editorHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2c2e', borderBottom:'1px solid #333' },
    inputContainer: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginRight: '20px', minWidth: 0 },

    // Inputs brancos com fontes reduzidas e responsivos
    whiteInputLarge: { 
        backgroundColor: '#FFFFFF', color: '#000000', padding: '10px 12px', borderRadius: '6px', 
        fontSize: '18px', fontWeight: 'bold', width: '100%', border: 'none', outline: 'none' 
    },
    whiteInputMedium: { 
        backgroundColor: '#FFFFFF', color: '#000000', padding: '8px 12px', borderRadius: '6px', 
        fontSize: '14px', fontWeight: '600', width: '100%', border: 'none', outline: 'none' 
    },

    mainTextArea: { flex: 1, width: '100%', background: '#000000', color: '#FFFFFF', border: 'none', padding: '25px', fontSize: '18px', fontFamily: 'monospace', outline: 'none', resize: 'none', lineHeight: '1.6' },

    // --- GARIMPO PANEL (REQUISITO 2: PADRONIZAÇÃO) ---
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000000', color: '#FFFFFF' },
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px', width: '100%', height: '45px' },
    // Input do garimpo agora segue o padrão branco
    garimpoInputField: { flex: 1, padding: '0 15px', borderRadius: '8px', border: 'none', background: '#FFFFFF', color: '#000000', fontSize: '14px', outline: 'none', height: '100%' },
    wideGreenBtn: { width: '100%', height: '50px', backgroundColor: '#34c759', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px' },

    // Outros estilos mantidos
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'hidden', backgroundColor: '#000000' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor: '#1c1c1e' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#FFFFFF' },
    reorderControls: { display: 'flex', gap: '10px', alignItems: 'center' },
    showMetaData: { padding: '15px 20px', backgroundColor: '#2c2c2e', display: 'flex', flexDirection: 'column', gap: '8px' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#FFFFFF', padding: '8px 15px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '6px' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom: '1px solid #333', height: '60px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '40px', textAlign: 'left', backgroundColor: '#000000', color: '#FFFFFF' },
    btnGroup: { display: 'flex', gap: '8px' },
    showBtn: { padding: '8px 15px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
    saveBtn: { padding: '8px 15px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
    transpBtn: { padding: '6px 10px', border: '1px solid #555', borderRadius: '5px', background: 'none', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    exportBtn: { padding: '6px 10px', backgroundColor: '#444', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    serverLedOn: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#34c759', fontWeight: 'bold' },
    serverLedOff: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' },
    ledDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor' },
    primaryButton: { marginTop: '10px', width: '100%', padding: '15px', backgroundColor: '#1c1c1e', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor:'pointer' },
    secondaryBtn: { padding: '0 15px', backgroundColor: '#2c2c2e', color: '#fff', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', height: '100%', display:'flex', alignItems:'center' },
    miniItemGarimpo: { padding: '12px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', color: '#FFFFFF' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    statusText: { marginTop: '10px', color: '#007aff', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' },
    settingsCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '500px', color:'#333', display:'flex', flexDirection:'column' },
    wizard: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex:4000 },
};