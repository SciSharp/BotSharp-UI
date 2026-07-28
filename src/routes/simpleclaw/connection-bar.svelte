<script>
	import { showSimpleClaw } from '$lib/services/simpleclaw-service';

	/**
	 * @type {{
	 *   status: import('$simpleclawTypes').SimpleClawStatus | null,
	 *   agentCount: number
	 * }}
	 */
	let { status = null, agentCount = 0 } = $props();

	// Three different problems that need three different actions from the user. Collapsing
	// them into one "something went wrong" is the difference between a fix and a shrug.
	const HINTS = {
		notInstalled: 'SimpleClaw was not found on this machine. Install it, then reopen this page.',
		notRunning: 'SimpleClaw is installed but not running. Start it, then try again.',
		unauthorized: 'SimpleClaw restarted and issued a new key. Try again in a moment.',
		notDesktop: 'SimpleClaw can only be reached from the desktop app.'
	};

	let hint = $derived.by(() => {
		const kind = status?.error?.kind;
		if (!kind) return '';
		return HINTS[/** @type {keyof typeof HINTS} */ (kind)] ?? status?.error?.message ?? '';
	});
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-3 sm:px-6">
	<!-- Status pill. The word carries the state; the dot and tint only reinforce it. -->
	<span
		class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
			{status?.connected ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}"
	>
		<span
			class="h-1.5 w-1.5 rounded-full {status?.connected ? 'bg-success' : 'bg-gray-400'}"
			aria-hidden="true"
		></span>
		{status?.connected ? 'Connected' : 'Not connected'}
	</span>

	{#if status?.connected}
		<span class="flex items-center gap-1.5 text-xs text-gray-400">
			<span>v{status.version ?? '?'}</span>
			{#if status.organization}
				<span aria-hidden="true">·</span>
				<span>{status.organization}</span>
			{/if}
			<span aria-hidden="true">·</span>
			<span>{agentCount} {agentCount === 1 ? 'agent' : 'agents'}</span>
		</span>
		{#if status.busy}
			<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
				Busy
			</span>
		{/if}
	{:else if hint}
		<span class="text-xs text-gray-500">{hint}</span>
	{/if}

	<button
		type="button"
		class="ml-auto inline-flex cursor-pointer items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
		onclick={() => showSimpleClaw().catch(() => {})}
	>
		Open Executor
	</button>
</div>
