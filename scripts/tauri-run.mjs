/**
 * Runs `tauri dev` / `tauri build` against a specific .env file, so each brand
 * gets its own window title, bundle identifier and frontend configuration.
 *
 * Usage:
 *   node scripts/tauri-run.mjs dev                committed .env default
 *   node scripts/tauri-run.mjs dev   --mode staging
 *   node scripts/tauri-run.mjs build --mode production
 *
 * Desktop-specific values are derived from the env file:
 *   PUBLIC_BRAND_NAME          -> product name + window title
 *   PUBLIC_DESKTOP_IDENTIFIER  -> bundle identifier (optional; derived if unset)
 *
 * Tauri bakes these into the binary at compile time, so the mode has to be
 * chosen here rather than read at runtime.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { availableModes, loadEnv, projectRoot, resolveMode } from './load-env.mjs';

const command = process.argv[2];
if (command !== 'dev' && command !== 'build') {
	console.error(`Expected "dev" or "build" as the first argument, got "${command ?? ''}".`);
	process.exit(1);
}

// A mode that was asked for explicitly has to exist. With no mode we fall back
// to Vite's own default name, which may have no .env file of its own — the
// committed .env then supplies everything, so a fresh clone still builds.
const mode = resolveMode(process.argv.slice(3), command === 'dev' ? 'development' : 'production');
const requestedMode = resolveMode(process.argv.slice(3), '');

const modes = availableModes();
if (requestedMode && !modes.includes(requestedMode)) {
	console.error(`No .env.${requestedMode} file found. Available modes: ${modes.join(', ')}`);
	process.exit(1);
}

const env = loadEnv(mode);

const brandName = env.PUBLIC_BRAND_NAME?.trim();
if (!brandName) {
	console.error(`PUBLIC_BRAND_NAME is not set in .env.${mode} — cannot name the desktop app.`);
	process.exit(1);
}

// A stable, unique identifier per brand keeps installs and app-data
// directories from colliding between builds.
const identifier =
	env.PUBLIC_DESKTOP_IDENTIFIER?.trim() ||
	`com.${brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app'}.desktop`;

const baseConfigPath = join(projectRoot, 'src-tauri', 'tauri.conf.json');
const baseConfig = JSON.parse(readFileSync(baseConfigPath, 'utf8'));

const config = {
	...baseConfig,
	productName: brandName,
	identifier,
	build: {
		...baseConfig.build,
		beforeDevCommand: `npm run dev:vite -- --mode ${mode}`,
		// Not `npm run build` — the desktop bundle has to be stripped of
		// credentials that the web build tolerates.
		beforeBuildCommand: `node scripts/build-frontend.mjs --mode ${mode}`
	},
	app: {
		...baseConfig.app,
		windows: [{ ...baseConfig.app.windows[0], title: brandName }]
	}
};

// Written next to the base config so its relative paths (frontendDist, icons)
// keep resolving the same way. Gitignored.
const generatedConfigPath = join(projectRoot, 'src-tauri', `tauri.${mode}.conf.json`);
writeFileSync(generatedConfigPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Mode:       ${mode} (${modes.includes(mode) ? `.env.${mode}` : '.env'})`);
console.log(`App name:   ${brandName}`);
console.log(`Identifier: ${identifier}`);
console.log(`Backend:    ${env.PUBLIC_SERVICE_URL ?? '(PUBLIC_SERVICE_URL unset)'}\n`);

const result = spawnSync('npx', ['tauri', command, '--config', generatedConfigPath], {
	cwd: projectRoot,
	stdio: 'inherit',
	shell: true
});

process.exit(result.status ?? 1);
