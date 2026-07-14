# WIP!!!---EvoChat — Server

Backend untuk EvoChat: chatbot AI berbasis RAG (Retrieval-Augmented Generation). Server ini menangani ingestion dokumen knowledge base, autentikasi, percakapan chatbot, dan admin panel.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Bahasa**: TypeScript
- **Database**: PostgreSQL + pgvector (via Supabase/Neon), diakses lewat driver `postgres`
- **AI SDK**: Vercel AI SDK (`ai`) dengan provider `@ai-sdk/google` — model yang dipakai saat ini adalah Gemma (`gemma-4-31b-it`) lewat Google Generative AI
- **Embedding**: Voyage AI (`voyage-3`), dipanggil langsung lewat REST API (tanpa SDK) di `lib/embeddings.ts`
- **Auth**: Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`), dengan role custom claim (`user_role`) untuk membedakan admin/user
- **Storage**: Supabase Storage
- **Parsing dokumen**:
  - `.docx` → `mammoth` (extract raw text)
  - `.pdf` → `@llamaindex/liteparse` (parsing lokal + OCR bawaan, tidak pakai layanan cloud eksternal)
- **Linting**: ESLint 9 (`eslint-config-next`)

> Catatan: dependency `@openrouter/ai-sdk-provider` sudah terpasang di `package.json` tapi belum dipakai di kode manapun — kemungkinan disiapkan untuk provider AI alternatif di masa depan.

## Struktur Folder

```
server/
├── app/
│   ├── page.tsx                 # Landing page (masih starter default Next.js, belum dikustomisasi)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── login/
│   │   └── page.tsx              # Halaman login admin (Supabase Auth)
│   ├── admin/
│   │   ├── layout.tsx            # Layout admin panel (menu, logout)
│   │   ├── page.tsx              # Redirect ke /admin/documents
│   │   ├── chat/page.tsx         # Halaman test chat
│   │   └── documents/
│   │       ├── page.tsx          # List & upload dokumen knowledge base
│   │       └── [id]/page.tsx     # Detail dokumen & chunk hasil parsing
│   └── api/
│       ├── chat/                 # Endpoint chatbot (streaming)
│       ├── conversations/        # Riwayat percakapan
│       ├── documents/            # Upload & kelola dokumen knowledge base
│       ├── domisili-list/        # Daftar domisili cabang
│       ├── helpdesk/             # Kontak WhatsApp per domisili
│       ├── health/               # Endpoint pengecekan status DB
│       └── profile/              # Data profil user
├── lib/
│   ├── auth.ts                   # Validasi Bearer token (dipakai Flutter/mobile)
│   ├── chunk.ts                  # Chunking dokumen per-heading
│   ├── db.ts                     # Koneksi Postgres (`postgres` driver)
│   ├── embeddings.ts             # Panggil Voyage API
│   ├── extract.ts                # Extract teks dari docx (mammoth) & pdf (liteparse)
│   ├── search.ts                 # Vector similarity search (pgvector)
│   ├── storage.ts                # Upload/download file Supabase Storage
│   ├── supabase-client.ts        # Supabase client (browser, admin panel)
│   └── supabase-server.ts        # Supabase client (server, cek session cookie)
├── public/                       # Aset statis (svg, dll — masih bawaan starter Next.js)
└── proxy.ts                      # Proteksi route /admin, /login, dan /api/documents (dulu middleware.ts)
```

## Setup

### 1. Install dependency

```bash
npm install
```

### 2. Environment variables

Buat file `.env.local` di root project:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
VOYAGE_API_KEY=pa-xxxxx
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy-xxxxx
```

### 3. Setup database

Jalankan schema SQL di SQL Editor Supabase/Neon (lihat `docs/schema.sql` atau riwayat setup) untuk membuat tabel: `documents`, `document_chunks`, `conversations`, `messages`, `profiles`, `helpdesk_contacts`. Aktifkan extension `vector` terlebih dahulu.

### 4. Jalankan dev server

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`.

## Endpoint Utama

| Endpoint | Method | Auth | Keterangan |
|---|---|---|---|
| `/api/chat` | POST | Bearer token | Kirim pertanyaan, terima jawaban streaming |
| `/api/conversations` | GET | Bearer token | List riwayat percakapan user |
| `/api/conversations/[id]/messages` | GET | Bearer token | Isi 1 percakapan |
| `/api/conversations/[id]` | DELETE | Bearer token | Hapus percakapan |
| `/api/documents` | GET, POST | Cookie (admin, role `admin`) | List & upload dokumen knowledge base |
| `/api/documents/[id]` | DELETE | Cookie (admin, role `admin`) | Hapus dokumen |
| `/api/documents/[id]/chunks` | GET | Cookie (admin, role `admin`) | Lihat chunk hasil parsing |
| `/api/domisili-list` | GET | Bearer token | Daftar domisili cabang |
| `/api/helpdesk` | GET | Bearer token | Kontak WhatsApp sesuai domisili user |
| `/api/profile` | GET | Bearer token | Data profil (nama, domisili) |
| `/api/health` | GET | — | Cek koneksi database (`select now()`) |

## Alur Ingestion Dokumen

1. Admin upload file (docx/pdf) lewat `/admin/documents`
2. File diupload ke Supabase Storage
3. Teks diekstrak (`mammoth` untuk docx, `@llamaindex/liteparse` untuk pdf — parsing lokal dengan OCR otomatis)
4. Teks dipecah jadi chunk per-heading (`lib/chunk.ts`)
5. Tiap chunk di-embed via Voyage AI, disimpan ke `document_chunks` beserta vektornya
6. Dokumen bisa di-scope ke domisili cabang tertentu (kolom `domisili`, nullable = berlaku untuk semua cabang)

## Alur Chat (RAG)

1. Pertanyaan user di-embed (Voyage AI, `input_type: query`)
2. Vector similarity search ke `document_chunks`, difilter berdasarkan domisili user
3. Konteks yang relevan disusun jadi system prompt
4. Model AI (Google Generative AI — saat ini `gemma-4-31b-it`) generate jawaban streaming, hanya berdasarkan konteks yang diberikan
5. Riwayat percakapan disimpan ke `conversations` dan `messages`

## Autentikasi

- **Admin panel** (`/admin/*`, `/login`, `/api/documents/*`): Supabase Auth dengan session cookie, dicek di `proxy.ts`. Selain status login, `proxy.ts` juga memverifikasi custom claim `user_role` — hanya user dengan role `admin` yang boleh mengakses rute admin dan `/api/documents`.
- **Flutter/API mobile** (`/api/chat`, `/api/conversations`, dll): Bearer token dari Supabase Auth, divalidasi di `lib/auth.ts` menggunakan Supabase publishable key.

## Catatan Keamanan

- `SUPABASE_SECRET_KEY` bypass RLS — hanya dipakai di server, tidak pernah dikirim ke client
- Koneksi database (`DATABASE_URL`) berjalan sebagai superuser, sehingga RLS di Postgres tidak memengaruhi query dari server ini
- Jika RLS diaktifkan di Supabase, tujuannya untuk menutup akses langsung dari REST API publik (menggunakan publishable key), bukan untuk membatasi server ini
