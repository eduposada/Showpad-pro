import React, { useMemo, useState } from 'react';
import { Loader2, UserRound } from 'lucide-react';

function parseInstrumentsCsv(input) {
  return String(input || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const ProfileOnboardingView = ({ styles, email, initialValues, onSubmit }) => {
  const [fullName, setFullName] = useState(initialValues?.full_name || '');
  const [mainInstrument, setMainInstrument] = useState(initialValues?.main_instrument || '');
  const [instrumentsCsv, setInstrumentsCsv] = useState(
    Array.isArray(initialValues?.instruments) ? initialValues.instruments.join(', ') : ''
  );
  const [city, setCity] = useState(initialValues?.city || '');
  const [bio, setBio] = useState(initialValues?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(initialValues?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const parsedInstruments = useMemo(() => parseInstrumentsCsv(instrumentsCsv), [instrumentsCsv]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !mainInstrument.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        main_instrument: mainInstrument.trim(),
        instruments: parsedInstruments,
        city: city.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.wizard}>
      <div style={{ ...styles.authCard, maxWidth: 560, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ background: '#007aff22', borderRadius: 16, padding: 10 }}>
            <UserRound size={24} color="#007aff" />
          </div>
          <div>
            <h2 style={{ ...styles.authTitle, margin: 0 }}>Complete seu perfil</h2>
            <p style={{ ...styles.authSubtitle, margin: '6px 0 0 0' }}>
              Precisamos desses dados para identificação da banda.
            </p>
          </div>
        </div>

        <div style={{ color: '#888', fontSize: 11, marginBottom: 14 }}>
          Conta: {email}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={styles.inputField}
            placeholder="Nome completo *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            style={styles.inputField}
            placeholder="Instrumento principal * (ex.: Voz, Guitarra, Bateria)"
            value={mainInstrument}
            onChange={(e) => setMainInstrument(e.target.value)}
            required
          />
          <input
            style={styles.inputField}
            placeholder="Outros instrumentos (opcional, separados por vírgula)"
            value={instrumentsCsv}
            onChange={(e) => setInstrumentsCsv(e.target.value)}
          />
          <input
            style={styles.inputField}
            placeholder="Cidade/UF (opcional)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <textarea
            style={{ ...styles.inputField, minHeight: 88 }}
            placeholder="Bio curta (opcional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <input
            style={styles.inputField}
            placeholder="URL da foto/avatar (opcional)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />

          <button style={styles.primaryButton} disabled={saving || !fullName.trim() || !mainInstrument.trim()}>
            {saving ? <Loader2 size={18} className="spin" /> : 'SALVAR E CONTINUAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

