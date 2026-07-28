<script>
	import { showSimpleClaw } from '$lib/services/simpleclaw-service';

	/**
	 * Someone has taken the controls inside SimpleClaw.
	 *
	 * There is deliberately no countdown here. SimpleClaw switches its watchdog off for a
	 * takeover, and this pause may last as long as the person needs. Showing a timer — or
	 * worse, acting on one — would mean killing a run out of somebody's hands.
	 *
	 * @type {{ active: boolean }}
	 */
	let { active = true } = $props();
</script>

<div class="rounded-2xl border border-y-gray-200 border-r-gray-200 border-l-4 border-l-danger bg-white p-4 shadow-sm">
	<div class="flex items-center gap-2">
		<i class="mdi mdi-hand-back-right-outline text-base text-danger" aria-hidden="true"></i>
		<span class="text-xs font-semibold uppercase tracking-wider text-danger">
			{active ? 'A person is at the controls' : 'Control was handed back'}
		</span>
	</div>

	{#if active}
		<p class="mt-2 text-sm leading-relaxed text-gray-800">
			Someone is operating the machine directly in SimpleClaw. This run waits for as long as
			that takes — nothing here will time it out.
		</p>
		<button
			type="button"
			class="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			onclick={() => showSimpleClaw().catch(() => {})}
		>
			<i class="bx bx-window-open text-base" aria-hidden="true"></i>
			Open SimpleClaw
		</button>
	{:else}
		<p class="mt-2 text-sm leading-relaxed text-gray-800">The run has resumed.</p>
	{/if}
</div>
