# AI Interview Dashboard (Fullstack)

## What I created
- React + Vite + Tailwind frontend (in `frontend/`)
  - Candidate interface supports **video recording with single-answer enforcement**, live preview, and optional resume upload for role-specific questions.
  - Recruiter dashboard allows **interview creation, candidate list, rubric editing**, and reviewing **AI-generated summaries and evaluations**.
  - Rubrics are stored in **browser localStorage**, can be extended to backend or Sanity/GROQ.
- FastAPI backend (in `backend/`)
  - Stores data in local JSON files (mocked GROQ-style storage)
  - Handles candidate uploads, converts videos to audio, transcribes answers using **Whisper or AssemblyAI**, and generates **LLM-based skill evaluation**.
  - Supports **AI-generated role-specific introductions** and **dynamic question generation** based on role description and resume.
- Interview flow:
  - Candidates see **one question at a time**, record and submit answers sequentially.
  - Recruiters can **upload resumes**, create interviews, and view structured **AI-based skill evaluations** and summaries.

## How to run (production-like on your machine)

### 1. Backend
1. Create a Python virtual environment and install dependencies:
