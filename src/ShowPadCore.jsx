import React from 'react';
import Dexie from 'dexie';
import { createClient } from '@supabase/supabase-js';

// No iPad Mini 2, o processamento de variáveis de ambiente do Vite pode falhar.
// Se a tela ficar branca lá, precisaremos colocar as strings direto aqui.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const db = new Dexie('ShowPadProWeb');
db.version(11).stores({ 
    songs: '++id, title, artist, creator_id, band_id', 
    setlists: '++id, title, location, time, members, notes, creator_id, band_id',
    my_bands: 'id, name, invite_code, role'
});

export const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const chordRegex = /([A-G][#b]?(?:m|maj|dim|sus|aug|add|alt|[0-9])*(?:\/[A-G][#b]?)?)/g;

export const shiftNote = (n, s) => {
    const f = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
    const rM = n.match(/^[A-G][#b]?/); if (!rM) return n;
    const r = rM[0], suf = n.substring(r.length), norm = f[r] || r;
    let idx = scale.indexOf(norm.toUpperCase()); if (idx === -1) return n;
    let newIdx = (idx + s) % 12; if (newIdx < 0) newIdx += 12;
    return scale[newIdx] + suf;
};

export const transposeContent = (c, s) => {
    if (!c) return "";
    return c.split('\n').map(l => {
        if (l.toLowerCase().indexOf("tom") !== -1) return l.replace(/([A-G][#b]?)/g, (m) => shiftNote(m, s));
        const m = l.match(chordRegex);
        if (m && m.length > 0 && m.length >= l.trim().split(/\s+/).length * 0.4) return l.replace(chordRegex, (match) => shiftNote(match, s));
        return l;
    }).join('\n');
};

export const formatChordsVisual = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const m = line.match(chordRegex);
        const isC = m && m.length > 0 && m.length >= line.trim().split(/\s+/).length * 0.4;
        return (
            <div key={i} style={{ color: isC ? '#FFD700' : '#FFFFFF', fontWeight: isC ? 'bold' : 'normal', minHeight: '1.2em', whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.8' }}>{line || ' '}</div>
        );
    });
};

// BACKUP: Compatível com o clique do Mac e iPad
export const triggerDL = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'ShowPad_Backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- NUVEM: CORREÇÃO PARA UPLOAD/DOWNLOAD ---

export const pushToCloud = async (userId) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const songs = await db.songs.toArray();
    
    // Removemos o 'id' local para o Supabase não entrar em conflito
    const { error } = await supabase.from('songs').upsert(
        songs.map(s => ({ 
            title: s.title, 
            artist: s.artist, 
            content: s.content,
            creator_id: userId 
        })), { onConflict: ['title', 'artist', 'creator_id'] }
    );
    
    if (error) throw error;
    return true;
};

export const pullFromCloud = async (userId) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { data: cloudSongs, error } = await supabase.from('songs').select('*').eq('creator_id', userId);
    
    if (error) throw error;

    if (cloudSongs) {
        for (let s of cloudSongs) {
            const ex = await db.songs.where({title: s.title, artist: s.artist}).first();
            if (!ex) await db.songs.add({ ...s, id: undefined });
        }
    }
    return true;
};