#!/usr/bin/env node
// Downloads all external IIIF manifests to public/manifests/ during build.
// Run automatically via the "prebuild" npm script.
// Skips files that already exist. Warns on failure but does not abort the build.

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.resolve(__dirname, '../public/manifests');
const CONCURRENCY = 4;

// All external manifests that need to be available locally.
// Add new entries here; the script will skip files that already exist.
const MANIFESTS = [
  // ── Botany ──────────────────────────────────────────────────────────────
  { url: 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k98181886/manifest.json',          file: 'bnf_bpt6k98181886.json' },
  { url: 'https://iiif.lib.harvard.edu/manifests/drs:53988940',                          file: 'harvard_53988940.json' },
  { url: 'https://www.loc.gov/item/2014514195/manifest.json',                            file: 'loc_2014514195.json' },
  { url: 'https://www.loc.gov/item/2006433487/manifest.json',                            file: 'loc_2006433487.json' },
  { url: 'https://www.loc.gov/item/2021666851/manifest.json',                            file: 'loc_2021666851.json' },
  { url: 'https://www.loc.gov/item/2021667445/manifest.json',                            file: 'loc_2021667445.json' },
  { url: 'https://www.loc.gov/item/2021666395/manifest.json',                            file: 'loc_2021666395.json' },
  { url: 'https://iiif.bodleian.ox.ac.uk/iiif/manifest/4f104fd5-16b5-4cd6-99b3-9a8f8868d7ff.json', file: 'bod_4f104fd5-16b5-4cd6-99b3-9a8f8868d7ff.json' },
  { url: 'https://collections.library.yale.edu/manifests/2002046',                       file: 'yul_2002046.json' },
  { url: 'https://kokusho.nijl.ac.jp/biblio/100452358/manifest',                         file: 'nijl_100452358.json' },

  // ── Japanese Natural History (NDL) ──────────────────────────────────────
  { url: 'https://dl.ndl.go.jp/api/iiif/2575428/manifest.json', file: 'ndl_2575428.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575429/manifest.json', file: 'ndl_2575429.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575427/manifest.json', file: 'ndl_2575427.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575430/manifest.json', file: 'ndl_2575430.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575431/manifest.json', file: 'ndl_2575431.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575432/manifest.json', file: 'ndl_2575432.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575433/manifest.json', file: 'ndl_2575433.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575434/manifest.json', file: 'ndl_2575434.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575435/manifest.json', file: 'ndl_2575435.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575436/manifest.json', file: 'ndl_2575436.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575437/manifest.json', file: 'ndl_2575437.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575438/manifest.json', file: 'ndl_2575438.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2558704/manifest.json', file: 'ndl_2558704.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2555682/manifest.json', file: 'ndl_2555682.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2555683/manifest.json', file: 'ndl_2555683.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2555684/manifest.json', file: 'ndl_2555684.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2555685/manifest.json', file: 'ndl_2555685.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2555686/manifest.json', file: 'ndl_2555686.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2555687/manifest.json', file: 'ndl_2555687.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2555688/manifest.json', file: 'ndl_2555688.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575872/manifest.json', file: 'ndl_2575872.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575873/manifest.json', file: 'ndl_2575873.json' },
  { url: 'https://dl.ndl.go.jp/api/iiif/2575874/manifest.json', file: 'ndl_2575874.json' },

  // ── Astronomy / Mathematics ─────────────────────────────────────────────
  { url: 'https://iiif.bodleian.ox.ac.uk/iiif/manifest/cc1c2e51-8daf-49e9-b164-618d563d15d5.json', file: 'bod_cc1c2e51-8daf-49e9-b164-618d563d15d5.json' },
  { url: 'https://www.loc.gov/item/50049695/manifest.json',       file: 'loc_50049695.json' },
  { url: 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k10402533/manifest.json', file: 'bnf_bpt6k10402533.json' },
  { url: 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k3414705j/manifest.json', file: 'bnf_bpt6k3414705j.json' },
  { url: 'https://www.loc.gov/item/2021667076/manifest.json',     file: 'loc_2021667076.json' },
  { url: 'https://www.loc.gov/item/2021666487/manifest.json',     file: 'loc_2021666487.json' },
  { url: 'https://www.loc.gov/item/2021666337/manifest.json',     file: 'loc_2021666337.json' },
  { url: 'https://www.loc.gov/item/2021667242/manifest.json',     file: 'loc_2021667242.json' },
  { url: 'https://www.loc.gov/item/2021667539/manifest.json',     file: 'loc_2021667539.json' },

  // ── Chemistry / Other ────────────────────────────────────────────────────
  { url: 'https://digitalcollections.universiteitleiden.nl/iiif_manifest/item:3641757/manifest', file: 'leiden_3641757.json' },
];

mkdirSync(DEST, { recursive: true });

function fetchWithRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 manifest-downloader/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) { reject(new Error('Too many redirects')); return; }
        const next = new URL(res.headers.location, url).toString();
        resolve(fetchWithRedirects(next, maxRedirects - 1));
        res.resume();
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
  });
}

async function download({ url, file }) {
  const dest = path.join(DEST, file);
  if (existsSync(dest)) {
    console.log(`  skip  ${file}  (already exists)`);
    return;
  }
  try {
    const res = await fetchWithRedirects(url);
    await pipeline(res, createWriteStream(dest));
    console.log(`  done  ${file}`);
  } catch (err) {
    console.warn(`  WARN  ${file}: ${err.message}`);
  }
}

async function main() {
  console.log(`Downloading ${MANIFESTS.length} IIIF manifests → ${DEST}`);
  // Process in batches to limit concurrency
  for (let i = 0; i < MANIFESTS.length; i += CONCURRENCY) {
    await Promise.all(MANIFESTS.slice(i, i + CONCURRENCY).map(download));
  }
  console.log('Manifest download complete.');
}

main().catch((err) => {
  console.error('downloadManifests failed:', err);
  process.exit(1);
});
