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
