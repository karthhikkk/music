// Spotify API — Track Search with Preference Filters
const CLIENT_ID = 'f8f74861c1cb4311b6aec052597dd2fc';
const CLIENT_SECRET = '0871a9a1ae4144309303758fe343b507';

let _accessToken = null;
let _tokenExpiry = 0;

export async function getAccessToken() {
    if (_accessToken && Date.now() < _tokenExpiry) return _accessToken;
    const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${creds}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Spotify auth error: ${response.status} — ${err}`);
    }
    const data = await response.json();
    _accessToken = data.access_token;
    _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return _accessToken;
}

async function spotifyFetch(url, token) {
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
    return response.json();
}

// ─── Language → Spotify market + search hint ─────────────────
const LANG_CONFIG = {
    english: { market: 'US', hint: '' },
    spanish: { market: 'ES', hint: 'spanish' },
    hindi: { market: 'IN', hint: 'hindi bollywood' },
    korean: { market: 'KR', hint: 'korean kpop' },
    french: { market: 'FR', hint: 'french' },
    japanese: { market: 'JP', hint: 'japanese j-pop' },
    portuguese: { market: 'BR', hint: 'portuguese brazilian' },
    arabic: { market: 'SA', hint: 'arabic' },
    german: { market: 'DE', hint: 'german' },
    italian: { market: 'IT', hint: 'italian' }
};

function buildYearFilter(era) {
    if (!era || era === 'any') return '';
    return ` year:${era}`;
}

function isBlocked(track, blockedArtists) {
    if (!blockedArtists?.length) return false;
    const artistLower = track.artist.toLowerCase();
    return blockedArtists.some(b => artistLower.includes(b.toLowerCase()));
}

/**
 * Main search function
 * @param {object} moodData - from Gemini or local engine
 * @param {object} prefs - { likedArtists, blockedArtists, era, language }
 */
export async function searchTracks(moodData, prefs = {}) {
    const token = await getAccessToken();
    const { search_queries = [], genres = [] } = moodData;
    const { likedArtists = [], blockedArtists = [], era = 'any', language = 'any' } = prefs;

    const langCfg = LANG_CONFIG[language] || { market: 'US', hint: '' };
    const yearFilter = buildYearFilter(era);
    const market = langCfg.market;

    const tracks = [];
    const seenIds = new Set();

    function tryAdd(track) {
        if (!seenIds.has(track.id) && !isBlocked(track, blockedArtists)) {
            seenIds.add(track.id);
            tracks.push(track);
            return true;
        }
        return false;
    }

    // 1) Search liked artists FIRST — they get priority slots
    for (const artist of likedArtists.slice(0, 4)) {
        try {
            const q = `artist:${artist}${yearFilter}`;
            const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=3&market=${market}`;
            const data = await spotifyFetch(url, token);
            for (const t of (data.tracks?.items || [])) {
                tryAdd(formatTrack(t));
                if (tracks.length >= 4) break;
            }
        } catch (e) {
            console.warn(`Liked artist search failed for "${artist}":`, e.message);
        }
    }

    // 2) Language-specific hint search if not English
    if (langCfg.hint) {
        const baseQuery = search_queries[0] || genres[0] || 'music';
        const langQuery = `${langCfg.hint} ${baseQuery}${yearFilter}`;
        try {
            const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(langQuery)}&type=track&limit=5&market=${market}`;
            const data = await spotifyFetch(url, token);
            for (const t of (data.tracks?.items || [])) {
                tryAdd(formatTrack(t));
            }
        } catch (e) {
            console.warn(`Language search failed:`, e.message);
        }
    }

    // 3) Main mood-based queries
    for (const query of search_queries.slice(0, 8)) {
        if (tracks.length >= 12) break;
        try {
            const q = `${query}${yearFilter}`;
            const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=3&market=${market}`;
            const data = await spotifyFetch(url, token);
            for (const t of (data.tracks?.items || [])) {
                tryAdd(formatTrack(t));
                if (tracks.length >= 12) break;
            }
        } catch (e) {
            console.warn(`Search failed for "${query}":`, e.message);
        }
    }

    // 4) Genre fallback
    if (tracks.length < 6 && genres?.length) {
        for (const genre of genres) {
            try {
                const q = `genre:${genre}${yearFilter}`;
                const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5&market=${market}`;
                const data = await spotifyFetch(url, token);
                for (const t of (data.tracks?.items || [])) {
                    tryAdd(formatTrack(t));
                    if (tracks.length >= 10) break;
                }
            } catch (e) {
                console.warn(`Genre search failed for "${genre}":`, e.message);
            }
        }
    }

    return tracks.slice(0, 10);
}

function formatTrack(track) {
    const album = track.album;
    const artists = track.artists.map(a => a.name).join(', ');
    const images = album.images || [];
    const img = images.find(i => i.width >= 200 && i.width <= 640) || images[0] || null;

    return {
        id: track.id,
        name: track.name,
        artist: artists,
        album: album.name,
        albumArt: img?.url || null,
        spotifyUrl: track.external_urls?.spotify || null,
        previewUrl: track.preview_url || null,
        duration: track.duration_ms,
        popularity: track.popularity
    };
}
