<script>
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';
	import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import TablePagination from '$lib/common/shared/TablePagination.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { getUsers, updateUser } from '$lib/services/user-service';
	import UserItem from './user-item.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';
	import { getRoleOptions } from '$lib/services/role-service';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl
	} from '$lib/helpers/utils/common';

	const duration = 3000;
	const firstPage = 1;
	const pageSize = 15;
	const maxLength = 50;

	const initPager = { page: firstPage, size: pageSize };

	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let isPageMounted = $state(false);
	let successText = 'User has been updated!';
	let errorText = 'Failed to update user!';

	/** @type {import('$commonTypes').Pagination} */
	let pager = $state({ ...initPager, count: 0 });

	/** @type {import('$userTypes').UserFilter} */
	let filter = $state({ ...initPager });

	/** @type {import('$userTypes').UserModel[]} */
	let userItems = $state([]);

	/** @type {import('$commonTypes').IdName[]} */
	let agents = $state([]);

	/** @type {string[]} */
	let roleOptions = $state([]);

	/** @type {any} */
	let unsubscriber;

	let searchOption = $state({
		userName: '',
		externalId: '',
		role: '',
		type: '',
	});

	onMount(async () => {
		isPageMounted = true;
		const { pageNum, pageSizeNum } = getPagingQueryParams({
			page: page.url.searchParams.get("page"),
			pageSize: page.url.searchParams.get("pageSize")
		}, { defaultPageSize: pageSize });

		filter = {
			...filter,
			page: pageNum,
			size: pageSizeNum
		};

		init();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			const userNames = event.payload ? [event.payload] : undefined;
			filter = {
				...filter,
				page: firstPage,
				user_names: userNames
			};

			getPagedUsers();
		});
	});

	onDestroy(() => {
		isPageMounted = false;
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
		return new Promise((resolve) => {
			getUsers(filter).then(res => {
				refresh(res);
				resolve(res);
			}).finally(() => {
				isLoading = false;
			});
		});
	}

	function getPagedAgents() {
		return new Promise((resolve) => {
			getAgentOptions().then(res => {
				agents = res?.map(x => {
					return {
						id: x.id,
						name: x.name
					};
				}) || [];
				resolve(agents);
			});
		});
	}

	/** @param {import('$commonTypes').PagedItems<import('$userTypes').UserModel>} users */
	function refresh(users) {
		refreshUsers(users);
		refreshPager(users.count, filter.page);
	}

	/** @param {import('$commonTypes').PagedItems<import('$userTypes').UserModel>} users */
	function refreshUsers(users) {
		userItems = [ ...users.items ];
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, pageNum = firstPage) {
		pager = {
			...filter,
			page: pageNum,
			count: totalItemsCount
		};

		setUrlQueryParams(page.url, [
			{ key: 'page', value: `${pager.page}` },
			{ key: 'pageSize', value: `${pager.size}` }
		], (url) => {
			if (!isPageMounted) return;
			goToUrl(`${url.pathname}${url.search}`);
		});
	}

	function search() {
		prepareFilter();
		getPagedUsers();
	}

	function prepareFilter() {
		const userName = searchOption.userName?.trim();
		const externalId = searchOption.externalId?.trim();
		const role = searchOption.role?.trim();
		const type = searchOption.type?.trim();

		filter = {
			...filter,
			page: firstPage,
			user_names: userName ? [userName] : [],
			external_ids: externalId ? [externalId] : [],
			roles: role ? [role] : [],
			types: type ? [type] : []
		};
	}

	/** @param {number} pageNum */
	function pageTo(pageNum) {
		filter = {
			...filter,
			page: pageNum
		};

		getPagedUsers();
	}

	/** @param {import('$userTypes').UserModel} data */
	function saveUser(data) {
		isLoading = true;
		updateUser(data).then(res => {
			if (res) {
				isLoading = false;
				isComplete = true;
				postUpdate(data);
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
	function postUpdate(data) {
		userItems = userItems?.map(x => {
			if (x.id === data.id) {
				return { ...data, open_detail: true };
			}
			return x;
		}) || [];
	}
</script>


<HeadTitle title={$_('User List')} />
<Breadcrumb title={$_('Management')} pagetitle={$_('Users')} />

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
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('User List')}</h5>
				</div>
			</div>
			<div class="card-body border-bottom">
				<div class="row g-3">
					<div class="col-lg-3">
						<input class="form-control" bind:value={searchOption.userName} maxlength={maxLength} placeholder={'Search user name...'} />
					</div>
					<div class="col-lg-3">
						<input class="form-control" bind:value={searchOption.externalId} maxlength={maxLength} placeholder={'Search external id...'} />
					</div>
					<div class="col-lg-3">
						<input class="form-control" bind:value={searchOption.role} maxlength={maxLength} placeholder={'Search role...'} />
					</div>
					<div class="col-lg-2">
						<input class="form-control" bind:value={searchOption.type} maxlength={maxLength} placeholder={'Search type...'} />
					</div>
					<div class="col-lg-1">
						<button
							type="button"
							class="btn btn-secondary btn-soft-secondary w-100"
							onclick={() => search()}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="d-none">{$_('Filter')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="card-body">
				<div class="table-responsive thin-scrollbar">
					<table class="table table-bordered align-middle nowrap users-table">
						<thead>
							<tr>
								<th scope="col">{$_('User Name')}</th>
								<th scope="col">{$_('Full Name')}</th>
								<th scope="col">{$_('External Id')}</th>
								<th scope="col" class="user-plain-col">{$_('Role')}</th>
								<th scope="col">{$_('Type')}</th>
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
									onsave={data => saveUser(data)}
								/>
							{/each}
						</tbody>
					</table>
				</div>
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</div>
		</div>
	</div>
</div>