#!/usr/bin/env node
/**
 * One-time mirror of cdn.widgetify.ir static assets into public/cdn/ so the
 * extension serves them locally and never calls cdn.widgetify.ir at runtime.
 *
 * Run ONCE from a machine that can reach cdn.widgetify.ir (e.g. your dev box):
 *     node scripts/mirror-cdn-assets.mjs
 *
 * Then rebuild the extension (bun run build). WXT copies public/ to the build
 * root, so public/cdn/extension/logo.png is served at /cdn/extension/logo.png.
 *
 * Re-run any time to refresh; it overwrites. Missing files are warned, not fatal.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const CDN = 'https://cdn.widgetify.ir'
const OUT = resolve(process.cwd(), 'public', 'cdn')

// Every static cdn.widgetify.ir asset referenced in the source (path under the
// cdn root). Wallpaper images/videos are handled separately (backend media seed).
const ASSETS = [
	'effects/alarm-success.mp3',
	'effects/alarm_1.mp3',
	'effects/alarm_success_todo.mp3',
	'effects/alarm_reaction.mp3',
	'effects/alarm_market.mp3',
	'extension/wizard/1.webp',
	'extension/wizard/2.webp',
	'extension/wizard/3.webp',
	'extension/wizard/4.webp',
	'extension/wizard/5.webp',
	'extension/sahel-update.jpg',
	'extension/wig-icon.png',
	'extension/how-to-disable-footer.png',
	'extension/logo.png',
	'extension/empty-mini-app.png',
	'extension/pomodoroTimer-notification.png',
	'system/bookmark.png',
	'sites/google.png',
]

let ok = 0
let failed = 0

async function save(relPath, buf) {
	const dest = join(OUT, relPath)
	await mkdir(dirname(dest), { recursive: true })
	await writeFile(dest, buf)
}

async function download(path) {
	const url = `${CDN}/${path}`
	const res = await fetch(url)
	if (!res.ok) throw new Error(`HTTP ${res.status}`)
	const buf = Buffer.from(await res.arrayBuffer())
	await save(path, buf)
	ok++
	console.log(`  ✓ ${path} (${buf.length.toLocaleString()} bytes)`)
}

// The font CSS references font files via url(...). Download those too and rewrite
// the url() refs to bare filenames so the whole set is served from /cdn/fonts/.
async function mirrorFonts() {
	const cssUrl = `${CDN}/fonts/remote-fonts.css`
	const res = await fetch(cssUrl)
	if (!res.ok) throw new Error(`HTTP ${res.status} ${cssUrl}`)
	let css = await res.text()
	const fontUrls = new Set()
	css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, _q, ref) => {
		if (ref.startsWith('data:')) return m
		const abs = new URL(ref, cssUrl).href
		const file = abs.split('/').pop().split('?')[0]
		fontUrls.add(abs)
		return `url("${file}")`
	})
	await save('fonts/remote-fonts.css', Buffer.from(css, 'utf8'))
	ok++
	console.log('  ✓ fonts/remote-fonts.css')
	for (const abs of fontUrls) {
		try {
			const r = await fetch(abs)
			if (!r.ok) throw new Error(`HTTP ${r.status}`)
			const file = abs.split('/').pop().split('?')[0]
			await save(join('fonts', file), Buffer.from(await r.arrayBuffer()))
			ok++
			console.log(`  ✓ fonts/${file}`)
		} catch (e) {
			failed++
			console.warn(`  ! font ${abs}: ${e.message}`)
		}
	}
}

async function main() {
	console.log(`Mirroring ${CDN} → ${OUT}\n`)
	await mkdir(OUT, { recursive: true })
	await mirrorFonts().catch((e) => {
		failed++
		console.warn(`  ! fonts: ${e.message}`)
	})
	for (const a of ASSETS) {
		try {
			await download(a)
		} catch (e) {
			failed++
			console.warn(`  ! ${a}: ${e.message}`)
		}
	}
	console.log(`\nDone: ${ok} saved, ${failed} failed.`)
	console.log('Now run: bun run build')
}

main()
