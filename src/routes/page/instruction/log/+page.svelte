<script>
    import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
    import util from "lodash";
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
	import TimeRangePicker from '$lib/common/shared/TimeRangePicker.svelte';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl
	} from '$lib/helpers/utils/common';
	import { TimeRange } from '$lib/helpers/enums';
	import LogItem from './log-item.svelte';

    const firstPage = 1;
	const pageSize = 15;
    let isLoading = false;
	let isPageMounted = false;

    const initPager = { page: firstPage, size: pageSize };

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
        return new Promise((resolve) => {
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

<div class="row">
	<div class="col-lg-12">
		<div class="card">
			<div class="card-body border-bottom">
				<div class="d-flex flex-wrap align-items-center justify-content-between">
					<div class="mb-0 card-title flex-grow-0">
						<h5 class="mb-0 card-title flex-grow-1">{$_('Log List')}</h5>
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
							<StateSearch bind:states={states} onSearch={(query) => handleStateSearch(query)} />
						</div>
					</div>
				</div>
			{/if}
			<div class="card-body border-bottom">
				<div class="row g-3">
					<div class="col-lg-3">
						<Select
							tag={'agent-select'}
							placeholder={'Select agents'}
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
							tag={'llm-provider-select'}
							placeholder={'Select LLM provider'}
							searchMode
							selectedValues={searchOption.providers}
							options={providerOptions}
							onselect={e => changeOption(e, 'provider')}
						/>
					</div>
					<div class="col-lg-2">
						<Select
							tag={'llm-model-select'}
							placeholder={'Select LLM model'}
							selectedText={'models'}
							multiSelect
							searchMode
							selectedValues={searchOption.models}
							options={modelOptions}
							onselect={e => changeOption(e, 'model')}
						/>
					</div>
					<div class="col-lg-2">
						<input
							type="text"
							class="form-control"
							bind:value={searchOption.template}
							maxlength={100}
							placeholder={'Search template...'}
						/>
					</div>
					<div class="col-lg-2">
						<TimeRangePicker
							storageKey="botsharp_instruction_recent_time_ranges"
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
							onclick={() => search()}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="d-none">{$_('Filter')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="card-body">
				<div class="table-responsive thin-scrollbar">
					<table class="table table-bordered align-middle nowrap users-table">
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
								<LogItem {item} />
							{/each}
						</tbody>
					</table>
				</div>
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</div>
		</div>
	</div>
</div>