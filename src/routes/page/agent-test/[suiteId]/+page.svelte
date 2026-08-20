<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
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

	/** @type {import('$agentTestTypes').AgentTestCase | null} */
	let caseToDelete = $state(null);

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

	/**
	 * Model used to split the conversation into scenarios; null = deterministic
	 * recorder, no model call.
	 * @type {import('$agentTestTypes').TestModel | null}
	 */
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

	/*
	 * Select option lists for the two judge fields.
	 *
	 * The leading '' of `judgeProviders` is dropped here: "not configured" is
	 * the absence of a selection, which Select already expresses through its
	 * placeholder and its own "Clear selection" row. Keeping the empty string
	 * as an option would render a blank line in the menu instead.
	 */
	let judgeProviderOptions = $derived(
		judgeProviders.filter(Boolean).map(provider => ({ label: provider, value: provider }))
	);

	let judgeModelOptions = $derived(judgeModels.map(model => ({ label: model, value: model })));

	/** Flat provider/model catalogue for the run modal's checkbox list. */
	let runModelCatalogue = $derived(
		llmConfigs
			.map(cfg => ({ provider: cfg.provider, models: (cfg.models || []).filter(isChatModel).map(m => m.name) }))
			.filter(x => x.models.length > 0)
	);

	/*
	 * The same catalogue flattened for the record modal's Select. Select renders a
	 * single flat list -- it has no <optgroup> equivalent -- so the provider moves
	 * into each label. Two providers can register the same model name, so the
	 * provider has to stay visible or the two rows would be indistinguishable.
	 */
	let recordModelOptions = $derived(
		runModelCatalogue.flatMap(group =>
			group.models.map(model => ({
				label: `${group.provider} / ${model}`,
				value: `${group.provider}/${model}`
			}))
		)
	);

	/**
	 * Of the ticked cases, the ones that can actually run. The executor drops disabled cases and
	 * then fails the entire run with "none of them matched an enabled case" -- observed as a run
	 * with status Error, zero results and no visible reason. Counting them here stops it earlier.
	 */
	let selectedEnabledCount = $derived(
		cases.filter(c => c.enabled && selectedCaseIds.includes(c.id)).length
	);
	let selectedDisabledCount = $derived(selectedCaseIds.length - selectedEnabledCount);

	/** Cases x models -- what the run will actually execute, and what it will cost. */
	let plannedCaseCount = $derived(runPartial ? selectedEnabledCount : enabledCaseCount);
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
		const selecteds = e?.detail?.selecteds || [];
		settingsDraft.judgeProvider = selecteds.length > 0 ? selecteds[0].value : '';
		// The stored model belongs to the old provider; clear it so the two never
		// disagree. Empty provider means "no judge configured" at all.
		settingsDraft.judgeModel = '';
	}

	/** @param {any} e */
	function changeJudgeModel(e) {
		const selecteds = e?.detail?.selecteds || [];
		settingsDraft.judgeModel = selecteds.length > 0 ? selecteds[0].value : '';
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
		caseToDelete = testCase;
	}

	function closeDeleteCaseModal() {
		caseToDelete = null;
	}

	function confirmDeleteCase() {
		const testCase = caseToDelete;
		caseToDelete = null;
		if (testCase) {
			handleDeleteCase(testCase.id);
		}
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
			// Enabled only: a disabled id contributes nothing but noise to the run's CaseIds record.
			runPartial ? cases.filter(c => c.enabled && selectedCaseIds.includes(c.id)).map(c => c.id) : null,
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
		const selecteds = e?.detail?.selecteds || [];
		const value = selecteds.length > 0 ? selecteds[0].value : '';
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

<ConfirmModal
	isOpen={!!caseToDelete}
	icon="warning"
	title={t('Are you sure?')}
	text={t('Delete test case "{name}"? You won\'t be able to revert this!', { name: caseToDelete?.name ?? '' })}
	confirmBtnText={t('Yes, delete it!')}
	cancelBtnText={t('Cancel')}
	confirmBtnColor="danger"
	confirm={confirmDeleteCase}
	cancel={closeDeleteCaseModal}
	toggleModal={closeDeleteCaseModal}
/>

{#if loadErrorText}
	<div class="flex flex-wrap">
		<div class="w-full">
			<div class="ats-alert ats-tone-danger justify-between" role="alert">
				<span>{loadErrorText}</span>
				<span class="flex flex-none items-center gap-2">
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-outline ats-tone-danger"
						onclick={() => refresh()}
					>
						<i class="mdi mdi-refresh"></i> {$_('Retry')}
					</button>
					<button type="button" class="ats-btn ats-btn-sm ats-btn-secondary" onclick={() => goBack()}>
						{$_('Back to Suites')}
					</button>
				</span>
			</div>
		</div>
	</div>
{:else if suite}
	<div class="flex flex-col gap-4">
		<div class="ats-card">
			<div class="ats-card-section">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<h5 class="ats-card-title flex flex-wrap items-center gap-2">
							{suite.name}
							{#if suite.enabled}
								<span class="ats-badge ats-tone-success">{$_('Enabled')}</span>
							{:else}
								<span class="ats-badge ats-tone-danger">{$_('Disabled')}</span>
							{/if}
						</h5>
						<p class="mt-1 mb-0 text-sm text-muted">
							{$_('Agent')}: {agentName(suite.agentId)}
							<span class="mx-2">|</span>
							{$_('Case timeout')}: {suite.caseTimeoutSeconds}s
						</p>
						{#if suite.description}
							<p class="mt-1 mb-0 text-sm text-muted">{suite.description}</p>
						{/if}
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" class="ats-btn ats-btn-soft ats-tone-secondary" onclick={() => goBack()}>
							<i class="mdi mdi-arrow-left"></i> {$_('Back')}
						</button>
						<button type="button" class="ats-btn ats-btn-soft ats-tone-secondary" onclick={() => openSettings()}>
							<i class="mdi mdi-cog-outline"></i> {$_('Settings')}
						</button>
						<button type="button" class="ats-btn ats-btn-soft ats-tone-info" onclick={() => openRecord()}>
							<i class="mdi mdi-record-rec"></i> {$_('Record from Conversation')}
						</button>
						<button type="button" class="ats-btn ats-btn-soft ats-tone-primary" onclick={() => goToNewCase()}>
							<i class="mdi mdi-plus"></i> {$_('New Case')}
						</button>
						{#if selectedCaseIds.length > 0}
							<button
								type="button"
								class="ats-btn ats-btn-primary"
								disabled={isTriggering || !suite.enabled}
								onclick={() => confirmRun(true)}
							>
								{#if isTriggering}
									<i class="mdi mdi-loading mdi-spin"></i>
								{:else}
									<i class="mdi mdi-play"></i>
								{/if}
								{$_('Run Selected')} ({selectedEnabledCount})
							</button>
						{/if}
						<button
							type="button"
							class="ats-btn ats-btn-primary"
							disabled={isTriggering || !suite.enabled || enabledCaseCount === 0}
							onclick={() => confirmRun(false)}
						>
							{#if isTriggering}
								<i class="mdi mdi-loading mdi-spin"></i>
							{:else}
								<i class="mdi mdi-play"></i>
							{/if}
							{$_('Run All Enabled')} ({enabledCaseCount})
						</button>
					</div>
				</div>
				{#if !suite.enabled}
					<div class="ats-alert ats-tone-warning mt-3" role="alert">
						{$_('This suite is disabled. Triggering a run is rejected by the server until you enable it in Settings.')}
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-format-list-checks"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Test Cases')}</h5>
							<p class="ats-card-subtitle">
								{cases.length} {cases.length === 1 ? $_('case') : $_('cases')}
							</p>
						</div>
					</div>
					{#if selectedCaseIds.length > 0}
						<button
							type="button"
							class="ats-btn ats-btn-sm ats-btn-soft ats-tone-secondary"
							onclick={() => (selectedCaseIds = [])}
						>
							{$_('Clear selection')}
						</button>
					{/if}
				</div>
			</div>
			<div class="ats-card-body">
				{#if cases.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No test cases in this suite yet.')}</p>
						<div class="flex flex-wrap items-center justify-center gap-2">
							<button type="button" class="ats-btn ats-btn-primary" onclick={() => goToNewCase()}>
								<i class="mdi mdi-plus"></i> {$_('New Case')}
							</button>
							<button type="button" class="ats-btn ats-btn-soft ats-tone-info" onclick={() => openRecord()}>
								<i class="mdi mdi-record-rec"></i> {$_('Record from Conversation')}
							</button>
						</div>
					</div>
				{:else}
					<div class="ats-table-wrap scrollbar-on-hover">
						<table class="ats-table">
							<thead>
								<tr>
									<th scope="col" style="width: 40px;">
										<input
											type="checkbox"
											class="ats-check-input"
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
												class="ats-check-input"
												aria-label={$_('Select case {name}', { values: { name: testCase.name } })}
												checked={selectedCaseIds.includes(testCase.id)}
												onchange={() => toggleCase(testCase.id)}
											/>
										</td>
										<td>
											<button
												type="button"
												class="ats-btn ats-btn-link text-start"
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
													class="ats-badge ats-tone-info"
													title={$_('Recorded from conversation {id}. May contain live customer data.', { values: { id: testCase.sourceConversationId } })}
												>
													{$_('Recorded')}
												</span>
											{:else}
												<span class="ats-badge ats-badge-soft ats-tone-secondary">{$_('Manual')}</span>
											{/if}
										</td>
										<td>
											{#if testCase.enabled}
												<span class="ats-badge ats-tone-success">{$_('Enabled')}</span>
											{:else}
												<span class="ats-badge ats-tone-secondary">{$_('Draft')}</span>
											{/if}
										</td>
										<td>
											<ul class="ats-actions">
												<li title={testCase.enabled ? $_('Disable') : $_('Enable')}>
													<button
														type="button"
														class="ats-btn ats-btn-icon ats-btn-soft ats-tone-secondary"
														aria-label={testCase.enabled ? $_('Disable case') : $_('Enable case')}
														onclick={() => toggleCaseEnabled(testCase)}
													>
														<i class={testCase.enabled ? 'mdi mdi-toggle-switch' : 'mdi mdi-toggle-switch-off'}></i>
													</button>
												</li>
												<li title={$_('Edit')}>
													<button
														type="button"
														class="ats-btn ats-btn-icon ats-btn-soft ats-tone-primary"
														aria-label={$_('Edit case')}
														onclick={() => goToCase(testCase.id)}
													>
														<i class="mdi mdi-pencil-outline"></i>
													</button>
												</li>
												<li title={$_('Delete')}>
													<button
														type="button"
														class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
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

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-history"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Run History')}</h5>
							<p class="ats-card-subtitle">
								{runs.length} {runs.length === 1 ? $_('run') : $_('runs')}
							</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-secondary"
						onclick={() => refresh()}
					>
						<i class="mdi mdi-refresh"></i> {$_('Refresh')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				{#if runs.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('This suite has never been run.')}</p>
					</div>
				{:else}
					<div class="ats-table-wrap scrollbar-on-hover">
						<table class="ats-table">
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
											<span class="flex flex-wrap items-center gap-1">
												<span class="ats-badge ats-tone-{statusColor(run.status)}">{$_(run.status)}</span>
												{#if run.cancelRequested && !isTerminalStatus(run.status)}
													<span class="ats-badge ats-tone-dark">{$_('Cancelling')}</span>
												{/if}
											</span>
											{#if run.error}
												<div class="mt-1 text-xs break-words text-warning">{run.error}</div>
											{/if}
										</td>
										<td class="whitespace-nowrap">
											<span class="text-success">{run.passedCount} {$_('passed')}</span>,
											<span class="text-danger">{run.failedCount} {$_('failed')}</span>,
											<span class="text-warning">{run.errorCount} {$_('errored')}</span>
											<span class="text-muted">/ {run.totalCount}</span>
										</td>
										<td>
											<span class="flex flex-wrap items-center gap-1">
												{#if run.caseIds && run.caseIds.length > 0}
													<span class="ats-badge ats-badge-soft ats-tone-secondary">
														{$_('Subset')} ({run.caseIds.length})
													</span>
												{:else}
													<span class="ats-badge ats-badge-soft ats-tone-secondary">{$_('All enabled')}</span>
												{/if}
												{#if run.models && run.models.length > 0}
													<span
														class="ats-badge ats-tone-primary"
														title={run.models.map(m => `${m.provider}/${m.model}`).join('\n')}
													>
														{run.models.length} {$_('models')}
													</span>
												{/if}
											</span>
										</td>
										<td class="whitespace-nowrap">{formatDateTime(run.startedAt)}</td>
										<td class="whitespace-nowrap">{runDuration(run)}</td>
										<td>
											<ul class="ats-actions">
												<li title={$_('View')}>
													<button
														type="button"
														class="ats-btn ats-btn-icon ats-btn-soft ats-tone-primary"
														aria-label={$_('View run')}
														onclick={() => goToRun(run.id)}
													>
														<i class="mdi mdi-eye-outline"></i>
													</button>
												</li>
												{#if !isTerminalStatus(run.status)}
													<li title={$_('Cancel')}>
														<button
															type="button"
															class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
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
{/if}

{#if isSettingsOpen}
<div
	class="ats-modal"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={(e) => handleBackdropClick(e, closeSettings)}
	onkeydown={(e) => handleModalKeydown(e, closeSettings)}
>
	<div class="ats-modal-dialog ats-modal-lg" role="document">
		<div class="ats-modal-content">
			<div class="ats-modal-header">
				<h5 class="ats-modal-title">{$_('Suite Settings')}</h5>
				<button
					type="button"
					class="ats-modal-close"
					aria-label={$_('Close')}
					onclick={() => closeSettings()}
				>
					<i class="mdi mdi-close"></i>
				</button>
			</div>
			<div class="ats-modal-body">
				<form onsubmit={(e) => submitSettings(e)}>
					<div class="mb-4">
						<label class="ats-label" for="suite-name">{$_('Name')} <span class="text-danger">*</span></label>
						<input
							id="suite-name"
							type="text"
							class="ats-input"
							maxlength={nameMaxLength}
							bind:value={settingsDraft.name}
						/>
					</div>
					<div class="mb-4">
						<label class="ats-label" for="suite-description">{$_('Description')}</label>
						<textarea
							id="suite-description"
							class="ats-textarea"
							rows="2"
							maxlength={descriptionMaxLength}
							bind:value={settingsDraft.description}
						></textarea>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<div class="ats-check">
								<input
									id="suite-enabled"
									type="checkbox"
									class="ats-switch"
									bind:checked={settingsDraft.enabled}
								/>
								<label class="ats-check-label" for="suite-enabled">{$_('Enabled')}</label>
							</div>
							<span class="ats-help">{$_('A disabled suite cannot be run at all.')}</span>
						</div>
						<div>
							<label class="ats-label" for="suite-timeout">
								{$_('Case timeout (seconds)')} <span class="text-danger">*</span>
							</label>
							<input
								id="suite-timeout"
								type="number"
								min="1"
								class="ats-input"
								bind:value={settingsDraft.caseTimeoutSeconds}
							/>
						</div>
						<div>
							<span class="ats-label">{$_('Judge provider')}</span>
							<Select
								tag={'agent-test-judge-provider'}
								placeholder={$_('Not configured')}
								selectedValues={settingsDraft.judgeProvider ? [settingsDraft.judgeProvider] : []}
								options={judgeProviderOptions}
								onselect={e => changeJudgeProvider(e)}
							/>
						</div>
						<div>
							<span class="ats-label">{$_('Judge model')}</span>
							<Select
								tag={'agent-test-judge-model'}
								placeholder={$_('Not configured')}
								disabled={judgeModels.length === 0}
								selectedValues={settingsDraft.judgeModel ? [settingsDraft.judgeModel] : []}
								options={judgeModelOptions}
								onselect={e => changeJudgeModel(e)}
							/>
							{#if settingsDraft.judgeProvider && judgeModels.length === 0}
								<span class="ats-help text-warning">
									{$_('This provider has no chat-capable model registered.')}
								</span>
							{/if}
						</div>
					</div>
					<div class="ats-alert ats-tone-info mt-4" role="alert">
						{$_('llmJudge assertions always fail in P1 regardless of these two fields.')}
					</div>
					<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label class="ats-label" for="suite-extra-allowed">{$_('Extra allowed functions')}</label>
							<textarea
								id="suite-extra-allowed"
								class="ats-textarea ats-textarea-code"
								rows="4"
								bind:value={settingsDraft.extraAllowedFunctions}
							></textarea>
							<span class="ats-help">
								{$_('One function name per line. These run for real during a test -- only list functions with no side effects.')}
							</span>
						</div>
						<div>
							<label class="ats-label" for="suite-force-blocked">{$_('Force blocked functions')}</label>
							<textarea
								id="suite-force-blocked"
								class="ats-textarea ats-textarea-code"
								rows="4"
								bind:value={settingsDraft.forceBlockedFunctions}
							></textarea>
							<span class="ats-help">{$_('One per line. Blocked even if allow-listed elsewhere.')}</span>
						</div>
					</div>
				</form>
			</div>
			<div class="ats-modal-footer">
				<button
					type="button"
					class="ats-btn ats-btn-secondary"
					disabled={isSaving}
					onclick={() => closeSettings()}
				>
					{$_('Cancel')}
				</button>
				<button
					type="button"
					class="ats-btn ats-btn-primary"
					disabled={!canSaveSettings || isSaving}
					onclick={(e) => submitSettings(e)}
				>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin"></i>
					{/if}
					{$_('Save')}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

{#if isRunModalOpen}
<div
	class="ats-modal"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={(e) => handleBackdropClick(e, closeRunModal)}
	onkeydown={(e) => handleModalKeydown(e, closeRunModal)}
>
	<div class="ats-modal-dialog ats-modal-lg" role="document">
		<div class="ats-modal-content">
			<div class="ats-modal-header">
				<h5 class="ats-modal-title">{$_('Run this suite?')}</h5>
				<button
					type="button"
					class="ats-modal-close"
					aria-label={$_('Close')}
					onclick={() => closeRunModal()}
				>
					<i class="mdi mdi-close"></i>
				</button>
			</div>
			<div class="ats-modal-body">
				<p class="mb-4 text-sm">
					{runPartial ? $_('Running the selected cases') : $_('Running every enabled case')}:
					<span class="font-semibold">{plannedCaseCount}</span>
				</p>

				<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
					<span class="text-sm font-semibold">{$_('Models')}</span>
					{#if selectedRunModels.length > 0}
						<button
							type="button"
							class="ats-btn ats-btn-sm ats-btn-soft ats-tone-secondary"
							onclick={() => (selectedRunModels = [])}
						>
							{$_("Use the agent's own model")}
						</button>
					{/if}
				</div>
				<p class="mb-3 text-xs text-muted">
					{$_('Pick nothing to run once on whatever model each agent is configured with. Pick two or more to run the whole set once per model and compare them side by side.')}
				</p>

				{#if runModelCatalogue.length === 0}
					<div class="ats-alert ats-tone-warning" role="alert">
						{$_("No chat-capable model is registered, so this run will use the agent's own configuration.")}
					</div>
				{:else}
					<div
						class="ats-table-wrap scrollbar-on-hover mb-4 p-2"
						style="max-height: 260px; overflow-y: auto;"
					>
						{#each runModelCatalogue as group (group.provider)}
							<div class="mb-2">
								<div class="mb-1 text-xs font-semibold text-muted">{group.provider}</div>
								{#each group.models as model (model)}
									<div class="ats-check py-0.5">
										<input
											id={`run-model-${group.provider}-${model}`}
											type="checkbox"
											class="ats-check-input"
											checked={isRunModelSelected(group.provider, model)}
											onchange={() => toggleRunModel(group.provider, model)}
										/>
										<label
											class="ats-check-label font-code"
											for={`run-model-${group.provider}-${model}`}
										>
											{model}
										</label>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				{#if runPartial && selectedDisabledCount > 0}
					<div class="ats-alert ats-tone-warning mb-3" role="alert">
						{$_('{count} of the selected case(s) are disabled and will be skipped.', { values: { count: selectedDisabledCount } })}
					</div>
				{/if}

				{#if plannedCaseCount === 0}
					<div class="ats-alert ats-tone-danger" role="alert">
						{$_('Nothing here can run -- every case you picked is disabled. Enable at least one first.')}
					</div>
				{:else}
					<div class="ats-alert ats-tone-warning" role="alert">
						{$_('{count} execution(s) will run against live models. This costs real tokens and is not rate limited.', { values: { count: plannedExecutionCount } })}
					</div>
				{/if}
			</div>
			<div class="ats-modal-footer">
				<button
					type="button"
					class="ats-btn ats-btn-secondary"
					disabled={isTriggering}
					onclick={() => closeRunModal()}
				>
					{$_('Cancel')}
				</button>
				<button
					type="button"
					class="ats-btn ats-btn-primary"
					disabled={isTriggering || plannedCaseCount === 0}
					onclick={() => submitRun()}
				>
					{#if isTriggering}
						<i class="mdi mdi-loading mdi-spin"></i>
					{/if}
					{$_('Yes, run it')}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

{#if isRecordOpen}
<div
	class="ats-modal"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={(e) => handleBackdropClick(e, closeRecord)}
	onkeydown={(e) => handleModalKeydown(e, closeRecord)}
>
	<div class="ats-modal-dialog" role="document">
		<div class="ats-modal-content">
			<div class="ats-modal-header">
				<h5 class="ats-modal-title">{$_('Record a Draft Case')}</h5>
				<button
					type="button"
					class="ats-modal-close"
					aria-label={$_('Close')}
					onclick={() => closeRecord()}
				>
					<i class="mdi mdi-close"></i>
				</button>
			</div>
			<div class="ats-modal-body">
				<form onsubmit={(e) => submitRecord(e)}>
					<div class="mb-4">
						<label class="ats-label" for="record-conversation-id">
							{$_('Conversation id')} <span class="text-danger">*</span>
						</label>
						<input
							id="record-conversation-id"
							type="text"
							class="ats-input font-code"
							bind:value={recordConversationId}
							placeholder={$_('An existing conversation with at least one tool call')}
						/>
					</div>
					<div class="mb-4">
						<span class="ats-label">{$_('AI extraction model')}</span>
						<Select
							tag={'agent-test-record-model'}
							placeholder={$_('Do not use AI (one case for the whole conversation)')}
							selectedValues={recordModel ? [`${recordModel.provider}/${recordModel.model}`] : []}
							options={recordModelOptions}
							onselect={e => changeRecordModel(e)}
						/>
						<span class="ats-help">
							{$_('With a model picked, the conversation is split into one case per scenario it covers. The model only decides where to split and what to name each case -- mocks, assertions and state still come verbatim from the conversation.')}
						</span>
					</div>

					<div class="ats-alert ats-tone-warning flex-col items-start gap-2" role="alert">
						<span>
							{$_('Recording copies the raw conversation into the test store, including any phone numbers, addresses and tenant names it contains. The draft lands disabled -- review it before enabling.')}
						</span>
						{#if recordModel}
							<span>
								{$_('AI extraction additionally sends the user messages and tool names to {provider}. Tool arguments and results are not sent.', { values: { provider: recordModel.provider } })}
							</span>
						{/if}
					</div>
				</form>
			</div>
			<div class="ats-modal-footer">
				<button
					type="button"
					class="ats-btn ats-btn-secondary"
					disabled={isSaving}
					onclick={() => closeRecord()}
				>
					{$_('Cancel')}
				</button>
				<button
					type="button"
					class="ats-btn ats-btn-primary"
					disabled={!canRecord || isSaving}
					onclick={(e) => submitRecord(e)}
				>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin"></i>
					{/if}
					{$_('Record')}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}
