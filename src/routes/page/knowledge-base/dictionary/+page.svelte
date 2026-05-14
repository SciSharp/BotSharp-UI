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

<style>
    /* ===== Action bar (Hide/Start Search + Reset) ===== */
    .dict-action-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
        margin-bottom: 1.25rem;
    }

    /* ===== Buttons ===== */
    .dict-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        height: 2.25rem;
        padding: 0 0.95rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.2s ease;
    }
    .dict-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .dict-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .dict-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .dict-btn i {
        font-size: 1rem;
        line-height: 1;
    }

    .dict-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.08),
            0 4px 12px -4px color-mix(in srgb, var(--color-primary) 50%, transparent);
    }
    .dict-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.12),
            0 8px 20px -4px color-mix(in srgb, var(--color-primary) 55%, transparent);
    }

    .dict-btn-secondary {
        background-color: rgb(255 255 255);
        border-color: rgb(229 231 235);
        color: rgb(55 65 81);
    }
    .dict-btn-secondary:hover:not(:disabled) {
        background-color: rgb(249 250 251);
        border-color: rgb(209 213 219);
    }

    .dict-btn-danger {
        background-color: var(--color-danger);
        border-color: var(--color-danger);
        color: rgb(255 255 255);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.08),
            0 4px 12px -4px color-mix(in srgb, var(--color-danger) 45%, transparent);
    }
    .dict-btn-danger:hover:not(:disabled) {
        filter: brightness(0.95);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.12),
            0 8px 20px -4px color-mix(in srgb, var(--color-danger) 55%, transparent);
    }

    /* ===== Layout ===== */
    .dict-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .dict-page-col {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
    }

    /* ===== Search card ===== */
    .dict-search-card {
        position: relative;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.875rem;
        padding: 1.25rem 1.25rem 1rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 10px 30px -12px rgb(15 23 42 / 0.08);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        overflow: hidden;
    }
    .dict-search-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        background: linear-gradient(
            90deg,
            transparent 0%,
            var(--color-primary) 30%,
            var(--color-primary) 70%,
            transparent 100%
        );
    }
    .dict-search-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .dict-search-icon {
        flex-shrink: 0;
        width: 2.5rem;
        height: 2.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.625rem;
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
    }
    .dict-search-icon i {
        font-size: 1.25rem;
        line-height: 1;
    }
    .dict-search-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
    .dict-search-sub {
        margin: 0.125rem 0 0;
        font-size: 0.75rem;
        color: var(--color-muted);
    }

    .dict-textarea {
        width: 100%;
        padding: 0.75rem 0.875rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        background-color: rgb(249 250 251);
        font-size: 0.875rem;
        line-height: 1.55;
        color: rgb(17 24 39);
        resize: none;
        min-height: 6.5rem;
        scrollbar-width: thin;
        font-family: inherit;
        transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .dict-textarea::placeholder {
        color: var(--color-muted);
        opacity: 1;
    }
    .dict-textarea:hover:not(:focus):not(:disabled) {
        border-color: rgb(209 213 219);
    }
    .dict-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .dict-textarea:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .dict-meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.6875rem;
        color: var(--color-muted);
    }
    .dict-meta-time,
    .dict-meta-count {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-variant-numeric: tabular-nums;
        transition: color 0.15s ease;
    }
    .dict-meta-row i {
        font-size: 0.875rem;
        line-height: 1;
    }
    .dict-meta-count-warning {
        color: var(--color-warning);
    }

    .dict-search-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.25rem;
    }

    .dict-loader {
        display: flex;
        justify-content: center;
        padding: 2rem 0 1rem;
    }
    .dict-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        padding: 2.25rem 1rem 1rem;
        color: var(--color-muted);
    }
    .dict-empty i {
        font-size: 2.25rem;
        line-height: 1;
        color: color-mix(in srgb, var(--color-primary) 60%, transparent);
    }
    .dict-empty h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .dict-empty p {
        margin: 0;
        font-size: 0.8125rem;
    }

    /* ===== Results card ===== */
    .dict-results-wrap {
        width: 100%;
    }
    .dict-results-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.875rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 10px 30px -12px rgb(15 23 42 / 0.08);
    }
    .dict-results-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgb(243 244 246);
    }
    .dict-results-title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .dict-results-icon {
        flex-shrink: 0;
        width: 2.25rem;
        height: 2.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
    }
    .dict-results-icon i {
        font-size: 1.125rem;
        line-height: 1;
    }
    .dict-results-title-block {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }
    .dict-results-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
    .dict-results-count {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.6875rem;
        color: var(--color-muted);
        font-variant-numeric: tabular-nums;
    }
    .dict-results-count i {
        font-size: 0.875rem;
        line-height: 1;
    }

    /* ===== Controls (Analyzer / Data Providers) ===== */
    .dict-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 0.625rem;
        justify-content: flex-end;
    }
    .dict-control {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 12rem;
    }
    .dict-control-label {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-muted);
    }
    @media (max-width: 600px) {
        .dict-results-head {
            justify-content: center;
        }
        .dict-controls {
            justify-content: center;
            width: 100%;
        }
        .dict-control {
            flex: 1 1 100%;
            min-width: 100%;
        }
    }

    /* ===== Table ===== */
    .dict-table-wrap {
        width: 100%;
        overflow-x: auto;
        scrollbar-width: thin;
    }
    .dict-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.875rem;
        color: rgb(31 41 55);
    }
    .dict-table thead th {
        background-color: rgb(249 250 251);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-muted);
        text-align: left;
        padding: 0.625rem 1rem;
        border-bottom: 1px solid rgb(229 231 235);
        white-space: nowrap;
    }
    /* Hand off styling of <tr>/<td> in TableItem rows via global selectors. */
    .dict-table :global(tbody tr) {
        transition: background-color 0.15s ease;
    }
    .dict-table :global(tbody tr:hover) {
        background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
    }
    .dict-table :global(tbody td) {
        padding: 0.625rem 1rem;
        border-bottom: 1px solid rgb(243 244 246);
        vertical-align: middle;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .dict-search-card,
    :global(.dark) .dict-results-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .dict-results-head {
        border-bottom-color: rgb(55 65 81);
    }
    :global(.dark) .dict-textarea {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .dict-textarea:focus {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .dict-search-title,
    :global(.dark) .dict-results-title,
    :global(.dark) .dict-empty h4 {
        color: rgb(243 244 246);
    }
    :global(.dark) .dict-btn-secondary {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .dict-btn-secondary:hover:not(:disabled) {
        background-color: rgb(75 85 99);
        border-color: rgb(107 114 128);
    }
    :global(.dark) .dict-table thead th {
        background-color: rgb(17 24 39);
        border-bottom-color: rgb(55 65 81);
    }
    :global(.dark) .dict-table :global(tbody td) {
        border-bottom-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .dict-table :global(tbody tr:hover) {
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }
</style>