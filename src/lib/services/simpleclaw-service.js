/**
 * Thin wrapper over the Tauri commands in src-tauri/src/simpleclaw.rs.
 *
 * Stateless by design, like the other *-service.js modules: it moves calls across the
 * Rust boundary and nothing else. The run loop lives in simpleclaw-orchestrator.js.
 *
 * Everything here is desktop-only. The imports of @tauri-apps/api are deliberately
 * dynamic — a static import would be resolved at module load and break the web build,
 * which ships the same bundle without a Tauri runtime behind it.
 */

/** @returns {boolean} */
export function isDesktop() {
    return typeof window !== 'undefined' && !!(/** @type {any} */ (window).__TAURI_INTERNALS__);
}

/**
 * @param {string} cmd
 * @param {Record<string, any>} [args]
 * @returns {Promise<any>}
 */
async function call(cmd, args = {}) {
    if (!isDesktop()) {
        throw new Error('SimpleClaw is only available in the desktop app.');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke(cmd, args);
}

/**
 * Liveness probe. Never throws for a disconnected SimpleClaw — that is an ordinary
 * state with its own rendering, not an exception.
 * @returns {Promise<import('$simpleclawTypes').SimpleClawStatus>}
 */
export async function getStatus() {
    if (!isDesktop()) {
        return {
            connected: false,
            busy: false,
            queued: 0,
            error: { kind: 'notDesktop', message: 'SimpleClaw requires the desktop app.' }
        };
    }
    return call('simpleclaw_status');
}

/** @returns {Promise<import('$simpleclawTypes').SimpleClawCapabilities>} */
export async function getCapabilities() {
    return call('simpleclaw_capabilities');
}

/**
 * @param {import('$simpleclawTypes').StartRunRequest} req
 * @returns {Promise<import('$simpleclawTypes').StartRunResponse>}
 */
export async function startRun(req) {
    return call('simpleclaw_start_run', { req });
}

/**
 * @param {string} runId
 * @returns {Promise<import('$simpleclawTypes').RunView>}
 */
export async function getRun(runId) {
    return call('simpleclaw_get_run', { runId });
}

/**
 * Relay a run's events to `onEvent`.
 *
 * The stream itself is held by the Rust side, so this only attaches a listener: a page
 * reload re-attaches without interrupting the run. Calling it twice for one run is safe
 * (the Rust side is idempotent), but each call installs its own listener, so always
 * await and keep the returned unsubscribe.
 *
 * @param {string} runId
 * @param {(event: string, data: any) => void} onEvent
 * @returns {Promise<() => void>} unsubscribe
 */
export async function followRun(runId, onEvent) {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen('simpleclaw://run', (e) => {
        const payload = /** @type {any} */ (e.payload);
        if (payload?.runId !== runId) return;
        onEvent(payload.event, payload.data);
    });

    // Attach the listener BEFORE asking Rust to start relaying, otherwise the opening
    // `state` frame can be emitted before anyone is listening for it.
    await call('simpleclaw_follow_run', { runId });

    return () => {
        unlisten();
        call('simpleclaw_unfollow_run', { runId }).catch(() => {});
    };
}

/**
 * @param {string} runId
 * @param {string} text
 */
export async function answerRun(runId, text) {
    return call('simpleclaw_answer_run', { runId, text });
}

/** @param {string} runId */
export async function stopRun(runId) {
    return call('simpleclaw_stop_run', { runId });
}

/** Bring the SimpleClaw window forward — live view and takeover already live there. */
export async function showSimpleClaw() {
    return call('simpleclaw_show_window');
}
