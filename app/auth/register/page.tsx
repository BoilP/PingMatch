"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, Upload, X, Video } from "lucide-react";
import { SKILL_LEVELS, BG_CITIES } from "@/types";
import type { SkillLevel } from "@/types";
import { isVideo } from "@/components/MediaUpload";

const MAX_PHOTOS = 5;
const MAX_IMG_BYTES = 10 * 1024 * 1024;
const MAX_VID_BYTES = 50 * 1024 * 1024;

interface MediaFile {
  file: File;
  preview: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Step 1 fields
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    full_name: "",
    age: "",
    city: "София",
    skill_level: "Начинаещ" as SkillLevel,
    bio: "",
  });

  // Step 3: media files (stored locally, uploaded on step 3 submit)
  const [photoFiles, setPhotoFiles] = useState<MediaFile[]>([]);
  const [videoFile, setVideoFile] = useState<MediaFile | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // STEP 1 → create account
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username, full_name: form.full_name } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Грешка при регистрация.");
      setLoading(false);
      return;
    }

    setUserId(data.user.id);
    setLoading(false);
    setStep(2);
  }

  // STEP 2 → update profile info
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("profiles").update({
      full_name: form.full_name || null,
      age: form.age ? parseInt(form.age) : null,
      city: form.city,
      skill_level: form.skill_level as string,
      bio: form.bio || null,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    setLoading(false);
    setStep(3);
  }

  // STEP 3 → upload media and finish
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { router.push("/discover"); return; }

    const allFiles = [...photoFiles, ...(videoFile ? [videoFile] : [])];
    if (allFiles.length === 0) { router.push("/discover"); return; }

    setLoading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < allFiles.length; i++) {
      setUploadProgress(`Качване ${i + 1}/${allFiles.length}...`);
      const { file } = allFiles[i];
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("player-media").upload(path, file);
      if (upErr) { setError("Грешка при качване: " + upErr.message); setLoading(false); return; }
      const url = supabase.storage.from("player-media").getPublicUrl(path).data.publicUrl;
      uploadedUrls.push(url);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("profiles").update({
      media_urls: uploadedUrls,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    router.push("/discover");
  }

  function addPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photoFiles.length);
    setMediaError(null);
    const valid: MediaFile[] = [];
    for (const f of files) {
      if (f.size > MAX_IMG_BYTES) { setMediaError("Снимката трябва да е под 10 MB."); continue; }
      valid.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setPhotoFiles(prev => [...prev, ...valid]);
    e.target.value = "";
  }

  function addVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_VID_BYTES) { setMediaError("Видеото трябва да е под 50 MB."); return; }
    setMediaError(null);
    if (videoFile) URL.revokeObjectURL(videoFile.preview);
    setVideoFile({ file: f, preview: URL.createObjectURL(f) });
    e.target.value = "";
  }

  function removePhoto(idx: number) {
    URL.revokeObjectURL(photoFiles[idx].preview);
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
  }

  const stepLabels = ["Акаунт", "Профил", "Снимки"];

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <span className="text-4xl">🏓</span>
            <span className="text-2xl font-extrabold">
              Ping<span className="text-primary">Match</span>
            </span>
          </Link>
          <p className="text-muted mt-2 text-sm">
            Стъпка {step} от 3 — {stepLabels[step - 1]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {([1, 2, 3] as const).map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {/* ── STEP 1: credentials ── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Имейл</label>
              <input type="email" required value={form.email}
                onChange={e => update("email", e.target.value)}
                placeholder="email@example.com" className="auth-input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Потребителско име</label>
              <input type="text" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+"
                value={form.username} onChange={e => update("username", e.target.value)}
                placeholder="pingmaster99" className="auth-input" />
              <p className="text-xs text-muted mt-1">Само латиница, цифри и _</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Парола</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required minLength={6}
                  value={form.password} onChange={e => update("password", e.target.value)}
                  placeholder="Мин. 6 символа" className="auth-input pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Регистрация..." : "Следващо →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: profile info ── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Пълно име <span className="text-muted">(по желание)</span></label>
              <input type="text" value={form.full_name} onChange={e => update("full_name", e.target.value)}
                placeholder="Иван Иванов" className="auth-input" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/80 mb-1.5">Възраст</label>
                <input type="number" min={10} max={100} value={form.age}
                  onChange={e => update("age", e.target.value)}
                  placeholder="25" className="auth-input" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/80 mb-1.5">Град</label>
                <select value={form.city} onChange={e => update("city", e.target.value)} className="auth-input">
                  {BG_CITIES.map(c => (
                    <option key={c} value={c} className="bg-card">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Ниво на игра</label>
              <select value={form.skill_level}
                onChange={e => update("skill_level", e.target.value as SkillLevel)}
                className="auth-input">
                {SKILL_LEVELS.map(s => (
                  <option key={s} value={s} className="bg-card">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Кратко представяне <span className="text-muted">(по желание)</span></label>
              <textarea value={form.bio} onChange={e => update("bio", e.target.value)}
                placeholder="Играя тенис на маса от 5 години..."
                rows={3} maxLength={160} className="auth-input resize-none" />
            </div>

            {error && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Запазване..." : "Следващо →"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn-secondary w-full">← Назад</button>
          </form>
        )}

        {/* ── STEP 3: media upload ── */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-5">
            <div className="text-center space-y-1 mb-2">
              <p className="text-white font-semibold">Добави снимки и видео</p>
              <p className="text-muted text-sm">Покажи как играеш! Можеш да пропуснеш това стъпка.</p>
            </div>

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/80">Снимки ({photoFiles.length}/{MAX_PHOTOS})</span>
                {photoFiles.length < MAX_PHOTOS && (
                  <button type="button" onClick={() => imgRef.current?.click()}
                    className="text-xs text-primary hover:underline">+ Добави</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {photoFiles.map((mf, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border">
                    {isVideo(mf.file.name) ? (
                      <video src={mf.preview} className="w-full h-full object-cover" />
                    ) : (
                      <Image src={mf.preview} alt={`Снимка ${i + 1}`} fill className="object-cover" />
                    )}
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 hover:bg-danger transition-colors">
                      <X size={11} className="text-white" />
                    </button>
                  </div>
                ))}
                {photoFiles.length < MAX_PHOTOS && (
                  <button type="button" onClick={() => imgRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:border-primary hover:text-primary transition-colors">
                    <Upload size={20} />
                    <span className="text-xs">Добави</span>
                  </button>
                )}
              </div>
              <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
            </div>

            {/* Video */}
            <div>
              <span className="text-sm font-medium text-white/80 block mb-2">Видео как играеш (по желание)</span>
              {videoFile ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-card">
                  <video src={videoFile.preview} className="w-full max-h-40 object-cover" controls playsInline />
                  <button type="button" onClick={() => { URL.revokeObjectURL(videoFile.preview); setVideoFile(null); }}
                    className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-danger transition-colors">
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => vidRef.current?.click()}
                  className="w-full h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted hover:border-primary hover:text-primary transition-colors">
                  <Video size={22} />
                  <span className="text-xs">Добави видео (макс. 50 MB)</span>
                </button>
              )}
              <input ref={vidRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={addVideo} />
            </div>

            {(mediaError || error) && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                {mediaError || error}
              </p>
            )}

            {uploadProgress && (
              <p className="text-primary text-sm text-center">{uploadProgress}</p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? uploadProgress || "Качване..." : "Готово — влез в играта 🏓"}
            </button>

            <button type="button" onClick={() => router.push("/discover")}
              className="btn-secondary w-full text-sm">
              Пропусни
            </button>
          </form>
        )}

        <p className="text-center text-muted mt-6 text-sm">
          Вече имаш акаунт?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">Влез</Link>
        </p>
      </div>
    </main>
  );
}
