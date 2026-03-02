---
description: How to run, develop, and extend the Vibefy Mood-to-Music Generator
---

# Vibefy — Development & Run Workflow

## 1. Prerequisites

Ensure the following are available on your system:

- **Python 3** (for local dev server) — verify with `python --version`
- **A modern browser** (Chrome/Edge/Firefox) with ES Module support
- **API Keys** (already configured in `src/gemini.js` and `src/spotify.js`):
  - Gemini API Key
  - Spotify Client ID + Client Secret

---

## 2. Starting the Local Dev Server

// turbo
```powershell
python -m http.server 5173 --directory "c:\Users\pandh\OneDrive\Documents\GitHub\music"
```

Then open your browser at: **http://localhost:5173**

> The app uses native ES Modules (`type="module"`), so it **must** be served over HTTP — opening `index.html` directly as a file:// URL will not work.

---

## 3. File Structure

```
music/
├── index.html              # App shell (landing + playlist page)
├── style.css               # Global design system (dark glassmorphism)
├── package.json            # npm metadata (optional, for npx serve)
├── src/
│   ├── app.js              # Main orchestration — routing, UI logic
│   ├── gemini.js           # Gemini API mood analysis (+ auto fallback)
│   ├── localMood.js        # Local mood engine — 13 profiles, offline
│   ├── spotify.js          # Spotify Web API — auth + track search
│   └── colorExtractor.js   # Canvas-based album art color extraction
└── .agents/
    └── workflows/
        └── vibefy.md       # This file
```

---

## 4. How the App Works (Data Flow)

```
User Input (text / dropdowns / mixed)
        │
        ▼
[ Gemini 2.5 Flash API ]  ──(if 429/404)──▶  [ Local Mood Engine ]
  NLP mood → JSON                             13 profiles, keyword scoring
  { playlist_title, genres,                   (works fully offline)
    energy, search_queries,
    color_palette }
        │
        ▼
[ Spotify Web API ]
  Client Credentials auth
  Search tracks by AI query
  Returns: name, artist, albumArt, spotifyUrl
        │
        ▼
[ Canvas Color Extractor ]
  Sample album art pixels
  Dominant color → gradient
        │
        ▼
[ Playlist Output Page ]
  Dynamic gradient background
  Track cards with Spotify links
  Album-color-matched themes
```

---

## 5. Adding New Mood Profiles (Local Engine)

Edit `src/localMood.js` — add a new entry to the `MOOD_PROFILES` array:

```js
{
  id: 'your_profile_id',
  keywords: ['keyword1', 'keyword2', ...],   // triggers this profile
  energy: 'low' | 'medium' | 'high',
  tempo: 'slow' | 'medium' | 'fast',
  vibe_label: 'Short Label',
  genres: ['genre1', 'genre2'],
  playlist_titles: ['Title Option 1', 'Title Option 2'],
  descriptions: ['One-sentence description'],
  search_queries: [
    'Artist Name 1',
    'song title artist 2',
    // ... 6-10 entries
  ],
  color_palette: {
    primary: '#hexcolor',
    secondary: '#hexcolor',
    accent: '#hexcolor'
  }
}
```

---

## 6. Updating API Keys

| Key | File | Variable |
|-----|------|----------|
| Gemini API Key | `src/gemini.js` | `GEMINI_API_KEY` |
| Spotify Client ID | `src/spotify.js` | `CLIENT_ID` |
| Spotify Client Secret | `src/spotify.js` | `CLIENT_SECRET` |

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank playlist page | Hard refresh (`Ctrl+Shift+R`) to flush module cache |
| Gemini 429 errors | App auto-falls back to local engine — no action needed |
| No tracks found | Try a different search phrase; Spotify free search can be selective |
| CORS errors on album art | Normal for some images — color bars fall back to default palette |
| `python` not found | Use `python3 -m http.server 5173` on Mac/Linux |

---

## 8. Deployment

To deploy as a static site (no server needed for the UI):

1. Upload all files to any static host: **Vercel, Netlify, GitHub Pages, or Cloudflare Pages**
2. No build step required — pure vanilla HTML/CSS/JS
3. Ensure the host serves files with correct MIME types (most do by default)

```powershell
# Example — push to GitHub Pages
git add .
git commit -m "deploy vibefy"
git push origin main
# Then enable Pages in GitHub repo settings → source: main branch
```
