<script>
	import { onDestroy, onMount } from 'svelte';
	import { Button, Col, Row } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import CardAgent from './card-agent.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
  	import { createAgent, getAgents } from '$lib/services/agent-service.js';
  	import { myInfo } from '$lib/services/auth-service';
	import PlainPagination from '$lib/common/PlainPagination.svelte';
	import { _ } from 'svelte-i18n'
	import { goto } from '$app/navigation';
	import Swal from 'sweetalert2';
	import { AgentType, GlobalEvent, UserPermission } from '$lib/helpers/enums';
	import { ADMIN_ROLES } from '$lib/helpers/constants';
	import { globalEventStore } from '$lib/helpers/store';
	import MultiSelect from '$lib/common/MultiSelect.svelte';
	
	
  	const firstPage = 1;
	const pageSize = 12;

	/** @type {boolean} */
    let isLoading = false;

	/** @type {import('$commonTypes').PagedItems<import('$agentTypes').AgentModel>} */
  	let agents = { items: [], count: 0 };

	/** @type {import('$agentTypes').AgentFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

	/** @type {import('$agentTypes').AgentFilter} */
	let filter = { ... initFilter };

	/** @type {import('$commonTypes').Pagination} */
	let pager = filter.pager;

	/** @type {import('$userTypes').UserModel} */
	let user;

	/** @type {any} */
	let unsubscriber;

	let agentTypeOptions = Object.entries(AgentType).map(([k, v]) => (
		{ key: k, value: v }
	));

	/** @type {string[]} */
	let selectedAgentTypes = [];

	onMount(async () => {
		user = await myInfo();
		getPagedAgents();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			filter = {
				pager: initFilter.pager,
				types: selectedAgentTypes?.length > 0 ? selectedAgentTypes : null,
				similarName: event.payload || null
			};
			getPagedAgents();
		});
	});

	onDestroy(() => {
		unsubscriber?.();
	});

  	function getPagedAgents() {
		isLoading = true;
    	getAgents(filter, true).then(data => {
			agents = data;
		}).catch(() => {
			agents = { items: [], count: 0 };
		}).finally(() => {
			refresh();
			isLoading = false;
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
		refreshPager(agents.count, filter.pager.page, filter.pager.size);
	}

	function refreshAgents() {
		agents = {
			items: agents?.items?.map(t => { return { ...t }; }) || [],
			count: agents?.count || 0
		};
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, page = firstPage, pageCount = pageSize) {
		pager = {
			page: page,
			size: pageCount || 0,
			count: totalItemsCount || 0
		};
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

	
	/**
	 * @param {any} e
	 */
	function selectAgentTypeOption(e) {
		// @ts-ignore
		selectedAgentTypes = e.detail.selecteds?.map(x => x.value) || [];
	}

	function searchAgents() {
		filter = {
			...filter,
			types: selectedAgentTypes?.length > 0 ? selectedAgentTypes : null,
			pager: initFilter.pager
		};
		getPagedAgents();
	}
</script>

<HeadTitle title="{$_('List')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('List')}" />
<LoadingToComplete isLoading={isLoading} />

<div class="agents-header-container mb-4">
	<div>
		{#if !!user && (ADMIN_ROLES.includes(user.role || '') || !!user.permissions?.includes(UserPermission.CreateAgent))}
		<Button color="primary" on:click={() => createNewAgent()}>
			<i class="bx bx-copy" /> {$_('New Agent')}
		</Button>
		{/if}
	</div>
	<div class="agent-filter">
		<MultiSelect
			tag={'agent-label-select'}
			placeholder={'Select agent labels'}
			selectedText={'labels'}
			options={[]}
			on:select={e => {}}
		/>
		<MultiSelect
			tag={'agent-type-select'}
			placeholder={'Select agent types'}
			selectedText={'types'}
			options={agentTypeOptions}
			on:select={e => selectAgentTypeOption(e)}
		/>
		<Button
			class="btn btn-light"
			on:click={(e) => searchAgents()}
		>
			<i class="mdi mdi-magnify" />
		</Button>
	</div>
</div>


<Row>
	<CardAgent agents={agents.items} />
</Row>

<PlainPagination pagination={pager} pageTo={pn => pageTo(pn)} />