import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink } from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve('uploads');

export async function saveStoryImage(file: Express.Multer.File, userId: string): Promise<string> {
  if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Stories must be images');

  const directory = path.posix.join('stories', userId);
  const relativePath = path.posix.join(directory, `${randomUUID()}.webp`);
  await mkdir(path.join(UPLOAD_DIR, directory), { recursive: true });
  try {
    await sharp(file.buffer)
      .rotate()
      .resize(1080, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(UPLOAD_DIR, relativePath));
  } catch {
    throw new BadRequestException('The uploaded file is not a supported image');
  }
  return relativePath;
}

export async function deleteStoryImage(mediaPath: string) {
  await unlink(path.join(UPLOAD_DIR, mediaPath)).catch(() => undefined);
}
