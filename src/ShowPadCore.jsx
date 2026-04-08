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

// LÓGICA MUSICAL
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

// 🚀 v7.1.5: FUNÇÃO DE BROADCAST (ADMIN ENVIANDO)
export const broadcastBandChanges = async (bandId, userId) => {
    if (!supabase) return;
    
    // 1. Pegar músicas da banda no Dexie
    const relations = await db.band_songs.where('band_id').equals(bandId).toArray();
    const songIds = relations.map(r => r.song_id);
    const songs = await db.songs.where('id').anyOf(songIds).toArray();

    // 2. Upload do Repertório Mestre
    if (songs.length > 0) {
        const payload = songs.map(s => ({
            band_id: bandId,
            title: s.title,
            artist: s.artist,
            content: s.content,
            bpm: s.bpm || 120,
            last_updated_by: userId
        }));
        await supabase.from('band_repertoire').upsert(payload, { onConflict: 'band_id,title,artist' });
    }

    // 3. Upload dos Shows da Banda
    const shows = await db.setlists.where('band_id').equals(bandId).toArray();
    if (shows.length > 0) {
        const showsPayload = shows.map(sh => ({
            title: sh.title,
            location: sh.location,
            time: sh.time,
            members: sh.members,
            notes: sh.notes,
            creator_id: userId,
            songs: sh.songs,
            band_id: bandId
        }));
        await supabase.from('setlists').upsert(showsPayload, { onConflict: 'title,band_id' });
    }

    // 4. Disparar sinal de fumaça
    await supabase.from('band_broadcasts').insert([{ band_id: bandId, sender_id: userId }]);
};

// 🚀 v7.1.5: FUNÇÃO DE CAPTURA (MEMBRO RECEBENDO)
export const pullBandChanges = async (bandId) => {
    if (!supabase) return;

    // 1. Baixar músicas do repertório da banda
    const { data: remoteSongs } = await supabase.from('band_repertoire').select('*').eq('band_id', bandId);
    if (remoteSongs) {
        for (let rs of remoteSongs) {
            const ex = await db.songs.where({title: rs.title, artist: rs.artist}).first();
            const songData = { title: rs.title, artist: rs.artist, content: rs.content, bpm: rs.bpm, creator_id: rs.last_updated_by };
            let sId;
            if (!ex) sId = await db.songs.add(songData);
            else { sId = ex.id; await db.songs.update(ex.id, songData); }
            
            // Garantir relação local
            await db.band_songs.put({ band_id: bandId, song_id: sId, custom_tone: 0 });
        }
    }

    // 2. Baixar shows da banda
    const { data: remoteShows } = await supabase.from('setlists').select('*').eq('band_id', bandId);
    if (remoteShows) {
        for (let rs of remoteShows) {
            const ex = await db.setlists.where({title: rs.title, band_id: bandId}).first();
            const showData = { ...rs, id: undefined };
            if (!ex) await db.setlists.add(showData);
            else await db.setlists.update(ex.id, showData);
        }
    }
};

export const triggerDL = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'Backup.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
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

export const pushToCloud = async (userId) => {
    if (!supabase) return;
    const s = await db.songs.toArray();
    if (s.length > 0) await supabase.from('songs').upsert(s.map(x => ({...x, id: undefined, creator_id: userId})), { onConflict: 'title,artist,creator_id' });
    const sl = await db.setlists.toArray();
    if (sl.length > 0) await supabase.from('setlists').upsert(sl.map(x => ({...x, id: undefined, creator_id: userId})), { onConflict: 'title,creator_id' });
};

export const pullFromCloud = async (userId) => {
    if (!supabase) return;
    const { data: s } = await supabase.from('songs').select('*').eq('creator_id', userId);
    if (s) for (let x of s) { const ex = await db.songs.where({title: x.title, artist: x.artist}).first(); if (!ex) await db.songs.add({...x, id: undefined}); }
    const { data: sl } = await supabase.from('setlists').select('*').eq('creator_id', userId);
    if (sl) for (let x of sl) { const ex = await db.setlists.where({title: x.title}).first(); if (!ex) await db.setlists.add({...x, id: undefined}); }
};