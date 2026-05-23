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
		goToUrl,
		formatNumber
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

<div class="flex flex-wrap">
	<div class="w-full">
		<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
						<i class="mdi mdi-account-group-outline text-xl"></i>
					</span>
					<div class="grow">
						<h5 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('User List')}</h5>
						<p class="mb-0 text-xs text-muted">{formatNumber(pager.count)} {pager.count === 1 ? 'user' : 'users'} total</p>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
					<div class="lg:col-span-3">
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
								<i class="mdi mdi-account-outline text-base leading-none"></i>
							</span>
							<input
								class="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								bind:value={searchOption.userName}
								maxlength={maxLength}
								placeholder={'Search user name...'}
							/>
						</div>
					</div>
					<div class="lg:col-span-3">
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
								<i class="mdi mdi-identifier text-base leading-none"></i>
							</span>
							<input
								class="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								bind:value={searchOption.externalId}
								maxlength={maxLength}
								placeholder={'Search external id...'}
							/>
						</div>
					</div>
					<div class="lg:col-span-3">
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
								<i class="mdi mdi-shield-account-outline text-base leading-none"></i>
							</span>
							<input
								class="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								bind:value={searchOption.role}
								maxlength={maxLength}
								placeholder={'Search role...'}
							/>
						</div>
					</div>
					<div class="lg:col-span-2">
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
								<i class="mdi mdi-tag-outline text-base leading-none"></i>
							</span>
							<input
								class="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								bind:value={searchOption.type}
								maxlength={maxLength}
								placeholder={'Search type...'}
							/>
						</div>
					</div>
					<div class="lg:col-span-1">
						<button
							type="button"
							class="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
							onclick={() => search()}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="sr-only">{$_('Filter')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<div class="thin-scrollbar overflow-x-auto rounded-lg ring-1 ring-gray-100 dark:ring-gray-700">
					<table class="users-table w-full border-collapse text-sm">
						<thead class="bg-gray-50 dark:bg-gray-700/50">
							<tr>
								<th scope="col">{$_('User Name')}</th>
								<th scope="col">{$_('Full Name')}</th>
								<th scope="col">{$_('External Id')}</th>
								<th scope="col" class="user-plain-col">{$_('Role')}</th>
								<th scope="col">{$_('Type')}</th>
								<th scope="col" class="user-permission-col">{$_('Permissions')}</th>
								<th scope="col" class="text-center">{$_('Actions')}</th>
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

