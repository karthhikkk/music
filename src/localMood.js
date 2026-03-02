/**
 * LOCAL MOOD ENGINE
 * A comprehensive keyword-scoring system + curated music dataset.
 * Used as primary fallback when Gemini API is unavailable.
 * 
 * Based on music psychology research:
 * Energy/Valence model (Russell's Circumplex), genre mood mapping,
 * and curated artist/track associations per vibe.
 */

// ─── Mood Profiles Dataset ────────────────────────────────────────────────────
// Each profile has: keywords, energy, tempo, genres, search_queries, colors, title templates
const MOOD_PROFILES = [
    {
        id: 'deep_focus',
        keywords: ['study', 'studying', 'focus', 'concentrate', 'exam', 'finals', 'work', 'coding', 'reading', 'homework', 'productive', 'deadline', 'essay', 'thesis', 'library'],
        energy: 'low',
        tempo: 'slow',
        vibe_label: 'Deep Focus',
        genres: ['lo-fi', 'ambient', 'instrumental'],
        playlist_titles: ['Neurons Firing at Midnight', 'Pages & Quiet Places', 'The Study Session Vibe'],
        descriptions: ['Calm, focused instrumentals to keep you in the zone without distraction'],
        search_queries: [
            'lofi hip hop study beats', 'Nujabes instrumental', 'Tycho ambient', 'Nils Frahm piano',
            'Brian Eno ambient 1', 'Bonobo black sands', 'Four Tet rounds', 'Nightmares on Wax',
            'Ólafur Arnalds ambient', 'floating points elaenia'
        ],
        color_palette: { primary: '#1e3a5f', secondary: '#2d6a9f', accent: '#7eb8d4' }
    },
    {
        id: 'rainy_melancholic',
        keywords: ['rain', 'raining', 'rainy', 'storm', 'cloudy', 'thunder', 'drizzle', 'wet', 'window', 'grey', 'gray', 'overcast', 'fog', 'mist', 'melancholic', 'sad', 'lonely', 'quiet', 'cozy', 'midnight', '2am', '3am', 'late night', 'awake'],
        energy: 'low',
        tempo: 'slow',
        vibe_label: 'Rainy Night',
        genres: ['indie', 'ambient', 'lo-fi', 'shoegaze'],
        playlist_titles: ['Rain on Glass at 2AM', 'Soft Rain & Dim Lights', 'Where the Rain Falls Softly'],
        descriptions: ['Dreamy, melancholic sounds that blend perfectly with rainy night energy'],
        search_queries: [
            'Bon Iver skinny love', 'The National bloodbuzz ohio', 'Sufjan Stevens death with dignity',
            'Phoebe Bridgers motion sickness', 'Iron & Wine flightless bird', 'Nick Drake pink moon',
            'Elliott Smith between the bars', 'Cigarettes After Sex apocalypse',
            'Beach House space song', 'Sigur Ros hoppipolla'
        ],
        color_palette: { primary: '#1a2744', secondary: '#2e4a7a', accent: '#6b9fd4' }
    },
    {
        id: 'heartbreak',
        keywords: ['heartbreak', 'heartbroken', 'breakup', 'broke up', 'sad', 'cry', 'crying', 'tears', 'miss', 'missing', 'hurt', 'pain', 'lonely', 'alone', 'lost', 'grief', 'healing', 'devastated', 'ended', 'over'],
        energy: 'low',
        tempo: 'slow',
        vibe_label: 'Healing Heart',
        genres: ['indie', 'pop', 'r&b', 'soul'],
        playlist_titles: ['Holding the Pieces Together', 'Songs for the Ache', 'Beautiful Sadness'],
        descriptions: ['Emotionally resonant tracks for processing heartbreak and finding healing'],
        search_queries: [
            'Olivia Rodrigo drivers license', 'Taylor Swift all too well', 'Adele someone like you',
            'Sam Smith stay with me', 'Frank Ocean ivy', 'SZA supercut', 'Lana Del Rey video games',
            'Hozier from eden', 'James Blake limit to your love', 'Sufjan Stevens death with dignity'
        ],
        color_palette: { primary: '#3d1a3d', secondary: '#6b2d6b', accent: '#e891e8' }
    },
    {
        id: 'workout_power',
        keywords: ['workout', 'gym', 'exercise', 'lift', 'lifting', 'run', 'running', 'sprint', 'unstoppable', 'power', 'beast', 'gains', 'sweat', 'hustle', 'grind', 'pushups', 'cardio', 'training', 'athletic', 'strong', 'conquer', 'crush', 'dominated', 'epic'],
        energy: 'high',
        tempo: 'fast',
        vibe_label: 'Beast Mode',
        genres: ['hip-hop', 'electronic', 'rock', 'metal'],
        playlist_titles: ['Unstoppable Force Playlist', 'Conquer Every Rep', 'Maximum Overdrive'],
        descriptions: ['High-octane tracks that turn every rep into an act of pure domination'],
        search_queries: [
            'Eminem till i collapse', 'Kendrick Lamar humble', 'Travis Scott highest in the room',
            'Kanye West all falls down', 'The Weeknd blinding lights', 'David Guetta titanium',
            'Rage Against the Machine killing in the name', 'Metallica enter sandman',
            'Calvin Harris feel so close', 'ACDC thunderstruck'
        ],
        color_palette: { primary: '#5c1a00', secondary: '#b33600', accent: '#ff6b35' }
    },
    {
        id: 'morning_calm',
        keywords: ['morning', 'sunrise', 'coffee', 'breakfast', 'wake', 'fresh', 'peaceful', 'calm', 'gentle', 'slow', 'sunday', 'weekend', 'relax', 'chill', 'tea', 'bright', 'hopeful', 'new day', 'grateful'],
        energy: 'low',
        tempo: 'slow',
        vibe_label: 'Morning Bliss',
        genres: ['indie', 'folk', 'acoustic', 'jazz'],
        playlist_titles: ['Golden Hour Serotonin', 'First Light Coffee Session', 'Sunday Morning Easy'],
        descriptions: ['Warm, gentle sounds to ease you into the day with gratitude and calm'],
        search_queries: [
            'Jack Johnson better together', 'John Mayer gravity', 'Norah Jones come away with me',
            'Ben Harper steal my kisses', 'Vance Joy riptide', 'Angus Stone musical morning',
            'Nick Drake river man', 'Jose Gonzalez heartbeats', 'The Paper Kites bloom',
            'Novo Amor from gold'
        ],
        color_palette: { primary: '#5c3d00', secondary: '#a06b00', accent: '#f5c842' }
    },
    {
        id: 'party_hype',
        keywords: ['party', 'dance', 'club', 'hype', 'pregame', 'pre-game', 'celebrate', 'turn up', 'lit', 'banger', 'night out', 'friends', 'fun', 'energy', 'edm', 'rave'],
        energy: 'high',
        tempo: 'fast',
        vibe_label: 'Party Ignition',
        genres: ['electronic', 'pop', 'hip-hop', 'dance'],
        playlist_titles: ['We Run This City Tonight', 'The Pre-Game Soundtrack', 'Pure Serotonin Bangers'],
        descriptions: ['Floor-filling bangers to launch the night into legendary territory'],
        search_queries: [
            'Drake god plan', 'Doja Cat say so', 'Dua Lipa levitating', 'The Weeknd save your tears',
            'Olivia Rodrigo good 4 u', 'Billie Eilish bad guy', 'Post Malone circles',
            'Lizzo juice', 'Cardi B WAP', 'Ariana Grande 7 rings'
        ],
        color_palette: { primary: '#4a0080', secondary: '#8b00d4', accent: '#df80ff' }
    },
    {
        id: 'romantic',
        keywords: ['romantic', 'romance', 'love', 'date', 'dating', 'dinner', 'candle', 'partner', 'valentine', 'cuddle', 'intimate', 'dreamy', 'crush', 'feelings', 'affection', 'tender', 'passionate', 'together'],
        energy: 'medium',
        tempo: 'medium',
        vibe_label: 'Romantic Evening',
        genres: ['r&b', 'soul', 'indie pop', 'jazz'],
        playlist_titles: ['Slow Dance Under Dim Lights', 'Velvet & Roses', 'Love in Soft Focus'],
        descriptions: ['Silky, sensual tracks to set the perfect romantic atmosphere'],
        search_queries: [
            'Frank Ocean thinking bout you', 'Daniel Caesar get you', 'H.E.R. best part',
            'John Legend all of me', 'Sade smooth operator', 'Maxwell pretty wings',
            'Giveon heartbreak anniversary', 'Rex Orange County loving is easy',
            'Corinne Bailey Rae put your records on', 'Mint Condition if you love me'
        ],
        color_palette: { primary: '#5c0030', secondary: '#a00055', accent: '#ff6ba8' }
    },
    {
        id: 'nostalgia',
        keywords: ['nostalgia', 'nostalgic', 'memories', 'childhood', 'throwback', 'remember', 'past', 'old', '90s', '80s', '70s', 'retro', 'vintage', 'miss', 'simpler times', 'good old days'],
        energy: 'medium',
        tempo: 'medium',
        vibe_label: 'Nostalgic Wave',
        genres: ['indie', 'alternative', 'classic rock', 'r&b'],
        playlist_titles: ['Polaroids & Old Mixtapes', 'Time Travel Soundtrack', 'The Memory Drawer'],
        descriptions: ['Songs that wrap around you like an old favorite sweater from another time'],
        search_queries: [
            'Tame Impala the less i know the better', 'Foster the People pumped up kicks',
            'Vampire Weekend oxford comma', 'MGMT kids', 'The 1975 chocolate',
            'Arctic Monkeys do i wanna know', 'Fleetwood Mac dreams', 'The Killers mr brightside',
            'R.E.M. losing my religion', 'Radiohead creep'
        ],
        color_palette: { primary: '#3d2a00', secondary: '#7a5500', accent: '#d4a843' }
    },
    {
        id: 'anxious_restless',
        keywords: ['anxious', 'anxiety', 'stressed', 'stress', 'overwhelmed', 'panic', 'nervous', 'worried', 'restless', 'racing thoughts', 'overthinking', 'tense', 'pressure', 'burnout'],
        energy: 'medium',
        tempo: 'medium',
        vibe_label: 'Finding Stillness',
        genres: ['ambient', 'classical', 'indie folk'],
        playlist_titles: ['Breathe, Just Breathe', 'Quiet the Noise Inside', 'Slow Down & Reset'],
        descriptions: ['Gentle, grounding sounds to ease an anxious mind back to calm'],
        search_queries: [
            'Bon Iver re: stacks', 'Sigur Ros holocene', 'Max Richter on the nature of daylight',
            'Nils Frahm says', 'Brian Eno thursday afternoon', 'Julien Baker sprained ankle',
            'Lucy Rose no words left', 'Gregory Alan Isakov the weatherman',
            'Justin Vernon towers', 'Devendra Banhart carmensita'
        ],
        color_palette: { primary: '#1a3d2e', secondary: '#2d6b50', accent: '#6dbf94' }
    },
    {
        id: 'driving',
        keywords: ['drive', 'driving', 'road trip', 'highway', 'car', 'cruise', 'commute', 'travel', 'journey', 'windows down', 'freeway', 'open road'],
        energy: 'medium',
        tempo: 'medium',
        vibe_label: 'Open Road',
        genres: ['indie rock', 'pop rock', 'alternative'],
        playlist_titles: ['Miles of Good Music', 'Highway Stars Playlist', 'Windows Down, Volume Up'],
        descriptions: ['Perfect road-cruise anthems with just the right forward momentum'],
        search_queries: [
            'Arctic Monkeys r u mine', 'Vampire Weekend a-punk', 'Tame Impala eventually',
            'Mac DeMarco salad days', 'Unknown Mortal Orchestra multi-love',
            'Real Estate it s real', 'Khruangbin a pharmacist', 'Men I Trust lauren',
            'Mild High Club windowpane', 'Homeshake make it with me'
        ],
        color_palette: { primary: '#1a1a3d', secondary: '#2d2d6b', accent: '#7070d4' }
    },
    {
        id: 'feel_good_happy',
        keywords: ['happy', 'happiness', 'joy', 'joyful', 'good mood', 'elated', 'cheerful', 'upbeat', 'positive', 'great', 'amazing', 'wonderful', 'blessed', 'good vibes', 'smile', 'laughing', 'fun'],
        energy: 'high',
        tempo: 'fast',
        vibe_label: 'Pure Joy',
        genres: ['pop', 'funk', 'indie pop', 'dance pop'],
        playlist_titles: ['Serotonin Overflow Playlist', 'The Happy Place Soundtrack', 'Sunshine in Audio Form'],
        descriptions: ['Irresistibly upbeat tracks that make even strangers want to dance'],
        search_queries: [
            'Pharrell Williams happy', 'Bruno Mars uptown funk', 'Justin Timberlake can t stop the feeling',
            'Katy Perry roar', 'Lizzo good as hell', 'Harry Styles watermelon sugar',
            'Dua Lipa dont start now', 'Carly Rae Jepsen run away with me',
            'Bleachers i wanna get better', 'Two Door Cinema Club something good can work'
        ],
        color_palette: { primary: '#4a2d00', secondary: '#7a4d00', accent: '#ffb347' }
    },
    {
        id: 'meditation_zen',
        keywords: ['meditat', 'zen', 'mindful', 'breathe', 'breathing', 'yoga', 'peace', 'serene', 'tranquil', 'still', 'quiet', 'spiritual', 'nature', 'forest', 'slow down', 'present'],
        energy: 'low',
        tempo: 'slow',
        vibe_label: 'Inner Stillness',
        genres: ['ambient', 'classical', 'world', 'new age'],
        playlist_titles: ['The Still Small Voice', 'Breath by Breath', 'Silence Between Notes'],
        descriptions: ['Meditative, space-filled sounds designed to quiet the mind completely'],
        search_queries: [
            'Brian Eno apollo atmospheres', 'Harold Budd room', 'Max Richter sleep',
            'Jon Hopkins immunity', 'Stars of the Lid and their refinement',
            'Grouper dragging a dead deer', 'William Basinski disintegration loops',
            'The Caretaker an empty bliss', 'Julianna Barwick will', 'Hiroshi Yoshimura music for nine post cards'
        ],
        color_palette: { primary: '#1a3a2a', secondary: '#2d6b4a', accent: '#80d4a8' }
    },
    {
        id: 'late_night_chill',
        keywords: ['late night', 'night', 'midnight', 'dark', 'city lights', 'insomnia', 'awake', 'alone', 'introspective', 'thinking', 'mellow', 'vibes', 'city', 'urban', 'neon'],
        energy: 'low',
        tempo: 'slow',
        vibe_label: 'Late Night Drive',
        genres: ['r&b', 'lo-fi', 'electronic', 'indie'],
        playlist_titles: ['3AM City Lights', 'After Hours Frequencies', 'Neon & Quiet Streets'],
        descriptions: ['Sultry, introspective sounds for the wide-awake city night hours'],
        search_queries: [
            'The Weeknd after hours', 'Frank Ocean nights', 'SZA the weekend',
            'Daniel Caesar streetcar', 'Khalid location', 'Bryson Tiller dont',
            'Majid Jordan first world problems', 'dvsn in between', 'brent faiyaz make it',
            'PARTYNEXTDOOR persian rugs'
        ],
        color_palette: { primary: '#0d001f', secondary: '#1a0035', accent: '#9b59d4' }
    }
];

// ─── Keyword Scorer ───────────────────────────────────────────────────────────
function scoreProfile(text, profile) {
    const lower = text.toLowerCase();
    let score = 0;
    for (const kw of profile.keywords) {
        if (lower.includes(kw.toLowerCase())) score += 1;
        // Bonus for exact word match
        const wordRegex = new RegExp(`\\b${kw.toLowerCase()}\\b`);
        if (wordRegex.test(lower)) score += 0.5;
    }
    return score;
}

// ─── Local Analyzer ───────────────────────────────────────────────────────────
export function analyzeLocally(moodDescription) {
    const scores = MOOD_PROFILES.map(p => ({ profile: p, score: scoreProfile(moodDescription, p) }));
    scores.sort((a, b) => b.score - a.score);

    // Pick best match; if no match (all zero), pick based on simple heuristics
    let best = scores[0].profile;
    if (scores[0].score === 0) {
        // Generic fallback based on word length — short = happy, long descriptive = chill
        const wordCount = moodDescription.split(/\s+/).length;
        best = wordCount < 5 ? MOOD_PROFILES.find(p => p.id === 'feel_good_happy') : MOOD_PROFILES.find(p => p.id === 'late_night_chill');
    }

    // Shuffle search queries slightly for variety
    const shuffled = [...best.search_queries].sort(() => Math.random() - 0.4);

    // Pick random title/desc
    const title = best.playlist_titles[Math.floor(Math.random() * best.playlist_titles.length)];
    const desc = best.descriptions[Math.floor(Math.random() * best.descriptions.length)];

    return {
        playlist_title: title,
        playlist_description: desc,
        vibe_label: best.vibe_label,
        energy: best.energy,
        tempo: best.tempo,
        mood_keywords: best.keywords.slice(0, 4),
        genres: best.genres,
        search_queries: shuffled.slice(0, 8),
        color_palette: best.color_palette,
        _source: 'local'
    };
}

// ─── Dropdown Analyzer ────────────────────────────────────────────────────────
// Build description from dropdown values and feed to local analyzer
export function analyzeFromDropdowns({ mood, time, weather, activity, genre, energy }) {
    // Construct a synthetic sentence and run through the scorer
    const parts = [];
    if (mood) parts.push(mood.toLowerCase());
    if (activity) parts.push(activity.toLowerCase());
    if (weather) parts.push(weather.toLowerCase());
    if (time) parts.push(time.toLowerCase());
    const synth = parts.join(' ');

    // But also do explicit mapping for dropout combos
    const result = analyzeLocally(synth || 'chill vibes music');

    // Override energy/tempo if explicitly specified
    const energyMap = {
        'ultra low — sleepy': { energy: 'low', tempo: 'slow' },
        'low — calm': { energy: 'low', tempo: 'slow' },
        'medium — balanced': { energy: 'medium', tempo: 'medium' },
        'high — energetic': { energy: 'high', tempo: 'fast' },
        'ultra high — explosive': { energy: 'high', tempo: 'fast' }
    };
    if (energy) {
        const em = energyMap[energy.toLowerCase()];
        if (em) { result.energy = em.energy; result.tempo = em.tempo; }
    }

    // Override genre search if explicitly provided
    const genreQueryMap = {
        'lo-fi / chillhop': ['lofi hip hop', 'chillhop beats', 'Nujabes', 'J Dilla donuts', 'Knxwledge'],
        'pop': ['Taylor Swift', 'Olivia Rodrigo', 'Harry Styles', 'Dua Lipa', 'Billie Eilish'],
        'hip-hop / rap': ['Kendrick Lamar', 'Drake', 'J. Cole', 'Tyler the Creator', 'Mac Miller'],
        'indie / alternative': ['Arctic Monkeys', 'Tame Impala', 'Vampire Weekend', 'The 1975', 'Phoebe Bridgers'],
        'electronic / edm': ['Daft Punk', 'Caribou', 'Four Tet', 'Aphex Twin', 'Floating Points'],
        'r&b / soul': ['Frank Ocean', 'SZA', 'Daniel Caesar', 'H.E.R.', 'Giveon'],
        'rock': ['Arctic Monkeys', 'Foo Fighters', 'The Strokes', 'Queens of the Stone Age'],
        'classical': ['Max Richter', 'Nils Frahm', 'Ólafur Arnalds', 'Johann Johannsson'],
        'jazz': ['Miles Davis kind of blue', 'John Coltrane', 'Chet Baker', 'Bill Evans'],
        'k-pop': ['BTS dynamite', 'BLACKPINK how you like that', 'aespa next level', 'NewJeans'],
        'metal': ['Metallica', 'Slipknot', 'System of a Down', 'Pantera', 'Lamb of God']
    };
    if (genre) {
        const gk = genre.toLowerCase();
        for (const [key, queries] of Object.entries(genreQueryMap)) {
            if (gk.includes(key) || key.includes(gk)) {
                result.search_queries = [...queries, ...result.search_queries.slice(0, 4)];
                result.genres = [genre];
                break;
            }
        }
    }

    return result;
}
