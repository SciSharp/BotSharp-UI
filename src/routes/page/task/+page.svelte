<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Swal from 'sweetalert2';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
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

	let isLoading = false;
	let isComplete = false;
	let successText = "Update completed!";

    /** @type {import('$commonTypes').PagedItems<import('$agentTypes').AgentTaskModel>} */
    let tasks = { count: 0, items: [] };

	/** @type {import('$agentTypes').AgentTaskFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

    /** @type {import('$agentTypes').AgentTaskFilter} */
    let filter = { ... initFilter };

	/** @type {import('$commonTypes').Pagination} */
	let pager = filter.pager;

	/** @type {import('$agentTypes').AgentTaskSearchOption} */
	let searchOption = {
		agentId: null,
		status: null
	};

	const statusOptions = Object.entries(AgentTaskStatus).map(([k, v]) => (
		{ key: k, value: v }
	));

    onMount(async () => {
		isLoading = true;
		await getPagedAgentTasks();
		isLoading = false;

		const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			const scrollbar = OverlayScrollbars(item, options);
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

	/** @param {any} e */
	function onTaskSaved(e) {
		const task = e.detail.task;
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

	

	/** @param {any} e */
	function onTaskDeleted(e) {
		const task = e.detail.task;
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

	/** @param {string} taskId */
    function handleTaskDeletion(taskId) {
        /*deleteConversation(conversationId).then(async () => {
			isLoading = false;
			isComplete = true;
			setTimeout(() => {
				isComplete = false;
			}, duration);
			await reloadConversations();
		}).catch(err => {
			isLoading = false;
			isComplete = false;
			isError = true;
			setTimeout(() => {
				isError = false;
			}, duration);
		});*/
    }
</script>

<HeadTitle title="{$_('Task List')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Task')}" />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
/>

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('Task List')}</h5>
					<div class="flex-shrink-0">
						<!-- <Link class="btn btn-light" on:click={(e) => searchTasks(e)}><i class="mdi mdi-magnify" /></Link> -->
						<Dropdown class="dropdown d-inline-block">
							<DropdownToggle type="menu" class="btn" id="dropdownMenuButton1">
								<i class="mdi mdi-dots-vertical" /></DropdownToggle
							>
							<DropdownMenu>
								<DropdownItem>{$_('Action')}</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>
			</CardBody>
			<CardBody class="border-bottom">
				<Row class="g-3">
					<Col xxl="5" lg="5">
						<Input
							type="search"
							class="form-control"
							id="searchTableList"
							placeholder="{$_('Search for ...')}"
						/>
					</Col>
					<Col xxl="5" lg="5">
						<select class="form-select" id="idStatus" value={searchOption.status} on:change={e => changeOption(e, 'status')}>
							<option value={null}>{$_('Select Status')}</option>
							{#each statusOptions as op}
								<option value={`${op.value}`} selected={op.value === searchOption.status}>{$_(`${op.key}`)}</option>
							{/each}
						</select>
					</Col>
					<Col xxl="2" lg="2">
						<Button
							class="btn-soft-secondary w-100"
							type="button"
							color="secondary"
							on:click={e => searchTasks(e)}
						>
							<i class="mdi mdi-filter-outline align-middle" /> {$_('Filter')}
						</Button>
					</Col>
				</Row>
			</CardBody>
			<CardBody>
				<div class="table-responsive">
					<Table class="align-middle nowrap" bordered>
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
									on:save={e => onTaskSaved(e)}
									on:delete={e => onTaskDeleted(e)}
								/>
							{/each}
						</tbody>
					</Table>
				</div>
				<TablePagination pagination={pager} pageTo={pg => pageTo(pg)} />
			</CardBody>
		</Card>
	</Col>
</Row>