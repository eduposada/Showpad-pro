import React from 'react';
import Dexie from 'dexie';
import { createClient } from '@supabase/supabase-js';

// Configuração Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// BANCO DE DADOS LOCAL (DEXIE)
export const db = new Dexie('ShowPadProWeb');
db.version(13).stores({ 
    songs: '++id, title, artist, creator_id', 
    setlists: '++id, title, location, time, members, notes, creator_id, band_id',
    my_bands: 'id, name, invite_code, role, is_solo',
    band_songs: '++id, [band_id+song_id], band_id, song_id, custom_tone' 
});

// LÓGICA MUSICAL (TRANSPOSIÇÃO) - CORREÇÃO v7.0 (Suporte a Baixos Invertidos)
export const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// Regex aprimorado para capturar o acorde e o baixo após a barra separadamente
export const chordRegex = /([A-G][#b]?(?:m|maj|dim|sus|aug|add|alt|[0-9])*(?:\/[A-G][#b]?)?)/g;

export const shiftNote = (chord, semitones) => {
    const flatsToSharps = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };

    // Função interna para transpor uma única nota (ex: C# ou F)
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

    // Se o acorde tiver uma barra (baixo invertido), dividimos e transpomos ambos
    if (chord.includes('/')) {
        const [upper, lower] = chord.split('/');
        return transposeSingle(upper) + '/' + transposeSingle(lower);
    }

    return transposeSingle(chord);
};

export const transposeContent = (content, semitones) => {
    if (!content || semitones === 0) return content;
    return content.split('\n').map(line => {
        // Se a linha contém a palavra "Tom", transpõe as notas nela
        if (line.toLowerCase().indexOf("tom") !== -1) {
            return line.replace(/([A-G][#b]?)/g, (m) => shiftNote(m, semitones));
        }
        // Se a linha for identificada como uma linha de cifras
        const chords = line.match(chordRegex);
        if (chords && chords.length > 0 && chords.length >= line.trim().split(/\s+/).length * 0.4) {
            return line.replace(chordRegex, (match) => shiftNote(match, semitones));
        }
        return line;
    }).join('\n');
};

// FORMATAÇÃO VISUAL
export const formatChordsVisual = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const m = line.match(chordRegex);
        const isC = m && m.length > 0 && m.length >= line.trim().split(/\s+/).length * 0.4;
        return (
            <div key={i} style={{ 
                color: isC ? '#FFD700' : '#FFFFFF', 
                fontWeight: isC ? 'bold' : 'normal', 
                minHeight: '1.2em', 
                whiteSpace: 'pre-wrap', 
                textAlign: 'left', 
                lineHeight: '1.8' 
            }}>
                {line || ' '}
            </div>
        );
    });
};

export const triggerDL = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'ShowPad_Full_Backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// FUNÇÃO DE EXCLUSÃO COMPLETA DE BANDA (CASCATA)
export const deleteBandComplete = async (bandId) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { error } = await supabase.from('bands').delete().eq('id', bandId);
    if (error) throw error;
    await db.transaction('rw', db.my_bands, db.band_songs, db.setlists, async () => {
        await db.my_bands.delete(bandId);
        await db.band_songs.where('band_id').equals(bandId).delete();
        await db.setlists.where('band_id').equals(bandId).delete();
    });
    return { success: true };
};

// SINCRONIA: PUSH
export const pushToCloud = async (userId) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const localSongs = await db.songs.toArray();
    if (localSongs.length > 0) {
        const songsPayload = localSongs.map(s => ({ 
            title: String(s.title || ""), 
            artist: String(s.artist || ""), 
            content: String(s.content || ""), 
            notes: String(s.notes || ""),
            bpm: Math.round(Number(s.bpm || 120)),
            creator_id: userId
        }));
        await supabase.from('songs').upsert(songsPayload, { onConflict: 'title,artist,creator_id' });
    }
    const localSetlists = await db.setlists.toArray();
    if (localSetlists.length > 0) {
        const setlistsPayload = localSetlists.map(sl => ({
            title: String(sl.title || "Sem Nome"),
            location: String(sl.location || ""),
            time: String(sl.time || ""),
            members: String(sl.members || ""),
            notes: String(sl.notes || ""),
            creator_id: userId,
            songs: Array.isArray(sl.songs) ? sl.songs : [], 
            band_id: sl.band_id || null
        }));
        await supabase.from('setlists').upsert(setlistsPayload, { onConflict: 'title,creator_id' });
    }
    const localRel = await db.band_songs.toArray();
    if (localRel.length > 0) {
        await supabase.from('band_songs').upsert(localRel.map(r => ({...r, id: undefined})));
    }
    return { success: true };
};

// SINCRONIA: PULL
export const pullFromCloud = async (userId) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { data: cSongs } = await supabase.from('songs').select('*').eq('creator_id', userId);
    if (cSongs) {
        for (let s of cSongs) {
            const ex = await db.songs.where({title: s.title, artist: s.artist}).first();
            const { id, ...cleanSong } = s; 
            if (!ex) await db.songs.add(cleanSong);
            else await db.songs.update(ex.id, cleanSong);
        }
    }
    const { data: cSetlists } = await supabase.from('setlists').select('*').eq('creator_id', userId);
    if (cSetlists) {
        for (let sl of cSetlists) {
            const ex = await db.setlists.where({title: sl.title}).first();
            const { id, ...cleanSetlist } = sl; 
            if (!ex) await db.setlists.add(cleanSetlist);
            else await db.setlists.update(ex.id, cleanSetlist);
        }
    }
    const { data: cRel } = await supabase.from('band_songs').select('*');
    if (cRel) {
        for (let rel of cRel) {
            await db.band_songs.put(rel);
        }
    }
    return { success: true };
};