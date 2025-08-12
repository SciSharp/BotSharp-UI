<script>
    import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
    import util from "lodash";
	import { Button, Card, CardBody, Col, Input, Row, Table } from '@sveltestrap/sveltestrap';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import TablePagination from '$lib/common/TablePagination.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import { getInstructionLogs, getInstructionLogSearchKeys } from '$lib/services/instruct-service';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import LogItem from './log-item.svelte';
	import { convertTimeRange, removeDuplicates } from '$lib/helpers/utils/common';
	import StateSearch from '$lib/common/StateSearch.svelte';
	import Select from '$lib/common/Select.svelte';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl
	} from '$lib/helpers/utils/common';
	import { TimeRange } from '$lib/helpers/enums';
	import { TIME_RANGE_OPTIONS } from '$lib/helpers/constants';

    const firstPage = 1;
	const pageSize = 15;
    let isLoading = false;

    const initPager = { page: firstPage, size: pageSize };

	const timeRangeOptions = TIME_RANGE_OPTIONS.map(x => ({
		label: x.label,
		value: x.value
	}));

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
		const { pageNum, pageSizeNum } = getPagingQueryParams({
			page: $page.url.searchParams.get("page"),
			pageSize: $page.url.searchParams.get("pageSize")
		}, { defaultPageSize: pageSize });
		innerTimeRange = convertTimeRange(searchOption.timeRange);

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
		], () => goToUrl(`${$page.url.pathname}${$page.url.search}`));
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
			searchOption = {
				...searchOption,
				timeRange: selectedValues.length > 0 ? selectedValues[0] : null
			};
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
		innerTimeRange = convertTimeRange(searchOption.timeRange);

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
					<Col lg="2">
						<Select
							tag={'instruct-datetime-select'}
							placeholder={'Select time range'}
							selectedText={''}
							selectedValues={searchOption.timeRange ? [searchOption.timeRange] : []}
							options={timeRangeOptions}
							on:select={e => changeOption(e, 'timeRange')}
						/>
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
                                <LogItem
                                    item={item}
                                />
                            {/each}
						</tbody>
					</Table>
				</div>
				<TablePagination pagination={pager} pageTo={(pn) => pageTo(pn)} />
			</CardBody>
		</Card>
	</Col>
</Row>