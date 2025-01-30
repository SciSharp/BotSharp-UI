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
	import { onMount } from 'svelte';
	import { getAgents } from '$lib/services/agent-service';
	import { getConversations, deleteConversation } from '$lib/services/conversation-service.js';
	import { utcToLocal } from '$lib/helpers/datetime';
	import Swal from 'sweetalert2';
	import lodash from "lodash";
	import MultiSelect from '$lib/common/MultiSelect.svelte';
	import { ConversationTag } from '$lib/helpers/enums';

	let isLoading = false;
	let isComplete = false;
	let isError = false;
	let isOpenSearchStateModal = false;
	const duration = 3000;
	const firstPage = 1;
	const pageSize = 15;

    /** @type {import('$commonTypes').PagedItems<import('$conversationTypes').ConversationModel>} */
    let conversations = { count: 0, items: [] };

	/** @type {import('$conversationTypes').ConversationFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

    /** @type {import('$conversationTypes').ConversationFilter} */
    let filter = { ... initFilter };

	/** @type {import('$commonTypes').Pagination} */
	let pager = filter.pager;

	/** @type {string[]} */
	let searchStateStrs = [];

	/** @type {import('$commonTypes').IdName[]} */
	let agentOptions = [];

	/** @type {import('$commonTypes').IdName[]} */
	let statusOptions = [
		{ id: 'open', name: 'Active' },
		{ id: 'closed', name: 'Completed' }
	];

	/** @type {import('$commonTypes').IdName[]} */
	let channelOptions = [
		{ id: 'webchat', name: 'Live Chat' },
		{ id: 'phone', name: 'Phone' },
		{ id: 'email', name: 'Email' }
	];

	/** @type {import('$commonTypes').KeyValuePair[]} */
	let tagOptions = Object.entries(ConversationTag).map(([k, v]) => (
		{ key: k, value: v }
	));

	/** @type {import('$conversationTypes').ConversationSearchOption} */
	let searchOption = {
		agentId: null,
		channel: null,
		status: null,
		taskId: null,
		states: [],
		tags: []
	};

    onMount(async () => {
		isLoading = true;
		Promise.all([
			loadAgentOptions(),
			loadSearchOption(),
			loadConversations()])
		.finally(() => {
			isLoading = false
		});
    });

	function loadConversations() {
		return new Promise((resolve, reject) => {
			getPagedConversations().then(res => {
				resolve(res);
			}).catch((error) => {
				reject(error);
			});
		});
	}

	async function getPagedConversations() {
		conversations = await getConversations(filter);
		refresh();
	}

	function loadAgentOptions() {
		return new Promise((resolve, reject) => {
			getAgents({ pager: { page: 1, size: 100, count: 0 } }).then(res => {
				agentOptions = res?.items?.map(x => {
					return {
						id: x.id,
						name: x.name
					};
				})?.sort((a, b) => a.name.localeCompare(b.name)) || [];
				resolve(agentOptions);
			}).catch((error) => {
				agentOptions = [];
				reject(error);
			});
		});
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
		conversations = await getConversations({ ...filter });
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
		return new Promise((resolve, reject) => {
			refreshFilter();
			handleSearchStates();
			resolve(searchOption);
		});
	}

	function refreshFilter() {
		const searchStates = getSearchStates();
		filter = {
			...filter,
			agentId: searchOption.agentId,
			channel: searchOption.channel,
			status: searchOption.status,
			taskId: searchOption.taskId,
			states: searchStates,
			tags: searchOption.tags
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
		} else if (type === 'tags') {
			searchOption = {
				...searchOption,
				tags: e.target.value?.length > 0 ? [e.target.value] : []
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
	toggleModal={() => toggleSearchStateModal()}
	confirm={() => handleConfirmStateModal()}
	cancel={() => toggleSearchStateModal()}
/>

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('Conversation List')}</h5>
					<div class="flex-shrink-0">
						<!-- <Button
							class="btn btn-light"
							on:click={(e) => searchConversations(e)}
						>
							<i class="mdi mdi-magnify" />
						</Button> -->
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
						<select class="form-select" id="idAgent" value={searchOption.agentId} on:change={e => changeOption(e, 'agent')}>
							<option value={null}>{$_('Select Agent')}</option>
							{#each agentOptions as op}
								<option value={`${op.id}`} selected={op.id === searchOption.agentId}>{$_(`${op.name}`)}</option>
							{/each}
						</select>
					</Col>
					<Col lg="2">
						<select class="form-select" id="idTask" value={searchOption.taskId} on:change={e => changeOption(e, 'task')}>
							<option value={null}>{$_('Select Task')}</option>
						</select>
					</Col>					
					<Col lg="2">
						<select class="form-select" id="idStatus" value={searchOption.status} on:change={e => changeOption(e, 'status')}>
							<option value={null}>{$_('Select Status')}</option>
							{#each statusOptions as op}
								<option value={`${op.id}`} selected={op.id === searchOption.status}>{$_(`${op.name}`)}</option>
							{/each}
						</select>
					</Col>
					<Col lg="2">
						<select class="form-select" id="idChannel" value={searchOption.channel} on:change={e => changeOption(e, 'channel')}>
							<option value={null}>{$_('Select Channel')}</option>
							{#each channelOptions as op}
								<option value={`${op.id}`} selected={op.id === searchOption.channel}>{$_(`${op.name}`)}</option>
							{/each}
						</select>
					</Col>
					<Col lg="2">
						<Input
							type={'text'}
							placeholder={'Tag'}
							maxlength={100}
							on:input={e => changeOption(e, "tags")}
						/>
					</Col>
					<!-- <Col lg="2">
						<Input type="date" class="form-control" />
					</Col> -->
					<Col lg="1">
						<Button
							type="button"
							color="secondary"
							class="btn-soft-secondary w-100"
							on:click={(e) => searchConversations(e)}
						>
							<i class="mdi mdi-filter-outline align-middle" />
							<span class="d-none">{$_('Filter')}</span>
						</Button>
					</Col>
				</Row>
				{#if searchStateStrs?.length > 0}
					{#each searchStateStrs as str, idx (idx)}
						<Label index={idx} text={str} onClose={(index) => handleCloseLabel(index)} />
					{/each}
				{/if}
			</CardBody>
			<CardBody>
				<div class="table-responsive thin-scrollbar">
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
											<Button
												class="btn btn-sm btn-soft-primary"
												on:click={() => window.open(`page/conversation/${conv.id}`)}
											>
												<i class="mdi mdi-eye-outline" />
											</Button>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Chat">
											<Button
												class="btn btn-sm btn-soft-info"
												on:click={() => window.open(`chat/${conv.agent_id}/${conv.id}`)}
											>
                                                <i class="mdi mdi-chat" />
                                            </Button>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
											<Button
												class="btn btn-sm btn-soft-danger"
												on:click={() => openDeleteModal(conv.id)}
											>
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
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</CardBody>
		</Card>
	</Col>
</Row>