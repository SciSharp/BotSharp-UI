<script>
	import { onMount, untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { v4 as uuidv4 } from 'uuid';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import lodash from "lodash";
	import Loader from '$lib/common/spinners/Loader.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { UserAction } from '$lib/helpers/enums';
	import { getUserDetails } from '$lib/services/user-service';

	/**
	 * @type {{
	 *   item: import('$userTypes').UserModel,
	 *   open?: boolean,
	 *   disabled?: boolean,
	 *   agents?: import('$commonTypes').IdName[],
	 *   roleOptions?: string[],
	 *   onsave?: (data: import('$userTypes').UserModel) => void
	 * }}
	 */
	let {
		item,
		open = $bindable(false),
		disabled = false,
		agents = [],
		roleOptions = [],
		onsave
	} = $props();

	/** @type {boolean} */
	let isLoading = $state(false);

	let confirmOpen = $state(false);

	/** @type {import('$userTypes').UserModel} */
	let innerItem = $state(/** @type {import('$userTypes').UserModel} */ ({}));

	/** @type {import('$userTypes').UserAgentInnerAction[]} */
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

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let roleSelectOptions = $derived(roleOptions.map(o => ({ label: o, value: o })));

	$effect(() => {
		// Track only innerActions as a dependency
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
						return {
							key: uuidv4(),
							value: a.value,
							checked: false
						};
					})
				}
			}

			const actions = allActions.map(a => {
				const checked = !!found.actions.find(y => y === a.value) || false;
				return {
					key: uuidv4(),
					value: a.value,
					checked: checked
				};
			});

			return {
				id: found.id,
				agent_id: x.id,
				agent_name: x.name,
				actions: actions
			}
		});

		// @ts-ignore
		innerActions = handledActions.filter(Boolean);
	}

	function toggleUserDetail() {
		open = !open;
		if (open) {
			isLoading = true;
			getUserDetails(item.id).then(res => {
				innerItem = { ...res };
				initAgentActions();
			}).finally(() => {
				isLoading = false;
			});
		}
	}

	/** @param {any} e */
	function changeRole(e) {
		// Select fires `{ detail: { selecteds: [{ label, value }] } }`.
		// Single-select mode → selecteds has 0 or 1 entry.
		const selectedValues = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
		const value = selectedValues.length > 0 ? selectedValues[0] : '';
		innerItem = {
			...innerItem,
			role: value
		};
	}

	/**
	 * @param {any} e
	 * @param {import('$userTypes').UserAgentInnerAction} agentActionItem
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

			return {
				...x,
				actions: actions
			};
		});
	}

	/** @param {string} id */
	function save(id) {
		if (!id) return;
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
			role: lodash.trim(innerItem.role),
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
	text={`Are you sure you want to update user "${item.user_name}"?`}
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
				{item.user_name?.charAt(0) ?? '?'}
			</span>
			<span class="font-medium text-dark dark:text-gray-100">{item.user_name}</span>
		</div>
	</td>
	<td class="text-dark dark:text-gray-100">{item.full_name || '—'}</td>
	<td>
		{#if item.external_id}
			<span class="font-mono text-xs text-muted">{item.external_id}</span>
		{:else}
			<span class="text-muted italic">—</span>
		{/if}
	</td>
	<td class="user-plain-col">
		{#if item.role}
			<span class="inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">{item.role}</span>
		{:else}
			<span class="text-muted italic">—</span>
		{/if}
	</td>
	<td>
		{#if item.type}
			<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">{item.type}</span>
		{:else}
			<span class="text-muted italic">—</span>
		{/if}
	</td>
	<td class="user-permission-col">
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
		<div class="flex justify-start">
			<button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-warning/15 text-warning transition-all cursor-pointer hover:scale-105 hover:bg-warning/25 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={disabled}
				onclick={() => toggleUserDetail()}
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
				<div class="user-detail relative rounded-lg border-l-4 border-primary bg-primary/5 p-5 dark:bg-primary/10">
					<!-- Save button -->
					<div class="edit-btn absolute right-4 top-4">
						<button
							type="button"
							class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-primary-hover"
							title="Save"
							onclick={() => save(item.id)}
						>
							<i class="mdi mdi-content-save-all"></i>
							<span>Save</span>
						</button>
					</div>

					<!-- Basic info -->
					<ul class="basic-info m-0 grid grid-cols-1 gap-x-6 gap-y-3 p-0 sm:grid-cols-2">
						<li class="list-none">
							<div class="wrappable flex flex-wrap items-center gap-2">
								<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
									<i class="mdi mdi-account-outline text-base"></i>
									User name:
								</span>
								<span class="text-sm font-medium text-dark dark:text-gray-100">{item.user_name}</span>
							</div>
						</li>
						{#if item.full_name}
						<li class="list-none">
							<div class="wrappable flex flex-wrap items-center gap-2">
								<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
									<i class="mdi mdi-card-account-details-outline text-base"></i>
									Full name:
								</span>
								<span class="text-sm font-medium text-dark dark:text-gray-100">{item.full_name}</span>
							</div>
						</li>
						{/if}
						{#if item.type}
						<li class="list-none">
							<div class="wrappable flex flex-wrap items-center gap-2">
								<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
									<i class="mdi mdi-tag-outline text-base"></i>
									Type:
								</span>
								<span class="text-sm font-medium text-dark dark:text-gray-100">{item.type}</span>
							</div>
						</li>
						{/if}
						{#if item.source}
						<li class="list-none">
							<div class="wrappable flex flex-wrap items-center gap-2">
								<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
									<i class="mdi mdi-source-fork text-base"></i>
									Source:
								</span>
								<span class="text-sm font-medium text-dark dark:text-gray-100">{item.source}</span>
							</div>
						</li>
						{/if}
						{#if item.role}
						<li class="list-none">
							<div class="wrappable inline-edit flex flex-wrap items-center gap-2">
								<div class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
									<i class="mdi mdi-shield-account-outline text-base"></i>
									Role:
								</div>
								<div class="role-wrapper">
									<Select
										tag={`user-role-select-${item.id}`}
										placeholder={'Select role'}
										containerClasses={'user-role-select'}
										searchMode
										selectedValues={innerItem.role ? [innerItem.role] : []}
										options={roleSelectOptions}
										onselect={e => changeRole(e)}
									/>
								</div>
							</div>
						</li>
						{/if}
					</ul>

					<!-- Permissions -->
					<ul class="m-0 mt-5 list-none p-0">
						<li>
							<div class="user-permission-container flex flex-col gap-2 sm:flex-row sm:items-start">
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
						<div class="user-agent-container mt-5">
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
