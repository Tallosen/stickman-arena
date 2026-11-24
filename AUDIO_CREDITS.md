# Sound library — 0.195

## Original arsenal cues (2026-10-07)

`tools/design-arsenal-audio.cjs` generates three string-release takes for bow/crossbow and three short energy-pulse takes for blaster/laser using equations and seeded noise only. No reference recordings, downloads, distortion or reverb. Mono PCM16, 44100 Hz, 0.16/0.12 second duration, smooth onset and silent tail. Source ID `project-original-arsenal`; deterministic regeneration, generator hash and asset hashes are checked at build. Existing recorded weapon and event files are unchanged. Provenance is not a guarantee of exclusive copyright.

## Dry precision-rifle variety (2026-10-04)

tools/design-sniper-variety.cjs generates eight new original sniper takes from seeded noise and equations, without input recordings, extracted reference data, convolution, reverb or distortion. The takes vary attack band/envelope, midrange body and mechanical bolt timing/resonances. Duration .40 s, PCM peak at most .44, DC removal at 90 Hz, 2x oversampling with anti-alias FIR. Parameters, hashes and deterministic regeneration are verified on build. Technical provenance is not a guarantee of exclusive copyright.

Only active sniper PCM changes; the other 43 event categories are unchanged. The sniper A/B baseline is the actual 0.181 bank (heavy-projectile-v0178 clips). Player sniper has a separate five-voice group and 35 ms duplicate guard independent of NPC cooldowns/variation bags, retaining the .55 sniper trim, foreground ducking and shared .90 peak budget / .72 output trim. This resolves the reproduced shared-weapon-slot rejection and avoids the old 220 ms gate in rapid cinematics.

audit/sniper-preview-v0182.wav plays eight takes at production gain. It is an offline audition, not a browser recording or a subjective listening assessment. All user-provided MP3s and their fragments remain excluded from active/comparison banks and curated source export.

## Runtime mix revision 0.181 (2026-10-04)

PCM assets, licenses and generators remain unchanged. Grenade/ultimate impacts no longer share the mine cooldown; airstrike detonations explicitly use grenadeBlast via airstrikeImpact. Pickup/chest and major actions have separate voice groups without crowd attenuation. Sniper gain is multiplied by .55; foreground cues duck existing/new background gunshots to .42 with 8 ms attack and 90 ms recovery time constants. This is targeted gain automation, not a compressor or new recording.

Reservation now measures each cached buffer's absolute PCM peak: backgrounds may reserve .52, actions .72 and feedback .90 of the global pre-output peak budget. The .72 master trim remains. Nominal reservations are not reclaimed during ducking, keeping recovery bounded. Top-tier ultimate movement and landing are synchronized with the animation, alongside weapon-specific shots. These changes do not alter sample provenance or create new copyright claims.

audit/action-mix-v0181.wav is an offline production-scheduling/gain model of 17 overlapping combat events, not captured browser audio. Existing historical previews document their original versions and gains. No subjective listening or device-quality claim is made.

## Heavy sniper report (2026-10-04)

Eight newly generated sniper clips from tools/design-projectile-audio.cjs replace the 0.177 sniper only. A user audio reference informed broad goals (weight, pressure body, decay); no recorded samples, extracted envelope/spectrum arrays, convolution IRs or transformed reference audio enter the generator, sound banks or export. Synthesis uses independently seeded noise, analytic transients, oversampling and a short mechanical layer. The original uploaded MP3 stays outside the project/export.

Sniper comparison preserves 0.177 generated PCM. Other active categories are unchanged. All generated assets are regenerated and hash-verified on build. Technical provenance does not establish exclusive legal rights. audit/sniper-preview-v0178.wav is an offline four-shot audition at runtime gain, not an auditory quality assessment or browser recording.

## Readable event signatures (2026-10-04)

tools/design-readable-audio.cjs generates 26 original clips: level, pickup, chest, airstrike, gas and tank each have three takes; sniper has eight. No input recordings, external IRs, reverb, saturation or compression. Two-times oversampling and an anti-alias FIR are used during rendering; no master low-pass was added. Seeds, parameters and generator hashes are recorded and verified byte-for-byte on build. This documents provenance, not an assurance of exclusive copyright.

The seven comparison categories retain the actual 0.176 PCM. Other comparisons remain historical. Active bank: 44 events / 135 clips. The feedback reserve and output headroom are unchanged. audit/readable-preview-v0177.wav uses production gain/scheduling for level, pickup, chest, airstrike, gas, tank and three sniper takes. Offline PCM diagnostics are not subjective listening or browser capture. User MP3s and their fragments remain excluded from both banks and the curated export.

## Pickup feedback and precision rifle (2026-10-03)

The lost-pickup defect was reproduced: three ordinary Foley voices could reject pickup; two high-priority cue voices could reject a chest reward. Quiet PCM and crowd attenuation compounded masking. Pickup/chest now have a separate two-voice feedback bus, gain .95 and no crowd attenuation. Non-feedback voices may reserve at most .72 of the shared .90 nominal peak budget, leaving .18 for immediate feedback. The .72 output trim, mute policy and duplicate cooldowns remain. No global gain increase or compressor was added.

tools/design-precision-audio.cjs generates 14 new clips with no source recordings: eight distinct sniper shots and three variants each of pickup and chest. Sniper has its own ballistic attack/body plus dry bolt lift/ejection/close at approximately 0.17–0.30 seconds, not a slowed generic automatic shot. Pickup uses a firm short latch/contact without a melody. Seeds, parameters and hashes remain in the manifest; build regenerates and verifies every shipped procedural clip.

Current bank remains 44 events / 135 clips. Sniper and pickup/chest Before now use actual 0.175 PCM; other baselines are unchanged. `audit/precision-preview-v0176.wav` plays pickup, reward and four sniper shots at runtime gain. `audit/dense-mix-v0176.json` describes an offline mixed scenario. Neither is a real browser recording or subjective listening assessment.

## Comfort and variation pass (2026-10-03)

91 newly generated clips replace/extend 22 categories using tools/design-comfort-audio.cjs (equations and seeded noise, no input recordings). Five weapons now have eight distinct takes each: different stochastic attacks, body decay/bandwidth, mechanism timing and small timbral differences, not only playback pitch. Runtime uses per-event shuffled bags, every take once per bag and no adjacent repeat at bag boundaries. Local audio PRNG does not consume gameplay randomness. Playback variations are limited to approximately ±1% rate and attenuation-only gain.

Six stylized pet voices (chicken, dog, cat, parrot, boar, mole), a quieter chick cue and a short pet-down cue replace shared creature cries. Species cooldowns are 8–12 seconds (chicken: 9); all pet vocalizations share a 5-second gap and one voice slot. Egg laying and hatching are distinct cues but share this cap. Reviving/recalling a pet uses its species cue. Dog bites and knife swishes are brief lower-level contacts; the cat's firearm now uses a quiet gun sound, not a slash.

Pickup/chest cues are short material/latch sounds without musical notes. Heart, haste and invulnerability ground pickups use the small pickup cue; level-up/revival elsewhere retain their roles. Full mines, parrot mini-mines and pet explosions have separate short aperiodic blasts; generic explosion is also shortened. No oscillating bass-drum tail or extra hiss layer. Recorded asset origins below still apply to retained effects.

Transient explosions share a 120 ms sound-only window; simultaneous mines still all deal damage. Blast bus gain is .65 (was .78); summed reserved peak budget .90 before .72 output trim (nominal aligned PCM ceiling .648). No compressor/makeup gain, limiter distortion, reverb or global low-pass added. This is digital headroom, not a guarantee of listening comfort or hearing safety.

Current bank: 44 named categories / 135 clips. Changed existing categories compare against actual 0.174 in ADMIN; unchanged comparisons retain older baselines. All original generators needed to verify those archived clips are included. Ten additional pet/mine previews preserve all existing QA controls.

Reproduce new clips: `node tools/design-comfort-audio.cjs`; run `node tests/audio-comfort.test.cjs --write-preview` to generate the isolated audition and an offline dense mix through production event scheduling, cooldowns, gains and voice limits. This is not captured browser audio. A numerical peak/no-clipping check cannot establish that the timbre is good; user listening is still required.

## Original action cues (2026-10-03)

Seven short original designs / 21 clips: pickup, chest reward, crate landing, grenade throw, grenade blast, ultimate start and ultimate impact. Generated by tools/design-action-audio.cjs from seeded noise and equations, with no input recordings. The source and WAV hashes, seeds and parameters are included in the manifest; the build regenerates these files and compares exact bytes.

Ordinary pickup no longer plays the reward jingle. Rare/elite rewards have one sound owner, eliminating duplicate calls. An elite crate landing is not a reward. The grenade release is separate from its detonation after the existing fuse; other explosions retain their own sound. Ultimate start and impact replace the old force-field cue and generic explosions, with no changes to ultimate gunshots, damage, timing, or dragon behavior.

Before/After for chest and ultimate start compares with their actual 0.173 recordings; other comparisons remain 0.171 or legacy synthesis. Seven additional ADMIN preview buttons use the actual SFX gains, without spending items, saves, or ultimate charge.

Reproduce: `node tools/design-action-audio.cjs`. `audit/action-preview-v0174.wav` is an offline audition in this order: pickup, reward, landing, grenade throw, grenade blast, ultimate start, ultimate impact. It uses nominal production gain, not loudness normalization, and is not captured browser gameplay. Human listening remains required. The 0.173 weapon PCM is unchanged.

## Original weapon designs (2026-10-03)

Rifle, shotgun, sniper, minigun and turret: 15 newly synthesized clips (three variants each), generated specifically for this project by tools/design-original-weapons.cjs. The generator reads no input audio. It combines a short pressure pulse, seeded band-limited stochastic transients/body and brief mechanical modal clicks, with 2x oversampling, anti-alias downsampling and bounded gain. No reverb, convolution impulse response, sampled gun report, waveform matching or reference fragments are used. General direction: dry, crisp attack, brief body and mechanical detail; not a reproduction of a particular recording.

The two user-supplied reference MP3s and all their edited excerpts are excluded from the current bank, the comparison bank, and the 0.173 source export. Earlier 0.172 local archives are unchanged and remain subject to their original warning; do not use them as a release source. Changing pitch/EQ alone was not used as a way to relabel a recording's origin.

This records technical provenance, not a guarantee of exclusive copyright in generated effects or a legal clearance opinion for the entire game. No third-party sample license is asserted for the new generated weapon PCM.

Reproduce: `node tools/design-original-weapons.cjs`, then `node tests/run-arena.cjs`. All 15 WAVs reproduce byte-for-byte with the shipped Node generator. Seeds, parameters, generator hash and WAV hashes are stored in assets/audio/manifest.json. Runtime still uses prepared PCM, not live synthesis, so device CPU and playback timing are unchanged.

## Current non-weapon sounds — credited CC0 libraries

These are the previously checked source declarations (2026-10-02); no new source recordings were downloaded for 0.173. CC0 text: https://creativecommons.org/publicdomain/zero/1.0/

- **Independent.nu, 37 hits/punches**, submitted by qubodup: https://opengameart.org/content/37-hitspunches . Download: https://opengameart.org/sites/default/files/independent_nu_ljudbank-hits_and_punches.7z . hit10/11/12/13/14 for enemy/player contacts. Some originals are previously encoded recordings, not a claim of lossless capture.
- **rubberduck, 80 CC0 creature SFX**: https://opengameart.org/content/80-cc0-creature-sfx . Download: https://opengameart.org/sites/default/files/80-CC0-creature-SFX_0.zip . roar_01/02/03, hurt_02, eat_03, cute_04/08.
- **Kenney, Sci-fi Sounds**: https://kenney.nl/assets/sci-fi-sounds . Download: https://kenney.nl/media/pages/assets/sci-fi-sounds/6b296f9ecf-1677589334/kenney_sci-fi-sounds.zip . explosionCrunch_000/001/002/003, forceField_001/002, thrusterFire_000/001/002/004, spaceEngineSmall_001 and engineCircular_002.
- **Kenney, RPG Audio**: https://kenney.nl/assets/rpg-audio . Download: https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip . Impacts, coins, cloth and mechanisms. Pack license included as KENNEY_RPG_LICENSE.txt.
- **Kenney, Interface Sounds**: https://kenney.nl/assets/interface-sounds . Download: https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip . Clicks, glass and confirmation cues; KENNEY_INTERFACE_LICENSE.txt included.
- **Kenney, Music Jingles**: https://kenney.nl/assets/music-jingles . Download: https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip . Short Pizzicato reward/heal/victory cues.

These designed effects do not purport to be literal recordings of fantasy animals, explosions or engines. Every recorded layer retains source IDs, download filenames/hashes, decoded source excerpts, offsets and processing metadata in the manifest. These hashes establish provenance, not licensing by themselves.

## ADMIN comparison bank (0.171, plus 0.173 chest/ultimate; NOT 0.172 weapons)

The existing 30 Before/After pairs are retained. Before uses actual 0.173 chest/ultimate PCM, 0.171 PCM for other available categories, otherwise the earlier in-project procedural recipe. After uses the current bank. Both use the same current mixer. Additional previously credited CC0 sources used by the comparison bank:

- **kurt, Gunshots**: https://opengameart.org/content/gunshots . 22 Pistol.wav and Black Powder.wav; declaration checked 2026-10-01. Short stylized edits, not recordings of the game's exact weapons.
- **NenadSimic, Muffled Distant Explosion**: https://opengameart.org/content/muffled-distant-explosion . Designed low-pitched log-drum sound, only in historical comparison.
- **trazzz123, CC0 Deep Monster Roar**: https://opengameart.org/content/cc0-deep-monster-roar . monster_roar.wav.
- **AntumDeluge, Fire Crackling**: https://opengameart.org/content/fire-crackling/ . fire-1.wav.
- **AntumDeluge, Large Wings Flap**, based on dave.des: https://opengameart.org/content/large-wings-flap and https://freesound.org/s/127197/ . wings_flap_large.flac; WINGS_LICENSE.txt included.
- **bart, Steam release sounds**: https://opengameart.org/content/steam-release-sounds . steam hisses - Marker #1.wav.
- **jwiese, Engine/Mechanic working sound**: https://opengameart.org/content/enginemechanic-working-sound . start.flac, using the page's CC0 option.

## Packaging and verification

135 active clips across 44 named events. Build rejects unknown source IDs and user-reference metadata in either bank. Generated weapons and action cues are regenerated and compared byte-for-byte on build. Export copies only manifest-referenced prepared WAVs and their source excerpts; it does not recursively copy the working audio/archive folders. No user MP3s, their excerpts, old reference-based preview or preparation script is shipped in 0.176.

`audit/weapon-preview-v0173.wav` is an offline audition (rifle, shotgun, sniper, minigun, turret), at nominal game gain, not a live browser recording. Numerical checks do not establish subjective audio quality; speaker/headphone listening remains a manual check. Existing game balance, audio mixer, mute behavior and save data are unchanged.
