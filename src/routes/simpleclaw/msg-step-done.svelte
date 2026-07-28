<script>
	/**
	 * A finished step, collapsed to one line.
	 *
	 * A run of a dozen actions leaves a lot behind; if every step kept a full card the
	 * final answer would be buried in its own history. The captured value is the part
	 * worth keeping visible, since that is what travels to the next step.
	 *
	 * @type {{
	 *   index: number,
	 *   agentName: string,
	 *   answer: string,
	 *   captured: string | null,
	 *   steps: number
	 * }}
	 */
	let { index, agentName, answer, captured = null, steps = 0 } = $props();

	let open = $state(false);
</script>

<div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
	<button
		type="button"
		class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<i class="mdi mdi-check-circle text-base text-success" aria-hidden="true"></i>
		<span class="text-sm text-gray-600">Step {index + 1}</span>
		<span class="text-xs text-gray-400">{agentName}</span>
		{#if captured}
			<span class="truncate rounded-md bg-success/10 px-1.5 py-0.5 font-code text-xs text-success">
				{captured}
			</span>
		{/if}
		<i
			class="mdi {open ? 'mdi-chevron-up' : 'mdi-chevron-down'} ml-auto text-lg text-gray-400"
			aria-hidden="true"
		></i>
	</button>

	{#if open}
		<div class="border-t border-gray-100 bg-gray-50/70 px-3 py-2.5">
			<p class="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{answer}</p>
			<p class="mt-1.5 text-xs text-gray-400">{steps} {steps === 1 ? 'action' : 'actions'}</p>
		</div>
	{/if}
</div>
