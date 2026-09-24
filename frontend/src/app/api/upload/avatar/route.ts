import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();
    let userId = (session?.user as any)?.id;
    let userEmail = session?.user?.email;

    if (!userId || !userEmail) {
      const cookieStore = cookies();
      const token = cookieStore.get('access_token')?.value;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            userId = userId || payload.sub;
            userEmail = userEmail || payload.email;
          }
        } catch {}
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Extract file from multipart form data
    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('avatarFile') || formData.get('avatar')) as File | null;

    if (!file || typeof file === 'string' || file.size === 0) {
      return NextResponse.json(
        { success: false, message: 'No image file provided' },
        { status: 400 }
      );
    }

    const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedAvatarTypes.has(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Please upload a valid image file (PNG, JPG, WebP)' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Image must be under 10MB' },
        { status: 400 }
      );
    }

    // 3. Determine upload directories (both uploads/ and frontend/public/media/ for instant serving)
    const baseUploadDir = path.resolve(process.cwd(), '../uploads');
    const publicMediaDir = path.resolve(process.cwd(), 'public/media');
    const relativeSubdir = path.join('profiles', userId);

    const targetUploadDir = path.join(baseUploadDir, relativeSubdir);
    const targetPublicDir = path.join(publicMediaDir, relativeSubdir);

    // Create directories if missing
    if (!fs.existsSync(targetUploadDir)) {
      fs.mkdirSync(targetUploadDir, { recursive: true });
    }
    if (!fs.existsSync(targetPublicDir)) {
      fs.mkdirSync(targetPublicDir, { recursive: true });
    }

    // Generate unique filename
    const extByType: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
    const ext = extByType[file.type] || '.webp';
    const filename = `${crypto.randomUUID()}${ext}`;
    const uploadFilePath = path.join(targetUploadDir, filename);
    const publicFilePath = path.join(targetPublicDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to storage
    await fs.promises.writeFile(uploadFilePath, buffer);
    try {
      await fs.promises.writeFile(publicFilePath, buffer);
    } catch {}

    const mediaUrl = `/media/profiles/${userId}/${filename}`;

    // 4. Update user profile in user-service
    try {
      await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatar: mediaUrl }),
      });
    } catch (err: any) {
      console.warn('Failed to update user-service profile avatar immediately:', err?.message);
    }

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      data: { url: mediaUrl },
    });
  } catch (error: any) {
    console.error('[Avatar Upload Route Error]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
