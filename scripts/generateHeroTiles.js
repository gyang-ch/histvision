#!/usr/bin/env node
// Generates public/data/hero-tiles.json from illustrations.public.jsonl.
// Run once (or as part of prebuild) to avoid downloading 11.6 MB at page load.
// Output: an array of SETS_COUNT sets, each containing ROWS*PER_ROW image paths.

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const ROWS = 5
const PER_ROW = 13
const TILE_COUNT = ROWS * PER_ROW  // 65
const SETS_COUNT = 10              // pre-generate 10 different mosaics

const jsonlPath = join(ROOT, 'public', 'data', 'illustrations.public.jsonl')
const outPath = join(ROOT, 'public', 'data', 'hero-tiles.json')

console.log('Reading JSONL…')
const lines = readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean)
console.log(`  ${lines.length} records found`)

function shuffleSample(arr, n) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

const allPaths = lines
  .map((l) => {
    try {
      return JSON.parse(l).illustration.crop_image
    } catch {
      return null
    }
  })
  .filter(Boolean)

console.log(`  ${allPaths.length} valid crop_image paths`)

const sets = Array.from({ length: SETS_COUNT }, () => shuffleSample(allPaths, TILE_COUNT))

writeFileSync(outPath, JSON.stringify(sets))
const kb = Math.round(Buffer.byteLength(JSON.stringify(sets)) / 1024)
console.log(`Written ${outPath} (${kb} KB, ${SETS_COUNT} sets × ${TILE_COUNT} tiles)`)
