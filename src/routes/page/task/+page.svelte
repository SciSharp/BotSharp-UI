<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import TablePagination from '$lib/common/shared/TablePagination.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { getAgentTasks, updateAgentTask } from '$lib/services/task-service';
	import { AgentTaskStatus } from '$lib/helpers/enums';
	import { formatNumber } from '$lib/helpers/utils/common';
	import TaskItem from './task-item.svelte';


	const duration = 3000;
	const firstPage = 1;
	const pageSize = 10;

	const options = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

	let isLoading = $state(false);
	let isComplete = $state(false);
	let successText = $state("Update completed!");

    /** @type {import('$commonTypes').PagedItems<import('$agentTypes').AgentTaskModel>} */
    let tasks = $state({ count: 0, items: [] });

	/** @type {import('$agentTypes').AgentTaskFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

    /** @type {import('$agentTypes').AgentTaskFilter} */
    let filter = $state({ ... initFilter });

	/** @type {import('$commonTypes').Pagination} */
	let pager = $state({ page: firstPage, size: pageSize, count: 0 });

	/** @type {import('$agentTypes').AgentTaskSearchOption} */
	let searchOption = $state({
		agentId: null,
		status: null
	});

	const statusOptions = Object.entries(AgentTaskStatus).map(([k, v]) => (
		{ key: k, value: v }
	));

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let statusSelectOptions = $derived(statusOptions.map(op => (
		{ label: $_(op.key), value: `${op.value}` }
	)));

    onMount(async () => {
		isLoading = true;
		await getPagedAgentTasks();
		isLoading = false;

		const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			// @ts-ignore
			OverlayScrollbars(item, options);
		});
    });

	async function getPagedAgentTasks() {
		tasks = await getAgentTasks(filter);
		refresh();
	}

	function refresh() {
		refreshTasks();
		refreshPager(tasks.count, filter.pager.page, filter.pager.size);
	}

	function refreshTasks() {
		tasks = {
			items: tasks?.items?.map(t => { return { ...t }; }) || [],
			count: tasks?.count || 0
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

	/** @param {number} pageNum */
	function pageTo(pageNum) {
		pager = {
			...pager,
			page: pageNum
		};

		filter = {
			...filter,
			pager: pager
		};

		getPagedAgentTasks();
	}

	/**
	 * @param {any} e
	 */
	function searchTasks(e) {
		e.preventDefault();
		filter = {
			...filter,
			pager: { page: firstPage, size: pageSize, count: 0 }
		};
		refreshFilter();
		initFilterPager();
		getPagedAgentTasks();
	}


	function refreshFilter() {
		filter = {
			...filter,
			status: searchOption.status
		};
	}

	function initFilterPager() {
		filter = {
			...filter,
			pager: { page: firstPage, size: pageSize, count: 0 },
		};
	}

	/**
	 * @param {any} e
	 * @param {string} type
	 */
	 function changeOption(e, type) {
		if (type === 'status') {
			// Select fires `{ detail: { selecteds: [{ label, value }] } }`.
			const selectedValues = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
			searchOption = {
				...searchOption,
				status: selectedValues.length > 0 ? selectedValues[0] : null
			};
		}
	}

	/** @param {import('$agentTypes').AgentTaskModel} task */
	function onTaskSaved(task) {
		if (!task) return;

		openSaveModal(task);
	}

	/** @param {import('$agentTypes').AgentTaskModel} task */
	function openSaveModal(task) {
		pendingAction = { kind: 'save', task };
		confirmOpen = true;
	}

	/** @param {import('$agentTypes').AgentTaskModel} task */
    function handleTaskSave(task) {
        updateAgentTask(task.agent_id, task.id, task).then(async () => {
			isLoading = false;
			isComplete = true;
			successText = "Update completed!";
			setTimeout(() => {
				isComplete = false;
				successText = '';
			}, duration);
		}).catch(() => {
			isLoading = false;
			isComplete = false;
			successText = '';
		});
    }



	/** @param {import('$agentTypes').AgentTaskModel} task */
	function onTaskDeleted(task) {
		if (!task) return;

		openDeleteModal(task.id);
	}

	/** @param {string} taskId */
	function openDeleteModal(taskId) {
		pendingAction = { kind: 'delete', taskId };
		confirmOpen = true;
	}

	/** @param {string} _taskId */
    function handleTaskDeletion(_taskId) {}

	/**
	 * @typedef {{ kind: 'save', task: import('$agentTypes').AgentTaskModel }
	 *   | { kind: 'delete', taskId: string }} PendingAction
	 */

	let confirmOpen = $state(false);
	/** @type {PendingAction | null} */
	let pendingAction = $state(null);

	function closeConfirm() {
		confirmOpen = false;
		pendingAction = null;
	}

	function onConfirm() {
		if (!pendingAction) {
			closeConfirm();
			return;
		}
		const action = pendingAction;
		closeConfirm();
		if (action.kind === 'save') {
			handleTaskSave(action.task);
		} else {
			handleTaskDeletion(action.taskId);
		}
	}
</script>

<HeadTitle title={$_('Task List')} />
<Breadcrumb title={$_('Agent')} pagetitle={$_('Task')} />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
/>

<ConfirmModal
	isOpen={confirmOpen}
	icon={pendingAction?.kind === 'delete' ? 'error' : 'warning'}
	title="Are you sure?"
	text={pendingAction?.kind === 'delete'
		? "You won't be able to revert this!"
		: 'You can change it back.'}
	confirmBtnText={pendingAction?.kind === 'delete' ? 'Yes, delete it!' : 'Yes, save it!'}
	cancelBtnText="No"
	confirmBtnColor={pendingAction?.kind === 'delete' ? 'danger' : 'primary'}
	confirm={onConfirm}
	cancel={closeConfirm}
	toggleModal={closeConfirm}
/>

<div class="flex flex-wrap">
	<div class="w-full">
		<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
						<i class="mdi mdi-clipboard-list-outline text-xl"></i>
					</span>
					<div class="grow">
						<h5 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Task List')}</h5>
						<p class="mb-0 text-xs text-muted">{formatNumber(pager.count)} {pager.count === 1 ? 'task' : 'tasks'} total</p>
					</div>
					<details class="relative">
						<summary
							class="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-muted transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 [&::-webkit-details-marker]:hidden"
							aria-label="More actions"
						>
							<i class="mdi mdi-dots-vertical text-lg"></i>
						</summary>
						<ul class="absolute right-0 z-10 mt-1 min-w-[140px] rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
							<li>
								<button
									type="button"
									class="block w-full px-3 py-2 text-left text-sm text-dark transition-colors cursor-pointer hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
								>
									{$_('Action')}
								</button>
							</li>
						</ul>
					</details>
				</div>
			</div>
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
					<div class="lg:col-span-5">
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
								<i class="mdi mdi-magnify text-base leading-none"></i>
							</span>
							<input
								type="search"
								id="searchTableList"
								class="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								placeholder={$_('Search for ...')}
							/>
						</div>
					</div>
					<div class="lg:col-span-5">
						<Select
							tag={'task-status-select'}
							placeholder={$_('Select Status')}
							selectedValues={searchOption.status ? [`${searchOption.status}`] : []}
							options={statusSelectOptions}
							onselect={e => changeOption(e, 'status')}
						>
							{#snippet prefixIcon()}
								<i class="mdi mdi-filter-variant"></i>
							{/snippet}
						</Select>
					</div>
					<div class="lg:col-span-2">
						<button
							type="button"
							class="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-primary-hover"
							onclick={e => searchTasks(e)}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span>{$_('Filter')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<div class="thin-scrollbar overflow-x-auto rounded-lg ring-1 ring-gray-100 dark:ring-gray-700">
					<table class="tasks-table w-full border-collapse text-sm">
						<thead class="bg-gray-50 dark:bg-gray-700/50">
							<tr>
								<th scope="col">{$_('Name')}</th>
								<th scope="col">{$_('Description')}</th>
								<th scope="col">{$_('Agent')}</th>
								<th scope="col">{$_('Details')}</th>
								<th scope="col">{$_('Updated Time')}</th>
								<th scope="col">{$_('Enabled')}</th>
								<th scope="col">{$_('Status')}</th>
								<th scope="col" class="text-start">{$_('Action')}</th>
							</tr>
						</thead>
						<tbody>
							{#each tasks.items as task}
								<TaskItem
									task={task}
									onsave={t => onTaskSaved(t)}
									ondelete={t => onTaskDeleted(t)}
								/>
							{/each}
						</tbody>
					</table>
				</div>
				<TablePagination pagination={pager} pageTo={pg => pageTo(pg)} />
			</div>
		</div>
	</div>
</div>
