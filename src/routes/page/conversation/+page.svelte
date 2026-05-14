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
						class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors {showStateSearch ? 'bg-gray-200 text-dark hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600' : 'bg-primary text-white hover:bg-primary-hover'}"
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
							class="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
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
								<th scope="col" class="text-center">{$_('Action')}</th>
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
									<div class="flex items-center justify-center gap-1.5">
										<button
											type="button"
											class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-all hover:scale-105 hover:bg-primary/20"
											aria-label="View Detail"
											title="View Detail"
											onclick={() => window.open(`page/conversation/${conv.id}`)}
										>
											<i class="mdi mdi-eye-outline"></i>
										</button>
										<button
											type="button"
											class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-info/15 text-info transition-all hover:scale-105 hover:bg-info/25"
											aria-label="Chat"
											title="Chat"
											onclick={() => window.open(`chat/${conv.agent_id}/${conv.id}`)}
										>
											<i class="mdi mdi-chat"></i>
										</button>
										<button
											type="button"
											class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-danger/10 text-danger transition-all hover:scale-105 hover:bg-danger/20"
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

<style>
	/* Conversation table cell styling. Uses :global() so it applies across
	   header (here) and body rows. Preserves the original column ellipsis. */

	:global(.conv-table th),
	:global(.conv-table td) {
		border-bottom: 1px solid rgb(243 244 246);
		padding: 0.75rem 1rem;
		vertical-align: middle;
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.conv-table thead th) {
		text-align: left;
		font-weight: 600;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		border-bottom-width: 2px;
		border-bottom-color: rgb(229 231 235);
	}

	:global(.dark .conv-table th),
	:global(.dark .conv-table td) {
		border-bottom-color: rgb(55 65 81);
	}

	:global(.conv-table th.list-title),
	:global(.conv-table td.list-title) {
		max-width: 240px;
	}

	:global(.conv-table tbody tr:last-child > td) {
		border-bottom: 0;
	}

	/* Hide the "State Search" label on narrow viewports — matches the
	   original behavior from _state.scss for the state-search-btn group. */
	@media (max-width: 800px) {
		.search-btn-text {
			display: none;
		}
	}

	/* ---------- Filter row + state-search refresh ----------
	   Scoped overrides for the Select component, RemoteSearchInput, and the
	   tag input so they share the Tailwind-aligned look of the page chrome.
	   These rely on the `.conv-filter` and `.conv-state-search` wrappers
	   added above so they don't leak into other pages still on Bootstrap. */

	/* --- Select component: display input --- */
	:global(.conv-filter .multiselect-container .display-container input[type='text']),
	:global(.conv-state-search .multiselect-container .display-container input[type='text']) {
		height: 2.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgb(229 231 235);
		background-color: rgb(255 255 255);
		padding-left: 0.75rem;
		padding-right: 2rem;
		font-size: 0.875rem;
		color: rgb(31 41 55);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	/* When a prefixIcon snippet is rendered on the Select, the component
	   sets `.has-prefix` on the display container and shifts the input
	   padding to reserve room for the icon — these page-level overrides
	   must honour that, otherwise the placeholder collides with the icon. */
	:global(.conv-filter .multiselect-container .display-container.has-prefix input[type='text']),
	:global(.conv-state-search .multiselect-container .display-container.has-prefix input[type='text']) {
		padding-left: 2.25rem;
	}
	:global(.conv-filter .multiselect-container .display-container input[type='text']:focus),
	:global(.conv-state-search .multiselect-container .display-container input[type='text']:focus) {
		border-color: var(--color-primary);
		outline: 0;
		box-shadow: 0 0 0 1px var(--color-primary);
	}

	/* --- Select component: chevron suffix (center vertically) --- */
	:global(.conv-filter .multiselect-container .display-suffix),
	:global(.conv-state-search .multiselect-container .display-suffix) {
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.125rem;
		color: rgb(156 163 175);
		line-height: 1;
	}

	/* --- TimeRangePicker trigger button (uses button.form-control, no
	   .display-container wrapper, so it needs its own rule to match
	   the height/border/focus look of the other filter controls). --- */
	:global(.conv-filter .multiselect-container > button.form-control) {
		height: 2.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgb(229 231 235);
		background-color: rgb(255 255 255);
		padding: 0 2rem 0 0.75rem;
		font-size: 0.875rem;
		color: rgb(31 41 55);
		text-align: left;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
		width: 100%;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	:global(.conv-filter .multiselect-container > button.form-control:hover) {
		border-color: rgb(209 213 219);
	}
	:global(.conv-filter .multiselect-container > button.form-control:focus) {
		border-color: var(--color-primary);
		outline: 0;
		box-shadow: 0 0 0 1px var(--color-primary);
	}
	:global(.conv-filter .multiselect-container > button.form-control > i.bx-chevron-down) {
		position: absolute;
		right: 0.625rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.125rem;
		color: rgb(156 163 175);
		line-height: 1;
	}

	/* --- Select component: option list popup --- */
	:global(.conv-filter .multiselect-container .option-list),
	:global(.conv-state-search .multiselect-container .option-list) {
		margin-top: 0.25rem;
		border: 1px solid rgb(229 231 235);
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05);
	}
	:global(.conv-filter .multiselect-container .option-item:hover),
	:global(.conv-state-search .multiselect-container .option-item:hover) {
		background-color: rgb(243 244 246);
	}
	:global(.conv-filter .multiselect-container .option-item .select-name),
	:global(.conv-state-search .multiselect-container .option-item .select-name) {
		font-size: 0.875rem;
	}

	/* --- Plain inputs (tag input + state-search value input) --- */
	:global(.conv-filter input.form-control),
	:global(.conv-state-search input.form-control) {
		height: 2.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgb(229 231 235);
		background-color: rgb(255 255 255);
		font-size: 0.875rem;
		color: rgb(31 41 55);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	:global(.conv-filter input.form-control:focus),
	:global(.conv-state-search input.form-control:focus) {
		border-color: var(--color-primary);
		outline: 0;
		box-shadow: 0 0 0 1px var(--color-primary);
	}

	/* --- State search: container spacing --- */
	:global(.conv-state-search .state-search-container) {
		gap: 0.5rem;
	}
	:global(.conv-state-search .state-search-item) {
		align-items: center;
		gap: 0.5rem;
	}

	/* --- State search: remove icon --- */
	:global(.conv-state-search .state-search-item .bxs-no-entry) {
		font-size: 1.125rem;
		cursor: pointer;
		transition: transform 0.15s ease;
	}
	:global(.conv-state-search .state-search-item .bxs-no-entry:hover) {
		transform: scale(1.15);
	}
	:global(.conv-state-search .state-search-item .bxs-no-entry.hide) {
		visibility: hidden;
	}

	/* --- State search: "Add +" link button --- */
	:global(.conv-state-search .btn-link) {
		color: var(--color-primary);
		font-weight: 500;
		font-size: 0.8125rem;
		text-decoration: none;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: background-color 0.15s ease;
	}
	:global(.conv-state-search .btn-link:hover) {
		background-color: var(--color-primary);
		color: rgb(255 255 255);
	}

	/* --- RemoteSearchInput autocomplete dropdown --- */
	:global(.conv-state-search .scrollable-dropdown .dropdown-menu) {
		margin-top: 0.25rem;
		border: 1px solid rgb(229 231 235);
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05);
		padding: 0.25rem;
		max-height: 240px;
		overflow-y: auto;
	}
	:global(.conv-state-search .scrollable-dropdown .dropdown-item) {
		border-radius: 0.25rem;
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
		color: rgb(31 41 55);
	}
	:global(.conv-state-search .scrollable-dropdown .dropdown-item:hover),
	:global(.conv-state-search .scrollable-dropdown .dropdown-item.active) {
		background-color: rgb(243 244 246);
		color: var(--color-primary);
	}
</style>