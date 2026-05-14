<script>
	import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import Swal from 'sweetalert2';
	import { v4 as uuidv4 } from 'uuid';
    import {
        getKnowledgeCollections,
        getKnowledgePageList,
        executeKnowledgeQuery,
		createKnowledgeData,
		updateKnowledgeData,
		deleteKnowledgeCollection,
		deleteKnowledgeData,
		deleteAllKnowledgeData,
		createKnowledgeCollection,
		createKnowledgeIndexes,
		deleteKnowledgeIndexes
    } from '$lib/services/knowledge-base-service';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import Loader from '$lib/common/spinners/Loader.svelte';
	import LoadingDots from '$lib/common/spinners/LoadingDots.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import {
		KnowledgeBaseType,
		KnowledgePayloadName,
		VectorDataSource,
		VectorPayloadDataType
	} from '$lib/helpers/enums';
	import { DECIMAL_REGEX } from '$lib/helpers/constants';
	import { formatNumber } from '$lib/helpers/utils/common';
	import VectorItem from '../common/vector-table/vector-item.svelte';
	import VectorItemEditModal from '../common/vector-table/vector-item-edit-modal.svelte';
	import CollectionCreateModal from '../common/collection/collection-create-modal.svelte';
	import VectorIndexModal from '../common/indexes/vector-index-modal.svelte';
	// import AdvancedSearch from '../common/search/advanced-search.svelte';

	const knowledgeType = KnowledgeBaseType.QuestionAnswer;
	const pageSize = 10;
  	const duration = 2000;
	const maxLength = 4096;
	const step = 0.1;
	const searchLimit = 10;
	const enableVector = true;

	/** @type {string} */
	let text = $state("");
	let successText = $state("Done");
	let errorText = $state("Error");
    let confidence = $state('0.5');
	let elapsedTime = $state('');

	/** @type {string} */
	let selectedCollection = $state('');

	/** @type {import('$knowledgeTypes').KnowledgeQueryViewModel[]} */
	let items = $state([]);

	/** @type {import('$commonTypes').LabelValuePair[]} */
	let collections = $state([]);

	/** @type {string | null | undefined } */
	let nextId = $state(null);

	/** @type {number | null | undefined} */
	let totalDataCount = $state(undefined);

	/** @type {string} */
	let editCollection = $state('');

	/** @type {import('$knowledgeTypes').KnowledgeQueryViewModel | null} */
	let editItem = $state(null);

	/** @type {string} */
	let editModalTitle = $state("Edit knowledge");

	/** @type {{ uuid: string, key: string, value: string, data_type: '', checked: boolean }[]} */
	let searchItems = $state([{ uuid: uuidv4(), key: '', value: '', data_type: '', checked: true }]);
	/** @type {string} */
	let selectedOperator = $state('or');
	/** @type {import('$knowledgeTypes').VectorFilterGroup[]} */
	let innerSearchGroups = $state([]);

	let sortField = $state('');
	let sortOrder = $state('desc');
	/** @type {import('$knowledgeTypes').VectorSort?} */
	let innerSort = $state({
		field: '',
		order: 'desc'
	});

	/** @type {boolean} */
	let showDemo = $state(true);
	let isSearching = $state(false);
	let searchDone = $state(false);
	let isFromSearch = $state(false);
	let isLoading = $state(false);
	let isLoadingMore = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let isOpenEditKnowledge = $state(false);
	let isOpenCreateCollection = $state(false);
	let isOpenIndexModal = $state(false);
	let textSearch = $state(false);
	let isAdvSearchOn = $state(false);
	let isExactSearch = $state(false);

	/** @type {{
	 * startId: string | null,
	 * isReset: boolean,
	 * isLocalLoading: boolean,
	 * skipLoader: boolean,
	 * filterGroups: any[],
	 * sort: any
	 * }}
	*/
	const defaultParams = {
		startId: null,
		isReset: false,
		isLocalLoading: false,
		skipLoader: false,
		filterGroups: [],
		sort: null
	};

	let disableBase = $derived(isLoading || isLoadingMore || isSearching);
    let disabled = $derived(!selectedCollection || disableBase);
	let disableSearchBtn = $derived.by(() => {
		if (!selectedCollection || isSearching || isLoadingMore) {
			return true;
		} else if (textSearch && searchItems.length > 0) {
			return false;
		} else if (!text || util.trim(text).length === 0) {
			return true;
		}
		return false;
	});

	onMount(() => {
		initData();
	});

	function initData() {
		isLoading = true;
    	getCollections().then(() => {
			if (selectedCollection) {
				getData({
					...defaultParams,
					isReset: true,
					skipLoader: true,
					filterGroups: innerSearchGroups,
					sort: null
				}).finally(() => isLoading = false);
			}
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
	}

	function search() {
		items = [];
		isSearching = true;
		searchDone = false;
		isFromSearch = false;
		elapsedTime = '';
		const start = new Date();

		innerSearchGroups = buildSearchFilterGroups(searchItems);
		innerSort = buildSearchSort(sortField, sortOrder);

		if (textSearch) {
			getData({
				...defaultParams,
				isReset: true,
				skipLoader: true,
				filterGroups: innerSearchGroups,
				sort: innerSort
			}).then(() => {
				isFromSearch = true;
			}).finally(() => {
				isSearching = false;
				searchDone = true;
				const gap = new Date().getTime() - start.getTime();
            	elapsedTime = `${(gap / 1000).toFixed(3)}s`;
			});
		} else {
			/** @type {import('$knowledgeTypes').KnowledgeQueryRequest} */
			const params = {
				text: util.trim(text),
				limit: searchLimit,
				confidence: Number(validateConfidenceNumber(confidence)),
				withVector: enableVector,
				filterGroups: innerSearchGroups,
				searchParam: { exact_search: isExactSearch }
			};

			executeKnowledgeQuery(selectedCollection, params, knowledgeType).then(res => {
				items = res || [];
				totalDataCount = items.length;
				isFromSearch = true;
			}).finally(() => {
				isSearching = false;
				searchDone = true;
				nextId = null;
				const gap = new Date().getTime() - start.getTime();
            	elapsedTime = `${(gap / 1000).toFixed(3)}s`;
			});
		}
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

	/** @param {boolean} skipLoader */
	function reset(skipLoader = false) {
		resetStates();
		getData({
			...defaultParams,
			startId: null,
			isReset: true,
			skipLoader: skipLoader,
			filterGroups: innerSearchGroups,
			sort: innerSort
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
		elapsedTime = '';
		nextId = null;
		isSearching = false;
		searchDone = false;
		isFromSearch = false;
		textSearch = false;
		isExactSearch = false;
		selectedOperator = 'or';
		innerSearchGroups = [];
		sortField = '';
		sortOrder = 'desc';
		innerSort = {
			field: sortField,
			order: sortOrder
		};
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
			getKnowledgeCollections(knowledgeType).then(res => {
				const retCollections = res?.map(x => ({  label: x.name, value: x.name })) || [];
				collections = [ ...retCollections ];
				selectedCollection = collections[0]?.value;
				resolve(res);
			}).catch(err => {
				collections = [];
				selectedCollection = collections[0]?.value;
				reject(err);
			});
		});
	}

	/**
	 * @param {{
	 * startId: string | null,
	 * isReset: boolean,
	 * filterGroups: any[],
	 * sort: any }} params
	 */
	function getKnowledgeListData(params = {
		startId: null,
		isReset: false,
		filterGroups: [],
		sort: null
	}) {
		return new Promise((resolve, reject) => {
			/** @type {import('$knowledgeTypes').KnowledgeFilter} */
			const filter = {
				size: pageSize,
				start_id: params.startId,
				withVector: enableVector,
				fields: [],
				filterGroups: params.filterGroups,
				orderBy: params.sort?.field ? params.sort : null
			};

			getKnowledgePageList(
				selectedCollection,
				filter,
				knowledgeType
			).then(res => {
				const newItems = res.items || [];
				if (params.isReset) {
					items = [ ...newItems ];
				} else {
					items = [ ...items, ...newItems ];
				}
				nextId = res.next_id;
				totalDataCount = res.count;
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
	 * filterGroups: any[],
	 * sort: any }} params
	 */
	function getData(params = {
		startId: null,
		isReset: false,
		isLocalLoading: false,
		skipLoader: false,
		filterGroups: [],
		sort: null
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
		const params = {
			...defaultParams,
			startId: nextId || null,
			isLocalLoading: true,
			filterGroups: innerSearchGroups,
			sort: innerSort
		};
		getData(params);
	}

	/** @param {any} e */
	function onKnowledgeDelete(e) {
		const id = e.id;
		isLoading = true;
		deleteKnowledgeData(id, selectedCollection, knowledgeType).then(res => {
			if (res) {
				isComplete = true;
				successText = "Knowledge has been deleted!";
				setTimeout(() => {
					isComplete = false;
				}, duration);
				items = items?.filter(x => x.id !== id) || [];
				if (totalDataCount) {
					totalDataCount -= 1;
				}
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
		editCollection = e.collection;
		editItem = e.item;
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
                deleteAllKnowledgeData(selectedCollection, knowledgeType).then(res => {
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
		e.payload = {
			...e.payload || {},
			answer: {
				data_value: e.data?.answer,
				data_type: VectorPayloadDataType.String.name
			},
			dataSource: {
				data_value: e.payload?.dataSource?.data_value || VectorDataSource.User,
				data_type: VectorPayloadDataType.String.name
			}
		};

		if (editItem) {
			updateKnowledgeData(
				e.id,
				editCollection,
				e.data?.text,
				e.payload,
				knowledgeType
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
			createKnowledgeData(
				editCollection,
				e.data?.text,
				e.payload,
				knowledgeType
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
			const payload = Object.keys(newItem.payload || {}).reduce((acc, key) => {
				// @ts-ignore
				acc[key] = {
					data_value: newItem.payload[key]?.data_value,
					data_type: newItem.payload[key]?.data_type
				};
				return acc;
			}, {});

			const newData = {
				text: {
					data_value: newItem.data?.text || '',
					data_type: VectorPayloadDataType.String.name
				},
				answer: {
					data_value: newItem.data?.answer || '',
					data_type: VectorPayloadDataType.String.name
				},
				...payload
			};

			found.payload = { ...newData };
			items = [ ...items ];
		}
	}

	/** @param {any} e */
	function changeCollection(e) {
		const selectedValues = e?.detail?.selecteds || [];
		selectedCollection = selectedValues[0]?.value;
		reset();
	}

	function toggleCollectionCreate() {
		isOpenCreateCollection = !isOpenCreateCollection;
	}

	/** @param {import('$knowledgeTypes').CreateVectorCollectionRequest} data
	*/
	function confirmCollectionCreate(data) {
		isLoading = true;
		toggleCollectionCreate();
		createKnowledgeCollection({
			collectionName: data.collectionName,
			dimension: data.dimension,
			provider: data.provider,
			model: data.model
		}, knowledgeType).then(res => {
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
                deleteKnowledgeCollection(selectedCollection, knowledgeType).then(res => {
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


	/**
	 *  @param {any[]} items
	 *  @returns {import('$knowledgeTypes').VectorFilterGroup[]}
	 */
	function buildSearchFilterGroups(items) {
		/** @type {import('$knowledgeTypes').VectorFilterGroup[]} */
		let groups = [];

		if (textSearch && !!text) {
			groups = [ ...groups, { logical_operator: 'or', filters: [
				{
					logical_operator: 'or',
					operands: [
						{ match: { key: KnowledgePayloadName.Text, value: text, data_type: VectorPayloadDataType.String.name, operator: 'eq' }},
						{ match: { key: KnowledgePayloadName.Answer, value: text, data_type: VectorPayloadDataType.String.name, operator: 'eq' }}
					]
				},
			]}];
		}

		if (isAdvSearchOn && items?.length > 0) {
			const validItems = items.filter(x => x.checked && !!util.trim(x.key) && !!util.trim(x.value))
									.map(x => ({ key: util.trim(x.key), value: util.trim(x.value), data_type: x.data_type || VectorPayloadDataType.String.name }));

			if (validItems.length > 0) {
				groups = [ ...groups, { logical_operator: 'or', filters: [
					{
						logical_operator: selectedOperator,
						operands: validItems.map(x => ({ match: { ...x, operator: 'eq' } }))
					}
				]}];
			}
		}

		return groups;
	}

	/**
	 *  @param {string} field
	 *  @param {string} order
	 */
	function buildSearchSort(field, order) {
		return isAdvSearchOn ? {
			field: field,
			order: order
		} : null;
	}

	/** @param {any} e */
	async function confirmIndex(e) {
		isOpenIndexModal = false;
		isLoading = true;
		const { addIndexes, deleteIndexes } = e;
		try {
			if (addIndexes?.length > 0) {
				await createKnowledgeIndexes(selectedCollection, addIndexes, knowledgeType);
			}
			if (deleteIndexes?.length > 0) {
				await deleteKnowledgeIndexes(selectedCollection, deleteIndexes, knowledgeType);
			}
			successText = "Indexes have been updated!";
            isComplete = true;
            setTimeout(() => {
                isComplete = false;
            }, duration);
		} catch {
			errorText = "Failed to update indexes."
            isError = true;
            setTimeout(() => {
                isError = false;
            }, duration);
		} finally {
			isLoading = false;
		}
	}

	function toggleIndexModal() {
		isOpenIndexModal = !isOpenIndexModal;
	}
</script>

<HeadTitle title={$_('Q&A Knowledge')} addOn="Knowledge Base" />
<Breadcrumb pagetitle={$_('Q&A Knowledge')} title={$_('Knowledge Base')}/>

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
		knowledgeType={knowledgeType}
		item={editItem}
		open={isOpenEditKnowledge}
		allowPayload
		payloadLimit={10}
		excludedPayloads={[
			KnowledgePayloadName.Text,
			KnowledgePayloadName.Question,
			KnowledgePayloadName.Answer
		]}
		toggleModal={() => isOpenEditKnowledge = !isOpenEditKnowledge}
		confirm={(/** @type {any} */ e) => confirmEdit(e)}
		cancel={() => toggleKnowledgeEditModal()}
	/>
{/if}

{#if isOpenIndexModal}
	<VectorIndexModal
		className={'vector-index-container'}
		title={''}
		size={'xl'}
		collection={selectedCollection}
		knowledgeType={knowledgeType}
		open={isOpenIndexModal}
		toggleModal={() => isOpenIndexModal = !isOpenIndexModal}
		confirm={(/** @type {any} */ e) => confirmIndex(e)}
		cancel={() => toggleIndexModal()}
	/>
{/if}

<CollectionCreateModal
	title={'Create new collection'}
	knowledgeType={knowledgeType}
	open={isOpenCreateCollection}
	toggleModal={() => toggleCollectionCreate()}
	confirm={(/** @type {any} */ e) => confirmCollectionCreate(e)}
	cancel={() => toggleCollectionCreate()}
/>

<div class="qa-action-bar">
	<div class="qa-demo-btn-group">
		<button
			type="button"
			class={`qa-btn ${showDemo ? 'qa-btn-danger' : 'qa-btn-primary'}`}
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

		{#if showDemo}
			<div class="qa-tooltip-icon" id="demo-tooltip">
				<i class="bx bx-info-circle"></i>
			</div>
			<BotsharpTooltip target="demo-tooltip" placement="top" containerClasses="[&_.tooltip-inner]:max-w-fit">
				<ul class="mb-0 list-disc pl-4 text-left">
					<li class="my-[3px]">Click "Search" or press "Enter" to search knowledge</li>
					<li class="my-[3px]">Switch collection will not search</li>
				</ul>
			</BotsharpTooltip>
		{/if}
	</div>

	<div>
		<button
			type="button"
			class="qa-btn qa-btn-secondary"
			onclick={() => reset()}
		>
			<i class="bx bx-reset"></i>
			<span>{'Reset'}</span>
		</button>
	</div>
</div>

<div class="qa-page">
	<div class="qa-page-col">
		{#if showDemo}
			<div
				in:fly={{ y: -10, duration: 500 }}
				out:fly={{ y: -10, duration: 200 }}
			>
				<div class="qa-search-card">
					<textarea
						class="qa-textarea"
						rows={5}
						maxlength={maxLength}
						disabled={isSearching}
						placeholder={'Start searching here...'}
						bind:value={text}
						onkeydown={(e) => pressKey(e)}
					></textarea>
					<div class="qa-meta-row">
						<div>
							{#if elapsedTime}
								{`Elapsed time: ${elapsedTime}`}
							{/if}
						</div>
						<div>{formatNumber(text?.length || 0)}/{formatNumber(maxLength)}</div>
					</div>

                    <div class="qa-search-footer">
                        <div class="qa-search-input">
                            <div class="qa-search-label">
                                <span>{'Confidence'}</span>
                            </div>
							<div class="qa-confidence-wrap">
								<div class="qa-confidence-box">
									<input
										type="text"
										class="qa-confidence-input"
										disabled={textSearch}
										bind:value={confidence}
										onkeydown={(e) => validateConfidenceInput(e)}
										onblur={(e) => changeConfidence(e)}
									/>
								</div>
								<div class="qa-step-btn-group">
									<button
										type="button"
										class="qa-step-btn"
										aria-label="Increase confidence"
										onclick={() => stepChangeConfidence('plus', step)}
									>
										<i class="mdi mdi-chevron-up"></i>
									</button>
									<button
										type="button"
										class="qa-step-btn"
										aria-label="Decrease confidence"
										onclick={() => stepChangeConfidence('minus', step)}
									>
										<i class="mdi mdi-chevron-down"></i>
									</button>
								</div>
							</div>
                        </div>
						<div class="qa-search-input">
							<div class="qa-search-label">
								<span>{'Similarity search'}</span>
							</div>
							<div class="qa-search-toggle">
								<label class="qa-switch">
									<input
										type="checkbox"
										role="switch"
										checked={textSearch}
										disabled={disabled}
										onchange={() => toggleTextSearch()}
									/>
									<span class="qa-switch-slider"></span>
								</label>
							</div>
							<div class="qa-search-label">
								<span>{'Keyword search'}</span>
							</div>
						</div>
						{#if !textSearch}
						<div class="qa-exact-search">
							<input
								type="checkbox"
								class="qa-checkbox"
								id="exact-search-check"
								disabled={disabled}
								bind:checked={isExactSearch}
							/>
							<label class="qa-search-label" for="exact-search-check">
								Exact search
							</label>
						</div>
						{/if}
                        <div class="qa-search-input">
							<button
								type="button"
								class="qa-btn qa-btn-primary"
								disabled={disableSearchBtn}
								onclick={() => search()}
							>
								<span>{'Search'}</span>
							</button>
                        </div>
                    </div>

					<!-- <AdvancedSearch
						bind:showAdvSearch={isAdvSearchOn}
						bind:items={searchItems}
						bind:operator={selectedOperator}
						bind:sortField={sortField}
						bind:sortOrder={sortOrder}
						disabled={disabled}
					/> -->

					{#if isSearching}
						<div class="qa-loader">
							<LoadingDots duration={'1s'} size={12} gap={5} color={'var(--color-primary)'} />
						</div>
					{:else if searchDone && (!items || items.length === 0)}
						<div class="qa-empty">
							<h4>{"Ehhh, no idea..."}</h4>
						</div>
					{/if}
			  	</div>
			</div>
		{/if}
		<div class="qa-table-section">
			<div class="qa-card">
				<div class="qa-card-body">
					<div class="qa-table-header">
						{#if totalDataCount != null && totalDataCount != undefined}
							<div class="qa-table-count">
								{`Total data: ${formatNumber(totalDataCount)}`}
							</div>
						{/if}
						<div class="qa-table-toolbar">
							<div class="qa-toolbar-left">
								<h5 class="qa-table-title">
									<div>{$_('Knowledges')}</div>
								</h5>
								<div
									class="qa-icon-wrap"
									data-bs-toggle="tooltip"
									data-bs-placement="top"
									title="Add knowledge"
								>
                                    <button
                                        type="button"
                                        class="qa-btn-soft qa-btn-soft-primary"
										disabled={disabled}
										aria-label="Add knowledge"
                                        onclick={() => onKnowledgeCreate()}
                                    >
                                        <i class="mdi mdi-plus"></i>
                                    </button>
								</div>
								<div
									class="qa-icon-wrap"
									data-bs-toggle="tooltip"
									data-bs-placement="top"
									title="Delete all data"
								>
                                    <button
                                        type="button"
                                        class="qa-btn-soft qa-btn-soft-danger"
										disabled={disabled}
										aria-label="Delete all data"
                                        onclick={() => onKnowledgeDeleteAll()}
                                    >
                                        <i class="mdi mdi-minus"></i>
                                    </button>
								</div>
							</div>
							<div class="qa-toolbar-right">
								{#if selectedCollection}
								<div class="qa-icon-wrap">
									<button
										type="button"
										class="qa-btn-soft qa-btn-soft-primary"
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										title="Create/delete payload indexes"
										onclick={() => toggleIndexModal()}
									>
										Index
									</button>
								</div>
								{/if}

								<div class="qa-collection-dropdown-wrap">
									<div class="qa-collection-dropdown">
										<Select
											tag={'kn-qa-collection-select'}
											placeholder={'Select Collection'}
											searchMode
											selectedValues={selectedCollection ? [selectedCollection] : []}
											options={collections}
											onselect={e => changeCollection(e)}
										/>
									</div>
								</div>
								<div class="qa-collection-actions">
									<div
										class="qa-icon-wrap"
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										title="Add collection"
									>
										<button
											type="button"
											class="qa-btn-soft qa-btn-soft-primary"
											disabled={disableBase}
											aria-label="Add collection"
											onclick={() => toggleCollectionCreate()}
										>
											<i class="mdi mdi-plus"></i>
										</button>
									</div>
									<div
										class="qa-icon-wrap"
										data-bs-toggle="tooltip"
										data-bs-placement="top"
										title="Delete collection"
									>
										<button
											type="button"
											class="qa-btn-soft qa-btn-soft-danger"
											disabled={disabled}
											aria-label="Delete collection"
											onclick={() => deleteCollection()}
										>
											<i class="mdi mdi-minus"></i>
										</button>
									</div>
								</div>
							</div>
						</div>

						<hr class="qa-divider" />

						<div class="qa-table-wrap">
							<table class="qa-table">
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
											knowledgeType={knowledgeType}
											item={item}
											open={isFromSearch && idx === 0}
											ondelete={(/** @type {any} */ data) => onKnowledgeDelete(data)}
											onupdate={(/** @type {any} */ data) => onKnowledgeUpdate(data)}
										/>
									{/each}
								</tbody>
							</table>

							{#if isLoadingMore}
								<div class="qa-loader qa-loader-sm">
									<Loader size={25} disableDefaultStyles />
								</div>
							{:else if !!nextId}
								<div class="qa-load-more-wrap">
									<button
										type="button"
										class="qa-btn-soft qa-btn-soft-primary"
										disabled={disabled}
										onclick={() => loadMore()}
									>
										{'Load more'}
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
    /* ===== Action bar (Hide/Start Search + Reset) ===== */
    .qa-action-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
        margin-bottom: 1.25rem;
    }
    .qa-demo-btn-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .qa-tooltip-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        color: var(--color-muted);
        cursor: help;
    }

    /* ===== Buttons ===== */
    .qa-btn {
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
    .qa-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .qa-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .qa-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .qa-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.08),
            0 4px 12px -4px color-mix(in srgb, var(--color-primary) 45%, transparent);
    }
    .qa-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .qa-btn-secondary {
        background-color: rgb(255 255 255);
        border-color: rgb(229 231 235);
        color: rgb(55 65 81);
    }
    .qa-btn-secondary:hover:not(:disabled) {
        background-color: rgb(249 250 251);
        border-color: rgb(209 213 219);
    }
    .qa-btn-danger {
        background-color: var(--color-danger);
        border-color: var(--color-danger);
        color: rgb(255 255 255);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.08),
            0 4px 12px -4px color-mix(in srgb, var(--color-danger) 45%, transparent);
    }
    .qa-btn-danger:hover:not(:disabled) {
        filter: brightness(0.95);
    }

    /* ===== Soft icon buttons (toolbar) ===== */
    .qa-btn-soft {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        height: 1.875rem;
        min-width: 1.875rem;
        padding: 0 0.55rem;
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .qa-btn-soft:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .qa-btn-soft i {
        font-weight: 700;
        font-size: 1rem;
        line-height: 1;
    }
    .qa-btn-soft-primary {
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
    }
    .qa-btn-soft-primary:hover:not(:disabled) {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .qa-btn-soft-danger {
        background-color: color-mix(in srgb, var(--color-danger) 12%, transparent);
        color: var(--color-danger);
    }
    .qa-btn-soft-danger:hover:not(:disabled) {
        background-color: var(--color-danger);
        color: rgb(255 255 255);
    }

    /* ===== Layout ===== */
    .qa-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .qa-page-col {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
    }

    /* ===== Search card ===== */
    .qa-search-card {
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
        margin-bottom: 1.5rem;
    }
    .qa-search-card::before {
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

    /* ===== Textarea ===== */
    .qa-textarea {
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
    .qa-textarea::placeholder {
        color: var(--color-muted);
        opacity: 1;
    }
    .qa-textarea:hover:not(:focus):not(:disabled) {
        border-color: rgb(209 213 219);
    }
    .qa-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .qa-textarea:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    /* ===== Meta row ===== */
    .qa-meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.6875rem;
        color: var(--color-muted);
        font-variant-numeric: tabular-nums;
    }

    /* ===== Search footer (confidence, toggle, button) ===== */
    .qa-search-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }
    .qa-search-input {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
    }
    .qa-search-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: rgb(55 65 81);
        line-height: 1.4;
    }
    .qa-confidence-wrap {
        display: flex;
        gap: 0.3rem;
        align-items: stretch;
    }
    .qa-confidence-box {
        width: 4rem;
    }
    .qa-confidence-input {
        width: 100%;
        height: 2rem;
        padding: 0 0.4rem;
        text-align: center;
        font-size: 0.8125rem;
        color: rgb(17 24 39);
        background-color: rgb(249 250 251);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        font-variant-numeric: tabular-nums;
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .qa-confidence-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .qa-confidence-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .qa-step-btn-group {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    }
    .qa-step-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 0.95rem;
        width: 1.25rem;
        padding: 0;
        border: 1px solid rgb(229 231 235);
        background-color: rgb(255 255 255);
        color: var(--color-muted);
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .qa-step-btn i {
        font-size: 0.875rem;
        line-height: 1;
        font-weight: 700;
    }
    .qa-step-btn:hover:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        color: var(--color-primary);
    }

    /* ===== Switch (similarity/keyword) ===== */
    .qa-search-toggle {
        display: inline-flex;
        align-items: center;
    }
    .qa-switch {
        position: relative;
        display: inline-block;
        width: 2.25rem;
        height: 1.25rem;
        cursor: pointer;
    }
    .qa-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .qa-switch-slider {
        position: absolute;
        inset: 0;
        background-color: rgb(209 213 219);
        border-radius: 999px;
        transition: background-color 0.15s ease;
    }
    .qa-switch-slider::before {
        content: '';
        position: absolute;
        height: 0.875rem;
        width: 0.875rem;
        left: 0.1875rem;
        top: 0.1875rem;
        background-color: rgb(255 255 255);
        border-radius: 50%;
        transition: transform 0.2s ease;
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.15);
    }
    .qa-switch input:checked + .qa-switch-slider {
        background-color: var(--color-primary);
    }
    .qa-switch input:checked + .qa-switch-slider::before {
        transform: translateX(1rem);
    }
    .qa-switch input:disabled + .qa-switch-slider {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* ===== Exact search checkbox ===== */
    .qa-exact-search {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .qa-checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 1rem;
        height: 1rem;
        margin: 0;
        padding: 0;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        cursor: pointer;
        flex-shrink: 0;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 72%;
        transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .qa-checkbox:hover:not(:disabled) {
        border-color: var(--color-primary);
    }
    .qa-checkbox:focus-visible {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .qa-checkbox:checked {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M3 8l3 3 7-7'/%3E%3C/svg%3E");
    }
    .qa-checkbox:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background-color: rgb(243 244 246);
    }

    /* ===== Loader / Empty ===== */
    .qa-loader {
        display: flex;
        justify-content: center;
        padding: 2rem 0 1rem;
    }
    .qa-loader-sm {
        padding: 1rem 0;
    }
    .qa-empty {
        display: flex;
        justify-content: center;
        padding: 2rem 1rem 1rem;
    }
    .qa-empty h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-muted);
    }

    /* ===== Table card ===== */
    .qa-table-section {
        margin-top: 2rem;
        width: 100%;
    }
    .qa-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.875rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 10px 30px -12px rgb(15 23 42 / 0.08);
    }
    .qa-card-body {
        padding: 1.25rem;
    }
    .qa-table-header {
        margin-top: 0.5rem;
    }
    .qa-table-count {
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        font-size: 0.75rem;
        color: var(--color-muted);
        margin-bottom: 0.25rem;
    }
    .qa-table-toolbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    .qa-toolbar-left {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0;
    }
    .qa-table-title {
        margin: 0;
        padding: 0 0.75rem 0 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
    .qa-toolbar-right {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.4rem;
        padding: 0.3rem 0;
    }
    .qa-icon-wrap {
        display: inline-flex;
        align-items: center;
    }
    .qa-collection-dropdown-wrap {
        display: flex;
        gap: 0.3rem;
        justify-content: flex-end;
        flex-wrap: wrap;
    }
    .qa-collection-dropdown {
        flex: 1 1 auto;
        min-width: 150px;
        display: flex;
        align-items: center;
    }
    .qa-collection-actions {
        display: flex;
        gap: 0.3rem;
        justify-content: flex-end;
    }
    .qa-divider {
        margin: 0.5rem 0 0.75rem;
        border: 0;
        border-top: 1px solid rgb(229 231 235);
    }

    /* ===== Table ===== */
    .qa-table-wrap {
        width: 100%;
        overflow-x: auto;
        scrollbar-width: thin;
    }
    .qa-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.875rem;
        color: rgb(31 41 55);
        white-space: nowrap;
    }
    .qa-table thead th {
        background-color: rgb(249 250 251);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-muted);
        text-align: left;
        padding: 0.625rem 1rem;
        border-bottom: 1px solid rgb(229 231 235);
    }
    .qa-table :global(tbody tr) {
        transition: background-color 0.15s ease;
    }
    .qa-table :global(tbody tr:hover) {
        background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
    }
    .qa-table :global(tbody td) {
        padding: 0.625rem 1rem;
        border-bottom: 1px solid rgb(243 244 246);
        vertical-align: middle;
    }

    .qa-load-more-wrap {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
        .qa-search-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }
        .qa-search-input {
            justify-content: center;
        }
    }
    @media (max-width: 600px) {
        .qa-table-toolbar {
            justify-content: center;
        }
        .qa-toolbar-right {
            justify-content: center;
            width: 100%;
        }
    }

    /* ===== Dark mode ===== */
    :global(.dark) .qa-search-card,
    :global(.dark) .qa-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .qa-textarea,
    :global(.dark) .qa-confidence-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .qa-textarea:focus,
    :global(.dark) .qa-confidence-input:focus {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .qa-table-title,
    :global(.dark) .qa-empty h4 {
        color: rgb(243 244 246);
    }
    :global(.dark) .qa-btn-secondary {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .qa-btn-secondary:hover:not(:disabled) {
        background-color: rgb(75 85 99);
        border-color: rgb(107 114 128);
    }
    :global(.dark) .qa-step-btn {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
        color: rgb(209 213 219);
    }
    :global(.dark) .qa-checkbox {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }
    :global(.dark) .qa-checkbox:checked {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
    }
    :global(.dark) .qa-checkbox:disabled {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .qa-divider {
        border-top-color: rgb(55 65 81);
    }
    :global(.dark) .qa-table thead th {
        background-color: rgb(17 24 39);
        border-bottom-color: rgb(55 65 81);
    }
    :global(.dark) .qa-table :global(tbody td) {
        border-bottom-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .qa-table :global(tbody tr:hover) {
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }
</style>