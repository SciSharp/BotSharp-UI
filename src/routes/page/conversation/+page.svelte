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
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import Label from '$lib/common/Label.svelte';
	import StateModal from '$lib/common/StateModal.svelte';
	import { conversationSearchOptionStore } from '$lib/helpers/store';
	import { onMount } from 'svelte';
	import Link from 'svelte-link';
	import { getAgents } from '$lib/services/agent-service';
	import { getConversations, deleteConversation } from '$lib/services/conversation-service.js';
	import { utcToLocal } from '$lib/helpers/datetime';
	import Swal from 'sweetalert2/dist/sweetalert2.js';
	import "sweetalert2/src/sweetalert2.scss";
	import lodash from "lodash";
	

	let isLoading = false;
	let isComplete = false;
	let isError = false;
	let isOpenSearchStateModal = false;
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

	/** @type {string[]} */
	let searchStateStrs = [];

	/** @type {import('$types').IdName[]} */
	let agentOptions = [];

	/** 
	 * @type {{agentId: string?, channel: string?, status: string?, taskId: string?, states: import('$types').UserStateDetailModel[]}}
	 * */
	let searchOption = {
		agentId: null,
		channel: null,
		status: null,
		taskId: null,
		states: [],
	};

    onMount(async () => {
		await loadAgentOptions();
		loadSearchOption();
		loadConversations();
    });

	function loadConversations() {
		isLoading = true;
		getPagedConversations().then(res => {
			isLoading = false;
		}).catch(error => {
			isLoading = false;
			isError = true;
		});
	}

	async function getPagedConversations() {
		conversations = await getConversations(filter);
		refresh();
	}

	async function loadAgentOptions() {
		const agents = await getAgents({ pager: { page: 1, size: 100, count: 0 } });
		agentOptions = agents?.items?.map(x => {
			return {
				id: x.id,
				name: x.name
			};
		})?.sort((a, b) => a.name.localeCompare(b.name)) || [];
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
			customClass: 'custom-modal',
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
		refreshFilter();
		initFilterPager();
		getPagedConversations();
		saveSearchOption();
	}

	function initFilterPager() {
		filter = {
			...filter,
			pager: { page: firstPage, size: pageSize, count: 0 },
		};
	}

	function toggleSearchStateModal() {
		isOpenSearchStateModal = !isOpenSearchStateModal;
	}

	function handleConfirmStateModal() {
		handleSearchStates();
		toggleSearchStateModal();
	}

	function loadSearchOption() {
		const savedOption = conversationSearchOptionStore.get();
		searchOption = {
			...searchOption,
			...savedOption
		};
		refreshFilter();
		handleSearchStates();
	}

	function refreshFilter() {
		const searchStates = getSearchStates();
		filter = {
			...filter,
			agentId: searchOption.agentId,
			channel: searchOption.channel,
			status: searchOption.status,
			taskId: searchOption.taskId,
			states: searchStates
		};
	}

	function getSearchStates() {
		return searchOption.states?.map(x => {
			return {
				key: x.key?.data,
				value: x.value?.data
			};
		}) || [];
	}

	function handleSearchStates() {
		sortSearchStates();
		buldSearchStateString();
	}

	function sortSearchStates() {
		searchOption.states = searchOption.states?.map(x => {
			if (!!x.key) x.key.data = lodash.trim(x.key.data);
			if (!!x.value) x.value.data = lodash.trim(x.value.data)
			return x;
		})?.sort((a, b) => {
			const stra = `${!!a.key?.data ? a.key.data : ''} ${!!a.value?.data ? b.value.data : ''}`;
			const strb = `${!!b.key?.data ? b.key.data : ''} ${!!b.value?.data ? b.value.data : ''}`;
			if (stra.length != strb.length) {
				return stra.length - strb.length;
			}
			const keya = a.key?.data?.toLowerCase() || '';
			const keyb = b.key?.data?.toLowerCase() || '';
			return keya < keyb ? -1 : keya == keyb ? 0 : 1;
		}) || [];
	}

	function buldSearchStateString() {
		searchStateStrs = searchOption.states.map(x => {
			let s = '';
			if (x.key?.data?.length > 0) {
				s += x.key.data;
			}
			if (x.value?.data?.length > 0) {
				s += '=' + x.value.data;
			}
			return s;
		});
	}

	function saveSearchOption() {
		conversationSearchOptionStore.put(searchOption);
	}

	/** @param {string | number} index */
	function handleCloseLabel(index) {
		searchOption.states = searchOption.states.filter((x, idx) => idx != index);
		buldSearchStateString();
	}

	/**
	 * @param {any} e
	 * @param {string} type
	 */
	function changeOption(e, type) {
		if (type === 'agent') {
			searchOption = {
				...searchOption,
				agentId: e.target.value || null
			};
		} else if (type === 'task') {
			searchOption = {
				...searchOption,
				taskId: e.target.value || null
			};
		} else if (type === 'channel') {
			searchOption = {
				...searchOption,
				channel: e.target.value || null
			};
		} else if (type === 'status') {
			searchOption = {
				...searchOption,
				status: e.target.value || null
			};
		}
	}
</script>

<HeadTitle title="{$_('Conversation List')}" />
<Breadcrumb title="{$_('Communication')}" pagetitle="{$_('Conversations')}" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} isError={isError} successText={'Delete completed!'} />
<StateModal
	isOpen={isOpenSearchStateModal}
	validateKey={true}
	validateValue={false}
	bind:states={searchOption.states}
	toggleModal={toggleSearchStateModal}
	confirm={handleConfirmStateModal}
	cancel={toggleSearchStateModal}
/>

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('Conversation List')}</h5>
					<div class="flex-shrink-0">
						<Link class="btn btn-light" on:click={(e) => searchConversations(e)}><i class="mdi mdi-magnify" /></Link>
						<Dropdown class="dropdown d-inline-block">
							<DropdownToggle type="menu" class="btn" id="dropdownMenuButton1">
								<i class="mdi mdi-dots-vertical" />
							</DropdownToggle>
							<DropdownMenu class="conv-state-search-menu">
								<DropdownItem
									on:click={() => toggleSearchStateModal()}
								>
									{$_('Search States')}
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</div>
				</div>
			</CardBody>
			<CardBody class="border-bottom">
				<Row class="g-3">
					<Col lg="3">
						<select class="form-select" id="idAgent" value={searchOption.agentId} on:change={(e) => changeOption(e, 'agent')}>
							<option value={null}>{$_('Select Agent')}</option>
							{#each agentOptions as op}
							<option value={`${op.id}`}>{$_(`${op.name}`)}</option>
							{/each}
						</select>
					</Col>
					<Col lg="2">
						<select class="form-select" id="idTask" value={searchOption.taskId} on:change={(e) => changeOption(e, 'task')}>
							<option value={null}>{$_('Select Task')}</option>
						</select>
					</Col>					
					<Col lg="2">
						<select class="form-select" id="idStatus" value={searchOption.status} on:change={(e) => changeOption(e, 'status')}>
							<option value={null}>{$_('Select Status')}</option>
							<option value="{$_('open')}">{$_('Active')}</option>
							<option value="{$_('closed')}">{$_('Completed')}</option>
						</select>
					</Col>
					<Col lg="2">
						<select class="form-select" id="idChannel" value={searchOption.channel} on:change={(e) => changeOption(e, 'channel')}>
							<option value={null}>{$_('Select Channel')}</option>
							<option value="{$_('webchat')}">{$_('Live Chat')}</option>
							<option value="{$_('phone')}">{$_('Phone')}</option>
                            <option value="{$_('email')}">{$_('Email')}</option>
						</select>
					</Col>
					<Col lg="2">
						<Input type="date" class="form-control" />
					</Col>
					<Col lg="1">
						<Button
							type="button"
							color="secondary"
							class="btn-soft-secondary w-100"
							on:click={(e) => searchConversations(e)}
						>
							<i class="mdi mdi-filter-outline align-middle" /> {$_('Filter')}
						</Button>
					</Col>
				</Row>
				{#if searchStateStrs?.length > 0}
					{#each searchStateStrs as str, idx (idx)}
					<Label index={idx} text={str} onClose={handleCloseLabel} />
					{/each}
				{/if}
			</CardBody>
			<CardBody>
				<div class="table-responsive">
					<Table class="align-middle nowrap" bordered>
						<thead>
							<tr>
								<th scope="col" class="list-title">{$_('Title')}</th>
								<th scope="col">{$_('User Name')}</th>
								<th scope="col">{$_('Agent')}</th>
								<th scope="col">{$_('Channel')}</th>
								<th scope="col">{$_('Posted Date')}</th>
								<th scope="col">{$_('Last Date')}</th>
								<th scope="col">{$_('Status')}</th>
								<th scope="col">{$_('Action')}</th>
							</tr>
						</thead>
						<tbody>
							{#each conversations.items as conv}
							<tr>
								<td scope="row" class="list-title">
									<a href="page/conversation/{conv.id}">{conv.title}</a></td>
								<td>{conv.user.full_name}</td>
								<td>{conv.agent_name}</td>
								<td><span class="badge badge-soft-success">{conv.channel}</span></td>
								<td>{utcToLocal(conv.created_time)}</td>
								<td>{utcToLocal(conv.updated_time)}</td>
								<td><span class="badge bg-success">{conv.status}</span></td>
								<td>
									<ul class="list-unstyled hstack gap-1 mb-0">
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
											<Link href="page/conversation/{conv.id}" class="btn btn-sm btn-soft-primary">
                                                <i class="mdi mdi-eye-outline" />
                                            </Link>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Chat">
											<Link href="chat/{conv.agent_id}/{conv.id}" target="_blank" class="btn btn-sm btn-soft-info">
                                                <i class="mdi mdi-chat" />
                                            </Link>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
											<Button on:click={() => openDeleteModal(conv.id)} class="btn btn-sm btn-soft-danger">
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