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

<style>
    /* ===== Modal overlay & dialog ===== */
    .vim-modal {
        position: fixed;
        inset: 0;
        z-index: 1055;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 1.75rem 0.5rem;
        overflow-x: hidden;
        overflow-y: auto;
    }
    .vim-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1050;
        background-color: rgb(0 0 0);
        opacity: 0.5;
    }
    .vim-dialog {
        position: relative;
        width: 100%;
        margin: 0 auto;
        max-width: 500px;
        pointer-events: none;
    }
    .vim-dialog-sm { max-width: 300px; }
    .vim-dialog-md { max-width: 500px; }
    .vim-dialog-lg { max-width: 800px; }
    .vim-dialog-xl { max-width: 1140px; }
    .vim-content {
        position: relative;
        display: flex;
        flex-direction: column;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 3px rgb(15 23 42 / 0.1),
            0 20px 25px -5px rgb(15 23 42 / 0.15);
        pointer-events: auto;
    }

    /* ===== Header ===== */
    .vim-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgb(243 244 246);
    }
    .vim-header-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1 1 auto;
    }
    .vim-title {
        font-size: 1rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
    .vim-collection {
        font-size: 0.8125rem;
        color: var(--color-muted);
    }
    .vim-collection-label {
        font-weight: 700;
    }
    .vim-collection-value {
        font-size: 0.9375rem;
        color: var(--color-primary);
    }
    .vim-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.875rem;
        height: 1.875rem;
        padding: 0;
        background: transparent;
        border: 0;
        border-radius: 0.375rem;
        color: var(--color-muted);
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .vim-close i {
        font-size: 1.25rem;
        line-height: 1;
    }
    .vim-close:hover {
        background-color: rgb(243 244 246);
        color: rgb(17 24 39);
    }

    /* ===== Body / Footer ===== */
    .vim-body {
        position: relative;
        padding: 1rem 1.25rem;
        max-height: 70vh;
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .vim-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-top: 1px solid rgb(243 244 246);
    }

    /* ===== Layout (3-column grid) ===== */
    .vim-layout {
        display: grid;
        gap: 1rem;
        grid-template-columns: 1fr auto 1fr;
        grid-template-areas: "existing arrows delete";
        align-items: start;
        margin-top: 0.5rem;
    }
    .vim-block-add { grid-area: existing; }
    .vim-block-delete { grid-area: delete; }
    .vim-arrow-container {
        grid-area: arrows;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 500px;
    }
    .vim-arrow-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .vim-arrow-h { display: inline; }
    .vim-arrow-v { display: none; }

    /* ===== Card ===== */
    .vim-card {
        height: 500px;
        display: flex;
        flex-direction: column;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
    }
    .vim-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgb(229 231 235);
    }
    .vim-card-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
    .vim-card-body {
        flex: 1;
        padding: 0.3125rem;
        overflow: hidden;
    }
    .vim-scroll-area {
        height: 100%;
        overflow-y: auto;
        scrollbar-width: thin;
        padding-right: 0.25rem;
    }

    /* ===== Buttons ===== */
    .vim-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        height: 2.25rem;
        padding: 0 0.95rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .vim-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .vim-btn-sm {
        height: 1.875rem;
        padding: 0 0.625rem;
        font-size: 0.75rem;
        border-radius: 0.375rem;
    }
    .vim-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .vim-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .vim-btn-secondary {
        background-color: rgb(255 255 255);
        border-color: rgb(229 231 235);
        color: rgb(55 65 81);
    }
    .vim-btn-secondary:hover:not(:disabled) {
        background-color: rgb(249 250 251);
        border-color: rgb(209 213 219);
    }
    .vim-btn-info {
        background-color: var(--color-info);
        border-color: var(--color-info);
        color: rgb(255 255 255);
    }
    .vim-btn-info:hover:not(:disabled) {
        filter: brightness(0.92);
    }
    .vim-btn-warning {
        background-color: var(--color-warning);
        border-color: var(--color-warning);
        color: rgb(255 255 255);
    }
    .vim-btn-warning:hover:not(:disabled) {
        filter: brightness(0.92);
    }
    .vim-btn-danger {
        background-color: var(--color-danger);
        border-color: var(--color-danger);
        color: rgb(255 255 255);
    }
    .vim-btn-danger:hover:not(:disabled) {
        filter: brightness(0.92);
    }

    /* ===== Index item card ===== */
    .vim-index-item {
        margin-bottom: 0.75rem;
        padding: 0.75rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
    }
    .vim-index-item-warning {
        border-color: var(--color-warning);
    }
    .vim-index-item-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    .vim-index-item-label {
        font-size: 0.75rem;
        color: var(--color-muted);
    }
    .vim-index-item-actions {
        display: flex;
        gap: 0.25rem;
    }
    .vim-text-warning {
        color: var(--color-warning);
    }
    .vim-empty {
        text-align: center;
        padding: 0.75rem;
        color: var(--color-muted);
        font-size: 0.875rem;
    }

    /* ===== Field row ===== */
    .vim-field-row {
        display: flex;
        gap: 1rem;
    }
    .vim-field-item {
        flex: 1;
    }
    .vim-field {
        margin-bottom: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .vim-label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: rgb(55 65 81);
        margin: 0;
    }
    .vim-input {
        width: 100%;
        height: 2.25rem;
        padding: 0 0.625rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.8125rem;
        color: rgb(17 24 39);
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .vim-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* ===== Responsive ===== */
    @media (max-width: 991.98px) {
        .vim-layout {
            grid-template-columns: 1fr;
            grid-template-areas:
                "existing"
                "arrows"
                "delete";
        }
        .vim-arrow-container {
            height: auto;
            min-height: 60px;
            padding: 1rem 0;
        }
        .vim-arrow-buttons {
            flex-direction: row;
            justify-content: center;
        }
        .vim-arrow-h { display: none; }
        .vim-arrow-v { display: inline; }
        .vim-field-row {
            flex-direction: column;
            gap: 0;
        }
    }

    /* ===== Dark mode ===== */
    :global(.dark) .vim-content,
    :global(.dark) .vim-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .vim-header,
    :global(.dark) .vim-footer,
    :global(.dark) .vim-card-header {
        border-color: rgb(55 65 81);
    }
    :global(.dark) .vim-title,
    :global(.dark) .vim-card-title,
    :global(.dark) .vim-label {
        color: rgb(243 244 246);
    }
    :global(.dark) .vim-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .vim-input:focus {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .vim-index-item {
        border-color: rgb(55 65 81);
    }
    :global(.dark) .vim-btn-secondary {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .vim-btn-secondary:hover:not(:disabled) {
        background-color: rgb(75 85 99);
    }
    :global(.dark) .vim-close:hover {
        background-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
</style>