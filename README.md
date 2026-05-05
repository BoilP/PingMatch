# 🏓 PingMatch — Tinder за тенис на маса

Платформа за намиране на партньори за тенис на маса. Swipe, match и играй!

## Функционалности

- 🃏 **Swipe система** — прелиствай профили като Tinder (влево = отказ, вдясно = приемане)
- 🗺️ **Карта с маси** — OpenStreetMap с локации за игра в София
- 💬 **Реален чат** — съобщения в реално време след успешен мач (Supabase Realtime)
- 📊 **Статистика** — W/L рейтинг и процент на победи
- 🏆 **Ранг система** — Бронз → Сребро → Злато → Диамант → Легенда
- 📱 **PWA** — инсталируемо на телефон като нативно приложение
- 📈 **Google Analytics + Microsoft Clarity** интеграция

---

## Deployment стъпки

### 1. Supabase проект

1. Отиди на [supabase.com](https://supabase.com) и създай нов проект
2. В **SQL Editor** изпълни целия файл `supabase/schema.sql`
3. Копирай:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. В **Authentication → URL Configuration** добави:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 2. Google Analytics

1. Отиди на [analytics.google.com](https://analytics.google.com)
2. Създай Property → Web Stream → копирай **Measurement ID** (`G-XXXXXXXXXX`)
3. Попълни `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 3. Microsoft Clarity

1. Отиди на [clarity.microsoft.com](https://clarity.microsoft.com)
2. Създай нов проект → копирай **Project ID**
3. Попълни `NEXT_PUBLIC_CLARITY_PROJECT_ID`

### 4. Deploy на Vercel

```bash
# Инсталирай Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (от папката на проекта)
vercel

# Добави env variables при поискване, или после от dashboard
```

**Или:** push в GitHub и свържи с Vercel от [vercel.com/new](https://vercel.com/new)

В Vercel Dashboard → Settings → Environment Variables добави:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_CLARITY_PROJECT_ID
NEXT_PUBLIC_SITE_URL
```

### 5. Локална разработка

```bash
# Копирай env файла
cp .env.example .env.local
# Попълни .env.local с реалните стойности

# Инсталирай зависимости
npm install

# Стартирай dev сървъра
npm run dev
```

Отвори [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Технология | Употреба |
|-----------|---------|
| Next.js 14 (App Router) | Frontend + API routes |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Supabase | Auth + PostgreSQL + Realtime |
| react-tinder-card | Swipe механика |
| react-leaflet + Leaflet | Карта |
| Framer Motion | Анимации |
| @next/third-parties | Google Analytics |
| Script (Next.js) | Microsoft Clarity |

---

## Добавяне на реални снимки (аватари)

В Supabase Dashboard → Storage → създай bucket `avatars` (public).

В `app/profile/edit/page.tsx` добави file upload с:
```typescript
const { data } = await supabase.storage
  .from('avatars')
  .upload(`${userId}.jpg`, file, { upsert: true });

const url = supabase.storage.from('avatars').getPublicUrl(`${userId}.jpg`).data.publicUrl;
await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
```

---

## Ранг система

| Ранг | Точки |
|------|-------|
| 🥉 Бронз | 0–200 |
| 🥈 Сребро | 201–500 |
| 🥇 Злато | 501–1000 |
| 💎 Диамант | 1001–2000 |
| 👑 Легенда | 2001+ |

- **Победа:** +25 точки
- **Загуба:** -15 точки (минимум 0)
