import React from 'react';

const overlay = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 10000, padding: '20px', boxSizing: 'border-box',
};
const panel = {
  backgroundColor: '#1c1c1e', color: '#fff', borderRadius: '16px', border: '1px solid #333', maxWidth: '440px',
  width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', padding: '24px',
};
const muted = { color: '#aaa', fontSize: '13px', lineHeight: 1.5, margin: '0 0 12px 0' };
const h2 = { fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' };
const ul = { margin: '0 0 16px 0', paddingLeft: '20px', color: '#ddd', fontSize: '13px', lineHeight: 1.55 };

export function InfoModal({ onClose }) {
  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="info-modal-title" onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <h2 id="info-modal-title" style={h2}>ShowPad Pro</h2>
        <p style={{ ...muted, marginBottom: '16px' }}>Versão atual: <strong style={{ color: '#fff' }}>v8.9.1</strong></p>
        <p style={muted}><strong style={{ color: '#fff' }}>Desenvolvedor:</strong> Eduardo Posada</p>
        <p style={muted}>
          <strong style={{ color: '#fff' }}>Descrição:</strong> Aplicação web para músicos gerenciarem repertórios, cifras e setlists em tempo real.
        </p>
        <p style={muted}>
          <strong style={{ color: '#fff' }}>Auxílio de IA:</strong> Desenvolvido com auxílio de Claude (Anthropic) e outros modelos de IA em processo de vibecoding.
        </p>
        <p style={{ ...muted, marginBottom: '8px' }}><strong style={{ color: '#fff' }}>Funcionalidades:</strong></p>
        <ul style={ul}>
          <li>Gestão de repertório com transposição tonal</li>
          <li>Biblioteca: ordenação A–Z por título ou por artista e filtro por artista</li>
          <li>Exportar e importar músicas individuais em arquivo .showpad (JSON)</li>
          <li>Shows e Setlists</li>
          <li>Gestão de Bandas</li>
          <li>Garimpo de músicas via URL (Cifra Club), com extração no servidor em produção e fallback via proxy</li>
          <li>Sincronização híbrida com Supabase</li>
          <li>Interface MIDI para performance ao vivo</li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%', marginTop: '8px', padding: '12px', borderRadius: '10px', border: '1px solid #444',
            backgroundColor: '#2c2c2e', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
