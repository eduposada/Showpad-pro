export const styles = {
    // --- SISTEMA DE LOGIN (WIZARD) ---
    wizard: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: '100vw', 
        height: '100vh', 
        background: 'radial-gradient(circle, #1c1c1e 0%, #000000 100%)', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: 9999 
    },
    authCard: { 
        backgroundColor: '#1c1c1e', 
        borderRadius: '24px', 
        width: '90%', 
        maxWidth: '400px', 
        padding: '40px', 
        border: '1px solid #333', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)' 
    },
    authTitle: { 
        fontSize: '24px', 
        fontWeight: '800', 
        color: '#fff', 
        textAlign: 'center', 
        margin: '10px 0 5px 0',
        letterSpacing: '-0.5px',
        fontFamily: 'sans-serif'
    },
    authSubtitle: {
        fontSize: '13px',
        color: '#888',
        textAlign: 'center',
        marginBottom: '30px',
        fontFamily: 'sans-serif'
    },
    inputField: { 
        width: '100%', 
        height: '50px', 
        backgroundColor: '#2c2c2e', 
        border: '1px solid #444', 
        borderRadius: '12px', 
        color: '#fff', 
        padding: '0 15px', 
        fontSize: '16px', 
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif'
    },
    primaryButton: { 
        width: '100%', 
        height: '50px', 
        backgroundColor: '#007aff', 
        border: 'none', 
        borderRadius: '12px', 
        color: '#fff', 
        fontSize: '16px', 
        fontWeight: 'bold', 
        cursor: 'pointer',
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontFamily: 'sans-serif'
    },
    secondaryLink: {
        marginTop: '20px',
        background: 'none',
        border: 'none',
        color: '#007aff',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        textAlign: 'center',
        alignSelf: 'center',
        fontFamily: 'sans-serif'
    },

    // --- ESTRUTURA PRINCIPAL DO APP ---
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
    importBtnLabel: { width: '100%', height: '40px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center' },

    mainEditor: { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', backgroundColor: '#000', position: 'relative', height: '100%', overflow: 'hidden' },
    editorHeader: { padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '5px', backgroundColor: '#2c2c2e', borderBottom:'1px solid #333' },
    hInput: { fontSize: '20px', background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', outline:'none', width:'100%' },
    artistInput: { fontSize: '14px', background: 'none', border: 'none', color: '#34c759', outline:'none', width:'100%', fontWeight:'bold' },
    mainTextArea: { flex: 1, background: '#000', color: '#FFF', border: 'none', padding: '25px', fontSize: '18px', fontFamily: 'monospace', outline: 'none', resize: 'none', lineHeight: '1.6', overflowY: 'auto', boxSizing: 'border-box' },

    bpmControlGroup: { display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: '6px', border: '1px solid #444', padding: '2px 6px', gap: '4px' },
    bpmDisplay: { color: '#007aff', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', minWidth: '35px', textAlign: 'center' },
    bpmBtnSmall: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' },
    notesTextArea: { width: '100%', backgroundColor: '#111', color: '#FFD700', border: '1px dashed #444', borderRadius: '6px', padding: '10px', fontSize: '12px', outline: 'none', resize: 'none', marginTop: '10px', boxSizing: 'border-box', fontFamily: 'sans-serif' },

    midiBadgeOn: { backgroundColor: '#1a332a', color: '#34c759', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },
    midiBadgeOff: { backgroundColor: '#331a1a', color: '#ff3b30', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },
    midiBadgeActive: { backgroundColor: '#007aff', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },

    settingsOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    settingsCard: { backgroundColor: '#1c1c1e', borderRadius: '20px', width: '100%', maxWidth: '500px', border: '1px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    settingsHeader: { padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2c2e' },
    settingsTitle: { fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: 0 },
    settingsContent: { padding: '20px', overflowY: 'auto' },
    settingsSection: { marginBottom: '24px', padding: '15px', backgroundColor: '#2c2c2e', borderRadius: '12px', border: '1px solid #444' },
    settingsLabel: { fontSize: '11px', color: '#007aff', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'block' },
    midiSignalBox: { backgroundColor: '#000', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #007aff', color: '#007aff', fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold' },

    tableHeader: { display: 'flex', padding: '10px 15px', borderBottom: '2px solid #333', color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: '#111' },
    tableRow: { display: 'flex', padding: '15px', borderBottom: '1px solid #333', alignItems: 'center', color: '#fff' },
    colName: { flex: 2, fontWeight: 'bold' },
    colRole: { flex: 1, color: '#007aff', fontSize: '12px' },
    colCode: { flex: 1, textAlign: 'right', fontFamily: 'monospace', color: '#34c759', fontSize: '14px', fontWeight: 'bold' },
    
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000', color: '#fff' },
    showLabel: { color: '#666', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },

    btnGroup: { display: 'flex', gap: '8px', alignItems:'center', padding: '10px 0', flexWrap: 'wrap' },
    saveBtn: { padding: '10px 15px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer' },
    showBtn: { padding: '10px 15px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center' },
    transpBtn: { padding: '8px 12px', border: '1px solid #555', borderRadius: '5px', background: 'none', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    exportBtn: { padding: '8px 12px', backgroundColor: '#444', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'hidden' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor: '#1c1c1e' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#fff' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '60px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000', color:'#fff' },
};