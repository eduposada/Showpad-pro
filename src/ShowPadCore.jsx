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

// --- SISTEMA DE EXPORTAÇÃO E BACKUP (v7.2) ---
export const triggerDL = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'Backup.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

export const runFullBackup = async () => {
    const songs = await db.songs.toArray();
    const setlists = await db.setlists.toArray();
    const my_bands = await db.my_bands.toArray();
    const backup = { 
        type: "FULL_BACKUP", 
        version: "7.2", 
        date: new Date().toISOString(),
        songs, setlists, my_bands 
    };
    triggerDL(backup, `SHOWPAD_FULL_BACKUP_${new Date().toLocaleDateString()}.json`);
};

// --- LÓGICA DE TRANSPOSIÇÃO ---
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

// --- SYNC E CLOUD ---
export const pushToCloud = async (userId) => {
    if (!supabase) return;
    const s = await db.songs.toArray();
    // Limpeza de IDs locais para evitar conflito no Upsert do Supabase
    if (s.length > 0) {
        const cleanSongs = s.map(({id, ...rest}) => ({...rest, creator_id: userId}));
        await supabase.from('songs').upsert(cleanSongs, { onConflict: 'title,artist,creator_id' });
    }
    const sl = await db.setlists.toArray();
    if (sl.length > 0) {
        const cleanSl = sl.map(({id, ...rest}) => ({...rest, creator_id: userId}));
        await supabase.from('setlists').upsert(cleanSl, { onConflict: 'title,creator_id' });
    }
};

export const pullFromCloud = async (userId) => {
    if (!supabase) return;
    const { data: s } = await supabase.from('songs').select('*').eq('creator_id', userId);
    if (s) for (let x of s) { 
        const ex = await db.songs.where({title: x.title, artist: x.artist}).first(); 
        if (!ex) await db.songs.add({...x, id: undefined}); 
    }
    const { data: sl } = await supabase.from('setlists').select('*').eq('creator_id', userId);
    if (sl) for (let x of sl) { 
        const ex = await db.setlists.where({title: x.title}).first(); 
        if (!ex) await db.setlists.add({...x, id: undefined}); 
    }
};