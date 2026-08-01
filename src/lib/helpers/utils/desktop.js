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

/**
 * Open one of OUR OWN routes the way the current shell can.
 *
 * `window.open(path, '_blank')` is right in a browser and does NOTHING in the desktop shell:
 * Tauri's webview has no tabs, and it does not implement `window.open` at all — no window is
 * created, no error is raised, the click just appears to be ignored. Every "open in a new tab"
 * button in this app was dead there.
 *
 * Same-window navigation is the honest desktop equivalent: one window is what the shell has.
 * `location.assign` rather than SvelteKit's `goto` on purpose — it reproduces the full page load
 * a new tab would have performed, so the destination starts with the same clean state it gets in
 * a browser instead of inheriting the stores of the page that launched it.
 *
 * For EXTERNAL links this is the wrong function: navigating the only window away from the app to
 * a third-party page has no back button. Those need the shell plugin's opener instead.
 *
 * @param {string} path A route in this app, e.g. `/chat/abc` or `page/conversation/abc`.
 */
export function openAppRoute(path) {
	if (isDesktop()) {
		window.location.assign(path);
		return;
	}
	window.open(path, '_blank');
}

/**
 * Open a link that is NOT ours — a file download, a link out of a chat message, a knowledge-base
 * source — leaving the app where it is.
 *
 * The desktop shell has one window, so `openAppRoute` is the wrong tool here: sending that window
 * to someone else's page strands the user with no back button. It goes to their real browser
 * instead, via the opener plugin (`opener:allow-open-url` in capabilities/default.json). In a
 * browser tab it is an ordinary new tab.
 *
 * `noopener,noreferrer` matters on the browser path: these URLs arrive from model output, from
 * rich-content payloads and from uploaded documents, and without `noopener` the page that opens
 * inherits a handle it can use to navigate this one.
 *
 * Fire-and-forget by design — every caller is a click handler with nothing to await, and a link
 * that will not open is worth a console error rather than a thrown exception mid-handler. The
 * plugin is imported dynamically so a browser build never loads code whose IPC does not exist
 * there.
 *
 * @param {string | undefined | null} url An absolute URL. No-op when empty.
 */
export function openExternal(url) {
	if (!url) return;

	if (!isDesktop()) {
		window.open(url, '_blank', 'noopener,noreferrer');
		return;
	}

	import('@tauri-apps/plugin-opener')
		.then(({ openUrl }) => openUrl(url))
		.catch((err) => console.error('Could not open the link in the browser:', err));
}

const POPUP_WIDTH = 1200;
const POPUP_HEIGHT = 850;

/**
 * Both shells key a reusable popup by a short string, and Tauri only accepts
 * `[a-zA-Z0-9-/:_]` in a window label, so the two keys are produced here together — a
 * browser popup and a desktop window opened for the same thing must agree on identity or
 * "reuse" silently becomes "open another one".
 *
 * @param {string} seed Identifies WHAT is being shown, not the URL showing it.
 */
function toWindowLabel(seed) {
	return `popup-${String(seed).replace(/[^a-zA-Z0-9\-_]/g, '-').slice(0, 48)}`;
}

/** djb2, only ever used to turn a URL into a legal label when the caller had no better key. */
function hashLabel(/** @type {string} */ value) {
	let h = 5381;
	for (let i = 0; i < value.length; i++) {
		h = ((h << 5) + h + value.charCodeAt(i)) | 0;
	}
	return (h >>> 0).toString(36);
}

/**
 * Open a URL in a window of its own, floating over the app instead of replacing it or
 * handing it off to a different program.
 *
 * This is for pages someone has to WORK in while the conversation that produced them stays
 * on screen. The autoplay live view is the case it exists for: the link is a running browser
 * session with controls the person may need to drive, and both other options fail it —
 * `openAppRoute` costs them the chat on the desktop, and `openExternal` moves the run into a
 * program that knows nothing about the app. Ordinary links out of a message are NOT this and
 * still belong in `openExternal`.
 *
 * Desktop: a second Tauri webview window, created through the API because the shell does not
 * implement `window.open` (see `openAppRoute`). Needs `core:webview:allow-create-webview-window`
 * plus the focus permissions in capabilities/default.json. A window already open under the
 * same label is raised rather than duplicated — a second click on the same run is "show me
 * that again", and the live URL carries a freshly minted token each time it is emitted, which
 * is why the label has to come from the caller's stable id and not from the URL.
 *
 * Browser: a real popup rather than a tab, for the same "beside the chat, not instead of it"
 * reason, reused by window name. `noopener`/`noreferrer` are deliberately absent even though
 * these URLs arrive in model output: either one makes `window.open` return null unconditionally,
 * which would both defeat name reuse and make a blocked popup indistinguishable from a normal
 * open. The handle is severed by hand instead, which leaves only the referrer as the cost.
 *
 * @param {string | undefined | null} url An absolute URL. No-op when empty.
 * @param {{ label?: string, title?: string, width?: number, height?: number }} [opts]
 *   `label` identifies the thing being shown (e.g. a run id) and drives window reuse.
 */
export function openPopup(url, opts = {}) {
	if (!url) return;

	const width = opts.width || POPUP_WIDTH;
	const height = opts.height || POPUP_HEIGHT;
	const label = toWindowLabel(opts.label || hashLabel(url));

	if (!isDesktop()) {
		const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
		const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
		const opened = window.open(
			url,
			label,
			`popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
		);

		// null means the blocker took it. A swallowed click is worse than the wrong window,
		// so fall back to the behaviour every other link in the app already has.
		if (!opened) {
			openExternal(url);
			return;
		}

		try {
			// Cross-origin `opener` is settable per spec, but a browser that disagrees must not
			// take the click down with it — the window is already open by this point.
			opened.opener = null;
			opened.focus();
		} catch {
			/* the window opened; losing the handle to it is not a failure worth reporting */
		}
		return;
	}

	import('@tauri-apps/api/webviewWindow')
		.then(async ({ WebviewWindow }) => {
			const existing = await WebviewWindow.getByLabel(label);
			if (existing) {
				await existing.unminimize().catch(() => {});
				await existing.setFocus();
				return;
			}

			const popup = new WebviewWindow(label, {
				url,
				title: opts.title || 'BotSharp',
				width,
				height,
				resizable: true,
				center: true,
				focus: true
			});
			// The constructor resolves before the shell has actually built the window; a refused
			// permission or an unloadable URL arrives here instead of as a rejected promise.
			popup.once('tauri://error', (e) => {
				console.error('Could not open the popup window:', e.payload);
				openExternal(url);
			}).catch(() => {});
		})
		.catch((err) => {
			console.error('Could not open the popup window:', err);
			openExternal(url);
		});
}
