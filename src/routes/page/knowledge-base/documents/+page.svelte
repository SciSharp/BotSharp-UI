<script>
	import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import Swal from 'sweetalert2';
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
        getVectorKnowledgePageList,
        searchVectorKnowledge,
		createVectorKnowledgeData,
		updateVectorKnowledgeData,
		deleteVectorCollection,
		deleteVectorKnowledgeData,
		deleteAllVectorKnowledgeData,
		createVectorCollection,
    } from '$lib/services/knowledge-base-service';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Loader from '$lib/common/Loader.svelte';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import {
		KnowledgeCollectionType,
		KnowledgePayloadName,
		VectorDataSource
	} from '$lib/helpers/enums';
	import VectorItem from '../common/vector-table/vector-item.svelte';
	import VectorItemEditModal from '../common/vector-table/vector-item-edit-modal.svelte';
	import CollectionCreateModal from '../common/collection/collection-create-modal.svelte';
	import AdvancedSearch from '../common/search/advanced-search.svelte';
	import KnowledgeDocumentUpload from './knowledge-document-upload.svelte';
	import { DECIMAL_REGEX } from '$lib/helpers/constants';
	
	const pageSize = 8;
  	const duration = 2000;
	const maxLength = 4096;
	const step = 0.1;
	const enableVector = true;
	const collectionType = KnowledgeCollectionType.Document;
	const includedPayloads = [
		KnowledgePayloadName.Text,
		KnowledgePayloadName.FileId,
		KnowledgePayloadName.FileName,
		KnowledgePayloadName.DataSource,
		KnowledgePayloadName.FileSource,
		KnowledgePayloadName.FileUrl
	];
	
	/** @type {string} */
	let text = "";
	let successText = "Done";
	let errorText = "Error";
    let confidence = '0.5';

    /** @type {string} */
    let selectedCollection;

	/** @type {import('$knowledgeTypes').KnowledgeSearchViewModel[]} */
	let items = [];

	/** @type {string[]} */
	let collections = [];

	/** @type {string | null | undefined } */
	let nextId;

	/** @type {string} */
	let editCollection;

	/** @type {import('$knowledgeTypes').KnowledgeSearchViewModel | null} */
	let editItem;

	/** @type {string} */
	let editModalTitle = "Edit knowledge";

	/** @type {import('$commonTypes').KeyValuePair[]} */
	let searchItems = [];

	/** @type {boolean} */
    let showDemo = true;
    let isSearching = false;
	let searchDone = false;
	let isFromSearch = false;
	let isLoading = false;
	let isLoadingMore = false;
	let isComplete = false;
	let isError = false;
	let isOpenEditKnowledge = false;
	let isOpenCreateCollection = false;
	let textSearch = false;
	let disableSearchBtn = false;

    /** @type {any} */
    let docUploadrCmp;

	/** @type {{
	 * startId: string | null,
	 * isReset: boolean,
	 * isLocalLoading: boolean,
	 * skipLoader: boolean,
	 * useSearhPair: boolean
	 * }}
	*/
	const defaultParams = {
		startId: null,
		isReset: false,
		isLocalLoading: false,
		skipLoader: false,
		useSearhPair: false
	};

    $: disabled = isLoading || isLoadingMore || isSearching;
	$: {
		disableSearchBtn = false;
		if (isSearching || isLoadingMore) {
			disableSearchBtn = true;
		} else if (textSearch && searchItems.length > 0) {
			disableSearchBtn = false;
		} else if (!text || util.trim(text).length === 0) {
			disableSearchBtn = true;
		}
	}

	onMount(() => {
		initData();
	});

	function initData() {
		isLoading = true;
    	getCollections().then(() => {
			getData({
				...defaultParams,
				isReset: true,
				skipLoader: true
			}).finally(() => isLoading = false);
		}).finally(() => {
			isLoading = false;
		});
	}


	// Search knowledge
	function toggleDemo() {
		showDemo = !showDemo;
	}

	function toggleTextSearch() {
		textSearch = !textSearch;
		if (!textSearch) {
			searchItems = [];
		}
	}

	function search() {
		items = [];
		isSearching = true;
		searchDone = false;
		isFromSearch = false;

		if (textSearch) {
			getData({
				...defaultParams,
				isReset: true,
				skipLoader: true,
				useSearhPair: true
			}).then(() => {
				isFromSearch = true;
			}).finally(() => {
				isSearching = false;
				searchDone = true;
			});
		} else {
			searchVectorKnowledge(selectedCollection,
			{
				text: util.trim(text),
				confidence: Number(validateConfidenceNumber(confidence)),
				with_vector: enableVector
			}).then(res => {
				items = res || [];
				isFromSearch = true;
			}).finally(() => {
				isSearching = false;
				searchDone = true;
				nextId = null;
			});
		}
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

	/** @param {boolean} skipLoader */
	function reset(skipLoader = false) {
		resetStates();
		getData({
			...defaultParams,
			startId: null,
			isReset: true,
			skipLoader: skipLoader
		});
	}

	function initPage() {
		resetStates();
    	initData();
	}

	function resetEditData() {
		editCollection = '';
		editItem = null;
	}

	function resetStates() {
		text = "";
		nextId = null;
		isSearching = false;
		searchDone = false;
		isFromSearch = false;
		textSearch = false;
	}


    /** @param {any} e */
    function validateConfidenceInput(e) {
        const reg = new RegExp(DECIMAL_REGEX, 'g');
        if (e.key !== 'Backspace' && !reg.test(e.key)) {
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
			confidence = num.toFixed(1);
		}
		return confidence;
	}

    /** @param {any} e */
    function changeConfidence(e) {
        const value = e.target.value;
		confidence = validateConfidenceNumber(value);
    }

	/**
	 * @param {string} type
	 * @param {number} step
	 */
	 function stepChangeConfidence(type, step) {
		let innerStep = step || 0;
		if (type === 'plus') {
			innerStep = Math.abs(innerStep);
		} else if (type === 'minus') {
			innerStep = -Math.abs(innerStep);
		}

		const newConfidence = Number(confidence) + innerStep;
		confidence = validateConfidenceNumber(newConfidence?.toString());
	}

	// Knowledge list data
	function getCollections() {
		return new Promise((resolve, reject) => {
			getVectorKnowledgeCollections(collectionType).then(res => {
				const retCollections = res?.map(x => x.name) || [];
				collections = [ ...retCollections ];
				selectedCollection = collections[0];
				resolve(res);
			}).catch(err => {
				collections = [];
				selectedCollection = collections[0];
				reject(err);
			});
		});
	}

	/**
	 * @param {{
	 * startId: string | null,
	 * isReset: boolean,
	 * useSearhPair: boolean }} params
	 */
	function getKnowledgeListData(params = {
		startId: null,
		isReset: false,
		useSearhPair: false
	}) {
		return new Promise((resolve, reject) => {
			/** @type {import('$commonTypes').KeyValuePair[]} */
			let searchPairs = [];
			if (params.useSearhPair) {
				if (!!text) {
					searchPairs = [ ...searchPairs, { key: KnowledgePayloadName.Text, value: text } ];
				}

				if (textSearch && searchItems.length > 0) {
					searchPairs = [ ...searchPairs, ...searchItems ];
				}
			}

			const filter = {
				size: pageSize,
				start_id: params.startId,
				with_vector: enableVector,
				included_payloads: includedPayloads,
				search_pairs: searchPairs
			};

			getVectorKnowledgePageList(
				selectedCollection,
				filter
			).then(res => {
				const newItems = res.items || [];
				if (params.isReset) {
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
	 * @param {{
	 * startId: string | null,
	 * isReset: boolean,
	 * isLocalLoading: boolean,
	 * skipLoader: boolean,
	 * useSearhPair: boolean }} params
	 */
	function getData(params = {
		startId: null,
		isReset: false,
		isLocalLoading: false,
		skipLoader: false,
		useSearhPair: false
	}) {
		return new Promise((resolve, reject) => {
			if (!params.skipLoader) {
                toggleLoader(params.isLocalLoading);
            }
			
			getKnowledgeListData({
				...params
			}).then(res => {
				resolve(res);
			}).catch(err => {
				isError = true;
				setTimeout(() => {
					isError = false;
				}, 2000);
				reject(err);
			}).finally(() => {
				if (!params.skipLoader) {
                    toggleLoader(params.isLocalLoading);
                }
			});
		});
	}

	/** @param {boolean} isLocalLoading */
	function toggleLoader(isLocalLoading) {
		if (isLocalLoading) {
			isLoadingMore = !isLoadingMore;
		} else {
			isLoading = !isLoading;
		}
	}

	function loadMore() {
		let params = { ...defaultParams };

		if (textSearch) {
			params = {
				...params,
				startId: nextId || null,
				isLocalLoading: true,
				useSearhPair: true
			};
		} else {
			params = {
				...params,
				startId: nextId || null,
				isLocalLoading: true,
			};
		}

		getData(params);
	}

	/** @param {any} e */
	function onKnowledgeDelete(e) {
		const id = e.detail.id;
		isLoading = true;
		deleteVectorKnowledgeData(selectedCollection, id).then(res => {
			if (res) {
				isComplete = true;
				successText = "Knowledge has been deleted!";
				setTimeout(() => {
					isComplete = false;
				}, duration);
				items = items?.filter(x => x.id !== id) || [];
			} else {
				throw 'error when deleting vector knowledge!';
			}
		}).catch(() => {
			isError = true;
			errorText = "Error when deleting knowledge!";
			setTimeout(() => {
				isError = false;
			}, duration);
		}).finally(() => {
			isLoading = false;
		});
	}

	/** @param {any} e */
	function onKnowledgeUpdate(e) {
		editModalTitle = "Edit knowledge";
		editCollection = e.detail.collection;
		editItem = e.detail.item;
		isOpenEditKnowledge = true;
	}

	function onKnowledgeCreate() {
		editModalTitle = "Create knowledge";
		editCollection = selectedCollection;
		editItem = null;
		isOpenEditKnowledge = true;
	}

	function onKnowledgeDeleteAll() {
		Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to delete all data in collection "${selectedCollection}"?`,
            icon: 'warning',
			customClass: { confirmButton: 'danger-background' },
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes',
        }).then(async (result) => {
            if (result.value) {
				isLoading = true;
                deleteAllVectorKnowledgeData(selectedCollection).then(res => {
					if (res) {
						successText = "All data has been deleted!";
						isComplete = true;
						setTimeout(() => {
							isComplete = false;
						}, duration);
						reset(true);
					} else {
						throw 'Error when deleting all data';
					}
				}).catch(() => {
					errorText = "Failed to delete all data."
					isError = true;
					setTimeout(() => {
						isError = false;
					}, duration);
				}).finally(() => {
					isLoading = false;
				});
            }
        });
	}

	function toggleKnowledgeEditModal() {
		isOpenEditKnowledge = !isOpenEditKnowledge;
		if (!isOpenEditKnowledge) {
			resetEditData();
		}
	}

	/** @param {any} e */
	function confirmEdit(e) {
		isLoading = true;
		isOpenEditKnowledge = false;
		const dataSource = e.data?.dataSource || VectorDataSource.User;
		e.data.dataSource = dataSource;

		if (!!editItem) {
			const {
				text,
				answer,
				...payload
			} = e.data;
			updateVectorKnowledgeData(
				e.id,
				editCollection,
				e.data?.text,
				e.data?.dataSource,
				{ ...payload }
			).then(res => {
				if (res) {
					isComplete = true;
					refreshItems(e);
					resetEditData();
					successText = "Knowledge has been updated!";
					setTimeout(() => {
						isComplete = false;
					}, duration);
				} else {
					throw 'error when updating vector knowledge!';
				}
			}).catch(() => {
				resetEditData();
				isError = true;
				errorText = "Error when updating knowledge!";
				setTimeout(() => {
					isError = false;
				}, duration);
			}).finally(() => {
				isLoading = false;
			});
		} else {
			createVectorKnowledgeData(
				editCollection,
				e.data?.text,
				e.data.dataSource
			).then(res => {
				if (res) {
					isComplete = true;
					refreshItems(e);
					resetEditData();
					reset(true);
					successText = "Knowledge has been created!";
					setTimeout(() => {
						isComplete = false;
					}, duration);
				} else {
					throw 'error when creating vector knowledge!';
				}
			}).catch(() => {
				resetEditData();
				isError = true;
				errorText = "Error when creating knowledge!";
				setTimeout(() => {
					isError = false;
				}, duration);
			}).finally(() => {
				isLoading = false;
			});
		}
	}

	/** @param {any} newItem */
	function refreshItems(newItem) {
		const found = items?.find(x => x.id == newItem?.id);
		if (found) {
			found.data = {
				...found.data,
				text: newItem.data?.text || '',
				dataSource: newItem.data?.dataSource,
			};
			items = [ ...items ];
		}
	}

	/** @param {any} e */
	function changeCollection(e) {
		const value = e.target.value;
		selectedCollection = value;
        docUploadrCmp?.onCollectionChanged();
		reset();
	}

	function toggleCollectionCreate() {
		isOpenCreateCollection = !isOpenCreateCollection;
	}

	/** @param {import('$knowledgeTypes').CreateVectorCollectionRequest} data */
	function confirmCollectionCreate(data) {
		isLoading = true;
		toggleCollectionCreate();
		createVectorCollection({
			collection_name: data.collection_name,
			collection_type: collectionType,
			dimension: data.dimension,
			provider: data.provider,
			model: data.model
		}).then(res => {
			if (res) {
				successText = "Collection has been created!";
				isComplete = true;
				setTimeout(() => {
					isComplete = false;
				}, duration);
				initPage();
			} else {
				throw 'Error when creating collection';
			}
		}).catch(() => {
			errorText = "Failed to create collection."
			isError = true;
			setTimeout(() => {
				isError = false;
			}, duration);
		}).finally(() => {
			isLoading = false;
		});
	}

	function deleteCollection() {
        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to delete collection "${selectedCollection}"?`,
            icon: 'warning',
			customClass: { confirmButton: 'danger-background' },
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes',
        }).then(async (result) => {
            if (result.value) {
				isLoading = true;
                deleteVectorCollection(selectedCollection).then(res => {
					if (res) {
						successText = "Collection has been deleted!";
						isComplete = true;
						setTimeout(() => {
							isComplete = false;
						}, duration);
						initPage();
					} else {
						throw 'Error when deleting vector collection';
					}
				}).catch(() => {
					errorText = "Failed to delete collection."
					isError = true;
					setTimeout(() => {
						isError = false;
					}, duration);
				}).finally(() => {
					isLoading = false;
				});
            }
        });
	}

    /** @param {any} e */
    function onDocUploaded(e) {
        reset();
    }

    /** @param {any} e */
    function onDocDelected(e) {
        reset();
        const success = e.detail.success;
        if (success) {
            successText = "Knowledge document has been deleted!";
            isComplete = true;
            setTimeout(() => {
                isComplete = false;
            }, duration);
        } else {
            errorText = "Failed to delete knowledge document."
            isError = true;
            setTimeout(() => {
                isError = false;
            }, duration);
        }
    }

	/** @param {any} e */
    function onDocsReset(e) {
        reset();
        const success = e.detail.success;
        if (success) {
            successText = "Knowledge document has been reset!";
            isComplete = true;
            setTimeout(() => {
                isComplete = false;
            }, duration);
        } else {
            errorText = "Failed to reset knowledge documents."
            isError = true;
            setTimeout(() => {
                isError = false;
            }, duration);
        }
    }

	/** @param {any} e */
	function onSearchItemsChanged(e) {
		searchItems = e.detail.searchItems || [];
	}
</script>

<HeadTitle title="{$_('Document Knowledge')}" />
<Breadcrumb pagetitle="{$_('Document Knowledge')}" title="{$_('Knowledge Base')}"/>

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

{#if isOpenEditKnowledge}
	<VectorItemEditModal
		className={'vector-edit-container'}
		title={editModalTitle}
		size={'lg'}
		collection={editCollection}
        collectionType={collectionType}
		item={editItem}
		open={isOpenEditKnowledge}
		toggleModal={() => isOpenEditKnowledge = !isOpenEditKnowledge}
		confirm={(e) => confirmEdit(e)}
		cancel={() => toggleKnowledgeEditModal()}
	/>
{/if}

<CollectionCreateModal
	title={'Create new collection'}
	open={isOpenCreateCollection}
	toggleModal={() => toggleCollectionCreate()}
	confirm={e => confirmCollectionCreate(e)}
	cancel={() => toggleCollectionCreate()}
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

		{#if showDemo}
			<div class="knowledge-btn-icon demo-tooltip-icon line-align-center" id="demo-tooltip">
				<i class="bx bx-info-circle" />
			</div>
			<Tooltip target="demo-tooltip" placement="top" class="demo-tooltip-note">
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
					<div class="text-secondary text-end text-count">
						{text?.length || 0}/{maxLength}
					</div>
				
                    <div class="mt-3 knowledge-search-footer">
                        <div class="search-input">
                            <div class="line-align-center input-text fw-bold">
                                <span>{'Confidence:'}</span>
                            </div>
							<div style="display: flex; gap: 5px;">
								<div class="line-align-center confidence-box">
									<Input
										type="text"
										class="text-center"
										disabled={textSearch}
										bind:value={confidence}
										on:keydown={(e) => validateConfidenceInput(e)}
										on:blur={(e) => changeConfidence(e)}
									/>
								</div>
								<div class="step-btn-group">
									<Button
										class="btn btn-sm"
										color="link"
										on:click={() => stepChangeConfidence('plus', step)}
									>
										<i class="mdi mdi-chevron-up" />
									</Button>
									<Button
										class="btn btn-sm"
										color="link"
										on:click={() => stepChangeConfidence('minus', step)}
									>
										<i class="mdi mdi-chevron-down" />
									</Button>
								</div>
							</div>
                        </div>
						<div class="search-input">
							<div class="line-align-center input-text fw-bold">
								<span>{'Similarity search'}</span>
							</div>
							<div class="line-align-center input-text search-toggle">
								<Input
									type="switch"
									checked={textSearch}
									on:change={e => toggleTextSearch()}
								/>
							</div>
							<div class="line-align-center input-text fw-bold">
								<span>{'Keyword search'}</span>
							</div>
						</div>
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

					{#if textSearch}
						<AdvancedSearch
							on:changeitems={e => onSearchItemsChanged(e)}
							disabled={disabled}
							items={[
								{ key: KnowledgePayloadName.FileName, displayName: "File name" },
								{ key: KnowledgePayloadName.FileSource, displayName: "File source" }
							]}
						/>
					{/if}
				
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
        
        {#if selectedCollection}
            <KnowledgeDocumentUpload
                collection={selectedCollection}
                disabled={disabled}
                bind:this={docUploadrCmp}
                on:docuploaded={(e) => onDocUploaded(e)}
                on:docdeleted={(e) => onDocDelected(e)}
				on:resetdocs={(e) => onDocsReset(e)}
            />
        {/if}

		<div class="d-md-flex mt-5">
			<div class="w-100">
				<Card>
					<CardBody>
						<div class="mt-2">
							<div class="d-flex flex-wrap mb-3 knowledge-table-header">
								<div class="d-flex" style="gap: 5px;">
									<h5 class="font-size-16 knowledge-header-text">
										<div>{$_('Knowledges')}</div>
									</h5>
									<div
										class="line-align-center"
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										title="Add knowledge"
									>
                                        <Button
                                            class="btn btn-sm btn-soft-primary knowledge-btn-icon"
                                            on:click={() => onKnowledgeCreate()}
                                        >
                                            <i class="mdi mdi-plus" />
                                        </Button>
									</div>
									<div
										class="line-align-center"
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										title="Delete all data"
									>
                                        <Button
                                            class="btn btn-sm btn-soft-danger knowledge-btn-icon"
                                            on:click={() => onKnowledgeDeleteAll()}
                                        >
                                            <i class="mdi mdi-minus" />
                                        </Button>
									</div>
								</div>
								<div class="collection-dropdown-container">
									<div class="line-align-center collection-dropdown">
										<Input
											type="select"
											on:change={(e) => changeCollection(e)}
										>
											{#each collections as option, idx (idx)}
												<option value={option} selected={option === selectedCollection}>{option}</option>
											{/each}
										</Input>
									</div>
									<div
										class="line-align-center"
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										title="Add collection"
									>
										<Button
											class="btn btn-sm btn-soft-primary collection-action-btn"
											on:click={() => toggleCollectionCreate()}
										>
											<i class="mdi mdi-plus" />
										</Button>
									</div>
									<div
										class="line-align-center"
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										title="Delete collection"
									>
										<Button
											class="btn btn-sm btn-soft-danger collection-action-btn"
											on:click={() => deleteCollection()}
										>
											<i class="mdi mdi-minus" />
										</Button>
									</div>
								</div>
							</div>
						  
							<hr class="mt-2" />
						  
							<div class="table-responsive knowledge-table">
								<Table class="table align-middle table-nowrap table-hover mb-0">
									<thead>
										<tr>
											<th scope="col">{$_('Text')}</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{#each items as item, idx (idx)}
                                            <VectorItem
												collection={selectedCollection}
                                                collectionType={collectionType}
												item={item}
												open={isFromSearch && idx === 0}
												on:delete={(e) => onKnowledgeDelete(e)}
												on:update={(e) => onKnowledgeUpdate(e)}
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