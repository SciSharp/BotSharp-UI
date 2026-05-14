<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { _ } from 'svelte-i18n';
    import util from "lodash";
    import LoadingDots from '$lib/common/spinners/LoadingDots.svelte';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
    import { executeKnowledgeQuery } from '$lib/services/knowledge-base-service';
	import { KnowledgeBaseType } from '$lib/helpers/enums';

    const knowledgeType = KnowledgeBaseType.SemanticGraph;
    const maxLength = 4096;

    /** @type {boolean} */
    let showDemo = $state(false);
    /** @type {boolean} */
    let isSearching = $state(false);
    /** @type {boolean} */
    let searchDone = $state(false);
    /** @type {string} */
    let text = $state('');
    /** @type {string} */
    let result = $state('');

    onMount(() => {
        showDemo = true;
    });

    function search() {
        searchDone = false;
		isSearching = true;

        /** @type {import('$knowledgeTypes').KnowledgeQueryRequest} */
        const request = {
            text: util.trim(text)
        };

		executeKnowledgeQuery(knowledgeType, request, knowledgeType).then(res => {
            const results = res || [];
            result = JSON.stringify(results);
		}).catch(() => {
            result = 'Error!';
        }).finally(() => {
			isSearching = false;
            searchDone = true;
		});
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
</script>


<HeadTitle title={$_('Relation Knowledge')} />
<Breadcrumb pagetitle={$_('Relation Knowledge')} title={$_('Knowledge Base')}/>

<div class="rel-page">
	<div class="rel-page-col">
        {#if showDemo}
            <div
                in:fly={{ y: -10, duration: 500 }}
                out:fly={{ y: -10, duration: 200 }}
            >
                <div class="rel-search-card">
                    <textarea
                        class="rel-textarea"
                        rows={5}
                        maxlength={maxLength}
                        disabled={isSearching}
                        placeholder={'Start searching here...'}
                        bind:value={text}
                        onkeydown={(e) => pressKey(e)}
                    ></textarea>
                    <div class="rel-meta-row">
                        <span class="rel-meta-count">{text?.length || 0}/{maxLength}</span>
                    </div>

                    <div class="rel-search-footer">
                        <button
                            type="button"
                            class="rel-btn rel-btn-primary"
                            disabled={!text || util.trim(text).length === 0 || isSearching}
                            onclick={() => search()}
                        >
                            <span>{'Search'}</span>
                        </button>
                    </div>

                    {#if isSearching}
                        <div class="rel-loader">
                            <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--color-primary)'} />
                        </div>
                    {:else if searchDone && !!result}
                        <div class="rel-result-container">
                            <div class="rel-result-header">
                                {'Answer:'}
                            </div>
                            <div class="rel-result-body">
                                {result}
                            </div>
                        </div>
                    {:else if searchDone && !result}
                        <div class="rel-empty">
                            <h4>{"Ehhh, no idea..."}</h4>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    /* ===== Layout ===== */
    .rel-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .rel-page-col {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
    }

    /* ===== Search card ===== */
    .rel-search-card {
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
    .rel-search-card::before {
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
    .rel-textarea {
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
    .rel-textarea::placeholder {
        color: var(--color-muted);
        opacity: 1;
    }
    .rel-textarea:hover:not(:focus):not(:disabled) {
        border-color: rgb(209 213 219);
    }
    .rel-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .rel-textarea:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    /* ===== Meta row (character count) ===== */
    .rel-meta-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.6875rem;
        color: var(--color-muted);
    }
    .rel-meta-count {
        font-variant-numeric: tabular-nums;
    }

    /* ===== Button ===== */
    .rel-search-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.25rem;
    }
    .rel-btn {
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
    .rel-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .rel-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .rel-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .rel-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.08),
            0 4px 12px -4px color-mix(in srgb, var(--color-primary) 45%, transparent);
    }
    .rel-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }

    /* ===== Loader ===== */
    .rel-loader {
        display: flex;
        justify-content: center;
        padding: 1.5rem 0 0.5rem;
    }

    /* ===== Result ===== */
    .rel-result-container {
        margin-top: 0.5rem;
        padding: 0.875rem 1rem;
        border-radius: 0.625rem;
        background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .rel-result-header {
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--color-primary);
    }
    .rel-result-body {
        font-size: 0.9375rem;
        color: rgb(31 41 55);
        word-break: break-word;
        white-space: pre-wrap;
    }

    /* ===== Empty state ===== */
    .rel-empty {
        display: flex;
        justify-content: center;
        padding: 1.5rem 1rem 0.5rem;
    }
    .rel-empty h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-muted);
    }

    /* ===== Dark mode ===== */
    :global(.dark) .rel-search-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .rel-textarea {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(243 244 246);
    }
    :global(.dark) .rel-textarea:focus {
        background-color: rgb(31 41 55);
    }
    :global(.dark) .rel-result-body {
        color: rgb(229 231 235);
    }

</style>