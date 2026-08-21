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
	import { formatNumber } from '$lib/helpers/utils/common';

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

<div class="dict-action-bar">
	<button
		type="button"
		class={`dict-btn ${showDemo ? 'dict-btn-danger' : 'dict-btn-primary'}`}
		onclick={() => toggleDemo()}
	>
		{#if !showDemo}
			<i class="bx bx-search-alt"></i>
			<span>{'Start Search'}</span>
		{:else}
			<i class="bx bx-hide"></i>
			<span>{'Hide Search'}</span>
		{/if}
	</button>

	<button
		type="button"
		class="dict-btn dict-btn-secondary"
		onclick={() => reset()}
	>
		<i class="bx bx-reset"></i>
		<span>{'Reset'}</span>
	</button>
</div>

<div class="dict-page">
	<div class="dict-page-col">
		{#if showDemo}
			<div
				in:fly={{ y: -10, duration: 500 }}
				out:fly={{ y: -10, duration: 200 }}
			>
				<div class="dict-search-card">
					<div class="dict-search-head">
						<span class="dict-search-icon">
							<i class="bx bx-search-alt"></i>
						</span>
						<div>
							<h4 class="dict-search-title">Search the Dictionary</h4>
							<p class="dict-search-sub">Tokenize and resolve text.</p>
						</div>
					</div>

					<textarea
						class="dict-textarea"
						rows={5}
						maxlength={maxLength}
						disabled={isSearching}
						placeholder={'Start searching here...'}
						bind:value={text}
						onkeydown={(e) => pressKey(e)}
					></textarea>

					<div class="dict-meta-row">
						<div class="dict-meta-time">
							{#if elapsedTime}
								<i class="mdi mdi-timer-outline"></i>
								<span>{`Elapsed: ${elapsedTime}`}</span>
							{/if}
						</div>
						<div class="dict-meta-count" class:dict-meta-count-warning={(text?.length || 0) > maxLength * 0.8}>
							<i class="mdi mdi-counter"></i>
							<span>{formatNumber(text?.length || 0)} / {formatNumber(maxLength)}</span>
						</div>
					</div>

					<div class="dict-search-footer">
						<button
							type="button"
							class="dict-btn dict-btn-primary"
							disabled={disableSearchBtn}
							onclick={() => search()}
						>
							<i class="bx bx-search-alt"></i>
							<span>{'Search'}</span>
						</button>
					</div>

					{#if isSearching}
						<div class="dict-loader">
							<LoadingDots duration={'1s'} size={12} gap={5} color={'var(--color-primary)'} />
						</div>
					{:else if searchDone && (!items || items.length === 0)}
						<div class="dict-empty">
							<i class="mdi mdi-magnify-scan"></i>
							<h4>Ehhh, no idea...</h4>
							<p>No matches were returned for that input.</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
		<div class="dict-results-wrap">
			<div class="dict-results-card">
				<div class="dict-results-head">
					<div class="dict-results-title-row">
						<span class="dict-results-icon">
							<i class="mdi mdi-book-alphabet"></i>
						</span>
						<div class="dict-results-title-block">
							<h5 class="dict-results-title">{$_('Dictionary')}</h5>
							{#if totalDataCount != null && totalDataCount != undefined}
								<span class="dict-results-count">
									<i class="mdi mdi-database-outline"></i>
									{`${formatNumber(totalDataCount)} ${totalDataCount === 1 ? 'entry' : 'entries'}`}
								</span>
							{/if}
						</div>
					</div>

					<div class="dict-controls">
						<div class="dict-control">
							<span class="dict-control-label">Analyzer</span>
							<Select
								tag={'entity-analyzer-select'}
								placeholder={'Select Analyzer'}
								searchMode
								selectedValues={selectedAnalyzer ? [selectedAnalyzer] : []}
								options={analyzers}
								onselect={e => changeAnalyzer(e)}
							/>
						</div>
						<div class="dict-control">
							<span class="dict-control-label">Data Providers</span>
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

				<div class="dict-table-wrap">
					<table class="dict-table">
						<thead>
							<tr>
								{#each columns as column, idx (idx)}
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

