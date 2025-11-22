<script>
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import Swal from 'sweetalert2';
	import { page } from '$app/stores';
	import { Button, Col, Row } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import PlainPagination from '$lib/common/PlainPagination.svelte';
	import Select from '$lib/common/Select.svelte';
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
    let isLoading = false;
	let isPageMounted = false;

	/** @type {AbortController | null | undefined} */
	let abortController;

	/** @type {import('$commonTypes').PagedItems<import('$agentTypes').AgentModel>} */
  	let agents = { items: [], count: 0 };

	/** @type {import('$agentTypes').AgentFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

	/** @type {import('$agentTypes').AgentFilter} */
	let filter = { ...initFilter };

	/** @type {import('$commonTypes').Pagination} */
	let pager = filter.pager;

	/** @type {import('$userTypes').UserModel} */
	let user;

	/** @type {any} */
	let unsubscriber;

	/** @type {import('$commonTypes').LabelValuePair[]} */
	const agentTypeOptions = Object.entries(AgentType).map(([k, v]) => (
		{ label: v, value: v }
	)).sort((a, b) => a.label.localeCompare(b.label));

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let agentLabelOptions = [];

	/** @type {string[]} */
	let selectedAgentTypes = [];
	/** @type {string[]} */
	let selectedAgentLabels = [];

	onMount(async () => {
		isPageMounted = true;
		const { pageNum, pageSizeNum } = getPagingQueryParams({
			page: $page.url.searchParams.get("page"),
			pageSize: $page.url.searchParams.get("pageSize")
		}, { defaultPageSize: pageSize });

		const similarName = $page.url.searchParams.get("similarName")?.trim();

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
				types: selectedAgentTypes?.length > 0 ? selectedAgentTypes : null,
				labels: selectedAgentLabels?.length > 0 ? selectedAgentLabels : null,
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

		setUrlQueryParams($page.url, queryParams, (url) => {
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
	function selectAgentTypeOption(e) {
		// @ts-ignore
		selectedAgentTypes = e.detail.selecteds?.map(x => x.label) || [];
	}

	/** @param {any} e */
	function selectAgentLabelOption(e) {
		// @ts-ignore
		selectedAgentLabels = e.detail.selecteds?.map(x => x.label) || [];
	}

	function search() {
		refreshFilter();
		initFilterPager();
		getPagedAgents();
	}

	function reset() {
		selectedAgentTypes = [];
		selectedAgentLabels = [];

		filter = { ...initFilter };
		getPagedAgents();
	}

	function refreshFilter() {
		filter = {
			...filter,
			types: selectedAgentTypes?.length > 0 ? selectedAgentTypes : null,
			labels: selectedAgentLabels?.length > 0 ? selectedAgentLabels : null,
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

<HeadTitle title="{$_('List')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('List')}" />

<LoadingToComplete
	isLoading={isLoading}
/>

<div class="agents-header-container mb-4">
	<div>
		{#if !!user && (ADMIN_ROLES.includes(user.role || '') || !!user.permissions?.includes(UserPermission.CreateAgent))}
		<Button color="primary" on:click={() => createNewAgent()}>
			<i class="mdi mdi-content-copy" /> {$_('New Agent')}
		</Button>
		{/if}
	</div>
	<div class="agent-filter">
		<Select
			tag={'agent-label-select'}
			placeholder={'Select labels'}
			selectedText={'labels'}
			multiSelect
			searchMode
			selectedValues={selectedAgentLabels}
			options={agentLabelOptions}
			on:select={e => selectAgentLabelOption(e)}
		/>
		<Select
			tag={'agent-type-select'}
			placeholder={'Select types'}
			selectedText={'types'}
			multiSelect
			searchMode
			selectedValues={selectedAgentTypes}
			options={agentTypeOptions}
			on:select={e => selectAgentTypeOption(e)}
		/>
		<Button
			class="btn btn-info"
			data-bs-toggle="tooltip"
			data-bs-placement="bottom"
			title="Search"
			on:click={(e) => search()}
		>
			<i class="mdi mdi-magnify" />
		</Button>
		<Button
			class="btn btn-warning"
			data-bs-toggle="tooltip"
			data-bs-placement="bottom"
			title="Reset"
			on:click={(e) => reset()}
		>
			<i class="mdi mdi-restore" />
		</Button>
	</div>
</div>


<Row>
	<CardAgent agents={agents.items} />
</Row>

<PlainPagination pagination={pager} pageTo={pn => pageTo(pn)} />