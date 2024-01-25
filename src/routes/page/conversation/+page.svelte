<script>
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
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { onMount } from 'svelte';
	import Link from 'svelte-link';
    import { getConversations, deleteConversation } from '$lib/services/conversation-service.js';
	import { utcToLocal } from '$lib/helpers/datetime';
	import Swal from 'sweetalert2/dist/sweetalert2.js';
	import "sweetalert2/src/sweetalert2.scss";

	let isLoading = false;
	let isComplete = false;
	let isError = false;
	const duration = 3000;
	const firstPage = 1;
	const pageSize = 10;

    /** @type {import('$types').PagedItems<import('$types').ConversationModel>} */
    let conversations = { count: 0, items: [] };

	/** @type {import('$types').ConversationFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

    /** @type {import('$types').ConversationFilter} */
    let filter = { ... initFilter };

	/** @type {import('$types').Pagination} */
	let pager = filter.pager;

    onMount(async () => {
		await getPagedConversations();
    });

	async function getPagedConversations() {
		conversations = await getConversations(filter);
		refresh();
	}

	function refresh() {
		refreshConversations();
		refreshPager(conversations.count, filter.pager.page, filter.pager.size);
	}

	function refreshConversations() {
		conversations = {
			items: conversations?.items?.map(t => { return { ...t }; }) || [],
			count: conversations?.count || 0
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

		getPagedConversations();
	}


	async function reloadConversations() {
		filter = { ...initFilter };
		conversations = await getConversations(filter);
		refreshPager(conversations.count);
	}

	/** @param {string} conversationId */
    function handleConversationDeletion(conversationId) {
		isLoading = true;
        deleteConversation(conversationId).then(async () => {
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
		});
    }

	/** @param {string} conversationId */
	function openDeleteModal(conversationId) {
		// @ts-ignore
		Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
			customClass: 'delete-modal',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        // @ts-ignore
        }).then((result) => {
            if (result.value) {
				handleConversationDeletion(conversationId);
            }
        });
	}

	/**
	 * @param {any} e
	 */
	function searchConversations(e) {
		e.preventDefault();
		filter = {
			...filter,
			pager: { page: firstPage, size: pageSize, count: 0 }
		};
		getPagedConversations();
	}
</script>

<HeadTitle title="Conversation List" />
<Breadcrumb title="Communication" pagetitle="Conversations" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} isError={isError} />

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">Conversation List</h5>
					<div class="flex-shrink-0">
						<Link class="btn btn-light" on:click={(e) => searchConversations(e)}><i class="mdi mdi-magnify" /></Link>
						<Dropdown class="dropdown d-inline-block">
							<DropdownToggle type="menu" class="btn" id="dropdownMenuButton1">
								<i class="mdi mdi-dots-vertical" /></DropdownToggle
							>
							<DropdownMenu>
								<DropdownItem>Action</DropdownItem>
								<DropdownItem>Another action</DropdownItem>
								<DropdownItem>Something else here</DropdownItem>
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
							placeholder="Search for ..."
						/>
					</Col>
					<Col xxl="2" lg="6">
						<select class="form-select" id="idStatus" bind:value={filter.status}>
							<option value={null}>Status</option>
							<option value="open">Active</option>
							<option value="closed">Completed</option>
						</select>
					</Col>
					<Col xxl="2" lg="4">
						<select class="form-select" id="idType" bind:value={filter.channel}>
							<option value={null}>Select Channel</option>
							<option value="webchat">Live Chat</option>
							<option value="phone">Phone</option>
                            <option value="email">Email</option>
						</select>
					</Col>
					<Col xxl="2" lg="4">
						<Input type="date" class="form-control" />
					</Col>
					<Col xxl="2" lg="4">
						<Button type="button" color="secondary" class="btn-soft-secondary w-100">
							<i class="mdi mdi-filter-outline align-middle" /> Filter
						</Button>
					</Col>
				</Row>
			</CardBody>
			<CardBody>
				<div class="table-responsive">
					<Table class="align-middle nowrap" bordered>
						<thead>
							<tr>
								<th scope="col">Title</th>
								<th scope="col">User Name</th>
								<th scope="col">Role</th>
								<th scope="col">Channel</th>
								<th scope="col">Posted Date</th>
								<th scope="col">Last Date</th>
								<th scope="col">Status</th>
								<th scope="col">Action</th>
							</tr>
						</thead>
						<tbody>
							{#each conversations.items as conv}
							<tr>
								<td scope="row">
									<a href="/page/conversation/{conv.id}">{conv.title}</a></td>
								<td>{conv.user.full_name}</td>
								<td>{conv.user.role}</td>
								<td><span class="badge badge-soft-success">{conv.channel}</span></td>
								<td>{utcToLocal(conv.created_time)}</td>
								<td>{utcToLocal(conv.updated_time)}</td>
								<td><span class="badge bg-success">{conv.status}</span></td>
								<td>
									<ul class="list-unstyled hstack gap-1 mb-0">
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
											<Link href="/page/conversation/{conv.id}" class="btn btn-sm btn-soft-primary">
                                                <i class="mdi mdi-eye-outline" />
                                            </Link>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Chat">
											<Link href="/chat/{conv.agent_id}/{conv.id}" target="_blank" class="btn btn-sm btn-soft-info">
                                                <i class="mdi mdi-chat" />
                                            </Link>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
											<Link href="#" on:click={() => openDeleteModal(conv.id)} class="btn btn-sm btn-soft-danger">
                                                <i class="mdi mdi-delete-outline" />
                                            </Link>
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
