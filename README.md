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


## Struktur Folder

``` text
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
│   │   ├── documents/
│   │   │   ├── page.tsx          # List & upload dokumen knowledge base
│   │   │   └── [id]/page.tsx     # Detail dokumen & chunk hasil parsing
│   │   ├── domisili/page.tsx     # Kelola daftar domisili cabang
│   │   ├── feedback/page.tsx     # Lihat feedback (up/down) pengguna atas jawaban bot
│   │   ├── helpdesk/page.tsx     # Kelola kontak WhatsApp per domisili
│   │   └── users/page.tsx        # List user terdaftar (join auth.users + profiles)
│   └── api/
│       ├── chat/                 # Endpoint chatbot (streaming)
│       ├── conversations/        # Riwayat percakapan
│       │   └── [id]/messages/    # Isi 1 percakapan
│       ├── messages/
│       │   └── [id]/feedback/    # Kirim feedback up/down untuk 1 jawaban bot
│       ├── documents/            # Upload & kelola dokumen knowledge base
│       │   └── [id]/chunks/      # Lihat chunk hasil parsing 1 dokumen
│       ├── domisili-list/        # Daftar domisili cabang (untuk mobile)
│       ├── helpdesk/             # Kontak WhatsApp per domisili user
│       ├── health/               # Endpoint pengecekan status DB
│       ├── profile/              # Data profil user
│       └── admin/                # Endpoint khusus admin panel
│           ├── dashboard/        # Ringkasan statistik (dokumen, chat, feedback, user)
│           ├── domisili/         # CRUD daftar domisili cabang
│           ├── helpdesk-contacts/# CRUD kontak WhatsApp helpdesk
│           ├── feedback/         # List feedback up/down beserta Q&A-nya
│           └── users/            # List user terdaftar
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

Jalankan schema SQL di SQL Editor Supabase/Neon (lihat `docs/schema.sql` atau riwayat setup) untuk membuat tabel berikut. Aktifkan extension `vector` terlebih dahulu.

| Tabel | Keterangan |
| --- | --- |
| `documents` | Metadata dokumen (`title`, `mime_type`, `status`: processing/ready/failed, `error_message`, `file_path`, `domisili` nullable) |
| `document_chunks` | Hasil chunking + `embedding` vector, `heading_path`, `chunk_index`, relasi ke `documents` (cascade delete) |
| `conversations` | Riwayat percakapan per user (`title`, `user_id`) |
| `messages` | Isi pesan (`role`: user/assistant, `content`, **`feedback`**: `up`/`down`/`null`), relasi ke `conversations` (cascade delete) |
| `profiles` | Profil tambahan user (`nama`, `domisili`), relasi 1:1 ke `auth.users` bawaan Supabase |
| `domisili` | Master data nama domisili cabang (`nama`) |
| `helpdesk_contacts` | Kontak WhatsApp helpdesk per domisili (`domisili`, `label`, `pic_name`, `whatsapp_number`) |

Catatan: endpoint `/api/admin/users` dan dashboard membaca langsung dari tabel `auth.users` milik Supabase Auth (bukan tabel custom), di-join dengan `profiles`.

### 4. Jalankan dev server

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`.

## Endpoint Utama

### Mobile / user (Bearer token)

| Endpoint | Method | Auth | Keterangan |
| --- | --- | --- | --- |
| `/api/chat` | POST | Bearer token | Kirim pertanyaan, terima jawaban streaming (RAG), simpan riwayat |
| `/api/conversations` | GET | Bearer token | List riwayat percakapan user |
| `/api/conversations/[id]/messages` | GET | Bearer token | Isi 1 percakapan |
| `/api/conversations/[id]` | DELETE | Bearer token | Hapus percakapan (message ikut terhapus via cascade) |
| `/api/messages/[id]/feedback` | POST | Bearer token | Kirim/ubah feedback (`up`/`down`/`null`) untuk 1 jawaban bot |
| `/api/domisili-list` | GET | — | Daftar nama domisili cabang (untuk pilihan di app) |
| `/api/helpdesk` | GET | Bearer token | Kontak WhatsApp sesuai domisili user yang login |
| `/api/profile` | GET | Bearer token | Data profil (email, nama, domisili) |
| `/api/health` | GET | — | Cek koneksi database (`select now()`) |

### Admin panel (session cookie, role `admin`)

Semua rute di bawah ini dan `/api/documents/*` dijaga oleh `proxy.ts` — request tanpa sesi valid atau tanpa claim `user_role = admin` ditolak (401/403).

| Endpoint | Method | Keterangan |
| --- | --- | --- |
| `/api/documents` | GET, POST | List & upload dokumen knowledge base (memicu ingestion) |
| `/api/documents/[id]` | DELETE | Hapus dokumen + file di storage + chunk terkait |
| `/api/documents/[id]/chunks` | GET | Lihat isi chunk hasil parsing 1 dokumen |
| `/api/admin/dashboard` | GET | Ringkasan statistik: jumlah dokumen per status, total percakapan (+minggu ini), feedback up/down, jumlah user, domisili, kontak helpdesk |
| `/api/admin/domisili` | GET, POST | List & tambah domisili cabang |
| `/api/admin/helpdesk-contacts` | GET, POST | List & tambah kontak WhatsApp helpdesk per domisili |
| `/api/admin/feedback` | GET | List pesan yang diberi feedback (`up`/`down`/`all`), lengkap dengan pertanyaan sebelumnya — mendukung `limit`/`offset` pagination |
| `/api/admin/users` | GET | List semua user terdaftar (join `auth.users` + `profiles`) |

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

- **Admin panel** (`/admin/*`, `/login`, `/api/documents/*`, `/api/admin/*`): Supabase Auth dengan session cookie, dicek di `proxy.ts` (matcher: `/admin/:path*`, `/api/documents/:path*`, `/api/admin/:path*`, `/login`). Selain status login (via `getClaims()`), `proxy.ts` juga memverifikasi custom claim `user_role` — hanya user dengan role `admin` yang boleh lewat; user biasa yang mencoba akses rute ini dapat 403 (API) atau redirect ke `/unauthorized` (halaman).
- **Flutter/API mobile** (`/api/chat`, `/api/conversations`, `/api/messages/[id]/feedback`, `/api/helpdesk`, `/api/profile`, dll): **tidak** melewati `proxy.ts`. Tiap route memvalidasi Bearer token sendiri lewat `getUserFromRequest()` di `lib/auth.ts` menggunakan Supabase publishable key.
- `/api/domisili-list` dan `/api/health` tidak memerlukan autentikasi sama sekali.

## Catatan Keamanan

- `SUPABASE_SECRET_KEY` bypass RLS — hanya dipakai di server, tidak pernah dikirim ke client
- Koneksi database (`DATABASE_URL`) berjalan sebagai superuser, sehingga RLS di Postgres tidak memengaruhi query dari server ini
- Jika RLS diaktifkan di Supabase, tujuannya untuk menutup akses langsung dari REST API publik (menggunakan publishable key), bukan untuk membatasi server ini
