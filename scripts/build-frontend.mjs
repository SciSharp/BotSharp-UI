/**
 * Builds the frontend for DISTRIBUTION, with a credential check that fails the build.
 *
 * `PUBLIC_`-prefixed values are inlined into the client bundle, so any credential kept in an
 * .env file for local convenience ships inside whatever is distributed and is readable by
 * anyone who unpacks it. This blanks those values and then VERIFIES they are actually gone.
 *
 * The verification is the point, not the blanking. `.env.production` and `.env.staging`
 * happen to define `PUBLIC_ADMIN_*` as empty today, which is what keeps the deployed bundle
 * clean — but that is a convention nothing enforces, and the tracked `.env` holds real
 * values that any mode file omitting the keys would fall through to. This script is the
 * enforcement, so it has to be on the path that actually builds what gets deployed.
 *
 * It used to be reachable only through the script that packaged the desktop app. That build
 * is gone, so the guarantee moved to the web deployment, where it matters just as much: see
 * `build:verified` in package.json and `app_build_command` in the Static Web Apps workflow.
 *
 * Dev builds are left alone — nothing is distributed, so the login prefill stays useful.
 *
 * Usage:
 *   node scripts/build-frontend.mjs                        # --mode production
 *   node scripts/build-frontend.mjs --mode staging
 *   node scripts/build-frontend.mjs --mode staging --verify-only
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { availableModes, loadEnv, projectRoot, resolveMode } from './load-env.mjs';

/** Values that must never be compiled into a distributable bundle. */
const CREDENTIAL_KEYS = ['PUBLIC_ADMIN_USERNAME', 'PUBLIC_ADMIN_PASSWORD'];

const argv = process.argv.slice(2);
const verifyOnly = argv.includes('--verify-only');
const mode = resolveMode(argv, 'production');

const modes = availableModes();
if (!modes.includes(mode)) {
	console.error(`No .env.${mode} file found. Available modes: ${modes.join(', ')}`);
	process.exit(1);
}

const env = loadEnv(mode);
const outputDir = join(projectRoot, 'build');

// Blanking these in process.env wins over the .env files, because Vite applies
// process.env after the dotenv values.
const stripped = CREDENTIAL_KEYS.filter((key) => env[key]);
const overrides = Object.fromEntries(CREDENTIAL_KEYS.map((key) => [key, '']));

if (!verifyOnly) {
	if (stripped.length > 0) {
		console.log(`Stripping from the distributed bundle: ${stripped.join(', ')}`);
	} else {
		// Said out loud, because a check that verifies nothing looks exactly like a check
		// that passed. Nothing to strip means the resolved env already defines these as
		// empty (as `.env.production` does), so there is no value that could leak.
		console.log(`No credentials to strip for mode "${mode}": ${CREDENTIAL_KEYS.join(', ')} are already empty.`);
	}

	const build = spawnSync('npx', ['vite', 'build', '--mode', mode], {
		cwd: projectRoot,
		stdio: 'inherit',
		shell: true,
		env: { ...process.env, ...overrides }
	});

	if (build.status !== 0) process.exit(build.status ?? 1);
}

/**
 * Walks the build output, yielding every file path.
 * @param {string} dir
 * @returns {Generator<string>}
 */
function* walk(dir) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			yield* walk(path);
		} else {
			yield path;
		}
	}
}

// The build only reaches the installer if no credential survived. This is the
// actual guarantee — the process.env override above is just the mechanism.
/** @type {string[]} */
const leaks = [];
for (const key of stripped) {
	const secret = env[key];
	for (const file of walk(outputDir)) {
		if (readFileSync(file, 'utf8').includes(secret)) {
			leaks.push(`${key} found in ${relative(projectRoot, file)}`);
		}
	}
}

if (leaks.length > 0) {
	console.error(`\nRefusing to package: credentials leaked into the build output.`);
	for (const leak of leaks) console.error(`  ${leak}`);
	process.exit(1);
}

if (stripped.length > 0) {
	console.log(`Verified: ${stripped.join(', ')} absent from ${relative(projectRoot, outputDir)}/`);
}
