<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import { isDesktop, getStatus, getCapabilities, stopRun, answerRun } from '$lib/services/simpleclaw-service';
	import {
		createPlannerConversation,
		loadHistory,
		sendTurn,
		reportOutcome,
		runPlan,
		announcesUnproposedWork,
		nudgeForPlan,
		errorText
	} from '$lib/services/simpleclaw-orchestrator';
	import ConnectionBar from './connection-bar.svelte';
	import MsgPlan from './msg-plan.svelte';
	import MsgStepRun from './msg-step-run.svelte';
	import MsgStepDone from './msg-step-done.svelte';
	import MsgAsk from './msg-ask.svelte';
	import MsgTakeover from './msg-takeover.svelte';
	import MsgResult from './msg-result.svelte';

	const desktop = isDesktop();

	/** @type {import('$simpleclawTypes').SimpleClawStatus | null} */
	let status = $state(null);
	/** @type {import('$simpleclawTypes').SimpleClawAgent[]} */
	let agents = $state([]);

	/** 'idle' | 'planning' | 'confirm' | 'running' */
	let phase = $state('idle');
	let draft = $state('');

	/** @type {any[]} */
	let messages = $state([]);
	let nextId = 0;

	/** Live run bookkeeping, kept out of the message list so updates stay cheap. */
	let activeRunId = $state(/** @type {string | null} */ (null));
	/** @type {import('$simpleclawTypes').Plan | null} */
	let pendingPlan = null;

	/**
	 * One conversation for the whole session. The person asks several things and follows
	 * up; operating a computer is one task inside that, not a separate mode.
	 * @type {string | null}
	 */
	let conversationId = null;

	/** @type {HTMLDivElement | undefined} */
	let scroller = $state();
	/** @type {HTMLDivElement | undefined} */
	let thread = $state();
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let poll;

	/**
	 * Whether the view is following the end of the thread. Cleared the moment somebody
	 * scrolls up to re-read something and restored when they come back down — pulling the
	 * view out from under a person mid-read is worse than not following at all.
	 */
	let pinned = $state(true);

	/**
	 * Slack for "at the bottom". Fractional scroll heights on a zoomed or fractionally
	 * scaled display mean an exact comparison is never true, which would leave the thread
	 * permanently unpinned.
	 */
	const PIN_SLACK_PX = 48;

	let busy = $derived(phase === 'planning' || phase === 'running');
	// Not gated on SimpleClaw being up. Operating a computer is one capability here, not
	// the point of the page — ordinary questions and follow-ups about earlier results
	// still work with SimpleClaw closed.
	let canSend = $derived(desktop && !busy && draft.trim().length > 0);

	// --- plumbing ---------------------------------------------------------------

	/** @param {any} msg */
	function push(msg) {
		messages = [...messages, { id: nextId++, ...msg }];
	}

	/**
	 * @param {number} id
	 * @param {Record<string, any>} changes
	 */
	function patch(id, changes) {
		messages = messages.map((m) => (m.id === id ? { ...m, ...changes } : m));
	}

	function atEnd() {
		if (!scroller) return true;
		return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= PIN_SLACK_PX;
	}

	// Instant, not smooth. A run emits an activity line every few hundred milliseconds, and
	// a smooth scroll still in flight when the next one lands both falls behind the content
	// and reports mid-animation offsets to onScroll, which reads as "the reader scrolled up".
	function scrollToEnd() {
		if (scroller) scroller.scrollTop = scroller.scrollHeight;
	}

	function onScroll() {
		pinned = atEnd();
	}

	function jumpToEnd() {
		pinned = true;
		scrollToEnd();
	}

	// Follow the rendered height rather than the message list. Most of what makes this
	// thread grow is invisible to a list update: a live run card swapping in a longer
	// activity line, a step card collapsing into its done form, a markdown answer laying
	// out a table, the thinking dots appearing and going away. One rule covers all of them.
	$effect(() => {
		if (!thread) return;
		const observer = new ResizeObserver(() => {
			if (pinned) scrollToEnd();
		});
		observer.observe(thread);
		return () => observer.disconnect();
	});

	/**
	 * Pull the roster from SimpleClaw. This is what the planner routes on — which agent
	 * is sealed to which system, and what each has been demonstrated doing — so it has to
	 * come from SimpleClaw itself, and it has to be current.
	 */
	async function loadCapabilities() {
		const caps = await getCapabilities();
		agents = caps?.agents ?? [];
		return agents;
	}

	async function refreshStatus() {
		status = await getStatus();
		if (!status.connected) {
			agents = [];
			return;
		}
		// Refreshed on every poll, not just once: recording a demonstration changes an
		// agent's `operations`, and agents can be added or switched between organizations
		// while this page is open. It is a loopback call, so the cost is nil.
		try {
			await loadCapabilities();
		} catch {
			agents = [];
		}
	}

	/** @param {string} id */
	function agentName(id) {
		return agents.find((a) => a.id === id)?.name ?? id;
	}

	/**
	 * Pick up an existing thread when the Conversations list sends us to one.
	 *
	 * Failing to load is not fatal: the id may name a conversation that was deleted or
	 * belongs to someone else. Say so and carry on with a fresh session rather than
	 * leaving a page that looks broken.
	 */
	async function resumeConversation(/** @type {string} */ id) {
		phase = 'planning';
		try {
			const history = await loadHistory(id);
			conversationId = id;
			history.forEach((m) => push({ kind: m.role, text: m.text }));
		} catch (err) {
			push({
				kind: 'warning',
				text: `That conversation could not be opened, so this is a new session: ${errorText(err)}`
			});
		} finally {
			phase = 'idle';
		}
	}

	onMount(() => {
		if (!desktop) return;
		refreshStatus();
		poll = setInterval(refreshStatus, 5000);

		const resumeId = $page.url.searchParams.get('conversationId');
		if (resumeId) resumeConversation(resumeId);
	});

	onDestroy(() => clearInterval(poll));

	// --- the flow ----------------------------------------------------------------

	async function send() {
		if (!canSend) return;
		const ask = draft.trim();
		draft = '';
		// Typing something is a decision to follow the thread again, even if the reader had
		// scrolled up to write it.
		pinned = true;
		push({ kind: 'user', text: ask });

		phase = 'planning';
		try {
			// Re-read the roster rather than trusting the polled copy. This is the moment
			// it has to be right: a plan hard-codes an agent id per step, and a stale
			// roster produces one routed at the wrong system, or rejected with a 403
			// several seconds later.
			// An empty roster is a legitimate state, not an error: with SimpleClaw closed
			// the copilot simply has no system it can reach, and says so.
			const roster = status?.connected ? await loadCapabilities().catch(() => []) : [];

			// Lazily, so opening the page and typing nothing leaves no empty conversation.
			if (!conversationId) conversationId = await createPlannerConversation();

			await handleTurn(await sendTurn(ask, roster, conversationId), { recoverable: true });
		} catch (err) {
			push({ kind: 'result', ok: false, text: `Could not answer that: ${errorText(err)}` });
			phase = 'idle';
		}
	}

	/**
	 * Route one assistant turn. Most are ordinary prose; only a turn carrying a plan puts
	 * the page into a confirm state.
	 *
	 * @param {import('$lib/services/simpleclaw-orchestrator').CopilotTurn} turn
	 * @param {{ recoverable?: boolean }} [opts] whether a turn that promises work but
	 *   proposes none may be nudged once. Set for a reply to something the person typed,
	 *   and never for the turn that reports a finished run — that one is meant to be prose,
	 *   and pushing it to call the function again is how work that just happened gets
	 *   proposed a second time.
	 */
	async function handleTurn(turn, opts = {}) {
		if (turn.kind === 'text') {
			// The failure this catches is invisible from the screen: the copilot says it
			// will look something up, proposes nothing, and the thread just stops. Gated on
			// a non-empty roster, because with no reachable system prose is the correct
			// answer and there is nothing to nudge towards.
			if (opts.recoverable && conversationId && agents.length > 0 && announcesUnproposedWork(turn.text)) {
				const second = await nudgeForPlan(conversationId, agents);
				if (second.kind === 'plan') {
					await handleTurn(second);
					return;
				}

				// The second answer replaces the first rather than joining it. It was
				// written knowing the work was never proposed, which the first was not.
				push({ kind: 'assistant', text: second.text });
				if (announcesUnproposedWork(second.text)) {
					push({
						kind: 'warning',
						text: 'That described work in a business system but never proposed any, so nothing has run and nothing was changed. Asking again usually gets it.'
					});
				}
				phase = 'idle';
				return;
			}

			push({ kind: 'assistant', text: turn.text });
			phase = 'idle';
			return;
		}

		pendingPlan = turn.plan;
		if (turn.reply) push({ kind: 'assistant', text: turn.reply });

		if (turn.plan.steps.length === 0) {
			push({ kind: 'plan', plan: turn.plan, decided: true });
			phase = 'idle';
			return;
		}

		// A plan the copilot understood fully and that only reads runs without asking —
		// stopping to confirm a lookup is friction for no gain. The card still renders, so
		// the steps and the agent chosen for each stay on screen; it just shows as already
		// decided. The live run card's Stop button is the way out.
		if (turn.plan.autoRun) {
			push({ kind: 'plan', plan: turn.plan, decided: true, auto: true });
			confirmPlan();
			return;
		}

		push({ kind: 'plan', plan: turn.plan, decided: false });
		phase = 'confirm';
	}

	function cancelPlan() {
		const card = messages.findLast((m) => m.kind === 'plan');
		if (card) patch(card.id, { decided: true });
		push({ kind: 'result', ok: false, text: 'Cancelled. Nothing was run.' });
		pendingPlan = null;
		phase = 'idle';
	}

	async function confirmPlan() {
		const plan = pendingPlan;
		if (!plan) return;

		const card = messages.findLast((m) => m.kind === 'plan');
		if (card) patch(card.id, { decided: true });
		phase = 'running';

		/** id of the live run card for the step in flight */
		let liveId = /** @type {number | null} */ (null);
		/** id of the open ask bubble, if any */
		let askId = /** @type {number | null} */ (null);
		/** id of the takeover banner, if any */
		let takeoverId = /** @type {number | null} */ (null);

		await runPlan(plan, {
			onStepStart: (index, step, goal) => {
				liveId = nextId;
				push({
					kind: 'running',
					index,
					total: plan.steps.length,
					agentName: agentName(step.agentId),
					goal,
					step: 0,
					activity: '',
					queuePosition: 0
				});
			},

			onQueued: (_index, runId, queuePosition) => {
				activeRunId = runId;
				if (liveId !== null) patch(liveId, { queuePosition });
			},

			onRunEvent: (_index, event, data) => {
				if (liveId === null) return;

				if (event === 'step') {
					patch(liveId, { step: data?.step ?? 0, queuePosition: 0 });
					return;
				}

				if (event === 'activity') {
					// ActivityEvent.message is the one concise line, already written in the
					// terms this UI wants ("locate_icon \"Chrome icon\" → 2 candidates").
					if (data?.message) patch(liveId, { activity: String(data.message) });
					return;
				}

				if (event === 'status') {
					const paused = data?.status === 'paused';
					// A missing pauseReason is treated as 'ask'. Being wrong that way nags a
					// person for an answer; being wrong the other way kills a run somebody is
					// holding in their hands.
					const reason = data?.pauseReason ?? 'ask';

					if (paused && reason === 'takeover') {
						if (takeoverId === null) {
							takeoverId = nextId;
							push({ kind: 'takeover', active: true });
						}
						return;
					}

					if (paused) {
						if (askId === null) {
							askId = nextId;
							push({
								kind: 'ask',
								question: data?.message || 'The agent needs an answer to continue.',
								askedAt: Date.now(),
								answered: false
							});
						}
						return;
					}

					// No longer paused — close out whichever banner was open.
					if (takeoverId !== null) {
						patch(takeoverId, { active: false });
						takeoverId = null;
					}
					if (askId !== null) {
						patch(askId, { answered: true });
						askId = null;
					}
				}
			},

			onStepEnd: (index, result, captured) => {
				askId = null;
				takeoverId = null;
				activeRunId = null;
				if (liveId !== null) {
					// Replace the live card with its collapsed form in place, so the
					// conversation keeps its order.
					patch(liveId, {
						kind: 'done',
						index,
						agentName: agentName(plan.steps[index].agentId),
						answer: result.answer,
						captured,
						steps: result.steps
					});
					liveId = null;
				}
			},

			onWarning: (message) => push({ kind: 'warning', text: message }),

			onDone: async (summary) => {
				// Looked up directly rather than through agentName(), which falls back to
				// the raw id. An opaque id under an avatar tells the reader nothing; no
				// name at all is better, and the card handles that.
				const actor = agents.find((a) => a.id === summary.agentId);
				push({
					kind: 'result',
					ok: summary.ok,
					text: summary.text,
					agentName: actor?.name ?? '',
					agentIcon: actor?.iconUrl ?? '',
					needsDemo: summary.needsDemo
				});
				pendingPlan = null;
				activeRunId = null;

				// Put the outcome back in the thread. Without it the copilot never sees
				// what happened, and the next question about this result gets answered
				// from nothing.
				try {
					if (conversationId) {
						await handleTurn(await reportOutcome(conversationId, agents, summary));
					} else {
						phase = 'idle';
					}
				} catch (err) {
					push({ kind: 'warning', text: `Result was not recorded in the conversation: ${errorText(err)}` });
					phase = 'idle';
				}
			}
		});
	}

	async function stopActive() {
		if (!activeRunId) return;
		try {
			await stopRun(activeRunId);
		} catch (err) {
			push({ kind: 'warning', text: `Could not stop the run: ${errorText(err)}` });
		}
	}

	/**
	 * @param {number} id
	 * @param {string} text
	 */
	async function sendAnswer(id, text) {
		if (!activeRunId) return;
		try {
			await answerRun(activeRunId, text);
			patch(id, { answered: true });
		} catch (err) {
			push({ kind: 'warning', text: `Could not send the answer: ${errorText(err)}` });
		}
	}

	/** @param {KeyboardEvent} e */
	function onComposerKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	// Concrete starting points beat a blank box: they show the register the copilot
	// expects (business outcomes, not screens) far faster than placeholder text does.
	const SUGGESTIONS = [
		"What's the status of WO# B9896614?",
		'Open a work order for the leaking faucet at 214 Oak St',
		'Which of my open work orders are past due?'
	];

	/** @type {HTMLTextAreaElement | undefined} */
	let composer = $state();

	/** @param {string} text */
	function useSuggestion(text) {
		draft = text;
		composer?.focus();
	}
</script>

<HeadTitle title={$_('SimpleClaw')} />
<Breadcrumb title={$_('SimpleClaw')} pagetitle={$_('Computer use')} />

{#snippet botAvatar()}
	<div
		class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
		aria-hidden="true"
	>
		<i class="bx bx-mouse text-lg"></i>
	</div>
{/snippet}

{#if !desktop}
	<div class="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
		<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
			<i class="mdi mdi-monitor-lock text-2xl" aria-hidden="true"></i>
		</div>
		<h2 class="mt-4 text-base font-semibold text-gray-900">This needs the desktop app</h2>
		<p class="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
			SimpleClaw runs on your own machine and is only reachable from the desktop app, so this
			page cannot do anything in a browser.
		</p>
	</div>
{:else}
	<!--
		No frame. The thread is the page, not a widget sitting on it — a card border here
		just draws a box around a box, since the layout already bounds the content.
	-->
	<!-- No footer on this route, so the thread reclaims that band: header + top padding
	     + breadcrumb is all that sits above it. -->
	<div class="flex h-[calc(100vh-var(--header-height)-5.5rem)] flex-col overflow-hidden">
		<ConnectionBar {status} agentCount={agents.length} />

		<!-- Wrapped so the jump-to-latest button can sit over the end of the thread rather
		     than over the composer, whose height changes with the draft. -->
		<div class="relative flex min-h-0 flex-1 flex-col">
			<div bind:this={scroller} onscroll={onScroll} class="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
				<div bind:this={thread} class="mx-auto flex max-w-3xl flex-col gap-5" role="log" aria-live="polite" aria-label="SimpleClaw activity">
					{#if messages.length === 0}
						<div class="flex flex-col items-center px-4 py-12 text-center">
							<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<i class="bx bx-mouse text-2xl" aria-hidden="true"></i>
							</div>
							<h2 class="mt-4 text-base font-semibold text-gray-900">
								Ask a question, or describe work that needs doing
							</h2>
							<p class="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
								Anything that has to happen in a real system gets carried out by AI Agent.
								You will always see the plan before it runs.
							</p>
							<div class="mt-6 flex flex-wrap justify-center gap-2">
								{#each SUGGESTIONS as s}
									<button
										type="button"
										class="cursor-pointer rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs text-gray-600 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
										onclick={() => useSuggestion(s)}
									>
										{s}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					{#each messages as m (m.id)}
						{#if m.kind === 'user'}
							<div class="flex justify-end">
								<div class="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
									{m.text}
								</div>
							</div>
						{:else if m.kind === 'assistant'}
							<div class="flex gap-3">
								{@render botAvatar()}
								<div class="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
									<!-- markdown-dark is the variant for a light surface: links and table
									     borders pick up the primary colour instead of white. -->
									<Markdown text={m.text} containerClasses="markdown-dark" />
								</div>
							</div>
						{:else if m.kind === 'plan'}
							<MsgPlan
								plan={m.plan}
								{agents}
								decided={m.decided}
								auto={m.auto}
								onConfirm={confirmPlan}
								onCancel={cancelPlan}
							/>
						{:else if m.kind === 'running'}
							<MsgStepRun
								index={m.index}
								total={m.total}
								agentName={m.agentName}
								goal={m.goal}
								step={m.step}
								activity={m.activity}
								queuePosition={m.queuePosition}
								onStop={stopActive}
							/>
						{:else if m.kind === 'done'}
							<MsgStepDone
								index={m.index}
								agentName={m.agentName}
								answer={m.answer}
								captured={m.captured}
								steps={m.steps}
							/>
						{:else if m.kind === 'ask'}
							<MsgAsk
								question={m.question}
								askedAt={m.askedAt}
								answered={m.answered}
								onAnswer={(text) => sendAnswer(m.id, text)}
							/>
						{:else if m.kind === 'takeover'}
							<MsgTakeover active={m.active} />
						{:else if m.kind === 'warning'}
							<div class="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/5 px-3.5 py-2.5">
								<i class="mdi mdi-alert-outline mt-px shrink-0 text-warning" aria-hidden="true"></i>
								<p class="text-sm leading-relaxed text-gray-700">{m.text}</p>
							</div>
						{:else if m.kind === 'result'}
							<MsgResult
								ok={m.ok}
								text={m.text}
								agentName={m.agentName}
								agentIcon={m.agentIcon}
								needsDemo={m.needsDemo}
							/>
						{/if}
					{/each}

					{#if phase === 'planning'}
						<div class="flex gap-3">
							{@render botAvatar()}
							<div class="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
								<!-- Motion, not a spinner: three dots that actually settle read as
								     "composing" rather than "hung". -->
								{#each [0, 150, 300] as delay}
									<span
										class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
										style="animation-delay: {delay}ms"
									></span>
								{/each}
								<span class="sr-only">Thinking</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!--
				Only shown once the reader has left the end, and only when there is something
				to go back to. It is the way back after scrolling up mid-run, and it doubles as
				the signal that the thread has moved on without the view.
			-->
			{#if !pinned && messages.length > 0}
				<button
					type="button"
					class="absolute bottom-4 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-md transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					onclick={jumpToEnd}
				>
					<i class="mdi mdi-arrow-down text-sm" aria-hidden="true"></i>
					Jump to latest
				</button>
			{/if}
		</div>

		<div class="px-4 py-4 sm:px-6">
			<div class="mx-auto max-w-3xl">
				<label class="sr-only" for="simpleclaw-composer">What needs doing</label>
				<div
					class="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 pl-4 transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
				>
					<textarea
						id="simpleclaw-composer"
						bind:this={composer}
						bind:value={draft}
						onkeydown={onComposerKeydown}
						rows="1"
						disabled={busy}
						placeholder="Ask something, or describe work that needs doing…"
						class="max-h-40 min-h-[2.25rem] flex-1 resize-none border-0 bg-transparent py-1.5 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
					></textarea>
					<button
						type="button"
						class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						disabled={!canSend}
						onclick={send}
						aria-label="Send"
					>
						<i class="bx bx-send text-lg" aria-hidden="true"></i>
					</button>
				</div>
				<p class="mt-2 px-1 text-[11px] text-gray-400">
					Enter to send · Shift+Enter for a new line
				</p>
			</div>
		</div>
	</div>
{/if}
