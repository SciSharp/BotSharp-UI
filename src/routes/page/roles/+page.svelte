<script>
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import moment from 'moment';
	import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';
	import { getRoleOptions, getRoles, updateRole } from '$lib/services/role-service';
	import RoleItem from './role-item.svelte';

	const duration = 3000;

	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let successText = 'Role has been updated!';
	let errorText = 'Failed to update role!';

	/** @type {import('$roleTypes').RoleFilter} */
	let filter = $state({});

	/** @type {import('$roleTypes').RoleModel[]} */
	let roleItems = $state([]);

	/** @type {import('$commonTypes').IdName[]} */
	let agents = $state([]);

	/** @type {string[]} */
	let roleOptions = $state([]);

	/** @type {any} */
	let unsubscriber;

	onMount(async () => {
		init();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			const names = event.payload ? [event.payload] : undefined;
			filter = {
				names: names
			};
			getAllRoles();
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
				getAllRoles().then(() => {
					isLoading = false;
				});
			});
		});
	}

	function getAllRoles() {
		roleItems = [];
		isLoading = true;
		return new Promise((resolve) => {
			getRoles(filter).then(res => {
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

	/** @param {import('$roleTypes').RoleModel[]} roles */
	function refresh(roles) {
		refreshRoles(roles);
	}

	/** @param {import('$roleTypes').RoleModel[]} roles */
	function refreshRoles(roles) {
		roleItems = [ ...roles ];
	}

	/** @param {import('$roleTypes').RoleModel} data */
	function saveRole(data) {
		isLoading = true;
		updateRole(data).then(res => {
			if (res) {
				isLoading = false;
				isComplete = true;
				postUpdate(data);
				setTimeout(() => {
					isComplete = false;
				}, duration);
			} else {
				throw "error when saving role.";
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

	/** @param {import('$roleTypes').RoleModel} data */
	function postUpdate(data) {
		roleItems = roleItems?.map(x => {
			if (x.id === data.id) {
				return { ...data, update_date: moment.utc().toString(), open_detail: true };
			}
			return x;
		}) || [];
	}
</script>


<HeadTitle title={$_('Role List')} />
<Breadcrumb title={$_('Management')} pagetitle={$_('Roles')} />
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
						<i class="mdi mdi-shield-account-outline text-xl"></i>
					</span>
					<div class="grow">
						<h5 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Role List')}</h5>
						<p class="mb-0 text-xs text-muted">{roleItems.length} {roleItems.length === 1 ? 'role' : 'roles'} configured</p>
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<div class="thin-scrollbar overflow-x-auto rounded-lg ring-1 ring-gray-100 dark:ring-gray-700">
					<table class="roles-table w-full border-collapse text-sm">
						<thead class="bg-gray-50 dark:bg-gray-700/50">
							<tr>
								<th scope="col">{$_('Name')}</th>
								<th scope="col" class="role-permission-col">{$_('Permissions')}</th>
								<th scope="col">{$_('Update Date')}</th>
								<th scope="col" class="text-center">{$_('Actions')}</th>
							</tr>
						</thead>
						<tbody>
							{#each roleItems as item, idx (idx)}
								<RoleItem
									item={item}
									agents={agents}
									open={item.open_detail}
									onsave={data => saveRole(data)}
								/>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>

