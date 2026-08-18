<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { getRun, cancelRun, triggerRun } from '$lib/services/agent-test-service.js';
	import { statusColor, isTerminalStatus, errorMessage, formatDuration, formatDateTime, t } from '$lib/helpers/utils/agent-test.js';

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
	<div class="table-responsive thin-scrollbar">
		<table class="table table-sm table-bordered align-middle mb-0">
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
					<tr class={assertion.passed ? '' : 'table-danger'}>
						<td>
							{#if assertion.passed}
								<span class="badge bg-success">{$_('Pass')}</span>
							{:else}
								<span class="badge bg-danger">{$_('Fail')}</span>
							{/if}
						</td>
						<td class="font-monospace">{assertion.type}</td>
						<td class="font-monospace">{assertion.target || '--'}</td>
						<td><span class="text-break">{assertion.expected || '--'}</span></td>
						<td><span class="text-break">{assertion.actual || '--'}</span></td>
						<td><span class="text-break">{assertion.message || '--'}</span></td>
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
	<div class="row">
		<div class="col-lg-12">
			<div class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
				<span>{loadErrorText}</span>
				<button type="button" class="btn btn-sm btn-secondary" onclick={() => goBack()}>{$_('Back')}</button>
			</div>
		</div>
	</div>
{:else if run}
	<div class="row">
		<div class="col-lg-12">
			<div class="card">
				<div class="card-body border-bottom">
					<div class="d-flex flex-wrap align-items-start justify-content-between gap-2">
						<div>
							<h5 class="mb-1 card-title">
								{$_('Run')} <span class="font-monospace">{run.id}</span>
								<span class="badge bg-{statusColor(run.status)} ms-2">{$_(run.status)}</span>
								{#if run.cancelRequested && !isFinished}
									<span class="badge bg-dark ms-1">{$_('Cancelling')}</span>
								{/if}
							</h5>
							<p class="text-muted mb-0">
								{$_('Started')}: {formatDateTime(run.startedAt)}
								<span class="mx-2">|</span>
								{$_('Completed')}: {formatDateTime(run.completedAt)}
								{#if run.triggeredBy}
									<span class="mx-2">|</span>
									{$_('Triggered by')}: <span class="font-monospace">{run.triggeredBy}</span>
								{/if}
							</p>
							{#if run.caseIds && run.caseIds.length > 0}
								<p class="text-muted mb-0 mt-1">
									{$_('Partial run of')} {run.caseIds.length} {$_('selected case(s).')}
								</p>
							{/if}
						</div>
						<div class="hstack gap-2 flex-wrap">
							<button type="button" class="btn btn-soft-secondary" onclick={() => goBack()}>
								<i class="mdi mdi-arrow-left"></i> {$_('Back to Suite')}
							</button>
							<button type="button" class="btn btn-soft-secondary" onclick={() => load()}>
								<i class="mdi mdi-refresh"></i> {$_('Refresh')}
							</button>
							{#if !isFinished}
								<button type="button" class="btn btn-soft-danger" disabled={isBusy} onclick={() => handleCancel()}>
									<i class="mdi mdi-stop"></i> {$_('Cancel Run')}
								</button>
							{:else if failedCaseIds.length > 0}
								<button type="button" class="btn btn-primary" disabled={isBusy} onclick={() => handleRerunFailed()}>
									{#if isBusy}
										<i class="mdi mdi-loading mdi-spin me-1"></i>
									{:else}
										<i class="mdi mdi-replay"></i>
									{/if}
									{$_('Re-run Failures')} ({failedCaseIds.length})
								</button>
							{/if}
						</div>
					</div>
				</div>
				<div class="card-body">
					<div class="row text-center g-3">
						<div class="col-6 col-md-3">
							<div class="border rounded py-3">
								<h4 class="mb-0">{run.totalCount}</h4>
								<span class="text-muted">{$_('Total')}</span>
							</div>
						</div>
						<div class="col-6 col-md-3">
							<div class="border rounded py-3">
								<h4 class="mb-0 text-success">{run.passedCount}</h4>
								<span class="text-muted">{$_('Passed')}</span>
							</div>
						</div>
						<div class="col-6 col-md-3">
							<div class="border rounded py-3">
								<h4 class="mb-0 text-danger">{run.failedCount}</h4>
								<span class="text-muted">{$_('Failed (assertion)')}</span>
							</div>
						</div>
						<div class="col-6 col-md-3">
							<div class="border rounded py-3">
								<h4 class="mb-0 text-warning">{run.errorCount}</h4>
								<span class="text-muted">{$_('Errored (never ran)')}</span>
							</div>
						</div>
					</div>
					{#if run.errorCount > 0}
						<div class="alert alert-warning mt-3 mb-0" role="alert">
							{$_('Errored cases never reached their assertions -- a timeout, a mock-seam failure, or a case with no turns. That is a harness problem, not an agent regression.')}
						</div>
					{/if}
					{#if !isFinished}
						<p class="text-muted text-center mt-3 mb-0">
							<i class="mdi mdi-loading mdi-spin me-1"></i>{$_('This run is still going. Refreshing every couple of seconds.')}
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	{#if isComparison}
		<div class="row">
			<div class="col-lg-12">
				<div class="card">
					<div class="card-body border-bottom">
						<h5 class="mb-0 card-title">{$_('Model Comparison')}</h5>
					</div>
					<div class="card-body">
						<div class="table-responsive thin-scrollbar">
							<table class="table table-bordered align-middle mb-0">
								<thead>
									<tr>
										<th scope="col">{$_('Case')}</th>
										{#each modelColumns as col (col.key)}
											<th scope="col">
												<div class="font-monospace">{col.model}</div>
												<div class="text-muted small fw-normal">{col.provider}</div>
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
												<td class={cell && cell.status !== 'Passed' ? 'table-danger' : ''}>
													{#if cell}
														<span class="badge bg-{statusColor(cell.status)}">{$_(cell.status)}</span>
														<span class="text-muted small ms-1">{formatDuration(cell.durationMs)}</span>
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
												<div class="text-muted small">{formatDuration(summary.totalMs)}</div>
											</td>
										{/each}
									</tr>
								</tfoot>
							</table>
						</div>
						<p class="text-muted small mt-3 mb-0">
							{$_('Durations are wall-clock for the whole case, including mocked tool calls, so they are comparable between models but are not a pure model-latency measurement.')}
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<div class="row">
		<div class="col-lg-12">
			<div class="card">
				<div class="card-body border-bottom">
					<h5 class="mb-0 card-title">{$_('Case Results')} ({results.length})</h5>
				</div>
				<div class="card-body">
					{#if results.length === 0}
						<p class="text-muted text-center py-4 mb-0">
							{isFinished ? $_('This run produced no case results.') : $_('No case results yet.')}
						</p>
					{:else}
						{#each results as result (result.id)}
							{@const isExpanded = expandedIds.includes(result.id)}
							<div class="border rounded mb-3">
								<div class="d-flex flex-wrap align-items-center justify-content-between gap-2 p-3">
									<div class="d-flex align-items-center gap-2 flex-wrap">
										<span class="badge bg-{statusColor(result.status)}">{$_(result.status)}</span>
										<span class="fw-semibold">{result.caseName}</span>
										{#if result.model}
											<!-- Without this the same case name appears N times with no way to tell
											     which model produced which row. -->
											<span class="badge bg-primary font-monospace" title={result.provider}>{result.model}</span>
										{/if}
										<span class="text-muted small">{formatDuration(result.durationMs)}</span>
										{#if result.conversationId}
											<span class="text-muted small font-monospace">{result.conversationId}</span>
										{/if}
									</div>
									<button
										type="button"
										class="btn btn-sm btn-soft-secondary"
										aria-expanded={isExpanded}
										onclick={() => toggleExpanded(result.id)}
									>
										<i class={isExpanded ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'}></i>
										{isExpanded ? $_('Hide details') : $_('Show details')}
									</button>
								</div>

								{#if result.error}
									<div class="px-3 pb-3">
										<div class="alert alert-warning mb-0" role="alert">
											<span class="fw-semibold">{$_('Harness error')}:</span> {result.error}
										</div>
									</div>
								{/if}

								{#if isExpanded}
									<div class="border-top p-3">
										{#each result.turns as turn (turn.index)}
											<div class="mb-3">
												<h6 class="mb-2">{$_('Turn')} {turn.index + 1}</h6>
												<div class="mb-2">
													<div class="text-muted small">{$_('User')}</div>
													<div class="border rounded p-2 bg-light-subtle text-break">{turn.userMessage}</div>
												</div>
												<div class="mb-2">
													<div class="text-muted small">{$_('Agent output')}</div>
													<div class="border rounded p-2 text-break">{turn.output || '--'}</div>
												</div>
												{#if turn.assertions?.length > 0}
													{@render assertionTable(turn.assertions)}
												{:else}
													<p class="text-muted small mb-0">{$_('No assertions on this turn.')}</p>
												{/if}
											</div>
										{/each}

										{#if result.assertions?.length > 0}
											<div class="mb-3">
												<h6 class="mb-2">{$_('Case Assertions')}</h6>
												{@render assertionTable(result.assertions)}
											</div>
										{/if}

										<div>
											<h6 class="mb-2">{$_('Observed Tool Calls')} ({result.observedToolCalls?.length || 0})</h6>
											{#if result.observedToolCalls?.length > 0}
												<div class="table-responsive thin-scrollbar">
													<table class="table table-sm table-bordered align-middle mb-0">
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
																<tr class={call.outcome === 'Blocked' ? 'table-warning' : ''}>
																	<td>{call.turnIndex + 1}</td>
																	<td class="font-monospace text-break">{call.functionName}</td>
																	<td>
																		{#if call.outcome === 'Blocked'}
																			<span
																				class="badge bg-warning"
																				title={$_('The agent tried to call a tool this case does not mock, so it was blocked. This is often the root cause of the failure above.')}
																			>
																				{$_('Blocked')}
																			</span>
																		{:else}
																			<span class="badge bg-info">{$_(call.outcome)}</span>
																		{/if}
																	</td>
																	<td><span class="font-monospace small text-break">{call.argsJson || '--'}</span></td>
																	<td><span class="font-monospace small text-break">{call.resultContent || '--'}</span></td>
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											{:else}
												<p class="text-muted small mb-0">{$_('The agent called no tools during this case.')}</p>
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
	</div>
{/if}
