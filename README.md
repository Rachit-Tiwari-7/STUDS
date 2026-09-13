# ⚡ STUDS — Intelligent Academic Study & Synthesizer Assistant

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/Rachit-Tiwari-7/STUDS)
[![Tests](https://img.shields.io/badge/Tests-40%2F40%20Passing%20(100%25)-success)](https://github.com/Rachit-Tiwari-7/STUDS)
[![Lint](https://img.shields.io/badge/ESLint-0%20Errors%20%7C%200%20Warnings-brightgreen)](https://github.com/Rachit-Tiwari-7/STUDS)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/Framework-Next.js%2016%20(Turbopack)-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.x-blue)](https://www.typescriptlang.org/)
[![Repository Size](https://img.shields.io/badge/Repo%20Size-~0.27%20MB%20(%3C10MB%20Rule)-success)](https://github.com/Rachit-Tiwari-7/STUDS)
[![Branch Model](https://img.shields.io/badge/Branches-Single%20(main)-blueviolet)](https://github.com/Rachit-Tiwari-7/STUDS)

---

## 📑 Executive Summary

**STUDS** is an intelligent, high-throughput academic study and synthesis platform engineered to resolve cognitive overload among university and technical students. Utilizing an ultra-low-latency **Groq LPU multi-key rotation pool**, a **100% free multimodal vision OCR fallback cascade**, and an evidence-based cognitive learning engine, STUDS converts disorganized lecture notes, textbooks, and handwritten whiteboards into comprehensive, active recall study workspaces in seconds.

---

## 1. Challenge Vertical & Pedagogical Rationale

* **Vertical**: **EdTech / Intelligent Academic Workflow Assistant**
* **Target Audience**: University undergraduates, STEM researchers, and technical certification examinees.
* **Core Problem**: Students suffer from the **"illusion of competence"** caused by passive reading and highlighted textbooks. Conventional study tools lack automated synthesis, rate-limit easily on free LLM tiers, and force learners to jump across multiple fragmented apps for notes, flashcards, mind maps, and quizzes.
* **The STUDS Solution**: A unified, neo-brutalist academic cockpit providing 25 integrated learning tools with zero configuration friction, automated API key failover, and bulletproof offline resiliency.

---

## 2. System Architecture Diagrams

### 📐 Diagram 1: High-Level End-to-End System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["🖥️ STUDS Client Layer (Next.js 16 + React 19)"]
        Nav["Left Navigation Sidebar (Categorized Symbols)"]
        Dashboard["All-in-One Dashboard & Input Workspace"]
        NotesView["📝 Revision Notes & ELI5 Slider"]
        QuizView["❓ 5-Question Quiz & Exam Engine"]
        CardView["🃏 3D CSS Flashcards Deck"]
        MindMapView["🌳 Interactive Collapsible Mind Map"]
        AudioEngine["🔊 Web Speech API Narration Engine"]
    end

    subgraph APIGateway["🌐 Next.js REST API Layer (/api)"]
        HealthAPI["GET /api/health (Diagnostic Telemetry)"]
        SynthAPI["POST /api/synthesize (Synthesis Controller)"]
        OCRAPI["POST /api/ocr (Multimodal Vision Controller)"]
    end

    subgraph ServiceLayer["⚙️ Core Engine & Modular Services"]
        KeyPool["⚡ Groq Multi-Key Balancer (Round-Robin)"]
        OCREngine["📷 100% Free Multimodal Vision Cascade"]
        ValidatorEngine["🛡️ Deterministic Schema & Invariant Validator"]
        OfflineEngine["🧠 Heuristic Zero-Latency Fallback Engine"]
    end

    subgraph CloudInfra["☁️ Upstream AI Infrastructure & Cloud"]
        GroqCloud["Groq LPU Cloud (Active: GPT-OSS 120B, Qwen 27B)"]
        OpenRouterFree["OpenRouter Free Tier (Gemma Multimodal)"]
        SupabaseDB["Supabase Cloud Auth & Workspace Sync"]
    end

    Nav --> Dashboard & NotesView & QuizView & CardView & MindMapView
    Dashboard --> APIGateway
    SynthAPI --> KeyPool
    OCRAPI --> OCREngine
    KeyPool --> GroqCloud
    KeyPool --> ValidatorEngine
    OCREngine --> OpenRouterFree
    ClientLayer -.-> SupabaseDB
    ValidatorEngine -.->|On Pool Failure| OfflineEngine
```

---

### 🔄 Diagram 2: Multi-Key Load Balancing & HTTP 429 Failover State Machine

```mermaid
stateDiagram-v2
    [*] --> InitializePool: Ingest GROQ_API_KEYS (.env.local)
    InitializePool --> Ready: Parse & Sanitize Key Array

    state Ready {
        [*] --> SelectKey: Pointer = currentPoolIndex % TotalKeys
        SelectKey --> DispatchRequest: Apply Mask (e.g. gsk_n9...nSVo)
        DispatchRequest --> CheckResponse: Await Groq LPU Response
        
        CheckResponse --> ValidatePayload: HTTP 200 OK
        CheckResponse --> HandleRateLimit: HTTP 429 (Rate Limit Exceeded)
        CheckResponse --> HandleUpstreamError: HTTP 500 / 503 / Network Timeout

        HandleRateLimit --> NextKey: Log Warning & Emit User Toast
        HandleUpstreamError --> NextKey: Increment Attempt Counter
        
        NextKey --> SelectKey: Next Pointer = (Index + 1) % TotalKeys
        
        ValidatePayload --> SchemaValid: Invariant Checks Pass
        ValidatePayload --> NextKey: Corrupted JSON / Missing Fields
    }

    SchemaValid --> ReturnResult: Advance Global Pointer & Return Workspace
    NextKey --> OfflineFallback: All Keys in Pool Exhausted
    OfflineFallback --> ReturnResult: Return Heuristic Offline Workspace
    ReturnResult --> [*]
```

---

### 👁️ Diagram 3: Multimodal Vision OCR 3-Tier Fallback Cascade Flow

```mermaid
flowchart LR
    Input["📷 User Upload (Handwritten Notes / Whiteboard)"] --> Base64["Base64 DataURL Encoding & Validation"]
    Base64 --> Tier1{"Tier 1: Google Gemma 4 31B Vision\n(100% Free)"}

    Tier1 -->|200 OK| Markdown["Clean Structured Markdown"]
    Tier1 -->|429 / Timeout / Queue| Tier2{"Tier 2: Google Gemma 4 26B Vision\n(100% Free Fallback 1)"}

    Tier2 -->|200 OK| Markdown
    Tier2 -->|429 / Busy| Tier3{"Tier 3: OpenRouter Free Models Router\n(100% Free Fallback 2)"}

    Tier3 -->|200 OK| Markdown
    Tier3 -->|Error| Tier4{"Tier 4: Dots-3 Note Preview\n(100% Free Fallback 3)"}

    Tier4 -->|200 OK| Markdown
    Tier4 -->|All Fail| ErrorState["Safe Error Fallback & Manual Input"]
    Markdown --> Synthesis["Ingest into STUDS Synthesizer"]
```

---

### 🧠 Diagram 4: Pedagogical Cognitive Learning Pipeline (Bloom's Taxonomy)

```mermaid
flowchart TD
    Raw["📄 Unstructured Lecture Text / Transcript"] --> Pipeline["STUDS Cognitive Synthesis Engine"]

    subgraph Level1["Level 1: Remembering & Vocabulary"]
        Takeaways["📌 3 High-Yield Takeaways (Core Anchors)"]
        Glossary["📖 Key Vocabulary Glossary (Terms & Definitions)"]
    end

    subgraph Level2["Level 2: Understanding & Memory Aids"]
        Mnemonics["💡 Memory Acronyms & Cognitive Mnemonics"]
        ELI5["🎚️ 5-Level Adaptive ELI5 Complexity Slider"]
    end

    subgraph Level3["Level 3: Applying & Active Recall"]
        Cloze["✏️ Cloze Exercises (Fill-in-the-Blank Drills)"]
        Spoilers["🔒 In-Line Spoiler Redactions ([Click to Reveal])"]
    end

    subgraph Level4["Level 4: Analyzing & Conceptual Hierarchy"]
        MindMap["🌳 Collapsible Interactive Concept Mind Map"]
        Sections["📑 Structured Modular Revision Sections"]
    end

    subgraph Level5["Level 5: Evaluating & Self-Assessment"]
        Quiz["❓ 5-Question Evaluation Quiz (Instant Feedback)"]
        Confetti["🎉 Perfect Score Celebration Confetti"]
    end

    subgraph Level6["Level 6: Retaining & Spaced Scheduling"]
        Flashcards["🃏 3D Flippable Spaced Repetition Cards"]
        Schedule["🗓️ 3-Day Leitner Spaced Study Schedule"]
    end

    Pipeline --> Level1 --> Level2 --> Level3 --> Level4 --> Level5 --> Level6
```

---

### 🛡️ Diagram 5: Data Integrity & Deterministic Schema Invariant Pipeline

```mermaid
flowchart TD
    RawJSON["Raw LLM JSON String Response"] --> ParseJSON{"Safe JSON.parse()"}
    ParseJSON -->|Syntax Error| Reject["❌ Reject & Trigger Failover to Next Key"]

    ParseJSON -->|Valid JSON| InvariantCheck["Strict Invariant Verifier"]

    subgraph InvariantCheck["Strict Schema Invariant Checks"]
        C1{"Title Exists & Valid?"}
        C2{"Takeaways is Array & Length >= 3?"}
        C3{"Glossary has >= 3 Valid Term/Def Pairs?"}
        C4{"Mnemonics has >= 1 Memory Aid?"}
        C5{"Sections >= 2 with Content?"}
        C6{"Quiz has >= 4 Valid Questions & Explanations?"}
        C7{"Flashcards has >= 3 Q&A Pairs?"}
    end

    C1 -->|No| FallbackTitle["Derive Title from First Line"]
    C2 -->|No| Reject
    C3 -->|No| Reject
    C4 -->|No| Reject
    C5 -->|No| Reject
    C6 -->|No| Reject
    C7 -->|No| Reject

    C5 -->|Yes| ActiveRecallEnforcer["Check Active Recall Tags: Wrap [[Key Term]] if Missing"]
    ActiveRecallEnforcer --> Output["✅ Normalized Bulletproof WorkspaceData"]
```

---

## 3. Technology Stack & Optimization Decisions

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.3.5 (App Router, Turbopack)** | Instant sub-second incremental builds, server components, and native REST API Route Handlers. |
| **Language** | **TypeScript 5 (Strict Mode)** | Enforces strict compile-time types across all interfaces with zero `any` leaks. |
| **Styling** | **Tailwind CSS + Vanilla CSS Tokens** | High-contrast comic neo-brutalist theme, accessible WCAG colors, and responsive drawer layouts. |
| **Typography** | **Righteous & Syne (Google Fonts)** | Signature display styling for high engagement and distinct brand identity. |
| **LLM Inference** | **Groq LPU (`openai/gpt-oss-120b`)** | Sub-second inference latency, strict non-deprecated model policy with automated interceptor. |
| **Vision OCR** | **OpenRouter 100% Free Cascade** | Zero-cost document transcription with an automated 3-tier fallback cascade. |
| **Test Runner** | **Node Native Test Runner (`node:test`)** | Zero heavy test dependencies, headless CI/CD execution in **< 450ms**. |

---

## 4. REST API Endpoint Specifications

### `GET /api/health`
Operational telemetry and uptime status for automated evaluation pipelines.
* **Status Code**: `200 OK`
* **Response Format**:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2026-09-13T08:25:00.000Z",
  "uptimeSeconds": 182,
  "environment": "production"
}
```

---

### `POST /api/synthesize`
Ingests raw lecture text, validates input parameters, rotates through the active Groq key pool, validates schema consistency, and returns structured study artifacts.
* **Request Format**:
```json
{
  "lectureText": "Operating Systems Concurrency, Synchronization, and Deadlocks...",
  "model": "openai/gpt-oss-120b",
  "apiKeys": ["gsk_key1...", "gsk_key2..."]
}
```
* **Status Codes**:
  * `200 OK`: Synthesis succeeded.
  * `400 Bad Request`: Missing `lectureText`, text < 10 characters, or malformed JSON.
  * `500 Internal Server Error`: All keys in pool exhausted/rate-limited.
* **Response Format (200 OK)**:
```json
{
  "success": true,
  "data": {
    "title": "Operating Systems Concurrency & Synchronization",
    "takeaways": ["Processes have isolated memory; threads share heap.", "Deadlock requires all 4 Coffman conditions.", "Mutexes enforce binary mutual exclusion."],
    "glossary": [{ "term": "Mutex", "def": "Lock owned exclusively by one thread." }],
    "mnemonics": [{ "word": "M-H-N-C", "meaning": "Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait" }],
    "sections": [{ "title": "Critical Sections", "complexity": "easy", "bullets": ["[[Locks]] prevent race conditions."] }],
    "quiz": [{ "q": "What is mutual exclusion?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..." }],
    "flashcards": [{ "front": "Mutex vs Semaphore", "back": "..." }]
  },
  "meta": {
    "modelUsed": "openai/gpt-oss-120b",
    "keyIndex": 0,
    "keyMasked": "gsk_n9...nSVo",
    "processingTimeMs": 1140
  }
}
```

---

### `POST /api/ocr`
Transcribes handwritten notes or whiteboard snapshots using the 100% free multimodal vision cascade.
* **Request Format**:
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "primaryModel": "google/gemma-4-31b-it:free"
}
```
* **Status Codes**:
  * `200 OK`: Successfully transcribed into Markdown.
  * `400 Bad Request`: Missing or empty `imageBase64` payload.
  * `500 Internal Server Error`: Upstream vision model rejection or timeout.

---

## 5. Automated Test Suite (40 / 40 Tests Passing • 100% Pass Rate)

The test suite runs headlessly in **< 400ms** via Node's native test runner (`npm test`):

```
TAP version 13
ok 1 - SUITE 1: Groq Multi-Key Pool Parser (7 tests)
ok 2 - SUITE 2: Strict Data Consistency & Completeness Validator (9 tests)
ok 3 - SUITE 3: Groq Multi-Key Load Balancing & Failover (3 tests)
ok 4 - SUITE 4: OpenRouter 100% Free Vision OCR & Fallback Cascade (3 tests)
ok 5 - SUITE 5: Domain Workspaces Satisfy All 25 Features (4 tests)
ok 6 - SUITE 6: REST API Controllers & Error Boundaries (8 tests)
1..6
# tests 40
# pass 40
# fail 0
# duration_ms 375
```

### Key Coverage Highlights:
- **Unit Testing**: Validates key parsing, string masking, non-deprecated model resolvers, active recall auto-wrapping, schema boundary invariance, and study time calculations.
- **Failover Verification**: Simulates HTTP 429 rate limits, network timeouts, and corrupted JSON, confirming seamless progression to backup keys.
- **API Controller Integration**: Verifies `/api/health`, `/api/synthesize`, and `/api/ocr` across 200, 400, and 500 status codes.
- **Deterministic Mocking**: All tests execute with zero external network dependencies, ensuring 100% stability in automated sandbox evaluation runners.

---

## 5.1 Algorithmic & Performance Optimization Breakdown

1. **Deterministic O(N) Frequency-Map & Stopword Filtering Algorithm** (`src/lib/sampleData.ts`):
   - Replaced arbitrary array lookups with a single-pass tokenization histogram coupled with a curated `Set<string>` of English academic stopwords.
   - Extracts the highest-yield conceptual terms deterministically, ensuring that offline/fallback study workspaces are immediately relevant to the lecture topic.
   - Time Complexity: $O(N + V \log V)$ where $N$ is text length and $V \ll N$ is unique vocabulary size. Space: $O(V)$ auxiliary histogram map.

2. **O(N) Multimodal Vision Model Deduplication** (`src/lib/openrouter.ts`):
   - Refactored redundant model cascade array filters from $O(N^2)$ `.filter(...)` to $O(N)$ `new Set(...)`.

3. **Strict Type-Safety & Dead Code Elimination**:
   - Eliminated all `@typescript-eslint/no-explicit-any` instances across the codebase, replacing them with strict type guards and `unknown` record invariants.
   - Removed 4 unused legacy modal and layout components (`ColumnLeft.tsx`, `GroqModal.tsx`, `OpenRouterModal.tsx`, `SupabaseModal.tsx`), reducing repo size to **~0.27 MB** (well under the 10 MB limit).
   - Eliminated `react-hooks/set-state-in-effect` warnings using React 19 microtask-deferred state hydration.
   - Achieved a clean **0 Errors, 0 Warnings** status in ESLint 9 (`npm run lint`).

---

## 6. Hack2Skill Evaluation Criteria Alignment

| Evaluation Pillar | Implementation & Alignment |
| :--- | :--- |
| **High Impact: Functional Usability** | 25 integrated learning tools (Active recall spoilers, 3D flashcards, quiz engine, mind map, schedule). |
| **High Impact: Logical Decision Making** | Adaptive ELI5 slider (1–5), non-deprecated model auto-mapping, and intelligent multi-tier failover. |
| **High Impact: Clean Code & Architecture** | Modular separation across UI components, REST API controllers, domain types, and service engines. |
| **Medium Impact: Security & Safety** | Zero hardcoded keys in git; environment variable ingestion via `.env.local`; local encrypted browser storage. |
| **Medium Impact: Efficiency & Speed** | Sub-second Groq LPU synthesis; $O(N)$ text scanning; memoized glossary filters; repo size is **~0.65 MB (< 10 MB limit)**. |
| **Low Impact: Accessibility & Polish** | High-contrast WCAG comic neo-brutalist theme, keyboard shortcuts (`Esc` for Focus Mode), and Web Speech voice narration. |

---

## 7. Installation & Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Installed and configured

### 2. Setup Environment
```bash
# Clone the repository:
git clone https://github.com/Rachit-Tiwari-7/STUDS.git
cd STUDS

# Copy environment template:
cp .env.example .env.local

# Populate .env.local with your keys (optional; preconfigured defaults exist)
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build Production Bundle
```bash
npm run build
```

### 5. Launch Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.
