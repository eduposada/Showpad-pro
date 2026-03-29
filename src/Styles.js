export const styles = {
    appContainer: { display: 'flex', flexDirection:'column', width: '100%', height: '100%', backgroundColor: '#000000', color: '#FFFFFF', overflow: 'hidden', position: 'absolute', top: 0, left: 0 },
    mainHeader: { height: '60px', minHeight: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 40px 0 20px', borderBottom:'1px solid #333' },
    
    sidebar: { width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#1c1c1e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333', backgroundColor: '#1a1a1a' },
    tab: { flex: 1, padding: '12px 5px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'10px', fontWeight:'bold' },
    activeTab: { flex: 1, padding: '12px 5px', border: 'none', background: '#2c2c2e', color: '#007aff', borderBottom: '2px solid #007aff', fontSize:'10px', fontWeight:'bold' },
    
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    artistYellow: { display:'block', opacity:1, color: '#FFD700', fontSize: '11px', fontWeight: 'bold' },

    sidebarFooter: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '40px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { width: '100%', height: '40px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center' },

    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000', minWidth: 0, overflow: 'hidden' },
    editorContent: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' },
    editorHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', gap: '20px' },
    
    // --- ELEMENTOS DA FICHA DE SHOW (REQUISITO 1, 2 e 3) ---
    fieldLabel: { color: '#888', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', marginLeft: '2px', display: 'block' },
    inputWrapper: { display: 'flex', flexDirection: 'column', flex: 1 },
    inputContainer: { display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginRight: '20px', minWidth: 0 },
    
    whiteInputLarge: { backgroundColor: '#FFFFFF', color: '#000000', padding: '10px 12px', borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', width: '100%', border: 'none', outline: 'none' },
    whiteInputMedium: { backgroundColor: '#FFFFFF', color: '#000000', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', width: '100%', border: 'none', outline: 'none' },

    showMetaData: { padding: '20px', backgroundColor: '#141414', display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: '1px solid #333' },
    metaRow: { display: 'flex', gap: '20px', width: '100%' },

    // ... Restante dos estilos blindados ...
    mainTextArea: { flex: 1, width: '100%', background: '#000000', color: '#FFFFFF', border: 'none', padding: '30px', fontSize: '18px', fontFamily: 'monospace', outline: 'none', resize: 'none', lineHeight: '1.6' },
    btnGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '350px' },
    showBtn: { padding: '8px 15px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor: 'pointer' },
    saveBtn: { padding: '8px 15px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor: 'pointer' },
    transpBtn: { padding: '6px 10px', border: '1px solid #555', borderRadius: '5px', background: 'none', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    exportBtn: { padding: '6px 10px', backgroundColor: '#444', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'hidden', backgroundColor: '#000000' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor: '#1c1c1e' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#FFFFFF' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '60px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '40px', textAlign: 'left', backgroundColor: '#000', color:'#fff' },
    backBtn: { background:'none', border:'none', color:'#fff', display:'flex', alignItems:'center', cursor:'pointer' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#FFFFFF', padding: '8px 15px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '6px' },
    pageActions: { padding:'50px 0', display:'flex', flexDirection:'column', gap:'20px' },
    pageBtn: { padding:'20px', backgroundColor:'#222', border:'1px solid #444', color:'#fff', borderRadius:'10px', fontSize:'16px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
    pageBtnNext: { padding:'25px', backgroundColor:'#007aff22', border:'1px solid #007aff', color:'#fff', borderRadius:'10px', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontWeight:'bold', cursor:'pointer' },
};