export const styles = {
    appContainer: { display: 'flex', flexDirection:'column', height: '100vh', backgroundColor: '#000', color: '#FFF', overflow:'hidden', fontFamily: 'sans-serif' },
    mainHeader: { height: '60px', backgroundColor:'#000', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', borderBottom:'1px solid #333' },
    headerBtn: { backgroundColor: '#2c2c2e', color: '#FFF', padding: '8px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border:'1px solid #444' },
    
    sidebar: { width: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor:'#1c1c1e' },
    navTabs: { display: 'flex', borderBottom:'1px solid #333', backgroundColor: '#1a1a1a' },
    tab: { flex: 1, padding: '12px 5px', border: 'none', background: 'none', color: '#888', cursor:'pointer', fontSize:'10px', fontWeight:'bold' },
    activeTab: { flex: 1, padding: '12px 5px', border: 'none', background: '#2c2c2e', color: '#007aff', borderBottom: '2px solid #007aff', fontSize:'10px', fontWeight:'bold' },
    
    sortBar: { padding: '10px', backgroundColor:'#111', display:'flex', gap:'10px', alignItems:'center', fontSize:'11px', borderBottom:'1px solid #222' },
    sortBtn: { flex: 1, padding:'6px', background:'#222', border:'1px solid #444', color:'#aaa', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', fontSize:'10px' },
    sortBtnActive: { flex: 1, padding:'6px', background:'#007aff', border:'none', color:'#fff', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', fontSize:'10px' },
    
    listArea: { flex: 1, overflowY: 'auto', backgroundColor: '#1c1c1e' },
    listItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    selectedItem: { padding: '12px 15px', borderBottom: '1px solid #333', cursor: 'pointer', backgroundColor: '#007aff22', borderLeft: '4px solid #007aff', display:'flex', alignItems:'center', gap:'10px', color: '#FFFFFF' },
    
    sidebarFooter: { padding: '15px', display: 'flex', flexDirection:'column', gap: '10px', borderTop: '1px solid #333', backgroundColor: '#1c1c1e' },
    addBtn: { width: '100%', height: '45px', backgroundColor: '#007aff', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', fontSize: '11px' },
    importBtnLabel: { width: '100%', height: '45px', backgroundColor: '#34c759', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight:'bold', cursor:'pointer', textAlign:'center', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
    
    mainEditor: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor:'#000' },
    editorHeader: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c2c2e', borderBottom:'1px solid #333' },
    hInput: { fontSize: '22px', background: 'none', border: 'none', color: '#FFF', fontWeight: 'bold', outline:'none', width:'100%' },
    artistInput: { fontSize: '15px', background: 'none', border: 'none', color: '#34c759', outline:'none', width:'100%', fontWeight:'bold' },
    mainTextArea: { flex: 1, background: '#000', color: '#FFFFFF', border: 'none', padding: '25px', fontSize: '18px', fontFamily: 'monospace', outline: 'none', resize: 'none', lineHeight: '1.6' },

    garimpoPanel: { padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000', color: '#FFF' },
    inputField: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#1c1c1e', color: '#FFF', outline:'none' },
    miniItemGarimpo: { padding: '12px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#FFFFFF' },
    scrollList: { flex: 1, overflowY: 'auto', backgroundColor: '#000', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #333' },
    processBtn: { width:'100%', padding: '15px', backgroundColor: '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },

    setlistSplit: { display: 'flex', flex: 1, gap: '20px', padding: '20px', overflow:'hidden', backgroundColor:'#000' },
    setlistHalf: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '15px', border: '1px solid #333', borderRadius: '15px', backgroundColor:'#1c1c1e' },
    miniItemReorder: { padding: '10px', borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', color: '#FFF' },
    reorderControls: { display:'flex', gap:'10px', alignItems:'center' },
    
    showOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' },
    showToolbar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', borderBottom:'1px solid #333' },
    showContent: { flex: 1, overflowY: 'auto', padding: '30px', textAlign: 'left', backgroundColor: '#000', color:'#FFF' },
    
    midiBadgeOn: { fontSize:'9px', color:'#34c759', border:'1px solid #34c759', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeActive: { fontSize:'9px', color:'#000', backgroundColor:'yellow', padding:'2px 6px', borderRadius:'4px' },
    midiBadgeOff: { fontSize:'9px', color:'#666', border:'1px solid #333', padding:'2px 6px', borderRadius:'4px' },
    settingsCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '500px', color:'#333', display:'flex', flexDirection:'column' },
    primaryButton: { marginTop: '10px', width: '100%', padding: '15px', backgroundColor: '#1c1c1e', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor:'pointer' },
    listActionBtnShow: { background:'none', border:'none', color:'#007aff', cursor:'pointer' },
    listActionBtnDelete: { background:'none', border:'none', color:'#ff3b30', cursor:'pointer' },
    secondaryBtn: { padding: '10px 15px', backgroundColor: '#2c2c2e', color: '#fff', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer' },
};