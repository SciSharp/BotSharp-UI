<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import { Button, Card, CardBody, Input, Table, Tooltip } from '@sveltestrap/sveltestrap';
	import { fly } from 'svelte/transition';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Loader from '$lib/common/Loader.svelte';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { KNOWLEDGE_COLLECTION } from '$lib/helpers/constants';
	import { getKnowledgeCollections, getKnowledgeData, searchKnowledge } from '$lib/services/knowledge-base-service';
	import KnowledgeItem from './knowledge-table/knowledge-item.svelte';
	
	
	const page_size = 8;
  	const duration = 2000;
	const maxLength = 4096;
	const confidence = 0.5;
	
	let show_demo = false;
	let selectedCollection = KNOWLEDGE_COLLECTION;
	let text = "";
	let isSearching = false;
	let searchDone = false;
	let successText = "Done";
	let errorText = "Error";

	/** @type {import('$types').KnowledgeSearchViewModel[]} */
	let items = [];

	/** @type {string[]} */
	let collections = [];

	/** @type {string | null | undefined} */
	let nextId;

	/** @type {boolean} */
	let isLoading = false;
	let isLoadingMore = false;
	let isComplete = false;
	let isError = false;

	onMount(() => {
    	getCollections().then(() => {
			initData(null, true);
		});
	});


	// Search knowledge
	function toggleDemo() {
		show_demo = !show_demo;
	}

	function search() {
		items = [];
		isSearching = true;
		searchDone = false;
		searchKnowledge({
			text: util.trim(text),
			confidence: confidence
		}, selectedCollection).then(res => {
			items = res || [];
		}).finally(() => {
			isSearching = false;
			searchDone = true;
			nextId = null;
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
		text = "";
		nextId = null;
		isSearching = false;
		searchDone = false;
		initData(nextId, true);
	}


	// Knowledge list data
	function getCollections() {
		return new Promise((resolve, reject) => {
			getKnowledgeCollections().then(res => {
				collections = res || [ KNOWLEDGE_COLLECTION ];
				selectedCollection = collections[0];
				resolve(res);
			}).catch(err => {
				collections = [ KNOWLEDGE_COLLECTION ];
				selectedCollection = collections[0];
				reject(err);
			});
		});
	}

	/**
	 * @param {string | null} [startId]
	 * @param {boolean} reset
	 */
	function getKnowledgeListData(startId = null, reset = false) {
		return new Promise((resolve, reject) => {
			getKnowledgeData({ size: page_size, start_id: startId }, selectedCollection).then(res => {
				const newItems = res.items || [];
				if (reset) {
					items = [ ...newItems ];
				} else {
					items = [ ...items, ...newItems ];
				}
				nextId = res.next_id;
				resolve(res);
			}).catch(err => {
				console.log(err);
				reject(err);
			});
		});
	}


	/**
	 * @param {string | null} [startId]
	 * @param {boolean} reset
	 * @param {boolean} isLocal
	 */
	function initData(startId = null, reset = false, isLocal = false) {
	return new Promise((resolve, reject) => {
			toggleLoader(isLocal);
			getKnowledgeListData(startId, reset).then(res => {
				resolve(res);
			}).catch(err => {
				isError = true;
				setTimeout(() => {
					isError = false;
				}, 2000);
				reject(err);
			}).finally(() => {
				toggleLoader(isLocal);
			});
		});
	}

	/** @param {boolean} isLocal */
	function toggleLoader(isLocal) {
		if (isLocal) {
			isLoadingMore = !isLoadingMore;
		} else {
			isLoading = !isLoading;
		}
	}

	function loadMore() {
		initData(nextId, false, true);
	}

	/** @param {any} e */
	function afterKnowledgeDeleted(e) {
		const id = e.detail.id;
		const isSuccess = e.detail.isSuccess;

		if (isSuccess) {
			isComplete = true;
			successText = "Knowledge has been deleted!";
			setTimeout(() => {
				isComplete = false;
			}, duration);
			items = items?.filter(x => x.id !== id) || [];
		} else {
			isError = true;
			errorText = "Error when deleting knowledge!";
			setTimeout(() => {
				isError = false;
			}, duration);
		}
	}

	/** @param {any} e */
	function selectCollection(e) {
		const value = e.target.value;
		selectedCollection = value;
		nextId = null;
		initData(nextId, true);
	}
</script>

<HeadTitle title="{$_('Knowledge Manager')}" />
<Breadcrumb pagetitle="{$_('Knowledge Manager')}" title="{$_('Knowledge Base')}"/>

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
			color={`${show_demo ? 'danger' : 'primary'}`}
			on:click={() => toggleDemo()}
		>
			{#if !show_demo}
				<div class="btn-content">
					<div class="btn-icon"><i class="bx bx-search-alt" /></div>
					<div>{'Search knowledge'}</div>
				</div>
			{:else}
				<div class="btn-content">
					<span class="btn-icon"><i class="bx bx-hide" /></span>
					<span>{'Hide search'}</span>
				</div>
			{/if}
		</Button>

		{#if show_demo}
			<div class="btn-icon demo-tooltip-icon" id="demo-tooltip">
				<i class="bx bx-info-circle" />
			</div>
			<Tooltip target="demo-tooltip" placement="right" class="demo-tooltip-note">
				<ul>
					<li>Click "Search" or press "Enter" to search knowledge</li>
					<li>Switch collection will not search</li>
				</ul>
			</Tooltip>
		{/if}
	</div>
	

	<div class="reset-btn">
		<Button
			on:click={() => reset()}
		>
			<div class="btn-content">
				<div class="btn-icon"><i class="bx bx-reset" /></div>
				<div>{'Reset'}</div>
			</div>
		</Button>
	</div>
</div>

<div class="d-xl-flex">
	<div class="w-100">
		{#if show_demo}
			<div
				in:fly={{ y: -10, duration: 500 }}
				out:fly={{ y: -10, duration: 200 }}
			>
				<div class="knowledge-search-container mb-4">
					<textarea
						class='form-control search-textarea'
						rows={5}
						maxlength={maxLength}
						disabled={isSearching}
						placeholder={'Please type something here...'}
						bind:value={text}
						on:keydown={(e) => pressKey(e)}
					/>
					<div class="text-secondary text-end text-count">
						{text?.length || 0}/{maxLength}
					</div>
				
					<div class="mt-2 text-end">
						<Button
							color="primary"
							disabled={!text || util.trim(text).length === 0 || isSearching}
							on:click={() => search()}
						>
							{'Search'}
						</Button>
					</div>
				
					{#if isSearching}
						<div class="knowledge-loader mt-4">
							<LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
						</div>
					{:else if searchDone && (!items || items.length === 0)}
						<div class="mt-2">
							<h4 class="text-secondary">{"Ehhh, no idea..."}</h4>
						</div>
					{/if}
			  	</div>
			</div>
		{/if}
		<div class="d-md-flex">
			<div class="w-100">
				<Card>
					<CardBody>
						<div class="mt-2">
							<div class="d-flex flex-wrap mb-3 knowledge-table-header">
								<h5 class="font-size-16 knowledge-header-text">
									<div>{$_('Knowledges')}</div>
								</h5>
								<div class="knowledge-dropdown">
									<Input type="select" on:change={(e) => selectCollection(e)}>
										{#each collections as option, idx (idx)}
											<option value={option} selected={idx === 0}>{option}</option>
										{/each}
									</Input>
								</div>
							</div>
						  
							<hr class="mt-2" />
						  
							<div class="table-responsive knowledge-table">
								<Table class="table align-middle table-nowrap table-hover mb-0">
									<thead>
										<tr>
											<th scope="col">{$_('Question')}</th>
											<th scope="col">{$_('Answer')}</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{#each items as item}
											<KnowledgeItem data={item} on:delete={(e) => afterKnowledgeDeleted(e)} />
										{/each}
									</tbody>
								</Table>
						  
								{#if isLoadingMore}
									<div class="knowledge-loader mt-4">
										<Loader size={25} disableDefaultStyles />
									</div>
								{:else if !!nextId && items?.length > 0}
									<div class="mt-4 text-center">
										<Button
											class="btn btn-soft-primary"
											on:click={() => loadMore()}
										>
											{'Load more'}
										</Button>
									</div>
								{/if}
							</div>
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	</div>
</div>