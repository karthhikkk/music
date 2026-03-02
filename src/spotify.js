// Spotify API — Track Search
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
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
    return response.json();
}

export async function searchTracks(moodData) {
    const token = await getAccessToken();
    const { search_queries, genres, energy } = moodData;

    const tracks = [];
    const seenIds = new Set();

    // Search using AI-generated queries
    for (const query of search_queries.slice(0, 8)) {
        try {
            const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=3&market=US`;
            const data = await spotifyFetch(url, token);
            for (const track of (data.tracks?.items || [])) {
                if (!seenIds.has(track.id) && track.preview_url !== undefined) {
                    seenIds.add(track.id);
                    tracks.push(formatTrack(track));
                    if (tracks.length >= 12) break;
                }
            }
            if (tracks.length >= 12) break;
        } catch (e) {
            console.warn(`Search failed for "${query}":`, e.message);
        }
    }

    // Fallback: genre search if we got too few tracks
    if (tracks.length < 6 && genres?.length) {
        for (const genre of genres) {
            try {
                const url = `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&limit=5&market=US`;
                const data = await spotifyFetch(url, token);
                for (const track of (data.tracks?.items || [])) {
                    if (!seenIds.has(track.id)) {
                        seenIds.add(track.id);
                        tracks.push(formatTrack(track));
                        if (tracks.length >= 10) break;
                    }
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

    // Pick best image size (~300px)
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
