<script>
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import Swal from 'sweetalert2';
	import { page } from '$app/state';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import PlainPagination from '$lib/common/shared/PlainPagination.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
  	import { createAgent, getAgentLabels, getAgents } from '$lib/services/agent-service.js';
	import { AgentType, GlobalEvent, UserPermission } from '$lib/helpers/enums';
  	import { myInfo } from '$lib/services/auth-service';
	import { ADMIN_ROLES } from '$lib/helpers/constants';
	import { globalEventStore } from '$lib/helpers/store';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl
	} from '$lib/helpers/utils/common';
	import CardAgent from './card-agent.svelte';


  	const firstPage = 1;
	const pageSize = 12;

	/** @type {boolean} */
    let isLoading = $state(false);
	let isPageMounted = $state(false);

	/** @type {AbortController | null | undefined} */
	let abortController;

	/** @type {import('$commonTypes').PagedItems<import('$agentTypes').AgentModel>} */
  	let agents = $state({ items: [], count: 0 });

	/** @type {import('$agentTypes').AgentFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

	/** @type {import('$agentTypes').AgentFilter} */
	let filter = $state({ ...initFilter });

	// svelte-ignore state_referenced_locally
	/** @type {import('$commonTypes').Pagination} */
	let pager = $state(filter.pager);

	/** @type {import('$userTypes').UserModel | undefined} */
	let user = $state();

	/** @type {any} */
	let unsubscriber;

	/** @type {import('$commonTypes').LabelValuePair[]} */
	const agentTypeOptions = Object.entries(AgentType).map(([_, v]) => (
		{ label: v, value: v }
	)).sort((a, b) => a.label.localeCompare(b.label));

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let agentLabelOptions = $state([]);

	/** @type {{ name: string, types: string[], labels: string[] }} */
	let searchItem = $state({
		name: '',
		types: [],
		labels: []
	});

	onMount(async () => {
		isPageMounted = true;
		const { pageNum, pageSizeNum } = getPagingQueryParams({
			page: page.url.searchParams.get("page"),
			pageSize: page.url.searchParams.get("pageSize")
		}, { defaultPageSize: pageSize });

		const similarName = page.url.searchParams.get("similarName")?.trim();

		filter = {
			...filter,
			pager: {
				...filter.pager,
				page: pageNum,
				size: pageSizeNum
			},
			similarName: similarName
		};

		user = await myInfo();
		getPagedAgents();
		getAgentLabelOptions();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			filter = {
				pager: {
					...filter.pager,
					page: firstPage,
					count: 0
				},
				types: searchItem.types?.length > 0 ? searchItem.types : null,
				labels: searchItem.labels?.length > 0 ? searchItem.labels : null,
				similarName: event.payload?.trim() || null
			};

			getPagedAgents();
		});
	});

	onDestroy(() => {
		isPageMounted = false;
		unsubscriber?.();
	});

  	function getPagedAgents() {
		isLoading = true;

		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		const innerFilter = {
			...filter,
			similarName: filter.similarName ? decodeURIComponent(filter.similarName) : null
		};
    	getAgents(innerFilter, true, abortController?.signal).then(data => {
			agents = data;
		}).catch(() => {
			agents = { items: [], count: 0 };
		}).finally(() => {
			refresh();
			isLoading = false;
		});
	}

	function getAgentLabelOptions() {
		return getAgentLabels(3000).then(res => {
			agentLabelOptions = res?.map(x => ({ label: x, value: x })) || [];
		}).catch(() => {
			agentLabelOptions = [];
		});
	}

	function createNewAgent() {
		// @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to create a new agent?",
            icon: 'warning',
            showCancelButton: true,
			cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        }).then(async (result) => {
            if (result.value) {
                await handleCreateNewAgent();
            }
        });
	}

	async function handleCreateNewAgent() {
		const newAgent = {
			name: 'New Agent',
			description: 'New Agent Description',
			instruction: 'New Agent Instructions',
			isPublic: true
		};
		// @ts-ignore
		const createdAgent = await createAgent(newAgent);
		goto(`page/agent/${createdAgent.id}`);
	}

	function refresh() {
		refreshAgents();
		refreshPager(agents.count, filter.pager.page);
	}

	function refreshAgents() {
		agents = {
			items: agents?.items?.map(t => { return { ...t }; }) || [],
			count: agents?.count || 0
		};
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, pageNum = firstPage) {
		pager = {
			...filter.pager,
			page: pageNum,
			count: totalItemsCount || 0
		};

		const queryParams = [
			{ key: 'page', value: `${pager.page}` },
			{ key: 'pageSize', value: `${pager.size}` }
		];

		if (filter.similarName) {
			queryParams.push({ key: 'similarName', value: encodeURIComponent(filter.similarName) });
		}

		setUrlQueryParams(page.url, queryParams, (url) => {
			if (!isPageMounted) return;
			goToUrl(`${url.pathname}${url.search}`)
		});
	}

	/**
	 * @param {number} pageNum
	 */
	function pageTo(pageNum) {
		pager = {
			...pager,
			page: pageNum
		};

		filter = {
      		...filter,
			pager: pager
		};

		getPagedAgents();
	}

	/** @param {any} e */
	function changeSearchName(e) {
		searchItem.name = e.target.value || '';
		filter = {
			...filter,
			similarName: searchItem.name?.trim()
		};
	}

	/** @param {any} e */
	function searchKeyDown(e) {
		if (e.key === 'Enter' && filter?.similarName) {
			e.preventDefault();
			search();
		}
	}
	
	/** @param {any} e */
	function selectAgentTypeOption(e) {
		// @ts-ignore
		searchItem.types = e.detail.selecteds?.map(x => x.label) || [];
	}

	/** @param {any} e */
	function selectAgentLabelOption(e) {
		// @ts-ignore
		searchItem.labels = e.detail.selecteds?.map(x => x.label) || [];
	}

	function search() {
		refreshFilter();
		initFilterPager();
		getPagedAgents();
	}

	function reset() {
		searchItem = {
			name: '',
			types: [],
			labels: []
		};

		filter = { ...initFilter };
		getPagedAgents();
	}

	function refreshFilter() {
		filter = {
			...filter,
			types: searchItem.types?.length > 0 ? searchItem.types : null,
			labels: searchItem.labels?.length > 0 ? searchItem.labels : null,
			pager: initFilter.pager
		};
	}

	function initFilterPager() {
		filter = {
			...filter,
			pager: { page: firstPage, size: pageSize, count: 0 },
		};
	}
</script>

<HeadTitle title={$_('List')} />
<Breadcrumb title={$_('Agent')} pagetitle={$_('List')} />

<LoadingToComplete
	isLoading={isLoading}
/>

<div class="ag-header">
	<div class="ag-header-actions">
		{#if !!user && (ADMIN_ROLES.includes(user.role || '') || !!user.permissions?.includes(UserPermission.CreateAgent))}
		<button type="button" class="ag-btn ag-btn-primary" onclick={() => createNewAgent()}>
			<i class="mdi mdi-content-copy"></i> {$_('New Agent')}
		</button>
		{/if}
	</div>
	<div class="ag-filter">
		<input
			type="text"
			class="ag-input"
			placeholder="Search by name"
			maxlength={500}
			value={searchItem.name}
			oninput={e => changeSearchName(e)}
			onkeydown={e => searchKeyDown(e)}
		/>
		<Select
			tag={'agent-label-select'}
			placeholder={'Select labels'}
			selectedText={'labels'}
			multiSelect
			searchMode
			selectedValues={searchItem.labels}
			options={agentLabelOptions}
			onselect={e => selectAgentLabelOption(e)}
		/>
		<Select
			tag={'agent-type-select'}
			placeholder={'Select types'}
			selectedText={'types'}
			multiSelect
			searchMode
			selectedValues={searchItem.types}
			options={agentTypeOptions}
			onselect={e => selectAgentTypeOption(e)}
		/>
		<button
			type="button"
			class="ag-btn-icon ag-btn-icon-info"
			data-bs-toggle="tooltip"
			data-bs-placement="bottom"
			title="Search"
			onclick={() => search()}
		>
			<i class="mdi mdi-magnify"></i>
		</button>
		<button
			type="button"
			class="ag-btn-icon ag-btn-icon-warning"
			data-bs-toggle="tooltip"
			data-bs-placement="bottom"
			title="Reset"
			onclick={() => reset()}
		>
			<i class="mdi mdi-restore"></i>
		</button>
	</div>
</div>


<div class="ag-grid">
	<CardAgent agents={agents.items} />
</div>

<div class="ag-pagination">
	<PlainPagination pagination={pager} pageTo={pn => pageTo(pn)} />
</div>

<style>
	/* ===== Header (actions + filter row) ===== */
	.ag-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.9375rem;
		margin-bottom: 1.5rem;
	}
	.ag-header-actions {
		display: flex;
		align-items: center;
	}
	.ag-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		align-items: center;
	}
	@media (max-width: 1024px) {
		.ag-header {
			flex-direction: column;
			justify-content: center;
			gap: 0.75rem;
		}
		.ag-header-actions {
			width: 100%;
			justify-content: center;
		}
		.ag-filter {
			width: 100%;
			flex-direction: column;
			gap: 0.5rem;
		}
		.ag-filter > :global(*) {
			width: 100% !important;
		}
	}

	/* ===== Search input ===== */
	.ag-input {
		height: 2.25rem;
		width: fit-content;
		min-width: 12rem;
		padding: 0 0.75rem;
		border: 1px solid rgb(229 231 235);
		border-radius: 0.5rem;
		background-color: rgb(249 250 251);
		font-size: 0.875rem;
		line-height: 1.4;
		color: rgb(17 24 39);
		font-family: inherit;
		transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
	}
	.ag-input::placeholder {
		color: var(--color-muted);
		opacity: 1;
	}
	.ag-input:hover:not(:focus) {
		border-color: rgb(209 213 219);
	}
	.ag-input:focus {
		outline: 0;
		border-color: var(--color-primary);
		background-color: rgb(255 255 255);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
	}

	/* ===== Primary action button ("New Agent") ===== */
	.ag-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		height: 2.25rem;
		padding: 0 0.95rem;
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1;
		border: 1px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.2s ease;
	}
	.ag-btn:active:not(:disabled) {
		transform: translateY(1px);
	}
	.ag-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	.ag-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.ag-btn-primary {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: rgb(255 255 255);
		box-shadow: 0 1px 2px rgb(15 23 42 / 0.08),
			0 4px 12px -4px color-mix(in srgb, var(--color-primary) 45%, transparent);
	}
	.ag-btn-primary:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}

	/* ===== Icon-only buttons (Search / Reset) ===== */
	.ag-btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2.25rem;
		min-width: 2.25rem;
		padding: 0 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.5rem;
		color: rgb(255 255 255);
		cursor: pointer;
		transition: background-color 0.15s ease, filter 0.15s ease, transform 0.2s ease;
	}
	.ag-btn-icon i {
		font-size: 1.125rem;
		line-height: 1;
	}
	.ag-btn-icon:active {
		transform: translateY(1px);
	}
	.ag-btn-icon-info {
		background-color: var(--color-info);
		border-color: var(--color-info);
	}
	.ag-btn-icon-info:hover {
		filter: brightness(0.95);
	}
	.ag-btn-icon-warning {
		background-color: var(--color-warning);
		border-color: var(--color-warning);
	}
	.ag-btn-icon-warning:hover {
		filter: brightness(0.95);
	}

	/* ===== Card grid ===== */
	.ag-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	/* ===== Pagination spacing ===== */
	.ag-pagination {
		margin-bottom: 1.5rem;
	}
	@media (max-width: 1199.98px) {
		.ag-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 575.98px) {
		.ag-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	/* ===== Dark mode ===== */
	:global(.dark) .ag-input {
		background-color: rgb(31 41 55);
		border-color: rgb(55 65 81);
		color: rgb(229 231 235);
	}
	:global(.dark) .ag-input:focus {
		background-color: rgb(17 24 39);
	}
</style>