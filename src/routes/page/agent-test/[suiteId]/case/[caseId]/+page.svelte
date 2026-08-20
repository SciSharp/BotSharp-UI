<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { getSuite, getCase, createCase, updateCase, getMockTargets } from '$lib/services/agent-test-service.js';
	import { ASSERTION_TYPES, validateAssertion, isParsableJson, errorMessage, t } from '$lib/helpers/utils/agent-test.js';

	const duration = 3000;
	const nameMaxLength = 200;

	/** Assertion types as Select options. Constant -- the list never changes at runtime. */
	const ASSERTION_TYPE_OPTIONS = ASSERTION_TYPES.map(name => ({ label: name, value: name }));

	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let successText = $state('');
	let errorText = $state('');

	/** @type {string | null} */
	let loadErrorText = $state(null);

	let suiteId = $derived(page.params.suiteId);
	let caseId = $derived(page.params.caseId);
	let isNew = $derived(caseId === 'new');

	/** @type {import('$agentTestTypes').AgentTestSuite | null} */
	let suite = $state(null);

	/** Function names this agent can actually call, for the mock/assertion pickers. */
	/** @type {string[]} */
	let mockTargets = $state([]);

	let isSaving = $state(false);

	/**
	 * The whole editable case. Every field the backend accepts lives here even
	 * when it has no control (unmockedToolPolicy, sourceConversationId), because
	 * PUT is a full replace -- anything missing from the payload is cleared.
	 * @type {{
	 *   name: string,
	 *   enabled: boolean,
	 *   turns: import('$agentTestTypes').TestTurn[],
	 *   assertions: import('$agentTestTypes').TestAssertion[],
	 *   initialStates: import('$agentTestTypes').TestState[],
	 *   mocks: import('$agentTestTypes').TestToolMock[],
	 *   unmockedToolPolicy: string,
	 *   sourceConversationId: string | null
	 * }}
	 */
	let form = $state({
		name: '',
		enabled: true,
		turns: [],
		assertions: [],
		initialStates: [],
		mocks: [],
		unmockedToolPolicy: 'Block',
		sourceConversationId: null
	});

	/** Blocking problems, recomputed on every keystroke and shown before the user can save. */
	let validationErrors = $derived(collectValidationErrors(form));
	let canSave = $derived(validationErrors.length === 0 && !isSaving);

	onMount(async () => {
		isLoading = true;
		try {
			await loadSuite();
			if (!isNew) {
				await loadCase();
			} else {
				form.turns = [newTurn(0)];
			}
		} finally {
			isLoading = false;
		}
	});

	function loadSuite() {
		loadErrorText = null;
		return getSuite(suiteId).then(res => {
			suite = res;
			return getMockTargets(res.agentId).then(targets => {
				mockTargets = targets || [];
			}).catch(() => {
				// A missing target list only costs autocomplete; the editor still works.
				mockTargets = [];
			});
		}).catch(err => {
			suite = null;
			loadErrorText = errorMessage(err, t('Failed to load the suite this case belongs to.'));
		});
	}

	function loadCase() {
		return getCase(caseId).then(res => {
			form = {
				name: res.name || '',
				enabled: res.enabled,
				turns: (res.turns || []).map((turn, i) => ({
					index: i,
					userMessage: turn.userMessage || '',
					assertions: (turn.assertions || []).map(normalizeAssertion)
				})),
				assertions: (res.assertions || []).map(normalizeAssertion),
				initialStates: (res.initialStates || []).map(s => ({
					key: s.key || '',
					value: s.value || '',
					activeRounds: s.activeRounds ?? -1,
					global: !!s.global
				})),
				mocks: (res.mocks || []).map(m => ({
					functionName: m.functionName || '',
					argsMatchJson: m.argsMatchJson || '',
					callIndex: m.callIndex ?? null,
					resultContent: m.resultContent || '',
					stopCompletion: !!m.stopCompletion,
					stateWrites: (m.stateWrites || []).map(s => ({
						key: s.key || '',
						value: s.value || '',
						activeRounds: s.activeRounds ?? -1,
						global: !!s.global
					}))
				})),
				// Carried through untouched: P1 only accepts Block, and the recorded
				// source id is the only trace back to where a draft came from.
				unmockedToolPolicy: res.unmockedToolPolicy || 'Block',
				sourceConversationId: res.sourceConversationId ?? null
			};
		}).catch(err => {
			loadErrorText = errorMessage(err, t('Failed to load this test case.'));
		});
	}

	/** @param {any} a */
	function normalizeAssertion(a) {
		return {
			type: a?.type || 'outputContains',
			target: a?.target || '',
			expected: a?.expected || '',
			argsMatchJson: a?.argsMatchJson || '',
			minScore: a?.minScore ?? null,
			fatal: !!a?.fatal
		};
	}

	/** @param {number} index */
	function newTurn(index) {
		return { index: index, userMessage: '', assertions: [] };
	}

	function newAssertion() {
		return { type: 'outputContains', target: '', expected: '', argsMatchJson: '', minScore: null, fatal: false };
	}

	function newState() {
		return { key: '', value: '', activeRounds: -1, global: false };
	}

	function newMock() {
		return { functionName: '', argsMatchJson: '', callIndex: null, resultContent: '', stopCompletion: false, stateWrites: [] };
	}

	/**
	 * Turn.index is what the backend uses to order the conversation and to tag
	 * observed tool calls, so it has to stay a dense 0-based sequence after any
	 * add/remove/move -- not just a label.
	 */
	function reindexTurns() {
		form.turns.forEach((turn, i) => { turn.index = i; });
	}

	function addTurn() {
		form.turns = [...form.turns, newTurn(form.turns.length)];
	}

	/** @param {number} i */
	function removeTurn(i) {
		form.turns.splice(i, 1);
		reindexTurns();
	}

	/** @param {number} i @param {number} delta */
	function moveTurn(i, delta) {
		const target = i + delta;
		if (target < 0 || target >= form.turns.length) return;
		const [moved] = form.turns.splice(i, 1);
		form.turns.splice(target, 0, moved);
		reindexTurns();
	}

	/**
	 * @param {{ name: string, turns: any[], assertions: any[], initialStates: any[], mocks: any[] }} value
	 * @returns {string[]}
	 */
	function collectValidationErrors(value) {
		/** @type {string[]} */
		const errors = [];

		if (!value.name?.trim()) {
			errors.push(t('Name is required.'));
		}

		// A case with no turns is accepted by the API but comes back Error at run
		// time ("case has no turns"), so it is worth blocking here instead.
		if (!value.turns?.length) {
			errors.push(t('Add at least one turn -- a case with no turns errors when it runs.'));
		}

		value.turns?.forEach((turn, i) => {
			if (!turn.userMessage?.trim()) {
				errors.push(t('Turn {n}: the user message is empty.', { n: i + 1 }));
			}
			turn.assertions?.forEach((assertion, j) => {
				const error = validateAssertion(assertion);
				if (error) {
					errors.push(t('Turn {n}, assertion {m}: {error}', { n: i + 1, m: j + 1, error }));
				}
			});
		});

		value.assertions?.forEach((assertion, i) => {
			const error = validateAssertion(assertion);
			if (error) {
				errors.push(t('Case assertion {n}: {error}', { n: i + 1, error }));
			}
		});

		value.initialStates?.forEach((state, i) => {
			if (!state.key?.trim()) {
				errors.push(t('Initial state {n}: the key is empty.', { n: i + 1 }));
			}
		});

		value.mocks?.forEach((mock, i) => {
			if (!mock.functionName?.trim()) {
				errors.push(t('Mock {n}: the function name is empty.', { n: i + 1 }));
			}
			if (mock.argsMatchJson?.trim() && !isParsableJson(mock.argsMatchJson)) {
				errors.push(t('Mock {n}: the args match is not valid JSON.', { n: i + 1 }));
			}
			if (mock.callIndex != null && mock.callIndex !== '' && Number(mock.callIndex) < 0) {
				errors.push(t('Mock {n}: the call index is 0-based and cannot be negative.', { n: i + 1 }));
			}
			mock.stateWrites?.forEach((state, j) => {
				if (!state.key?.trim()) {
					errors.push(t('Mock {n}, state write {m}: the key is empty.', { n: i + 1, m: j + 1 }));
				}
			});
		});

		return errors;
	}

	/** Strip the empty-string placeholders the form uses back to the nulls the API expects. */
	function buildPayload() {
		/** @param {any} a */
		const cleanAssertion = (a) => ({
			type: a.type,
			target: a.target?.trim() || null,
			expected: a.expected?.trim() || null,
			argsMatchJson: a.argsMatchJson?.trim() || null,
			minScore: a.minScore === '' || a.minScore == null ? null : Number(a.minScore),
			fatal: !!a.fatal
		});

		/** @param {any} s */
		const cleanState = (s) => ({
			key: s.key.trim(),
			value: s.value ?? '',
			activeRounds: s.activeRounds === '' || s.activeRounds == null ? -1 : Number(s.activeRounds),
			global: !!s.global
		});

		return {
			suiteId: suiteId,
			name: form.name.trim(),
			enabled: form.enabled,
			turns: form.turns.map((turn, i) => ({
				index: i,
				userMessage: turn.userMessage.trim(),
				assertions: (turn.assertions || []).map(cleanAssertion)
			})),
			assertions: form.assertions.map(cleanAssertion),
			initialStates: form.initialStates.map(cleanState),
			mocks: form.mocks.map(m => ({
				functionName: m.functionName.trim(),
				argsMatchJson: m.argsMatchJson?.trim() || null,
				callIndex: m.callIndex === '' || m.callIndex == null ? null : Number(m.callIndex),
				resultContent: m.resultContent ?? '',
				stopCompletion: !!m.stopCompletion,
				stateWrites: (m.stateWrites || []).map(cleanState)
			})),
			unmockedToolPolicy: form.unmockedToolPolicy || 'Block',
			sourceConversationId: form.sourceConversationId
		};
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

	/**
	 * Select offers a "Clear selection" row, but an assertion with no type is one
	 * the backend rejects with nothing on screen to explain why. Ignore the empty
	 * selection and keep whatever type was already set.
	 * @param {any} assertion
	 * @param {any} e
	 */
	function changeAssertionType(assertion, e) {
		const selecteds = e?.detail?.selecteds || [];
		if (selecteds.length > 0) {
			assertion.type = selecteds[0].value;
		}
	}

	/** @param {any} e */
	function submit(e) {
		e?.preventDefault();
		if (!canSave) return;

		isSaving = true;
		const payload = buildPayload();
		const request = isNew ? createCase(payload) : updateCase(caseId, payload);

		request.then(() => {
			notifySuccess(isNew ? t('Test case created!') : t('Test case saved!'));
			goBack();
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to save the test case.')));
		}).finally(() => {
			isSaving = false;
		});
	}

	function goBack() {
		goto(`/page/agent-test/${suiteId}`);
	}
</script>

{#snippet assertionRows(list, idPrefix)}
	{#each list as assertion, i}
		<div class="ats-panel">
			<div class="grid grid-cols-1 gap-3 md:grid-cols-12">
				<div class="md:col-span-3">
					<span class="ats-label">{$_('Type')}</span>
					<Select
						tag={`${idPrefix}-type-${i}`}
						selectedValues={assertion.type ? [assertion.type] : []}
						options={ASSERTION_TYPE_OPTIONS}
						onselect={e => changeAssertionType(assertion, e)}
					/>
					{#if assertion.type === 'llmJudge'}
						<span class="ats-help text-warning">{$_('Always fails in P1.')}</span>
					{/if}
				</div>
				<div class="md:col-span-3">
					<label class="ats-label" for={`${idPrefix}-target-${i}`}>
						{$_('Target')}
						{#if ['toolCalled', 'toolNotCalled', 'stateEquals'].includes(assertion.type)}
							<span class="text-danger">*</span>
						{/if}
					</label>
					<input
						id={`${idPrefix}-target-${i}`}
						type="text"
						class="ats-input font-code"
						list={['toolCalled', 'toolNotCalled'].includes(assertion.type) ? 'agent-test-mock-targets' : undefined}
						placeholder={assertion.type === 'stateEquals' ? $_('state key') : $_('function name')}
						bind:value={assertion.target}
					/>
				</div>
				<div class="md:col-span-4">
					<label class="ats-label" for={`${idPrefix}-expected-${i}`}>
						{$_('Expected')}
						{#if assertion.type !== 'toolCalled' && assertion.type !== 'toolNotCalled'}
							<span class="text-danger">*</span>
						{/if}
					</label>
					<input
						id={`${idPrefix}-expected-${i}`}
						type="text"
						class="ats-input"
						bind:value={assertion.expected}
					/>
				</div>
				<div class="flex items-center justify-between gap-2 md:col-span-2 md:items-end md:pb-1">
					<div class="ats-check">
						<input
							id={`${idPrefix}-fatal-${i}`}
							type="checkbox"
							class="ats-check-input"
							bind:checked={assertion.fatal}
						/>
						<label class="ats-check-label" for={`${idPrefix}-fatal-${i}`}>{$_('Fatal')}</label>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
						aria-label={$_('Remove assertion')}
						onclick={() => list.splice(i, 1)}
					>
						<i class="mdi mdi-delete-outline"></i>
					</button>
				</div>
				{#if assertion.type === 'toolCalled'}
					<div class="md:col-span-12">
						<label class="ats-label" for={`${idPrefix}-args-${i}`}>
							{$_('Args match (JSON subset, optional)')}
						</label>
						<input
							id={`${idPrefix}-args-${i}`}
							type="text"
							class="ats-input font-code"
							placeholder={'{"woNum":"B9897413"}'}
							bind:value={assertion.argsMatchJson}
						/>
					</div>
				{/if}
			</div>
		</div>
	{/each}
{/snippet}

{#snippet stateRows(list, idPrefix)}
	{#each list as state, i}
		<div class="mb-3 grid grid-cols-1 gap-3 md:grid-cols-12">
			<div class="md:col-span-3">
				<label class="ats-label" for={`${idPrefix}-key-${i}`}>
					{$_('Key')} <span class="text-danger">*</span>
				</label>
				<input
					id={`${idPrefix}-key-${i}`}
					type="text"
					class="ats-input font-code"
					bind:value={state.key}
				/>
			</div>
			<div class="md:col-span-4">
				<label class="ats-label" for={`${idPrefix}-value-${i}`}>{$_('Value')}</label>
				<input
					id={`${idPrefix}-value-${i}`}
					type="text"
					class="ats-input font-code"
					bind:value={state.value}
				/>
			</div>
			<div class="md:col-span-2">
				<label class="ats-label" for={`${idPrefix}-rounds-${i}`}>{$_('Active rounds')}</label>
				<input
					id={`${idPrefix}-rounds-${i}`}
					type="number"
					class="ats-input"
					bind:value={state.activeRounds}
				/>
			</div>
			<div class="flex items-center justify-between gap-2 md:col-span-3 md:items-end md:pb-1">
				<div class="ats-check">
					<input
						id={`${idPrefix}-global-${i}`}
						type="checkbox"
						class="ats-check-input"
						bind:checked={state.global}
					/>
					<label class="ats-check-label" for={`${idPrefix}-global-${i}`}>{$_('Global')}</label>
				</div>
				<button
					type="button"
					class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
					aria-label={$_('Remove state')}
					onclick={() => list.splice(i, 1)}
				>
					<i class="mdi mdi-delete-outline"></i>
				</button>
			</div>
		</div>
	{/each}
{/snippet}

<HeadTitle title={$_('Test Case')} />
<Breadcrumb title={$_('Agent Testing')} pagetitle={isNew ? $_('New Test Case') : (form.name || $_('Test Case'))} />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

<datalist id="agent-test-mock-targets">
	{#each mockTargets as target}
		<option value={target}></option>
	{/each}
</datalist>

{#if loadErrorText}
	<div class="flex flex-wrap">
		<div class="w-full">
			<div class="ats-alert ats-tone-danger justify-between" role="alert">
				<span>{loadErrorText}</span>
				<button type="button" class="ats-btn ats-btn-sm ats-btn-secondary" onclick={() => goBack()}>
					{$_('Back to Suite')}
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-file-document-edit-outline"></i>
						</span>
						<h5 class="ats-card-title">{isNew ? $_('New Test Case') : $_('Edit Test Case')}</h5>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" class="ats-btn ats-btn-soft ats-tone-secondary" onclick={() => goBack()}>
							<i class="mdi mdi-arrow-left"></i> {$_('Back')}
						</button>
						<button
							type="button"
							class="ats-btn ats-btn-primary"
							disabled={!canSave}
							onclick={(e) => submit(e)}
						>
							{#if isSaving}
								<i class="mdi mdi-loading mdi-spin"></i>
							{/if}
							{$_('Save')}
						</button>
					</div>
				</div>
			</div>

			{#if validationErrors.length > 0}
				<div class="ats-card-section ats-card-divider">
					<div class="ats-alert ats-tone-warning flex-col items-start gap-1" role="alert">
						<div class="font-semibold">{$_('Fix these before saving:')}</div>
						<ul class="list-disc ps-5">
							{#each validationErrors as error}
								<li>{error}</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}

			<div class="ats-card-section">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-12">
					<div class="md:col-span-8">
						<label class="ats-label" for="case-name">{$_('Name')} <span class="text-danger">*</span></label>
						<input
							id="case-name"
							type="text"
							class="ats-input"
							maxlength={nameMaxLength}
							bind:value={form.name}
						/>
					</div>
					<div class="flex items-center md:col-span-4 md:items-end md:pb-1">
						<div class="ats-check">
							<input
								id="case-enabled"
								type="checkbox"
								class="ats-switch"
								bind:checked={form.enabled}
							/>
							<label class="ats-check-label" for="case-enabled">{$_('Enabled (included in runs)')}</label>
						</div>
					</div>
					{#if form.sourceConversationId}
						<div class="md:col-span-12">
							<div class="ats-alert ats-tone-info" role="alert">
								<span>
									{$_('Recorded from conversation')}
									<code class="font-code">{form.sourceConversationId}</code>.
									{$_('It may contain live customer data -- review before enabling.')}
								</span>
							</div>
						</div>
					{/if}
					<div class="md:col-span-12">
						<p class="mb-0 text-xs text-muted">
							{$_('Unmocked tool policy')}: <code class="font-code">{form.unmockedToolPolicy}</code>.
							{$_('Any tool this case does not mock is blocked instead of executed. P1 has no other option.')}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-comment-text-multiple-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Turns')}</h5>
							<p class="ats-card-subtitle">{form.turns.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => addTurn()}
					>
						<i class="mdi mdi-plus"></i> {$_('Add Turn')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				{#each form.turns as turn, i (i)}
					<div class="ats-panel">
						<div class="mb-3 flex items-center justify-between gap-2">
							<h6 class="ats-panel-title">{$_('Turn')} {i + 1}</h6>
							<div class="flex items-center gap-1">
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-secondary"
									aria-label={$_('Move turn up')}
									disabled={i === 0}
									onclick={() => moveTurn(i, -1)}
								>
									<i class="mdi mdi-arrow-up"></i>
								</button>
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-secondary"
									aria-label={$_('Move turn down')}
									disabled={i === form.turns.length - 1}
									onclick={() => moveTurn(i, 1)}
								>
									<i class="mdi mdi-arrow-down"></i>
								</button>
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
									aria-label={$_('Remove turn')}
									onclick={() => removeTurn(i)}
								>
									<i class="mdi mdi-delete-outline"></i>
								</button>
							</div>
						</div>
						<div class="mb-4">
							<label class="ats-label" for={`turn-message-${i}`}>
								{$_('User message')} <span class="text-danger">*</span>
							</label>
							<textarea
								id={`turn-message-${i}`}
								class="ats-textarea"
								rows="2"
								bind:value={turn.userMessage}
							></textarea>
						</div>
						<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
							<span class="text-xs text-muted">
								{$_('Assertions checked right after this turn')} ({turn.assertions.length})
							</span>
							<button
								type="button"
								class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
								onclick={() => (turn.assertions = [...turn.assertions, newAssertion()])}
							>
								<i class="mdi mdi-plus"></i> {$_('Add Assertion')}
							</button>
						</div>
						{@render assertionRows(turn.assertions, `turn-${i}-assertion`)}
					</div>
				{/each}
				{#if form.turns.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No turns yet. A case needs at least one.')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-check-circle-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Case Assertions')}</h5>
							<p class="ats-card-subtitle">{form.assertions.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => (form.assertions = [...form.assertions, newAssertion()])}
					>
						<i class="mdi mdi-plus"></i> {$_('Add Assertion')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<p class="mb-3 text-xs text-muted">{$_('Evaluated once, after every turn has run.')}</p>
				{@render assertionRows(form.assertions, 'case-assertion')}
				{#if form.assertions.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No case-level assertions.')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-database-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Initial States')}</h5>
							<p class="ats-card-subtitle">{form.initialStates.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => (form.initialStates = [...form.initialStates, newState()])}
					>
						<i class="mdi mdi-plus"></i> {$_('Add State')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<p class="mb-3 text-xs text-muted">
					{$_('Injected before the conversation starts. Active rounds -1 means it never expires.')}
				</p>
				{@render stateRows(form.initialStates, 'initial-state')}
				{#if form.initialStates.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No initial states.')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-tools"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Tool Mocks')}</h5>
							<p class="ats-card-subtitle">{form.mocks.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => (form.mocks = [...form.mocks, newMock()])}
					>
						<i class="mdi mdi-plus"></i> {$_('Add Mock')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<p class="mb-3 text-xs text-muted">
					{$_('Every tool this case does not mock is blocked. If the agent needs a tool to move forward, mock it here.')}
				</p>
				{#each form.mocks as mock, i (i)}
					<div class="ats-panel">
						<div class="mb-3 flex items-center justify-between gap-2">
							<h6 class="ats-panel-title">{$_('Mock')} {i + 1}</h6>
							<button
								type="button"
								class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
								aria-label={$_('Remove mock')}
								onclick={() => form.mocks.splice(i, 1)}
							>
								<i class="mdi mdi-delete-outline"></i>
							</button>
						</div>
						<div class="grid grid-cols-1 gap-3 md:grid-cols-12">
							<div class="md:col-span-6">
								<label class="ats-label" for={`mock-name-${i}`}>
									{$_('Function name')} <span class="text-danger">*</span>
								</label>
								<input
									id={`mock-name-${i}`}
									type="text"
									class="ats-input font-code"
									list="agent-test-mock-targets"
									bind:value={mock.functionName}
								/>
							</div>
							<div class="md:col-span-3">
								<label class="ats-label" for={`mock-call-index-${i}`}>
									{$_('Call index (0-based, optional)')}
								</label>
								<input
									id={`mock-call-index-${i}`}
									type="number"
									min="0"
									class="ats-input"
									bind:value={mock.callIndex}
								/>
							</div>
							<div class="flex items-center md:col-span-3 md:items-end md:pb-1">
								<div class="ats-check">
									<input
										id={`mock-stop-${i}`}
										type="checkbox"
										class="ats-check-input"
										bind:checked={mock.stopCompletion}
									/>
									<label class="ats-check-label" for={`mock-stop-${i}`}>{$_('Stop completion')}</label>
								</div>
							</div>
							<div class="md:col-span-12">
								<label class="ats-label" for={`mock-args-${i}`}>
									{$_('Args match (JSON subset, optional)')}
								</label>
								<input
									id={`mock-args-${i}`}
									type="text"
									class="ats-input font-code"
									placeholder={'{"woNum":"B9897413"}'}
									bind:value={mock.argsMatchJson}
								/>
							</div>
							<div class="md:col-span-12">
								<label class="ats-label" for={`mock-result-${i}`}>{$_('Result content')}</label>
								<textarea
									id={`mock-result-${i}`}
									class="ats-textarea ats-textarea-code"
									rows="3"
									bind:value={mock.resultContent}
								></textarea>
							</div>
							<div class="md:col-span-12">
								<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
									<span class="text-xs text-muted">
										{$_('State written when this mock is hit')} ({mock.stateWrites?.length || 0}).
										{$_('Many tools pass data to later turns through state, not through their return value.')}
									</span>
									<button
										type="button"
										class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
										onclick={() => (mock.stateWrites = [...(mock.stateWrites || []), newState()])}
									>
										<i class="mdi mdi-plus"></i> {$_('Add State Write')}
									</button>
								</div>
								{@render stateRows(mock.stateWrites || [], `mock-${i}-state`)}
							</div>
						</div>
					</div>
				{/each}
				{#if form.mocks.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">
							{$_('No mocks. Every tool call this case makes will be blocked.')}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section flex flex-wrap items-center justify-end gap-2">
				<button type="button" class="ats-btn ats-btn-secondary" onclick={() => goBack()}>
					{$_('Cancel')}
				</button>
				<button
					type="button"
					class="ats-btn ats-btn-primary"
					disabled={!canSave}
					onclick={(e) => submit(e)}
				>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin"></i>
					{/if}
					{$_('Save')}
				</button>
			</div>
		</div>
	</div>
{/if}
