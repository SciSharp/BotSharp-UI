<script>
    import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
    import util from "lodash";
	import { Button, Card, CardBody, Col, Input, Row, Table } from '@sveltestrap/sveltestrap';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import TablePagination from '$lib/common/shared/TablePagination.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import { getInstructionLogSearchKeys } from '$lib/services/instruct-service';
	import { getInstructionLogs } from '$lib/services/logging-service';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { convertTimeRange, removeDuplicates } from '$lib/helpers/utils/common';
	import StateSearch from '$lib/common/shared/StateSearch.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl
	} from '$lib/helpers/utils/common';
	import { TimeRange } from '$lib/helpers/enums';
	import { TIME_RANGE_OPTIONS, CUSTOM_DATE_RANGE } from '$lib/helpers/constants';
	import { clickoutsideDirective } from '$lib/helpers/directives';
	import LogItem from './log-item.svelte';

    const firstPage = 1;
	const pageSize = 15;
    let isLoading = false;
	let isPageMounted = false;

    const initPager = { page: firstPage, size: pageSize };

	// Preset time range options (excluding custom date)
	const presetTimeRangeOptions = TIME_RANGE_OPTIONS
		.filter(x => x.value !== CUSTOM_DATE_RANGE)
		.map(x => ({
			label: x.label,
			value: x.value
		}));

	/** @type {string} */
	let datePickerTab = 'relative';

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
		if (searchOption.timeRange === CUSTOM_DATE_RANGE) {
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

    /** @type {import('$commonTypes').Pagination} */
	let pager = { page: firstPage, size: pageSize, count: 0 }

    /** @type {import('$instructTypes').InstructLogFilter} */
    let filter = { ... initPager };

    /** @type {import('$instructTypes').InstructionLogModel[]} */
	let logItems = [];

    /** @type {import('$commonTypes').LabelValuePair[]} */
	let agentOptions = [];

    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = [];

    /** @type {any[]} */
    let providerOptions = [];

    /** @type {any[]} */
    let modelOptions = [];

    /** @type {any} */
	let searchOption = {
		agentIds: [],
		providers: [],
		models: [],
        template: '',
		timeRange: TimeRange.Today,
		startDate: '',
		endDate: '',
		states: []
	};

	/** @type {{ startTime: string | null, endTime: string | null }} */
	let innerTimeRange = {
		startTime: null,
		endTime: null
	};

	/** @type {boolean} */
	let showStateSearch = false;

	/** @type {string} */
	let timeRangeDisplayText = '';

	// Update time range display text reactively
	$: {
		if (searchOption.timeRange === CUSTOM_DATE_RANGE && searchOption.startDate && searchOption.endDate) {
			const start = formatDateForDisplay(searchOption.startDate);
			const end = formatDateForDisplay(searchOption.endDate);
			if (start === end) {
				timeRangeDisplayText = start;
			} else {
				timeRangeDisplayText = `${start} - ${end}`;
			}
		} else if (searchOption.timeRange === CUSTOM_DATE_RANGE) {
			timeRangeDisplayText = 'Custom';
		} else {
			const selected = presetTimeRangeOptions.find(x => x.value === searchOption.timeRange);
			timeRangeDisplayText = selected ? selected.label : '';
		}
	}

	/** @type {boolean} */
	let showDatePicker = false;

	/** @type {HTMLDivElement | null} */
	let datePickerRef = null;

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
		innerTimeRange = convertTimeRange(searchOption.timeRange, searchOption.startDate, searchOption.endDate);

		filter = {
			...filter,
			startTime: innerTimeRange.startTime,
			endTime: innerTimeRange.endTime,
			page: pageNum,
			size: pageSizeNum
		};
		
        Promise.all([
            initAgentOptions(),
            initLlmConfigs(),
            initLogs()
        ]);
    });

    function initAgentOptions() {
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

    function initLlmConfigs() {
        return new Promise((resolve, reject) => {
			getLlmConfigs().then(res => {
				llmConfigs = res || [];
                providerOptions = llmConfigs.map(x => ({
					label: x.provider,
					value: x.provider,
                    models: x.models || []
                })).sort((a, b) => a.label.localeCompare(b.label));
                modelOptions = [];
				resolve(llmConfigs);
			}).catch((error) => {
				llmConfigs = [];
                providerOptions = [];
                modelOptions = []
				reject(error);
			});
		});
    }

    function initLogs() {
        return getPagedInstructionLogs();
    }

    function getPagedInstructionLogs() {
        logItems = [];
        isLoading = true;
        return new Promise((resolve, reject) => {
            getInstructionLogs(filter).then(res => {
                refresh(res);
                resolve(res);
            }).finally(() => {
                isLoading = false;
            });
        });
    }

    /** @param {import('$commonTypes').PagedItems<import('$instructTypes').InstructionLogModel>} logs */
    function refresh(logs) {
		refreshLogs(logs);
		refreshPager(logs.count, filter.page);
	}

    /** @param {import('$commonTypes').PagedItems<import('$instructTypes').InstructionLogModel>} logs */
	function refreshLogs(logs) {
        logItems = [ ...logs.items ];
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, pageNum = firstPage) {
		pager = {
			...filter,
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

    /**
	 * @param {any} e
	 * @param {string} type
	 */
	function changeOption(e, type) {
		// @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];

		if (type === 'agent') {
			searchOption = {
				...searchOption,
				agentIds: selectedValues
			};
		} else if (type === 'provider') {
			searchOption = {
				...searchOption,
				// @ts-ignore
				providers: selectedValues,
                models: [],
			};

			if (selectedValues.length > 0) {
				const models = llmConfigs.find(x => x.provider === selectedValues[0])?.models?.map(x => ({
					label: x.name,
					value: x.name
				})) || [];
				const uniqueModels = removeDuplicates(models, 'label');
				modelOptions = uniqueModels.sort((a, b) => a.label.localeCompare(b.label)) || [];
			} else {
				modelOptions = [];
			}
		} else if (type === 'model') {
            searchOption = {
				...searchOption,
				models: selectedValues
			};
        } else if (type === 'timeRange') {
			// This handler is no longer used, but kept for compatibility
		}
	}


    function search() {
        prepareFilter();
        getPagedInstructionLogs();
    }

    function prepareFilter() {
        const agentIds = searchOption.agentIds;
        const providers = searchOption.providers;
        const models = searchOption.models;
        const template = util.trim(searchOption.template) || null;
		const states = getSearchStates();
		innerTimeRange = convertTimeRange(searchOption.timeRange, searchOption.startDate, searchOption.endDate);

        filter = {
            ...filter,
            page: firstPage,
            agentIds: agentIds,
            providers: providers,
            models: models,
            templateNames: template ? [template] : [],
			startTime: innerTimeRange.startTime,
			endTime: innerTimeRange.endTime,
			states: states
        };
    }

	function getSearchStates() {
		searchOption.states = states?.filter(x => !!util.trim(x.key))?.map(x => ({
			key: util.trim(x.key),
			value: util.trim(x.value) || ''
		})) || [];
		// @ts-ignore
		return searchOption.states.map(x => ({ key: x.key, value: x.value }));;
	}

    /** @param {number} pageNum */
	function pageTo(pageNum) {
		filter = {
			...filter,
			page: pageNum
		};

		getPagedInstructionLogs();
	}

	/** @param {string} query */
	function handleStateSearch(query) {
		return new Promise((resolve) => {
			getInstructionLogSearchKeys({
				query: query,
				keyLimit: 20,
				agentIds: searchOption.agentIds,
				startTime: innerTimeRange.startTime,
				endTime: innerTimeRange.endTime
			}).then(res => {
				resolve(res || []);
			}).catch(() => resolve([]));
		});
	}
</script>


<HeadTitle title="{$_('Instruction Log')}" />
<Breadcrumb pagetitle="{$_('Log')}" title="{$_('Instruction')}"/>

<LoadingToComplete isLoading={isLoading} />

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex flex-wrap align-items-center justify-content-between">
					<div class="mb-0 card-title flex-grow-0">
						<h5 class="mb-0 card-title flex-grow-1">{$_('Log List')}</h5>
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
							<StateSearch bind:states={states} onSearch={(query) => handleStateSearch(query)} />
						</Col>
					</Row>
				</CardBody>
			{/if}
			<CardBody class="border-bottom">
				<Row class="g-3">
					<Col lg="3">
						<Select
							tag={'agent-select'}
							placeholder={'Select agents'}
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
							tag={'llm-provider-select'}
							placeholder={'Select LLM provider'}
							searchMode
							selectedValues={searchOption.providers}
							options={providerOptions}
							on:select={e => changeOption(e, 'provider')}
						/>
					</Col>
					<Col lg="2">
						<Select
							tag={'llm-model-select'}
							placeholder={'Select LLM model'}
							selectedText={'models'}
							multiSelect
							searchMode
							selectedValues={searchOption.models}
							options={modelOptions}
							on:select={e => changeOption(e, 'model')}
						/>
					</Col>
					<Col lg="2">
						<Input bind:value={searchOption.template} maxlength={100} placeholder={'Search template...'} />
					</Col>
					<Col lg="2" class="position-relative">
						<button
							type="button"
							class="form-control text-start d-flex align-items-center justify-content-between"
							on:click={() => {
								showDatePicker = !showDatePicker;
								if (showDatePicker) {
									// If custom date is selected, switch to custom tab; otherwise use relative tab
									datePickerTab = searchOption.timeRange === CUSTOM_DATE_RANGE ? 'custom' : 'relative';
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
														search();
													}}
												>
													{option.label}
												</button>
											{/each}
										</div>
									{:else if datePickerTab === 'custom'}
										<div class="mb-3">
											<label for="start-date-picker-log" class="form-label small mb-2">From:</label>
											<Input
												id="start-date-picker-log"
												type="date"
												bind:value={searchOption.startDate}
												class="form-control form-control-sm"
											/>
										</div>
										<div class="mb-4">
											<label for="end-date-picker-log" class="form-label small mb-2">To:</label>
											<Input
												id="end-date-picker-log"
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
															timeRange: CUSTOM_DATE_RANGE
														};
													}
													showDatePicker = false;
													search();
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
							on:click={(e) => search()}
						>
							<i class="mdi mdi-filter-outline align-middle" />
							<span class="d-none">{$_('Filter')}</span>
						</Button>
					</Col>
				</Row>
			</CardBody>
			<CardBody>
				<div class="table-responsive thin-scrollbar">
					<Table class="align-middle nowrap users-table" bordered>
						<thead>
							<tr>
								<th scope="col" class="instruction-log-col ellipsis">{$_('Agent')}</th>
								<th scope="col" class="instruction-log-col ellipsis">{$_('Llm Provider')}</th>
								<th scope="col" class="instruction-log-col ellipsis">{$_('Llm Model')}</th>
								<th scope="col" class="instruction-log-col ellipsis">{$_('Template')}</th>
								<th scope="col" class="instruction-log-col ellipsis">{$_('Caller')}</th>
                                <th scope="col" class="instruction-log-col ellipsis">{$_('Created Time')}</th>
								<th scope="col">{$_('')}</th>
							</tr>
						</thead>
						<tbody>
							{#each logItems as item, idx (idx)}
                                <LogItem item={item} />
                            {/each}
						</tbody>
					</Table>
				</div>
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</CardBody>
		</Card>
	</Col>
</Row>