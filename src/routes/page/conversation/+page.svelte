<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
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
		convertTimeRange,
		formatNumber
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

	let confirmOpen = $state(false);
	/** @type {string | null} */
	let pendingDeleteId = $state(null);

	/** @param {string} conversationId */
	function openDeleteModal(conversationId) {
		pendingDeleteId = conversationId;
		confirmOpen = true;
	}

	function closeConfirm() {
		confirmOpen = false;
		pendingDeleteId = null;
	}

	function onConfirmDelete() {
		const id = pendingDeleteId;
		closeConfirm();
		if (id) {
			handleConversationDeletion(id);
		}
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

<ConfirmModal
	isOpen={confirmOpen}
	icon="error"
	title="Are you sure?"
	text="You won't be able to revert this!"
	confirmBtnText="Yes, delete it!"
	cancelBtnText="No"
	confirmBtnColor="danger"
	confirm={onConfirmDelete}
	cancel={closeConfirm}
	toggleModal={closeConfirm}
/>

<div class="flex flex-wrap">
	<div class="w-full">
		<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
							<i class="mdi mdi-forum-outline text-xl"></i>
						</span>
						<div>
							<h5 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Conversation List')}</h5>
							<p class="mb-0 text-xs text-muted">{formatNumber(pager.count)} {pager.count === 1 ? 'conversation' : 'conversations'} total</p>
						</div>
					</div>
					<button
						type="button"
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors {showStateSearch ? 'bg-gray-200 text-dark hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600' : 'bg-primary text-white hover:bg-primary-hover'}"
						onclick={() => showStateSearch = !showStateSearch}
					>
						{#if showStateSearch}
							<i class="bx bx-hide text-base leading-none"></i>
						{:else}
							<i class="bx bx-search-alt text-base leading-none"></i>
						{/if}
						<span class="search-btn-text">{'State Search'}</span>
					</button>
				</div>
			</div>
			{#if showStateSearch}
				<div class="conv-state-search border-b border-gray-100 px-6 py-4 dark:border-gray-700">
					<div class="flex justify-end">
						<div class="w-full lg:w-1/2">
							<StateSearch bind:states={states} onSearch={q => handleStateSearch(q)}/>
						</div>
					</div>
				</div>
			{/if}
			<div class="conv-filter border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
					<div class="lg:col-span-3">
						<Select
							tag={'agent-select'}
							placeholder={'Select Agents'}
							selectedText={'agents'}
							multiSelect
							searchMode
							selectedValues={searchOption.agentIds}
							options={agentOptions}
							onselect={e => changeOption(e, 'agent')}
						>
							{#snippet prefixIcon()}
								<i class="mdi mdi-robot-outline"></i>
							{/snippet}
						</Select>
					</div>
					<div class="lg:col-span-2">
						<Select
							tag={'task-select'}
							placeholder={'Select Status'}
							selectedText={'status'}
							selectedValues={searchOption.status ? [searchOption.status] : []}
							options={statusOptions}
							onselect={e => changeOption(e, 'status')}
						>
							{#snippet prefixIcon()}
								<i class="mdi mdi-flag-outline"></i>
							{/snippet}
						</Select>
					</div>
					<div class="lg:col-span-2">
						<Select
							tag={'channel-select'}
							placeholder={'Select Channel'}
							selectedText={'channel'}
							selectedValues={searchOption.channel ? [searchOption.channel] : []}
							options={channelOptions}
							onselect={e => changeOption(e, 'channel')}
						>
							{#snippet prefixIcon()}
								<i class="mdi mdi-access-point-network"></i>
							{/snippet}
						</Select>
					</div>
					<div class="lg:col-span-2">
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
								<i class="mdi mdi-tag-outline text-base leading-none"></i>
							</span>
							<input
								type="text"
								class="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								placeholder="Tag"
								maxlength={100}
								oninput={e => changeOption(e, 'tags')}
							/>
						</div>
					</div>
					<div class="lg:col-span-2">
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
						>
							{#snippet prefixIcon()}
								<i class="mdi mdi-clock-outline"></i>
							{/snippet}
						</TimeRangePicker>
					</div>
					<div class="lg:col-span-1">
						<button
							type="button"
							class="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-primary-hover"
							onclick={(e) => searchConversations(e)}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="sr-only">{$_('Filter')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<div class="thin-scrollbar overflow-x-auto rounded-lg ring-1 ring-gray-100 dark:ring-gray-700">
					<table class="conv-table w-full border-collapse text-sm">
						<thead class="bg-gray-50 dark:bg-gray-700/50">
							<tr>
								<th scope="col" class="list-title">{$_('Title')}</th>
								<th scope="col">{$_('User Name')}</th>
								<th scope="col">{$_('Agent')}</th>
								<th scope="col">{$_('Channel')}</th>
								<th scope="col">{$_('Posted Date')}</th>
								<th scope="col">{$_('Last Date')}</th>
								<th scope="col">{$_('Status')}</th>
								<th scope="col" class="text-start">{$_('Action')}</th>
							</tr>
						</thead>
						<tbody>
							{#each conversations.items as conv}
							<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
								<td class="list-title">
									<a href="page/conversation/{conv.id}" class="font-medium text-primary hover:underline">{conv.title}</a>
								</td>
								<td>
									{#if conv.user?.full_name}
										<div class="flex items-center gap-2">
											<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">
												{conv.user.full_name.charAt(0)}
											</span>
											<span class="text-dark dark:text-gray-100">{conv.user.full_name}</span>
										</div>
									{:else}
										<span class="text-muted italic">—</span>
									{/if}
								</td>
								<td>
									{#if conv.agent_name}
										<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
											<i class="mdi mdi-robot-outline text-sm leading-none"></i>
											{conv.agent_name}
										</span>
									{:else}
										<span class="text-muted italic">—</span>
									{/if}
								</td>
								<td>
									<span class="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">{conv.channel}</span>
								</td>
								<td>
									<span class="text-xs text-muted">{utcToLocal(conv.created_time)}</span>
								</td>
								<td>
									<span class="text-xs text-muted">{utcToLocal(conv.updated_time)}</span>
								</td>
								<td>
									<span class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
										<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
										{conv.status}
									</span>
								</td>
								<td>
									<div class="flex items-center justify-start gap-1.5">
										<button
											type="button"
											class="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-all hover:scale-105 hover:bg-primary/20"
											aria-label="View Detail"
											title="View Detail"
											onclick={() => window.open(`page/conversation/${conv.id}`)}
										>
											<i class="mdi mdi-eye-outline"></i>
										</button>
										<button
											type="button"
											class="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-md bg-info/15 text-info transition-all hover:scale-105 hover:bg-info/25"
											aria-label="Chat"
											title="Chat"
											onclick={() => window.open(`chat/${conv.agent_id}/${conv.id}`)}
										>
											<i class="mdi mdi-chat"></i>
										</button>
										<button
											type="button"
											class="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-md bg-danger/10 text-danger transition-all hover:scale-105 hover:bg-danger/20"
											aria-label="Delete"
											title="Delete"
											onclick={() => openDeleteModal(conv.id)}
										>
											<i class="mdi mdi-delete-outline"></i>
										</button>
									</div>
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
