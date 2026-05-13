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
    class="modal show d-block"
    tabindex="-1"
    role="dialog"
    transition:fade={{ duration: 150 }}
    onclick={(e) => { if (e.target === e.currentTarget) toggleModal?.(); }}
    onkeydown={(e) => { if (e.key === 'Escape') toggleModal?.(); }}
>
    <div class={`modal-dialog modal-${size} ${className}`} role="document">
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <div>{title}</div>
                    <div>
                        <span class="fw-bold">Collection: </span>
                        <span class="text-primary collection-value">{collection}</span>
                    </div>
                </div>
                <button type="button" class="btn-close" aria-label="Close" onclick={() => toggleModal?.()}></button>
            </div>
            <div class="modal-body thin-scrollbar" style="max-height: 70vh; overflow-y: auto;">
                <form onsubmit={(e) => handleConfirm(e)}>
                    <div class="mt-2">
                        <div class="index-layout-container">
                            <!-- Existing Index Items Block -->
                            <div class="index-block">
                                <div class="card index-block-card">
                                    <div class="card-header">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Index Items to Add</h6>
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-primary"
                                                disabled={indexesToAdd.length >= limit}
                                                onclick={(e) => addNewIndex(e)}
                                            >
                                                <i class="mdi mdi-plus"></i> Add
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-body card-body-scrollable">
                                        <div
                                            class="thin-scrollbar"
                                            style="height: 100%; overflow-y: auto;"
                                            bind:this={addIndexScrollContainer}
                                        >
                                            {#if indexesToAdd.length === 0}
                                                <div class="text-muted text-center py-3">
                                                    No index items. Click "Add" to create one.
                                                </div>
                                            {:else}
                                                {#each indexesToAdd as item, idx (idx)}
                                                    <div class="mb-3 p-3 border rounded">
                                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                                            <small class="text-muted">Index Item {idx + 1}</small>
                                                            <div class="d-flex gap-1">
                                                                <button type="button" class="btn btn-sm btn-info" onclick={(e) => moveItemToDelete(e, idx)} title="Move to delete list">
                                                                    <i class="mdi mdi-arrow-right arrow-horizontal"></i>
                                                                    <i class="mdi mdi-arrow-down arrow-vertical"></i>
                                                                </button>
                                                                <button type="button" class="btn btn-sm btn-danger" onclick={(e) => removeIndex(e, idx)} title="Remove item">
                                                                    <i class="mdi mdi-trash-can"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div class="field-row">
                                                            <div class="field-item">
                                                                <div class="mb-2">
                                                                    <label class="form-label" for={`field-name-${idx}`}>Field Name</label>
                                                                    <input
                                                                        id={`field-name-${idx}`}
                                                                        type="text"
                                                                        class="form-control"
                                                                        value={item.field_name}
                                                                        placeholder="Enter field name"
                                                                        maxlength={maxLength}
                                                                        oninput={(e) => updateIndexFieldName(idx, /** @type {HTMLInputElement} */(e.target).value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div class="field-item">
                                                                <div class="mb-2">
                                                                    <label class="form-label" for={`index-type-${idx}`}>Field Type</label>
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
                            <div class="arrow-container">
                                <div class="arrow-buttons">
                                    <button type="button" class="btn btn-sm btn-info" disabled={indexesToAdd.length === 0} onclick={(e) => moveAllToDelete(e)} title="Move all items to delete list">
                                        <i class="mdi mdi-arrow-right arrow-horizontal"></i>
                                        <i class="mdi mdi-arrow-down arrow-vertical"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-info" disabled={indexesToDelete.length === 0} onclick={(e) => moveAllToAdd(e)} title="Move all items to existing list">
                                        <i class="mdi mdi-arrow-left arrow-horizontal"></i>
                                        <i class="mdi mdi-arrow-up arrow-vertical"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Delete Index Items Block -->
                            <div class="index-block">
                                <div class="card index-block-card">
                                    <div class="card-header">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Index Items to Delete</h6>
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-warning"
                                                disabled={indexesToDelete.length >= limit}
                                                onclick={(e) => addToDeleteIndex(e)}
                                            >
                                                <i class="mdi mdi-plus"></i> Add
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-body card-body-scrollable">
                                        <div
                                            class="thin-scrollbar"
                                            style="height: 100%; overflow-y: auto;"
                                            bind:this={deleteIndexScrollContainer}
                                        >
                                            {#if indexesToDelete.length === 0}
                                                <div class="text-muted text-center py-3">
                                                    No items to delete. Click "Add" to specify items for deletion.
                                                </div>
                                            {:else}
                                                {#each indexesToDelete as item, idx (idx)}
                                                    <div class="mb-3 p-3 border rounded border-warning">
                                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                                            <small class="text-warning">Delete Item {idx + 1}</small>
                                                            <div class="d-flex gap-1">
                                                                <button type="button" class="btn btn-sm btn-info" onclick={(e) => moveItemToAdd(e, idx)} title="Move to existing list">
                                                                    <i class="mdi mdi-arrow-left arrow-horizontal"></i>
                                                                    <i class="mdi mdi-arrow-up arrow-vertical"></i>
                                                                </button>
                                                                <button type="button" class="btn btn-sm btn-danger" title="Remove item" onclick={(e) => removeFromDeleteList(e, idx)}>
                                                                    <i class="mdi mdi-trash-can"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div class="field-row">
                                                            <div class="field-item">
                                                                <div class="mb-2">
                                                                    <label class="form-label" for={`delete-field-name-${idx}`}>Field Name</label>
                                                                    <input
                                                                        id={`delete-field-name-${idx}`}
                                                                        type="text"
                                                                        class="form-control"
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
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick={(e) => handleConfirm(e)}>
                    Confirm
                </button>
                <button type="button" class="btn btn-secondary" onclick={(e) => handleCancel(e)}>
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
<div class="modal-backdrop fade show" transition:fade={{ duration: 150 }}></div>
{/if}