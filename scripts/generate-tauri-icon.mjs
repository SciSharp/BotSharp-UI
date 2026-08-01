/**
 * Generates the Tauri app icon set from an image named in the .env files.
 *
 * Tauri embeds app icons into the binary at compile time, so this runs as an
 * explicit step before `tauri build` rather than at runtime.
 *
 * Usage:
 *   node scripts/generate-tauri-icon.mjs                     committed .env default
 *   node scripts/generate-tauri-icon.mjs --mode staging
 *   node scripts/generate-tauri-icon.mjs --mode staging --var PUBLIC_FAVICON_URL
 *
 * With no --mode the committed .env is used, so the icon set checked into the
 * repo is the project's own logo rather than whichever brand was built last.
 *
 * The value may be an absolute http(s) URL or a path relative to static/
 * (matching how the browser resolves it at runtime). PNG and SVG are supported.
 *
 * `tauri icon` requires a square source, so non-square logos are padded onto a
 * square transparent canvas first.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { availableModes, loadEnv, projectRoot, resolveMode } from './load-env.mjs';

const argv = process.argv.slice(2);

// A mode that was asked for explicitly has to exist; with no mode we fall back
// to the committed .env, which every clone has.
const requestedMode = resolveMode(argv, '');
const modes = availableModes();
if (requestedMode && !modes.includes(requestedMode)) {
	console.error(`No .env.${requestedMode} file found. Available modes: ${modes.join(', ')}`);
	process.exit(1);
}
const mode = requestedMode || 'default';

const varFlagIndex = argv.indexOf('--var');
const envVar = varFlagIndex === -1 ? 'PUBLIC_LOGO_URL' : argv[varFlagIndex + 1];

const envLabel = requestedMode ? `.env.${requestedMode}` : '.env';

const env = loadEnv(mode);
const iconUrl = env[envVar];
if (!iconUrl) {
	console.error(`${envVar} is not set in ${envLabel} — nothing to generate.`);
	process.exit(1);
}

/**
 * Resolves the configured image to a local file, downloading it when remote.
 * @param {string} url
 * @returns {Promise<string>} absolute path to the source image
 */
async function resolveSourceImage(url) {
	if (!/^https?:\/\//i.test(url)) {
		const localPath = join(projectRoot, 'static', url);
		if (!existsSync(localPath)) {
			throw new Error(`${envVar} points to "${url}" but ${localPath} does not exist.`);
		}
		return localPath;
	}

	console.log(`Downloading ${url}`);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download image: HTTP ${response.status} ${response.statusText}`);
	}

	const extension = new URL(url).pathname.match(/\.(png|svg|ico|jpe?g|webp)$/i)?.[0] ?? '.png';
	const downloadPath = join(tmpdir(), `tauri-icon-source-${mode}${extension}`);
	writeFileSync(downloadPath, Buffer.from(await response.arrayBuffer()));
	return downloadPath;
}

/**
 * Reads image dimensions from PNG and ICO headers so we can warn about sources
 * too small to upscale cleanly. Returns null for formats we don't parse.
 * @param {string} filePath
 * @returns {{ width: number, height: number } | null}
 */
function readDimensions(filePath) {
	const buffer = readFileSync(filePath);

	const isPng = buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47;
	if (isPng) {
		return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
	}

	const isIco = buffer.length > 8 && buffer.readUInt16LE(0) === 0 && buffer.readUInt16LE(2) === 1;
	if (isIco) {
		// A zero byte in the ICO directory encodes 256px.
		return { width: buffer[6] || 256, height: buffer[7] || 256 };
	}

	return null;
}

/**
 * Reads the user-space box of an SVG from its viewBox, falling back to the
 * width/height attributes.
 * @param {string} markup
 * @returns {{ minX: number, minY: number, width: number, height: number } | null}
 */
function readSvgBox(markup) {
	const rootTag = markup.match(/<svg\b[^>]*>/i)?.[0];
	if (!rootTag) return null;

	const viewBox = rootTag.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1];
	if (viewBox) {
		const [minX, minY, width, height] = viewBox
			.trim()
			.split(/[\s,]+/)
			.map(Number);
		if ([minX, minY, width, height].every((n) => Number.isFinite(n)) && width > 0 && height > 0) {
			return { minX, minY, width, height };
		}
	}

	const width = Number.parseFloat(rootTag.match(/\bwidth\s*=\s*["']([\d.]+)/i)?.[1] ?? '');
	const height = Number.parseFloat(rootTag.match(/\bheight\s*=\s*["']([\d.]+)/i)?.[1] ?? '');
	if (width > 0 && height > 0) return { minX: 0, minY: 0, width, height };

	return null;
}

/**
 * Centres an SVG on a square canvas by rewriting its viewBox and offsetting the
 * original content, keeping everything vector.
 * @param {string} markup
 * @param {{ minX: number, minY: number, width: number, height: number }} box
 * @returns {string}
 */
function padSvgToSquare(markup, box) {
	const side = Math.max(box.width, box.height);
	const dx = (side - box.width) / 2 - box.minX;
	const dy = (side - box.height) / 2 - box.minY;

	const rootTag = /** @type {string} */ (markup.match(/<svg\b[^>]*>/i)?.[0]);
	const inner = markup.slice(
		markup.indexOf(rootTag) + rootTag.length,
		markup.lastIndexOf('</svg>')
	);

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" ` +
		`viewBox="0 0 ${side} ${side}" fill="none">` +
		`<g transform="translate(${dx} ${dy})">${inner}</g>` +
		`</svg>\n`
	);
}

/**
 * Centres a raster image on a square SVG canvas by embedding it as a data URI,
 * which `tauri icon` rasterises at every size it needs.
 * @param {string} filePath
 * @param {{ width: number, height: number }} dimensions
 * @returns {string}
 */
function padRasterToSquare(filePath, dimensions) {
	const side = Math.max(dimensions.width, dimensions.height);
	const x = (side - dimensions.width) / 2;
	const y = (side - dimensions.height) / 2;

	const mime = filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
	const dataUri = `data:${mime};base64,${readFileSync(filePath).toString('base64')}`;

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" ` +
		`viewBox="0 0 ${side} ${side}">` +
		`<image x="${x}" y="${y}" width="${dimensions.width}" height="${dimensions.height}" ` +
		`href="${dataUri}"/>` +
		`</svg>\n`
	);
}

/**
 * Returns a square version of the source, padding it only when necessary.
 * @param {string} filePath
 * @returns {string} path to a square image
 */
function ensureSquare(filePath) {
	const isSvg = filePath.toLowerCase().endsWith('.svg');

	if (isSvg) {
		const markup = readFileSync(filePath, 'utf8');
		const box = readSvgBox(markup);
		if (!box) {
			throw new Error(`Could not read the dimensions of ${filePath} — no viewBox or width/height.`);
		}
		if (box.width === box.height) return filePath;

		console.log(`Padding ${box.width}x${box.height} to ${Math.max(box.width, box.height)} square`);
		const paddedPath = join(tmpdir(), `tauri-icon-square-${mode}.svg`);
		writeFileSync(paddedPath, padSvgToSquare(markup, box));
		return paddedPath;
	}

	const dimensions = readDimensions(filePath);
	if (!dimensions) {
		throw new Error(
			`Could not read the dimensions of ${filePath}. Supply a square PNG or SVG instead.`
		);
	}
	if (dimensions.width === dimensions.height) return filePath;

	console.log(
		`Padding ${dimensions.width}x${dimensions.height} to ` +
			`${Math.max(dimensions.width, dimensions.height)} square`
	);
	const paddedPath = join(tmpdir(), `tauri-icon-square-${mode}.svg`);
	writeFileSync(paddedPath, padRasterToSquare(filePath, dimensions));
	return paddedPath;
}

const source = await resolveSourceImage(iconUrl);
const dimensions = readDimensions(source);

console.log(`Mode:   ${requestedMode || '(none)'} (${envLabel})`);
console.log(`Source: ${source}${dimensions ? ` (${dimensions.width}x${dimensions.height})` : ''}`);

if (dimensions && Math.min(dimensions.width, dimensions.height) < 256) {
	console.warn(
		`\nWarning: the source is ${dimensions.width}x${dimensions.height}, but Windows app ` +
			`icons render at up to 256x256 and macOS at 1024x1024.\n` +
			`Upscaling will look blurry. Supply a 1024x1024 PNG or an SVG for a crisp icon.\n`
	);
}

const result = spawnSync('npx', ['tauri', 'icon', ensureSquare(source)], {
	cwd: projectRoot,
	stdio: 'inherit',
	shell: true
});

process.exit(result.status ?? 1);
