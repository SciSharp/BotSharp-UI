<script>
	/**
	 * The plan card. Shown BEFORE anything runs and cancellable, because every step after
	 * confirmation can have irreversible effects in a real system — this is the only
	 * point where a wrong plan costs nothing.
	 *
	 * `auto` means it was never offered for confirmation — the copilot was sure of the
	 * request and nothing here changes a system. Saying so matters: work appearing without
	 * anyone pressing anything should be labelled, not silently indistinguishable from
	 * work the person approved.
	 *
	 * @type {{
	 *   plan: import('$simpleclawTypes').Plan,
	 *   agents: import('$simpleclawTypes').SimpleClawAgent[],
	 *   decided: boolean,
	 *   auto?: boolean,
	 *   onConfirm?: () => void,
	 *   onCancel?: () => void
	 * }}
	 */
	let {
		plan,
		agents = [],
		decided = false,
		auto = false,
		onConfirm = () => {},
		onCancel = () => {}
	} = $props();

	let expanded = $state(/** @type {number | null} */ (null));

	/** @param {string} id */
	function agentName(id) {
		return agents.find((a) => a.id === id)?.name ?? id;
	}

	/** @param {string} id */
	function agentSystem(id) {
		return agents.find((a) => a.id === id)?.system ?? '';
	}
</script>

<!--
	Flat: no border, no shadow. The steps carry their own outlines, and a frame on top of
	them draws a box around a box. A drop shadow on a light background renders as a
	hairline anyway, so it reads as the border it was supposed to replace.
-->
<div class="overflow-hidden rounded-2xl bg-white p-4">
	<!--
		Inset rather than a full-bleed band, so all four corners can be round: a rounded
		block flush against the card edge leaves the radius meeting a straight edge.
		Padded to px-3 so its text sits on the same left edge as the step rows below.
		The bottom border goes with it — a rule under a detached block reads as a stray line.
	-->
	<div class="flex items-center gap-2 rounded-xl bg-gray-50/70 px-3 py-2">
		<i class="bx bx-list-check text-base text-primary" aria-hidden="true"></i>
		<span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</span>
		{#if auto}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500"
				title="Nothing here changes a system, so it ran without asking"
			>
				<i class="mdi mdi-flash-outline text-xs" aria-hidden="true"></i>
				Ran automatically
			</span>
		{/if}
		{#if plan.steps.length}
			<span class="ml-auto text-xs text-gray-400">
				{plan.steps.length} {plan.steps.length === 1 ? 'step' : 'steps'}
			</span>
		{/if}
	</div>

	<div class="pt-3">
		{#if plan.reply}
			<p class="text-sm leading-relaxed text-gray-700">{plan.reply}</p>
		{/if}

		{#if plan.steps.length === 0}
			<p class="mt-2 text-sm text-muted">No steps were produced, so nothing will run.</p>
		{:else}
			<ol class="mt-3 space-y-1.5">
				{#each plan.steps as step, i}
					<li class="overflow-hidden rounded-xl border border-gray-200">
						<button
							type="button"
							class="flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
							aria-expanded={expanded === i}
							onclick={() => (expanded = expanded === i ? null : i)}
						>
							<span
								class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary"
							>
								{i + 1}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block text-[11px] font-semibold uppercase tracking-wide text-primary">
									{agentName(step.agentId)}
								</span>
								<span class="mt-0.5 block text-sm leading-relaxed text-gray-800">{step.goal}</span>
							</span>
							<i
								class="mdi {expanded === i ? 'mdi-chevron-up' : 'mdi-chevron-down'} mt-0.5 text-lg text-gray-400"
								aria-hidden="true"
							></i>
						</button>

						{#if expanded === i}
							<dl class="space-y-1 border-t border-gray-100 bg-gray-50/70 px-3 py-2.5 text-xs">
								{#if agentSystem(step.agentId)}
									<div class="flex gap-3">
										<dt class="w-16 shrink-0 text-gray-400">System</dt>
										<dd class="min-w-0 break-all font-code text-gray-600">{agentSystem(step.agentId)}</dd>
									</div>
								{/if}
								{#if step.expect}
									<div class="flex gap-3">
										<dt class="w-16 shrink-0 text-gray-400">Reports</dt>
										<dd class="min-w-0 text-gray-600">{step.expect}</dd>
									</div>
								{/if}
								{#if step.capture?.name}
									<div class="flex gap-3">
										<dt class="w-16 shrink-0 text-gray-400">Captures</dt>
										<dd class="min-w-0 font-code text-gray-600">
											{step.capture.name}{#if step.capture.pattern}&nbsp;<span class="text-gray-400">({step.capture.pattern})</span>{/if}
										</dd>
									</div>
								{/if}
							</dl>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		{#if !decided && plan.steps.length > 0}
			<div class="mt-4 flex items-center gap-2">
				<!--
					type="button" on purpose: Run has real side effects and must never be the
					form's implicit submit target, or Enter in the composer could fire it.
				-->
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					onclick={onConfirm}
				>
					<i class="bx bx-play text-base" aria-hidden="true"></i>
					Run these steps
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-xl px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					onclick={onCancel}
				>
					Cancel
				</button>
			</div>
		{/if}
	</div>
</div>
