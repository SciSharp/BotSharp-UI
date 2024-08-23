<script>
	import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import {
        Button,
        Card,
        CardBody,
        Input,
        Table,
        Tooltip
    } from '@sveltestrap/sveltestrap';
    import {
        getVectorKnowledgeCollections,
        getVectorKnowledgeData,
        searchVectorKnowledge
    } from '$lib/services/knowledge-base-service';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Loader from '$lib/common/Loader.svelte';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { DEFAULT_KNOWLEDGE_COLLECTION } from '$lib/helpers/constants';
	import VectorItem from './vector-table/vector-item.svelte';
	import VectorItemEdit from './vector-table/vector-item-edit.svelte';
	
	
	const page_size = 8;
  	const duration = 2000;
	const maxLength = 4096;
    const regex = "[0-9\.]+";
	
	let showDemo = false;
	let selectedCollection = DEFAULT_KNOWLEDGE_COLLECTION;
	let text = "";
	let isSearching = false;
	let searchDone = false;
	let isFromSearch = false;
	let successText = "Done";
	let errorText = "Error";
    let confidence = '0.5';

	/** @type {import('$types').KnowledgeSearchViewModel[]} */
	let items = [];

	/** @type {string[]} */
	let collections = [];

	/** @type {string | null | undefined} */
	let nextId;

	/** @type {string} */
	let editCollection;

	/** @type {import('$types').KnowledgeSearchViewModel} */
	let editItem;

	/** @type {boolean} */
	let isLoading = false;
	let isLoadingMore = false;
	let isComplete = false;
	let isError = false;
	let isOpenEdit = false;

	onMount(() => {
    	getCollections().then(() => {
			initData(null, true);
		});
	});


	// Search knowledge
	function toggleDemo() {
		showDemo = !showDemo;
	}

	function search() {
		items = [];
		isSearching = true;
		searchDone = false;
		isFromSearch = false;
		searchVectorKnowledge({
			text: util.trim(text),
			confidence: Number(validateConfidenceNumber(confidence))
		}, selectedCollection).then(res => {
			items = res || [];
			isFromSearch = true;
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
		isFromSearch = false;
		initData(nextId, true);
	}

    /** @param {any} e */
    function validateConfidenceInput(e) {
        var reg = new RegExp(regex, 'g');
        if (!reg.test(e.key)) {
            e.preventDefault();
        }
    }

	/** @param {string} value */
	function validateConfidenceNumber(value) {
		const num = Number(value);

		if (isNaN(num) || num < 0) {
			confidence = '0.0';
		} else if (num >= 1) {
			confidence = '1.0';
		} else {
			confidence = num.toFixed(2);
		}
		return confidence;
	}

    /** @param {any} e */
    function changeConfidence(e) {
        const value = e.target.value;
		validateConfidenceNumber(value);
    }


	// Knowledge list data
	function getCollections() {
		return new Promise((resolve, reject) => {
			getVectorKnowledgeCollections().then(res => {
				const retCollections = res || [];
				collections = retCollections.length === 0 ? [ DEFAULT_KNOWLEDGE_COLLECTION ] : retCollections;
				selectedCollection = collections[0];
				resolve(res);
			}).catch(err => {
				collections = [ DEFAULT_KNOWLEDGE_COLLECTION ];
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
			getVectorKnowledgeData({ size: page_size, start_id: startId }, selectedCollection).then(res => {
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
	function onKnowledgeDeleted(e) {
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
	function onKnowledgeUpdated(e) {
		isOpenEdit = true;
		editCollection = e.detail.collection;
		editItem = e.detail.item;
	}

	function toggleEditModal() {
		isOpenEdit = !isOpenEdit;
		if (!isOpenEdit) {
			resetEditData();
		}
	}

	/** @param {any} e */
	function confirmUpdate(e) {
		refreshItems(e);
		resetEditData();
		isOpenEdit = false;
	}

	/** @param {any} newItem */
	function refreshItems(newItem) {
		const found = items?.find(x => x.id == newItem?.id);
		if (found) {
			found.data = {
				...found.data,
				text: newItem.data?.text || '',
				answer: newItem.data?.answer || ''
			};
			items = [ ...items ];
		}
	}

	function resetEditData() {
		editCollection = '';
		editItem = { id: "", data: null };
	}

	/** @param {any} e */
	function changeCollection(e) {
		const value = e.target.value;
		selectedCollection = value;
		reset();
	}
</script>

<HeadTitle title="{$_('Q&A Knowledge')}" />
<Breadcrumb pagetitle="{$_('Q&A Knowledge')}" title="{$_('Knowledge Base')}"/>

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

{#if isOpenEdit}
	<VectorItemEdit
		className={'vector-edit-container'}
		collection={editCollection}
		item={editItem}
		open={isOpenEdit}
		toggleModal={() => isOpenEdit = !isOpenEdit}
		confirm={(e) => confirmUpdate(e)}
		cancel={() => toggleEditModal()}
	/>
{/if}

<div class="knowledge-demo-btn mb-4">
	<div class="demo-btn">
		<Button
			color={`${showDemo ? 'danger' : 'primary'}`}
			on:click={() => toggleDemo()}
		>
			{#if !showDemo}
				<div class="btn-content">
					<div class="btn-icon"><i class="bx bx-search-alt" /></div>
					<div>{'Search'}</div>
				</div>
			{:else}
				<div class="btn-content">
					<span class="btn-icon"><i class="bx bx-hide" /></span>
					<span>{'Hide'}</span>
				</div>
			{/if}
		</Button>

		{#if showDemo}
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
					<div class="text-secondary text-end text-count">
						{text?.length || 0}/{maxLength}
					</div>
				
                    <div class="mt-2 knowledge-search-footer">
                        <div class="confidence-input">
                            <span class="confidence-text fw-bold">
                                {'Confidence:'}
                            </span>
                            <span class="confidence-box">
                                <Input
                                    type="text"
                                    class="text-center"
                                    bind:value={confidence}
                                    on:keydown={(e) => validateConfidenceInput(e)}
                                    on:blur={(e) => changeConfidence(e)}
                                />
                            </span>
                        </div>
                        <div>
                            <Button
                                color="primary"
                                disabled={!text || util.trim(text).length === 0 || isSearching}
                                on:click={() => search()}
                            >
                                {'Search'}
                            </Button>
                        </div>
                    </div>
				
					{#if isSearching}
						<div class="knowledge-loader mt-4">
							<LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
						</div>
					{:else if searchDone && (!items || items.length === 0)}
						<div class="mt-4">
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
									<Input type="select" on:change={(e) => changeCollection(e)}>
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
										{#each items as item, idx (idx)}
                                            <VectorItem
												collection={selectedCollection}
												item={item}
												open={isFromSearch && idx === 0}
												on:delete={(e) => onKnowledgeDeleted(e)}
												on:update={(e) => onKnowledgeUpdated(e)}
											/>
										{/each}
									</tbody>
								</Table>
						  
								{#if isLoadingMore}
									<div class="knowledge-loader mt-4">
										<Loader size={25} disableDefaultStyles />
									</div>
								{:else if !!nextId}
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