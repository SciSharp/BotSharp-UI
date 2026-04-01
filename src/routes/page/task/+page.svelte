<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Swal from 'sweetalert2';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import TablePagination from '$lib/common/shared/TablePagination.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { getAgentTasks, updateAgentTask } from '$lib/services/task-service';
	import { AgentTaskStatus } from '$lib/helpers/enums';
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
			searchOption = {
				...searchOption,
				status: e.target.value || null
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
		// @ts-ignore
		Swal.fire({
            title: 'Are you sure?',
            text: "You can change it back.",
            icon: 'warning',
			customClass: 'custom-modal',
            showCancelButton: true,
            confirmButtonText: 'Yes, save it!'
        }).then((result) => {
            if (result.value) {
				handleTaskSave(task);
            }
        });
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
		// @ts-ignore
		Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
			customClass: 'custom-modal',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.value) {
				handleTaskDeletion(taskId);
            }
        });
	}

	/** @param {string} _taskId */
    function handleTaskDeletion(_taskId) {}
</script>

<HeadTitle title={$_('Task List')} />
<Breadcrumb title={$_('Agent')} pagetitle={$_('Task')} />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
/>

<div class="row">
	<div class="col-lg-12">
		<div class="card">
			<div class="card-body border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('Task List')}</h5>
					<div class="flex-shrink-0">
						<div class="dropdown d-inline-block">
							<button type="button" class="btn" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false" aria-label="More actions">
								<i class="mdi mdi-dots-vertical"></i>
							</button>
							<ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
								<li><button type="button" class="dropdown-item">{$_('Action')}</button></li>
							</ul>
						</div>
					</div>
				</div>
			</div>
			<div class="card-body border-bottom">
				<div class="row g-3">
					<div class="col-xxl-5 col-lg-5">
						<input
							type="search"
							class="form-control"
							id="searchTableList"
							placeholder={$_('Search for ...')}
						/>
					</div>
					<div class="col-xxl-5 col-lg-5">
						<select class="form-select" id="idStatus" value={searchOption.status} onchange={e => changeOption(e, 'status')}>
							<option value={null}>{$_('Select Status')}</option>
							{#each statusOptions as op}
								<option value={`${op.value}`} selected={op.value === searchOption.status}>{$_(`${op.key}`)}</option>
							{/each}
						</select>
					</div>
					<div class="col-xxl-2 col-lg-2">
						<button
							class="btn btn-soft-secondary w-100"
							type="button"
							onclick={e => searchTasks(e)}
						>
							<i class="mdi mdi-filter-outline align-middle"></i> {$_('Filter')}
						</button>
					</div>
				</div>
			</div>
			<div class="card-body">
				<div class="table-responsive">
					<table class="table table-bordered align-middle nowrap">
						<thead>
							<tr>
								<th scope="col">{$_('Name')}</th>
								<th scope="col">{$_('Description')}</th>
								<th scope="col">{$_('Agent')}</th>
								<th scope="col">{$_('Details')}</th>
								<th scope="col">{$_('Updated Time')}</th>
								<th scope="col">{$_('Enabled')}</th>
								<th scope="col">{$_('Status')}</th>
								<th scope="col">{$_('Action')}</th>
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