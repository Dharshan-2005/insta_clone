'use server';

import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { getMediaUrl } from '@/lib/api/client';

export async function getSessionEmail(): Promise<string | null | undefined> {
  const session = await auth();
  if (session?.user?.email) return session.user.email;

  try {
    const { cookies } = await import('next/headers');
    const token = cookies().get('access_token')?.value;
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload.email;
      }
    }
  } catch {}

  return null;
}

export async function getSessionEmailOrThrow(): Promise<string> {
  const userEmail = await getSessionEmail();
  if (!userEmail) {
    throw new Error('Not logged in');
  }
  return userEmail;
}

export async function updateProfile(data: FormData) {
  await getSessionEmailOrThrow();
  
  let avatarUrl = (data.get('avatar') as string) || undefined;
  const avatarFile = data.get('avatarFile') as File | null;
  
  if (avatarFile && avatarFile.size > 0) {
    const uploadData = new FormData();
    uploadData.append('file', avatarFile);
    const res = await apiFetch('/posts/avatar', {
      method: 'POST',
      body: uploadData,
    });
    avatarUrl = res.url;
  }

  const body = {
    username: (data.get('username') as string) || undefined,
    name: (data.get('name') as string) || undefined,
    subtitle: (data.get('subtitle') as string) || undefined,
    bio: (data.get('bio') as string) || undefined,
    avatar: avatarUrl,
  };
  return apiFetch('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function postEntry(data: FormData): Promise<string> {
  await getSessionEmailOrThrow();
  const file = data.get('file') as File | null;
  const caption = (data.get('caption') as string) || (data.get('description') as string) || '';

  const forwardData = new FormData();
  if (file && typeof file !== 'string' && file.size > 0) {
    forwardData.append('file', file);
  } else {
    const rawImage = data.get('image') as string;
    if (rawImage && rawImage.startsWith('data:')) {
      const res = await fetch(rawImage);
      const blob = await res.blob();
      forwardData.append('file', blob, 'post.jpg');
    }
  }
  if (caption) {
    forwardData.append('caption', caption);
  }

  const post = await apiFetch('/posts', {
    method: 'POST',
    body: forwardData,
  });
  return post?.data?.id || post?.id || post?.data?.data?.id || '';
}

export async function postComment(data: FormData) {
  await getSessionEmailOrThrow();
  const postId = data.get('postId') as string;
  const text = data.get('text') as string;
  return apiFetch(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function likePost(data: FormData) {
  await getSessionEmailOrThrow();
  const postId = data.get('postId') as string;
  return apiFetch(`/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function removeLikeFromPost(data: FormData) {
  await getSessionEmailOrThrow();
  const postId = data.get('postId') as string;
  return apiFetch(`/posts/${postId}/like`, {
    method: 'DELETE',
  });
}

export async function getSinglePostData(postId: string) {
  const post = await apiFetch(`/posts/${postId}`).catch(() => null);
  if (!post) {
    throw new Error('Post not found');
  }

  let authorProfile = null;
  const userId = post.userId || post.author;
  if (userId) {
    authorProfile = await apiFetch(`/users/by-id/${userId}`).catch(() => null);
  }

  const comments = post.comments || [];
  const authorIds = Array.from(new Set(comments.map((c: any) => c.userId || c.author)));
  const commentsAuthors = await Promise.all(
    authorIds.map((id) => apiFetch(`/users/by-id/${id}`).catch(() => null)),
  ).then((list) => list.filter(Boolean));

  return {
    post: {
      ...post,
      author: userId,
      image: getMediaUrl(post.mediaPath || post.image),
      description: post.caption || post.description || '',
    },
    authorProfile: authorProfile || {
      id: userId || 'user',
      email: '',
      username: 'creator',
      name: 'Creator',
    },
    comments: comments.map((c: any) => ({
      ...c,
      author: c.userId || c.author,
    })),
    commentsAuthors,
    myLike: post.isLiked ? { id: 'liked', postId: post.id, author: '', createdAt: new Date() } : null,
    myBookmark: post.isBookmarked ? { id: 'bm', postId: post.id, author: '', createdAt: new Date() } : null,
  };
}

export async function followProfile(profileIdToFollow: string) {
  await getSessionEmailOrThrow();
  return apiFetch(`/users/${profileIdToFollow}/follow`, {
    method: 'POST',
  });
}

export async function unfollowProfile(profileIdToFollow: string) {
  await getSessionEmailOrThrow();
  return apiFetch(`/users/${profileIdToFollow}/follow`, {
    method: 'DELETE',
  });
}

export async function bookmarkPost(postId: string) {
  await getSessionEmailOrThrow();
  return apiFetch(`/posts/${postId}/bookmark`, {
    method: 'POST',
  });
}

export async function unbookmarkPost(postId: string) {
  await getSessionEmailOrThrow();
  return apiFetch(`/posts/${postId}/bookmark`, {
    method: 'DELETE',
  });
}