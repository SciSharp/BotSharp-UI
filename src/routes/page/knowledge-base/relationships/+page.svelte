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

