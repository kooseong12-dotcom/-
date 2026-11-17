# FLO — Visual Work Instructions

Manufacturing work instruction frontend. No paid API, backend database, cloud translation or cloud TTS is called.

## Run and check

```sh
npm ci --cache /tmp/flo-npm-cache
npm run dev
npm test
npm run build
npm run preview -- --port 4173
```

`dist/` is the production output. The existing Pages workflow deploys main to `https://kooseong12-dotcom.github.io/-/`. Review branches do not deploy before merge. Vite base remains `/-/`.

## Document header and BOM

The document metadata panel stores standard name, author, version, `lineId` and `lineName`; the line registry supports immediate add-and-select. Both persist locally and are suitable for future list filtering. BOM rows include part ID, name, quantity and image. A step's `partIds` drives both row highlighting and current assembly cards for every navigation path. New parts and multiple part mappings are editable.

## Local translation and review

Korean edits and Excel imports generate draft fields for title, instructions and warnings. The conservative exact-phrase glossary returns the original text with a review flag when unknown. Draft text is separate from `published` text: only an explicit review approval publishes it. Existing approved titles are migrated without deleting legacy fields. Previous approved text stays visible while its replacement awaits review. New locale records use the same workflow; their UI falls back to English. The translation engine contract can be replaced by a self-hosted engine later; none is configured now.

## Video, explanation settings and narration

Video source audio is always muted, including the settings preview. Original audio is used only for local analysis and is never used as a narration pack. The settings window supports multiple source ranges, 0.1-second edits, pointer-drag handles, preview seeking, and a separate audio file per range and locale. MP3/WAV/M4A playback depends on browser codecs; audio file limit is 10MB. Uploaded narration is played independently from the muted video.

Auto detection uses Web Audio decodeAudioData and frame RMS/silence boundaries. Its confidence is a boundary heuristic, not speech recognition: machinery, music and continuous noise can be false positives. Green candidates and orange review candidates are all editable and require explicit approval. Invalid or overlapping ranges cannot be approved. Analysis is limited to 200MB files for browser memory; large files can use manual ranges. Decode failure gives manual-edit guidance.

Approved `fuzzySegments` hold sourceStart/sourceEnd and locale-specific languagePacks (start/end, subtitle, optional mediaId/audioUrl). At a source marker the video freezes; when narration ends it immediately resumes at the source range end. Next skips early. Changing locale recalculates the end from elapsed explanation time. Step repeat and auto-advance are separate. An explicitly empty approved segment array disables legacy sample markers. Replaced videos retain prior segments in previousFuzzySegments and require range approval again.

Priority is uploaded narration, then available **localService** browser TTS, then timed subtitles. Remote TTS voices are excluded. Local voices depend on OS/browser and may be absent, especially Urdu. There is no subscription/quota/billing path, so no paid overage. Generation of human dubbing or arbitrary high-quality translation is not included.

## Offline storage

Production builds generate a versioned service worker that precaches the app, lazy Excel parser, fonts and artwork. First online visit must finish preparation before going offline. The status banner distinguishes readiness and offline mode. Development mode does not enable caching. An HTTPS origin (or localhost) is required. Metadata, mappings, translations and history use localStorage. Videos and narration blobs use IndexedDB and are restored to runtime object URLs at startup. Original images/fonts do not require external CDNs.

Storage is specific to the device, browser and site origin; it is not GitHub/cloud storage or a backup. Browser clearing, private mode, quota limits and storage eviction can remove data. An origin not visited before cannot first-load offline. No cross-device synchronization or authenticated production approval service is implemented.

## Player controls and screen masking (20–22)

Source video elements are locked at `muted=true`, `volume=0`, with native controls disabled. Only narration audio exposes audio controls in its dedicated editor. Preview playback and seeking use custom buttons without a source-volume control. Changing languages retains the same source video element and replaces only the active narration track.

Registration opens the segment editor after connecting a video; the work-instruction edit form also has a direct segment-settings button. Range names, confidence/status and source times are editable, and closing the modal discards draft range changes. The Save/Approve action commits them.

Screen masking has its own settings window. Drag on the preview or enter normalized percentage coordinates to add opaque/blur regions; Save commits masks per step. Overlays align to actual contained video pixels, including letterboxing, and work after offline reload. The source file is not modified or re-encoded. For an edited downloadable file, use a video editor to crop/blur the source and upload the result. Unrelated sample/source labels are removed from the player; process badges, subtitles and playback controls remain.
