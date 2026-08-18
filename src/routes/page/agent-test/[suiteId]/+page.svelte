<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Swal from 'sweetalert2';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { LlmModelCapability, LlmModelType } from '$lib/helpers/enums';
	import { getAgentOptions } from '$lib/services/agent-service.js';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import {
		getSuite,
		updateSuite,
		getCases,
		deleteCase,
		updateCase,
		getRuns,
		triggerRun,
		cancelRun,
		recordCases
	} from '$lib/services/agent-test-service.js';
	import { statusColor, isTerminalStatus, errorMessage, formatDateTime, formatDuration, t } from '$lib/helpers/utils/agent-test.js';

	const duration = 3000;
	const nameMaxLength = 200;
	const descriptionMaxLength = 2000;

	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let successText = $state('');
	let errorText = $state('');

	/** @type {string | null} */
	let loadErrorText = $state(null);

	let suiteId = $derived(page.params.suiteId);

	/** @type {import('$agentTestTypes').AgentTestSuite | null} */
	let suite = $state(null);

	/** @type {import('$agentTestTypes').AgentTestCase[]} */
	let cases = $state([]);

	/** @type {import('$agentTestTypes').AgentTestRun[]} */
	let runs = $state([]);

	/** @type {Record<string, string>} */
	let agentNameById = $state({});

	/** Provider/model catalogue backing the judge pickers. */
	/** @type {import('$commonTypes').LlmConfig[]} */
	let llmConfigs = $state([]);

	/** Case ids ticked for a partial re-run. Empty = run every enabled case. */
	/** @type {string[]} */
	let selectedCaseIds = $state([]);

	let isSettingsOpen = $state(false);
	let isRecordOpen = $state(false);
	let isRunModalOpen = $state(false);

	/** true = the run modal was opened by "Run Selected", false = "Run All Enabled". */
	let runPartial = $state(false);

	/** Models this run will sweep. Empty = one pass on the agent's own LlmConfig. */
	/** @type {import('$agentTestTypes').TestModel[]} */
	let selectedRunModels = $state([]);

	let isSaving = $state(false);
	let isTriggering = $state(false);

	/** Draft copy of the suite, so cancelling the settings modal discards edits. */
	/** @type {{ name: string, description: string, enabled: boolean, caseTimeoutSeconds: number, judgeProvider: string, judgeModel: string, extraAllowedFunctions: string, forceBlockedFunctions: string }} */
	let settingsDraft = $state({
		name: '',
		description: '',
		enabled: true,
		caseTimeoutSeconds: 120,
		judgeProvider: '',
		judgeModel: '',
		extraAllowedFunctions: '',
		forceBlockedFunctions: ''
	});

	let recordConversationId = $state('');

	/** Model used to split the conversation into scenarios; null = deterministic recorder, no model call. */
	/** @type {import('$agentTestTypes').TestModel | null} */
	let recordModel = $state(null);

	/**
	 * Chat-capable providers only -- the judge is a chat completion, so an
	 * image or transcription provider in this list would just be a trap.
	 * The leading '' is the "not configured" choice.
	 */
	let judgeProviders = $derived([
		'',
		...llmConfigs.filter(x => x.models?.some(isChatModel)).map(x => x.provider),
		// A provider the suite already points at but that the catalogue no longer
		// offers still has to be selectable, otherwise merely opening this modal
		// to change the timeout would blank it on save (PUT is a full replace).
		...(settingsDraft.judgeProvider && !llmConfigs.some(x => x.provider === settingsDraft.judgeProvider)
			? [settingsDraft.judgeProvider]
			: [])
	]);

	let judgeModels = $derived(judgeModelsFor(settingsDraft.judgeProvider));

	/** Flat provider/model catalogue for the run modal's checkbox list. */
	let runModelCatalogue = $derived(
		llmConfigs
			.map(cfg => ({ provider: cfg.provider, models: (cfg.models || []).filter(isChatModel).map(m => m.name) }))
			.filter(x => x.models.length > 0)
	);

	/** Cases x models -- what the run will actually execute, and what it will cost. */
	let plannedCaseCount = $derived(runPartial ? selectedCaseIds.length : enabledCaseCount);
	let plannedExecutionCount = $derived(plannedCaseCount * Math.max(1, selectedRunModels.length));

	let enabledCaseCount = $derived(cases.filter(x => x.enabled).length);
	let canSaveSettings = $derived(!!settingsDraft.name?.trim() && settingsDraft.caseTimeoutSeconds > 0);
	let canRecord = $derived(!!recordConversationId?.trim());
	let allCasesSelected = $derived(cases.length > 0 && selectedCaseIds.length === cases.length);

	onMount(async () => {
		isLoading = true;
		try {
			await Promise.all([loadAgentNames(), loadLlmConfigs(), loadAll()]);
		} finally {
			isLoading = false;
		}
	});

	function loadAgentNames() {
		return getAgentOptions().then(res => {
			agentNameById = Object.fromEntries((res || []).map(x => [x.id, x.name]));
		}).catch(() => {
			agentNameById = {};
		});
	}

	function loadLlmConfigs() {
		return getLlmConfigs().then(res => {
			llmConfigs = res || [];
		}).catch(() => {
			// The judge pickers degrade to "keep whatever is stored" rather than
			// blocking the whole settings modal on an unrelated endpoint.
			llmConfigs = [];
		});
	}

	/** @param {import('$commonTypes').LlmModelSetting} model */
	function isChatModel(model) {
		return model.type === LlmModelType.Chat || model.capabilities?.includes(LlmModelCapability.Chat);
	}

	/** @param {string} provider */
	function judgeModelsFor(provider) {
		if (!provider) return [];
		const names = (llmConfigs.find(x => x.provider === provider)?.models || [])
			.filter(isChatModel)
			.map(x => x.name);
		// Same reasoning as judgeProviders: never drop a stored value just because
		// the catalogue no longer lists it.
		return settingsDraft.judgeModel && !names.includes(settingsDraft.judgeModel)
			? [...names, settingsDraft.judgeModel]
			: names;
	}

	/** @param {any} e */
	function changeJudgeProvider(e) {
		settingsDraft.judgeProvider = e.target.value || '';
		// The stored model belongs to the old provider; clear it so the two never
		// disagree. Empty provider means "no judge configured" at all.
		settingsDraft.judgeModel = '';
	}

	function loadAll() {
		loadErrorText = null;
		return getSuite(suiteId).then(res => {
			suite = res;
			return Promise.all([loadCases(), loadRuns()]);
		}).catch(err => {
			suite = null;
			loadErrorText = errorMessage(err, t('Failed to load this test suite.'));
		});
	}

	function loadCases() {
		return getCases(suiteId).then(res => {
			cases = res || [];
			// Drop ticks for cases that no longer exist, otherwise a stale id ends
			// up in caseIds and the run comes back Error with nothing matched.
			const ids = new Set(cases.map(x => x.id));
			selectedCaseIds = selectedCaseIds.filter(id => ids.has(id));
		}).catch(() => {
			cases = [];
		});
	}

	function loadRuns() {
		return getRuns(suiteId).then(res => {
			runs = res || [];
		}).catch(() => {
			runs = [];
		});
	}

	function refresh() {
		isLoading = true;
		return loadAll().finally(() => {
			isLoading = false;
		});
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

	/** @param {string} agentId */
	function agentName(agentId) {
		return agentNameById[agentId] || agentId;
	}

	/**
	 * AgentTestRun carries no duration field, so it comes from the two timestamps.
	 * @param {import('$agentTestTypes').AgentTestRun} run
	 */
	function runDuration(run) {
		if (!run.startedAt || !run.completedAt) return '--';
		const started = new Date(run.startedAt).getTime();
		const completed = new Date(run.completedAt).getTime();
		return Number.isNaN(started) || Number.isNaN(completed) ? '--' : formatDuration(completed - started);
	}

	/** @param {string} caseId */
	function toggleCase(caseId) {
		selectedCaseIds = selectedCaseIds.includes(caseId)
			? selectedCaseIds.filter(id => id !== caseId)
			: [...selectedCaseIds, caseId];
	}

	function toggleAllCases() {
		selectedCaseIds = allCasesSelected ? [] : cases.map(x => x.id);
	}

	function goBack() {
		goto('/page/agent-test');
	}

	/** @param {string} caseId */
	function goToCase(caseId) {
		goto(`/page/agent-test/${suiteId}/case/${caseId}`);
	}

	function goToNewCase() {
		goto(`/page/agent-test/${suiteId}/case/new`);
	}

	/** @param {string} runId */
	function goToRun(runId) {
		goto(`/page/agent-test/run/${runId}`);
	}

	function openSettings() {
		if (!suite) return;
		settingsDraft = {
			name: suite.name || '',
			description: suite.description || '',
			enabled: suite.enabled,
			caseTimeoutSeconds: suite.caseTimeoutSeconds ?? 120,
			judgeProvider: suite.judgeProvider || '',
			judgeModel: suite.judgeModel || '',
			extraAllowedFunctions: (suite.extraAllowedFunctions || []).join('\n'),
			forceBlockedFunctions: (suite.forceBlockedFunctions || []).join('\n')
		};
		isSettingsOpen = true;
	}

	function closeSettings() {
		if (isSaving) return;
		isSettingsOpen = false;
	}

	/** @param {string} text */
	function splitLines(text) {
		return (text || '')
			.split('\n')
			.map(x => x.trim())
			.filter(x => !!x);
	}

	/** @param {any} e */
	function submitSettings(e) {
		e?.preventDefault();
		if (!suite || !canSaveSettings || isSaving) return;

		isSaving = true;
		// PUT replaces the whole suite, so every field goes back -- omitting
		// caseTimeoutSeconds/extraAllowedFunctions/forceBlockedFunctions resets
		// them to the backend defaults rather than leaving them alone.
		updateSuite(suiteId, {
			agentId: suite.agentId,
			name: settingsDraft.name.trim(),
			description: settingsDraft.description?.trim() || null,
			enabled: settingsDraft.enabled,
			judgeProvider: settingsDraft.judgeProvider?.trim() || null,
			judgeModel: settingsDraft.judgeModel?.trim() || null,
			extraAllowedFunctions: splitLines(settingsDraft.extraAllowedFunctions),
			forceBlockedFunctions: splitLines(settingsDraft.forceBlockedFunctions),
			caseTimeoutSeconds: Number(settingsDraft.caseTimeoutSeconds)
		}).then(res => {
			suite = res;
			isSettingsOpen = false;
			notifySuccess(t('Suite settings saved!'));
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to save suite settings.')));
		}).finally(() => {
			isSaving = false;
		});
	}

	/** @param {import('$agentTestTypes').AgentTestCase} testCase */
	function toggleCaseEnabled(testCase) {
		isLoading = true;
		// Full replace again: everything the editor does not touch here still has
		// to travel, or flipping the toggle wipes turns/mocks/assertions.
		updateCase(testCase.id, {
			suiteId: testCase.suiteId,
			name: testCase.name,
			enabled: !testCase.enabled,
			turns: testCase.turns || [],
			assertions: testCase.assertions || [],
			initialStates: testCase.initialStates || [],
			mocks: testCase.mocks || [],
			unmockedToolPolicy: testCase.unmockedToolPolicy || 'Block',
			sourceConversationId: testCase.sourceConversationId
		}).then(() => {
			notifySuccess(testCase.enabled ? t('Case disabled.') : t('Case enabled.'));
			return loadCases();
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to update the case.')));
		}).finally(() => {
			isLoading = false;
		});
	}

	/** @param {import('$agentTestTypes').AgentTestCase} testCase */
	function openDeleteCaseModal(testCase) {
		// @ts-ignore
		Swal.fire({
			title: t('Are you sure?'),
			text: t('Delete test case "{name}"? You won\'t be able to revert this!', { name: testCase.name }),
			icon: 'warning',
			customClass: 'custom-modal',
			showCancelButton: true,
			cancelButtonText: t('Cancel'),
			confirmButtonText: t('Yes, delete it!')
		}).then((result) => {
			if (result.value) {
				handleDeleteCase(testCase.id);
			}
		});
	}

	/** @param {string} caseId */
	function handleDeleteCase(caseId) {
		isLoading = true;
		deleteCase(caseId).then(() => {
			notifySuccess(t('Test case deleted!'));
			return loadCases();
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to delete the test case.')));
		}).finally(() => {
			isLoading = false;
		});
	}

	/** @param {boolean} partial - true = only the ticked cases, false = every enabled case */
	function confirmRun(partial) {
		if (!suite || isTriggering) return;
		runPartial = partial;
		// Default to no override -- one pass on each agent's own LlmConfig, i.e. what the button
		// did before models existed. Picking models is opt-in because each one multiplies cost.
		selectedRunModels = [];
		isRunModalOpen = true;
	}

	function closeRunModal() {
		if (isTriggering) return;
		isRunModalOpen = false;
	}

	/** @param {string} provider @param {string} model */
	function toggleRunModel(provider, model) {
		const key = `${provider}/${model}`;
		selectedRunModels = selectedRunModels.some(x => `${x.provider}/${x.model}` === key)
			? selectedRunModels.filter(x => `${x.provider}/${x.model}` !== key)
			: [...selectedRunModels, { provider, model }];
	}

	/** @param {string} provider @param {string} model */
	function isRunModelSelected(provider, model) {
		return selectedRunModels.some(x => x.provider === provider && x.model === model);
	}

	function submitRun() {
		if (isTriggering) return;
		isTriggering = true;
		triggerRun(
			suiteId,
			runPartial ? selectedCaseIds : null,
			selectedRunModels.length > 0 ? selectedRunModels : null
		).then(run => {
			isRunModalOpen = false;
			notifySuccess(t('Run queued!'));
			goToRun(run.id);
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to start the run.')));
		}).finally(() => {
			isTriggering = false;
		});
	}

	/** @param {string} runId */
	function handleCancelRun(runId) {
		isLoading = true;
		cancelRun(runId).then(() => {
			notifySuccess(t('Cancellation requested.'));
			return loadRuns();
		}).catch(err => {
			// 409 means it finished between the render and the click.
			notifyError(errorMessage(err, t('Failed to cancel the run.')));
			return loadRuns();
		}).finally(() => {
			isLoading = false;
		});
	}

	function openRecord() {
		recordConversationId = '';
		// Default off: the deterministic recorder keeps the conversation inside this system.
		recordModel = null;
		isRecordOpen = true;
	}

	/** @param {any} e */
	function changeRecordModel(e) {
		const value = e.target.value;
		if (!value) {
			recordModel = null;
			return;
		}
		const separator = value.indexOf('/');
		recordModel = { provider: value.slice(0, separator), model: value.slice(separator + 1) };
	}

	function closeRecord() {
		if (isSaving) return;
		isRecordOpen = false;
	}

	/** @param {any} e */
	function submitRecord(e) {
		e?.preventDefault();
		if (!canRecord || isSaving) return;

		isSaving = true;
		recordCases(recordConversationId.trim(), suiteId, recordModel).then(res => {
			const drafts = res || [];
			isRecordOpen = false;
			notifySuccess(drafts.length === 1
				? t('Draft case recorded. Review it, then enable it.')
				: t('{count} draft cases recorded. Review them, then enable them.', { count: drafts.length }));
			// Straight into the editor for a single draft; for several, the suite list is the only
			// place that shows all of them at once.
			return loadCases().then(() => {
				if (drafts.length === 1) goToCase(drafts[0].id);
			});
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to record a draft from that conversation.')));
		}).finally(() => {
			isSaving = false;
		});
	}

	/** @param {any} e @param {() => void} close */
	function handleBackdropClick(e, close) {
		if (e.target === e.currentTarget) {
			close();
		}
	}

	/** @param {KeyboardEvent} e @param {() => void} close */
	function handleModalKeydown(e, close) {
		if (e.key === 'Escape') {
			close();
		}
	}
</script>

<HeadTitle title={$_('Test Suite')} />
<Breadcrumb title={$_('Agent Testing')} pagetitle={suite?.name || $_('Test Suite')} />

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
				<span class="hstack gap-2">
					<button type="button" class="btn btn-sm btn-outline-danger" onclick={() => refresh()}>
						<i class="mdi mdi-refresh"></i> {$_('Retry')}
					</button>
					<button type="button" class="btn btn-sm btn-secondary" onclick={() => goBack()}>
						{$_('Back to Suites')}
					</button>
				</span>
			</div>
		</div>
	</div>
{:else if suite}
	<div class="row">
		<div class="col-lg-12">
			<div class="card">
				<div class="card-body border-bottom">
					<div class="d-flex flex-wrap align-items-start justify-content-between gap-2">
						<div>
							<h5 class="mb-1 card-title">
								{suite.name}
								{#if suite.enabled}
									<span class="badge bg-success ms-2">{$_('Enabled')}</span>
								{:else}
									<span class="badge bg-danger ms-2">{$_('Disabled')}</span>
								{/if}
							</h5>
							<p class="text-muted mb-0">
								{$_('Agent')}: {agentName(suite.agentId)}
								<span class="mx-2">|</span>
								{$_('Case timeout')}: {suite.caseTimeoutSeconds}s
							</p>
							{#if suite.description}
								<p class="text-muted mb-0 mt-1">{suite.description}</p>
							{/if}
						</div>
						<div class="hstack gap-2 flex-wrap">
							<button type="button" class="btn btn-soft-secondary" onclick={() => goBack()}>
								<i class="mdi mdi-arrow-left"></i> {$_('Back')}
							</button>
							<button type="button" class="btn btn-soft-secondary" onclick={() => openSettings()}>
								<i class="mdi mdi-cog-outline"></i> {$_('Settings')}
							</button>
							<button type="button" class="btn btn-soft-info" onclick={() => openRecord()}>
								<i class="mdi mdi-record-rec"></i> {$_('Record from Conversation')}
							</button>
							<button type="button" class="btn btn-soft-primary" onclick={() => goToNewCase()}>
								<i class="mdi mdi-plus"></i> {$_('New Case')}
							</button>
							{#if selectedCaseIds.length > 0}
								<button
									type="button"
									class="btn btn-primary"
									disabled={isTriggering || !suite.enabled}
									onclick={() => confirmRun(true)}
								>
									{#if isTriggering}
										<i class="mdi mdi-loading mdi-spin me-1"></i>
									{:else}
										<i class="mdi mdi-play"></i>
									{/if}
									{$_('Run Selected')} ({selectedCaseIds.length})
								</button>
							{/if}
							<button
								type="button"
								class="btn btn-primary"
								disabled={isTriggering || !suite.enabled || enabledCaseCount === 0}
								onclick={() => confirmRun(false)}
							>
								{#if isTriggering}
									<i class="mdi mdi-loading mdi-spin me-1"></i>
								{:else}
									<i class="mdi mdi-play"></i>
								{/if}
								{$_('Run All Enabled')} ({enabledCaseCount})
							</button>
						</div>
					</div>
					{#if !suite.enabled}
						<div class="alert alert-warning mt-3 mb-0" role="alert">
							{$_('This suite is disabled. Triggering a run is rejected by the server until you enable it in Settings.')}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-lg-12">
			<div class="card">
				<div class="card-body border-bottom">
					<div class="d-flex flex-wrap align-items-center justify-content-between">
						<h5 class="mb-0 card-title">{$_('Test Cases')} ({cases.length})</h5>
						{#if selectedCaseIds.length > 0}
							<button type="button" class="btn btn-sm btn-soft-secondary" onclick={() => (selectedCaseIds = [])}>
								{$_('Clear selection')}
							</button>
						{/if}
					</div>
				</div>
				<div class="card-body">
					{#if cases.length === 0}
						<div class="text-center py-5">
							<p class="text-muted mb-3">{$_('No test cases in this suite yet.')}</p>
							<div class="hstack gap-2 justify-content-center">
								<button type="button" class="btn btn-primary" onclick={() => goToNewCase()}>
									<i class="mdi mdi-plus"></i> {$_('New Case')}
								</button>
								<button type="button" class="btn btn-soft-info" onclick={() => openRecord()}>
									<i class="mdi mdi-record-rec"></i> {$_('Record from Conversation')}
								</button>
							</div>
						</div>
					{:else}
						<div class="table-responsive thin-scrollbar">
							<table class="table table-bordered align-middle nowrap">
								<thead>
									<tr>
										<th scope="col" style="width: 40px;">
											<input
												type="checkbox"
												class="form-check-input"
												aria-label={$_('Select all cases')}
												checked={allCasesSelected}
												onchange={() => toggleAllCases()}
											/>
										</th>
										<th scope="col">{$_('Name')}</th>
										<th scope="col">{$_('Turns')}</th>
										<th scope="col">{$_('Mocks')}</th>
										<th scope="col">{$_('Assertions')}</th>
										<th scope="col">{$_('Source')}</th>
										<th scope="col">{$_('Enabled')}</th>
										<th scope="col">{$_('Action')}</th>
									</tr>
								</thead>
								<tbody>
									{#each cases as testCase (testCase.id)}
										{@const assertionCount = (testCase.assertions?.length || 0)
											+ (testCase.turns || []).reduce((sum, t) => sum + (t.assertions?.length || 0), 0)}
										<tr>
											<td>
												<input
													type="checkbox"
													class="form-check-input"
													aria-label={$_('Select case {name}', { values: { name: testCase.name } })}
													checked={selectedCaseIds.includes(testCase.id)}
													onchange={() => toggleCase(testCase.id)}
												/>
											</td>
											<td>
												<button
													type="button"
													class="btn btn-link p-0 text-start text-primary"
													onclick={() => goToCase(testCase.id)}
												>
													{testCase.name}
												</button>
											</td>
											<td>{testCase.turns?.length || 0}</td>
											<td>{testCase.mocks?.length || 0}</td>
											<td>{assertionCount}</td>
											<td>
												{#if testCase.sourceConversationId}
													<span
														class="badge bg-info"
														title={$_('Recorded from conversation {id}. May contain live customer data.', { values: { id: testCase.sourceConversationId } })}
													>
														{$_('Recorded')}
													</span>
												{:else}
													<span class="badge bg-light text-body">{$_('Manual')}</span>
												{/if}
											</td>
											<td>
												{#if testCase.enabled}
													<span class="badge bg-success">{$_('Enabled')}</span>
												{:else}
													<span class="badge bg-secondary">{$_('Draft')}</span>
												{/if}
											</td>
											<td>
												<ul class="list-unstyled hstack gap-1 mb-0">
													<li data-bs-toggle="tooltip" data-bs-placement="top" title={testCase.enabled ? $_('Disable') : $_('Enable')}>
														<button
															type="button"
															class="btn btn-sm btn-soft-secondary"
															aria-label={testCase.enabled ? $_('Disable case') : $_('Enable case')}
															onclick={() => toggleCaseEnabled(testCase)}
														>
															<i class={testCase.enabled ? 'mdi mdi-toggle-switch' : 'mdi mdi-toggle-switch-off'}></i>
														</button>
													</li>
													<li data-bs-toggle="tooltip" data-bs-placement="top" title={$_('Edit')}>
														<button
															type="button"
															class="btn btn-sm btn-soft-primary"
															aria-label={$_('Edit case')}
															onclick={() => goToCase(testCase.id)}
														>
															<i class="mdi mdi-pencil-outline"></i>
														</button>
													</li>
													<li data-bs-toggle="tooltip" data-bs-placement="top" title={$_('Delete')}>
														<button
															type="button"
															class="btn btn-sm btn-soft-danger"
															aria-label={$_('Delete case')}
															onclick={() => openDeleteCaseModal(testCase)}
														>
															<i class="mdi mdi-delete-outline"></i>
														</button>
													</li>
												</ul>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-lg-12">
			<div class="card">
				<div class="card-body border-bottom">
					<div class="d-flex flex-wrap align-items-center justify-content-between">
						<h5 class="mb-0 card-title">{$_('Run History')}</h5>
						<button type="button" class="btn btn-sm btn-soft-secondary" onclick={() => refresh()}>
							<i class="mdi mdi-refresh"></i> {$_('Refresh')}
						</button>
					</div>
				</div>
				<div class="card-body">
					{#if runs.length === 0}
						<p class="text-muted text-center py-4 mb-0">{$_('This suite has never been run.')}</p>
					{:else}
						<div class="table-responsive thin-scrollbar">
							<table class="table table-bordered align-middle nowrap">
								<thead>
									<tr>
										<th scope="col">{$_('Status')}</th>
										<th scope="col">{$_('Result')}</th>
										<th scope="col">{$_('Scope')}</th>
										<th scope="col">{$_('Started')}</th>
										<th scope="col">{$_('Duration')}</th>
										<th scope="col">{$_('Action')}</th>
									</tr>
								</thead>
								<tbody>
									{#each runs as run (run.id)}
										<tr>
											<td>
												<span class="badge bg-{statusColor(run.status)}">{$_(run.status)}</span>
												{#if run.cancelRequested && !isTerminalStatus(run.status)}
													<span class="badge bg-dark ms-1">{$_('Cancelling')}</span>
												{/if}
											</td>
											<td>
												<span class="text-success">{run.passedCount} {$_('passed')}</span>,
												<span class="text-danger">{run.failedCount} {$_('failed')}</span>,
												<span class="text-warning">{run.errorCount} {$_('errored')}</span>
												<span class="text-muted">/ {run.totalCount}</span>
											</td>
											<td>
												{#if run.caseIds && run.caseIds.length > 0}
													<span class="badge bg-light text-body">{$_('Subset')} ({run.caseIds.length})</span>
												{:else}
													<span class="badge bg-light text-body">{$_('All enabled')}</span>
												{/if}
												{#if run.models && run.models.length > 0}
													<span
														class="badge bg-primary ms-1"
														title={run.models.map(m => `${m.provider}/${m.model}`).join('\n')}
													>
														{run.models.length} {$_('models')}
													</span>
												{/if}
											</td>
											<td>{formatDateTime(run.startedAt)}</td>
											<td>{runDuration(run)}</td>
											<td>
												<ul class="list-unstyled hstack gap-1 mb-0">
													<li data-bs-toggle="tooltip" data-bs-placement="top" title={$_('View')}>
														<button
															type="button"
															class="btn btn-sm btn-soft-primary"
															aria-label={$_('View run')}
															onclick={() => goToRun(run.id)}
														>
															<i class="mdi mdi-eye-outline"></i>
														</button>
													</li>
													{#if !isTerminalStatus(run.status)}
														<li data-bs-toggle="tooltip" data-bs-placement="top" title={$_('Cancel')}>
															<button
																type="button"
																class="btn btn-sm btn-soft-danger"
																aria-label={$_('Cancel Run')}
																onclick={() => handleCancelRun(run.id)}
															>
																<i class="mdi mdi-stop"></i>
															</button>
														</li>
													{/if}
												</ul>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

{#if isSettingsOpen}
<div
	class="modal show d-block"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={(e) => handleBackdropClick(e, closeSettings)}
	onkeydown={(e) => handleModalKeydown(e, closeSettings)}
>
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">{$_('Suite Settings')}</h5>
				<button type="button" class="btn-close" aria-label={$_('Close')} onclick={() => closeSettings()}></button>
			</div>
			<div class="modal-body">
				<form onsubmit={(e) => submitSettings(e)}>
					<div class="mb-3">
						<label class="form-label" for="suite-name">{$_('Name')} <span class="text-danger">*</span></label>
						<input id="suite-name" type="text" class="form-control" maxlength={nameMaxLength} bind:value={settingsDraft.name} />
					</div>
					<div class="mb-3">
						<label class="form-label" for="suite-description">{$_('Description')}</label>
						<textarea id="suite-description" class="form-control" rows="2" maxlength={descriptionMaxLength} bind:value={settingsDraft.description}></textarea>
					</div>
					<div class="row">
						<div class="col-md-6 mb-3">
							<div class="form-check form-switch">
								<input id="suite-enabled" type="checkbox" class="form-check-input" bind:checked={settingsDraft.enabled} />
								<label class="form-check-label" for="suite-enabled">{$_('Enabled')}</label>
							</div>
							<div class="form-text">{$_('A disabled suite cannot be run at all.')}</div>
						</div>
						<div class="col-md-6 mb-3">
							<label class="form-label" for="suite-timeout">{$_('Case timeout (seconds)')} <span class="text-danger">*</span></label>
							<input id="suite-timeout" type="number" min="1" class="form-control" bind:value={settingsDraft.caseTimeoutSeconds} />
						</div>
					</div>
					<div class="row">
						<div class="col-md-6 mb-3">
							<label class="form-label" for="suite-judge-provider">{$_('Judge provider')}</label>
							<select
								id="suite-judge-provider"
								class="form-select"
								value={settingsDraft.judgeProvider}
								onchange={e => changeJudgeProvider(e)}
							>
								{#each judgeProviders as provider}
									<option value={provider}>{provider || $_('Not configured')}</option>
								{/each}
							</select>
						</div>
						<div class="col-md-6 mb-3">
							<label class="form-label" for="suite-judge-model">{$_('Judge model')}</label>
							<select
								id="suite-judge-model"
								class="form-select"
								disabled={judgeModels.length === 0}
								bind:value={settingsDraft.judgeModel}
							>
								<option value="">{$_('Not configured')}</option>
								{#each judgeModels as model}
									<option value={model}>{model}</option>
								{/each}
							</select>
							{#if settingsDraft.judgeProvider && judgeModels.length === 0}
								<div class="form-text text-warning">
									{$_('This provider has no chat-capable model registered.')}
								</div>
							{/if}
						</div>
					</div>
					<div class="alert alert-info" role="alert">
						{$_('llmJudge assertions always fail in P1 regardless of these two fields.')}
					</div>
					<div class="row">
						<div class="col-md-6 mb-3">
							<label class="form-label" for="suite-extra-allowed">{$_('Extra allowed functions')}</label>
							<textarea id="suite-extra-allowed" class="form-control font-monospace" rows="4" bind:value={settingsDraft.extraAllowedFunctions}></textarea>
							<div class="form-text">{$_('One function name per line. These run for real during a test -- only list functions with no side effects.')}</div>
						</div>
						<div class="col-md-6 mb-3">
							<label class="form-label" for="suite-force-blocked">{$_('Force blocked functions')}</label>
							<textarea id="suite-force-blocked" class="form-control font-monospace" rows="4" bind:value={settingsDraft.forceBlockedFunctions}></textarea>
							<div class="form-text">{$_('One per line. Blocked even if allow-listed elsewhere.')}</div>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-primary" disabled={!canSaveSettings || isSaving} onclick={(e) => submitSettings(e)}>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin me-1"></i>
					{/if}
					{$_('Save')}
				</button>
				<button type="button" class="btn btn-secondary" disabled={isSaving} onclick={() => closeSettings()}>
					{$_('Cancel')}
				</button>
			</div>
		</div>
	</div>
</div>
<div class="modal-backdrop fade show" transition:fade={{ duration: 150 }}></div>
{/if}

{#if isRunModalOpen}
<div
	class="modal show d-block"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={(e) => handleBackdropClick(e, closeRunModal)}
	onkeydown={(e) => handleModalKeydown(e, closeRunModal)}
>
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">{$_('Run this suite?')}</h5>
				<button type="button" class="btn-close" aria-label={$_('Close')} onclick={() => closeRunModal()}></button>
			</div>
			<div class="modal-body">
				<p class="mb-3">
					{runPartial ? $_('Running the selected cases') : $_('Running every enabled case')}:
					<span class="fw-semibold">{plannedCaseCount}</span>
				</p>

				<div class="mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
					<span class="fw-semibold">{$_('Models')}</span>
					{#if selectedRunModels.length > 0}
						<button type="button" class="btn btn-sm btn-soft-secondary" onclick={() => (selectedRunModels = [])}>
							{$_('Use the agent\'s own model')}
						</button>
					{/if}
				</div>
				<p class="text-muted small">
					{$_('Pick nothing to run once on whatever model each agent is configured with. Pick two or more to run the whole set once per model and compare them side by side.')}
				</p>

				{#if runModelCatalogue.length === 0}
					<div class="alert alert-warning" role="alert">
						{$_('No chat-capable model is registered, so this run will use the agent\'s own configuration.')}
					</div>
				{:else}
					<div class="border rounded p-2 mb-3 thin-scrollbar" style="max-height: 260px; overflow-y: auto;">
						{#each runModelCatalogue as group (group.provider)}
							<div class="mb-2">
								<div class="text-muted small fw-semibold">{group.provider}</div>
								{#each group.models as model (model)}
									<div class="form-check">
										<input
											id={`run-model-${group.provider}-${model}`}
											type="checkbox"
											class="form-check-input"
											checked={isRunModelSelected(group.provider, model)}
											onchange={() => toggleRunModel(group.provider, model)}
										/>
										<label class="form-check-label font-monospace" for={`run-model-${group.provider}-${model}`}>
											{model}
										</label>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<div class="alert alert-warning mb-0" role="alert">
					{$_('{count} execution(s) will run against live models. This costs real tokens and is not rate limited.', { values: { count: plannedExecutionCount } })}
				</div>
			</div>
			<div class="modal-footer">
				<button
					type="button"
					class="btn btn-primary"
					disabled={isTriggering || plannedCaseCount === 0}
					onclick={() => submitRun()}
				>
					{#if isTriggering}
						<i class="mdi mdi-loading mdi-spin me-1"></i>
					{/if}
					{$_('Yes, run it')}
				</button>
				<button type="button" class="btn btn-secondary" disabled={isTriggering} onclick={() => closeRunModal()}>
					{$_('Cancel')}
				</button>
			</div>
		</div>
	</div>
</div>
<div class="modal-backdrop fade show" transition:fade={{ duration: 150 }}></div>
{/if}

{#if isRecordOpen}
<div
	class="modal show d-block"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={(e) => handleBackdropClick(e, closeRecord)}
	onkeydown={(e) => handleModalKeydown(e, closeRecord)}
>
	<div class="modal-dialog modal-md" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">{$_('Record a Draft Case')}</h5>
				<button type="button" class="btn-close" aria-label={$_('Close')} onclick={() => closeRecord()}></button>
			</div>
			<div class="modal-body">
				<form onsubmit={(e) => submitRecord(e)}>
					<div class="mb-3">
						<label class="form-label" for="record-conversation-id">{$_('Conversation id')} <span class="text-danger">*</span></label>
						<input
							id="record-conversation-id"
							type="text"
							class="form-control font-monospace"
							bind:value={recordConversationId}
							placeholder={$_('An existing conversation with at least one tool call')}
						/>
					</div>
					<div class="mb-3">
						<label class="form-label" for="record-model">{$_('AI extraction model')}</label>
						<select id="record-model" class="form-select" onchange={e => changeRecordModel(e)}>
							<option value="">{$_('Do not use AI (one case for the whole conversation)')}</option>
							{#each runModelCatalogue as group (group.provider)}
								<optgroup label={group.provider}>
									{#each group.models as model (model)}
										<option value={`${group.provider}/${model}`}>{model}</option>
									{/each}
								</optgroup>
							{/each}
						</select>
						<div class="form-text">
							{$_('With a model picked, the conversation is split into one case per scenario it covers. The model only decides where to split and what to name each case -- mocks, assertions and state still come verbatim from the conversation.')}
						</div>
					</div>

					<div class="alert alert-warning mb-0" role="alert">
						{$_('Recording copies the raw conversation into the test store, including any phone numbers, addresses and tenant names it contains. The draft lands disabled -- review it before enabling.')}
						{#if recordModel}
							<div class="mt-2">
								{$_('AI extraction additionally sends the user messages and tool names to {provider}. Tool arguments and results are not sent.', { values: { provider: recordModel.provider } })}
							</div>
						{/if}
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-primary" disabled={!canRecord || isSaving} onclick={(e) => submitRecord(e)}>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin me-1"></i>
					{/if}
					{$_('Record')}
				</button>
				<button type="button" class="btn btn-secondary" disabled={isSaving} onclick={() => closeRecord()}>
					{$_('Cancel')}
				</button>
			</div>
		</div>
	</div>
</div>
<div class="modal-backdrop fade show" transition:fade={{ duration: 150 }}></div>
{/if}
