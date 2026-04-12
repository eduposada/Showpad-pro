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
    if (!supabase) return;
    const { data: remoteSongs } = await supabase.from('band_repertoire').select('*').eq('band_id', bandId);
    if (remoteSongs) {
        for (let rs of remoteSongs) {
            const ex = await db.songs.where({title: rs.title, artist: rs.artist}).first();
            const songData = { title: rs.title, artist: rs.artist, content: rs.content, bpm: rs.bpm, creator_id: rs.last_updated_by };
            let sId;
            if (!ex) sId = await db.songs.add(songData);
            else { sId = ex.id; await db.songs.update(ex.id, songData); }
            await db.band_songs.put({ band_id: bandId, song_id: sId, custom_tone: 0 });
        }
    }
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
        const payload = { ...rest, creator_id: userId };
        const key = `${payload.title}\0${payload.creator_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(payload);
    }
    return out;
}

function dedupeBandsForCloudUpsert(rows, userId) {
    const seen = new Set();
    const out = [];
    for (const band of rows) {
        const payload = { ...band, creator_id: userId };
        if (!payload.id || seen.has(payload.id)) continue;
        seen.add(payload.id);
        out.push(payload);
    }
    return out;
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
    // 3. Bandas
    const b = await db.my_bands.toArray();
    if (b.length > 0) {
        const cleanB = dedupeBandsForCloudUpsert(b, userId);
        const r = await supabase.from('my_bands').upsert(cleanB, { onConflict: 'id' });
        throwIfSupabaseError(r.error, 'Envio de bandas');
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
    // 2. Setlists
    const { data: sl, error: eSl } = await supabase.from('setlists').select('*').eq('creator_id', userId);
    throwIfSupabaseError(eSl, 'Download de shows');
    if (sl) {
        for (const item of sl) {
            const ex = await db.setlists.where({ title: item.title }).first();
            if (!ex) {
                const { id, ...dataWithoutId } = item;
                await db.setlists.add(dataWithoutId);
            }
        }
    }
    // 3. Bandas
    const { data: b, error: eBands } = await supabase.from('my_bands').select('*').eq('creator_id', userId);
    throwIfSupabaseError(eBands, 'Download de bandas');
    if (b) {
        for (const item of b) {
            if (item.is_solo) {
                const hasSolo = await db.my_bands.where('is_solo').equals(1).first();
                if (hasSolo) {
                    if (hasSolo.id !== item.id) {
                        await db.my_bands.delete(hasSolo.id);
                        await db.my_bands.put(item);
                    }
                    continue;
                }
            }
            await db.my_bands.put(item);
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