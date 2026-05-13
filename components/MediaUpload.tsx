"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, Video, ImageIcon } from "lucide-react";

interface MediaUploadProps {
  userId: string;
  currentUrls: string[];
  onUpdate: (urls: string[]) => void;
}

const MAX_PHOTOS = 5;
const MAX_IMG_BYTES = 10 * 1024 * 1024;
const MAX_VID_BYTES = 50 * 1024 * 1024;

export function isVideo(url: string) {
  return /\.(mp4|mov|webm)(\?.*)?$/i.test(url);
}

export default function MediaUpload({ userId, currentUrls, onUpdate }: MediaUploadProps) {
  const supabase = createClient();
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photos = currentUrls.filter(u => !isVideo(u));
  const videos = currentUrls.filter(u => isVideo(u));

  async function upload(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: err } = await supabase.storage.from("player-media").upload(path, file);
    if (err) { setError("Грешка при качване: " + err.message); return null; }
    return supabase.storage.from("player-media").getPublicUrl(path).data.publicUrl;
  }

  async function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) return;
    setError(null);
    setUploading(true);
    const newUrls: string[] = [];
    for (const f of files) {
      if (f.size > MAX_IMG_BYTES) { setError("Снимката трябва да е под 10 MB."); continue; }
      const url = await upload(f);
      if (url) newUrls.push(url);
    }
    onUpdate([...currentUrls, ...newUrls]);
    setUploading(false);
    e.target.value = "";
  }

  async function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VID_BYTES) { setError("Видеото трябва да е под 50 MB."); return; }
    setError(null);
    setUploading(true);
    const url = await upload(file);
    if (url) onUpdate([...currentUrls, url]);
    setUploading(false);
    e.target.value = "";
  }

  async function remove(url: string) {
    const path = url.split("/player-media/")[1];
    if (path) await supabase.storage.from("player-media").remove([path]);
    onUpdate(currentUrls.filter(u => u !== url));
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">
            Снимки ({photos.length}/{MAX_PHOTOS})
          </span>
          {photos.length < MAX_PHOTOS && (
            <button type="button" onClick={() => imgRef.current?.click()} disabled={uploading}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <ImageIcon size={11} /> Добави
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border">
              <Image src={url} alt={`Снимка ${i + 1}`} fill className="object-cover" />
              <button type="button" onClick={() => remove(url)}
                className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 hover:bg-danger transition-colors">
                <X size={11} className="text-white" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button type="button" onClick={() => imgRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-40">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-xs">Добави</span>
            </button>
          )}
        </div>
        <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImages} />
      </div>

      {/* Video */}
      <div>
        <span className="text-sm font-medium text-white/80 block mb-2">
          Видео как играеш ({videos.length}/1)
        </span>
        {videos[0] ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-card">
            <video src={videos[0]} className="w-full max-h-44 object-cover" controls playsInline />
            <button type="button" onClick={() => remove(videos[0])}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-danger transition-colors">
              <X size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => vidRef.current?.click()} disabled={uploading}
            className="w-full h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-40">
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <Video size={22} />}
            <span className="text-xs">Добави видео (макс. 50 MB)</span>
          </button>
        )}
        <input ref={vidRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleVideo} />
      </div>
    </div>
  );
}
