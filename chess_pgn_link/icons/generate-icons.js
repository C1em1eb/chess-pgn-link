// Script pour générer les icônes PNG
const fs = require('fs');

// SVG de base (cavalier d'échecs stylisé)
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#769656"/>
      <stop offset="100%" style="stop-color:#5d7a3d"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="20" fill="url(#bg)"/>
  <g transform="translate(20, 15) scale(0.7)">
    <path fill="white" d="M85 15c-5 0-10 2-14 5-3-3-7-5-11-5-10 0-18 8-18 18 0 3 1 6 2 8l-25 50c-1 2-2 4-2 6 0 6 5 11 11 11h80c6 0 11-5 11-11 0-2-1-4-2-6l-25-50c1-2 2-5 2-8 0-10-8-18-18-18h9z"/>
    <path fill="#769656" d="M60 38c-6 0-10 4-10 10s4 10 10 10 10-4 10-10-4-10-10-10z"/>
  </g>
  <circle cx="100" cy="100" r="22" fill="white"/>
  <path fill="#769656" d="M100 85c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 27c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z"/>
  <path fill="#769656" d="M106 94h-4v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4h-4c-1.1 0-2 .9-2 2s.9 2 2 2h4v4c0 1.1.9 2 2 2s2-.9 2-2v-4h4c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
</svg>`;

// Sauvegarder les SVG (qui peuvent être utilisés directement)
[16, 48, 128].forEach(size => {
  fs.writeFileSync(`icon${size}.svg`, createSVG(size));
  console.log(`Created icon${size}.svg`);
});

console.log('SVG icons created! Convert to PNG for Chrome extension.');
