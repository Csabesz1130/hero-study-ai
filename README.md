# HeroStudy AI

Egy modern, AI-alapú tanulási platform, amely személyre szabott tanulási élményt nyújt.

## Funkciók

- 🤖 AI Támogatott Tanulás
- 📚 Interaktív Tartalom
- 📊 Részletes Analitika
- 🎯 Személyre Szabott Tanulási Útvonalak
- 🎮 Kvízek és Szimulációk
- 🎥 Videó Tartalom

## Technológia Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)
- OpenAI API
- ElevenLabs
- Pinecone Vector Database

## Telepítés

1. Klónozza le a repository-t:
```bash
git clone https://github.com/yourusername/hero-study-ai.git
cd hero-study-ai
```

2. Telepítse a függőségeket:
```bash
npm install
```

3. Másolja le a `.env.local.example` fájlt `.env.local` néven és töltse ki a szükséges környezeti változókat:
```bash
cp .env.local.example .env.local
```

4. Indítsa el a fejlesztői szervert:
```bash
npm run dev
```

## Környezeti Változók

A következő környezeti változókat kell beállítani a `.env.local` fájlban:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_ENVIRONMENT`
- `PINECONE_INDEX_NAME`

## Fejlesztés

A projekt struktúrája a következő:

```
src/
  ├── app/              # Next.js app router
  ├── components/       # React komponensek
  ├── lib/             # Segédfüggvények és konfigurációk
  ├── types/           # TypeScript típusdefiníciók
  └── styles/          # CSS fájlok
```

## Licensz

MIT
