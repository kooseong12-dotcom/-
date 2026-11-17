# FLO — Visual Work Instructions

Manufacturing work instruction frontend prototype built with Vite and vanilla JavaScript.

## Run

```sh
npm ci --cache /tmp/flo-npm-cache
npm run dev
```

Development server: port 3000, bound to 0.0.0.0. `npm run build` creates `dist/`.

Includes process navigation, demo playback and explanation pauses, repeat modes, KO/EN/UR sample content, RTL, view toggles, Excel import with column mapping, local video attachment, editing and local revision history.

Edits and imported process data are saved in browser localStorage. Uploaded video URLs last for the current session. Authentication, cloud storage, translation/TTS generation, production version approvals, subtitle transcoding, and audit persistence require backend integration. Displayed factory artwork is generated demonstration imagery; demo playback is a simulated timeline, not an instructional film.

## Explanation segments (fuzzy playback)

At the source video's explanation marker (default 00:12), the source pauses while the selected language pack's explanation plays. Playback resumes immediately when that explanation ends; Next remains available to skip early. There is no countdown. This is independent of step auto-advance and whole-step repeat settings.

`step.fuzzy` can override `sourceStart` and `languagePacks`. Each pack has `start`, `end` (seconds on the explanation track), `subtitle`, and optional `audioUrl`. With audio, the media position drives completion so buffering does not count as explanation playback. Without audio, the demo displays the subtitle for the configured duration (KO 5s, EN 7s, UR 10s). Actual dubbing/TTS generation remains a backend integration.

Switching languages preserves elapsed explanation time and applies the target pack's end time. If that end has already been reached, the source resumes immediately. Stop, seeking, and changing steps cancel the pending explanation to prevent a stale automatic resume.

Run `npm test` for the explanation playback regression tests. The existing GitHub Pages workflow builds `dist` on pushes to `main`; changes on review branches deploy only after merge.
