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
	import { convertTimeRange, removeDuplicates, formatNumber } from '$lib/helpers/utils/common';
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

<div class="flex flex-wrap">
	<div class="w-full">
		<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
							<i class="mdi mdi-text-box-search-outline text-xl"></i>
						</span>
						<div>
							<h5 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Log List')}</h5>
							<p class="mb-0 text-xs text-muted">{formatNumber(pager.count)} {pager.count === 1 ? 'log entry' : 'log entries'} total</p>
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
				<div class="instruct-state-search border-b border-gray-100 px-6 py-4 dark:border-gray-700">
					<div class="flex justify-end">
						<div class="w-full lg:w-1/2">
							<StateSearch bind:states={states} onSearch={(query) => handleStateSearch(query)} />
						</div>
					</div>
				</div>
			{/if}
			<div class="instruct-filter border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
					<div class="lg:col-span-3">
						<Select
							tag={'agent-select'}
							placeholder={'Select agents'}
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
							tag={'llm-provider-select'}
							placeholder={'Select LLM provider'}
							searchMode
							selectedValues={searchOption.providers}
							options={providerOptions}
							onselect={e => changeOption(e, 'provider')}
						>
							{#snippet prefixIcon()}
								<i class="mdi mdi-chip"></i>
							{/snippet}
						</Select>
					</div>
					<div class="lg:col-span-2">
						<Select
							tag={'llm-model-select'}
							placeholder={'Select LLM model'}
							selectedText={'models'}
							multiSelect
							searchMode
							selectedValues={searchOption.models}
							options={modelOptions}
							onselect={e => changeOption(e, 'model')}
						>
							{#snippet prefixIcon()}
								<i class="mdi mdi-cube-outline"></i>
							{/snippet}
						</Select>
					</div>
					<div class="lg:col-span-2">
						<div class="relative">
							<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
								<i class="mdi mdi-file-document-outline text-base leading-none"></i>
							</span>
							<input
								type="text"
								class="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								bind:value={searchOption.template}
								maxlength={100}
								placeholder={'Search template...'}
							/>
						</div>
					</div>
					<div class="lg:col-span-2">
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
							onclick={() => search()}
						>
							<i class="mdi mdi-filter-outline align-middle"></i>
							<span class="sr-only">{$_('Filter')}</span>
						</button>
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<div class="thin-scrollbar overflow-x-auto rounded-lg ring-1 ring-gray-100 dark:ring-gray-700">
					<table class="instruct-table w-full border-collapse text-sm">
						<thead class="bg-gray-50 dark:bg-gray-700/50">
							<tr>
								<th scope="col" class="instruction-log-col">{$_('Agent')}</th>
								<th scope="col" class="instruction-log-col">{$_('Llm Provider')}</th>
								<th scope="col" class="instruction-log-col">{$_('Llm Model')}</th>
								<th scope="col" class="instruction-log-col">{$_('Template')}</th>
								<th scope="col" class="instruction-log-col">{$_('Caller')}</th>
								<th scope="col" class="instruction-log-col">{$_('Created Time')}</th>
								<th scope="col" class="text-start">{$_('Action')}</th>
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

