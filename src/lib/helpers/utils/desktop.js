/**
 * Whether the app is running inside the Tauri desktop shell rather than a browser tab.
 *
 * One bundle serves both, so this is a runtime question, not a build-time one. `$env` and
 * `import.meta.env` cannot answer it: the same compiled output is loaded by the shell and by
 * the browser, and only the shell injects `__TAURI_INTERNALS__` into the page.
 *
 * Safe before mount and during prerendering — `window` is absent there, which reads as "not
 * the desktop", the correct answer for a page being rendered to a static file.
 *
 * @returns {boolean}
 */
export function isDesktop() {
	return typeof window !== 'undefined' && !!(/** @type {any} */ (window).__TAURI_INTERNALS__);
}
