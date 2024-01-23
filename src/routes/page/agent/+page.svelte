<script>
	import { Col, Row } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import CardAgent from './card-agent.svelte';
  	import { getAgents } from '$lib/services/agent-service.js';
  	import { onMount } from 'svelte';
	import PlainPagination from '$lib/common/PlainPagination.svelte';

  	const firstPage = 1;
	const pageSize = 12;

	/** @type {import('$types').PagedItems<import('$types').AgentModel>} */
  	let agents = { items: [], count: 0 };

	/** @type {import('$types').AgentFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 },
		isEvaluator: false
	};

	/** @type {import('$types').AgentFilter} */
	let filter = { ... initFilter };

	/** @type {import('$types').Pagination} */
	let pager = filter.pager;

	onMount(async () => {
		await getPagedAgents();
	});

  	async function getPagedAgents() {
    	agents = await getAgents(filter);
		refresh();
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

<HeadTitle title="Agent List" />
<Breadcrumb title="Agent" pagetitle="List" />

<Row>
	<CardAgent agents={agents.items} />
</Row>

<PlainPagination pagination={pager} pageTo={pageTo} />