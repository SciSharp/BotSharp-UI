<script>
    import { fly } from 'svelte/transition';
	import Loader from "$lib/common/spinners/Loader.svelte";
	import { formatObject, splitTextByCase } from "$lib/helpers/utils/common";
    import JSONTree from 'svelte-json-tree';

    /**
     * @type {{
     *   item: any,
     *   columns: import('$commonTypes').TableItemConfig[],
     *   useJsonDisplay?: boolean,
     *   open?: boolean
     * }}
     */
    let {
        item,
        columns,
        useJsonDisplay = false,
        open = $bindable(false)
    } = $props();

    let isLoading = $state(false);
    let loadMore = $state(false);

    $effect(() => {
        if (!open) {
            loadMore = false;
        }
    });

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
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
                <button
                    class="btn btn-sm btn-soft-primary"
                    onclick={() => toggleDetail()}
                >
                    {#if open}
                        <i class="bx bx-hide"></i>
                    {:else}
                        <i class="mdi mdi-eye-outline"></i>
                    {/if}
                </button>
            </li>
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
                    <button class="btn toggle-btn btn-sm btn-link" onclick={() => loadMore = !loadMore}>
                        {`${loadMore ? 'Less -' : 'More +'}`}
                    </button>
                </div>
                {#if loadMore}
                    <ul
                        class="more-detail-list text-secondary"
                        in:fly={{ y: -5, duration: 300 }}
                        out:fly={{ y: -5, duration: 200 }}
                    >
                        {#if useJsonDisplay}
                            <JSONTree
                                value={formatObject(item)}
                                defaultExpandedLevel={1}
                                --json-tree-number-color="var(--bs-info)"
                                --json-tree-boolean-color="var(--bs-info)"
                                --json-tree-string-color="var(--bs-info)"
                            />
                        {:else}
                            {#each Object.keys(item).filter(key => !columns.some(col => col.dataName === key)) as key, idx (idx)}
                                <li class="more-detail-item wrappable">
                                    <span>{splitTextByCase(key)}: </span>
                                    <span>{item[key]}</span>
                                </li>
                            {/each}
                        {/if}
                    </ul>
                {/if}
            </div>
        </td>
    </tr>
{/if}