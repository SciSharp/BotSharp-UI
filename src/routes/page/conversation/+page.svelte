<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import Swal from 'sweetalert2';
	import lodash from "lodash";
	import {
		Button,
		Card,
		CardBody,
		Col,
		Input,
		Row,
		Table
	} from '@sveltestrap/sveltestrap';
	import StateSearch from '$lib/common/shared/StateSearch.svelte';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import TablePagination from '$lib/common/shared/TablePagination.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { ConversationChannel, TimeRange } from '$lib/helpers/enums';
	import { TIME_RANGE_OPTIONS } from '$lib/helpers/constants';
	import { clickoutsideDirective } from '$lib/helpers/directives';
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

	// Get today's date in YYYY-MM-DD format
	const getTodayStr = () => {
		const d = new Date();
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
	};

	// Get yesterday's date in YYYY-MM-DD format
	const getYesterdayStr = () => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
	};

	// Format date for display (YYYY-MM-DD -> MM/DD/YYYY)
	const formatDateForDisplay = (/** @type {string} */ dateStr) => {
		if (!dateStr) return '';
		const [year, month, day] = dateStr.split('-');
		return `${month}/${day}/${year}`;
	};

	// Get time range display text
	const getTimeRangeDisplayText = () => {
		if (searchOption.timeRange === TimeRange.SpecificDay) {
			if (searchOption.startDate && searchOption.endDate) {
				const start = formatDateForDisplay(searchOption.startDate);
				const end = formatDateForDisplay(searchOption.endDate);
				if (start === end) {
					return start;
				}
				return `${start} - ${end}`;
			}
			return 'Custom';
		}
		// Find the label for the selected time range
		const selected = presetTimeRangeOptions.find(x => x.value === searchOption.timeRange);
		return selected ? selected.label : '';
	};

	/** @type {boolean} */
	let isLoading = false;
	let isComplete = false;
	let showStateSearch = false;
	let isPageMounted = false;

	/** @type {boolean} */
	let showDatePicker = false;

	/** @type {HTMLDivElement | null} */
	let datePickerRef = null;

	/** @type {string} */
	let timeRangeDisplayText = '';

	// Update time range display text reactively
	$: {
		if (searchOption.timeRange === TimeRange.SpecificDay && searchOption.startDate && searchOption.endDate) {
			const start = formatDateForDisplay(searchOption.startDate);
			const end = formatDateForDisplay(searchOption.endDate);
			if (start === end) {
				timeRangeDisplayText = start;
			} else {
				timeRangeDisplayText = `${start} - ${end}`;
			}
		} else if (searchOption.timeRange === TimeRange.SpecificDay) {
			timeRangeDisplayText = 'Custom';
		} else {
			const selected = presetTimeRangeOptions.find(x => x.value === searchOption.timeRange);
			timeRangeDisplayText = selected ? selected.label : '';
		}
	}

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

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let agentOptions = [];

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let statusOptions = [
		{ value: 'open', label: 'Active' },
		{ value: 'closed', label: 'Completed' }
	];

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let channelOptions = Object.entries(ConversationChannel).map(([k, v]) => (
		{ value: k.toLowerCase(), label: v }
	));

	// Preset time range options (excluding SpecificDay)
	const presetTimeRangeOptions = TIME_RANGE_OPTIONS
		.filter(x => x.value !== TimeRange.SpecificDay)
		.map(x => ({
			label: x.label,
			value: x.value
		}));

	/** @type {string} */
	let datePickerTab = 'relative';

	/** @type {{ startTime: string | null, endTime: string | null }} */
	let innerTimeRange = {
		startTime: null,
		endTime: null
	};

	/** @type {import('$conversationTypes').ConversationSearchOption} */
	let searchOption = {
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
	};

	/** @type {{key: string, value: string | null}[]} */
    let states = [
        { key: '', value: ''}
    ];

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
		}).catch(err => {
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
		return new Promise((resolve, reject) => {
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
		return searchOption.states.map(x => ({ key: x.key.data, value: x.value.data }));;
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
		} else if (type === 'timeRange') {
			// This handler is no longer used, but kept for compatibility
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

<HeadTitle title="{$_('Conversation List')}" />
<Breadcrumb title="{$_('Communication')}" pagetitle="{$_('Conversations')}" />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	successText={'Delete completed!'}
/>

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex flex-wrap align-items-center justify-content-between">
					<div class="mb-0 card-title flex-grow-0">
						<h5 class="mb-0">{$_('Conversation List')}</h5>
					</div>
					<div class="state-search-btn-wrapper">
						<Button
							color={showStateSearch ? 'secondary' : 'primary'}
							on:click={() => showStateSearch = !showStateSearch}
						>
							<div class="state-search-btn">
								<div>
									{#if showStateSearch}
										<i class="bx bx-hide" />
									{:else}
										<i class="bx bx-search-alt" />
									{/if}
								</div>
								<div class="search-btn-text">{'State Search'}</div>
							</div>
						</Button>						
					</div>
				</div>
			</CardBody>
			{#if showStateSearch}
				<CardBody class="border-bottom">
					<Row class="g-3 justify-content-end">
						<Col lg="6">
							<StateSearch bind:states={states} onSearch={q => handleStateSearch(q)}/>
						</Col>
					</Row>
				</CardBody>
			{/if}
			<CardBody class="border-bottom">
				<Row class="g-3">
					<Col lg="3">
						<Select
							tag={'agent-select'}
							placeholder={'Select Agents'}
							selectedText={'agents'}
							multiSelect
							searchMode
							selectedValues={searchOption.agentIds}
							options={agentOptions}
							on:select={e => changeOption(e, 'agent')}
						/>
					</Col>
					<Col lg="2">
						<Select
							tag={'task-select'}
							placeholder={'Select Status'}
							selectedText={'status'}
							selectedValues={searchOption.status ? [searchOption.status] : []}
							options={statusOptions}
							on:select={e => changeOption(e, 'status')}
						/>
					</Col>
					<Col lg="2">
						<Select
							tag={'channel-select'}
							placeholder={'Select Channel'}
							selectedText={'channel'}
							selectedValues={searchOption.channel ? [searchOption.channel] : []}
							options={channelOptions}
							on:select={e => changeOption(e, 'channel')}
						/>
					</Col>
					<Col lg="2">
						<Input
							type={'text'}
							placeholder={'Tag'}
							maxlength={100}
							on:input={e => changeOption(e, "tags")}
						/>
					</Col>
					<Col lg="2" class="position-relative">
						<button
							type="button"
							class="form-control text-start d-flex align-items-center justify-content-between"
							on:click={() => {
								showDatePicker = !showDatePicker;
								if (showDatePicker) {
									datePickerTab = 'relative';
								}
							}}
							style="cursor: pointer;"
						>
							<span>{timeRangeDisplayText || 'Select time range'}</span>
							<i class="bx bx-chevron-down"></i>
						</button>
						{#if showDatePicker}
							<div
								bind:this={datePickerRef}
								use:clickoutsideDirective
								on:clickoutside={(/** @type {any} */ e) => {
									if (e.detail && e.detail.targetNode && datePickerRef) {
										if (!datePickerRef.contains(e.detail.targetNode)) {
											showDatePicker = false;
										}
									}
								}}
								class="position-absolute top-100 start-0 mt-1 bg-white border rounded shadow-lg"
								style="z-index: 1050; min-width: 320px; max-width: 350px;"
							>
								<ul class="nav nav-tabs border-bottom mb-0 px-2 pt-2" role="tablist">
									<li class="nav-item flex-fill" role="presentation">
										<button
											class="nav-link fw-semibold {datePickerTab === 'relative' ? 'active text-primary' : 'text-muted'}"
											type="button"
											role="tab"
											style="padding: 0.5rem 0.75rem; {datePickerTab === 'relative' ? 'border-bottom: 2px solid var(--bs-primary) !important; margin-bottom: -1px;' : ''}"
											on:click={() => datePickerTab = 'relative'}
										>
											Relative
										</button>
									</li>
									<li class="nav-item flex-fill" role="presentation">
										<button
											class="nav-link fw-semibold {datePickerTab === 'custom' ? 'active text-primary' : 'text-muted'}"
											type="button"
											role="tab"
											style="padding: 0.5rem 0.75rem; {datePickerTab === 'custom' ? 'border-bottom: 2px solid var(--bs-primary) !important; margin-bottom: -1px;' : ''}"
											on:click={() => {
												datePickerTab = 'custom';
												// Set default dates to yesterday and today if not already set
												if (!searchOption.startDate && !searchOption.endDate) {
													searchOption.startDate = getYesterdayStr();
													searchOption.endDate = getTodayStr();
												}
											}}
										>
											Custom
										</button>
									</li>
								</ul>
								
								<div class="p-4">
									{#if datePickerTab === 'relative'}
										<div class="d-flex flex-column gap-2" style="max-height: 300px; overflow-y: auto;">
											{#each presetTimeRangeOptions as option}
												<button
													type="button"
													class="btn btn-sm btn-outline-secondary text-start {searchOption.timeRange === option.value ? 'active' : ''}"
													on:click={(e) => {
														e.preventDefault();
														e.stopPropagation();
														searchOption.timeRange = option.value;
														searchOption.startDate = '';
														searchOption.endDate = '';
														showDatePicker = false;
														refreshFilter();
														initFilterPager();
														getPagedConversations();
													}}
												>
													{option.label}
												</button>
											{/each}
										</div>
									{:else if datePickerTab === 'custom'}
										<div class="mb-3">
											<label for="start-date-picker" class="form-label small mb-2">From:</label>
											<Input
												id="start-date-picker"
												type="date"
												bind:value={searchOption.startDate}
												class="form-control form-control-sm"
											/>
										</div>
										<div class="mb-4">
											<label for="end-date-picker" class="form-label small mb-2">To:</label>
											<Input
												id="end-date-picker"
												type="date"
												bind:value={searchOption.endDate}
												class="form-control form-control-sm"
											/>
										</div>
										<div class="d-flex justify-content-end gap-2 mt-3">
											<Button
												color="secondary"
												size="sm"
												type="button"
												on:click={(e) => {
													e.preventDefault();
													e.stopPropagation();
													showDatePicker = false;
												}}
											>
												Cancel
											</Button>
											<Button
												color="primary"
												size="sm"
												type="button"
												on:click={(e) => {
													e.preventDefault();
													e.stopPropagation();
													if (searchOption.startDate) {
														// If endDate is not provided, default to startDate
														if (!searchOption.endDate) {
															searchOption.endDate = searchOption.startDate;
														}
														// Force reactivity by reassigning the object
														searchOption = {
															...searchOption,
															timeRange: TimeRange.SpecificDay
														};
													}
													showDatePicker = false;
													refreshFilter();
													initFilterPager();
													getPagedConversations();
												}}
											>
												Confirm
											</Button>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</Col>
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