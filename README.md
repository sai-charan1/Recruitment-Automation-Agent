# AI Interview Dashboard (Fullstack)

## What I created
- React + Vite + Tailwind frontend (in `frontend/`)
- FastAPI backend (in `backend/`) that uses local JSON files as data store (mocked GROQ-style storage)
- Rubric editor in frontend stores rubrics in browser localStorage
- Interview creation, candidate list, interview link column, optional resume placeholder, candidate page with single-answer recording enforcement

## How to run (production-like on your machine)
1. Backend:
   - Create a Python virtualenv and install dependencies:
     ```
     python -m venv .venv
     source .venv/bin/activate
     pip install -r backend/requirements.txt
     ```
   - Run backend:
     ```
     uvicorn backend.main:app --reload --port 8000
     ```
   - Backend will serve endpoints on http://localhost:8000

2. Frontend:
   - Install Node dependencies:
     ```
     cd frontend
     npm install
     npm run dev
     ```
   - By default Vite serves on http://localhost:5173 (or 3000 depending on config). The frontend expects backend endpoints under `/api/*`. For local development you can set Vite proxy or run with a reverse proxy. In the sample code I used relative `/api/...` so configure a proxy in `vite.config.js` or run the frontend on port 3000 and backend on 8000.

3. Notes:
   - Replace AssemblyAI or other integrations in candidate component and backend upload handling as needed.
   - Rubrics are stored in browser localStorage for simplicity; you can extend to backend storage or Sanity with GROQ if you have credentials.

## What I could NOT do here
- I built and packaged the full project files into this zip, but I could not install npm packages or run the Vite dev server inside this environment. I also could not run `uvicorn` here to start the backend due to environment restrictions. The code is structured and ready; simply follow the commands above on your machine and it should work after installing dependencies.



## AssemblyAI integration
If you want server-side transcription using AssemblyAI, set environment variable:

```
export ASSEMBLYAI_API_KEY=your_key_here
```

The FastAPI upload endpoint will automatically upload the saved file to AssemblyAI and poll for the transcript; the interview object will be updated under `transcripts` in `backend/data/interviews.json` once ready.

### Vite proxy
The project includes `vite.config.js` configured to proxy `/api` to `http://localhost:8000`. Frontend dev server runs on port 3000.


## Environment (.env)
Add a `.env` file at the project root or set environment variables:

```
GROQ_API_KEY=...
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
ASSEMBLYAI_API_KEY=...
```
