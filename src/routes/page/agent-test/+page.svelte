<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { getAgentOptions } from '$lib/services/agent-service.js';
	import { getSuites, createSuite, deleteSuite } from '$lib/services/agent-test-service.js';
	import { errorMessage, t } from '$lib/helpers/utils/agent-test.js';

	const duration = 3000;
	const nameMaxLength = 200;
	const descriptionMaxLength = 2000;

	/** @type {boolean} */
	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let successText = $state('');
	let errorText = $state('');

	/** @type {string | null} */
	let loadErrorText = $state(null);

	/** @type {import('$agentTestTypes').AgentTestSuite[]} */
	let suites = $state([]);

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let agentOptions = $state([]);

	/** @type {Record<string, string>} */
	let agentNameById = $state({});

	/** @type {string | null} */
	let selectedAgentId = $state(null);

	/** @type {boolean} */
	let isCreateModalOpen = $state(false);
	/** @type {boolean} */
	let isSaving = $state(false);

	/** @type {import('$agentTestTypes').AgentTestSuite | null} */
	let suiteToDelete = $state(null);

	/** @type {{ agentId: string, name: string, description: string }} */
	let newSuite = $state({ agentId: '', name: '', description: '' });

	let canCreateSuite = $derived(!!newSuite.agentId && !!newSuite.name?.trim());

	onMount(async () => {
		isLoading = true;
		try {
			await Promise.all([loadAgentOptions(), loadSuites()]);
		} finally {
			isLoading = false;
		}
	});

	function loadAgentOptions() {
		return getAgentOptions().then(res => {
			const list = res || [];
			agentOptions = list.map(x => ({ label: x.name, value: x.id }));
			agentNameById = Object.fromEntries(list.map(x => [x.id, x.name]));
		}).catch(() => {
			agentOptions = [];
			agentNameById = {};
		});
	}

	function loadSuites() {
		loadErrorText = null;
		return getSuites(selectedAgentId).then(res => {
			suites = res || [];
		}).catch(() => {
			suites = [];
			loadErrorText = t('Failed to load test suites. Please try again.');
		});
	}

	function refreshSuites() {
		isLoading = true;
		return loadSuites().finally(() => {
			isLoading = false;
		});
	}

	/** @param {string} agentId */
	function agentName(agentId) {
		return agentNameById[agentId] || agentId;
	}

	/** @param {any} e */
	function changeAgentFilter(e) {
		const selecteds = e?.detail?.selecteds || [];
		selectedAgentId = selecteds.length > 0 ? selecteds[0].value : null;
	}

	function applyAgentFilter() {
		refreshSuites();
	}

	function resetAgentFilter() {
		selectedAgentId = null;
		refreshSuites();
	}

	/** @param {string} suiteId */
	function goToSuite(suiteId) {
		// Absolute: a relative path resolves against the current URL, so the same
		// call from /page/agent-test/ (with the trailing slash) would land on
		// /page/agent-test/page/agent-test/<id>.
		goto(`/page/agent-test/${suiteId}`);
	}

	function openCreateModal() {
		newSuite = { agentId: selectedAgentId || '', name: '', description: '' };
		isCreateModalOpen = true;
	}

	function closeCreateModal() {
		if (isSaving) return;
		isCreateModalOpen = false;
	}

	/** @param {any} e */
	function changeNewSuiteAgent(e) {
		const selecteds = e?.detail?.selecteds || [];
		newSuite.agentId = selecteds.length > 0 ? selecteds[0].value : '';
	}

	/** @param {any} e */
	function submitCreateSuite(e) {
		e?.preventDefault();
		if (!canCreateSuite || isSaving) return;

		isSaving = true;
		createSuite({
			agentId: newSuite.agentId,
			name: newSuite.name.trim(),
			description: newSuite.description?.trim() || null
		}).then(() => {
			isCreateModalOpen = false;
			isComplete = true;
			successText = t('Test suite created!');
			setTimeout(() => {
				isComplete = false;
				successText = '';
			}, duration);
			refreshSuites();
		}).catch(() => {
			isError = true;
			errorText = t('Failed to create test suite.');
			setTimeout(() => {
				isError = false;
				errorText = '';
			}, duration);
		}).finally(() => {
			isSaving = false;
		});
	}

	/** @param {any} e */
	function handleModalBackdropClick(e) {
		if (e.target === e.currentTarget) {
			closeCreateModal();
		}
	}

	/** @param {KeyboardEvent} e */
	function handleModalKeydown(e) {
		if (e.key === 'Escape') {
			closeCreateModal();
		}
	}

	/** @param {import('$agentTestTypes').AgentTestSuite} suite */
	function openDeleteModal(suite) {
		suiteToDelete = suite;
	}

	function closeDeleteModal() {
		suiteToDelete = null;
	}

	function confirmDeleteSuite() {
		const suite = suiteToDelete;
		suiteToDelete = null;
		if (suite) {
			handleDeleteSuite(suite.id);
		}
	}

	/** @param {string} suiteId */
	function handleDeleteSuite(suiteId) {
		isLoading = true;
		deleteSuite(suiteId).then(() => {
			isComplete = true;
			successText = t('Test suite deleted!');
			setTimeout(() => {
				isComplete = false;
				successText = '';
			}, duration);
			return loadSuites();
		}).catch(() => {
			isError = true;
			errorText = t('Failed to delete test suite.');
			setTimeout(() => {
				isError = false;
				errorText = '';
			}, duration);
		}).finally(() => {
			isLoading = false;
		});
	}
</script>

<HeadTitle title={$_('Test Suites')} />
<Breadcrumb title={$_('Agent Testing')} pagetitle={$_('Test Suites')} />
<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

<ConfirmModal
	isOpen={!!suiteToDelete}
	icon="warning"
	title={t('Are you sure?')}
	text={t('Delete test suite "{name}"? You won\'t be able to revert this!', { name: suiteToDelete?.name ?? '' })}
	confirmBtnText={t('Yes, delete it!')}
	cancelBtnText={t('Cancel')}
	confirmBtnColor="danger"
	confirm={confirmDeleteSuite}
	cancel={closeDeleteModal}
	toggleModal={closeDeleteModal}
/>

<div class="flex flex-wrap">
	<div class="w-full">
		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-flask-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Test Suites')}</h5>
							<p class="ats-card-subtitle">
								{suites.length} {suites.length === 1 ? $_('suite') : $_('suites')}
							</p>
						</div>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<!-- Scope planning spans every suite, so it is its own page rather than a panel
						     here. Linked from this card because it is otherwise unreachable: nothing
						     else in the UI points at that route. -->
						<!-- An anchor rather than a button with goto(), so middle-click, open-in-new-tab
						     and screen-reader semantics come for free. Note the route itself is
						     registered in svelte.config.js: prerendering here runs with crawl disabled
						     and an explicit entries list, so a new page is invisible to the build until
						     it is named there. -->
						<a class="ats-btn ats-btn-soft ats-tone-secondary" href="/page/agent-test/scope">
							<i class="mdi mdi-target"></i> {$_('Plan a scope')}
						</a>
						<button type="button" class="ats-btn ats-btn-primary" onclick={() => openCreateModal()}>
							<i class="mdi mdi-plus"></i> {$_('New Suite')}
						</button>
					</div>
				</div>
			</div>
			<div class="ats-card-section ats-card-divider">
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
					<div class="lg:col-span-3">
						<Select
							tag={'agent-test-suite-filter'}
							placeholder={$_('All Agents')}
							searchMode
							searchPlaceholder={$_('Search agents')}
							selectedText={'agent'}
							selectedValues={selectedAgentId ? [selectedAgentId] : []}
							options={agentOptions}
							onselect={e => changeAgentFilter(e)}
						/>
					</div>
					<div class="lg:col-span-1">
						<button
							type="button"
							class="ats-btn ats-tone-secondary ats-btn-soft w-full"
							title={$_('Filter')}
							onclick={() => applyAgentFilter()}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="sr-only">{$_('Filter')}</span>
						</button>
					</div>
					<div class="lg:col-span-1">
						<button
							type="button"
							class="ats-btn ats-btn-warning w-full"
							title={$_('Reset')}
							onclick={() => resetAgentFilter()}
						>
							<i class="mdi mdi-restore align-middle"></i>
							<span class="sr-only">{$_('Reset')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="ats-card-body">
				{#if loadErrorText}
					<div class="ats-alert ats-tone-danger justify-between" role="alert">
						<span>{loadErrorText}</span>
						<button
							type="button"
							class="ats-btn ats-btn-sm ats-btn-outline ats-tone-danger"
							onclick={() => refreshSuites()}
						>
							<i class="mdi mdi-refresh"></i> {$_('Retry')}
						</button>
					</div>
				{:else if suites.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">
							{selectedAgentId ? $_('No test suites for this agent yet.') : $_('No test suites yet.')}
						</p>
						<button type="button" class="ats-btn ats-btn-primary" onclick={() => openCreateModal()}>
							<i class="mdi mdi-plus"></i> {$_('New Suite')}
						</button>
					</div>
				{:else}
					<div class="ats-table-wrap scrollbar-on-hover">
						<table class="ats-table">
							<thead>
								<tr>
									<th scope="col">{$_('Name')}</th>
									<th scope="col">{$_('Agent')}</th>
									<th scope="col">{$_('Enabled')}</th>
									<th scope="col">{$_('Action')}</th>
								</tr>
							</thead>
							<tbody>
								{#each suites as suite (suite.id)}
									<tr
										class="ats-table-row-link"
										role="button"
										tabindex="0"
										onkeydown={() => {}}
										onclick={() => goToSuite(suite.id)}
									>
										<td class="font-medium text-primary">{suite.name}</td>
										<td class="whitespace-nowrap">{agentName(suite.agentId)}</td>
										<td>
											{#if suite.enabled}
												<span class="ats-badge ats-tone-success">{$_('Enabled')}</span>
											{:else}
												<span class="ats-badge ats-tone-danger">{$_('Disabled')}</span>
											{/if}
										</td>
										<td>
											<ul class="ats-actions">
												<li title={$_('Delete')}>
													<button
														type="button"
														class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
														aria-label={$_('Delete')}
														onclick={(e) => { e.stopPropagation(); openDeleteModal(suite); }}
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

{#if isCreateModalOpen}
<div
	class="ats-modal"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={handleModalBackdropClick}
	onkeydown={handleModalKeydown}
>
	<div class="ats-modal-dialog" role="document">
		<div class="ats-modal-content">
			<div class="ats-modal-header">
				<h5 class="ats-modal-title">{$_('New Test Suite')}</h5>
				<button
					type="button"
					class="ats-modal-close"
					aria-label={$_('Close')}
					onclick={() => closeCreateModal()}
				>
					<i class="mdi mdi-close"></i>
				</button>
			</div>
			<div class="ats-modal-body">
				<form onsubmit={(e) => submitCreateSuite(e)}>
					<div class="mb-4">
						<span class="ats-label">{$_('Agent')} <span class="text-danger">*</span></span>
						<Select
							tag={'agent-test-suite-create-agent'}
							placeholder={$_('Select Agent')}
							searchMode
							searchPlaceholder={$_('Search agents')}
							selectedValues={newSuite.agentId ? [newSuite.agentId] : []}
							options={agentOptions}
							onselect={e => changeNewSuiteAgent(e)}
						/>
					</div>
					<div class="mb-4">
						<label class="ats-label" for="new-suite-name">
							{$_('Name')} <span class="text-danger">*</span>
						</label>
						<input
							id="new-suite-name"
							type="text"
							class="ats-input"
							maxlength={nameMaxLength}
							bind:value={newSuite.name}
							placeholder={$_('Enter suite name')}
						/>
					</div>
					<div>
						<label class="ats-label" for="new-suite-description">{$_('Description')}</label>
						<textarea
							id="new-suite-description"
							class="ats-textarea"
							rows="3"
							maxlength={descriptionMaxLength}
							bind:value={newSuite.description}
							placeholder={$_('Optional description')}
						></textarea>
					</div>
				</form>
			</div>
			<div class="ats-modal-footer">
				<button
					type="button"
					class="ats-btn ats-btn-secondary"
					disabled={isSaving}
					onclick={() => closeCreateModal()}
				>
					{$_('Cancel')}
				</button>
				<button
					type="button"
					class="ats-btn ats-btn-primary"
					disabled={!canCreateSuite || isSaving}
					onclick={(e) => submitCreateSuite(e)}
				>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin"></i>
					{/if}
					{$_('Create')}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}
