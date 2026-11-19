// Renders the app icons in public/icons from the gold doorway mark in
// app/_components/mehman-logo.tsx. Run with: node scripts/make-icons.mjs
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const PINE = "#1a110b";
const GOLD = "#e8c08f";

const mark = `
  <g stroke="${GOLD}" stroke-linecap="round" fill="none">
    <path d="M37 82V40c0-14 10-25 23-30 13 5 23 16 23 30v42" stroke-width="2.5"/>
    <path d="M10 82h100" stroke-width="2.5"/>
    <path d="M10 82c-3-3-1-7 3-6M110 82c3-3 1-7-3-6" stroke-width="2"/>
  </g>
  <circle cx="60" cy="8.5" r="2" fill="${GOLD}"/>
  <path fill="${GOLD}" fill-rule="evenodd" d="M44 82V45c0-9 6-16 16-24 10 8 16 15 16 24v37Zm7 0V55c0-6 4-11 9-16 5 5 9 10 9 16v27Z"/>
  <g fill="${GOLD}">
    <ellipse cx="22" cy="74" rx="5" ry="2.2" transform="rotate(-25 22 74)"/>
    <ellipse cx="27" cy="66" rx="4.5" ry="2" transform="rotate(-65 27 66)"/>
    <ellipse cx="32" cy="73" rx="3.5" ry="1.6" transform="rotate(-80 32 73)"/>
    <ellipse cx="98" cy="74" rx="5" ry="2.2" transform="rotate(25 98 74)"/>
    <ellipse cx="93" cy="66" rx="4.5" ry="2" transform="rotate(65 93 66)"/>
    <ellipse cx="88" cy="73" rx="3.5" ry="1.6" transform="rotate(80 88 73)"/>
  </g>`;

// The mark is 120 x 94. `fill` is how much of the icon's width it takes:
// a maskable icon keeps it inside the central 80% safe zone.
function svg(size, fill, rounded) {
  const w = size * fill;
  const scale = w / 120;
  const x = (size - w) / 2;
  const y = (size - 94 * scale) / 2 - size * 0.02;
  const radius = rounded ? size * 0.22 : 0;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${PINE}"/>
    <g transform="translate(${x} ${y}) scale(${scale})">${mark}</g>
  </svg>`);
}

mkdirSync("public/icons", { recursive: true });
const outputs = [
  ["public/icons/icon-192.png", 192, 0.72, false],
  ["public/icons/icon-512.png", 512, 0.72, false],
  ["public/icons/maskable-512.png", 512, 0.56, false],
  ["public/icons/maskable-192.png", 192, 0.56, false],
  ["public/icons/apple-touch-icon.png", 180, 0.68, false],
];
for (const [file, size, fill, rounded] of outputs) {
  await sharp(svg(size, fill, rounded)).png().toFile(file);
  console.log("wrote", file);
}
