# StorySpark - استودیو هوشمند آموزش زبان انگلیسی کودکان

StorySpark transforms photos and scans of children's English storybook pages into complete pedagogical lessons, interactive Leitner flashcards (SM-2), gamified quizzes, and printable worksheets using multimodal AI vision models with direct browser execution and offline-first persistence.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and aesthetic decisions were confirmed in Phase 1:
> - **Initial State**: Starts with a clean, empty library ready for parents and educators to upload storybook photos, with an on-demand sample lesson loader in the backup tab.
> - **Visual Identity**: Warm playful storybook aesthetic with cozy rounded surfaces, amber and emerald accents, dark/light theme support, and RTL-first Persian typography.
> - **Audio Engine**: Native Web Speech API with accent switching (American, British, Australian), speed throttling (0.75x, 1x), and accompanying Persian phonetic reading guides.

---

### 1. Overview & Core Concept

- **What It Does**: StorySpark allows parents, ESL teachers, and young learners to photograph or upload a page from any English storybook. Using multimodal vision models (Google Gemini or OpenAI/OpenRouter/Groq/Ollama), it analyzes the illustration and text to generate an original age-tailored story, extracted vocabulary with Persian phonetics, phonics sounds, interactive comprehension quizzes, and exportable Word (`.docx`) worksheets.
- **Target Audience / Persona**: Iranian parents and young English learners (ages 3–12), as well as kindergarten and primary bilingual teachers seeking interactive pedagogical materials from physical books.
- **Key Value**: Bridges physical print books with digital interactive learning; provides zero-latency offline flashcard reviews via SuperMemo SM-2; ensures user privacy with client-side encrypted API keys; works without network once lessons are downloaded.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Upload & Analyze**: Drag-and-drop a book page snapshot. The client-side canvas compressor optimizes it, and the user selects age (3–12), CEFR level (Pre-A1 to B1), story style, and target word count.
  2. **Pedagogical Studio View**: Explore the analyzed page with 5 structured tabs: Story & Dual Translation, Visual Scene Elements (items, spatial coordinates, observable actions), Target Vocabulary & Phonics, Interactive Quiz, and Printable Worksheets.
  3. **Vocabulary & Leitner Practice**: Review target words with a 3D flip card, native TTS pronunciation in multiple accents, IPA guides, and SM-2 spaced repetition grading ("Again", "Hard", "Good", "Easy").
  4. **Gamified Quiz Arena**: Answer multiple-choice, true/false, fill-in-the-blanks, and sound-match questions with immediate celebratory confetti.
  5. **Cloud Sync & Mobile Pairing**: Pair with a smartphone using a 6-digit PIN and QR code; optionally sync with Supabase PostgreSQL in real-time.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Warm, inviting storybook aesthetic with cheerful educational clarity.
  - *Color Palette & Mood*: Soft warm canvas (`bg-amber-50/40` in light mode, deep warm slate `bg-stone-900` in dark mode), primary playful indigo (`#4F46E5`), golden amber (`#F59E0B`), fresh emerald (`#10B981`), and coral accents (`#F43F5E`).
  - *Typography & Hierarchy*: High-legibility modern sans with Persian RTL support (Vazirmatn / system font stack fallback) paired with `Plus Jakarta Sans` for English phrases and phonetics.
  - *Spatial Layout*: 1440px desktop container with fluid mobile responsiveness, generous card padding (`p-6` to `p-8`), rounded cards (`rounded-2xl` to `rounded-3xl`), and zero-pill metadata discipline.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode AI Execution (Direct Browser vs. Server Proxy)**
  - *Chosen Approach*: User API keys dispatch requests directly from browser `fetch` to official endpoints (Google Gemini and OpenAI-compatible providers), with an Express proxy fallback (`/api/ai/analyze`).
  - *Why*: Direct client calls eliminate reverse proxy bottlenecks, bypass 405 Method Not Allowed errors, and protect user keys from server logging.
  - *Trade-off*: Requires client-side CORS handling and Web Crypto API (AES-GCM 256-bit) to safely encrypt keys in `localStorage`.

- **Decision 2: Offline-First Storage with Dexie IndexedDB**
  - *Chosen Approach*: All lessons, flashcard SM-2 review states, and settings persist locally in IndexedDB via `dexie`.
  - *Why*: Guarantees instant load times, zero cloud costs, and full offline accessibility for children studying without reliable internet.
  - *Optional Cloud Sync*: Users can provide their own Supabase project credentials for real-time multi-device synchronization.

- **Decision 3: Pedagogical Truthfulness & Guardrails**
  - *Chosen Approach*: Two-phase vision prompt instructing the model to observe actual objects, actions, and text in the image before synthesizing a fresh, creative story (avoiding verbatim copying of copyrighted books).

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        StorySpark Client (React 19)                    │
│                                                                        │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────────┐ │
│  │ Create Lesson  │  │ Vocabulary Box │  │ Interactive Quiz Arena    │ │
│  │ (Canvas Resize)│  │ (SM-2 Leitner) │  │ (Confetti & Report Card)  │ │
│  └───────┬────────┘  └───────┬────────┘  └─────────────┬─────────────┘ │
│          │                   │                         │               │
│  ┌───────▼───────────────────▼─────────────────────────▼─────────────┐ │
│  │            Local Database Engine: Dexie (IndexedDB)               │ │
│  │  - Lessons Table  - Vocabulary Table  - Review History Table      │ │
│  └───────┬─────────────────────────────────────────────┬─────────────┘ │
│          │                                             │               │
│  ┌───────▼────────────────┐                 ┌──────────▼─────────────┐ │
│  │ Direct AI Dispatcher   │                 │ Optional Cloud Sync    │ │
│  │ - Gemini 2.5/3.8 Flash │                 │ - Supabase Client SDK  │ │
│  │ - OpenAI / Groq / Ollama│                │ - Realtime Broadcast   │ │
│  │ - AES-GCM Encrypted Key│                 │ - Schema SQL Export    │ │
│  └───────┬────────────────┘                 └────────────────────────┘ │
└──────────┼─────────────────────────────────────────────────────────────┘
           │ (Fallback if configured)
┌──────────▼─────────────────────────────────────────────────────────────┐
│                   Full-Stack Express Server (server.ts)                 │
│  - /api/ai/test-connection (SSRF safe, API key redacted)                │
│  - /api/ai/analyze (25MB payload limit, CORS enabled)                   │
│  - Vite dev server middleware integration                               │
└────────────────────────────────────────────────────────────────────────┘
```

- **Data Models**:
  - `Lesson`: ID, titleEn, titleFa, ageLevel, cefrLevel, accent, style, imageBase64, detectedItems, observableActions, backgroundAndSetting, visibleText, storyEn, storyFa, vocabulary, phonicsSound, questions, createdAt, updatedAt.
  - `VocabularyCard`: ID, lessonId, word, meaningFa, ipa, pronunciationGuideFa, exampleEn, exampleFa, repetitions, intervalDays, easeFactor, nextReviewDate, masteryLevel.
  - `AppSettings`: Provider (`gemini` | `openai` | `custom`), model, encryptedApiKey, theme, preferredAccent, speechRate.
- **Client Security**: Web Crypto API generates an AES-GCM 256-bit key stored in non-exportable hardware crypto storage, encrypting sensitive API credentials before saving to local storage.
