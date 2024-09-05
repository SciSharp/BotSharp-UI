<script>
	import { _ } from 'svelte-i18n'
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
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import TablePagination from '$lib/common/TablePagination.svelte';
	import { onMount } from 'svelte';
	import Link from 'svelte-link';
    import { getAgentTasks } from '$lib/services/task-service';
	import { utcToLocal } from '$lib/helpers/datetime';
	import Swal from 'sweetalert2';
	import { replaceNewLine } from '$lib/helpers/http';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';

	let isError = false;
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

    onMount(async () => {
		await getPagedAgentTasks();

		const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			const scrollbar = OverlayScrollbars(item, options);
		});
    });

	async function getPagedAgentTasks() {
		tasks = await getAgentTasks( filter);
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


	async function reloadConversations() {
		filter = { ...initFilter };
		tasks = await getAgentTasks(filter);
		refreshPager(tasks.count);
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

	/**
	 * @param {any} e
	 */
	function searchTasks(e) {
		e.preventDefault();
		filter = {
			...filter,
			pager: { page: firstPage, size: pageSize, count: 0 }
		};
		getPagedAgentTasks();
	}
</script>

<HeadTitle title="{$_('Task List')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Task')}" />

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('Task List')}</h5>
					<div class="flex-shrink-0">
						<Link class="btn btn-light" on:click={(e) => searchTasks(e)}><i class="mdi mdi-magnify" /></Link>
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
					<Col xxl="4" lg="6">
						<Input
							type="search"
							class="form-control"
							id="searchTableList"
							placeholder="{$_('Search for ...')}"
						/>
					</Col>
					<Col xxl="2" lg="6">
						<select class="form-select" id="idStatus" bind:value={filter.status}>
							<option value={null}>{$_('Status')}</option>
							<option value="{$_('open')}">{$_('Active')}</option>
							<option value="{$_('closed')}">{$_('Completed')}</option>
						</select>
					</Col>
					<Col xxl="2" lg="4">
						<Button type="button" color="secondary" class="btn-soft-secondary w-100">
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
								<th scope="col">{$_('Updated Date')}</th>
								<th scope="col">{$_('Status')}</th>
								<th scope="col">{$_('Action')}</th>
							</tr>
						</thead>
						<tbody>
							{#each tasks.items as task}
							<tr>
								<td scope="row">
									<a href="page/conversation/{task.id}">{task.name}</a>
								</td>
								<td>{task.description}</td>
								<td>{task.agent_name}</td>
								<td><div style="max-height: 100px;" class="scrollbar">{@html replaceNewLine(task.content)}</div></td>
								<td>{utcToLocal(task.updated_datetime)}</td>
								<td><span class="badge bg-success">{task.enabled ? $_("Enabled") : $_('"Disabled"')}</span></td>
								<td>
									<ul class="list-unstyled hstack gap-1 mb-0">
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="View">
											<a href="page/task/{task.id}?agentId={task.agent_id}" target="_blank" class="btn btn-sm btn-soft-danger">
                                                <i class="mdi mdi-eye-outline" />
                                            </a>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
											<Button on:click={() => openDeleteModal(task.id)} class="btn btn-sm btn-soft-danger">
                                                <i class="mdi mdi-delete-outline" />
                                            </Button>
										</li>
									</ul>
								</td>
							</tr>
							{/each}
						</tbody>
					</Table>
				</div>
				<TablePagination pagination={pager} pageTo={pageTo} />
			</CardBody>
		</Card>
	</Col>
</Row>