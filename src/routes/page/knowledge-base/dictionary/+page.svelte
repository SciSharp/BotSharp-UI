<script>
	import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
    import {
		getEntityAnalyzers,
		getEntityDataLoaders,
		executeKnowledgeQuery
    } from '$lib/services/knowledge-base-service';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingDots from '$lib/common/spinners/LoadingDots.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import TableItem from '../common/table/table-item.svelte';
	import { KnowledgeBaseType } from '$lib/helpers/enums';

	const knowledgeType = KnowledgeBaseType.Taxonomy;
	const maxLength = 4096;
    const columns = [
        {
            dataName: "token",
            displayName: "Text"
        },
        {
            dataName: "canonical_text",
            displayName: "Canonical Text"
        }
    ];

	/** @type {string} */
	let text = $state("");
	let successText = $state("Done");
	let errorText = $state("Error");
	let elapsedTime = $state('');

	/** @type {string | null} */
	let selectedAnalyzer = $state(null);

    /** @type {string[]} */
    let selectedDataLoaders = $state([]);

	/** @type {import('$knowledgeTypes').KnowledgeQueryViewModel[]} */
	let items = $state([]);

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let analyzers = $state([]);

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let dataLoaders = $state([]);

	/** @type {number | null | undefined} */
	let totalDataCount = $state(/** @type {number | null | undefined} */ (undefined));

	/** @type {boolean} */
	let showDemo = $state(true);
	let isSearching = $state(false);
	let searchDone = $state(false);
	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);

	let disableSearchBtn = $derived(
		!selectedAnalyzer || isSearching || !text || util.trim(text).length === 0
	);

	onMount(() => {
		initData();
	});

	function initData() {
		isLoading = true;
        Promise.all([
            getAnalyzerProviders(),
            getDataLoaderProviders()
        ]).finally(() => {
			isLoading = false;
		});
	}


	// Search knowledge
	function toggleDemo() {
		showDemo = !showDemo;
	}

	function search() {
		items = [];
		isSearching = true;
		searchDone = false;
		elapsedTime = '';
		const start = new Date();

        getAnalysisResult().finally(() => {
            isSearching = false;
            searchDone = true;
            const gap = new Date().getTime() - start.getTime();
            elapsedTime = `${(gap / 1000).toFixed(3)}s`;
        });
	}

	/** @param {KeyboardEvent} e */
	function pressKey(e) {
		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !util.trim(text) || isSearching) {
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
		}

		search();
	}

	function reset() {
		resetStates();
	}

	function resetStates() {
		text = "";
		elapsedTime = '';
		isSearching = false;
        searchDone = false;
        items = [];
        totalDataCount = null;
        selectedDataLoaders = [];
	}

	function getAnalyzerProviders() {
		return new Promise((resolve, reject) => {
			getEntityAnalyzers().then(res => {
				const retProviders = res?.map(x => ({  label: x, value: x })) || [];
				analyzers = [ ...retProviders ];
				selectedAnalyzer = analyzers[0]?.value;
				resolve(res);
			}).catch(err => {
				analyzers = [];
				selectedAnalyzer = null;
				reject(err);
			});
		});
	}

    function getDataLoaderProviders() {
		return new Promise((resolve, reject) => {
			getEntityDataLoaders().then(res => {
				const retProviders = res?.map(x => ({  label: x, value: x })) || [];
				dataLoaders = [ ...retProviders ];
				resolve(res);
			}).catch(err => {
				dataLoaders = [];
				reject(err);
			});
		});
	}

    function getAnalysisResult() {
        return new Promise((resolve, reject) => {
			/** @type {import('$knowledgeTypes').KnowledgeQueryRequest} */
            const request = {
                text: util.trim(text),
                dataProviders: selectedDataLoaders?.length > 0 ? selectedDataLoaders : null
            };

            executeKnowledgeQuery(knowledgeType, request, knowledgeType, selectedAnalyzer).then(res => {
                items = res || [];
                totalDataCount = items.length;
                resolve(res);
            }).catch(err => {
                totalDataCount = null;
                console.log(err);
                reject(err);
            });
        });
    }

	/** @param {any} e */
	function changeAnalyzer(e) {
		const selectedValues = e?.detail?.selecteds || [];
		selectedAnalyzer = selectedValues[0]?.value;
	}

    /** @param {any} e */
	function changeDataLoaders(e) {
		const selectedValues = e?.detail?.selecteds || [];
		// @ts-ignore
		selectedDataLoaders = selectedValues.map(x => x.value);
	}
</script>

<HeadTitle title={$_('Dictionary')} addOn="Knowledge Base" />
<Breadcrumb pagetitle={$_('Dictionary')} title={$_('Knowledge Base')}/>

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

<div class="knowledge-demo-btn mb-4">
	<div class="demo-btn">
		<button
			class={`btn btn-${showDemo ? 'danger' : 'primary'}`}
			onclick={() => toggleDemo()}
		>
			{#if !showDemo}
				<div class="btn-content">
					<div class="knowledge-btn-icon"><i class="bx bx-search-alt"></i></div>
					<div>{'Start Search'}</div>
				</div>
			{:else}
				<div class="btn-content">
					<div class="knowledge-btn-icon"><i class="bx bx-hide"></i></div>
					<div>{'Hide Search'}</div>
				</div>
			{/if}
		</button>
	</div>

	<div class="reset-btn">
		<button
			class="btn btn-secondary"
			onclick={() => reset()}
		>
			<div class="btn-content">
				<div class="knowledge-btn-icon"><i class="bx bx-reset"></i></div>
				<div>{'Reset'}</div>
			</div>
		</button>
	</div>
</div>

<div class="d-xl-flex">
	<div class="w-100">
		{#if showDemo}
			<div
				in:fly={{ y: -10, duration: 500 }}
				out:fly={{ y: -10, duration: 200 }}
			>
				<div class="knowledge-search-container mb-4">
					<textarea
						class='form-control knowledge-textarea'
						rows={5}
						maxlength={maxLength}
						disabled={isSearching}
						placeholder={'Start searching here...'}
						bind:value={text}
						onkeydown={(e) => pressKey(e)}
					></textarea>
					<div class="text-secondary text-count d-flex justify-content-between">
						<div>
							{#if elapsedTime}
								{`Elapsed time: ${elapsedTime}`}
							{/if}
						</div>
						<div>{text?.length || 0}/{maxLength}</div>
					</div>
				
                    <div class="mt-3 knowledge-search-footer">
                        <div class="search-input"></div>
                        <div class="line-align-center">
							<button
								class="btn btn-primary"
								disabled={disableSearchBtn}
								onclick={() => search()}
							>
								{'Search'}
							</button>
                        </div>
                    </div>
				
					{#if isSearching}
						<div class="knowledge-loader mt-5">
							<LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
						</div>
					{:else if searchDone && (!items || items.length === 0)}
						<div class="mt-5 text-center">
							<h4 class="text-secondary">{"Ehhh, no idea..."}</h4>
						</div>
					{/if}
			  	</div>
			</div>
		{/if}
		<div class="d-md-flex mt-5">
			<div class="w-100">
				<div class="card">
					<div class="card-body">
						<div class="mt-2 knowledge-table-header">
							{#if totalDataCount != null && totalDataCount != undefined}
								<div class="knowledge-count line-align-center text-muted font-size-12">
									{`Total data: ${Number(totalDataCount).toLocaleString("en-US")}`}
								</div>
							{/if}
							<div class="d-flex flex-wrap mb-3 justify-content-between">
								<div class="action-container-padding d-flex" style="gap: 5px;">
									<h5 class="knowledge-header-text line-align-center font-size-16">
										<div>{$_('Dictionary')}</div>
									</h5>
								</div>
								<div class="collection-action-container action-container-padding">
									<div class="collection-dropdown-container">
										<div class="line-align-center collection-dropdown">
                                            <div>Analyzer</div>
											<Select
												tag={'entity-analyzer-select'}
												placeholder={'Select Analyzer'}
												searchMode
												selectedValues={selectedAnalyzer ? [selectedAnalyzer] : []}
												options={analyzers}
												onselect={e => changeAnalyzer(e)}
											/>
										</div>
                                        <div class="line-align-center collection-dropdown">
                                            <div>Data Providers</div>
											<Select
												tag={'entity-data-loader-select'}
												placeholder={'Select Data Providers'}
												searchMode
                                                selectAll
                                                multiSelect
												selectedValues={selectedDataLoaders}
												options={dataLoaders}
												onselect={e => changeDataLoaders(e)}
											/>
										</div>
									</div>
								</div>
							</div>
						  
							<hr class="mt-2" />
						  
							<div class="table-responsive knowledge-table">
								<table class="table align-middle table-nowrap table-hover mb-0">
									<thead>
										<tr>
                                            {#each columns as column, idx (idx) }
                                                <th scope="col" style="width: 40%;">{column.displayName}</th>
                                            {/each}
											<th style="width: 20%;"></th>
										</tr>
									</thead>
									<tbody>
										{#each items as item, idx (idx)}
                                            <TableItem
												item={item.data}
                                                columns={columns}
												open={idx === 0}
											/>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>