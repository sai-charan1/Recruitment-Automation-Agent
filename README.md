# AI Interview Dashboard (Fullstack)

## What I created

* **Frontend:** React + Vite + Tailwind (in `frontend/`)

  * Candidate interface supports **video recording with single-answer enforcement**, live preview, and optional resume upload for role-specific questions.
  * Recruiter dashboard allows **interview creation, candidate list, rubric editing**, and reviewing **AI-generated summaries and evaluations**.
  * Rubrics are stored in **browser localStorage**, can be extended to backend or Sanity/GROQ.
* **Backend:** FastAPI (in `backend/`)

  * Stores data in local JSON files (mocked GROQ-style storage)
  * Handles candidate uploads, converts videos to audio, transcribes answers using **Whisper or AssemblyAI**, and generates **LLM-based skill evaluation**.
  * Supports **AI-generated role-specific introductions** and **dynamic question generation** based on role description and resume.
* **Interview flow:**

  * Candidates see **one question at a time**, record and submit answers sequentially.
  * Recruiters can **upload resumes**, create interviews, and view structured **AI-based skill evaluations** and summaries.

---

## How to run (production-like on your machine)

### 1. Backend

1. Create a Python virtual environment and install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```
2. Run backend:

   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
3. Backend endpoints will be served on [http://localhost:8000](http://localhost:8000)

### 2. Frontend

1. Install Node dependencies:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. By default, Vite serves on [http://localhost:5173](http://localhost:5173) (or 3000)

   * Frontend expects backend endpoints under `/api/*`.
   * Use the **Vite proxy** in `vite.config.js` or a reverse proxy to connect frontend to backend.

### 3. Notes

* Replace AssemblyAI or other integrations in candidate component and backend upload handling as needed.
* Rubrics are stored in **browser localStorage** but can be migrated to backend storage or Sanity with GROQ credentials.
* Candidate flow enforces **single-answer per question** and sequential question submission.
* AI-powered features include **role-specific intro, dynamic questions, transcripts, summaries, and LLM-based evaluation**.

---

## AssemblyAI integration

For server-side transcription using AssemblyAI, set your API key as an environment variable:

```bash
export ASSEMBLYAI_API_KEY=your_key_here
```

* Backend will automatically upload submitted video/audio files to AssemblyAI.
* Transcripts will be updated in `backend/data/interviews.json` under the relevant interview object once ready.

---

## Vite Proxy

The project includes `vite.config.js` configured to proxy `/api` to `http://localhost:8000`.

* Frontend dev server runs on port 3000.
* This setup allows **frontend API calls to work seamlessly during local development**.

---

## Environment Variables (.env)

Create a `.env` file at the project root or set the following environment variables:

```
GROQ_API_KEY=...
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
ASSEMBLYAI_API_KEY=...
```

---

## Key Features Recap

* **AI-powered role-specific introduction** for candidates.
* **Dynamic interview question generation** based on role description and optional candidate resume.
* **Sequential question flow**: candidates see one question at a time.
* **Browser-based video recording** with live preview.
* **Resume upload** for context-aware question generation.
* **AI transcription** using Whisper or AssemblyAI.
* **LLM-based summary and skill evaluation** for recruiters.
* **Recruiter dashboard** with rubrics, candidate list, interview links, and evaluation reports.
* **Modular and extensible architecture** ready for cloud storage, databases, and advanced AI features.

---

## Quick Start Example

1. Candidate receives interview link.
2. System shows a **role-specific introduction**.
3. Candidate optionally uploads resume.
4. Candidate sees first question, records answer, submits.
5. Next question appears, repeats until all questions are answered.
6. Backend generates **transcripts, AI-based skill evaluation**, and stores results.
7. Recruiter reviews structured reports and decides next steps.
