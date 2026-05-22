<script>
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import { page } from '$app/state';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import PlainPagination from '$lib/common/shared/PlainPagination.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
  	import { createAgent, getAgentLabels, getAgents, saveAgent } from '$lib/services/agent-service.js';
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

	/** @typedef {{ kind: 'create' } | { kind: 'import-error' }} PendingAction */

	let confirmOpen = $state(false);
	/** @type {PendingAction | null} */
	let pendingAction = $state(null);

	function createNewAgent() {
		pendingAction = { kind: 'create' };
		confirmOpen = true;
	}

	function closeConfirm() {
		confirmOpen = false;
		pendingAction = null;
	}

	async function onConfirm() {
		if (!pendingAction) {
			closeConfirm();
			return;
		}
		const action = pendingAction;
		closeConfirm();
		if (action.kind === 'create') {
			await handleCreateNewAgent();
		}
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

	function importAgent() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = e.target.files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const data = JSON.parse(text);

				const newAgent = {
					name: data.name || 'Imported Agent',
					description: data.description || '',
					instruction: data.instruction || '',
					isPublic: data.is_public ?? true
				};

				// @ts-ignore
				const createdAgent = await createAgent(newAgent);

				// Merge remaining fields and save
				const fullAgent = {
					...data,
					id: createdAgent.id,
					created_datetime: createdAgent.created_datetime,
					updated_datetime: createdAgent.updated_datetime,
					plugin: createdAgent.plugin
				};
				await saveAgent(fullAgent);

				goto(`page/agent/${createdAgent.id}`);
			} catch (err) {
				pendingAction = { kind: 'import-error' };
				confirmOpen = true;
			}
		};
		input.click();
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

<ConfirmModal
	isOpen={confirmOpen}
	icon={pendingAction?.kind === 'import-error' ? 'error' : 'warning'}
	title={pendingAction?.kind === 'import-error' ? 'Error' : 'Are you sure?'}
	text={pendingAction?.kind === 'import-error'
		? 'Failed to import agent. Please check the JSON file.'
		: 'Are you sure you want to create a new agent?'}
	confirmBtnText={pendingAction?.kind === 'import-error' ? 'OK' : 'Yes'}
	cancelBtnText="No"
	showCancelBtn={pendingAction?.kind !== 'import-error'}
	confirmBtnColor={pendingAction?.kind === 'import-error' ? 'danger' : 'primary'}
	confirm={onConfirm}
	cancel={closeConfirm}
	toggleModal={closeConfirm}
/>

<div class="ag-header">
	<div class="ag-header-actions">
		{#if !!user && (ADMIN_ROLES.includes(user.role || '') || !!user.permissions?.includes(UserPermission.CreateAgent))}
		<button type="button" class="ag-btn ag-btn-primary" onclick={() => createNewAgent()}>
			<i class="mdi mdi-content-copy"></i> {$_('New Agent')}
		</button>
		<button type="button" class="ag-btn ag-btn-ghost" onclick={() => importAgent()}>
			<i class="mdi mdi-upload"></i> {$_('Import Agent')}
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




