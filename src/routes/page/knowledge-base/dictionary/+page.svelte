<script>
	import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import {
        Button,
        Card,
        CardBody,
        Table
    } from '@sveltestrap/sveltestrap';
    import {
		getTokenizers,
		getTokenizerDataLoaders,
		tokenize
    } from '$lib/services/knowledge-base-service';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import Select from '$lib/common/Select.svelte';
	import TableItem from '../common/table/table-item.svelte';
	
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
	let text = "";
	let successText = "Done";
	let errorText = "Error";
	let elapsedTime = '';

	/** @type {string | null} */
	let selectedTokenizer = null;

    /** @type {string[]} */
    let selectedDataLoaders = [];

	/** @type {import('$knowledgeTypes').TokenizeResult[]} */
	let items = [];

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let tokenizers = [];

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let tokenizerDataLoaders = [];

	/** @type {number | null | undefined} */
	let totalDataCount;

	/** @type {boolean} */
	let showDemo = true;
    let disableSearchBtn = false;
	let isSearching = false;
	let searchDone = false;
	let isLoading = false;
	let isComplete = false;
	let isError = false;

	$: {
		disableSearchBtn = false;
		if (!selectedTokenizer || isSearching) {
			disableSearchBtn = true;
		} else if (!text || util.trim(text).length === 0) {
			disableSearchBtn = true;
		}
	}

	onMount(() => {
		initData();
	});

	function initData() {
		isLoading = true;
        Promise.all([
            getTokenizerProviders(),
            getTokenizerDataLoaderProviders()
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

        getTokenizeResult().finally(() => {
            isSearching = false;
            searchDone = true;
            const gap = new Date().getTime() - start.getTime();
            elapsedTime = `${(gap / 1000).toFixed(3)}s`;
        });
	}

	/** @param {KeyboardEvent} e */
	function pressKey(e) {
		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !!!util.trim(text) || isSearching) {
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

	function getTokenizerProviders() {
		return new Promise((resolve, reject) => {
			getTokenizers().then(res => {
				const retProviders = res?.map(x => ({  label: x, value: x })) || [];
				tokenizers = [ ...retProviders ];
				selectedTokenizer = tokenizers[0]?.value;
				resolve(res);
			}).catch(err => {
				tokenizers = [];
				selectedTokenizer = tokenizers[0]?.value;
				reject(err);
			});
		});
	}

    function getTokenizerDataLoaderProviders() {
		return new Promise((resolve, reject) => {
			getTokenizerDataLoaders().then(res => {
				const retProviders = res?.map(x => ({  label: x, value: x })) || [];
				tokenizerDataLoaders = [ ...retProviders ];
				resolve(res);
			}).catch(err => {
				tokenizerDataLoaders = [];
				reject(err);
			});
		});
	}

    function getTokenizeResult() {
        return new Promise((resolve, reject) => {
            const request = {
                text: util.trim(text),
                provider: selectedTokenizer,
                options: {
                    data_providers: selectedDataLoaders?.length > 0 ? selectedDataLoaders : null
                }
            };

            tokenize(request).then(res => {
                items = res?.results || [];
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
	function changeTokenizer(e) {
		const selectedValues = e?.detail?.selecteds || [];
		selectedTokenizer = selectedValues[0]?.value;
	}

    /** @param {any} e */
	function changeTokenizerDataLoaders(e) {
		const selectedValues = e?.detail?.selecteds || [];
		// @ts-ignore
		selectedDataLoaders = selectedValues.map(x => x.value);
	}
</script>

<HeadTitle title="{$_('Dictionary')}" addOn="Knowledge Base" />
<Breadcrumb pagetitle="{$_('Dictionary')}" title="{$_('Knowledge Base')}"/>

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

<div class="knowledge-demo-btn mb-4">
	<div class="demo-btn">
		<Button
			color={`${showDemo ? 'danger' : 'primary'}`}
			on:click={() => toggleDemo()}
		>
			{#if !showDemo}
				<div class="btn-content">
					<div class="knowledge-btn-icon"><i class="bx bx-search-alt" /></div>
					<div>{'Start Search'}</div>
				</div>
			{:else}
				<div class="btn-content">
					<div class="knowledge-btn-icon"><i class="bx bx-hide" /></div>
					<div>{'Hide Search'}</div>
				</div>
			{/if}
		</Button>
	</div>
	
	<div class="reset-btn">
		<Button
			on:click={() => reset()}
		>
			<div class="btn-content">
				<div class="knowledge-btn-icon"><i class="bx bx-reset" /></div>
				<div>{'Reset'}</div>
			</div>
		</Button>
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
						on:keydown={(e) => pressKey(e)}
					/>
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
							<Button
								color="primary"
								disabled={disableSearchBtn}
								on:click={() => search()}
							>
								{'Search'}
							</Button>
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
				<Card>
					<CardBody>
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
                                            <div>Tokenizer</div>
											<Select
												tag={'tokenizer-select'}
												placeholder={'Select Tokenizer'}
												searchMode
												selectedValues={selectedTokenizer ? [selectedTokenizer] : []}
												options={tokenizers}
												on:select={e => changeTokenizer(e)}
											/>
										</div>
                                        <div class="line-align-center collection-dropdown">
                                            <div>Data Loaders</div>
											<Select
												tag={'tokenizer-data-loader-select'}
												placeholder={'Select Data Loaders'}
												searchMode
                                                selectAll
                                                multiSelect
												selectedValues={selectedDataLoaders}
												options={tokenizerDataLoaders}
												on:select={e => changeTokenizerDataLoaders(e)}
											/>
										</div>
									</div>
								</div>
							</div>
						  
							<hr class="mt-2" />
						  
							<div class="table-responsive knowledge-table">
								<Table class="table align-middle table-nowrap table-hover mb-0">
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
												item={item}
                                                columns={columns}
                                                detailKey={'data'}
												open={idx === 0}
											/>
										{/each}
									</tbody>
								</Table>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	</div>
</div>