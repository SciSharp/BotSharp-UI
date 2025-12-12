<script>
    import { Button } from "@sveltestrap/sveltestrap";
    import { fly } from 'svelte/transition';
	import Loader from "$lib/common/Loader.svelte";
    import JSONTree from 'svelte-json-tree';
	import { formatObject, splitTextByCase } from "$lib/helpers/utils/common";

    /** @type {any} */
    export let item;

    /** @type {import('$commonTypes').TableItemConfig[]} */
    export let columns;

    /** @type {string | null} */
    export let detailKey = null;

    /** @type {boolean} */
    export let useJsonDisplay = false;

    /** @type {boolean} */
    export let open = false;

    let isLoading = false;
    let loadMore = false;

    $: {
        if (!open) {
            loadMore = false;
        }
    }

    function toggleDetail() {
        open = !open;
    }
</script>

{#if isLoading}
    <Loader />
{/if}

<tr in:fly={{ y: -5, duration: 800 }}>
    {#if columns?.length > 0}
    {#each columns as column, idx (idx)}
        <td style={`max-width: 50px; width: ${80 / columns.length}%;`}>
            <div class="ellipsis">{item[column.dataName] || ''}</div>
        </td>
    {/each}
    {/if}
    <td class="knowledge-op">
        <ul class="list-unstyled hstack gap-1 mb-0 knowledge-op-list">
            {#if detailKey}
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
                <Button
                    class="btn btn-sm btn-soft-primary"
                    on:click={() => toggleDetail()}
                >
                    {#if open}
                        <i class="bx bx-hide" />
                    {:else}
                        <i class="mdi mdi-eye-outline" />
                    {/if}
                </Button>
            </li>
            {/if}
        </ul>
    </td>
</tr>

{#if open}
    <tr in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
        <td colspan="12">
            <div class="knowledge-detail">
                <ul>
                    {#each columns as column, idx (idx)}
                    <li>
                        <div class="wrappable fw-bold text-primary">
                            {column.displayName || column.dataName}
                        </div>
                        <div class="wrappable">
                            {item[column.dataName] || ''}
                        </div>
                    </li>
                    {/each}
                </ul>
                <div class="more-detail">
                    <Button class='toggle-btn btn-sm' color="link" on:click={() => loadMore = !loadMore}>
                        {`${loadMore ? 'Less -' : 'More +'}`}
                    </Button>
                </div>
                {#if loadMore}
                    <ul
                        class="more-detail-list text-secondary"
                        in:fly={{ y: -5, duration: 300 }}
                        out:fly={{ y: -5, duration: 200 }}
                    >
                        {#if detailKey && item[detailKey]}
                            {#if useJsonDisplay}
                                <JSONTree
                                    value={formatObject(item[detailKey])}
                                    defaultExpandedLevel={1}
                                    --json-tree-number-color="var(--bs-info)"
                                    --json-tree-boolean-color="var(--bs-info)"
                                    --json-tree-string-color="var(--bs-info)"
                                />
                            {:else}
                                {#each Object.keys(item[detailKey]) as key, idx (idx)}
                                    <li class="more-detail-item wrappable">
                                        <span>{splitTextByCase(key)}: </span>
                                        <span>{item[detailKey][key]}</span>
                                    </li>
                                {/each}
                            {/if}
                        {/if}
                    </ul>
                {/if}
            </div>
        </td>
    </tr>
{/if}