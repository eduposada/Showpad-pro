import React from 'react';
import Dexie from 'dexie';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const db = new Dexie('ShowPadProWeb');
db.version(14).stores({ 
    songs: '++id, title, artist, creator_id', 
    setlists: '++id, title, location, time, members, notes, creator_id, band_id',
    my_bands: 'id, name, invite_code, role, is_solo',
    band_songs: '++id, [band_id+song_id], band_id, song_id, custom_tone' 
});

/** `sessionStorage`: último utilizador que usou o Dexie nesta origem (evita misturar contas no mesmo navegador). */
export const SHOWPAD_LAST_UID_KEY = 'showpad_last_signed_in_uid';

/** O IndexedDB `ShowPadProWeb` é um só por origem — ao mudar de conta, limpar para não ver biblioteca do utilizador anterior. */
export async function clearAllLocalDexieStores() {
    await db.transaction('rw', db.songs, db.setlists, db.my_bands, db.band_songs, async () => {
        await db.songs.clear();
        await db.setlists.clear();
        await db.my_bands.clear();
        await db.band_songs.clear();
    });
}

/** Músicas locais só do `creator_id` atual (Dexie partilhado no mesmo browser). */
export function filterDexieSongsForCreator(songs, userId) {
    const u = String(userId);
    return (songs || []).filter((x) => x != null && String(x.creator_id) === u);
}

/** Shows locais: pessoais do utilizador ou de bandas presentes em `my_bands` filtrado. */
export function filterDexieSetlistsForSession(setlists, userId, bandIdsSet) {
    const u = String(userId);
    const bands = bandIdsSet instanceof Set ? bandIdsSet : new Set(bandIdsSet || []);
    return (setlists || []).filter((row) => {
        if (!row) return false;
        if (String(row.creator_id) === u) return true;
        if (row.band_id && bands.has(row.band_id)) return true;
        return false;
    });
}

export const runFullBackup = async () => {
    try {
        const songs = await db.songs.toArray();
        const setlists = await db.setlists.toArray();
        const my_bands = await db.my_bands.toArray();
        const backup = { type: "FULL_BACKUP", version: "8.8.0", date: new Date().toISOString(), songs, setlists, my_bands };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `SHOWPAD_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert("Erro no backup: " + e.message); }
};

export const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const chordRegex = /([A-G][#b]?(?:m|maj|dim|sus|aug|add|alt|[0-9])*(?:\/[A-G][#b]?)?)/g;

export const shiftNote = (chord, semitones) => {
    const flatsToSharps = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
    const transposeSingle = (n) => {
        const rootMatch = n.match(/^[A-G][#b]?/);
        if (!rootMatch) return n;
        const root = rootMatch[0];
        const suffix = n.substring(root.length);
        const normalized = flatsToSharps[root] || root;
        let idx = scale.indexOf(normalized.toUpperCase());
        if (idx === -1) return n;
        let newIdx = (idx + semitones) % 12;
        if (newIdx < 0) newIdx += 12;
        return scale[newIdx] + suffix;
    };
    if (chord.includes('/')) {
        const [upper, lower] = chord.split('/');
        return transposeSingle(upper) + '/' + transposeSingle(lower);
    }
    return transposeSingle(chord);
};

export const transposeContent = (content, semitones) => {
    if (!content || semitones === 0) return content;
    return content.split('\n').map(line => {
        if (line.toLowerCase().indexOf("tom") !== -1) return line.replace(/([A-G][#b]?)/g, (m) => shiftNote(m, semitones));
        const chords = line.match(chordRegex);
        if (chords && chords.length > 0 && chords.length >= line.trim().split(/\s+/).length * 0.4) {
            return line.replace(chordRegex, (match) => shiftNote(match, semitones));
        }
        return line;
    }).join('\n');
};

export const formatChordsVisual = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const m = line.match(chordRegex);
        const isC = m && m.length > 0 && m.length >= line.trim().split(/\s+/).length * 0.4;
        return <div key={i} style={{ color: isC ? '#FFD700' : '#FFFFFF', fontWeight: isC ? 'bold' : 'normal', minHeight: '1.2em', whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.8' }}>{line || ' '}</div>;
    });
};

export const broadcastBandChanges = async (bandId, userId) => {
    if (!supabase) return;
    const relations = await db.band_songs.where('band_id').equals(bandId).toArray();
    const songIds = relations.map(r => r.song_id);
    const songs = await db.songs.where('id').anyOf(songIds).toArray();
    if (songs.length > 0) {
        const payload = songs.map(s => ({ band_id: bandId, title: s.title, artist: s.artist, content: s.content, bpm: s.bpm || 120, last_updated_by: userId }));
        await supabase.from('band_repertoire').upsert(payload, { onConflict: 'band_id,title,artist' });
    }
    await supabase.from('band_broadcasts').insert([{ band_id: bandId, sender_id: userId }]);
};

export const pullBandChanges = async (bandId) => {
    if (!supabase) return [];
    // Fase D: não fundir nem sobrescrever a biblioteca pessoal (db.songs).
    // A visão do repertório da banda lê direto de band_repertoire.
    const { data, error } = await supabase
        .from('band_repertoire')
        .select('title, artist, content, bpm, last_updated_by, updated_at')
        .eq('band_id', bandId)
        .order('title', { ascending: true });
    if (error) throw new Error(error.message || 'Erro ao puxar repertório da banda.');
    return data || [];
};

function repertoireMapKey(title, artist) {
    return `${String(title ?? '').trim()}::${String(artist ?? '').trim()}`;
}

/** `setlists.songs` no Postgres (jsonb) por vezes chega como string JSON; garante sempre array. */
function normalizeSetlistSongsFromApi(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            const p = JSON.parse(raw);
            return Array.isArray(p) ? p : [];
        } catch {
            return [];
        }
    }
    return [];
}

/** Na resposta do Supabase, mais do que uma linha por banda+título → ficar com a mais recente (`updated_at`). */
function dedupeCloudBandSetlistsByTitle(rows) {
    const list = [...(rows || [])].filter((r) => r && r.band_id && r.title);
    list.sort((a, b) => {
        const ta = new Date(a.updated_at || 0).getTime();
        const tb = new Date(b.updated_at || 0).getTime();
        return tb - ta;
    });
    const seen = new Set();
    const out = [];
    for (const r of list) {
        const k = `${r.band_id}::${r.title}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(r);
    }
    return out;
}

/** Várias cópias locais do mesmo show (mesma banda + título): manter só o registo com maior `id` Dexie. */
async function mergeDexieDuplicateBandSetlists(bandId) {
    const locals = await db.setlists.where('band_id').equals(bandId).toArray();
    const byTitle = new Map();
    for (const loc of locals) {
        const ttl = loc.title;
        if (!ttl) continue;
        const arr = byTitle.get(ttl) || [];
        arr.push(loc);
        byTitle.set(ttl, arr);
    }
    for (const arr of byTitle.values()) {
        if (arr.length < 2) continue;
        arr.sort((a, b) => {
            const ar = a.revoked_by_admin ? 1 : 0;
            const br = b.revoked_by_admin ? 1 : 0;
            if (ar !== br) return ar - br;
            return (Number(a.id) || 0) - (Number(b.id) || 0);
        });
        const keep = arr[arr.length - 1];
        for (let i = 0; i < arr.length - 1; i += 1) {
            if (arr[i].id !== keep.id) await db.setlists.delete(arr[i].id);
        }
    }
}

/** Remove na nuvem todas as linhas de setlist dessa banda com o mesmo título (admin). */
export async function deleteBandSetlistFromCloud(bandId, title) {
    if (!supabase || !bandId || !title) return { error: new Error('Parâmetros em falta.') };
    return supabase.from('setlists').delete().eq('band_id', bandId).eq('title', title);
}

/**
 * Preenche `content` (e `bpm` se faltar) em `setlist.songs` via `band_repertoire`
 * quando a setlist tem `band_id` e algum item veio só com título/referência — típico após SYNC para outro membro.
 */
export async function hydrateBandSetlistSongsFromRepertoire(setlist) {
    if (!supabase || !setlist?.band_id) return setlist;
    const songsNorm = normalizeSetlistSongsFromApi(setlist.songs);
    const base = { ...setlist, songs: songsNorm };
    if (songsNorm.length === 0) return base;
    const needsHydration = songsNorm.some((s) => {
        if (!s || typeof s !== 'object') return false;
        const c = s.content;
        return c == null || String(c).trim() === '';
    });
    if (!needsHydration) return base;

    const { data, error } = await supabase
        .from('band_repertoire')
        .select('title, artist, content, bpm')
        .eq('band_id', setlist.band_id);
    if (error || !data?.length) return base;

    const repMap = new Map(data.map((r) => [repertoireMapKey(r.title, r.artist), r]));

    const songs = songsNorm.map((s) => {
        if (!s || typeof s !== 'object') return s;
        if (s.content != null && String(s.content).trim() !== '') return s;
        const r = repMap.get(repertoireMapKey(s.title, s.artist));
        if (!r) return s;
        return {
            ...s,
            title: s.title ?? r.title,
            artist: s.artist ?? r.artist,
            content: r.content ?? '',
            bpm: s.bpm ?? r.bpm ?? 120,
        };
    });
    return { ...base, songs };
}

export const deleteBandComplete = async (bandId) => {
    if (!supabase) return;
    await supabase.from('bands').delete().eq('id', bandId);
    await db.transaction('rw', db.my_bands, db.band_songs, db.setlists, async () => {
        await db.my_bands.delete(bandId);
        await db.band_songs.where('band_id').equals(bandId).delete();
        await db.setlists.where('band_id').equals(bandId).delete();
    });
};

function throwIfSupabaseError(error, etapa) {
    if (error) {
        const msg = error.message || String(error);
        throw new Error(`${etapa}: ${msg}`);
    }
}

/**
 * Um único UPSERT no Postgres não pode incluir duas linhas que colidem na mesma chave
 * (erro: "ON CONFLICT DO UPDATE command cannot affect row a second time").
 * No Dexie podem existir duas músicas com o mesmo título/artista; mantemos a de maior id (mais recente).
 */
function dedupeSongsForCloudUpsert(rows, userId) {
    const sorted = [...rows].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    const seen = new Set();
    const out = [];
    for (const row of sorted) {
        const { id, ...rest } = row;
        const payload = { ...rest, creator_id: userId };
        const key = `${payload.title}\0${payload.artist}\0${payload.creator_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(payload);
    }
    return out;
}

function dedupeSetlistsForCloudUpsert(rows, userId) {
    const sorted = [...rows].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    const seen = new Set();
    const out = [];
    for (const row of sorted) {
        const { id, revoked_by_admin, from_band_sync, ...rest } = row;
        // RLS típico em `setlists`: só permite escrever linhas com creator_id = auth.uid().
        // Membros continuam a receber shows da banda pelo pull em `band_id` (não depende deste campo na leitura).
        const payload = { ...rest, creator_id: userId };
        const key = `${payload.title}\0${payload.creator_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(payload);
    }
    return out;
}

/** Uma linha por id de banda (evita upsert inválido no Postgres). */
function dedupeBandsById(rows) {
    const seen = new Set();
    const out = [];
    for (const band of rows) {
        if (!band?.id || seen.has(band.id)) continue;
        seen.add(band.id);
        out.push(band);
    }
    return out;
}

/** Código de convite único globalmente para banda solo (Postgres: UNIQUE em invite_code). */
export function soloInviteCodeForBandId(bandId) {
    return `SOLO_${String(bandId).replace(/-/g, '')}`;
}

/**
 * Banda solo partilhava `SOLO_V3` entre todos os utilizadores → violação de bands_invite_code_key.
 * Qualquer solo passa a usar SOLO_<id da banda sem hífens>, único por linha.
 */
function normalizeInviteCodeForSupabase(band) {
    const code = (band.invite_code || '').trim();
    if (band.is_solo || (code && code.toUpperCase().startsWith('SOLO'))) {
        return soloInviteCodeForBandId(band.id);
    }
    return code;
}

/** Colunas da tabela Supabase `bands` (Dexie guarda também role/is_solo só para UI). */
function bandRowsForSupabase(band) {
    return {
        id: band.id,
        name: band.name,
        invite_code: normalizeInviteCodeForSupabase(band),
        owner_id: band.owner_id,
        description: band.description ?? null,
        logo_url: band.logo_url ?? null,
        created_at: band.created_at || new Date().toISOString(),
    };
}

export const pushToCloud = async (userId) => {
    if (!supabase) {
        throw new Error('Supabase não configurado (variáveis de ambiente).');
    }
    // 1. Músicas — só as do utilizador atual (Dexie pode conter dados de outra sessão até à troca de conta).
    const s = filterDexieSongsForCreator(await db.songs.toArray(), userId);
    if (s.length > 0) {
        const cleanSongs = dedupeSongsForCloudUpsert(s, userId);
        const r = await supabase.from('songs').upsert(cleanSongs, { onConflict: 'title,artist,creator_id' });
        throwIfSupabaseError(r.error, 'Envio de músicas');
    }
    // 2. Setlists — só do utilizador atual (+ shows de banda conhecidas em `my_bands` local).
    const allBandsPush = await db.my_bands.toArray();
    const bandIdsPush = new Set(
        allBandsPush.filter((b) => b && (b.owner_id === userId || b.role)).map((b) => b.id)
    );
    let sl = filterDexieSetlistsForSession(await db.setlists.toArray(), userId, bandIdsPush);
    const slPushable = sl.filter((r) => !r.revoked_by_admin);
    for (const row of slPushable) {
        if (!row.band_id) continue;
        const h = await hydrateBandSetlistSongsFromRepertoire(row);
        if (JSON.stringify(row.songs ?? []) !== JSON.stringify(h.songs ?? [])) {
            await db.setlists.update(row.id, { songs: h.songs });
        }
    }
    sl = filterDexieSetlistsForSession(
        (await db.setlists.toArray()).filter((r) => !r.revoked_by_admin),
        userId,
        bandIdsPush
    );
    if (sl.length > 0) {
        const cleanSl = dedupeSetlistsForCloudUpsert(sl, userId);
        const r = await supabase.from('setlists').upsert(cleanSl, { onConflict: 'title,creator_id' });
        throwIfSupabaseError(r.error, 'Envio de shows');
    }
    // 3. Bandas — no Postgres não existe `my_bands`; bandas reais estão em `bands` + `band_members`.
    const allBands = await db.my_bands.toArray();
    const ownedBands = dedupeBandsById(allBands.filter((row) => row.owner_id === userId));
    if (ownedBands.length > 0) {
        const bandRows = ownedBands.map(bandRowsForSupabase);
        const r = await supabase.from('bands').upsert(bandRows, { onConflict: 'id' });
        throwIfSupabaseError(r.error, 'Envio de bandas');
        const memberRows = ownedBands.map((band) => ({
            band_id: band.id,
            profile_id: userId,
            role: band.role || 'admin',
        }));
        const rM = await supabase.from('band_members').upsert(memberRows, { onConflict: 'band_id,profile_id' });
        throwIfSupabaseError(rM.error, 'Envio de vínculos banda/membro');
        for (const band of ownedBands) {
            const normalized = normalizeInviteCodeForSupabase(band);
            if (normalized !== band.invite_code) {
                await db.my_bands.update(band.id, { invite_code: normalized });
            }
        }
    }
    console.log('✅ Sync Out Ok');
};

export const pullFromCloud = async (userId) => {
    if (!supabase) {
        throw new Error('Supabase não configurado (variáveis de ambiente).');
    }
    // 1. Músicas
    const { data: s, error: eSongs } = await supabase.from('songs').select('*').eq('creator_id', userId);
    throwIfSupabaseError(eSongs, 'Download de músicas');
    if (s) {
        for (const item of s) {
            const ex = await db.songs.where({ title: item.title, artist: item.artist }).first();
            if (!ex) {
                const { id, ...dataWithoutId } = item;
                await db.songs.add(dataWithoutId);
            }
        }
    }
    // 2. Setlists pessoais (sem banda) — evita colidir com show de banda com o mesmo título
    const { data: sl, error: eSl } = await supabase.from('setlists').select('*').eq('creator_id', userId);
    throwIfSupabaseError(eSl, 'Download de shows');
    if (sl) {
        for (const item of sl) {
            if (item.band_id) continue;
            const ex = await db.setlists.filter((row) => row.title === item.title && !row.band_id).first();
            if (!ex) {
                const { id, ...dataWithoutId } = item;
                await db.setlists.add(dataWithoutId);
            }
        }
    }
    // 3. Bandas — mesmo critério que BandView.fetchBands (band_members + bands)
    const { data: bandJoin, error: eBands } = await supabase
        .from('band_members')
        .select('role, bands (*)')
        .eq('profile_id', userId);
    throwIfSupabaseError(eBands, 'Download de bandas');
    let cloudList = [];
    if (bandJoin?.length) {
        cloudList = bandJoin.filter((i) => i.bands).map((i) => {
            const br = i.bands;
            const code = (br.invite_code || '').toUpperCase();
            return {
                ...br,
                role: i.role,
                is_solo: code.startsWith('SOLO'),
            };
        });
        for (const item of cloudList) {
            if (item.is_solo) {
                const localSolos = await db.my_bands.filter((b) => b.is_solo === true).toArray();
                for (const s of localSolos) {
                    if (s.id !== item.id) await db.my_bands.delete(s.id);
                }
            }
            await db.my_bands.put(item);
        }
    }
    // 4. Shows vinculados às bandas (admin/owner na nuvem; membros recebem por band_id — exige RLS SELECT por membro)
    const nonSoloBandIds = cloudList.filter((b) => !b.is_solo).map((b) => b.id);
    if (nonSoloBandIds.length > 0) {
        const { data: bandShows, error: eBandShows } = await supabase
            .from('setlists')
            .select('*')
            .in('band_id', nonSoloBandIds);
        if (eBandShows) {
            console.warn('Download de shows da banda:', eBandShows.message || eBandShows);
        } else {
            const bandShowsSafe = dedupeCloudBandSetlistsByTitle(bandShows || []);
            for (const item of bandShowsSafe) {
                const rest = { ...item };
                delete rest.id;
                rest.songs = normalizeSetlistSongsFromApi(rest.songs);
                const bid = rest.band_id;
                const ttl = rest.title;
                if (!bid || !ttl) continue;
                const hydrated = await hydrateBandSetlistSongsFromRepertoire(rest);
                const ex = await db.setlists.where('band_id').equals(bid).filter((row) => row.title === ttl).first();
                if (!ex) {
                    await db.setlists.add({
                        ...hydrated,
                        revoked_by_admin: false,
                        from_band_sync: true,
                    });
                    continue;
                }
                const remoteTs = hydrated.updated_at ? new Date(hydrated.updated_at).getTime() : 0;
                const localTs = ex.updated_at ? new Date(ex.updated_at).getTime() : 0;
                const remoteSongs = JSON.stringify(hydrated.songs ?? null);
                const localSongsNorm = normalizeSetlistSongsFromApi(ex.songs);
                const localSongs = JSON.stringify(localSongsNorm);
                const remoteLen = Array.isArray(hydrated.songs) ? hydrated.songs.length : 0;
                const localLen = localSongsNorm.length;
                // Nuvem com mais faixas que o Dexie local: puxar sempre (ex.: membro tinha cópia vazia antiga).
                const shouldMerge = remoteTs > localTs || remoteSongs !== localSongs || remoteLen > localLen;
                if (shouldMerge) {
                    await db.setlists.update(ex.id, {
                        location: hydrated.location,
                        time: hydrated.time,
                        members: hydrated.members,
                        notes: hydrated.notes,
                        songs: hydrated.songs,
                        band_id: hydrated.band_id,
                        creator_id: hydrated.creator_id,
                        revoked_by_admin: false,
                        from_band_sync: true,
                        ...(hydrated.updated_at ? { updated_at: hydrated.updated_at } : {}),
                    });
                }
            }
            // Títulos na nuvem (pode ser lista vazia): marcar cópias locais sincronizadas que já não existem na nuvem
            for (const bid of nonSoloBandIds) {
                const cloudTitles = new Set(bandShowsSafe.filter((s) => s.band_id === bid).map((s) => s.title));
                const locals = await db.setlists.where('band_id').equals(bid).toArray();
                for (const loc of locals) {
                    if (!loc.from_band_sync) continue;
                    if (!cloudTitles.has(loc.title)) {
                        if (!loc.revoked_by_admin) {
                            await db.setlists.update(loc.id, { revoked_by_admin: true });
                        }
                    } else if (loc.revoked_by_admin) {
                        await db.setlists.update(loc.id, { revoked_by_admin: false });
                    }
                }
                await mergeDexieDuplicateBandSetlists(bid);
            }
        }
    }
    console.log('✅ Sync In Ok');
};

export const triggerDL = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'Backup.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};