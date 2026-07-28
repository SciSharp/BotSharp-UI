<script>
	import Markdown from '$lib/common/markdown/Markdown.svelte';

	/**
	 * How it ended, attributed to the SimpleClaw agent that produced it.
	 *
	 * The body is rendered as markdown because that is what agents actually return — the
	 * answer to "what is the status of this work order" comes back as a sentence followed
	 * by a bulleted list of fields. Shown as plain text those bullets stay literal
	 * hyphens and `**Cancelled**` keeps its asterisks, which is exactly the part of the
	 * answer a person scans for.
	 *
	 * On failure this says which step, what the agent itself reported, and — when the plan
	 * was mostly improvised rather than demonstration-backed — that recording a demo is
	 * the likely fix. That last sentence is the useful one: it names an action, where a
	 * status code would leave the reader guessing.
	 *
	 * @type {{
	 *   ok: boolean,
	 *   text: string,
	 *   agentName?: string,
	 *   agentIcon?: string,
	 *   needsDemo?: boolean
	 * }}
	 */
	let { ok, text, agentName = '', agentIcon = '', needsDemo = false } = $props();

	/**
	 * Fallback for an agent with no configured avatar, or an older SimpleClaw whose
	 * capability manifest predates the field.
	 *
	 * Taken from the segment AFTER the separator: every agent in a roster shares the
	 * "SimpleClaw" prefix, so initialling the whole name would give all of them the same
	 * letter and defeat the point of having a badge at all.
	 */
	let initials = $derived.by(() => {
		const tail = (agentName || '').split(/[-\s_]+/).filter(Boolean).pop() ?? '';
		return tail.slice(0, 2).toUpperCase();
	});

	// Inline only. A path or http URL would be a link back to the operator's own machine,
	// which is not something this page should be fetching from.
	let icon = $derived(agentIcon?.startsWith('data:') ? agentIcon : '');
</script>

<div class="rounded-2xl bg-white p-4">
	<div class="flex items-center gap-2.5">
		{#if icon}
			<!--
				The configured avatar wins. It is the same mark the person sees beside this
				agent inside SimpleClaw, which is what makes "who did this" answerable at a
				glance. Kept on a neutral tile rather than an outcome-tinted one — the
				agent's identity does not change with the result.
			-->
			<div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
				<img src={icon} alt="" class="h-full w-full object-contain" />
			</div>
		{:else}
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold tracking-wide
					{ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}"
				aria-hidden="true"
			>
				{#if initials}
					{initials}
				{:else}
					<i class="bx bx-mouse text-base"></i>
				{/if}
			</div>
		{/if}

		<div class="min-w-0">
			{#if agentName}
				<p class="mb-0 truncate text-sm font-medium text-gray-800">{agentName}</p>
			{/if}
			<!-- The state is written out, never carried by colour alone. -->
			<p class="mb-0 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider {ok ? 'text-success' : 'text-danger'}">
				<i
					class="mdi text-sm {ok ? 'mdi-check-circle' : 'mdi-alert-circle'}"
					aria-hidden="true"
				></i>
				{ok ? 'Done' : 'Did not finish'}
			</p>
		</div>
	</div>

	<!-- markdown-dark is the variant for a light surface. -->
	<div class="mt-3 text-sm leading-relaxed text-gray-800">
		<Markdown {text} containerClasses="markdown-dark" />
	</div>

	{#if needsDemo}
		<p class="mt-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-600">
			<i class="mdi mdi-school-outline mr-1 text-gray-400" aria-hidden="true"></i>
			Record a demonstration of this operation in SimpleClaw and run it again. Rewording the
			request will not help — the agent has not been shown how to do this yet.
		</p>
	{/if}
</div>
