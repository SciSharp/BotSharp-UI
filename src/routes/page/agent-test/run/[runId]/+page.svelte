<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { getRun, cancelRun, triggerRun } from '$lib/services/agent-test-service.js';
	import {
		statusColor,
		isTerminalStatus,
		errorMessage,
		formatDuration,
		formatDateTime,
		formatAgentChain,
		t
	} from '$lib/helpers/utils/agent-test.js';

	const duration = 3000;
	const pollIntervalMs = 2000;

	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let successText = $state('');
	let errorText = $state('');

	/** @type {string | null} */
	let loadErrorText = $state(null);

	let runId = $derived(page.params.runId);

	/** @type {import('$agentTestTypes').AgentTestRun | null} */
	let run = $state(null);

	/** @type {import('$agentTestTypes').AgentTestCaseResult[]} */
	let results = $state([]);

	/** The route does not carry the suite, so back/re-run read it off the run itself. */
	let suiteId = $derived(run?.suiteId || null);

	/** Result ids whose detail is expanded. Failures open themselves on first load. */
	/** @type {string[]} */
	let expandedIds = $state([]);

	let hasAutoExpanded = false;

	let isBusy = $state(false);

	let isFinished = $derived(isTerminalStatus(run?.status));

	/**
	 * De-duplicated: in a multi-model run the same case appears once per model, and "re-run the
	 * failures" means re-running the CASE, not the case once per model that happened to fail.
	 */
	let failedCaseIds = $derived([
		...new Set(results.filter(r => r.status === 'Failed' || r.status === 'Error').map(r => r.caseId))
	]);

	/** Column order for the comparison grid; follows the run's own model order. */
	let modelColumns = $derived((run?.models || []).map(m => ({ ...m, key: `${m.provider}/${m.model}` })));

	/**
	 * Per-model routing accuracy, straight off the run. Shown as "passed / total" next to the
	 * percentage on purpose: the gate is expressed in percentage points, but 3/4 says how much the
	 * figure is worth trusting and 75% does not -- and with a handful of routing cases that is the
	 * difference between a gate and a guess.
	 */
	let routingAccuracies = $derived((run?.routingAccuracies || []).map(a => ({
		...a,
		label: a.model || $_('agent default'),
		percent: a.caseCount > 0 ? Math.round((a.passedCount / a.caseCount) * 1000) / 10 : null
	})));

	/**
	 * Latency, token and cost figures per model, as stored on the run. A table rather than tiles
	 * because there is one row per model and the whole point is comparing them side by side.
	 */
	let performance = $derived((run?.performanceSummaries || []).map(s => ({
		...s,
		label: s.model || $_('agent default')
	})));

	/**
	 * The unit costs the cost column was computed from. Shown next to the figures because a cost is
	 * not comparable with another run unless these match -- a provider price change would otherwise
	 * read as a cost regression with nothing to point at.
	 */
	let pricingByModel = $derived(Object.fromEntries(
		(run?.modelPricing || []).map(p => [p.model || '', p])
	));
	let isComparison = $derived(modelColumns.length > 1);

	/**
	 * One row per case, one cell per model. Built from the results themselves rather than from the
	 * case list, so a run that died halfway still renders what it did produce -- missing cells just
	 * stay empty instead of the whole grid refusing to draw.
	 */
	let comparisonRows = $derived.by(() => {
		if (!isComparison) return [];
		/** @type {Map<string, { caseId: string, caseName: string, cells: Record<string, any> }>} */
		const rows = new Map();
		for (const r of results) {
			let row = rows.get(r.caseId);
			if (!row) {
				row = { caseId: r.caseId, caseName: r.caseName, cells: {} };
				rows.set(r.caseId, row);
			}
			row.cells[`${r.provider}/${r.model}`] = r;
		}
		return [...rows.values()];
	});

	/**
	 * Per-model totals for the grid footer. Duration is summed rather than averaged: "how long does
	 * the whole suite take on this model" is the number that decides whether an upgrade is
	 * affordable, and an average hides a single pathological case.
	 */
	let modelSummaries = $derived(modelColumns.map(col => {
		const own = results.filter(r => `${r.provider}/${r.model}` === col.key);
		return {
			key: col.key,
			passed: own.filter(r => r.status === 'Passed').length,
			total: own.length,
			totalMs: own.reduce((sum, r) => sum + (r.durationMs || 0), 0)
		};
	}));

	onMount(() => {
		isLoading = true;
		load().finally(() => {
			isLoading = false;
		});

		// A queued run reaches a terminal status on its own schedule, so the page
		// keeps pulling until it does -- nothing pushes here, there is no SignalR
		// channel for test runs. Cleared on destroy so leaving the page stops the
		// requests.
		const timer = setInterval(() => {
			if (isFinished) return;
			load();
		}, pollIntervalMs);

		return () => clearInterval(timer);
	});

	function load() {
		loadErrorText = null;
		return getRun(runId).then(res => {
			run = res.run;
			results = res.results || [];
			autoExpandFailures();
		}).catch(err => {
			loadErrorText = errorMessage(err, t('Failed to load this run.'));
		});
	}

	/**
	 * The point of opening this page is almost always "what broke", so the
	 * failures are already open the first time results arrive. After that the
	 * user's own expand/collapse choices are left alone.
	 */
	function autoExpandFailures() {
		if (hasAutoExpanded || results.length === 0) return;
		hasAutoExpanded = true;
		expandedIds = results.filter(r => r.status !== 'Passed').map(r => r.id);
	}

	/** @param {string} id */
	function toggleExpanded(id) {
		expandedIds = expandedIds.includes(id)
			? expandedIds.filter(x => x !== id)
			: [...expandedIds, id];
	}

	/** @param {string} text */
	function notifySuccess(text) {
		isComplete = true;
		successText = text;
		setTimeout(() => {
			isComplete = false;
			successText = '';
		}, duration);
	}

	/** @param {string} text */
	function notifyError(text) {
		isError = true;
		errorText = text;
		setTimeout(() => {
			isError = false;
			errorText = '';
		}, duration);
	}

	function handleCancel() {
		if (isBusy) return;
		isBusy = true;
		cancelRun(runId).then(() => {
			notifySuccess(t('Cancellation requested.'));
			return load();
		}).catch(err => {
			// 409 means it finished between the render and the click.
			notifyError(errorMessage(err, t('Failed to cancel the run.')));
			return load();
		}).finally(() => {
			isBusy = false;
		});
	}

	function handleRerunFailed() {
		if (isBusy || !suiteId || failedCaseIds.length === 0) return;
		isBusy = true;
		triggerRun(suiteId, failedCaseIds).then(newRun => {
			notifySuccess(t('Re-run queued!'));
			goto(`/page/agent-test/run/${newRun.id}`);
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to start the re-run.')));
		}).finally(() => {
			isBusy = false;
		});
	}

	function goBack() {
		goto(suiteId ? `/page/agent-test/${suiteId}` : '/page/agent-test');
	}
</script>

{#snippet assertionTable(list)}
	<div class="ats-table-wrap scrollbar-on-hover">
		<table class="ats-table ats-table-sm">
			<thead>
				<tr>
					<th scope="col" style="width: 90px;">{$_('Result')}</th>
					<th scope="col">{$_('Type')}</th>
					<th scope="col">{$_('Target')}</th>
					<th scope="col">{$_('Expected')}</th>
					<th scope="col">{$_('Actual')}</th>
					<th scope="col">{$_('Message')}</th>
				</tr>
			</thead>
			<tbody>
				{#each list as assertion, i (i)}
					<tr class={assertion.passed ? '' : 'ats-row-danger'}>
						<td>
							{#if assertion.passed}
								<span class="ats-badge ats-tone-success">{$_('Pass')}</span>
							{:else}
								<span class="ats-badge ats-tone-danger">{$_('Fail')}</span>
							{/if}
						</td>
						<td class="font-code">{assertion.type}</td>
						<td class="font-code">{assertion.target || '--'}</td>
						<td><span class="break-words">{assertion.expected || '--'}</span></td>
						<td><span class="break-words">{assertion.actual || '--'}</span></td>
						<td><span class="break-words">{assertion.message || '--'}</span></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

<HeadTitle title={$_('Test Run')} />
<Breadcrumb title={$_('Agent Testing')} pagetitle={$_('Test Run')} />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

{#if loadErrorText}
	<div class="flex flex-wrap">
		<div class="w-full">
			<div class="ats-alert ats-tone-danger justify-between" role="alert">
				<span>{loadErrorText}</span>
				<button type="button" class="ats-btn ats-btn-sm ats-btn-secondary" onclick={() => goBack()}>
					{$_('Back')}
				</button>
			</div>
		</div>
	</div>
{:else if run}
	<div class="flex flex-col gap-4">
		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<h5 class="ats-card-title flex flex-wrap items-center gap-2">
							{$_('Run')} <span class="font-code">{run.id}</span>
							<span class="ats-badge ats-tone-{statusColor(run.status)}">{$_(run.status)}</span>
							{#if run.cancelRequested && !isFinished}
								<span class="ats-badge ats-tone-dark">{$_('Cancelling')}</span>
							{/if}
						</h5>
						<p class="mt-1 mb-0 text-sm text-muted">
							{$_('Started')}: {formatDateTime(run.startedAt)}
							<span class="mx-2">|</span>
							{$_('Completed')}: {formatDateTime(run.completedAt)}
							{#if run.triggeredBy}
								<span class="mx-2">|</span>
								{$_('Triggered by')}: <span class="font-code">{run.triggeredBy}</span>
							{/if}
						</p>
						{#if run.caseIds && run.caseIds.length > 0}
							<p class="mt-1 mb-0 text-sm text-muted">
								{$_('Partial run of')} {run.caseIds.length} {$_('selected case(s).')}
							</p>
						{/if}
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" class="ats-btn ats-btn-soft ats-tone-secondary" onclick={() => goBack()}>
							<i class="mdi mdi-arrow-left"></i> {$_('Back to Suite')}
						</button>
						<button type="button" class="ats-btn ats-btn-soft ats-tone-secondary" onclick={() => load()}>
							<i class="mdi mdi-refresh"></i> {$_('Refresh')}
						</button>
						{#if !isFinished}
							<button
								type="button"
								class="ats-btn ats-btn-soft ats-tone-danger"
								disabled={isBusy}
								onclick={() => handleCancel()}
							>
								<i class="mdi mdi-stop"></i> {$_('Cancel Run')}
							</button>
						{:else if failedCaseIds.length > 0}
							<button
								type="button"
								class="ats-btn ats-btn-primary"
								disabled={isBusy}
								onclick={() => handleRerunFailed()}
							>
								{#if isBusy}
									<i class="mdi mdi-loading mdi-spin"></i>
								{:else}
									<i class="mdi mdi-replay"></i>
								{/if}
								{$_('Re-run Failures')} ({failedCaseIds.length})
							</button>
						{/if}
					</div>
				</div>
			</div>
			<div class="ats-card-body">
				{#if routingAccuracies.length > 0}
					<!-- Routing accuracy is gated separately from the agent pass rate, so it gets its own
					     row rather than being folded into the totals below. Absent entirely when the run
					     contained no routing cases: a 0/0 tile would read as "measured routing, got none
					     right". -->
					<div class="mb-3">
						<h6 class="ats-meta-label mb-2">{$_('Routing accuracy')}</h6>
						<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
							{#each routingAccuracies as accuracy (accuracy.label)}
								<div class="ats-stat">
									<span class="ats-stat-value">{accuracy.percent}%</span>
									<span class="ats-stat-label font-code">
										{accuracy.label} · {accuracy.passedCount}/{accuracy.caseCount}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				{#if performance.length > 0}
					<div class="mb-3">
						<h6 class="ats-meta-label mb-2">{$_('Latency, tokens and cost')}</h6>
						<div class="table-responsive thin-scrollbar">
							<table class="table ats-table align-middle mb-0">
								<thead>
									<tr>
										<th scope="col">{$_('Model')}</th>
										<th scope="col" class="text-end">{$_('Cases')}</th>
										<th scope="col" class="text-end">{$_('Latency P50')}</th>
										<th scope="col" class="text-end">{$_('Latency P95')}</th>
										<th scope="col" class="text-end">{$_('Tokens')}</th>
										<th scope="col" class="text-end">{$_('Cost')}</th>
										<th scope="col">{$_('Unit cost (in / out)')}</th>
									</tr>
								</thead>
								<tbody>
									{#each performance as row (row.label)}
										{@const pricing = pricingByModel[row.model || '']}
										<tr>
											<td class="font-code">{row.label}</td>
											<td class="text-end">{row.caseCount}</td>
											<td class="text-end">{formatDuration(row.latencyP50Ms)}</td>
											<td class="text-end">{formatDuration(row.latencyP95Ms)}</td>
											<td class="text-end">{row.totalTokens}</td>
											<td class="text-end">{row.totalCost.toFixed(4)}</td>
											<td class="font-code text-xs text-muted">
												{#if pricing && pricing.textInputCost != null}
													{pricing.textInputCost} / {pricing.textOutputCost}
												{:else}
													<!-- Never rendered as 0: that would read as "this model is free",
													     which is a claim. Unknown is the truth, and it is also the
													     reason this run cost cannot be compared with another. -->
													{$_('unknown')}
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<p class="mt-2 mb-0 text-xs text-muted">
							{$_('Percentiles are nearest-rank over the agent-call time of the cases that reached the model, so every figure is a duration some case actually took. Cases that failed before their first turn are excluded from the percentiles but still counted in tokens and cost.')}
						</p>
					</div>
				{/if}
				<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
					<div class="ats-stat">
						<span class="ats-stat-value">{run.totalCount}</span>
						<span class="ats-stat-label">{$_('Total')}</span>
					</div>
					<div class="ats-stat">
						<span class="ats-stat-value text-success">{run.passedCount}</span>
						<span class="ats-stat-label">{$_('Passed')}</span>
					</div>
					<div class="ats-stat">
						<span class="ats-stat-value text-danger">{run.failedCount}</span>
						<span class="ats-stat-label">{$_('Failed (assertion)')}</span>
					</div>
					<div class="ats-stat">
						<span class="ats-stat-value text-warning">{run.errorCount}</span>
						<span class="ats-stat-label">{$_('Errored (never ran)')}</span>
					</div>
				</div>
				{#if run.error}
					<!-- A run-level stop produces no case results at all, so this alert is the only
					     place its reason can appear. Rendered before the per-case section, which
					     will be empty in exactly this situation. -->
					<div class="ats-alert ats-tone-danger mt-4" role="alert">
						<span><span class="font-semibold">{$_('This run could not complete')}:</span> {run.error}</span>
					</div>
				{/if}
				{#if run.errorCount > 0}
					<div class="ats-alert ats-tone-warning mt-3" role="alert">
						{$_('Errored cases never reached their assertions -- a timeout, a mock-seam failure, or a case with no turns. That is a harness problem, not an agent regression.')}
					</div>
				{/if}
				{#if !isFinished}
					<p class="mt-4 mb-0 flex items-center justify-center gap-2 text-sm text-muted">
						<i class="mdi mdi-loading mdi-spin"></i>
						{$_('This run is still going. Refreshing every couple of seconds.')}
					</p>
				{/if}
			</div>
		</div>

		{#if isComparison}
			<div class="ats-card">
				<div class="ats-card-section ats-card-divider">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-compare-horizontal"></i>
						</span>
						<h5 class="ats-card-title">{$_('Model Comparison')}</h5>
					</div>
				</div>
				<div class="ats-card-body">
					<div class="ats-table-wrap scrollbar-on-hover">
						<table class="ats-table">
							<thead>
								<tr>
									<th scope="col">{$_('Case')}</th>
									{#each modelColumns as col (col.key)}
										<th scope="col">
											<div class="font-code">{col.model}</div>
											<div class="font-normal normal-case tracking-normal text-muted">{col.provider}</div>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each comparisonRows as row (row.caseId)}
									<tr>
										<td>{row.caseName}</td>
										{#each modelColumns as col (col.key)}
											{@const cell = row.cells[col.key]}
											<td class={cell && cell.status !== 'Passed' ? 'ats-cell-danger' : ''}>
												{#if cell}
													<span class="flex flex-wrap items-center gap-1">
														<span class="ats-badge ats-tone-{statusColor(cell.status)}">
															{$_(cell.status)}
														</span>
														<span class="text-xs text-muted">{formatDuration(cell.durationMs)}</span>
													</span>
												{:else}
													<span class="text-muted">--</span>
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr>
									<th scope="row">{$_('Total')}</th>
									{#each modelSummaries as summary (summary.key)}
										<td>
											<div>{summary.passed}/{summary.total} {$_('passed')}</div>
											<div class="text-xs text-muted">{formatDuration(summary.totalMs)}</div>
										</td>
									{/each}
								</tr>
							</tfoot>
						</table>
					</div>
					<p class="mt-3 mb-0 text-xs text-muted">
						{$_('Durations are wall-clock for the whole case, including mocked tool calls, so they are comparable between models but are not a pure model-latency measurement.')}
					</p>
				</div>
			</div>
		{/if}

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex items-center gap-3">
					<span class="ats-card-icon">
						<i class="mdi mdi-clipboard-list-outline"></i>
					</span>
					<div class="grow">
						<h5 class="ats-card-title">{$_('Case Results')}</h5>
						<p class="ats-card-subtitle">
							{results.length} {results.length === 1 ? $_('case') : $_('cases')}
						</p>
					</div>
				</div>
			</div>
			<div class="ats-card-body">
				{#if results.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">
							{#if run.error}
								{$_('Nothing ran -- see the reason above.')}
							{:else}
								{isFinished ? $_('This run produced no case results.') : $_('No case results yet.')}
							{/if}
						</p>
					</div>
				{:else}
					{#each results as result (result.id)}
						{@const isExpanded = expandedIds.includes(result.id)}
						<div class="ats-panel">
							<div class="flex flex-wrap items-center justify-between gap-3">
								<div class="flex flex-wrap items-center gap-2">
									<span class="ats-badge ats-tone-{statusColor(result.status)}">{$_(result.status)}</span>
									<span class="text-sm font-semibold">{result.caseName}</span>
									{#if result.model}
										<!-- Without this the same case name appears N times with no way to tell
										     which model produced which row. -->
										<span class="ats-badge ats-tone-primary font-code" title={result.provider}>
											{result.model}
										</span>
									{/if}
									<span class="text-xs text-muted" title={$_('Wall clock for the whole case')}>
										{formatDuration(result.durationMs)}
									</span>
									{#if result.modelDurationMs > 0}
										<!-- The agent-call time on its own. This is what the latency percentiles
										     are built from; the figure above also contains the canary and the
										     conversation reads. -->
										<span class="text-xs text-muted" title={$_('Agent call time only')}>
											({formatDuration(result.modelDurationMs)})
										</span>
									{/if}
									{#if result.totalTokens > 0}
										<span class="ats-badge ats-badge-soft ats-tone-secondary" title={$_('Tokens / cost')}>
											{result.totalTokens} · {result.cost.toFixed(4)}
										</span>
									{/if}
									{#if result.agentChain?.length > 0}
										<!-- The only record of the hand-offs: route_to_agent is allowed through the
										     mock seam untouched, so it produces no observed tool call and the chain
										     is reconstructed from the conversation own assistant messages. Worth
										     showing without expanding, because "which agent actually answered" is
										     the first thing looked at when a routing case goes red. -->
										<span class="ats-badge ats-badge-soft ats-tone-info font-code" title={$_('Agent chain')}>
											{formatAgentChain(result.agentChain)}
										</span>
									{/if}
									{#if result.conversationId}
										<span class="font-code text-xs text-muted">{result.conversationId}</span>
									{/if}
								</div>
								<button
									type="button"
									class="ats-btn ats-btn-sm ats-btn-soft ats-tone-secondary"
									aria-expanded={isExpanded}
									onclick={() => toggleExpanded(result.id)}
								>
									<i class={isExpanded ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'}></i>
									{isExpanded ? $_('Hide details') : $_('Show details')}
								</button>
							</div>

							{#if result.error}
								<div class="ats-alert ats-tone-warning mt-3" role="alert">
									<span><span class="font-semibold">{$_('Harness error')}:</span> {result.error}</span>
								</div>
							{/if}

							{#if isExpanded}
								<div class="ats-panel-split">
									{#each result.turns as turn (turn.index)}
										<div class="mb-4">
											<h6 class="ats-panel-title mb-2">{$_('Turn')} {turn.index + 1}</h6>
											<div class="mb-2">
												<div class="ats-meta-label">{$_('User')}</div>
												<div class="ats-code mt-1">{turn.userMessage}</div>
											</div>
											<div class="mb-2">
												<div class="ats-meta-label">{$_('Agent output')}</div>
												<div class="ats-code mt-1">{turn.output || '--'}</div>
											</div>
											{#if turn.agentChain?.length > 0}
												<div class="mb-2">
													<div class="ats-meta-label">{$_('Answered by')}</div>
													<div class="font-code text-xs mt-1">{formatAgentChain(turn.agentChain)}</div>
												</div>
											{/if}
											{#if turn.assertions?.length > 0}
												{@render assertionTable(turn.assertions)}
											{:else}
												<p class="mb-0 text-xs text-muted">{$_('No assertions on this turn.')}</p>
											{/if}
										</div>
									{/each}

									{#if result.assertions?.length > 0}
										<div class="mb-4">
											<h6 class="ats-panel-title mb-2">{$_('Case Assertions')}</h6>
											{@render assertionTable(result.assertions)}
										</div>
									{/if}

									<div>
										<h6 class="ats-panel-title mb-2">
											{$_('Observed Tool Calls')} ({result.observedToolCalls?.length || 0})
										</h6>
										{#if result.observedToolCalls?.length > 0}
											<div class="ats-table-wrap scrollbar-on-hover">
												<table class="ats-table ats-table-sm">
													<thead>
														<tr>
															<th scope="col" style="width: 70px;">{$_('Turn')}</th>
															<th scope="col">{$_('Function')}</th>
															<th scope="col" style="width: 110px;">{$_('Outcome')}</th>
															<th scope="col">{$_('Args')}</th>
															<th scope="col">{$_('Result')}</th>
														</tr>
													</thead>
													<tbody>
														{#each result.observedToolCalls as call, i (i)}
															<tr class={call.outcome === 'Blocked' ? 'ats-row-warning' : ''}>
																<td>{call.turnIndex + 1}</td>
																<td class="font-code break-words">{call.functionName}</td>
																<td>
																	{#if call.outcome === 'Blocked'}
																		<span
																			class="ats-badge ats-tone-warning"
																			title={$_('The agent tried to call a tool this case does not mock, so it was blocked. This is often the root cause of the failure above.')}
																		>
																			{$_('Blocked')}
																		</span>
																	{:else}
																		<span class="ats-badge ats-tone-info">{$_(call.outcome)}</span>
																	{/if}
																</td>
																<td><span class="font-code text-xs break-words">{call.argsJson || '--'}</span></td>
																<td><span class="font-code text-xs break-words">{call.resultContent || '--'}</span></td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
										{:else}
											<p class="mb-0 text-xs text-muted">
												{$_('The agent called no tools during this case.')}
											</p>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
