// Vibefy — Main App Logic
import { analyzeMood } from './gemini.js';
import { analyzeFromDropdowns } from './localMood.js';
import { searchTracks } from './spotify.js';
import { extractColors, computePlaylistGradient } from './colorExtractor.js';

// ─── State ───────────────────────────────────────────────────
let currentTab = 'text';
let currentPlaylistData = null;

// ─── Page Navigation ─────────────────────────────────────────
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(id);
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goBack = function () {
    showPage('landing-page');
    // Re-enable generate button
    const btn = document.getElementById('generate-btn');
    btn.classList.remove('disabled');
};

// ─── Tab Switching ────────────────────────────────────────────
window.switchTab = function (tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`content-${tab}`).classList.remove('hidden');
};

// ─── Character Counter ────────────────────────────────────────
function initCharCounter(textareaId, counterId) {
    const ta = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (!ta || !counter) return;
    ta.addEventListener('input', () => {
        counter.textContent = ta.value.length;
    });
}
initCharCounter('mood-text', 'char-count');

// ─── Example Chips ────────────────────────────────────────────
const exampleMap = {
    '☕ Morning coffee & calm': "It's a quiet Sunday morning, I'm sipping my first coffee, sunlight is streaming through the window, feeling peaceful and grateful.",
    '🏋️ Post-workout unstoppable': "I just crushed a brutal 90-minute gym session and feel absolutely unstoppable. Heart is still pumping, I conquered the world.",
    '🌧️ Rainy day studying': "I'm studying for a finals exam at 2 AM while it rains heavily outside. I need to focus deeply but feel a bit melancholic.",
    '💔 Heartbreak healing': "I just went through a breakup and lying in bed staring at the ceiling. Sad but trying to find hope and heal my heart.",
    '🎉 Party pre-game hype': "Getting ready with friends before a big night out. Energy is through the roof, everyone is hyped, ready to dance all night."
};
window.fillExample = function (btn) {
    const text = exampleMap[btn.textContent.trim()] || btn.textContent;
    const ta = document.getElementById('mood-text');
    ta.value = text;
    document.getElementById('char-count').textContent = text.length;
    // Switch to text tab
    switchTab('text');
    ta.focus();
};

// ─── Build Mood Description from Inputs ───────────────────────
function buildMoodDescription() {
    if (currentTab === 'text') {
        return document.getElementById('mood-text')?.value?.trim() || '';
    }
    if (currentTab === 'dropdowns') {
        const parts = [];
        const mood = document.getElementById('dd-mood')?.value;
        const time = document.getElementById('dd-time')?.value;
        const weather = document.getElementById('dd-weather')?.value;
        const activity = document.getElementById('dd-activity')?.value;
        const genre = document.getElementById('dd-genre')?.value;
        const energy = document.getElementById('dd-energy')?.value;
        if (mood) parts.push(`Feeling ${mood}`);
        if (time) parts.push(`during ${time}`);
        if (weather) parts.push(`in ${weather} weather`);
        if (activity) parts.push(`while ${activity}`);
        if (genre) parts.push(`preferring ${genre} music`);
        if (energy) parts.push(`with ${energy} energy level`);
        return parts.join(', ') || '';
    }
    if (currentTab === 'mixed') {
        const parts = [];
        const text = document.getElementById('mood-text-mixed')?.value?.trim();
        const mood = document.getElementById('md-mood')?.value;
        const activity = document.getElementById('md-activity')?.value;
        const genre = document.getElementById('md-genre')?.value;
        const energy = document.getElementById('md-energy')?.value;
        if (mood) parts.push(`Feeling ${mood}`);
        if (activity) parts.push(`while ${activity}`);
        if (genre) parts.push(`preferring ${genre}`);
        if (energy) parts.push(`${energy} energy`);
        if (text) parts.push(text);
        return parts.join(', ') || '';
    }
    return '';
}

function validateInput() {
    const desc = buildMoodDescription();
    if (!desc) {
        if (currentTab === 'text') {
            document.getElementById('mood-text').focus();
            shakeElement(document.getElementById('mood-text'));
        } else if (currentTab === 'dropdowns') {
            shakeElement(document.querySelector('.dropdowns-grid'));
        } else {
            shakeElement(document.querySelector('.mixed-layout'));
        }
        return false;
    }
    return true;
}

function shakeElement(el) {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.4s ease';
    setTimeout(() => el.style.animation = '', 500);
}

// ─── Loading State ────────────────────────────────────────────
function setLoading(show, status = '') {
    const overlay = document.getElementById('loading-overlay');
    const statusEl = document.getElementById('loading-status');
    overlay.classList.toggle('hidden', !show);
    if (status && statusEl) statusEl.textContent = status;
}

// ─── Generate Playlist ────────────────────────────────────────
window.generatePlaylist = async function () {
    if (!validateInput()) return;

    const btn = document.getElementById('generate-btn');
    btn.classList.add('disabled');
    setLoading(true, 'Analyzing your mood with AI…');

    try {
        const moodDesc = buildMoodDescription();
        console.log('Mood description:', moodDesc);

        // Step 1: Mood analysis (Gemini with local fallback, or direct local for dropdowns)
        let moodData;
        if (currentTab === 'dropdowns') {
            // Use structured dropdown data for richer local analysis
            setLoading(true, 'Matching your vibe…');
            const dropdownData = {
                mood: document.getElementById('dd-mood')?.value,
                time: document.getElementById('dd-time')?.value,
                weather: document.getElementById('dd-weather')?.value,
                activity: document.getElementById('dd-activity')?.value,
                genre: document.getElementById('dd-genre')?.value,
                energy: document.getElementById('dd-energy')?.value
            };
            // Build a sentence for Gemini, use dropdown data for local fallback
            const geminiResult = await analyzeMood(moodDesc, (s) => setLoading(true, s));
            if (geminiResult._source !== 'gemini' && Object.values(dropdownData).some(v => v)) {
                // Local fallback — use the richer dropdown-specific analyzer
                moodData = analyzeFromDropdowns(dropdownData);
            } else {
                moodData = geminiResult;
            }
        } else {
            moodData = await analyzeMood(moodDesc, (s) => setLoading(true, s));
        }
        console.log('Mood data:', moodData, '(source:', moodData._source || 'gemini', ')');

        // Step 2: Spotify track search
        setLoading(true, 'Searching for perfect tracks…');
        const tracks = await searchTracks(moodData);
        console.log('Tracks found:', tracks.length);

        if (!tracks.length) {
            throw new Error('No tracks found. Please try a different description.');
        }

        // Step 3: Render playlist page
        setLoading(true, 'Building your playlist…');
        currentPlaylistData = { moodData, tracks };
        await renderPlaylist(moodData, tracks);

        setLoading(false);
        showPage('playlist-page');

    } catch (err) {
        setLoading(false);
        btn.classList.remove('disabled');
        console.error('Error:', err);
        showError(err.message || 'Something went wrong. Please try again.');
    }
};

// ─── Error Toast ──────────────────────────────────────────────
function showError(message) {
    // Remove existing toast
    document.getElementById('error-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'error-toast';
    toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.3);
    color: #fca5a5; padding: 1rem 1.5rem; border-radius: 12px;
    font-family: var(--font-body); font-size: 0.9rem;
    backdrop-filter: blur(20px); z-index: 1000;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    animation: cardIn 0.3s ease;
    max-width: 90vw; text-align: center;
  `;
    toast.textContent = `⚠️ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// ─── Render Playlist ──────────────────────────────────────────
async function renderPlaylist(moodData, tracks) {
    // Set playlist hero content
    document.getElementById('vibe-badge').textContent = moodData.vibe_label || 'Your Vibe';
    document.getElementById('playlist-title').textContent = moodData.playlist_title || 'Your Playlist';
    document.getElementById('playlist-desc').textContent = moodData.playlist_description || '';

    // Meta tags
    const metaEl = document.getElementById('playlist-meta');
    const tags = [
        moodData.energy && `⚡ ${capitalize(moodData.energy)} Energy`,
        moodData.tempo && `🥁 ${capitalize(moodData.tempo)} Tempo`,
        ...(moodData.mood_keywords || []).slice(0, 2).map(k => `✨ ${k}`)
    ].filter(Boolean);

    metaEl.innerHTML = tags.map(t => `<span class="meta-tag">${t}</span>`).join('');

    // Render track cards
    const grid = document.getElementById('tracks-grid');
    grid.innerHTML = '';

    tracks.forEach((track, i) => {
        const card = createTrackCard(track, i);
        grid.appendChild(card);
    });

    // Extract colors from album arts and set background
    await applyColorTheme(tracks, moodData);
}

function createTrackCard(track, index) {
    const card = document.createElement('div');
    card.className = 'track-card';
    card.style.animationDelay = `${index * 0.07}s`;
    card.dataset.trackId = track.id;

    // Build Spotify open URL
    const spotifyLink = track.spotifyUrl
        ? `<a href="${track.spotifyUrl}" target="_blank" rel="noopener noreferrer" class="action-btn spotify" title="Open in Spotify">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        Spotify
       </a>`
        : `<span class="action-btn spotify" style="opacity:0.35;cursor:default">Not Available</span>`;

    // Web search link (last.fm for discovery)
    const searchQuery = encodeURIComponent(`${track.artist} ${track.name}`);
    const webSearchLink = `<a href="https://www.last.fm/search?q=${searchQuery}" target="_blank" rel="noopener noreferrer" class="action-btn query" title="Discover on Last.fm">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    Discover
  </a>`;

    const artHtml = track.albumArt
        ? `<img class="track-art" src="${track.albumArt}" alt="${escHtml(track.album)}" loading="lazy" crossorigin="anonymous" />`
        : `<div class="track-art-placeholder">🎵</div>`;

    card.innerHTML = `
    ${artHtml}
    <div class="track-color-bar" id="colorbar-${track.id}"></div>
    <div class="track-info">
      <div class="track-index">Track ${String(index + 1).padStart(2, '0')}</div>
      <div class="track-name" title="${escHtml(track.name)}">${escHtml(track.name)}</div>
      <div class="track-artist" title="${escHtml(track.artist)}">${escHtml(track.artist)}</div>
      <div class="track-actions">
        ${spotifyLink}
        ${webSearchLink}
      </div>
    </div>
  `;

    return card;
}

// ─── Color Theming ────────────────────────────────────────────
async function applyColorTheme(tracks, moodData) {
    const tracksWithArt = tracks.filter(t => t.albumArt);

    // Extract colors from first 4 album arts in parallel
    const colorPromises = tracksWithArt.slice(0, 4).map(t => extractColors(t.albumArt));
    const colorResults = await Promise.all(colorPromises);

    // Apply individual color bars
    tracksWithArt.slice(0, 4).forEach((track, i) => {
        const bar = document.getElementById(`colorbar-${track.id}`);
        if (bar && colorResults[i]) {
            const c = colorResults[i];
            bar.style.background = `linear-gradient(90deg, ${c.primary}, ${c.secondary})`;
        }
    });

    // Set playlist background gradient
    const gradient = computePlaylistGradient(colorResults, moodData.color_palette);
    const bg = document.getElementById('playlist-bg-gradient');
    bg.style.background = gradient;

    // Also tint the playlist title area slightly
    if (colorResults[0]) {
        const c = colorResults[0];
        document.getElementById('vibe-badge').style.borderColor = `rgba(${c.r},${c.g},${c.b},0.5)`;
        document.getElementById('vibe-badge').style.color = `rgb(${c.r},${c.g},${c.b})`;
        document.getElementById('vibe-badge').style.background = `rgba(${c.r},${c.g},${c.b},0.12)`;
    }
}

// ─── Helpers ──────────────────────────────────────────────────
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Shake animation ─────────────────────────────────────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70% { transform: translateX(-6px); }
    20%, 40%, 60%, 80% { transform: translateX(6px); }
  }
`;
document.head.appendChild(shakeStyle);

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Auto-focus textarea on load
    setTimeout(() => document.getElementById('mood-text')?.focus(), 400);
});
