import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve('uploads');

const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export type SavedMedia = { mediaPath: string; mediaType: 'image' | 'video' };

export async function saveMedia(file: Express.Multer.File): Promise<SavedMedia> {
  const videoExtension = VIDEO_EXTENSIONS[file.mimetype];
  if (!videoExtension && !file.mimetype.startsWith('image/')) {
    throw new BadRequestException('Only images and MP4, WebM or MOV videos are supported');
  }

  const now = new Date();
  const directory = path.posix.join(
    videoExtension ? 'videos' : 'posts',
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
  );
  await mkdir(path.join(UPLOAD_DIR, directory), { recursive: true });

  if (videoExtension) {
    const mediaPath = path.posix.join(directory, `${randomUUID()}.${videoExtension}`);
    await writeFile(path.join(UPLOAD_DIR, mediaPath), file.buffer);
    return { mediaPath, mediaType: 'video' };
  }

  const mediaPath = path.posix.join(directory, `${randomUUID()}.webp`);
  try {
    await sharp(file.buffer, { animated: true })
      .rotate()
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(UPLOAD_DIR, mediaPath));
  } catch {
    throw new BadRequestException('The uploaded file is not a supported image');
  }
  return { mediaPath, mediaType: 'image' };
}

export async function deleteMedia(mediaPath: string) {
  if (mediaPath.includes('/demo/')) return;
  await unlink(path.join(UPLOAD_DIR, mediaPath)).catch(() => undefined);
}
