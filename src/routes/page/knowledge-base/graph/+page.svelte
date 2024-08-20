<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import { Button } from '@sveltestrap/sveltestrap';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import { searchGraphKnowledge } from '$lib/services/knowledge-base-service';
    
	const maxLength = 4096;

    let showDemo = false;
    let isSearching = false;
    let searchDone = false;
    let text = '';
    let result = '';

    onMount(() => {
        showDemo = true;
    });

    function search() {
        searchDone = false;
		isSearching = true;
		searchGraphKnowledge(util.trim(text)).then(res => {
            result = res.result || '';
		}).catch(err => {
            result = 'Error!';
        }).finally(() => {
			isSearching = false;
            searchDone = true;
		});
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
</script>


<HeadTitle title="{$_('Graph Knowledge')}" />
<Breadcrumb pagetitle="{$_('Graph Knowledge')}" title="{$_('Knowledge Base')}"/>

<div class="d-xl-flex">
	<div class="w-100">
        {#if showDemo}
            <div
                in:fly={{ y: -10, duration: 500 }}
                out:fly={{ y: -10, duration: 200 }}
            >
                <div class="knowledge-search-container mb-4">
                    <textarea
                        class='form-control search-textarea'
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
                
                    <div class="mt-2 text-end">
                        <Button
                            color="primary"
                            disabled={!text || util.trim(text).length === 0 || isSearching}
                            on:click={() => search()}
                        >
                            {'Search'}
                        </Button>
                    </div>
                
                    {#if isSearching}
                        <div class="knowledge-loader mt-4">
                            <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
                        </div>
                    {:else if searchDone && !!result}
                        <div class="graph-searh-result-container mt-3">
                            <div class="text-primary fw-bold graph-result-header">
                                {'Answer:'}
                            </div>
                            <div class="graph-result-body mt-2">
                                {result}
                            </div>
                        </div>
                    {:else if searchDone && !result}
                        <div class="mt-3">
                            <h4 class="text-secondary">{"Ehhh, no idea..."}</h4>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>