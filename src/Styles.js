export const styles = {
    // --- ESTRUTURA PRINCIPAL (MANTIDA) ---
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
    
    // O ARTISTA AMARELO QUE VOCÊ QUERIA
    artistYellow: { display:'block', color: '#FFD700', fontSize: '11px', fontWeight: 'bold' },
    
    sidebarFooter: { padding: '15px', display: 'flex', flexDirection:'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '40px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { width: '100%', height: '40px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center' },

    // --- EDITOR CENTRAL (CORRIGIDO PARA ABRIR) ---
    mainEditor: { 
        flex: 1, 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#000', 
        position: 'relative',
        height: '100%', // Força a abertura
        overflow: 'hidden' 
    },
    editorHeader: { padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '5px', backgroundColor: '#2c2c2e', borderBottom:'1px solid #333' },
    hInput: { fontSize: '20px', background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', outline:'none', width:'100%' },
    artistInput: { fontSize: '14px', background: 'none', border: 'none', color: '#34c759', outline:'none', width:'100%', fontWeight:'bold' },
    
    // ÁREA DA LETRA (COM SCROLL E LARGURA BLINDADA)
    mainTextArea: { 
        flex: 1, 
        background: '#000', 
        color: '#FFF', 
        border: 'none', 
        padding: '25px', 
        fontSize: '18px', 
        fontFamily: 'monospace', 
        outline: 'none', 
        resize: 'none', 
        lineHeight: '1.6',
        overflowY: 'auto', // Permite rolar a letra
        boxSizing: 'border-box' // Impede que o texto suma no iPad
    },

    // --- ABA BANDA E GARIMPO (PRESERVADOS) ---
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000', color: '#fff' },
    showLabel: { color: '#666', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
    whiteInputLarge: { backgroundColor: '#FFF', color: '#000', padding: '10px 12px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', width: '100%', border: 'none', outline: 'none' },
    tableHeader: { display: 'flex', padding: '10px 15px', borderBottom: '2px solid #333', color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: '#111' },
    tableRow: { display: 'flex', padding: '15px', borderBottom: '1px solid #333', alignItems: 'center', color: '#fff' },
    colName: { flex: 2, fontWeight: 'bold' },
    colRole: { flex: 1, color: '#007aff', fontSize: '12px' },
    colCode: { flex: 1, textAlign: 'right', fontFamily: 'monospace', color: '#34c759', fontSize: '14px', fontWeight: 'bold' },

    // --- COMPONENTES COMUNS ---
    btnGroup: { display: 'flex', gap: '8px', alignItems:'center', padding: '10px 0' },
    saveBtn: { padding: '10px 15px', backgroundColor: '#34c759', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer' },
    showBtn: { padding: '10px 15px', backgroundColor: '#ff3b30', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', fontSize:'12px', cursor:'pointer' },
    transpBtn: { padding: '8px 12px', border: '1px solid #555', borderRadius: '5px', background: 'none', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    exportBtn: { padding: '8px 12px', backgroundColor: '#444', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontSize:'11px' },
    
    // SETLIST E SHOW MODE
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'hidden' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor: '#1c1c1e' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#fff' },
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333', height: '60px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000', color:'#fff' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '0', marginBottom: '20px', border: '1px solid #333' },
    wideGreenBtn: { width: '100%', height: '40px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: '#333' },
};