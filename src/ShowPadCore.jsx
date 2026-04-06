import React from 'react';
import Dexie from 'dexie';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const db = new Dexie('ShowPadProWeb');

// VERSÃO 13: Tabelas para mensagens e convites locais (cache)
db.version(13).stores({ 
    songs: '++id, title, artist, creator_id, band_id', 
    setlists: '++id, name, title, band_id, creator_id',
    bands: '++id, name, is_solo, creator_id',
    messages: '++id, band_id, created_at',
    invites: '++id, band_id, email, status'
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

// --- FUNÇÕES DE COLABORAÇÃO (CHAT E CONVITES) ---
export const sendBandMessage = async (bandId, userId, userName, content) => {
    if (!supabase) return;
    await supabase.from('band_messages').insert([{
        band_id: bandId,
        sender_id: userId,
        sender_name: userName,
        content: content
    }]);
};

export const inviteMember = async (bandId, email, inviterId) => {
    if (!supabase) return;
    return await supabase.from('band_invites').insert([{
        band_id: bandId,
        email: email,
        invited_by: inviterId,
        status: 'pending'
    }]);
};

// --- SINCRONIA E BACKUP ---
export const pushToCloud = async (userId) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    
    // 1. Bandas
    const localBands = await db.bands.toArray();
    if (localBands.length > 0) {
        const bandsPayload = localBands.map(b => ({
            name: b.name,
            is_solo: b.is_solo || false,
            creator_id: userId
        }));
        await supabase.from('bands').upsert(bandsPayload, { onConflict: 'name,creator_id' });
    }

    // 2. Músicas
    const localSongs = await db.songs.toArray();
    if (localSongs.length > 0) {
        const songsPayload = localSongs.map(s => ({ 
            title: String(s.title || ""), 
            artist: String(s.artist || ""), 
            content: String(s.content || ""), 
            notes: String(s.notes || ""),
            bpm: Number(s.bpm || 120),
            creator_id: userId,
            band_id: s.band_id || null
        }));
        await supabase.from('songs').upsert(songsPayload, { onConflict: 'title,artist,creator_id' });
    }

    // 3. Setlists
    const localSetlists = await db.setlists.toArray();
    if (localSetlists.length > 0) {
        const setlistsPayload = localSetlists.map(sl => ({
            title: String(sl.title || sl.name || "Sem Nome"),
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
    return { success: true };
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

export const pullFromCloud = async (userId) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    
    // Puxar Bandas Primeiro
    const { data: cBands } = await supabase.from('bands').select('*').or(`creator_id.eq.${userId},members.cs.{"${userId}"}`);
    if (cBands) {
        for (let b of cBands) {
            const ex = await db.bands.where({name: b.name}).first();
            if (!ex) await db.bands.add(b);
        }
    }

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
    return { success: true };
};