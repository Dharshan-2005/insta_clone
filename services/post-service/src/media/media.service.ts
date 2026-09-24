import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), '../../uploads');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async processAndSaveMedia(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No media file provided');

    const mime = (file.mimetype || '').toLowerCase();
    if (mime.startsWith('video/')) {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedVideoTypes.includes(mime)) {
        throw new BadRequestException('Unsupported video format. Please upload MP4, WebM, or MOV.');
      }

      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const targetDir = path.join(this.baseUploadDir, 'videos', year, month);
      fs.mkdirSync(targetDir, { recursive: true });

      const extension = mime === 'video/webm' ? '.webm' : mime === 'video/quicktime' ? '.mov' : '.mp4';
      const filename = `${uuidv4()}${extension}`;
      const fullFilePath = path.join(targetDir, filename);
      await fs.promises.writeFile(fullFilePath, file.buffer);
      const stats = await fs.promises.stat(fullFilePath);

      return {
        path: path.posix.join('videos', year, month, filename),
        thumbnailPath: undefined,
        mimeType: mime,
        width: undefined,
        height: undefined,
        size: stats.size,
      };
    }

    return this.processAndSaveImageWithThumbnail(file);
  }

  async processAndSaveImageWithThumbnail(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExts.includes(ext)) {
      throw new BadRequestException('Unsupported file format. Please upload JPG, PNG, WEBP, or GIF.');
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const relativeSubdir = path.join('posts', year, month);
    const targetDir = path.join(this.baseUploadDir, relativeSubdir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const id = uuidv4();
    const filename = `${id}.webp`;
    const thumbFilename = `${id}_thumb.webp`;
    const fullFilePath = path.join(targetDir, filename);
    const thumbFilePath = path.join(targetDir, thumbFilename);

    const metadata = await sharp(file.buffer).metadata();

    await sharp(file.buffer)
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fullFilePath);

    await sharp(file.buffer)
      .resize({ width: 320, height: 320, fit: 'cover' })
      .webp({ quality: 75 })
      .toFile(thumbFilePath);

    const stats = fs.existsSync(fullFilePath) ? fs.statSync(fullFilePath) : { size: file.size };

    return {
      path: path.posix.join('posts', year, month, filename),
      thumbnailPath: path.posix.join('posts', year, month, thumbFilename),
      mimeType: 'image/webp',
      width: metadata.width || 1080,
      height: metadata.height || 1080,
      size: stats.size,
    };
  }

  async processAndSaveImage(file: Express.Multer.File): Promise<string> {
    const res = await this.processAndSaveImageWithThumbnail(file);
    return res.path;
  }

  async processAndSaveAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file) throw new BadRequestException('No image file provided');

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExts.includes(ext)) {
      throw new BadRequestException('Unsupported file format. Please upload JPG, PNG, WEBP, or GIF.');
    }

    const relativeSubdir = path.join('profiles', userId);
    const targetDir = path.join(this.baseUploadDir, relativeSubdir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    } else {
      // Clear old avatars
      try {
        const files = fs.readdirSync(targetDir);
        for (const f of files) {
          fs.unlinkSync(path.join(targetDir, f));
        }
      } catch (e) {
        console.error('Failed to clear old avatars', e);
      }
    }

    const filename = `${uuidv4()}.webp`;
    const fullFilePath = path.join(targetDir, filename);

    await sharp(file.buffer)
      .resize({ width: 256, height: 256, fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(fullFilePath);

    return path.posix.join('profiles', userId, filename);
  }
}
