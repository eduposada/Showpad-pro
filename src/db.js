import Dexie from 'dexie';

const db = new Dexie('ShowPadProWeb');
db.version(11).stores({ 
    songs: '++id, title, artist', 
    setlists: '++id, title, location, time, members, notes' 
});

export default db;