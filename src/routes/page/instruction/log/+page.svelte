<script>
    import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
    import util from "lodash";
	import { Button, Card, CardBody, Col, Input, Row, Table } from '@sveltestrap/sveltestrap';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import TablePagination from '$lib/common/TablePagination.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import { getInstructionLogs } from '$lib/services/instruct-service';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import LogItem from './log-item.svelte';
	import { removeDuplicates } from '$lib/helpers/utils/common';

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
        template: ''
	};

    onMount(async () => {
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
        filter = {
            ...initPager
        };
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
		refreshPager(logs.count, filter.page, filter.size);
	}

    /** @param {import('$commonTypes').PagedItems<import('$instructTypes').InstructionLogModel>} logs */
	function refreshLogs(logs) {
        logItems = [ ...logs.items ];
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, page = firstPage, pageCount = pageSize) {
		pager = {
			page: page,
			size: pageCount,
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

        filter = {
            ...filter,
            page: firstPage,
            agentIds: agentId ? [agentId] : null,
            providers: provider ? [provider] : null,
            models: model ? [model] : null,
            templateNames: template ? [template] : null
        };
    }

    /** @param {number} pageNum */
	function pageTo(pageNum) {
		filter = {
			...filter,
			page: pageNum,
            size: pageSize
		};
		getPagedInstructionLogs();
	}
</script>


<HeadTitle title="{$_('Instruction Log')}" />
<Breadcrumb pagetitle="{$_('Log')}" title="{$_('Instruction')}"/>
<LoadingToComplete isLoading={isLoading} />

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('Log List')}</h5>
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