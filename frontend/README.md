# Quiz App — Frontend

This is the React frontend for the Quiz App. It was bootstrapped with Create React App and uses React 19 with `react-scripts`.

The app expects a running backend API (default: `http://localhost:5000/api`) which serves quizzes and question data.

## Quick overview

- Frontend entry: `src/index.js`
- Main app component: `src/App.js`
- Styling: `src/App.scss` (Sass)
- Icons: `lucide-react`

## Prerequisites

- Node.js (LTS recommended, e.g. 16/18/20+) and npm
- A running backend (see `../backend`) that provides the `/api/quizzes` and `/api/questions/:quizId` endpoints

## Local development

1. Start the backend (from the repo root):

	- Install backend deps and run:

	  cd ../backend; npm install; npm run dev

	The backend default scripts are:

	- `npm start` — run `node server.js`
	- `npm run dev` — run `nodemon server.js` (dev)

2. Start the frontend (in a separate terminal):

	cd frontend
	npm install
	npm start

	This will run the app in development mode at http://localhost:3000 and proxy API calls to the backend if configured.

## Environment / configuration

- The frontend currently expects the backend API to be reachable at `http://localhost:5000/api` as used in `src/App.js` (API_URL). To change this, update the constant in `src/App.js` or add a small wrapper to read from environment variables (e.g. `process.env.REACT_APP_API_URL`).

## Build for production

From `frontend`:

	npm run build

This generates a production bundle in the `frontend/build` folder that you can deploy to a static host.

## Tests

Run unit tests (Create React App):

	npm test

See `package.json` for the available scripts.

## Notes & troubleshooting

- If quizzes are empty in the UI, confirm the backend is running and the MongoDB used by the backend has quiz and question documents.
- Images: `App.js` composes image URLs against `http://localhost:5000/images/...` — ensure the backend serves static images from `/images` or store full URLs on the question objects.
- If build or start fails due to missing dependencies, run `npm install` inside `frontend` and `backend`.

## Scripts (from `package.json`)

- `start` — `react-scripts start` (development)
- `build` — `react-scripts build` (production build)
- `test` — `react-scripts test`
- `eject` — `react-scripts eject` (one-way)

## Where to look next

- Backend: `../backend/server.js` — check API routes and DB config
- Frontend: `src/App.js` and `src/App.scss` — UI and styles

---

If you'd like, I can:

- Add `REACT_APP_API_URL` support and read the API URL from env variables
- Create a small `README-root.md` at repo root that describes both frontend and backend and how to run the full stack

If you want me to run a quick build/test now to validate, say "run verification" and I'll attempt to build the frontend and report results.

## Database seeding (Python)

There is a small Python helper that creates (and seeds) the MongoDB database used by the backend.

- Location: `../createdb/seed.py`
- Purpose: connects to MongoDB using `MONGO_URI` from `../createdb/.env`, clears `quizzes` and `questions` collections, inserts sample quiz documents and generated questions, and then closes the connection.

How to run it (Windows Powershell):

1. Open a terminal and switch to the `createdb` folder:

	cd createdb

2. (Optional) Create and activate a virtual environment:

	python -m venv venv
	.\venv\Scripts\Activate.ps1

3. Install dependencies:

	pip install -r requirements.txt

4. Create or edit `createdb/.env` with at least the following values:

	MONGO_URI=mongodb://localhost:27017/quizMasterDB
	GEMINI_API_KEY=your_gemini_api_key_here

	Note: `seed.py` will exit if `MONGO_URI` or `GEMINI_API_KEY` (or `APP_SECRET_KEY`) are not set.

5. Run the seeder:

	python seed.py

What it does:

- Connects to the database pointed at by `MONGO_URI`.
- Drops `quizzes` and `questions` collections if present.
- Inserts a small set of manual image-based questions and then (optionally) generates additional text questions using the Google Gemini API (if `GEMINI_API_KEY` is provided).

Security / privacy notes:

- `createdb/.env` contains secrets (API keys and DB connection strings). Do NOT commit it. A repository-level `.gitignore` is included to ignore `createdb/.env` and the `createdb/venv` folder.
- If you have already committed secret values, rotate those credentials.


