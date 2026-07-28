<script>
	import { onMount, onDestroy } from 'svelte';
	import { ASK_TIMEOUT_MS } from '$lib/helpers/constants/simpleclaw';

	/**
	 * The agent asked a question mid-run.
	 *
	 * Inline rather than a modal: the question almost always needs the context above it to
	 * answer, and a modal hides exactly that. Answering is also not optional — SimpleClaw
	 * stops a run left unanswered for ten minutes — hence the visible countdown.
	 *
	 * @type {{
	 *   question: string,
	 *   askedAt: number,
	 *   answered: boolean,
	 *   onAnswer?: (text: string) => void
	 * }}
	 */
	let { question, askedAt, answered = false, onAnswer = () => {} } = $props();

	let text = $state('');
	let now = $state(Date.now());
	/** @type {HTMLTextAreaElement | undefined} */
	let input = $state();
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let timer;

	let remaining = $derived(Math.max(0, askedAt + ASK_TIMEOUT_MS - now));
	let expired = $derived(remaining === 0);
	let clock = $derived.by(() => {
		const total = Math.ceil(remaining / 1000);
		return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`;
	});

	onMount(() => {
		timer = setInterval(() => (now = Date.now()), 1000);
		// Within a ten-minute window this is the only way a keyboard user reaches the box
		// in time.
		input?.focus();
	});

	onDestroy(() => clearInterval(timer));

	function submit() {
		const value = text.trim();
		if (!value || answered) return;
		onAnswer(value);
		text = '';
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}
</script>

<div class="rounded-2xl border border-y-gray-200 border-r-gray-200 border-l-4 border-l-warning bg-white p-4 shadow-sm">
	<div class="flex items-center gap-2">
		<i class="mdi mdi-help-circle-outline text-base text-warning" aria-hidden="true"></i>
		<!-- The label states the condition; colour alone never carries it. -->
		<span class="text-xs font-semibold uppercase tracking-wider text-warning">Waiting for your answer</span>
	</div>

	<p class="mt-2 text-sm leading-relaxed text-gray-800">{question}</p>

	{#if answered}
		<p class="mt-3 text-sm text-muted">Answer sent.</p>
	{:else if expired}
		<p class="mt-3 text-sm text-danger">
			Ten minutes passed with no answer, so SimpleClaw stopped the run.
		</p>
	{:else}
		<div class="mt-3">
			<label class="sr-only" for="simpleclaw-answer">Your answer</label>
			<textarea
				id="simpleclaw-answer"
				bind:this={input}
				bind:value={text}
				onkeydown={onKeydown}
				rows="2"
				placeholder="Type your answer…"
				class="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed text-gray-800 transition-shadow focus:border-warning focus:outline-none focus:ring-2 focus:ring-warning/15"
			></textarea>
			<div class="mt-2.5 flex flex-wrap items-center gap-3">
				<button
					type="button"
					class="cursor-pointer rounded-xl bg-warning px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
					disabled={!text.trim()}
					onclick={submit}
				>
					Send answer
				</button>
				<!-- Text, not just a shrinking bar: "8m 12s left" is actionable, a bar is not. -->
				<span class="text-xs tabular-nums text-gray-400">{clock} left before the run is stopped</span>
			</div>
		</div>
	{/if}
</div>
