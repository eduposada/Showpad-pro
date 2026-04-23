import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Loader2, UserRound } from 'lucide-react';

function parseInstrumentsCsv(input) {
  return String(input || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const ProfileOnboardingView = ({
  styles,
  email,
  authMeta = {},
  initialValues,
  onSubmit,
  isEditMode = false,
  onCancel,
}) => {
  const [fullName, setFullName] = useState(initialValues?.full_name || '');
  const [mainInstrument, setMainInstrument] = useState(initialValues?.main_instrument || '');
  const [instrumentsCsv, setInstrumentsCsv] = useState(
    Array.isArray(initialValues?.instruments) ? initialValues.instruments.join(', ') : ''
  );
  const [city, setCity] = useState(initialValues?.city || '');
  const [bio, setBio] = useState(initialValues?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(initialValues?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);
  const skipMetaOnce = useRef(false);

  useEffect(() => {
    if (skipMetaOnce.current) return;
    const meta = authMeta || {};
    setFullName((prev) => {
      const p = String(prev || '').trim();
      if (p) return prev;
      const fromRow = initialValues?.full_name != null && String(initialValues.full_name).trim();
      if (fromRow) return fromRow;
      return (
        (meta.full_name && String(meta.full_name).trim()) ||
        (meta.name && String(meta.name).trim()) ||
        ''
      );
    });
    setAvatarUrl((prev) => {
      const p = String(prev || '').trim();
      if (p) return prev;
      const fromRow = initialValues?.avatar_url != null && String(initialValues.avatar_url).trim();
      if (fromRow) return fromRow;
      return (
        (meta.picture && String(meta.picture).trim()) ||
        (meta.avatar_url && String(meta.avatar_url).trim()) ||
        ''
      );
    });
  }, [initialValues, authMeta]);

  const parsedInstruments = useMemo(() => parseInstrumentsCsv(instrumentsCsv), [instrumentsCsv]);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const SIZE = 200;
        let width = img.width;
        let height = img.height;
        let sx = 0;
        let sy = 0;
        let sw = width;
        let sh = height;
        if (width > height) {
          sw = height;
          sx = (width - height) / 2;
        } else {
          sh = width;
          sy = (height - width) / 2;
        }
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
        skipMetaOnce.current = true;
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const isNameValid = Boolean(fullName.trim());
  const isMainInstrumentValid = Boolean(mainInstrument.trim());
  const canSubmit = isEditMode ? isNameValid : (isNameValid && isMainInstrumentValid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSubmit({
        full_name: fullName.trim(),
        main_instrument: mainInstrument.trim(),
        instruments: parsedInstruments,
        city: city.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
    } catch (err) {
      setSaveError(err?.message || 'Erro ao salvar. Tente novamente.');
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
            <h2 style={{ ...styles.authTitle, margin: 0 }}>
              {isEditMode ? 'Editar perfil' : 'Complete seu perfil'}
            </h2>
            <p style={{ ...styles.authSubtitle, margin: '6px 0 0 0' }}>
              {isEditMode
                ? 'Atualize seu nome artístico, instrumentos e dados do perfil.'
                : 'Dados mínimos para identificação na banda (nome, instrumento e, se quiser, foto).'}
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

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
            <button
              type="button"
              style={{ ...styles.headerBtn, padding: '10px 14px', fontSize: 11, fontWeight: 800 }}
              onClick={() => fileInputRef.current?.click()}
            >
              Escolher foto…
            </button>
            {avatarUrl ? (
              <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '1px solid #333' }}>
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : null}
          </div>
          <input
            style={styles.inputField}
            placeholder="Ou URL da foto/avatar (opcional)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />

          {saveError && (
            <div style={{ color: '#ff3b30', fontSize: 12, fontWeight: 600, padding: '8px 10px', background: 'rgba(255,59,48,0.10)', borderRadius: 8, border: '1px solid rgba(255,59,48,0.25)' }}>
              {saveError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {isEditMode && (
              <button
                type="button"
                style={{ ...styles.headerBtn, flex: 1, padding: '12px 14px' }}
                onClick={onCancel}
                disabled={saving}
              >
                CANCELAR
              </button>
            )}
            <button style={{ ...styles.primaryButton, flex: 1 }} disabled={saving || !canSubmit}>
              {saving ? <Loader2 size={18} className="spin" /> : isEditMode ? 'SALVAR' : 'SALVAR E CONTINUAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
