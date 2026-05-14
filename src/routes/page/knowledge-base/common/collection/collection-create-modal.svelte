<script>
    import { onMount } from "svelte";
    import { fade } from 'svelte/transition';
    import _ from "lodash";
	import { existKnowledgeCollection } from "$lib/services/knowledge-base-service";

    let {
        /** @type {boolean} */
        open = false,
        /** @type {string} */
        className = "",
        /** @type {string} */
        title = '',
        /** @type {string} */
        size = 'md',
        /** @type {number} */
        minDimension = 1,
        /** @type {number} */
        step = 1,
        /** @type {number} */
        maxLength = 30,
        /** @type {() => void} */
        toggleModal = () => {},
        /** @type {(args0: any) => void} */
        confirm = () => {},
        /** @type {() => void} */
        cancel = () => {},
        /** @type {string} */
        knowledgeType
    } = $props();

    /** @type {string} */
    let collection = $state('');

    /** @type {boolean} */
    let isValidCollection = $state(true);

    /** @type {number} */
    let dimension = $state(1536);

    /** @type {string} */
    let provider = $state('openai');

    /** @type {string} */
    let model = $state('text-embedding-3-small');

    let disableConfirmBtn = $derived(
        (!_.trim(collection) || collection.length > maxLength) ||
        (!_.trim(provider) || provider.length > maxLength) ||
        (!_.trim(model) || model.length > maxLength) ||
        dimension <= 0
    );

    onMount(() => {
        reset();
    });

    function reset() {
        collection = '';
        dimension = 1536;
        provider = 'openai';
        model = 'text-embedding-3-small';
    }

    function toggle() {
        reset();
        toggleModal?.();
    }

    /** @param {string} text */
    function validateCollection(text) {
        return new Promise((resolve, reject) => {
            existKnowledgeCollection(text, knowledgeType).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /** @param {any} e */
    function changeCollectionText(e) {
        isValidCollection = true;
        collection = e.target.value;
    }

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        validateCollection(_.trim(collection)).then(res => {
            if (res) {
                isValidCollection = false;
            } else {
                confirm?.({
                    collectionName: _.trim(collection),
                    dimension: dimension,
                    provider: _.trim(provider),
                    model: _.trim(model)
                });
            }
        }).catch(() => {
            isValidCollection = false;
        });
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        reset();
        cancel?.();
    }

    /** @param {MouseEvent} e */
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            toggle();
        }
    }
</script>

{#if open}
<div
    class="cm-modal"
    tabindex="-1"
    role="dialog"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
    onkeydown={(e) => { if (e.key === 'Escape') toggle(); }}
>
    <div class={`cm-dialog cm-dialog-${size} ${className}`} role="document">
        <div class="cm-content">
            <div class="cm-header">
                <h5 class="cm-title">{title}</h5>
                <button type="button" class="cm-close" aria-label="Close" onclick={() => toggle()}>
                    <i class="bx bx-x"></i>
                </button>
            </div>
            <div class="cm-body">
                <form onsubmit={(e) => handleConfirm(e)}>
                    <div class="cm-row">
                        <div class="cm-field">
                            <label class="cm-label" for="collection">Collection name: </label>
                            <input
                                type="text"
                                id="collection"
                                class={`cm-input ${!isValidCollection ? 'cm-input-invalid' : ''}`}
                                maxlength={maxLength}
                                value={collection}
                                oninput={(e) => changeCollectionText(e)}
                            />
                            <div class={`cm-note ${isValidCollection ? 'cm-note-valid' : 'cm-note-invalid'}`}>
                                {#if !isValidCollection}
                                    <div class="cm-error">* The collection already exists.</div>
                                {/if}
                                <div>{collection?.length || 0}/{maxLength}</div>
                            </div>
                        </div>
                    </div>
                    <div class="cm-row">
                        <div class="cm-field">
                            <label class="cm-label" for="provider">Embedding provider: </label>
                            <input
                                type="text"
                                id="provider"
                                class="cm-input"
                                maxlength={maxLength}
                                bind:value={provider}
                            />
                            <div class="cm-note cm-note-right">
                                {provider?.length || 0}/{maxLength}
                            </div>
                        </div>
                    </div>
                    <div class="cm-row">
                        <div class="cm-field">
                            <label class="cm-label" for="model">Embedding model: </label>
                            <input
                                type="text"
                                id="model"
                                class="cm-input"
                                maxlength={maxLength}
                                bind:value={model}
                            />
                            <div class="cm-note cm-note-right">
                                {model?.length || 0}/{maxLength}
                            </div>
                        </div>
                    </div>
                    <div class="cm-row">
                        <div class="cm-field">
                            <label class="cm-label" for="dimension">Vector dimension: </label>
                            <input
                                type="number"
                                id="dimension"
                                class="cm-input"
                                bind:value={dimension}
                                min={minDimension}
                                step={step}
                            />
                            <div class="cm-note">
                                * The value must be larger than 0.
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="cm-footer">
                <button
                    type="button"
                    class="cm-btn cm-btn-primary"
                    disabled={disableConfirmBtn}
                    onclick={(e) => handleConfirm(e)}
                >
                    Confirm
                </button>
                <button
                    type="button"
                    class="cm-btn cm-btn-secondary"
                    onclick={(e) => handleCancel(e)}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
<div class="cm-backdrop" transition:fade={{ duration: 150 }}></div>
{/if}

<style>
    /* ===== Modal overlay & dialog ===== */
    .cm-modal {
        position: fixed;
        inset: 0;
        z-index: 1055;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 1.75rem 0.5rem;
        overflow-x: hidden;
        overflow-y: auto;
        outline: 0;
    }
    .cm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1050;
        background-color: rgb(0 0 0);
        opacity: 0.5;
    }
    .cm-dialog {
        position: relative;
        width: 100%;
        margin: 0 auto;
        max-width: 500px;
        pointer-events: none;
    }
    .cm-dialog-sm { max-width: 300px; }
    .cm-dialog-md { max-width: 500px; }
    .cm-dialog-lg { max-width: 800px; }
    .cm-dialog-xl { max-width: 1140px; }
    .cm-content {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 3px rgb(15 23 42 / 0.1),
            0 20px 25px -5px rgb(15 23 42 / 0.15);
        pointer-events: auto;
    }

    /* ===== Header ===== */
    .cm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgb(243 244 246);
    }
    .cm-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
    .cm-close {
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
    .cm-close i {
        font-size: 1.25rem;
        line-height: 1;
    }
    .cm-close:hover {
        background-color: rgb(243 244 246);
        color: rgb(17 24 39);
    }

    /* ===== Body / Footer ===== */
    .cm-body {
        padding: 1rem 1.25rem;
    }
    .cm-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-top: 1px solid rgb(243 244 246);
    }

    /* ===== Form ===== */
    .cm-row {
        margin-bottom: 1rem;
    }
    .cm-row:last-child {
        margin-bottom: 0;
    }
    .cm-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }
    .cm-label {
        font-weight: 700;
        font-size: 0.875rem;
        color: rgb(55 65 81);
        margin: 0;
    }
    .cm-input {
        width: 100%;
        height: 2.25rem;
        padding: 0 0.625rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.875rem;
        color: rgb(17 24 39);
        text-align: center;
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .cm-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .cm-input-invalid {
        border-color: var(--color-danger);
    }
    .cm-note {
        margin-top: 0.125rem;
        display: flex;
        justify-content: space-between;
        font-size: 0.625rem;
        color: var(--color-muted);
        font-variant-numeric: tabular-nums;
    }
    .cm-note-valid {
        justify-content: flex-end;
    }
    .cm-note-invalid {
        justify-content: space-between;
    }
    .cm-note-right {
        justify-content: flex-end;
    }
    .cm-error {
        color: var(--color-danger);
    }

    /* ===== Buttons ===== */
    .cm-btn {
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
        transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .cm-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .cm-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .cm-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .cm-btn-secondary {
        background-color: rgb(255 255 255);
        border-color: rgb(229 231 235);
        color: rgb(55 65 81);
    }
    .cm-btn-secondary:hover:not(:disabled) {
        background-color: rgb(249 250 251);
        border-color: rgb(209 213 219);
    }

    /* ===== Dark mode ===== */
    :global(.dark) .cm-content {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .cm-header,
    :global(.dark) .cm-footer {
        border-color: rgb(55 65 81);
    }
    :global(.dark) .cm-title,
    :global(.dark) .cm-label {
        color: rgb(243 244 246);
    }
    :global(.dark) .cm-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .cm-input:focus {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .cm-btn-secondary {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .cm-btn-secondary:hover:not(:disabled) {
        background-color: rgb(75 85 99);
    }
    :global(.dark) .cm-close:hover {
        background-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
</style>
