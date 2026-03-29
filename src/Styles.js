export const styles = {
    appContainer: { display: 'flex', flexDirection:'column', height: '100vh', backgroundColor: '#000000', color: '#FFFFFF', overflow:'hidden', fontFamily: 'sans-serif' },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', borderBottom:'2px solid #333' },
    
    // Botões do Cabeçalho
    headerBtn: { backgroundColor: '#2c2c2e', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border:'1px solid #444' },
    
    // Barra Lateral
    sidebar: { width: '300px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#1c1c1e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333', backgroundColor: '#000' },
    tab: { flex: 1, padding: '12px 2px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'10px', fontWeight:'bold' },
    activeTab: { flex: 1, padding: '12px 2px', border: 'none', background: '#2c2c2e', color: '#007aff', borderBottom: '2px solid #007aff', fontSize:'10px', fontWeight:'bold' },
    
    // Ordenação (Botões corrigidos)
    sortBar: { padding: '10px', backgroundColor:'#111', display:'flex', gap:'10px', alignItems:'center', fontSize:'11px', borderBottom:'1px solid #222' },
    sortBtn: { padding:'6px 10px', background:'#2c2c2e', border:'1px solid #444', color:'#fff', borderRadius:'6px', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer' },
    sortBtnActive: { padding:'6px 10px', background:'#007aff', border:'none', color:'#fff', borderRadius:'6px', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer' },
    
    // Lista
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    
    // Rodapé Lateral (Botões Simétricos)
    sidebarFooter: { padding: '15px', display: 'flex', flexDirection:'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '45px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '12px' },
    importBtnLabel: { width: '100%', height: '45px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
    
    // Editor Principal (Letras Brancas)
    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor:'#000000' },
    editorHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333' },
    hInput: { fontSize: '22px', background: 'none', border: 'none', color: '#FFFFFF', fontWeight: 'bold', outline:'none', width:'100%' },
    artistInput: { fontSize: '15px', background: 'none', border: 'none', color: '#34c759', outline:'none', width:'100%', fontWeight:'bold' },
    mainTextArea: { flex: 1, background: '#000000', color: '#FFFFFF', border: 'none', padding: '25px', fontSize: '18px', fontFamily: 'monospace', outline: 'none', resize: 'none', lineHeight: '1.6' },

    // Garimpo (Visual Aprovado Restaurado)
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000000', color: '#FFFFFF' },
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    inputField: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#1c1c1e', color: '#FFFFFF', outline: 'none' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    miniItemGarimpo: { padding: '12px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#FFFFFF' },
    processBtn: { width:'100%', padding: '15px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },

    // Setlist Split (Restaurado)
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow:'hidden', backgroundColor:'#000' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor:'#1c1c1e' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#FFFFFF' },
    
    // Modo Show
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000', color: '#FFFFFF' },
    
    // Utilitários
    primaryButton: { marginTop: '10px', width: '100%', padding: '15px', backgroundColor: '#007aff', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor:'pointer' },
    secondaryBtn: { padding: '10px 15px', backgroundColor: '#2c2c2e', color: '#fff', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer' },
    empty: { flex: 1, display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: '#444' }
};