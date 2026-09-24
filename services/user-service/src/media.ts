import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir } from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve('uploads');

export async function saveAvatar(file: Express.Multer.File, userId: string): Promise<string> {
  const directory = path.posix.join('profiles', userId);
  const relativePath = path.posix.join(directory, `${randomUUID()}.webp`);
  await mkdir(path.join(UPLOAD_DIR, directory), { recursive: true });
  try {
    await sharp(file.buffer)
      .rotate()
      .resize(320, 320, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(path.join(UPLOAD_DIR, relativePath));
  } catch {
    throw new BadRequestException('The uploaded file is not a supported image');
  }
  return relativePath;
}
