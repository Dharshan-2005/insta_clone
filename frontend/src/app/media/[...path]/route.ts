import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!params.path || params.path.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Sanitize path segments to prevent directory traversal
  const safeSegments = params.path.filter(
    (seg) => !seg.includes('..') && !seg.includes('/') && !seg.includes('\\')
  );

  if (safeSegments.length === 0) {
    return new NextResponse('Invalid Path', { status: 400 });
  }

  const relativePath = safeSegments.join(path.sep);

  // Candidate root directories where uploads might be located
  const candidateRoots = [
    path.resolve(process.cwd(), '../uploads'),
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), 'public/media'),
    process.env.UPLOAD_DIR,
  ].filter(Boolean) as string[];

  let foundFilePath: string | null = null;

  for (const root of candidateRoots) {
    const fullPath = path.join(root, relativePath);
    if (fs.existsSync(fullPath)) {
      foundFilePath = fullPath;
      break;
    }
  }

  if (!foundFilePath) {
    return new NextResponse('Media Not Found', { status: 404 });
  }

  try {
    const buffer = await fs.promises.readFile(foundFilePath);
    const ext = path.extname(foundFilePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    console.error('[Media Route Error]', err);
    return new NextResponse('Error loading media', { status: 500 });
  }
}
