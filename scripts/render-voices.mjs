#!/usr/bin/env node
// Render The Supa Recap's lines to audio files, so every device plays the same voices.
//
// STATUS: written but NOT yet run. It needs a Google Cloud API key with the
// Text-to-Speech API enabled, and the voice choices below need tuning by ear
// against the reference phone (see /voice-check.html).
//
// Usage (Node 18+, from the repo root):
//   GOOGLE_TTS_API_KEY=... node scripts/render-voices.mjs            # render lines that have no audio yet
//   GOOGLE_TTS_API_KEY=... node scripts/render-voices.mjs --force    # re-render everything
//   GOOGLE_TTS_API_KEY=... node scripts/render-voices.mjs --list     # print the service's English voices and exit
//
// It writes shows/supa-recap/audio/<episode>/<nn>.mp3 and adds an "audio" path to each
// line in shows/supa-recap/episodes.json. The player uses the file when the path is
// there and falls back to the device voice when it is not.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const KEY = process.env.GOOGLE_TTS_API_KEY;
const DATA = 'shows/supa-recap/episodes.json';
const OUT_DIR = 'shows/supa-recap/audio';
const API = 'https://texttospeech.googleapis.com/v1';

// Same pitch and speed the pages use for device voices.
const PROFILES = {
  'SCRATCHY': { pitch: 0.7, rate: 0.95 }, 'PEARL': { pitch: 1.5, rate: 1.15 }, 'EL JAGUAR': { pitch: 0.5, rate: 0.85 },
  'AUNT BARB': { pitch: 1.2, rate: 0.9 }, 'NARRATOR': { pitch: 1.0, rate: 0.92 },
};
// Same accent rule the pages use, so a character gets the accent it has on the reference phone.
const ACCENTS = ['en-AU', 'en-GB', 'en-IN', 'en-NG', 'en-US'];
const FALLBACK = { 'en-AU': ['en-GB', 'en-US'], 'en-GB': ['en-AU', 'en-US'], 'en-IN': ['en-GB', 'en-US'], 'en-NG': ['en-GB', 'en-IN', 'en-US'], 'en-US': ['en-GB', 'en-AU'] };
// Optional: force an exact service voice per character once one is picked by ear, e.g. { 'PEARL': 'en-IN-Standard-A' }.
const VOICE_OVERRIDE = {};

const accentFor = (who) => ACCENTS[[...who].reduce((a, ch) => a + ch.charCodeAt(0), 0) % ACCENTS.length];
// Browser pitch runs 0 to 2 with 1 as normal; the service takes semitones from -20 to 20.
const semitones = (p) => Math.max(-20, Math.min(20, 12 * Math.log2(p)));

async function listVoices() {
  const r = await fetch(`${API}/voices?key=${KEY}`);
  if (!r.ok) throw new Error(`voices.list failed: ${r.status} ${await r.text()}`);
  return (await r.json()).voices.filter((v) => v.languageCodes.some((c) => c.startsWith('en-')));
}

function chooseVoice(who, voices) {
  if (VOICE_OVERRIDE[who]) return { name: VOICE_OVERRIDE[who], languageCode: VOICE_OVERRIDE[who].split('-').slice(0, 2).join('-') };
  const want = accentFor(who);
  for (const loc of [want, ...(FALLBACK[want] || [])]) {
    const m = voices.filter((v) => v.languageCodes.includes(loc));
    if (!m.length) continue;
    // Standard voices are the closest family to a phone's built-in voice, and they accept pitch changes.
    const std = m.filter((v) => /Standard/.test(v.name)).sort((a, b) => a.name.localeCompare(b.name));
    const pick = std[0] || m[0];
    if (loc !== want) console.warn(`  note: no ${want} voice for ${who}; using ${pick.name}`);
    return { name: pick.name, languageCode: loc };
  }
  throw new Error(`no English voice available for ${who}`);
}

async function synth(text, voice, prof) {
  const body = {
    input: { text },
    voice: { languageCode: voice.languageCode, name: voice.name },
    audioConfig: { audioEncoding: 'MP3', pitch: +semitones(prof.pitch).toFixed(2), speakingRate: prof.rate },
  };
  const r = await fetch(`${API}/text:synthesize?key=${KEY}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`synthesize failed (${voice.name}): ${r.status} ${await r.text()}`);
  return Buffer.from((await r.json()).audioContent, 'base64');
}

async function main() {
  if (!KEY) { console.error('Set GOOGLE_TTS_API_KEY first.'); process.exit(1); }
  const voices = await listVoices();
  if (process.argv.includes('--list')) { for (const v of voices) console.log(v.name, v.languageCodes.join(','), v.ssmlGender); return; }
  const force = process.argv.includes('--force');
  const data = JSON.parse(await readFile(DATA, 'utf8'));
  for (const ep of data.episodes) {
    const dir = path.join(OUT_DIR, ep.id);
    await mkdir(dir, { recursive: true });
    for (const [i, line] of ep.lines.entries()) {
      if (line.audio && !force) continue;
      const file = path.join(dir, String(i + 1).padStart(2, '0') + '.mp3');
      const voice = chooseVoice(line.who, voices);
      const prof = PROFILES[line.who] || { pitch: 1, rate: 1 };
      await writeFile(file, await synth(line.text, voice, prof));
      line.audio = '/' + file.split(path.sep).join('/');
      console.log(`${ep.id} ${i + 1}/${ep.lines.length} ${line.who} -> ${voice.name}`);
    }
  }
  await writeFile(DATA, JSON.stringify(data, null, 2) + '\n');
  console.log('Done. Commit the audio folder and episodes.json.');
}
main().catch((e) => { console.error(e.message); process.exit(1); });
