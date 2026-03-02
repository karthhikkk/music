// Color Extractor — Canvas-based dominant color extraction from album art

/**
 * Loads an image via a CORS proxy and extracts the dominant colors.
 * Returns { primary, secondary, r, g, b }
 */
export async function extractColors(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const size = 50; // sample at small size for performance
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);

                const imageData = ctx.getImageData(0, 0, size, size).data;
                const palette = samplePalette(imageData);

                resolve(palette);
            } catch (e) {
                // Canvas tainted (CORS) — return a default palette
                resolve(defaultPalette());
            }
        };

        img.onerror = () => resolve(defaultPalette());

        // Use a CORS-friendly URL approach — Spotify CDN usually allows CORS
        img.src = imageUrl;
    });
}

function samplePalette(data) {
    const buckets = {};
    const step = 4; // sample every Nth pixel

    for (let i = 0; i < data.length; i += 4 * step) {
        const r = Math.round(data[i] / 40) * 40;
        const g = Math.round(data[i + 1] / 40) * 40;
        const b = Math.round(data[i + 2] / 40) * 40;
        const a = data[i + 3];
        if (a < 128) continue; // skip transparent

        // Skip near-white and near-black
        const brightness = (r + g + b) / 3;
        if (brightness > 220 || brightness < 20) continue;

        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
    }

    const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);

    if (!sorted.length) return defaultPalette();

    const [r1, g1, b1] = sorted[0][0].split(',').map(Number);
    const primary = `rgb(${r1},${g1},${b1})`;

    // Pick secondary far enough from primary
    let secondary = primary;
    for (const [key] of sorted.slice(1)) {
        const [r2, g2, b2] = key.split(',').map(Number);
        const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
        if (dist > 60) {
            secondary = `rgb(${r2},${g2},${b2})`;
            break;
        }
    }

    return { primary, secondary, r: r1, g: g1, b: b1 };
}

function defaultPalette() {
    return { primary: 'rgb(124,58,237)', secondary: 'rgb(219,39,119)', r: 124, g: 58, b: 237 };
}

/**
 * Given a list of tracks (each potentially with a color result),
 * compute the dominant playlist gradient from the most common album color.
 */
export function computePlaylistGradient(colorResults, moodColors) {
    // Use the mood's AI-suggested colors as base, then blend with actual album colors
    const [primary, secondary] = [
        moodColors?.primary || '#7c3aed',
        moodColors?.secondary || '#db2777'
    ];

    if (!colorResults?.length) {
        return `radial-gradient(ellipse at 0% 0%, ${primary}55 0%, transparent 60%), 
            radial-gradient(ellipse at 100% 100%, ${secondary}55 0%, transparent 60%)`;
    }

    // Use the first card's color as base for the main gradient
    const c = colorResults[0];
    const col1 = `rgba(${c.r},${c.g},${c.b},0.6)`;

    const c2 = colorResults[Math.min(2, colorResults.length - 1)];
    const col2 = `rgba(${c2.r},${c2.g},${c2.b},0.4)`;

    return `radial-gradient(ellipse at 0% 0%, ${col1} 0%, transparent 55%), 
          radial-gradient(ellipse at 100% 100%, ${col2} 0%, transparent 55%),
          radial-gradient(ellipse at 50% 50%, ${primary}22 0%, transparent 70%)`;
}
