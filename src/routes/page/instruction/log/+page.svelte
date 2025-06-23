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
	import { removeDuplicates } from '$lib/helpers/utils/common';
	import StateSearch from '$lib/common/StateSearch.svelte';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl
	} from '$lib/helpers/utils/common';

    const firstPage = 1;
	const pageSize = 15;
    let isLoading = false;

    const initPager = { page: firstPage, size: pageSize };

    /** @type {import('$commonTypes').Pagination} */
	let pager = { page: firstPage, size: pageSize, count: 0 }

    /** @type {import('$instructTypes').InstructLogFilter} */
    let filter = { ... initPager };

    /** @type {import('$instructTypes').InstructionLogModel[]} */
	let logItems = [];

    /** @type {import('$commonTypes').IdName[]} */
	let agentOptions = [];

    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = [];

    /** @type {any[]} */
    let providerOptions = [];

    /** @type {any[]} */
    let modelOptions = [];

    /** @type {any} */
	let searchOption = {
		agentId: null,
		provider: null,
		model: null,
        template: '',
		states: []
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

		filter = {
			...filter,
			page: pageNum,
			size: pageSizeNum
		};

		setUrlQueryParams($page.url, [
			{ key: 'page', value: `${filter.page}` },
			{ key: 'pageSize', value: `${filter.size}` }
		], () => goToUrl(`${$page.url.pathname}${$page.url.search}`));
		
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
						id: x.id,
						name: x.name
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
                    id: x.provider,
                    name: x.provider,
                    models: x.models || []
                })).sort((a, b) => a.name.localeCompare(b.name));
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
	function refreshPager(totalItemsCount, page = firstPage) {
		pager = {
			...filter,
			page: page,
			count: totalItemsCount
		};
	}

    /**
	 * @param {any} e
	 * @param {string} type
	 */
	function changeOption(e, type) {
        const value = e.target.value;
		if (type === 'agent') {
			searchOption = {
				...searchOption,
				agentId: value || null
			};
		} else if (type === 'provider') {
			searchOption = {
				...searchOption,
				provider: value || null,
                model: null,
			};

            const models = llmConfigs.find(x => x.provider === value)?.models?.map(x => ({
                id: x.name,
                name: x.name
            })) || [];
            const uniqueModels = removeDuplicates(models, 'id');
            modelOptions = uniqueModels.sort((a, b) => a.name.localeCompare(b.name)) || [];
		} else if (type === 'model') {
            searchOption = {
				...searchOption,
				model: value || null
			};
        }
	}


    function search() {
        prepareFilter();
        getPagedInstructionLogs();
    }

    function prepareFilter() {
        const agentId = searchOption.agentId || null;
        const provider = searchOption.provider || null;
        const model = searchOption.model || null;
        const template = util.trim(searchOption.template) || null;
		const states = getSearchStates();

        filter = {
            ...filter,
            page: firstPage,
            agentIds: agentId ? [agentId] : [],
            providers: provider ? [provider] : [],
            models: model ? [model] : [],
            templateNames: template ? [template] : [],
			states: states
        };

		setUrlQueryParams($page.url, [
			{ key: 'page', value: `${firstPage}` }
		], () => goToUrl(`${$page.url.pathname}${$page.url.search}`));
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

		setUrlQueryParams($page.url, [
			{ key: 'page', value: `${pageNum}` }
		], () => goToUrl(`${$page.url.pathname}${$page.url.search}`));

		getPagedInstructionLogs();
	}

	/** @param {string} query */
	function handleStateSearch(query) {
		return new Promise((resolve) => {
			getInstructionLogSearchKeys({
				query: query,
				keyLimit: 20,
				agentIds: searchOption.agentId ? [searchOption.agentId] : null
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
						<select class="form-select" id="idAgent" value={searchOption.agentId} on:change={e => changeOption(e, 'agent')}>
							<option value={null}>{$_('Select Agent')}</option>
							{#each agentOptions as op}
								<option value={`${op.id}`} selected={op.id === searchOption.agentId}>{$_(`${op.name}`)}</option>
							{/each}
						</select>
					</Col>
					<Col lg="2">
						<select class="form-select" id="idProvider" value={searchOption.provider} on:change={e => changeOption(e, 'provider')}>
							<option value={null}>{$_('Select Llm Provider')}</option>
							{#each providerOptions as op}
								<option value={`${op.id}`} selected={op.id === searchOption.provider}>{$_(`${op.name}`)}</option>
							{/each}
						</select>
					</Col>					
					<Col lg="3">
						<select class="form-select" id="idModel" value={searchOption.model} on:change={e => changeOption(e, 'model')}>
							<option value={null}>{$_('Select Llm Model')}</option>
							{#each modelOptions as op}
								<option value={`${op.id}`} selected={op.id === searchOption.model}>{$_(`${op.name}`)}</option>
							{/each}
						</select>
					</Col>
					<Col lg="3">
						<Input bind:value={searchOption.template} maxlength={100} placeholder={'Search template...'} />
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