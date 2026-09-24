import sharp = require('sharp');
import * as fs from 'fs';
import * as path from 'path';

const AVATARS = [
  { name: 'alex', initials: 'AM', color1: '#FF5E7E', color2: '#FF9966' },
  { name: 'sarah', initials: 'SC', color1: '#36D1DC', color2: '#5B86E5' },
  { name: 'marcus', initials: 'MV', color1: '#11998e', color2: '#38ef7d' },
  { name: 'elena', initials: 'ER', color1: '#FC466B', color2: '#3F5EFB' },
  { name: 'david', initials: 'DK', color1: '#8E2DE2', color2: '#4A00E0' },
];

async function main() {
  console.log('Generating seed avatar images...');
  const targetDir = path.resolve(__dirname, '../uploads/avatars');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const av of AVATARS) {
    const svg = `
      <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-${av.name}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${av.color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${av.color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="128" fill="url(#grad-${av.name})" />
        <text x="128" y="145" font-family="Arial, Helvetica, sans-serif" font-size="96" fill="#ffffff" font-weight="bold" text-anchor="middle">
          ${av.initials}
        </text>
      </svg>
    `;

    const outPath = path.join(targetDir, `${av.name}.webp`);
    await sharp(Buffer.from(svg))
      .webp({ quality: 90 })
      .toFile(outPath);
  }

  console.log(`Generated ${AVATARS.length} avatar images in ${targetDir}`);
}

main().catch((err) => {
  console.error('Avatar generation error:', err);
  process.exit(1);
});
