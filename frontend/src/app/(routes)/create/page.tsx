'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Image as ImageIcon,
  UploadCloud,
  X,
  Smile,
  MapPin,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Camera,
} from 'lucide-react';
import { postEntry } from '@/actions';

const QUICK_EMOJIS = ['❤️', '🔥', '✨', '📸', '🙌', '😍', '👏', '🎉'];

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedIsVideo = selectedFile?.type.startsWith('video/') ?? false;

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            handleSelectFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // File selection & preview
  const handleSelectFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError('Please choose a valid image or video file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setCaption((prev) => prev + emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image or video to share.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use direct FormData through the Next.js gateway proxy or server action
      const formData = new FormData();
      formData.append('file', selectedFile);
      const fullCaption = location ? `${caption}\n\n📍 ${location}` : caption;
      formData.append('caption', fullCaption);

      // Submit via server action
      const postId = await postEntry(formData);
      setIsSuccess(true);

      setTimeout(() => {
        if (postId) {
          window.location.href = `/posts/${postId}`;
        } else {
          window.location.href = '/';
        }
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Failed to create post. Please try again.');
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaption('');
    setLocation('');
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 select-none">
      <div className="bg-[#121214] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#16161a]">
          {selectedFile ? (
            <button
              type="button"
              onClick={handleReset}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="size-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="size-4" />
          )}

          <h1 className="text-sm font-semibold text-white tracking-wide">
            Create new post
          </h1>

          {selectedFile ? (
            <button
              type="button"
              disabled={isSubmitting || isSuccess}
              onClick={handleSubmit}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <span>Share</span>
              )}
            </button>
          ) : (
            <div className="size-4" />
          )}
        </div>

        {/* Content Area */}
        {isCameraOpen ? (
          <div className="flex flex-col items-center justify-center p-6 bg-black min-h-[460px] relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-h-[500px] w-full object-contain mb-4 rounded-xl"
            />
            <div className="absolute bottom-8 flex items-center gap-6">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl font-semibold text-xs text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="size-16 rounded-full bg-white border-4 border-neutral-300 hover:scale-105 active:scale-95 transition-transform"
              />
            </div>
          </div>
        ) : !selectedFile ? (
          /* Dropzone */
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center p-12 sm:p-20 text-center min-h-[460px] group cursor-pointer hover:bg-white/[0.01] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
              }}
            />

            <div className="size-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:border-neutral-700 transition-all shadow-inner">
              <UploadCloud className="size-10 text-neutral-400 group-hover:text-white transition-colors" />
            </div>

            <h2 className="text-lg font-semibold text-white mb-2">
              Drag photos and videos here
            </h2>
            <p className="text-xs text-neutral-500 max-w-sm mb-6">
              Share your favorite moments with your friends and followers.
            </p>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all shadow-lg shadow-sky-500/20"
              >
                Select from computer
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <Camera className="size-4" />
                Open Camera
              </button>
            </div>
          </div>
        ) : (
          /* Compose View */
          <div className="grid md:grid-cols-5 min-h-[480px]">
            {/* Left: Image Preview (3 cols) */}
            <div className="md:col-span-3 bg-black flex items-center justify-center relative min-h-[360px] md:min-h-full border-b md:border-b-0 md:border-r border-neutral-800 overflow-hidden">
              {previewUrl && (
                selectedIsVideo ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="max-h-[500px] w-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Post preview"
                    className="max-h-[500px] w-full object-contain"
                  />
                )
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[11px] font-semibold backdrop-blur-md border border-neutral-700/60 transition-all flex items-center gap-1.5"
              >
                <ImageIcon className="size-3.5" />
                <span>Replace media</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
                }}
              />
            </div>

            {/* Right: Caption & Details (2 cols) */}
            <div className="md:col-span-2 flex flex-col justify-between p-5 bg-[#121214]">
              <div className="flex flex-col gap-4">
                {/* User / Post Creator Bar */}
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-xs text-white">
                    U
                  </div>
                  <span className="text-xs font-semibold text-white">
                    Create Post
                  </span>
                </div>

                {/* Caption Textarea */}
                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={5}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
                    placeholder="Write a caption..."
                    className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="hover:scale-125 transition-transform p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <span>{caption.length} / 2,200</span>
                  </div>
                </div>

                {/* Location Input */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white">
                  <MapPin className="size-4 text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="w-full bg-transparent placeholder:text-neutral-500 focus:outline-none text-xs"
                  />
                  {location && (
                    <button
                      type="button"
                      onClick={() => setLocation('')}
                      className="text-neutral-500 hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Status / Alerts */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                    {error}
                  </div>
                )}

                {isSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Post published successfully! Redirecting...</span>
                  </div>
                )}
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-neutral-800 mt-4">
                <button
                  type="button"
                  disabled={isSubmitting || isSuccess}
                  onClick={handleSubmit}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-sky-500 hover:bg-sky-400 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Share Post</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}