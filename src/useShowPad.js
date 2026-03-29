import { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import { db, supabase } from './MusicEngine';

export function useShowPad(sortBy, selectedItem, setSelectedItem) {
  const [session, setSession] = useState(null);
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [midiStatus, setMidiStatus] = useState("off");
  const [midiFlash, setMidiFlash] = useState(false);
  const [allInputs, setAllInputs] = useState([]);
  const [lastSignal, setLastSignal] = useState("");
  const [midiLearning, setMidiLearning] = useState(null);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const midiLearningRef = useRef(null);

  useEffect(() => { midiLearningRef.current = midiLearning; }, [midiLearning]);

  const refreshData = async () => {
    const s = await db.songs.toArray();
    const sl = await db.setlists.toArray();
    s.sort((a,b) => (sortBy === 'artist' ? (a.artist||"").localeCompare(b.artist||"") : a.title.localeCompare(b.title)));
    setSongs(s); setSetlists(sl);
    if (selectedItem) {
      const upd = selectedItem.type === 'song' ? s.find(x => x.id === selectedItem.data.id) : sl.find(x => x.id === selectedItem.data.id);
      if (upd) setSelectedItem({ type: selectedItem.type, data: upd });
    }
  };

  const initMidi = () => {
    WebMidi.enable({ sysex: true }).then(() => {
      const upd = () => {
        const ins = WebMidi.inputs.filter(i => !i.name.includes("IAC"));
        setAllInputs(ins.map(i => i.name));
        setMidiStatus(ins.length > 0 ? "ready" : "nodevice");
        ins.forEach(input => {
          input.removeListener();
          input.addListener("midimessage", e => {
            const st = e.data[0], d1 = e.data[1], d2 = e.data[2];
            if ((st >= 144 && st <= 159 && d2 > 0) || (st >= 176 && st <= 191)) {
              const sig = (st >= 144 && st <= 159 ? "note" : "cc") + "-" + d1;
              setMidiFlash(true); setLastSignal(sig); setTimeout(() => setMidiFlash(false), 200);
              if (midiLearningRef.current) { localStorage.setItem("midi-" + midiLearningRef.current, sig); setMidiLearning(null); return; }
              if (sig === localStorage.getItem('midi-up')) window.dispatchEvent(new CustomEvent('scroll-up'));
              if (sig === localStorage.getItem('midi-down')) window.dispatchEvent(new CustomEvent('scroll-down'));
            }
          });
        });
      };
      upd(); WebMidi.addListener("connected", upd);
    }).catch(() => setMidiStatus("blocked"));
  };

  return { session, setSession, songs, setlists, midiStatus, midiFlash, allInputs, lastSignal, midiLearning, setMidiLearning, isServerOnline, setIsServerOnline, refreshData, initMidi };
}