const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const uploads = path.join(root, 'uploads');
const profilesDemoDir = path.join(uploads, 'profiles', 'demo');
const postsDemoDir = path.join(uploads, 'posts', 'demo');
const videosDir = path.join(uploads, 'videos');
const storiesDir = path.join(uploads, 'stories');

const DEMO_ACCOUNTS = [
  { key: 'alex', sourceAvatar: 'alex.webp' },
  { key: 'sarah', sourceAvatar: 'sarah.webp' },
  { key: 'marcus', sourceAvatar: 'marcus.webp' },
  { key: 'elena', sourceAvatar: 'elena.webp' },
  { key: 'david', sourceAvatar: 'david.webp' },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyRequired(source, target) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required demo asset: ${source}`);
  }
  fs.copyFileSync(source, target);
}

function ensurePlaceholder(dir, name) {
  ensureDir(dir);
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, '');
}

function main() {
  ensureDir(profilesDemoDir);
  ensureDir(postsDemoDir);
  ensureDir(videosDir);
  ensureDir(storiesDir);

  // Exactly 5 demo profile images.
  for (const [index, account] of DEMO_ACCOUNTS.entries()) {
    copyRequired(
      path.join(uploads, 'avatars', account.sourceAvatar),
      path.join(profilesDemoDir, `demo-${String(index + 1).padStart(2, '0')}-${account.key}.webp`),
    );
  }

  // Exactly 15 demo post images: 3 per account.
  for (let index = 1; index <= 15; index += 1) {
    const source = path.join(uploads, 'posts', '2026', '09', `seed-post-${index}.webp`);
    copyRequired(source, path.join(postsDemoDir, `demo-post-${String(index).padStart(2, '0')}.webp`));
  }

  ensurePlaceholder(videosDir, '.gitkeep');
  ensurePlaceholder(storiesDir, '.gitkeep');

  const manifest = {
    demoImages: 20,
    profileImages: 5,
    postImages: 15,
    note: 'Demo media is isolated under profiles/demo and posts/demo. Runtime uploads use user-specific profile folders and dated post/video folders, so new uploads append without replacing the 20 demo assets.',
  };
  fs.writeFileSync(path.join(uploads, 'DEMO_MEDIA_MANIFEST.json'), JSON.stringify(manifest, null, 2));
  console.log('Demo media prepared: 5 profile images + 15 post images = 20 assets.');
}

main();
