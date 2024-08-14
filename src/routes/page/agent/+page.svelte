<script>
	import { onMount } from 'svelte';
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
	import Swal from 'sweetalert2/dist/sweetalert2.js';
    import "sweetalert2/src/sweetalert2.scss";
	
	
  	const firstPage = 1;
	const pageSize = 12;

	/** @type {boolean} */
    let isLoading = false;

	/** @type {import('$types').PagedItems<import('$types').AgentModel>} */
  	let agents = { items: [], count: 0 };

	/** @type {import('$types').AgentFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

	/** @type {import('$types').AgentFilter} */
	let filter = { ... initFilter };

	/** @type {import('$types').Pagination} */
	let pager = filter.pager;

	/** @type {import('$types').UserModel} */
	let user;

	onMount(async () => {
		user = await myInfo();
		getPagedAgents();
	});

  	function getPagedAgents() {
		isLoading = true;
    	getAgents(filter).then(data => {
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
        // @ts-ignore
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
</script>

<HeadTitle title="{$_('List')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('List')}" />
<LoadingToComplete isLoading={isLoading} />

{#if !!user}
<Button class="mb-4" color="primary" on:click={() => createNewAgent()}>
	<i class="bx bx-copy" /> {$_('New Agent')}
</Button>
{/if}

<Row>
	<CardAgent agents={agents.items} />
</Row>

<PlainPagination pagination={pager} pageTo={pageTo} />