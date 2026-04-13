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

export const runFullBackup = async () => {
    try {
        const songs = await db.songs.toArray();
        const setlists = await db.setlists.toArray();
        const my_bands = await db.my_bands.toArray();
        const backup = { type: "FULL_BACKUP", version: "8.1.1", date: new Date().toISOString(), songs, setlists, my_bands };
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
        const { id, ...rest } = row;
        // Shows com band_id pertencem ao dono da banda na nuvem — membros puxam por `band_id`, não por `creator_id` do admin.
        const creatorForCloud = rest.band_id ? (rest.creator_id || userId) : userId;
        const payload = { ...rest, creator_id: creatorForCloud };
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
    // 1. Músicas
    const s = await db.songs.toArray();
    if (s.length > 0) {
        const cleanSongs = dedupeSongsForCloudUpsert(s, userId);
        const r = await supabase.from('songs').upsert(cleanSongs, { onConflict: 'title,artist,creator_id' });
        throwIfSupabaseError(r.error, 'Envio de músicas');
    }
    // 2. Setlists
    const sl = await db.setlists.toArray();
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
        } else if (bandShows?.length) {
            for (const item of bandShows) {
                const rest = { ...item };
                delete rest.id;
                const bid = rest.band_id;
                const ttl = rest.title;
                if (!bid || !ttl) continue;
                const ex = await db.setlists.where('band_id').equals(bid).filter((row) => row.title === ttl).first();
                if (!ex) {
                    await db.setlists.add({ ...rest });
                    continue;
                }
                const remoteTs = rest.updated_at ? new Date(rest.updated_at).getTime() : 0;
                const localTs = ex.updated_at ? new Date(ex.updated_at).getTime() : 0;
                const remoteSongs = JSON.stringify(rest.songs ?? null);
                const localSongs = JSON.stringify(ex.songs ?? null);
                if (remoteTs > localTs || remoteSongs !== localSongs) {
                    await db.setlists.update(ex.id, {
                        location: rest.location,
                        time: rest.time,
                        members: rest.members,
                        notes: rest.notes,
                        songs: rest.songs,
                        band_id: rest.band_id,
                        creator_id: rest.creator_id,
                        ...(rest.updated_at ? { updated_at: rest.updated_at } : {}),
                    });
                }
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