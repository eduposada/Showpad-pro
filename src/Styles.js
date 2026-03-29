export const styles = {
    appContainer: { display: 'flex', flexDirection:'column', width: '100%', height: '100%', backgroundColor: '#000000', color: '#FFFFFF', overflow: 'hidden', position: 'absolute', top: 0, left: 0 },
    
    // Cabeçalho ajustado para os botões não "escaparem" (padding-right: 40px)
    mainHeader: { height: '60px', width: '100%', backgroundColor: '#000000', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px 0 20px', borderBottom: '1px solid #333' },
    
    // Botões de sistema (Backup, Engrenagem, Sair)
    headerBtn: { backgroundColor: '#2c2c2e', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '6px' },
    logoutBtn: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer', display:'flex', alignItems:'center' },

    sidebar: { width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor: '#1c1c1e' },
    navTabs: { display: 'flex', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' },
    tab: { flex: 1, padding: '15px 5px', border: 'none', background: 'none', color: '#888', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' },
    activeTab: { flex: 1, padding: '15px 5px', border: 'none', background: '#2c2c2e', color: '#007aff', borderBottom: '2px solid #007aff', fontSize: '10px', fontWeight: 'bold' },
    
    // Lista da Biblioteca com Artista em AMARELO
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    artistYellow: { display:'block', opacity:1, color: '#FFD700', fontSize: '12px', fontWeight: 'bold' },

    sidebarFooter: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '45px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '12px' },
    importBtnLabel: { width: '100%', height: '45px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },

    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000', minWidth: 0, overflow: 'hidden' },
    
    // --- PADRONIZAÇÃO DOS INPUTS BRANCOS (REQUISITO 3, 4 e 9) ---
    inputContainer: { display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginRight: '20px' },
    whiteInputLarge: { 
        backgroundColor: '#FFFFFF', 
        color: '#000000', 
        padding: '12px 15px', 
        borderRadius: '8px', 
        fontSize: '22px', 
        fontWeight: 'bold', 
        width: '100%', 
        border: '2px solid #007aff', 
        outline: 'none' 
    },
    whiteInputMedium: { 
        backgroundColor: '#FFFFFF', 
        color: '#000000', 
        padding: '8px 12px', 
        borderRadius: '6px', 
        fontSize: '16px', 
        fontWeight: '600', 
        width: '100%', 
        border: '1px solid #ccc', 
        outline: 'none' 
    },

    mainTextArea: { flex: 1, width: '100%', background: '#000000', color: '#FFFFFF', border: 'none', padding: '30px', fontSize: '18px', fontFamily: 'monospace', outline: 'none', resize: 'none', lineHeight: '1.6' },

    // Garimpo e Bandas
    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000000', color: '#FFFFFF' },
    wideGreenBtn: { width: '100%', height: '50px', backgroundColor: '#34c759', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px' },

    // Estilos do Modo Show (Mantidos)
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom: '1px solid #333', height: '60px' },
    showContent: { flex: 1, overflowY: 'auto', padding: '40px', textAlign: 'left', backgroundColor: '#000000', color: '#FFFFFF' },
    
    // Ficha Técnica do Show
    showMetaData: { padding: '20px', backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #333' },
    metaRow: { display: 'flex', gap: '15px' },
    
    // Utilitários
    midiBadgeOn: { fontSize:'9px', color:'#34c759', border:'1px solid #34c759', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeOff: { fontSize:'9px', color:'#666', border:'1px solid #333', padding:'2px 6px', borderRadius:'4px' },
    serverLedOn: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#34c759', fontWeight: 'bold' },
    serverLedOff: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' },
    ledDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor' },
    miniItem: { padding: '10px', borderBottom: '1px solid #333', cursor: 'pointer', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' },
    miniItemGarimpo: { padding: '12px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', color: '#FFFFFF' },
    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow: 'hidden' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor: '#1c1c1e' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#FFFFFF' },
};