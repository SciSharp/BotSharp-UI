/**
 * Shared helpers for reading the project's .env files from build scripts,
 * following the same precedence Vite uses.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const projectRoot = resolve(import.meta.dirname, '..');

/**
 * Reads KEY=VALUE pairs from a dotenv file, ignoring comments and blank lines.
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function parseEnvFile(filePath) {
	if (!existsSync(filePath)) return {};

	/** @type {Record<string, string>} */
	const values = {};
	for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const separator = line.indexOf('=');
		if (separator === -1) continue;

		const key = line.slice(0, separator).trim();
		// Strip surrounding quotes the same way Vite does.
		const value = line
			.slice(separator + 1)
			.trim()
			.replace(/^["']|["']$/g, '');
		values[key] = value;
	}
	return values;
}

/**
 * Loads `.env`, then `.env.<mode>`, then the matching `.local` overrides —
 * later files win, matching Vite's precedence.
 * @param {string} mode
 * @returns {Record<string, string>}
 */
export function loadEnv(mode) {
	return {
		...parseEnvFile(join(projectRoot, '.env')),
		...parseEnvFile(join(projectRoot, '.env.local')),
		...parseEnvFile(join(projectRoot, `.env.${mode}`)),
		...parseEnvFile(join(projectRoot, `.env.${mode}.local`))
	};
}

/**
 * Resolves the requested Vite mode, accepting every form these scripts get
 * called with:
 *   npm run tauri:dev -- --mode staging    forwarded flag
 *   npm run tauri:dev --mode staging       npm eats the flag and forwards
 *                                          "staging" as a positional argument
 *   node scripts/tauri-run.mjs dev staging
 * @param {string[]} argv arguments after the script's own subcommand
 * @param {string} fallback mode to use when none was requested
 * @returns {string}
 */
export function resolveMode(argv, fallback) {
	for (const flag of ['--mode', '--env']) {
		const flagIndex = argv.indexOf(flag);
		if (flagIndex !== -1 && argv[flagIndex + 1]) return argv[flagIndex + 1];

		const inline = argv.find((arg) => arg.startsWith(`${flag}=`));
		if (inline) return inline.slice(flag.length + 1);
	}

	// `npm run x --mode staging` parses --mode as a boolean config and leaves
	// the value behind as a positional argument. Values belonging to another
	// flag (`--var PUBLIC_LOGO_URL`) are not positionals.
	const positional = argv.find(
		(arg, index) => !arg.startsWith('-') && !argv[index - 1]?.startsWith('-')
	);
	if (positional) return positional;

	for (const fromNpm of [process.env.npm_config_mode, process.env.npm_config_env]) {
		if (fromNpm && fromNpm !== 'true') return fromNpm;
	}

	return fallback;
}

/**
 * Lists the modes that have a matching .env file, for error messages.
 * @returns {string[]}
 */
export function availableModes() {
	return readdirSync(projectRoot)
		.filter((name) => name.startsWith('.env.') && !name.endsWith('.local'))
		.map((name) => name.slice('.env.'.length));
}
