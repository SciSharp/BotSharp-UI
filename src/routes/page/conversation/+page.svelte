<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import Swal from 'sweetalert2';
	import lodash from "lodash";
	import StateSearch from '$lib/common/shared/StateSearch.svelte';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import TablePagination from '$lib/common/shared/TablePagination.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import TimeRangePicker from '$lib/common/shared/TimeRangePicker.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { ConversationChannel, TimeRange } from '$lib/helpers/enums';
	import {
		getConversations,
		deleteConversation,
		getConversationStateSearchKeys
	} from '$lib/services/conversation-service.js';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl,
		convertTimeRange
	} from '$lib/helpers/utils/common';

	const duration = 3000;
	const firstPage = 1;
	const pageSize = 15;

	/** @type {boolean} */
	let isLoading = $state(false);
	let isComplete = $state(false);
	let showStateSearch = $state(false);
	let isPageMounted = false;

	/** @type {import('$commonTypes').PagedItems<import('$conversationTypes').ConversationModel>} */
	let conversations = $state({ count: 0, items: [] });

	/** @type {import('$conversationTypes').ConversationFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

	/** @type {import('$conversationTypes').ConversationFilter} */
	let filter = $state({ ...initFilter });

	// svelte-ignore state_referenced_locally
	/** @type {import('$commonTypes').Pagination} */
	let pager = $state(filter.pager);

	/** @type {string[]} */
	let searchStateStrs = $state([]);

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let agentOptions = $state([]);

	/** @type {import('$commonTypes').LabelValuePair[]} */
	const statusOptions = [
		{ value: 'open', label: 'Active' },
		{ value: 'closed', label: 'Completed' }
	];

	/** @type {import('$commonTypes').LabelValuePair[]} */
	const channelOptions = Object.entries(ConversationChannel).map(([k, v]) => (
		{ value: k.toLowerCase(), label: v }
	));

	/** @type {{ startTime: string | null, endTime: string | null }} */
	let innerTimeRange = $state({
		startTime: null,
		endTime: null
	});

	/** @type {import('$conversationTypes').ConversationSearchOption} */
	let searchOption = $state({
		agentId: null,
		agentIds: [],
		channel: null,
		status: null,
		taskId: null,
		timeRange: TimeRange.Last12Hours,
		startDate: '',
		endDate: '',
		states: [],
		tags: []
	});

	/** @type {{key: string, value: string | null}[]} */
	let states = $state([
		{ key: '', value: '' }
	]);

    onMount(async () => {
		isPageMounted = true;
		const { pageNum, pageSizeNum } = getPagingQueryParams({
			page: $page.url.searchParams.get("page"),
			pageSize: $page.url.searchParams.get("pageSize")
		}, { defaultPageSize: pageSize });
		innerTimeRange = convertTimeRange(searchOption.timeRange || '', searchOption.startDate, searchOption.endDate);

		filter = {
			...filter,
			startTime: innerTimeRange.startTime,
			endTime: innerTimeRange.endTime,
			pager: {
				...filter.pager,
				page: pageNum,
				size: pageSizeNum
			}
		};

		isLoading = true;
		try {
			await Promise.all([
				loadAgentOptions(),
				loadSearchOption(),
				loadConversations()
			]);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
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
			getAgentOptions().then(res => {
				agentOptions = res?.map(x => {
					return {
						label: x.name || '',
						value: x.id || ''
					};
				}) || [];
				resolve(agentOptions);
			}).catch((error) => {
				agentOptions = [];
				reject(error);
			});
		});
	}

	function refresh() {
		refreshConversations();
		refreshPager(conversations.count, filter.pager.page);
	}

	function refreshConversations() {
		conversations = {
			items: conversations?.items?.map(t => { return { ...t }; }) || [],
			count: conversations?.count || 0
		};
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, pageNum = firstPage) {
		pager = {
			...filter.pager,
			page: pageNum,
			count: totalItemsCount
		};

		setUrlQueryParams($page.url, [
			{ key: 'page', value: `${pager.page}` },
			{ key: 'pageSize', value: `${pager.size}` }
		], (url) => {
			if (!isPageMounted) return;
			goToUrl(`${url.pathname}${url.search}`);
		});
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
		initFilterPager();
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
		}).catch(() => {
			isLoading = false;
			isComplete = false;
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
			pager: {
				...filter.pager,
				page: firstPage,
				count: 0
			}
		};
	}

	/**
	 * @param {any} e
	 */
	function handleConfirmStateModal(e) {
		searchOption.states = states.filter(x => !!lodash.trim(x.key)).map(x => ({
			key: { data: x.key, isValid: true },
			value: { data: x.value || '', isValid: true },
			active_rounds: {data: -1, isValid: true},
		}));
		handleSearchStates();
		searchConversations(e);
	}

	function loadSearchOption() {
		return new Promise((resolve) => {
			refreshFilter();
			handleSearchStates();
			resolve(searchOption);
		});
	}

	function refreshFilter() {
		const searchStates = getSearchStates();
		innerTimeRange = convertTimeRange(searchOption.timeRange || '', searchOption.startDate, searchOption.endDate);

		filter = {
			...filter,
			agentId: searchOption.agentId,
			agentIds: searchOption.agentIds,
			channel: searchOption.channel,
			status: searchOption.status,
			taskId: searchOption.taskId,
			states: searchStates,
			tags: searchOption.tags,
			startTime: innerTimeRange.startTime,
			endTime: innerTimeRange.endTime
		};
	}

	function getSearchStates() {
		searchOption.states = states?.filter(x => !!lodash.trim(x.key))?.map(x => ({
			key: { data: lodash.trim(x.key), isValid: true },
			value: { data: lodash.trim(x.value) || '', isValid: true },
			active_rounds: {data: -1, isValid: true},
		})) || [];
		return searchOption.states.map(x => ({ key: x.key.data, value: x.value.data }));
	}

	function handleSearchStates() {
		sortSearchStates();
		buldSearchStateString();
	}

	function sortSearchStates() {
		searchOption.states = searchOption.states?.map(x => {
			if (x.key) {
				x.key.data = lodash.trim(x.key.data);
			}
			if (x.value) {
				x.value.data = lodash.trim(x.value.data);
			}
			return x;
		})?.sort((a, b) => {
			const stra = `${a.key?.data ? a.key.data : ''} ${a.value?.data ? b.value.data : ''}`;
			const strb = `${b.key?.data ? b.key.data : ''} ${b.value?.data ? b.value.data : ''}`;
			if (stra.length !== strb.length) {
				return stra.length - strb.length;
			}
			const keya = a.key?.data?.toLowerCase() || '';
			const keyb = b.key?.data?.toLowerCase() || '';
			return keya < keyb ? -1 : keya === keyb ? 0 : 1;
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
		searchOption.states = searchOption.states.filter((x, idx) => idx !== index);
		buldSearchStateString();
	}

	/**
	 * @param {any} e
	 * @param {string} type
	 */
	function changeOption(e, type) {
		// @ts-ignore
		const selectedValues = e?.detail?.selecteds?.map(x => x.value) || [];

		if (type === 'agent') {
			searchOption = {
				...searchOption,
				agentIds: selectedValues
			};
		} else if (type === 'task') {
			searchOption = {
				...searchOption,
				taskId: selectedValues.length > 0 ? selectedValues[0] : null
			};
		} else if (type === 'channel') {
			searchOption = {
				...searchOption,
				channel: selectedValues.length > 0 ? selectedValues[0] : null
			};
		} else if (type === 'status') {
			searchOption = {
				...searchOption,
				status: selectedValues.length > 0 ? selectedValues[0] : null
			};
		} else if (type === 'tags') {
			searchOption = {
				...searchOption,
				tags: e.target.value?.length > 0 ? [e.target.value] : []
			};
		}
	}

	/** @param {string} query */
	function handleStateSearch(query) {
		return new Promise((resolve) => {
			getConversationStateSearchKeys({
				query: query,
				keyLimit: 20,
				agentIds: searchOption.agentId ? [searchOption.agentId] : null,
				startTime: innerTimeRange.startTime,
				endTime: innerTimeRange.endTime
			}).then((/** @type {any[]} */ res) => {
				resolve(res || []);
			}).catch(() => resolve([]));
		});
	}
</script>

<HeadTitle title={$_('Conversation List')} />
<Breadcrumb title={$_('Communication')} pagetitle={$_('Conversations')} />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	successText={'Delete completed!'}
/>

<div class="row">
	<div class="col-lg-12">
		<div class="card">
			<div class="card-body border-bottom">
				<div class="d-flex flex-wrap align-items-center justify-content-between">
					<div class="mb-0 card-title flex-grow-0">
						<h5 class="mb-0">{$_('Conversation List')}</h5>
					</div>
					<div class="state-search-btn-wrapper">
						<button
							type="button"
							class="btn btn-{showStateSearch ? 'secondary' : 'primary'}"
							onclick={() => showStateSearch = !showStateSearch}
						>
							<div class="state-search-btn">
								<div>
									{#if showStateSearch}
										<i class="bx bx-hide"></i>
									{:else}
										<i class="bx bx-search-alt"></i>
									{/if}
								</div>
								<div class="search-btn-text">{'State Search'}</div>
							</div>
						</button>
					</div>
				</div>
			</div>
			{#if showStateSearch}
				<div class="card-body border-bottom">
					<div class="row g-3 justify-content-end">
						<div class="col-lg-6">
							<StateSearch bind:states={states} onSearch={q => handleStateSearch(q)}/>
						</div>
					</div>
				</div>
			{/if}
			<div class="card-body border-bottom">
				<div class="row g-3">
					<div class="col-lg-3">
						<Select
							tag={'agent-select'}
							placeholder={'Select Agents'}
							selectedText={'agents'}
							multiSelect
							searchMode
							selectedValues={searchOption.agentIds}
							options={agentOptions}
							onselect={e => changeOption(e, 'agent')}
						/>
					</div>
					<div class="col-lg-2">
						<Select
							tag={'task-select'}
							placeholder={'Select Status'}
							selectedText={'status'}
							selectedValues={searchOption.status ? [searchOption.status] : []}
							options={statusOptions}
							onselect={e => changeOption(e, 'status')}
						/>
					</div>
					<div class="col-lg-2">
						<Select
							tag={'channel-select'}
							placeholder={'Select Channel'}
							selectedText={'channel'}
							selectedValues={searchOption.channel ? [searchOption.channel] : []}
							options={channelOptions}
							onselect={e => changeOption(e, 'channel')}
						/>
					</div>
					<div class="col-lg-2">
						<input
							type="text"
							class="form-control"
							placeholder="Tag"
							maxlength={100}
							oninput={e => changeOption(e, 'tags')}
						/>
					</div>
					<div class="col-lg-2">
						<TimeRangePicker
							storageKey="botsharp_conversation_recent_time_ranges"
							bind:timeRange={searchOption.timeRange}
							bind:startDate={searchOption.startDate}
							bind:endDate={searchOption.endDate}
							onchange={(data) => {
								// Only update searchOption, don't trigger query immediately
								searchOption.timeRange = data.timeRange;
								searchOption.startDate = data.startDate;
								searchOption.endDate = data.endDate;
							}}
						/>
					</div>
					<div class="col-lg-1">
						<button
							type="button"
							class="btn btn-secondary btn-soft-secondary w-100"
							onclick={(e) => searchConversations(e)}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="d-none">{$_('Filter')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="card-body">
				<div class="table-responsive thin-scrollbar">
					<table class="table table-bordered align-middle nowrap conv-table">
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
								<td class="list-title">
									<a href="page/conversation/{conv.id}">{conv.title}</a>
								</td>
								<td>{conv.user.full_name}</td>
								<td>{conv.agent_name}</td>
								<td><span class="badge badge-soft-success">{conv.channel}</span></td>
								<td>{utcToLocal(conv.created_time)}</td>
								<td>{utcToLocal(conv.updated_time)}</td>
								<td><span class="badge bg-success">{conv.status}</span></td>
								<td>
									<ul class="list-unstyled hstack gap-1 mb-0">
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
											<button
												type="button"
												class="btn btn-sm btn-soft-primary"
												aria-label="View Detail"
												onclick={() => window.open(`page/conversation/${conv.id}`)}
											>
												<i class="mdi mdi-eye-outline"></i>
											</button>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Chat">
											<button
												type="button"
												class="btn btn-sm btn-soft-info"
												aria-label="Chat"
												onclick={() => window.open(`chat/${conv.agent_id}/${conv.id}`)}
											>
												<i class="mdi mdi-chat"></i>
											</button>
										</li>
										<li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
											<button
												type="button"
												class="btn btn-sm btn-soft-danger"
												aria-label="Delete"
												onclick={() => openDeleteModal(conv.id)}
											>
												<i class="mdi mdi-delete-outline"></i>
											</button>
										</li>
									</ul>
								</td>
							</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</div>
		</div>
	</div>
</div>

<style>
	.conv-table th,
	.conv-table td {
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.conv-table th.list-title,
	.conv-table td.list-title {
		max-width: 240px;
	}
</style>