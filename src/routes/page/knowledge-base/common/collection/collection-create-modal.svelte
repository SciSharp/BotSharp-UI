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
    class="ccm-modal"
    tabindex="-1"
    role="dialog"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
    onkeydown={(e) => { if (e.key === 'Escape') toggle(); }}
>
    <div class={`ccm-dialog ccm-dialog-${size} ${className}`} role="document">
        <div class="ccm-content">
            <div class="ccm-header">
                <h5 class="ccm-title">{title}</h5>
                <button type="button" class="ccm-close" aria-label="Close" onclick={() => toggle()}>
                    <i class="bx bx-x"></i>
                </button>
            </div>
            <div class="ccm-body">
                <form onsubmit={(e) => handleConfirm(e)}>
                    <div class="ccm-row">
                        <div class="ccm-field">
                            <label class="ccm-label" for="collection">Collection name: </label>
                            <input
                                type="text"
                                id="collection"
                                class={`ccm-input ${!isValidCollection ? 'ccm-input-invalid' : ''}`}
                                maxlength={maxLength}
                                value={collection}
                                oninput={(e) => changeCollectionText(e)}
                            />
                            <div class={`ccm-note ${isValidCollection ? 'ccm-note-valid' : 'ccm-note-invalid'}`}>
                                {#if !isValidCollection}
                                    <div class="ccm-error">* The collection already exists.</div>
                                {/if}
                                <div>{collection?.length || 0}/{maxLength}</div>
                            </div>
                        </div>
                    </div>
                    <div class="ccm-row">
                        <div class="ccm-field">
                            <label class="ccm-label" for="provider">Embedding provider: </label>
                            <input
                                type="text"
                                id="provider"
                                class="ccm-input"
                                maxlength={maxLength}
                                bind:value={provider}
                            />
                            <div class="ccm-note ccm-note-right">
                                {provider?.length || 0}/{maxLength}
                            </div>
                        </div>
                    </div>
                    <div class="ccm-row">
                        <div class="ccm-field">
                            <label class="ccm-label" for="model">Embedding model: </label>
                            <input
                                type="text"
                                id="model"
                                class="ccm-input"
                                maxlength={maxLength}
                                bind:value={model}
                            />
                            <div class="ccm-note ccm-note-right">
                                {model?.length || 0}/{maxLength}
                            </div>
                        </div>
                    </div>
                    <div class="ccm-row">
                        <div class="ccm-field">
                            <label class="ccm-label" for="dimension">Vector dimension: </label>
                            <input
                                type="number"
                                id="dimension"
                                class="ccm-input"
                                bind:value={dimension}
                                min={minDimension}
                                step={step}
                            />
                            <div class="ccm-note">
                                * The value must be larger than 0.
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="ccm-footer">
                <button
                    type="button"
                    class="ccm-btn ccm-btn-primary"
                    disabled={disableConfirmBtn}
                    onclick={(e) => handleConfirm(e)}
                >
                    Confirm
                </button>
                <button
                    type="button"
                    class="ccm-btn ccm-btn-secondary"
                    onclick={(e) => handleCancel(e)}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
<div class="ccm-backdrop" transition:fade={{ duration: 150 }}></div>
{/if}


