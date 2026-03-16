# Tota Voice-First Tutor

## Setup
1. `npm install`
2. `npm run dev`

## Environment variables
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_STT_WS_URL` — **production**: `wss://testing-zone-hx7q.onrender.com`
- `TTS_API_URL` — **production**: `https://testing-zone-five.vercel.app/api/viva/tts`

## Project structure
- `app/` and `pages/` host the voice-first UI flow, screens, and shared layouts.
- `components/` contains chat bubbles, lesson + learning path panels, and the sidebar/hero surfaces.
- `hooks/use-voice-tutor.ts` drives the frontend state machine and microphone handling.
- `lib/tutor-engine.ts` plus `lib/workers/` implement backend session management, Gemini prompts, and lesson/workflow helpers.
- `app/api/session/*` exposes start/message/state/reset handlers, while `/api/tts` and `/api/viva/tts` bridge to Google TTS.

## State flow
1. Frontend hits `/api/session/start` to bootstrap a session, which the tutor engine stores in an in-memory map with phases `INTRO → PLACEMENT → REPORT → PATH → LESSON`.
2. The voice hook streams transcripts to `/api/session/message`; the backend advances the state machine, invokes Gemini prompts, and returns the next tutor message + phase data.
3. `/api/session/state` can be polled for current context (phase, pending question, learning path topics), while `/api/session/reset` reinitializes the session.

## Voice-first experience notes
- The UI auto-transcribes live speech, sends finalized transcripts to the backend, and triggers TTS so Tota speaks the tutor side.
- The chat panel focuses on the most recent, active conversational turn while the left sidebar shows context (name, placement progress, learning path topics, question list, etc.).
- Mic permissions are handled in the hook and try to stay hot (no extra button) so tapping into the experience feels seamless.

Keep this as the quickest way to bootstrap the flow; extend Gemini prompts, add storage, or swap the TTS/STT bridge later as needed.
