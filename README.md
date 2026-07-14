# WIP!!!---EvoChat — Server

Backend untuk EvoChat: chatbot AI berbasis RAG (Retrieval-Augmented Generation). Server ini menangani ingestion dokumen knowledge base, autentikasi, percakapan chatbot, dan admin panel.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL + pgvector (via Supabase/Neon)
- **AI Model**: Google Gemini (`gemini-2.5-flash`) via `@ai-sdk/google`
- **Embedding**: Voyage AI (`voyage-3`)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Parsing dokumen**: `mammoth` (docx), Unstructured API (pdf)

## Struktur Folder

```
server/
├── app/
│   ├── admin/                  # Halaman admin panel (login, kelola dokumen, test chat)
│   └── api/
│       ├── chat/                # Endpoint chatbot (streaming)
│       ├── conversations/       # Riwayat percakapan
│       ├── documents/           # Upload & kelola dokumen knowledge base
│       ├── domisili-list/       # Daftar domisili cabang
│       ├── helpdesk/            # Kontak WhatsApp per domisili
│       ├── health/              # Endpoint pengecekan status APi
│       └── profile/             # Data profil user
├── lib/
│   ├── auth.ts                  # Validasi Bearer token (dipakai Flutter)
│   ├── chunk.ts                 # Chunking dokumen per-heading
│   ├── db.ts                    # Koneksi Postgres
│   ├── embeddings.ts            # Panggil Voyage API
│   ├── extract.ts               # Extract teks dari docx/pdf
│   ├── search.ts                # Vector similarity search
│   ├── storage.ts               # Upload/download file Supabase Storage
│   ├── supabase-client.ts       # Supabase client (browser, admin panel)
│   └── supabase-server.ts       # Supabase client (server, cek session cookie)
└── proxy.ts                     # Proteksi route /admin dan /api (dulu middleware.ts)
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
| `/api/documents` | GET, POST | Cookie (admin) | List & upload dokumen knowledge base |
| `/api/documents/[id]` | DELETE | Cookie (admin) | Hapus dokumen |
| `/api/documents/[id]/chunks` | GET | Cookie (admin) | Lihat chunk hasil parsing |
| `/api/helpdesk` | GET | Bearer token | Kontak WhatsApp sesuai domisili user |
| `/api/profile` | GET | Bearer token | Data profil (nama, domisili) |

## Alur Ingestion Dokumen

1. Admin upload file (docx/pdf) lewat `/admin/documents`
2. File diupload ke Supabase Storage
3. Teks diekstrak jadi markdown (`mammoth` untuk docx, Unstructured API untuk pdf)
4. Markdown dipecah jadi chunk per-heading (`lib/chunk.ts`)
5. Tiap chunk di-embed via Voyage AI, disimpan ke `document_chunks` beserta vektornya
6. Dokumen bisa di-scope ke domisili cabang tertentu (kolom `domisili`, nullable = berlaku untuk semua cabang)

## Alur Chat (RAG)

1. Pertanyaan user di-embed (Voyage AI, `input_type: query`)
2. Vector similarity search ke `document_chunks`, difilter berdasarkan domisili user
3. Konteks yang relevan disusun jadi system prompt
4. Gemini generate jawaban streaming, hanya berdasarkan konteks yang diberikan
5. Riwayat percakapan disimpan ke `conversations` dan `messages`

## Autentikasi

- **Admin panel** (`/admin/*`): Supabase Auth dengan session cookie, dicek di `proxy.ts`
- **Flutter/API mobile** (`/api/chat`, dll): Bearer token dari Supabase Auth, divalidasi di `lib/auth.ts`

## Catatan Keamanan

- `SUPABASE_SECRET_KEY` bypass RLS — hanya dipakai di server, tidak pernah dikirim ke client
- Koneksi database (`DATABASE_URL`) berjalan sebagai superuser, sehingga RLS di Postgres tidak memengaruhi query dari server ini
- Jika RLS diaktifkan di Supabase, tujuannya untuk menutup akses langsung dari REST API publik (menggunakan publishable key), bukan untuk membatasi server ini
