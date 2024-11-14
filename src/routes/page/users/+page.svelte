<script>
    import { onDestroy, onMount } from 'svelte';
    import {
		Button,
		Card,
		CardBody,
		Col,
		Dropdown,
		DropdownToggle,
		Input,
		Row,
		Table
	} from '@sveltestrap/sveltestrap';
    import { _ } from 'svelte-i18n';
	import HeadTitle from "$lib/common/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import TablePagination from '$lib/common/TablePagination.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { getUsers, updateUser } from '$lib/services/user-service';
	import UserItem from './user-item.svelte';
	import { getAgents } from '$lib/services/agent-service';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';
	import { getRoleOptions } from '$lib/services/role-service';
	
    const duration = 3000;
	const firstPage = 1;
	const pageSize = 15;
	const maxLength = 50;

    const initPager = { page: firstPage, size: pageSize };

    let isLoading = false;
	let isComplete = false;
	let isError = false;
    let successText = 'User has been updated!';
    let errorText = 'Failed to update user!';

    /** @type {import('$commonTypes').Pagination} */    
    let pager = { ...initPager, count: 0 };

    /** @type {import('$userTypes').UserFilter} */
    let filter = { ... initPager };

    /** @type {import('$userTypes').UserModel[]} */
    let userItems = [];

    /** @type {import('$commonTypes').IdName[]} */
	let agents = [];

	/** @type {string[]} */
	let roleOptions = [];

	/** @type {any} */
	let unsubscriber;

    let searchOption = {
		userName: '',
		externalId: '',
		role: '',
		source: '',
	};

    onMount(async () => {
		init();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			const userNames = event.payload ? [event.payload] : undefined;
			filter = {
				page: firstPage,
				size: pageSize,
				user_names: userNames
			};
			getPagedUsers();
		});
    });

	onDestroy(() => {
		unsubscriber?.();
	});

	function init() {
		isLoading = true;
		getRoleOptions().then(roles => {
			roleOptions = [...roles];
			getPagedAgents().then(() => {
				getPagedUsers().then(() => {
					isLoading = false;
				});
			});
		});
	}

    function getPagedUsers() {
        userItems = [];
        isLoading = true;
        return new Promise((resolve, reject) => {
            getUsers(filter).then(res => {
                refresh(res);
                resolve(res);
            }).finally(() => {
                isLoading = false;
            });
        });
	}

    function getPagedAgents() {
        return new Promise((resolve, reject) => {
            getAgents({ pager: { page: 1, size: 100, count: 0 } }).then(res => {
                agents = res?.items?.map(x => {
                    return {
                        id: x.id,
                        name: x.name
                    };
                })?.sort((a, b) => a.name.localeCompare(b.name)) || [];
                resolve(agents);
            });
        });
    }

    /** @param {import('$commonTypes').PagedItems<import('$userTypes').UserModel>} users */
    function refresh(users) {
		refreshUsers(users);
		refreshPager(users.count, filter.page, filter.size);
	}

    /** @param {import('$commonTypes').PagedItems<import('$userTypes').UserModel>} users */
	function refreshUsers(users) {
        userItems = [ ...users.items ];
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

    /** @param {any} e */
    function saveUser(e) {
        const data = e.detail.updatedData;
        isLoading = true;
        updateUser(data).then(res => {
			if (res) {
				isLoading = false;
				isComplete = true;
				postUpdateUser(data);
				setTimeout(() => {
					isComplete = false;
				}, duration);
			} else {
				throw "error when saving user.";
			}
		}).catch(() => {
			isLoading = false;
			isComplete = false;
			isError = true;
			setTimeout(() => {
				isError = false;
			}, duration);
		});
    }

    /** @param {import('$userTypes').UserModel} data */
    function postUpdateUser(data) {
        userItems = userItems?.map(x => {
            if (x.id === data.id) {
                return { ...data, open_detail: true };
            }
            return x;
        }) || [];
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
						<Input bind:value={searchOption.userName} maxlength={maxLength} placeholder={'Search user name...'} />
					</Col>
					<Col lg="3">
						<Input bind:value={searchOption.externalId} maxlength={maxLength} placeholder={'Search external id...'} />
					</Col>					
					<Col lg="3">
						<Input bind:value={searchOption.role} maxlength={maxLength} placeholder={'Search role...'} />
					</Col>
					<Col lg="2">
						<Input bind:value={searchOption.source} maxlength={maxLength} placeholder={'Search source...'} />
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
				<div class="table-responsive thin-scrollbar">
					<Table class="align-middle nowrap users-table" bordered>
						<thead>
							<tr>
								<th scope="col">{$_('User Name')}</th>
								<th scope="col">{$_('Full Name')}</th>
								<th scope="col">{$_('External Id')}</th>
								<th scope="col" class="user-plain-col">{$_('Role')}</th>
								<th scope="col">{$_('Source')}</th>
								<th scope="col" class="user-permission-col">{$_('Permissions')}</th>
								<th scope="col">{$_('')}</th>
							</tr>
						</thead>
						<tbody>
							{#each userItems as item, idx (idx)}
                                <UserItem
                                    item={item}
                                    agents={agents}
									roleOptions={roleOptions}
                                    open={item.open_detail}
                                    on:save={e => saveUser(e)}
                                />
                            {/each}
						</tbody>
					</Table>
				</div>
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</CardBody>
		</Card>
	</Col>
</Row>