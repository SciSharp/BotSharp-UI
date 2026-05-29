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


