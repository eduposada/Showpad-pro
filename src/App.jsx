import React, { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import { 
  Plus, Music, Trash2, Save, Monitor, Settings, Zap, 
  LogOut, SortAsc, UserRound, Cloud, RefreshCw, User,
  CloudUpload, CloudDownload, Info, Download, Loader2, PanelLeft, X
} from 'lucide-react';

import {
  db,
  transposeContent,
  supabase,
  triggerDL,
  pushToCloud,
  pullFromCloud,
  soloInviteCodeForBandId,
  SHOWPAD_LAST_UID_KEY,
  clearAllLocalDexieStores,
  filterDexieSongsForCreator,
  filterDexieSetlistsForSession,
  deleteSongFromCloudForUser,
} from './ShowPadCore';
import { MainEditor } from './EditorComponents';
import { ShowModeView } from './ShowModeView';
import { SettingsView } from './SettingsView';
import { AuthView } from './AuthView';
import { BandView } from './BandView';
import { GarimpoView } from './GarimpoView';
import { InfoModal } from './InfoModal';
import { ProfileOnboardingView } from './ProfileOnboardingView';
import { styles } from './Styles';
import { applyGesturePreset, DEFAULT_STAGE_CONTROLS, normalizeStageControls, STAGE_CONTROLS_STORAGE_KEY } from './stageControls';

/** Valor de `datetime-local` no editor de show → texto legível na lista lateral (pt-BR). */
function formatSetlistListDate(timeRaw) {
  const t = String(timeRaw ?? '').trim();
  if (!t) return '';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function App() {
  const [session, setSession] = useState(null);
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [bands, setBands] = useState([]); 
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [showMode, setShowMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [view, setView] = useState('library'); 
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 30);
  const [sortBy, setSortBy] = useState(localStorage.getItem('sortBy') || 'title');
  const [setlistSortBy, setSetlistSortBy] = useState(localStorage.getItem('setlistSortBy') || 'title');
  const [filterArtist, setFilterArtist] = useState('');
  const [compactLayout, setCompactLayout] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches
  );
  const [phoneLayout, setPhoneLayout] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 500px), (max-width: 900px) and (max-height: 440px)').matches
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !(typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches)
  );

  const [midiStatus, setMidiStatus] = useState("off");
  const [midiFlash, setMidiFlash] = useState(false);
  const [allInputs, setAllInputs] = useState([]);
  const [lastSignalUI, setLastSignalUI] = useState("");
  const [midiLearning, setMidiLearning] = useState(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [profileRecord, setProfileRecord] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileNeedsOnboarding, setProfileNeedsOnboarding] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [stageControls, setStageControls] = useState(() => {
    try {
      const raw = localStorage.getItem(STAGE_CONTROLS_STORAGE_KEY);
      return raw ? normalizeStageControls(JSON.parse(raw)) : DEFAULT_STAGE_CONTROLS;
    } catch {
      return DEFAULT_STAGE_CONTROLS;
    }
  });
  const [lastStageCommand, setLastStageCommand] = useState('');
  const [learningGestureAction, setLearningGestureAction] = useState(null);

  const midiLearningRef = useRef(null);
  const showScrollRef = useRef(null);
  const importSongFileRef = useRef(null);

  const getUserDisplayName = () => {
    if (!session?.user) return "Usuário";
    if (profileRecord?.full_name) return profileRecord.full_name;
    const meta = session.user.user_metadata;
    return meta?.full_name || meta?.name || session.user.email.split('@')[0];
  };

  const profileSelectColumns =
    'id, email, full_name, main_instrument, instruments, city, bio, avatar_url';

  const selectProfileRow = async (userId) => {
    let r = await supabase
      .from('profiles')
      .select(profileSelectColumns)
      .eq('id', userId)
      .maybeSingle();
    const em = (r.error?.message || '').toLowerCase();
    if (r.error && em.includes('email')) {
      r = await supabase
        .from('profiles')
        .select('id, full_name, main_instrument, instruments, city, bio, avatar_url')
        .eq('id', userId)
        .maybeSingle();
    }
    return r;
  };

  const ensureProfileRowFromAuth = async (user) => {
    const meta = user.user_metadata || {};
    const hintName = [meta.full_name, meta.name, meta.given_name]
      .map((s) => (s != null ? String(s).trim() : ''))
      .find(Boolean);
    const hintAvatar = [meta.avatar_url, meta.picture]
      .map((s) => (s != null ? String(s).trim() : ''))
      .find(Boolean);
    const localPart = user.email ? String(user.email).split('@')[0] : '';
    const base = {
      id: user.id,
      full_name: hintName || localPart || null,
      avatar_url: hintAvatar || null,
      instruments: [],
      updated_at: new Date().toISOString(),
    };
    let { error } = await supabase.from('profiles').upsert(
      { ...base, email: user.email || null },
      { onConflict: 'id' }
    );
    if (error && (error.message || '').toLowerCase().includes('email')) {
      ({ error } = await supabase.from('profiles').upsert(base, { onConflict: 'id' }));
    }
    if (error) console.warn('ensureProfileRowFromAuth:', error.message || error);
  };

  const loadProfileGate = async (user) => {
    if (!user || !supabase) {
      setProfileRecord(null);
      setProfileNeedsOnboarding(false);
      setProfileReady(true);
      return;
    }
    setProfileLoading(true);
    try {
      let { data, error } = await selectProfileRow(user.id);

      if (error) {
        // Enquanto a migration não estiver aplicada, não travar acesso.
        console.warn('profiles gate:', error.message || error);
        setProfileRecord(null);
        setProfileNeedsOnboarding(false);
        setProfileReady(true);
        return;
      }

      if (!data) {
        await ensureProfileRowFromAuth(user);
        const again = await selectProfileRow(user.id);
        data = again.data;
        error = again.error;
        if (error) {
          console.warn('profiles gate (refetch):', error.message || error);
        }
      }

      let rec = data || null;
      // Sem trigger no Auth: alinhar e-mail na linha `profiles` com JWT (RLS update self).
      if (rec && user.email) {
        const { error: emailErr } = await supabase
          .from('profiles')
          .update({
            email: user.email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        if (!emailErr) {
          rec = { ...rec, email: user.email };
        }
      }

      const missingFullName = !(rec?.full_name && String(rec.full_name).trim());
      const missingMainInstrument = !(rec?.main_instrument && String(rec.main_instrument).trim());
      setProfileRecord(rec);
      setProfileNeedsOnboarding(!rec || missingFullName || missingMainInstrument);
      setProfileReady(true);
    } catch (e) {
      console.error('Erro ao verificar profile:', e);
      setProfileRecord(null);
      setProfileNeedsOnboarding(false);
      setProfileReady(true);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfileOnboarding = async (payload) => {
    if (!session?.user || !supabase) return;
    const row = {
      id: session.user.id,
      email: session.user.email || null,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    let { data, error } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select(profileSelectColumns)
      .single();

    // Coluna `email` ausente no schema (migration não aplicada).
    if (error && (error.message || '').toLowerCase().includes('email')) {
      const { email: _omit, ...rest } = row;
      ({ data, error } = await supabase
        .from('profiles')
        .upsert(rest, { onConflict: 'id' })
        .select('id, full_name, main_instrument, instruments, city, bio, avatar_url')
        .single());
    }

    // Coluna estendida ausente no schema (bio, city, avatar_url, main_instrument, instruments…).
    // Fallback: salva apenas os campos nucleares para não bloquear o usuário.
    const isColumnMissing = (error?.message || '').includes("column of 'profiles'") ||
      (error?.message || '').includes("schema cache");
    if (isColumnMissing) {
      console.warn('profiles — coluna ausente no schema; salvando campos nucleares. Aplique as migrations pendentes no Supabase.', error?.message);
      const coreRow = {
        id: session.user.id,
        full_name: payload.full_name,
        updated_at: new Date().toISOString(),
      };
      ({ data, error } = await supabase
        .from('profiles')
        .upsert(coreRow, { onConflict: 'id' })
        .select('id, full_name')
        .single());
      if (!error) {
        throw new Error(
          'Perfil salvo parcialmente (nome atualizado). As colunas de bio, cidade e avatar ainda não existem no banco — aplique as migrations pendentes no painel do Supabase para salvar todos os campos.'
        );
      }
    }

    if (error) throw new Error(error.message || 'Erro ao salvar perfil.');
    setProfileRecord(data || row);
    setProfileNeedsOnboarding(false);
    setProfileReady(true);
  };

  const handleSaveProfileEdit = async (payload) => {
    try {
      await handleSaveProfileOnboarding(payload);
      setShowProfileEdit(false);
    } catch (err) {
      console.error('handleSaveProfileEdit:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then((res) => { if (res.data) setSession(res.data.session); });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        if (!s) {
          setSongs([]);
          setSetlists([]);
          setBands([]);
          setSelectedItem(null);
          setProfileRecord(null);
          setProfileNeedsOnboarding(false);
          setProfileReady(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setProfileRecord(null);
      setProfileNeedsOnboarding(false);
      setProfileReady(false);
      return;
    }
    loadProfileGate(session.user);
  }, [session]);

  /** Dexie (`ShowPadProWeb`) é partilhado no mesmo navegador: ao entrar com outro `auth.uid`, apagar dados locais. */
  useEffect(() => {
    if (!session?.user?.id) return;
    const id = session.user.id;
    let cancelled = false;
    (async () => {
      try {
        const prev = sessionStorage.getItem(SHOWPAD_LAST_UID_KEY);
        if (prev && prev !== id) {
          await clearAllLocalDexieStores();
        }
        if (!cancelled) sessionStorage.setItem(SHOWPAD_LAST_UID_KEY, id);
      } catch (e) {
        console.error('Troca de conta / Dexie:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const checkSoloBandV3 = async (user) => {
    if (!user) return;
    // is_solo é boolean no Dexie; .equals(1) nunca casava → criava uma SOLO nova a cada execução.
    let solosForUser = await db.my_bands
        .filter((b) => b.is_solo === true && b.owner_id === user.id)
        .toArray();
    if (solosForUser.length > 1) {
        solosForUser.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        for (let i = 1; i < solosForUser.length; i++) {
            await db.my_bands.delete(solosForUser[i].id);
        }
        solosForUser = [solosForUser[0]];
    }
    if (solosForUser.length > 0) return;

    const soloName = `${getUserDisplayName()} - SOLO`;
    try {
        const soloId = crypto.randomUUID();
        const soloData = {
            id: soloId,
            name: soloName,
            invite_code: soloInviteCodeForBandId(soloId),
            owner_id: user.id,
            role: 'admin',
            is_solo: true,
        };
        await db.my_bands.put(soloData);
        refreshData();
    } catch (e) {
        console.error('❌ Erro na Solo V3:', e.message);
    }
  };

  // Garantir banda solo só quando a sessão muda — não ao trocar ordenação (sortBy).
  useEffect(() => {
    if (session && profileReady && !profileNeedsOnboarding) {
      checkSoloBandV3(session.user);
      initMidi();
      checkServer();
    }
  }, [session, profileReady, profileNeedsOnboarding]);

  useEffect(() => {
    if (session && profileReady && !profileNeedsOnboarding) {
      refreshData();
    }
  }, [session, sortBy, setlistSortBy, profileReady, profileNeedsOnboarding]);

  useEffect(() => {
    localStorage.setItem('setlistSortBy', setlistSortBy);
  }, [setlistSortBy]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqCompact = window.matchMedia('(max-width: 900px)');
    const mqPhone = window.matchMedia('(max-width: 500px), (max-width: 900px) and (max-height: 440px)');
    const apply = () => {
      const compact = mqCompact.matches;
      const phone = mqPhone.matches;
      setCompactLayout(compact);
      setPhoneLayout(phone);
      if (!compact) setSidebarOpen(true);
    };
    apply();
    mqCompact.addEventListener('change', apply);
    mqPhone.addEventListener('change', apply);
    return () => {
      mqCompact.removeEventListener('change', apply);
      mqPhone.removeEventListener('change', apply);
    };
  }, []);

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);
  useEffect(() => {
    try {
      localStorage.setItem(STAGE_CONTROLS_STORAGE_KEY, JSON.stringify(stageControls));
    } catch (err) {
      console.warn('Falha ao persistir stageControls:', err);
    }
  }, [stageControls]);

  const updateStageControls = (patch) => {
    setStageControls((prev) => normalizeStageControls({ ...prev, ...patch }));
  };

  const handleToggleStageCamera = () => {
    setStageControls((prev) =>
      normalizeStageControls({ ...prev, cameraPreviewVisible: !prev.cameraPreviewVisible })
    );
  };

  const handleApplyGesturePreset = (preset) => {
    setStageControls((prev) => applyGesturePreset(prev, preset));
  };

  const handleStartGestureLearning = (action) => {
    setLearningGestureAction(action);
  };

  const handleCancelGestureLearning = () => {
    setLearningGestureAction(null);
  };

  const handleLearnGestureSample = (gestureToken) => {
    if (!learningGestureAction || !gestureToken) return;
    setStageControls((prev) => normalizeStageControls({
      ...prev,
      gestureBindings: {
        ...(prev.gestureBindings || {}),
        [learningGestureAction]: gestureToken,
      },
    }));
    setLastStageCommand(`aprendido: ${learningGestureAction} => ${gestureToken}`);
    setLearningGestureAction(null);
  };

  const handleStageCommandEvent = (command, source = 'unknown') => {
    setLastStageCommand(`${command} via ${source}`);
  };

  const refreshData = async () => { 
    if (!session) return;
    try {
        const uid = session.user.id;
        const allBands = await db.my_bands.toArray();
        const filteredBands = allBands.filter((b) => b.owner_id === uid || b.role);
        const bandIds = new Set(filteredBands.map((b) => b.id));
        const s = filterDexieSongsForCreator(await db.songs.toArray(), uid);
        const sl = filterDexieSetlistsForSession(await db.setlists.toArray(), uid, bandIds);

        s.sort((a,b) => {
            const valA = (sortBy === 'artist' ? a.artist : a.title) || "";
            const valB = (sortBy === 'artist' ? b.artist : b.title) || "";
            return valA.toLowerCase().localeCompare(valB.toLowerCase());
        });

        const slSorted = [...sl];
        if (setlistSortBy === 'title') {
          slSorted.sort((a, b) => {
            const ta = (a.title || '').toLowerCase();
            const tb = (b.title || '').toLowerCase();
            return ta.localeCompare(tb);
          });
        } else {
          const hasTime = (row) => String(row?.time || '').trim() !== '';
          slSorted.sort((a, b) => {
            const ha = hasTime(a);
            const hb = hasTime(b);
            if (ha !== hb) return ha ? -1 : 1;
            if (ha && hb) {
              const cmp = String(b.time).localeCompare(String(a.time));
              if (cmp !== 0) return cmp;
            }
            return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
          });
        }

        setSongs(s);
        setSetlists(slSorted);
        setBands(filteredBands); 

        if (selectedItem) {
            const id = selectedItem.data.id;
            const upd = (selectedItem.type === 'song') ? s.find(x => x.id === id) : slSorted.find(x => x.id === id);
            if (upd) setSelectedItem({type: selectedItem.type, data: upd});
        }
    } catch (e) { console.error("Erro ao atualizar dados:", e); }
  };

  const handleCreateNew = async () => {
    const isSetlist = view === 'setlists';
    const obj = isSetlist ? {
      title: "Novo Show", songs: [], location: "", time: "", members: "", notes: "", creator_id: session.user.id
    } : {
      title: "Nova Música", artist: "Artista", content: "", creator_id: session.user.id, bpm: 120
    };
    const id = await (isSetlist ? db.setlists.add(obj) : db.songs.add(obj));
    await refreshData();
    const savedItem = await (isSetlist ? db.setlists.get(id) : db.songs.get(id));
    setSelectedItem({ type: isSetlist ? 'setlist' : 'song', data: savedItem });
    if (compactLayout) setSidebarOpen(false);
  };

  const openBandShow = (item) => {
    setSelectedItem(item);
    setView('setlists');
    if (compactLayout) setSidebarOpen(false);
  };

  const checkServer = () => {
    if (window.location.hostname === "localhost") {
      fetch('http://localhost:3001/ping').then(r => setIsServerOnline(r.ok)).catch(() => setIsServerOnline(false));
    } else { setIsServerOnline(false); }
  };

  const handleCloudPush = async () => {
    if (!session) return;
    setIsScraping(true);
    try { await pushToCloud(session.user.id); alert("Sincronização de saída concluída!"); } catch (e) { alert("Erro: " + e.message); }
    setIsScraping(false);
  };

  const handleCloudPull = async () => {
    if (!session) return;
    setIsScraping(true);
    try { await pullFromCloud(session.user.id); await refreshData(); alert("Sincronização de entrada concluída!"); } catch (e) { alert("Erro: " + e.message); }
    setIsScraping(false);
  };

  const initMidi = () => {
    setTimeout(() => {
      WebMidi.enable({ sysex: true }).then(() => {
        const updateMidi = () => {
          const ins = WebMidi.inputs;
          setAllInputs(ins.map(i => i.name));
          setMidiStatus(ins.length > 0 ? "ready" : "nodevice");
          ins.forEach(input => {
            input.removeListener();
            input.addListener("midimessage", e => {
              const st = e.data[0], d1 = e.data[1], d2 = e.data[2];
              if ((st >= 144 && st <= 159 && d2 > 0) || (st >= 176 && st <= 191)) {
                const sig = (st >= 144 && st <= 159 ? "note" : "cc") + "-" + d1;
                setMidiFlash(true); setLastSignalUI(sig); 
                setTimeout(() => { setMidiFlash(false); setLastSignalUI(""); }, 1000);
                if (midiLearningRef.current) { localStorage.setItem("midi-" + midiLearningRef.current, sig); setMidiLearning(null); return; }
                if (sig === localStorage.getItem('midi-up')) scrollPage(-1);
                if (sig === localStorage.getItem('midi-down')) scrollPage(1);
              }
            });
          });
        };
        updateMidi();
        WebMidi.addListener("connected", updateMidi);
        WebMidi.addListener("disconnected", updateMidi);
      }).catch(() => setMidiStatus("blocked"));
    }, 500);
  };

  const scrollPage = (d) => { if (showScrollRef.current) showScrollRef.current.scrollBy({ top: (window.innerHeight * 0.45) * d, behavior: 'smooth' }); };

  const handleImport = (e, targetMode) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (targetMode === 'library' && d.songs) {
          for (let s of d.songs) { if (!(await db.songs.where({title: s.title, artist: s.artist}).first())) await db.songs.add({ ...s, id: undefined, creator_id: session.user.id }); }
        } else if (targetMode === 'setlists' && d.setlists) {
             for (let sl of d.setlists) await db.setlists.add({ ...sl, id: undefined, creator_id: session.user.id });
        }
        refreshData(); alert("Importado!");
      } catch (err) { alert("Erro JSON."); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const handleExportShowpadSong = (song) => {
    const blob = new Blob([JSON.stringify({ ...song }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const base = `${song.title || 'musica'}${song.artist ? ` - ${song.artist}` : ''}`.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 120);
    a.download = `${base}.showpad`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportShowpadSongFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !session) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        alert('Arquivo .showpad inválido.');
        return;
      }
      if (data.title === undefined && data.content === undefined) {
        alert('Arquivo .showpad inválido.');
        return;
      }
      const { id: _omit, ...rest } = data;
      await db.songs.add({ ...rest, creator_id: session.user.id });
      await refreshData();
      alert('Música importada.');
    } catch {
      alert('Erro ao importar o arquivo.');
    }
  };

  const getMidiStyle = () => {
    const isReady = midiStatus === 'ready';
    return {
      display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px',
      fontSize: '10px', fontWeight: '800', transition: 'all 0.3s ease', cursor: 'default',
      boxShadow: midiFlash ? '0 0 15px #4cd964' : 'inset 0 -2px 4px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
      background: isReady ? 'radial-gradient(circle at 30% 30%, #4cd964, #28a745)' : 'radial-gradient(circle at 30% 30%, #8e8e93, #3a3a3c)',
      color: '#fff', transform: midiFlash ? 'scale(1.1)' : 'scale(1)'
    };
  };

  if (!session) return <AuthView styles={styles} />;
  if (profileLoading || !profileReady) {
    return (
      <div style={styles.wizard}>
        <div style={{ ...styles.authCard, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 220 }}>
          <Loader2 size={22} className="spin" />
          <span style={{ color: '#aaa', fontSize: 13 }}>Carregando perfil...</span>
        </div>
      </div>
    );
  }
  if (profileNeedsOnboarding) {
    return (
      <ProfileOnboardingView
        styles={styles}
        email={session.user.email}
        authMeta={session.user.user_metadata || {}}
        initialValues={profileRecord}
        onSubmit={handleSaveProfileOnboarding}
      />
    );
  }

  const filteredSongs = filterArtist
    ? songs.filter((s) => (s.artist || '').trim() === filterArtist)
    : songs;
  const uniqueArtists = [...new Set(songs.map((s) => (s.artist || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const phoneTabStyle = phoneLayout ? { padding: '8px 5px', fontSize: '9px' } : {};
  const phoneSidebarControlsStyle = phoneLayout ? { padding: '5px', gap: '5px' } : {};
  const phoneSidebarFooterStyle = phoneLayout ? { padding: '8px', gap: '8px' } : {};
  const phoneSidebarActionBtnStyle = phoneLayout ? { height: '32px', fontSize: '10px', padding: '6px 8px' } : {};

  return (
    <div style={styles.appContainer}>
      <header style={phoneLayout ? { ...styles.mainHeader, padding: '0 8px' } : styles.mainHeader}>
        <div style={{display:'flex', alignItems:'center', gap: phoneLayout ? '8px' : '12px'}}>
          {compactLayout && (
            <button
              type="button"
              title="Abrir lista"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007aff', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <PanelLeft size={22} />
            </button>
          )}
          <Music color="#007aff" size={phoneLayout ? 16 : 20} />
          <h1 style={{fontSize: phoneLayout ? '12px' : '16px', fontWeight:'800', margin:0}}>SHOWPAD PRO</h1>
          {!phoneLayout && (
            <div style={getMidiStyle()}>
              <Zap size={10} fill={midiStatus === 'ready' ? "#fff" : "none"}/> 
              {midiStatus === 'ready' ? "MIDI OK" : "MIDI OFF"}
            </div>
          )}
        </div>

        <div style={{display:'flex', gap: phoneLayout ? '8px' : '15px', alignItems:'center'}}>
            <button
              type="button"
              onClick={() => setShowProfileEdit(true)}
              title="Editar perfil"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: phoneLayout ? '0' : '8px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: phoneLayout ? '5px 8px' : '5px 12px',
                borderRadius: '15px',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {profileRecord?.avatar_url ? (
                <span style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', border: '1px solid #2f2f32', flexShrink: 0 }}>
                  <img src={profileRecord.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </span>
              ) : (
                <User size={14} color="#007aff" />
              )}
              {!phoneLayout && (
                <span style={{fontSize:'12px', fontWeight:'600', color:'#fff'}}>{getUserDisplayName()}</span>
              )}
            </button>

            <div style={{display:'flex', gap: phoneLayout ? '4px' : '8px', alignItems:'center'}}>
              <button type="button" title="Informações" onClick={() => setShowInfo(true)} style={{background:'none', border:'none', cursor:'pointer', color:'#8e8e93', padding: phoneLayout ? '3px' : '5px'}}><Info size={phoneLayout ? 18 : 20}/></button>
              <button 
                title="Backup na Nuvem" 
                style={{...styles.headerBtn, display:'flex', gap:'6px', color:'#4cd964', borderColor:'#4cd96466', padding: phoneLayout ? '5px 7px' : undefined}} 
                onClick={handleCloudPush}
              >
                <div style={{position:'relative', display:'flex', alignItems:'center'}}>
                  <Cloud size={16}/>
                  <Plus size={8} style={{position:'absolute', top:'-2px', right:'-4px'}} strokeWidth={4}/>
                </div>
                {!phoneLayout && <span style={{fontSize:'9px', fontWeight:'900'}}>UPLOAD</span>}
              </button>

              <button 
                title="Sincronizar Nuvem" 
                style={{...styles.headerBtn, display:'flex', gap:'6px', color:'#007aff', borderColor:'#007aff66', padding: phoneLayout ? '5px 7px' : undefined}} 
                onClick={handleCloudPull}
              >
                <div style={{position:'relative', display:'flex', alignItems:'center'}}>
                  <Cloud size={16}/>
                  <RefreshCw size={8} style={{position:'absolute', bottom:'-2px', right:'-4px'}} strokeWidth={4}/>
                </div>
                {!phoneLayout && <span style={{fontSize:'9px', fontWeight:'900'}}>SYNC</span>}
              </button>

              <button onClick={() => setShowSettings(true)} style={{background:'none', border:'none', cursor:'pointer', color:'#fff', padding: phoneLayout ? '3px' : '5px'}}><Settings size={phoneLayout ? 18 : 20}/></button>
              <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', cursor:'pointer', color:'#ff3b30', padding: phoneLayout ? '3px' : '5px'}}><LogOut size={phoneLayout ? 18 : 20}/></button>
            </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%', position: 'relative' }}>
        {compactLayout && sidebarOpen && (
          <button type="button" aria-label="Fechar lista" onClick={() => setSidebarOpen(false)} style={styles.sidebarScrim} />
        )}
        <div
          style={
            compactLayout
              ? {
                  ...styles.sidebar,
                  ...styles.sidebarDrawer,
                  position: 'fixed',
                  top: '60px',
                  left: 0,
                  height: 'calc(100% - 60px)',
                  width: 'min(320px, 92vw)',
                  zIndex: 4310,
                  transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                  pointerEvents: sidebarOpen ? 'auto' : 'none',
                }
              : styles.sidebar
          }
        >
          {compactLayout && (
            <div style={{ padding: '6px 10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#1a1a1a', flexShrink: 0 }}>
              <button type="button" title="Fechar lista" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff3b30', padding: '4px', display: 'flex' }}>
                <X size={22} />
              </button>
            </div>
          )}
          <div style={styles.navTabs}>
            <button onClick={() => setView('library')} style={{ ...(view === 'library' ? styles.activeTab : styles.tab), ...phoneTabStyle }}>MÚSICAS</button>
            <button onClick={() => setView('setlists')} style={{ ...(view === 'setlists' ? styles.activeTab : styles.tab), ...phoneTabStyle }}>SHOWS</button>
            <button onClick={() => setView('bands')} style={{ ...(view === 'bands' ? styles.activeTab : styles.tab), ...phoneTabStyle }}>BANDAS</button>
            <button onClick={() => setView('garimpo')} style={{ ...(view === 'garimpo' ? styles.activeTab : styles.tab), ...phoneTabStyle }}>GARIMPAR</button>
          </div>

          {view === 'setlists' && (
            <div style={{ padding: '8px', borderBottom: '1px solid #333', display: 'flex', gap: '6px', ...phoneSidebarControlsStyle }}>
              <button type="button" onClick={() => setSetlistSortBy('title')} style={{ ...styles.headerBtn, ...phoneSidebarActionBtnStyle, flex: 1, fontSize: phoneLayout ? '8px' : '9px', ...(setlistSortBy === 'title' ? { borderColor: '#007aff', color: '#007aff' } : {}) }}>A–Z SHOW</button>
              <button type="button" onClick={() => setSetlistSortBy('time')} style={{ ...styles.headerBtn, ...phoneSidebarActionBtnStyle, flex: 1, fontSize: phoneLayout ? '8px' : '9px', ...(setlistSortBy === 'time' ? { borderColor: '#007aff', color: '#007aff' } : {}) }}>DATA</button>
            </div>
          )}

          {view === 'library' && (
            <div style={{ padding: '8px', borderBottom: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '8px', ...phoneSidebarControlsStyle }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => { setSortBy('title'); setFilterArtist(''); }} style={{ ...styles.headerBtn, ...phoneSidebarActionBtnStyle, flex: 1, fontSize: phoneLayout ? '8px' : '9px', ...(sortBy === 'title' ? { borderColor: '#007aff', color: '#007aff' } : {}) }}>A–Z TÍTULO</button>
                <button type="button" onClick={() => { setSortBy('artist'); setFilterArtist(''); }} style={{ ...styles.headerBtn, ...phoneSidebarActionBtnStyle, flex: 1, fontSize: phoneLayout ? '8px' : '9px', ...(sortBy === 'artist' ? { borderColor: '#007aff', color: '#007aff' } : {}) }}>A–Z ARTISTA</button>
              </div>
              <select
                value={filterArtist}
                onChange={(e) => setFilterArtist(e.target.value)}
                style={{
                  width: '100%', padding: phoneLayout ? '4px 6px' : '6px 8px', borderRadius: '6px', backgroundColor: '#2c2c2e', fontSize: phoneLayout ? '10px' : '11px', cursor: 'pointer',
                  ...(filterArtist !== '' ? { color: '#4cd964', border: '1px solid #4cd964' } : { color: '#fff', border: '1px solid #444' })
                }}
              >
                <option value="">Todos os artistas</option>
                {uniqueArtists.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          <div style={styles.listArea}>
            {['library', 'setlists'].includes(view) ? (view === 'library' ? filteredSongs : setlists).map(item => {
              const band = item.band_id ? bands.find(b => b.id === item.band_id) : null;
              const revokedShow = view === 'setlists' && item.revoked_by_admin && item.band_id;
              return (
                <div key={item.id} style={{
                  ...(selectedItem && selectedItem.data.id === item.id ? styles.selectedItem : styles.listItem),
                  ...(revokedShow ? { opacity: 0.75, borderLeft: '3px solid #ff9500' } : {}),
                }}
                     onClick={() => {
                       setSelectedItem({ type: view === 'library' ? 'song' : 'setlist', data: item });
                       if (compactLayout) setSidebarOpen(false);
                     }}
                >
                  <div style={{flex:1, overflow:'hidden'}}>
                      <strong style={{color: revokedShow ? '#999' : '#fff', display:'block'}}>{item.title}</strong>
                      {band && <span style={styles.bandTagOrange}>{band.name}</span>}
                      {revokedShow && <span style={{ display: 'block', fontSize: '9px', color: '#ff9500', fontWeight: 800, marginTop: '2px' }}>FORA DA AGENDA OFICIAL</span>}
                      {view === 'setlists' ? (
                        <>
                          {(() => {
                            const when = formatSetlistListDate(item.time);
                            return when ? (
                              <small style={{ display: 'block', color: '#5ac8fa', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
                                {when}
                              </small>
                            ) : null;
                          })()}
                          <small style={styles.artistYellow}>{item.location?.trim() ? item.location : '---'}</small>
                        </>
                      ) : (
                        <small style={styles.artistYellow}>{item.artist || '---'}</small>
                      )}
                  </div>
                  <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                      <div style={{cursor:'pointer'}} onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem({ type: view === 'library' ? 'song' : 'setlist', data: item });
                        setShowMode(true);
                        if (compactLayout) setSidebarOpen(false);
                      }}><Monitor size={20} color="#007aff"/></div>
                      {view === 'library' && (
                        <div style={{cursor:'pointer'}} title="Exportar .showpad" onClick={(e) => { e.stopPropagation(); handleExportShowpadSong(item); }}><Download size={20} color="#34c759"/></div>
                      )}
                      <button
                        type="button"
                        title="Excluir"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ff3b30' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!window.confirm('Excluir?')) return;
                          const pk = item?.id;
                          if (pk === undefined || pk === null) {
                            alert('Não foi possível excluir: registo sem identificador local.');
                            return;
                          }
                          void (async () => {
                            try {
                              if (view === 'library') {
                                const { error: cloudErr } = await deleteSongFromCloudForUser(
                                  session.user.id,
                                  item.title,
                                  item.artist
                                );
                                await db.songs.delete(pk);
                                if (cloudErr) {
                                  alert(
                                    'Música removida neste aparelho, mas a remoção na nuvem falhou: '
                                      + (cloudErr.message || String(cloudErr))
                                      + '. Verifica a rede ou as permissões (RLS DELETE em songs).'
                                  );
                                }
                              } else {
                                await db.setlists.delete(pk);
                              }
                              await refreshData();
                              setSelectedItem(null);
                            } catch (err) {
                              console.error(err);
                              alert('Não foi possível excluir: ' + (err?.message || String(err)));
                            }
                          })();
                        }}
                      >
                        <Trash2 size={20} color="#ff3b30" />
                      </button>
                  </div>
                </div>
              )
            }) : <div style={{padding:'20px', color:'#888', fontSize:'11px', textAlign:'center'}}>Menu lateral ativo.</div>}
          </div>

          <div style={{ ...styles.sidebarFooter, ...phoneSidebarFooterStyle }}>
            {view === 'library' && (
              <>
                <input ref={importSongFileRef} type="file" accept=".showpad,application/json" style={{ display: 'none' }} onChange={handleImportShowpadSongFile} />
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button type="button" onClick={() => importSongFileRef.current?.click()} style={{ ...styles.importBtnLabel, ...phoneSidebarActionBtnStyle, flex: 1, border: 'none', cursor: 'pointer' }}>IMPORTAR</button>
                  <button type="button" onClick={handleCreateNew} style={{ ...styles.addBtn, ...phoneSidebarActionBtnStyle, flex: 1 }}>+ NOVO</button>
                </div>
              </>
            )}
            {view === 'setlists' && (
              <button type="button" onClick={handleCreateNew} style={{ ...styles.addBtn, ...phoneSidebarActionBtnStyle }}>+ NOVO</button>
            )}
          </div>
        </div>

        <div style={styles.mainEditor}>
          {view === 'garimpo' ? <GarimpoView isServerOnline={isServerOnline} styles={styles} refresh={refreshData} session={session} phoneLayout={phoneLayout} />
          : view === 'bands' ? <BandView session={session} styles={styles} onSelectShow={openBandShow} refreshData={refreshData} phoneLayout={phoneLayout} />
          : selectedItem ? <MainEditor key={selectedItem.data.id} item={selectedItem} songs={songs} bands={bands} triggerDL={triggerDL} onClose={()=>setSelectedItem(null)} onShow={()=>setShowMode(true)} refresh={refreshData} styles={styles} session={session} phoneLayout={phoneLayout} />
          : <div style={styles.empty}>
              <Music size={120} color="#111" />
              <h1 style={{fontSize:'40px', fontWeight:'900', color:'#111', margin:0}}>SHOWPAD PRO</h1>
              <p style={{color:'#333', fontWeight:'bold'}}>Selecione para editar.</p>
            </div>}
        </div>
      </div>

      {showMode && (
        <ShowModeView
          item={selectedItem}
          fontSize={fontSize}
          setFontSize={setFontSize}
          scrollPage={scrollPage}
          onClose={() => setShowMode(false)}
          showScrollRef={showScrollRef}
          lastSignal={lastSignalUI}
          styles={styles}
          midiStatus={midiStatus}
          stageControls={stageControls}
          onStageCommand={handleStageCommandEvent}
          onToggleStageCamera={handleToggleStageCamera}
          learningAction={learningGestureAction}
          onLearnGestureSample={handleLearnGestureSample}
        />
      )}
      {showSettings && (
        <SettingsView
          onClose={() => setShowSettings(false)}
          inputs={allInputs}
          setMidiLearning={setMidiLearning}
          midiLearning={midiLearning}
          midiStatus={midiStatus}
          handleImport={handleImport}
          styles={styles}
          stageControls={stageControls}
          onStageControlsChange={updateStageControls}
          onApplyGesturePreset={handleApplyGesturePreset}
          onStartGestureLearning={handleStartGestureLearning}
          onCancelGestureLearning={handleCancelGestureLearning}
          onStageCommandTest={handleStageCommandEvent}
          lastStageCommand={lastStageCommand}
          learningAction={learningGestureAction}
        />
      )}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showProfileEdit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <button
            type="button"
            aria-label="Fechar edição de perfil"
            onClick={() => setShowProfileEdit(false)}
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'default' }}
          />
          <div style={{ width: '100%', maxWidth: 620, position: 'relative', zIndex: 1 }}>
            <button
              type="button"
              onClick={() => setShowProfileEdit(false)}
              style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', color: '#888', cursor: 'pointer', zIndex: 2 }}
              title="Fechar"
            >
              <X size={20} />
            </button>
            <ProfileOnboardingView
              styles={styles}
              email={session?.user?.email}
              authMeta={session?.user?.user_metadata || {}}
              initialValues={profileRecord}
              onSubmit={handleSaveProfileEdit}
              isEditMode
              onCancel={() => setShowProfileEdit(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}