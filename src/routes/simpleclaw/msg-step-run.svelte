<script>
	/**
	 * The one live run card. SimpleClaw is single-flight, so there is never more than one
	 * of these on screen — the UI can rely on that.
	 *
	 * @type {{
	 *   index: number,
	 *   total: number,
	 *   agentName: string,
	 *   goal: string,
	 *   step: number,
	 *   activity: string,
	 *   queuePosition: number,
	 *   onStop?: () => void
	 * }}
	 */
	let {
		index,
		total,
		agentName,
		goal,
		step = 0,
		activity = '',
		queuePosition = 0,
		onStop = () => {}
	} = $props();

	// There is no total-actions figure to divide by — SimpleClaw does not know in advance
	// how many it will take. This is a coarse "it is moving" indicator, deliberately
	// capped, and the honest number is the action count printed beside it.
	let progress = $derived(Math.min(90, step * 6));
</script>

<!--
	Flat, and the same shape as the plan card it replaces on screen — the two sit next to
	each other in the thread, so a framed one beside an unframed one reads as a mistake.
	"Live" is carried by the pulsing dot, the RUNNING label and the progress bar, which
	say more than a coloured outline did.
-->
<div class="overflow-hidden rounded-2xl bg-white p-4">
	<div class="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
		<span class="relative flex h-2 w-2" aria-hidden="true">
			<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"></span>
			<span class="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
		</span>
		<span class="text-xs font-semibold uppercase tracking-wider text-primary">Running</span>
		<span class="ml-auto text-xs text-gray-400">Step {index + 1} of {total}</span>
	</div>

	<div class="pt-3">
		<span class="text-[11px] font-semibold uppercase tracking-wide text-primary">{agentName}</span>
		<p class="mt-0.5 text-sm leading-relaxed text-gray-800">{goal}</p>

		{#if queuePosition > 0}
			<p class="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
				<i class="mdi mdi-timer-sand text-base text-gray-400" aria-hidden="true"></i>
				Queued — {queuePosition} ahead. SimpleClaw runs one task at a time.
			</p>
		{:else}
			<div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-100">
				<div
					class="h-full rounded-full bg-primary transition-[width] duration-500"
					style="width: {progress}%"
				></div>
			</div>

			<div class="mt-2.5 flex items-center justify-between gap-3">
				<!--
					aria-live is off on purpose. This line changes every few seconds; announcing
					it would talk over everything else a screen reader user needs to hear.
				-->
				<p class="min-w-0 flex-1 truncate text-sm text-gray-500" aria-live="off">
					{activity || 'Working…'}
				</p>
				<span class="shrink-0 text-xs tabular-nums text-gray-400">
					{step} {step === 1 ? 'action' : 'actions'}
				</span>
			</div>
		{/if}

		<button
			type="button"
			class="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-danger hover:bg-danger/5 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
			onclick={onStop}
		>
			<i class="bx bx-stop text-base" aria-hidden="true"></i>
			Stop
		</button>
	</div>
</div>
