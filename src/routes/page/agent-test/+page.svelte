<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import Swal from 'sweetalert2';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { getAgentOptions } from '$lib/services/agent-service.js';
	import { getSuites, createSuite, deleteSuite } from '$lib/services/agent-test-service.js';
	import { t } from '$lib/helpers/utils/agent-test.js';

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
		// @ts-ignore
		Swal.fire({
			title: t('Are you sure?'),
			text: t('Delete test suite "{name}"? You won\'t be able to revert this!', { name: suite.name }),
			icon: 'warning',
			customClass: 'custom-modal',
			showCancelButton: true,
			cancelButtonText: t('Cancel'),
			confirmButtonText: t('Yes, delete it!')
		}).then((result) => {
			if (result.value) {
				handleDeleteSuite(suite.id);
			}
		});
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

<div class="row">
	<div class="col-lg-12">
		<div class="card">
			<div class="card-body border-bottom">
				<div class="d-flex flex-wrap align-items-center justify-content-between">
					<h5 class="mb-0 card-title">{$_('Test Suites')}</h5>
					<button type="button" class="btn btn-primary" onclick={() => openCreateModal()}>
						<i class="mdi mdi-plus"></i> {$_('New Suite')}
					</button>
				</div>
			</div>
			<div class="card-body border-bottom">
				<div class="row g-3">
					<div class="col-lg-3">
						<Select
							tag={'agent-test-suite-filter'}
							placeholder={$_('All Agents')}
							selectedText={'agent'}
							selectedValues={selectedAgentId ? [selectedAgentId] : []}
							options={agentOptions}
							onselect={e => changeAgentFilter(e)}
						/>
					</div>
					<div class="col-lg-1">
						<button
							type="button"
							class="btn btn-soft-secondary w-100"
							data-bs-toggle="tooltip"
							data-bs-placement="bottom"
							title={$_('Filter')}
							onclick={() => applyAgentFilter()}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="d-none">{$_('Filter')}</span>
						</button>
					</div>
					<div class="col-lg-1">
						<button
							type="button"
							class="btn btn-warning w-100"
							data-bs-toggle="tooltip"
							data-bs-placement="bottom"
							title={$_('Reset')}
							onclick={() => resetAgentFilter()}
						>
							<i class="mdi mdi-restore align-middle"></i>
							<span class="d-none">{$_('Reset')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="card-body">
				{#if loadErrorText}
					<div class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
						<span>{loadErrorText}</span>
						<button type="button" class="btn btn-sm btn-outline-danger" onclick={() => refreshSuites()}>
							<i class="mdi mdi-refresh"></i> {$_('Retry')}
						</button>
					</div>
				{:else if suites.length === 0}
					<div class="text-center py-5">
						<p class="text-muted mb-3">
							{selectedAgentId ? $_('No test suites for this agent yet.') : $_('No test suites yet.')}
						</p>
						<button type="button" class="btn btn-primary" onclick={() => openCreateModal()}>
							<i class="mdi mdi-plus"></i> {$_('New Suite')}
						</button>
					</div>
				{:else}
					<div class="table-responsive thin-scrollbar">
						<table class="table table-bordered align-middle nowrap">
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
										class="clickable"
										role="button"
										tabindex="0"
										onkeydown={() => {}}
										onclick={() => goToSuite(suite.id)}
									>
										<td class="text-primary">{suite.name}</td>
										<td>{agentName(suite.agentId)}</td>
										<td>
											{#if suite.enabled}
												<span class="badge bg-success">{$_('Enabled')}</span>
											{:else}
												<span class="badge bg-danger">{$_('Disabled')}</span>
											{/if}
										</td>
										<td>
											<ul class="list-unstyled hstack gap-1 mb-0">
												<li data-bs-toggle="tooltip" data-bs-placement="top" title={$_('Delete')}>
													<button
														type="button"
														class="btn btn-sm btn-soft-danger"
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
	class="modal show d-block"
	tabindex="-1"
	role="dialog"
	transition:fade={{ duration: 150 }}
	onclick={handleModalBackdropClick}
	onkeydown={handleModalKeydown}
>
	<div class="modal-dialog modal-md" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">{$_('New Test Suite')}</h5>
				<button type="button" class="btn-close" aria-label={$_('Close')} onclick={() => closeCreateModal()}></button>
			</div>
			<div class="modal-body">
				<form onsubmit={(e) => submitCreateSuite(e)}>
					<div class="mb-3">
						<label class="form-label" for="new-suite-agent">{$_('Agent')} <span class="text-danger">*</span></label>
						<Select
							tag={'agent-test-suite-create-agent'}
							placeholder={$_('Select Agent')}
							selectedValues={newSuite.agentId ? [newSuite.agentId] : []}
							options={agentOptions}
							onselect={e => changeNewSuiteAgent(e)}
						/>
					</div>
					<div class="mb-3">
						<label class="form-label" for="new-suite-name">{$_('Name')} <span class="text-danger">*</span></label>
						<input
							id="new-suite-name"
							type="text"
							class="form-control"
							maxlength={nameMaxLength}
							bind:value={newSuite.name}
							placeholder={$_('Enter suite name')}
						/>
					</div>
					<div class="mb-3">
						<label class="form-label" for="new-suite-description">{$_('Description')}</label>
						<textarea
							id="new-suite-description"
							class="form-control"
							rows="3"
							maxlength={descriptionMaxLength}
							bind:value={newSuite.description}
							placeholder={$_('Optional description')}
						></textarea>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button
					type="button"
					class="btn btn-primary"
					disabled={!canCreateSuite || isSaving}
					onclick={(e) => submitCreateSuite(e)}
				>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin me-1"></i>
					{/if}
					{$_('Create')}
				</button>
				<button type="button" class="btn btn-secondary" disabled={isSaving} onclick={() => closeCreateModal()}>
					{$_('Cancel')}
				</button>
			</div>
		</div>
	</div>
</div>
<div class="modal-backdrop fade show" transition:fade={{ duration: 150 }}></div>
{/if}
