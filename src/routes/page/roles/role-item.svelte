<script>
	import { onMount, untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { v4 as uuidv4 } from 'uuid';
	import moment from "moment";
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import Loader from '$lib/common/spinners/Loader.svelte';
	import { UserAction } from '$lib/helpers/enums';
	import { getRoleDetails } from '$lib/services/role-service';

	/**
	 * @type {{
	 *   item: import('$roleTypes').RoleModel,
	 *   open?: boolean,
	 *   disabled?: boolean,
	 *   agents?: import('$commonTypes').IdName[],
	 *   onsave?: (data: import('$roleTypes').RoleModel) => void
	 * }}
	 */
	let {
		item,
		open = $bindable(false),
		disabled = false,
		agents = [],
		onsave
	} = $props();

	/** @type {boolean} */
	let isLoading = $state(false);

	let confirmOpen = $state(false);

	/** @type {import('$roleTypes').RoleModel} */
	let innerItem = $state(/** @type {import('$roleTypes').RoleModel} */ ({}));

	/** @type {import('$roleTypes').RoleAgentInnerAction[]} */
	let innerActions = $state([]);

	let allActions = $state([
		{
			name: UserAction.Edit,
			value: UserAction.Edit,
			checked: false
		},
		{
			name: UserAction.Train,
			value: UserAction.Train,
			checked: false
		},
		{
			name: UserAction.Evaluate,
			value: UserAction.Evaluate,
			checked: false
		},
		{
			name: UserAction.Chat,
			value: UserAction.Chat,
			checked: false
		}
	]);

	let colStyle = $derived(`flex: 0 0 ${allActions.length > 2 ? Math.floor(1 / (allActions.length + 1) * 100) - 1 : 32}%;`);

	$effect(() => {
		const currentInnerActions = innerActions;
		untrack(() => {
			allActions = allActions.map(x => {
				const list = currentInnerActions.flatMap(a => a.actions.filter(y => y.value === x.value));
				x.checked = list.every(a => !!a.checked);
				return { ...x };
			});
		});
	});

	onMount(() => {
		initInnerItem();
		initAgentActions();
	});

	function initInnerItem() {
		innerItem = { ...item };
	}

	function initAgentActions() {
		const agentActions = innerItem.agent_actions || [];
		const handledActions = agents.map(x => {
			const found = agentActions.find(a => a.agent_id === x.id);
			if (!found) {
				return {
					id: null,
					agent_id: x.id,
					agent_name: x.name,
					actions: allActions.map(a => {
						return { key: uuidv4(), value: a.value, checked: false };
					})
				}
			}

			const actions = allActions.map(a => {
				const checked = !!found.actions.find(y => y === a.value) || false;
				return { key: uuidv4(), value: a.value, checked: checked };
			});

			return {
				id: found.id, agent_id: x.id, agent_name: x.name, actions: actions
			}
		});

        // @ts-ignore
		innerActions = handledActions.filter(Boolean);
	}

	function toggleRoleDetail() {
		open = !open;
		if (open) {
			if (item.id != null) {
				isLoading = true;
				getRoleDetails(item.id).then(res => {
					if (res) {
						innerItem = { ...res };
					}
					initAgentActions();
				}).finally(() => {
					isLoading = false;
				});
			}
		}
	}

	/**
	 * @param {any} e
	 * @param {import('$roleTypes').RoleAgentInnerAction} agentActionItem
	 * @param {any} actionItem
	 */
	function checkAction(e, agentActionItem, actionItem) {
		const checked = e.target.checked;
		const found = innerActions.find(x => x.agent_id === agentActionItem.agent_id);
		// @ts-ignore
		const action = found?.actions?.find(x => x.key === actionItem.key);
		if (action) {
			action.checked = checked;
		}
		innerActions = [ ...innerActions ];
	}

	/**
	 * @param {any} e
	 * @param {any} title
	 */
	function checkAll(e, title) {
		const checked = e.target.checked;
		allActions = allActions.map(x => {
			if (x.value === title.value) {
				x.checked = checked;
			}
			return { ...x };
		});

		innerActions = innerActions.map(x => {
			const actions = x.actions.map(a => {
				if (a.value === title.value) {
					a.checked = checked;
				}
				return { ...a };
			});
			return { ...x, actions: actions };
		});
	}

	function save() {
		confirmOpen = true;
	}

	function closeConfirm() {
		confirmOpen = false;
	}

	function doSave() {
		const data = formatUpdatedData();
		closeConfirm();
		onsave?.(data);
	}

	function formatUpdatedData() {
		/** @type {any[]} */
		const list = [];
		innerActions.forEach(x => {
			// @ts-ignore
			const items = x.actions.filter(a => !!a.checked);
			if (x.id || items.length > 0) {
				list.push({
					...x,
					// @ts-ignore
					actions: items.map(i => i.value)
				});
			}
		});

		const updated = {
			...innerItem,
			permissions: innerItem.permissions.filter(x => x?.length > 0),
			agent_actions: list
		};
		innerItem = { ...updated };
		return updated;
	}

	function addPermission() {
		innerItem = {
			...innerItem,
			permissions: [ ...innerItem.permissions, '' ]
		};
	}

	/** @param {number} index */
	function deletePermission(index) {
		const permissions = innerItem.permissions.filter((_, idx) => idx !== index);
		innerItem = {
			...innerItem,
			permissions: permissions
		};
	}
</script>

<ConfirmModal
	isOpen={confirmOpen}
	icon="warning"
	title="Are you sure?"
	text={`Are you sure you want to update role "${item.name}"?`}
	confirmBtnText="Yes"
	cancelBtnText="No"
	confirm={doSave}
	cancel={closeConfirm}
	toggleModal={closeConfirm}
/>

<tr in:fly={{ y: -5, duration: 800 }} class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
	<td>
		<div class="flex items-center gap-3">
			<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
				{item.name?.charAt(0) ?? '?'}
			</span>
			<span class="font-medium text-dark dark:text-gray-100">{item.name}</span>
		</div>
	</td>
	<td class="role-permission-col">
		{#if item.permissions?.length > 0}
			<div class="flex flex-wrap items-center gap-1">
				{#each item.permissions.slice(0, 3) as perm}
					<span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{perm}</span>
				{/each}
				{#if item.permissions.length > 3}
					<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
						+{item.permissions.length - 3} more
					</span>
				{/if}
			</div>
		{:else}
			<span class="text-muted italic">N/A</span>
		{/if}
	</td>
	<td>
		<span class="inline-flex items-center gap-1.5 text-muted">
			<i class="mdi mdi-clock-outline text-base"></i>
			{item.update_date != null ? moment.utc(item.update_date).local().format('MMM D YYYY, hh:mm A') : 'N/A'}
		</span>
	</td>
	<td>
		<div class="flex justify-start">
			<button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-warning/15 text-warning transition-all cursor-pointer hover:scale-105 hover:bg-warning/25 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={disabled}
				onclick={() => toggleRoleDetail()}
				aria-label={open ? 'Collapse' : 'Edit'}
				title={open ? 'Collapse' : 'Edit'}
			>
				<i class="bx {open ? 'bx-chevron-up' : 'bxs-edit'}"></i>
			</button>
		</div>
	</td>
</tr>

{#if open}
	<tr in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
		{#if isLoading}
			<td colspan="12" class="p-6">
				<Loader disableDefaultStyles size={30} spinnerType="doubleBounce" containerStyles={'display: flex; justify-content: center;'} />
			</td>
		{:else}
			<td colspan="12" class="!whitespace-normal !p-3">
				<div class="role-detail relative rounded-lg border-l-4 border-primary bg-primary/5 p-5 dark:bg-primary/10">
					<!-- Save button -->
					<div class="edit-btn absolute right-4 top-4">
						<button
							type="button"
							class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-primary-hover"
							title="Save"
							onclick={() => save()}
						>
							<i class="mdi mdi-content-save-all"></i>
							<span>Save</span>
						</button>
					</div>

					<!-- Name section -->
					<ul class="basic-info m-0 list-none p-0">
						<li>
							<div class="wrappable mb-3 flex items-center gap-2">
								<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
									<i class="mdi mdi-account-key-outline text-base"></i>
									Name:
								</span>
								<span class="text-sm font-medium text-dark dark:text-gray-100">{item.name}</span>
							</div>
						</li>
					</ul>

					<!-- Permissions section -->
					<ul class="m-0 list-none p-0">
						<li>
							<div class="role-permission-container flex flex-col gap-2 sm:flex-row sm:items-start">
								<div class="inline-flex shrink-0 items-center gap-1.5 pt-2 text-sm font-semibold text-primary sm:min-w-[110px]">
									<i class="mdi mdi-key-variant text-base"></i>
									Permissions:
								</div>
								<div class="permission-wrapper flex flex-wrap items-center gap-2">
									{#each innerItem.permissions as _, index}
										<div class="edit-wrapper relative">
											<input
												type="text"
												class="edit-text-box h-8 w-44 rounded-full border border-gray-200 bg-white pl-3 pr-8 text-xs text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
												bind:value={innerItem.permissions[index]}
											/>
											<button
												type="button"
												class="absolute right-1 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-danger transition-colors cursor-pointer hover:bg-danger/10"
												aria-label="Remove permission"
												onclick={() => deletePermission(index)}
											>
												<i class="bx bxs-no-entry"></i>
											</button>
										</div>
									{/each}
									{#if innerItem.permissions?.length < 5}
										<button
											type="button"
											class="list-add inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all cursor-pointer hover:scale-105 hover:bg-primary/20"
											aria-label="Add permission"
											onclick={() => addPermission()}
										>
											<i class="bx bx-list-plus text-lg"></i>
										</button>
									{/if}
								</div>
							</div>
						</li>
					</ul>

					<!-- Agent permissions matrix -->
					{#if innerActions.length > 0}
						<div class="role-agent-container mt-5">
							<div class="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
								<i class="mdi mdi-shield-key-outline text-base"></i>
								Agent Permissions
							</div>
							<div class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
								<!-- Header row -->
								<div class="action-row action-title flex border-b-2 border-primary/40 bg-primary/5 dark:bg-primary/20">
									<div class="action-col action-title-wrapper flex items-center justify-center px-2 py-3 text-xs font-bold uppercase tracking-wider text-dark dark:text-gray-100" style={colStyle}>
										Agent
									</div>
									{#each allActions as title}
										<div class="action-col action-title-wrapper flex flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-bold uppercase tracking-wider text-dark dark:text-gray-100" style={colStyle}>
											<div>{title.name}</div>
											<input
												type="checkbox"
												class="action-checkbox"
												checked={title.checked}
												onchange={e => checkAll(e, title)}
											/>
										</div>
									{/each}
								</div>
								<!-- Body rows -->
								<div class="action-row-wrapper max-h-[300px] overflow-y-auto">
									{#each innerActions as agentActionItem, rowIdx}
										<div class="action-row flex border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40 {rowIdx === 0 ? '!border-t-0' : ''}">
											<div class="action-col flex items-center px-3 py-2 text-sm font-medium text-dark dark:text-gray-100" style={colStyle}>
												{agentActionItem.agent_name}
											</div>
											{#each agentActionItem.actions as actionItem}
												<div class="action-col action-center flex items-center justify-center px-2 py-2" style={colStyle}>
													<input
														type="checkbox"
														class="action-checkbox"
														checked={actionItem.checked}
														onchange={e => checkAction(e, agentActionItem, actionItem)}
													/>
												</div>
											{/each}
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</td>
		{/if}
	</tr>
{/if}
