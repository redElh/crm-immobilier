// Cardinal feature switch (guide Step 1).
// Local dev only: set REACT_APP_CARDINAL_ENABLED=true in .env (.env is gitignored).
// Off = no bubble, no recorder, no code running.
export const CARDINAL_ENABLED = process.env.REACT_APP_CARDINAL_ENABLED === 'true';
