<script>
    import { onMount } from 'svelte';
    import {
		Button,
		Card,
		CardBody,
		Col,
		Dropdown,
		DropdownItem,
		DropdownMenu,
		DropdownToggle,
		Input,
		Row,
		Table
	} from '@sveltestrap/sveltestrap';
    import { _ } from 'svelte-i18n';
    import lodash from "lodash";
	import HeadTitle from "$lib/common/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import TablePagination from '$lib/common/TablePagination.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { getUsers } from '$lib/services/user-service';
	import UserItem from './user-item.svelte';
	import { getAgents } from '$lib/services/agent-service';
	
    const duration = 3000;
	const firstPage = 1;
	const pageSize = 5;

    const initPager = { page: firstPage, size: pageSize };

    let isLoading = false;
	let isComplete = false;
	let isError = false;
    let successText = '';
    let errorText = '';

    /** @type {import('$commonTypes').Pagination} */    
    let pager = { ...initPager, count: 0 };

    /** @type {import('$userTypes').UserFilter} */
    let filter = { ... initPager };

    /** @type {import('$commonTypes').PagedItems<import('$userTypes').UserModel>} */
    let users = { count: 0, items: [] };

    /** @type {import('$commonTypes').IdName[]} */
	let agents = [];

    let searchOption = {
		userName: '',
		externalId: '',
		role: '',
		source: '',
	};

    onMount(async () => {
        await getPagedAgents();
		await getPagedUsers();
    });

    async function getPagedUsers() {
		users = await getUsers(filter);
        refresh();
	}

    async function getPagedAgents() {
        const response = await getAgents({ pager: { page: 1, size: 100, count: 0 } });
        agents = response?.items?.map(x => {
                    return {
                        id: x.id,
                        name: x.name
                    };
                })?.sort((a, b) => a.name.localeCompare(b.name)) || [];
    }

    function refresh() {
		refreshUsers();
		refreshPager(users.count, filter.page, filter.size);
	}

	function refreshUsers() {
		users = {
			items: users?.items?.map(t => ({ ...t })) || [],
			count: users?.count || 0
		};
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, page = firstPage, pageCount = pageSize) {
		pager = {
			page: page,
			size: pageCount,
			count: totalItemsCount
		};
	}

    function search() {
        prepareFilter();
        getPagedUsers();
    }

    function prepareFilter() {
        const userName = searchOption.userName?.trim();
        const externalId = searchOption.externalId?.trim();
        const role = searchOption.role?.trim();
        const source = searchOption.source?.trim();

        filter = {
            ...filter,
            page: firstPage,
            user_names: !!userName ? [userName] : [],
            external_ids: !!externalId ? [externalId] : [],
            roles: !!role ? [role] : [],
            sources: !!source ? [source] : []
        };
    }

    /** @param {number} pageNum */
	function pageTo(pageNum) {
		filter = {
			...filter,
			page: pageNum,
            size: pageSize
		};

		getPagedUsers();
	}
</script>


<HeadTitle title="{$_('User List')}" />
<Breadcrumb title="{$_('Management')}" pagetitle="{$_('Users')}" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} isError={isError} successText={successText} errorText={errorText} />


<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('User List')}</h5>
					<div class="flex-shrink-0">
						<Button
							class="btn btn-light"
							on:click={() => {}}
						>
							<i class="mdi mdi-magnify" />
						</Button>
						<Dropdown class="dropdown d-inline-block">
							<DropdownToggle type="menu" class="btn" id="dropdownMenuButton1">
								<i class="mdi mdi-dots-vertical" />
							</DropdownToggle>
						</Dropdown>
					</div>
				</div>
			</CardBody>
			<CardBody class="border-bottom">
				<Row class="g-3">
					<Col lg="3">
						<Input bind:value={searchOption.userName} placeholder={'Search user name...'} />
					</Col>
					<Col lg="3">
						<Input bind:value={searchOption.externalId} placeholder={'Search external id...'} />
					</Col>					
					<Col lg="3">
						<Input bind:value={searchOption.role} placeholder={'Search role...'} />
					</Col>
					<Col lg="2">
						<Input bind:value={searchOption.source} placeholder={'Search source...'} />
					</Col>
					<Col lg="1">
						<Button
							type="button"
							color="secondary"
							class="btn-soft-secondary w-100"
							on:click={(e) => search()}
						>
							<i class="mdi mdi-filter-outline align-middle" />
							<span class="d-none">{$_('Filter')}</span>
						</Button>
					</Col>
				</Row>
			</CardBody>
			<CardBody>
				<div class="table-responsive">
					<Table class="align-middle nowrap users-table" bordered>
						<thead>
							<tr>
								<th scope="col">{$_('User Name')}</th>
								<th scope="col">{$_('Full Name')}</th>
								<th scope="col">{$_('External Id')}</th>
								<th scope="col">{$_('Role')}</th>
								<th scope="col">{$_('Source')}</th>
								<th scope="col" class="user-permission-col">{$_('Permissions')}</th>
								<th scope="col" class="user-agent-col">{$_('Agents')}</th>
								<th scope="col">{$_('')}</th>
							</tr>
						</thead>
						<tbody>
							{#each users.items as item, idx (idx)}
                                <UserItem item={item} agents={agents} />
                            {/each}
						</tbody>
					</Table>
				</div>
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</CardBody>
		</Card>
	</Col>
</Row>