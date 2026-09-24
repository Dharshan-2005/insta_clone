'use client';

import { Camera, ImagePlus, MapPin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { Post } from '@/lib/types';

type Mode = 'post' | 'story';

const ACCEPT: Record<Mode, string> = {
  post: 'image/*,video/mp4,video/webm,video/quicktime',
  story: 'image/*',
};

export default function CreateForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    const isVideo = selected.type.startsWith('video/');
    if (!selected.type.startsWith('image/') && !(isVideo && mode === 'post')) {
      setError(mode === 'story' ? 'Stories must be images' : 'Choose an image or video');
      return;
    }
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError('Camera access was denied or is unavailable');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) selectFile(new File([blob], 'camera.jpg', { type: 'image/jpeg' }));
        closeCamera();
      },
      'image/jpeg',
      0.92,
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      if (caption.trim()) body.append('caption', caption);
      if (mode === 'post') {
        if (location.trim()) body.append('location', location);
        const post = await api.post<Post>('/posts', body);
        router.push(`/posts/${post.id}`);
      } else {
        await api.post('/stories', body);
        router.push('/');
      }
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === 'story' && file?.type.startsWith('video/')) reset();
  };

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-xl border border-neutral-800">
      <div className="flex border-b border-neutral-800">
        {(['post', 'story'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => switchMode(option)}
            className={`flex-1 py-3 text-sm font-semibold capitalize ${
              mode === option ? 'border-b-2 border-white' : 'text-neutral-500'
            }`}
          >
            {`New ${option}`}
          </button>
        ))}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT[mode]}
        className="hidden"
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {cameraOpen ? (
        <div className="relative flex min-h-[420px] items-center justify-center bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="max-h-[520px] w-full object-contain" />
          <div className="absolute bottom-6 flex items-center gap-6">
            <button type="button" onClick={closeCamera} className="rounded-lg bg-neutral-800 px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="button" onClick={capture} aria-label="Take photo" className="size-16 rounded-full border-4 border-neutral-400 bg-white" />
          </div>
        </div>
      ) : !file || !preview ? (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectFile(event.dataTransfer.files[0]);
          }}
          className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <ImagePlus className="size-16" strokeWidth={1} />
          <p className="text-lg">Drag {mode === 'post' ? 'photos and videos' : 'a photo'} here</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold hover:bg-sky-600"
            >
              Select from computer
            </button>
            <button
              type="button"
              onClick={openCamera}
              className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold hover:bg-neutral-700"
            >
              <Camera className="size-4" /> Camera
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="relative flex min-h-[360px] items-center justify-center bg-black">
            {file.type.startsWith('video/') ? (
              <video src={preview} controls playsInline className="max-h-[520px] w-full object-contain" />
            ) : (
              <img src={preview} alt="Preview" className="max-h-[520px] w-full object-contain" />
            )}
            <button
              type="button"
              onClick={reset}
              aria-label="Remove"
              className="absolute right-3 top-3 rounded-full bg-black/70 p-1.5 hover:bg-black"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-col gap-4 border-t border-neutral-800 p-4 md:border-l md:border-t-0">
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={mode === 'post' ? 2200 : 200}
              rows={6}
              placeholder={mode === 'post' ? 'Write a caption…' : 'Add text to your story…'}
              className="resize-none bg-transparent text-sm outline-none placeholder:text-neutral-500"
            />
            {mode === 'post' && (
              <label className="flex items-center gap-2 border-t border-neutral-800 pt-4 text-sm">
                <MapPin className="size-4 text-neutral-400" />
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={100}
                  placeholder="Add location"
                  className="flex-1 bg-transparent outline-none placeholder:text-neutral-500"
                />
              </label>
            )}
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-auto rounded-lg bg-sky-500 py-2 text-sm font-semibold hover:bg-sky-600 disabled:opacity-60"
            >
              {submitting ? 'Sharing…' : mode === 'post' ? 'Share post' : 'Share to story'}
            </button>
          </div>
        </div>
      )}
      {error && !file && <p className="px-4 pb-4 text-center text-sm text-rose-400">{error}</p>}
    </form>
  );
}
