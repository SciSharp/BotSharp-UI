<script>
    import { onMount, tick } from "svelte";
    import { fade } from 'svelte/transition'; // used in template transition directives
    import util from "lodash";
	import { getKnowledgeCollectionDetails } from "$lib/services/knowledge-base-service";
	import { VectorIndexSchemaType } from "$lib/helpers/enums";
    import Select from "$lib/common/dropdowns/Select.svelte";

    let {
        /** @type {string} */
        collection = '',
        /** @type {boolean} */
        open = false,
        /** @type {string} */
        className = "",
        /** @type {string} */
        title = '',
        /** @type {string} */
        size = 'xl',
        /** @type {number} */
        limit = 30,
        /** @type {() => void} */
        toggleModal = () => {},
        /** @type {(e: any) => void} */
        confirm = () => {},
        /** @type {() => void} */
        cancel = () => {},
        /** @type {string} */
        knowledgeType
    } = $props();

    const maxLength = 500;
    const indexTypeOptions = Object.entries(VectorIndexSchemaType).map(([k, v]) => ({
        label: k.toLowerCase(),
        value: v
    }));

    /** @type any */
    // eslint-disable-next-line svelte/valid-compile
    let addIndexScrollContainer = null;

    /** @type any */
    // eslint-disable-next-line svelte/valid-compile
    let deleteIndexScrollContainer = null;

    /** @type {{ field_name: string, field_schema_type: string }[]} */
    let indexesToAdd = $state([]);

    /** @type {{ field_name: string, field_schema_type: string }[]} */
    let indexesToDelete = $state([]);

    onMount(() => {
        init();
    });

    function init() {
        indexesToAdd = [];
        indexesToDelete = [];
        getCollectionDetail();
    }

    function getCollectionDetail() {
		return new Promise((resolve) => {
			getKnowledgeCollectionDetails(collection, knowledgeType).then(res => {
				indexesToAdd = res?.payload_schema?.map(x => ({
                    field_name: x.field_name,
                    field_schema_type: x.field_data_type
                })) || [];
				resolve(res);
			}).catch(() => {
				indexesToAdd = [];
				resolve([]);
			});
		});
	}

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        const validIndexesToAdd = indexesToAdd.filter(x => !!util.trim(x.field_name) && !!x.field_schema_type);
        const validIndexesToDelete = indexesToDelete.filter(x => !!util.trim(x.field_name) && !!x.field_schema_type);

        const res = {
            addIndexes: validIndexesToAdd.map(x => ({ ...x, field_name: util.trim(x.field_name) })),
            deleteIndexes: validIndexesToDelete.map(x => ({ ...x, field_name: util.trim(x.field_name) })),
        };
        confirm?.(res);
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel?.();
    }

    /** @param {any} e */
    async function addNewIndex(e) {
        e.preventDefault();

        indexesToAdd = [...indexesToAdd, { field_name: '', field_schema_type: '' }];

        if (addIndexScrollContainer) {
            await tick();
            setTimeout(() => {
                addIndexScrollContainer.scrollTo({
                    top: addIndexScrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function removeIndex(e, idx) {
        e.preventDefault();
        indexesToAdd = indexesToAdd.filter((_, i) => i !== idx);
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function moveItemToDelete(e, idx) {
        e.preventDefault();

        const item = indexesToAdd[idx];
        indexesToDelete = [...indexesToDelete, item];
        indexesToAdd = indexesToAdd.filter((_, i) => i !== idx);
    }

    /** @param {any} e */
    async function addToDeleteIndex(e) {
        e.preventDefault();

        indexesToDelete = [...indexesToDelete, { field_name: '', field_schema_type: '' }];

        if (deleteIndexScrollContainer) {
            await tick();
            setTimeout(() => {
                deleteIndexScrollContainer.scrollTo({
                    top: deleteIndexScrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
    }

    /**
     * @param {any} e
     * @param {number} index
     */
    function removeFromDeleteList(e, index) {
        e.preventDefault();
        indexesToDelete = indexesToDelete.filter((_, i) => i !== index);
    }

    /**
     * @param {number} idx
     * @param {string} value
     */
    function updateIndexFieldName(idx, value) {
        indexesToAdd[idx].field_name = value;
        indexesToAdd = [...indexesToAdd];
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function updateIndexFieldType(e, idx) {
        // @ts-ignore
        const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        indexesToAdd[idx].field_schema_type = selectedValues.length > 0 ? selectedValues[0] : '';
        indexesToAdd = [...indexesToAdd];
    }


    /**
     * @param {number} idx
     * @param {string} value
     */
    function updateDeleteIndexFieldName(idx, value) {
        indexesToDelete[idx].field_name = value;
        indexesToDelete = [...indexesToDelete];
    }

    /** @param {any} e */
    function moveAllToDelete(e) {
        e.preventDefault();
        indexesToDelete = [...indexesToDelete, ...indexesToAdd];
        indexesToAdd = [];
    }

    /** @param {any} e */
    function moveAllToAdd(e) {
        e.preventDefault();
        indexesToAdd = [...indexesToAdd, ...indexesToDelete];
        indexesToDelete = [];
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function moveItemToAdd(e, idx) {
        e.preventDefault();
        const item = indexesToDelete[idx];
        indexesToDelete = indexesToDelete.filter((_, i) => i !== idx);
        indexesToAdd = [...indexesToAdd, item];
    }
</script>


{#if open}
<div
    class="vim-modal"
    tabindex="-1"
    role="dialog"
    transition:fade={{ duration: 150 }}
    onclick={(e) => { if (e.target === e.currentTarget) toggleModal?.(); }}
    onkeydown={(e) => { if (e.key === 'Escape') toggleModal?.(); }}
>
    <div class={`vim-dialog vim-dialog-${size} ${className}`} role="document">
        <div class="vim-content">
            <div class="vim-header">
                <div class="vim-header-text">
                    <div class="vim-title">{title}</div>
                    <div class="vim-collection">
                        <span class="vim-collection-label">Collection: </span>
                        <span class="vim-collection-value">{collection}</span>
                    </div>
                </div>
                <button type="button" class="vim-close" aria-label="Close" onclick={() => toggleModal?.()}>
                    <i class="bx bx-x"></i>
                </button>
            </div>
            <div class="vim-body">
                <form onsubmit={(e) => handleConfirm(e)}>
                    <div class="vim-layout">
                        <!-- Existing Index Items Block -->
                        <div class="vim-block vim-block-add">
                            <div class="vim-card">
                                <div class="vim-card-header">
                                    <h6 class="vim-card-title">Index Items to Add</h6>
                                    <button
                                        type="button"
                                        class="vim-btn vim-btn-primary vim-btn-sm"
                                        disabled={indexesToAdd.length >= limit}
                                        onclick={(e) => addNewIndex(e)}
                                    >
                                        <i class="mdi mdi-plus"></i> Add
                                    </button>
                                </div>
                                <div class="vim-card-body">
                                    <div
                                        class="vim-scroll-area"
                                        bind:this={addIndexScrollContainer}
                                    >
                                        {#if indexesToAdd.length === 0}
                                            <div class="vim-empty">
                                                No index items. Click "Add" to create one.
                                            </div>
                                        {:else}
                                            {#each indexesToAdd as item, idx (idx)}
                                                <div class="vim-index-item">
                                                    <div class="vim-index-item-head">
                                                        <small class="vim-index-item-label">Index Item {idx + 1}</small>
                                                        <div class="vim-index-item-actions">
                                                            <button type="button" class="vim-btn vim-btn-info vim-btn-sm" onclick={(e) => moveItemToDelete(e, idx)} title="Move to delete list">
                                                                <i class="mdi mdi-arrow-right vim-arrow-h"></i>
                                                                <i class="mdi mdi-arrow-down vim-arrow-v"></i>
                                                            </button>
                                                            <button type="button" class="vim-btn vim-btn-danger vim-btn-sm" onclick={(e) => removeIndex(e, idx)} title="Remove item">
                                                                <i class="mdi mdi-trash-can"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div class="vim-field-row">
                                                        <div class="vim-field-item">
                                                            <div class="vim-field">
                                                                <label class="vim-label" for={`field-name-${idx}`}>Field Name</label>
                                                                <input
                                                                    id={`field-name-${idx}`}
                                                                    type="text"
                                                                    class="vim-input"
                                                                    value={item.field_name}
                                                                    placeholder="Enter field name"
                                                                    maxlength={maxLength}
                                                                    oninput={(e) => updateIndexFieldName(idx, /** @type {HTMLInputElement} */(e.target).value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div class="vim-field-item">
                                                            <div class="vim-field">
                                                                <label class="vim-label" for={`index-type-${idx}`}>Field Type</label>
                                                                <Select
                                                                    tag={`index-type-${idx}`}
                                                                    placeholder="Select field type"
                                                                    selectedValues={item.field_schema_type ? [item.field_schema_type] : []}
                                                                    options={indexTypeOptions}
                                                                    onselect={(e) => updateIndexFieldType(e, idx)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            {/each}
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Arrow buttons container -->
                        <div class="vim-arrow-container">
                            <div class="vim-arrow-buttons">
                                <button type="button" class="vim-btn vim-btn-info vim-btn-sm" disabled={indexesToAdd.length === 0} onclick={(e) => moveAllToDelete(e)} title="Move all items to delete list">
                                    <i class="mdi mdi-arrow-right vim-arrow-h"></i>
                                    <i class="mdi mdi-arrow-down vim-arrow-v"></i>
                                </button>
                                <button type="button" class="vim-btn vim-btn-info vim-btn-sm" disabled={indexesToDelete.length === 0} onclick={(e) => moveAllToAdd(e)} title="Move all items to existing list">
                                    <i class="mdi mdi-arrow-left vim-arrow-h"></i>
                                    <i class="mdi mdi-arrow-up vim-arrow-v"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Delete Index Items Block -->
                        <div class="vim-block vim-block-delete">
                            <div class="vim-card">
                                <div class="vim-card-header">
                                    <h6 class="vim-card-title">Index Items to Delete</h6>
                                    <button
                                        type="button"
                                        class="vim-btn vim-btn-warning vim-btn-sm"
                                        disabled={indexesToDelete.length >= limit}
                                        onclick={(e) => addToDeleteIndex(e)}
                                    >
                                        <i class="mdi mdi-plus"></i> Add
                                    </button>
                                </div>
                                <div class="vim-card-body">
                                    <div
                                        class="vim-scroll-area"
                                        bind:this={deleteIndexScrollContainer}
                                    >
                                        {#if indexesToDelete.length === 0}
                                            <div class="vim-empty">
                                                No items to delete. Click "Add" to specify items for deletion.
                                            </div>
                                        {:else}
                                            {#each indexesToDelete as item, idx (idx)}
                                                <div class="vim-index-item vim-index-item-warning">
                                                    <div class="vim-index-item-head">
                                                        <small class="vim-index-item-label vim-text-warning">Delete Item {idx + 1}</small>
                                                        <div class="vim-index-item-actions">
                                                            <button type="button" class="vim-btn vim-btn-info vim-btn-sm" onclick={(e) => moveItemToAdd(e, idx)} title="Move to existing list">
                                                                <i class="mdi mdi-arrow-left vim-arrow-h"></i>
                                                                <i class="mdi mdi-arrow-up vim-arrow-v"></i>
                                                            </button>
                                                            <button type="button" class="vim-btn vim-btn-danger vim-btn-sm" title="Remove item" onclick={(e) => removeFromDeleteList(e, idx)}>
                                                                <i class="mdi mdi-trash-can"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div class="vim-field-row">
                                                        <div class="vim-field-item">
                                                            <div class="vim-field">
                                                                <label class="vim-label" for={`delete-field-name-${idx}`}>Field Name</label>
                                                                <input
                                                                    id={`delete-field-name-${idx}`}
                                                                    type="text"
                                                                    class="vim-input"
                                                                    value={item.field_name}
                                                                    placeholder="Enter field name to delete"
                                                                    maxlength={maxLength}
                                                                    oninput={(e) => updateDeleteIndexFieldName(idx, /** @type {HTMLInputElement} */(e.target).value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            {/each}
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="vim-footer">
                <button type="button" class="vim-btn vim-btn-primary" onclick={(e) => handleConfirm(e)}>
                    Confirm
                </button>
                <button type="button" class="vim-btn vim-btn-secondary" onclick={(e) => handleCancel(e)}>
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
<div class="vim-backdrop" transition:fade={{ duration: 150 }}></div>
{/if}

